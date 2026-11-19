"""Time-resolved ground irradiance and cosine-weighted sky-view factors.

Extracted from CHIPU notebook Lessons 9C and 9D (cells 34, 36, 37, 41).
Explicit time, geometry and forcing arguments replace Colab global variables.
"""
from __future__ import annotations
import numpy as np
from .notebook_raytracing import build_array_triangles, trace_ground_shadows, sun_vector

def sky_directions(n_mu: int = 8, n_az: int = 24) -> np.ndarray:
    if n_mu < 1 or n_az < 1:
        raise ValueError("Positive angular resolution required")
    mu = (np.arange(n_mu) + .5) / n_mu
    azimuths = (np.arange(n_az) + .5) * 2 * np.pi / n_az
    directions = []
    for m in mu:
        elevation = np.arcsin(np.sqrt(m))
        for az in azimuths:
            directions.append([np.cos(elevation)*np.sin(az),
                               np.cos(elevation)*np.cos(az), np.sin(elevation)])
    return np.asarray(directions, dtype=float)

def ground_grid(geometry, spacing_m: float = .4):
    geometry.validate()
    if not 0 < spacing_m <= 5:
        raise ValueError("Grid spacing must be within (0,5] m")
    vertices = build_array_triangles(geometry).reshape(-1,3)
    margin = geometry.row_pitch_m
    x = np.arange(vertices[:,0].min()-margin, vertices[:,0].max()+margin, spacing_m)
    y = np.arange(vertices[:,1].min()-margin, vertices[:,1].max()+margin, spacing_m)
    xx, yy = np.meshgrid(x,y)
    return np.column_stack([xx.ravel(), yy.ravel(), np.zeros(xx.size)])

def sky_view_factor(points, triangles, n_mu: int = 8, n_az: int = 24):
    """Isotropic horizontal diffuse irradiance visibility, using equal-weight mu bins."""
    directions = sky_directions(n_mu,n_az)
    visible = np.zeros(len(points),dtype=float)
    for direction in directions:
        visible += ~trace_ground_shadows(points,direction,triangles)
    return visible / len(directions)

def integrate_ground_radiation(geometry, records, *, grid_spacing_m=.4,
                               n_mu=8, n_az=24):
    """Integrate time-step irradiance (W/m²) over explicit interval durations.

    records: dicts with solar_elevation_deg, solar_azimuth_deg, dni_w_m2,
    dhi_w_m2, ghi_w_m2, interval_hours. Interval-center solar position.
    No inferred or silently interpolated timestamps.
    """
    triangles = build_array_triangles(geometry)
    points = ground_grid(geometry,grid_spacing_m)
    svf = sky_view_factor(points,triangles,n_mu,n_az)
    av_energy = np.zeros(len(points),dtype=float)
    open_energy = 0.0
    direct_open = diffuse_open = 0.0
    steps = []
    if not records:
        raise ValueError("At least one irradiance interval required")
    for record in records:
        elevation = float(record["solar_elevation_deg"])
        azimuth = float(record["solar_azimuth_deg"])
        dni = float(record["dni_w_m2"])
        dhi = float(record["dhi_w_m2"])
        ghi = float(record["ghi_w_m2"])
        dt = float(record["interval_hours"])
        values = np.array([elevation,azimuth,dni,dhi,ghi,dt])
        if not np.isfinite(values).all() or min(dni,dhi,ghi) < 0 or dt <= 0:
            raise ValueError("Invalid irradiance interval")
        direct = dni*max(0.0,np.sin(np.radians(elevation)))
        if not np.isclose(ghi,direct+dhi,rtol=.02,atol=10):
            raise ValueError("GHI does not close against DNI*cos(zenith)+DHI")
        if elevation > 0 and direct > 0:
            shaded = trace_ground_shadows(points,sun_vector(elevation,azimuth),triangles)
        else:
            shaded = np.zeros(len(points),dtype=bool)
        av_energy += (direct*(~shaded) + dhi*svf)*dt/1000
        open_energy += (direct+dhi)*dt/1000
        direct_open += direct*dt/1000
        diffuse_open += dhi*dt/1000
        steps.append({"solar_elevation_deg":elevation,"solar_azimuth_deg":azimuth,
                      "shade_fraction":float(shaded.mean()),"interval_hours":dt,
                      "open_ghi_w_m2":ghi})
    return {"ground_cells":len(points),"sky_view_factor_mean":float(svf.mean()),
            "sky_view_factor_min":float(svf.min()),
            "ground_av_kwh_m2_mean":float(av_energy.mean()),
            "ground_open_kwh_m2":float(open_energy),
            "ground_reduction_fraction":float(1-av_energy.mean()/open_energy) if open_energy else 0.0,
            "direct_open_kwh_m2":float(direct_open),
            "diffuse_open_kwh_m2":float(diffuse_open),
            "steps":steps,"method":"time_resolved_direct_raytracing_cosine_weighted_isotropic_svf"}
