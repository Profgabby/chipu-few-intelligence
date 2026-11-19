"""Notebook-derived Moller-Trumbore ground shading (CHIPU cells 27, 34).

The ray intersection kernel follows the user's pvlib Colab notebook.
Geometry and sun vectors are explicit arguments, not notebook globals.
"""
import numpy as np

def ray_triangle_intersection(origin, direction, triangle, epsilon=1e-9):
    v0, v1, v2 = np.asarray(triangle, dtype=float)
    origin = np.asarray(origin, dtype=float)
    direction = np.asarray(direction, dtype=float)
    edge1 = v1 - v0
    edge2 = v2 - v0
    h = np.cross(direction, edge2)
    determinant = np.dot(edge1, h)
    if abs(determinant) < epsilon:
        return None
    inv_det = 1.0 / determinant
    s = origin - v0
    u = inv_det * np.dot(s, h)
    if u < -epsilon or u > 1.0 + epsilon:
        return None
    q = np.cross(s, edge1)
    v = inv_det * np.dot(direction, q)
    if v < -epsilon or u + v > 1.0 + epsilon:
        return None
    t = inv_det * np.dot(edge2, q)
    return float(t) if t > epsilon else None

def trace_ground_shadows(origins, direction, triangles):
    """Cell 34 vectorized Moller-Trumbore kernel, with explicit inputs."""
    origins = np.asarray(origins, dtype=float)
    direction = np.asarray(direction, dtype=float)
    triangles = np.asarray(triangles, dtype=float)
    if origins.ndim != 2 or origins.shape[1] != 3:
        raise ValueError("origins must have shape (N,3)")
    if triangles.ndim != 3 or triangles.shape[1:] != (3,3):
        raise ValueError("triangles must have shape (M,3,3)")
    if direction.shape != (3,) or not np.all(np.isfinite(direction)):
        raise ValueError("direction must be a finite 3D vector")
    shaded = np.zeros(len(origins), dtype=bool)
    eps = 1e-9
    for tri in triangles:
        active = np.flatnonzero(~shaded)
        if active.size == 0:
            break
        v0, v1, v2 = tri
        e1 = v1 - v0
        e2 = v2 - v0
        h = np.cross(direction, e2)
        det = np.dot(e1, h)
        if abs(det) < eps:
            continue
        inv_det = 1.0 / det
        s = origins[active] - v0
        u = (s @ h) * inv_det
        q = np.cross(s, e1)
        v = (q @ direction) * inv_det
        t = (q @ e2) * inv_det
        hits = ((u >= -eps) & (v >= -eps) & (u + v <= 1 + eps) & (t > eps))
        shaded[active[hits]] = True
    return shaded

def sun_vector(elevation_deg, azimuth_deg):
    """East, North, Up unit vector; azimuth clockwise from North."""
    elevation = np.radians(elevation_deg)
    azimuth = np.radians(azimuth_deg)
    return np.array([np.cos(elevation)*np.sin(azimuth),
                     np.cos(elevation)*np.cos(azimuth), np.sin(elevation)])

def build_array_triangles(geometry):
    """Fixed-tilt panels, with row normal aligned to facing azimuth."""
    geometry.validate()
    facing = np.radians(geometry.azimuth_deg)
    tilt = np.radians(geometry.tilt_deg)
    uphill = np.array([-np.sin(facing)*np.cos(tilt),
                       -np.cos(facing)*np.cos(tilt), np.sin(tilt)])
    across = np.array([np.cos(facing), -np.sin(facing), 0.0])
    triangles = []
    for row in range(geometry.number_of_rows):
        for col in range(geometry.modules_per_row):
            lower_center = np.array([0.0, row*geometry.row_pitch_m,
                                     geometry.module_clearance_m])
            lower_center += (col-(geometry.modules_per_row-1)/2)*geometry.module_width_m*across
            half = 0.5*geometry.module_width_m*across
            v0 = lower_center-half
            v1 = lower_center+half
            v2 = v1+geometry.module_length_m*uphill
            v3 = v0+geometry.module_length_m*uphill
            triangles.extend([[v0,v1,v2],[v0,v2,v3]])
    return np.asarray(triangles)

def raytraced_transmission(geometry, forcing, *, grid_spacing_m=0.25):
    """Ground-grid direct shade and global transmission at specified sun position.

    Representative sun position only; daily integration requires time series.
    Diffuse irradiance is not obstructed here; use SVF separately.
    """
    if not 0 < grid_spacing_m <= 5:
        raise ValueError("Invalid ground-grid spacing")
    if not 0 <= forcing.diffuse_fraction <= 1:
        raise ValueError("Invalid diffuse fraction")
    if not 0 <= forcing.solar_zenith_deg <= 180:
        raise ValueError("Invalid zenith")
    if forcing.solar_zenith_deg >= 90:
        return {"shade_fraction":0.0,"beam_transmission":1.0,"global_transmission":1.0}
    triangles = build_array_triangles(geometry)
    extent_x = (geometry.modules_per_row+2)*geometry.module_width_m
    extent_y = (geometry.number_of_rows+1)*geometry.row_pitch_m
    x = np.arange(-extent_x/2, extent_x/2, grid_spacing_m)
    y = np.arange(-geometry.row_pitch_m/2, extent_y, grid_spacing_m)
    xx, yy = np.meshgrid(x,y)
    points = np.column_stack([xx.ravel(),yy.ravel(),np.zeros(xx.size)])
    direction = sun_vector(90-forcing.solar_zenith_deg, forcing.solar_azimuth_deg)
    shaded = trace_ground_shadows(points,direction,triangles)
    fraction = float(np.mean(shaded))
    beam = 1-fraction
    return {"shade_fraction":fraction,"beam_transmission":beam,
            "global_transmission":forcing.diffuse_fraction+(1-forcing.diffuse_fraction)*beam,
            "grid_spacing_m":grid_spacing_m,"ground_cells":len(points)}
