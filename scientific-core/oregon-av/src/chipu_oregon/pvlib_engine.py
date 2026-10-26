"""Optional pvlib PVWatts DC integration; no inverter/AC model or field validation."""
def calculate_pv_dc(weather, latitude, longitude, tilt_deg, azimuth_deg,
                    pdc0_w, gamma_pdc_per_c=-0.004, albedo=0.2):
    import pandas as pd
    import pvlib
    if not isinstance(weather.index, pd.DatetimeIndex) or weather.index.tz is None:
        raise ValueError("Timezone-aware DatetimeIndex required")
    if not weather.index.is_monotonic_increasing or weather.index.has_duplicates:
        raise ValueError("Weather timestamps must be ordered and unique")
    for name in ("ghi", "dni", "dhi", "temp_air", "wind_speed"):
        if name not in weather or weather[name].isna().any():
            raise ValueError("Missing or NaN weather variable: " + name)
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180
            and 0 <= tilt_deg <= 90 and 0 <= azimuth_deg < 360
            and pdc0_w > 0 and 0 <= albedo <= 1):
        raise ValueError("Invalid site or PV parameters")
    solar = pvlib.solarposition.get_solarposition(weather.index, latitude, longitude)
    poa = pvlib.irradiance.get_total_irradiance(
        surface_tilt=tilt_deg, surface_azimuth=azimuth_deg,
        solar_zenith=solar["apparent_zenith"], solar_azimuth=solar["azimuth"],
        dni=weather["dni"], ghi=weather["ghi"], dhi=weather["dhi"],
        albedo=albedo, model="isotropic")
    params = pvlib.temperature.TEMPERATURE_MODEL_PARAMETERS["sapm"]["open_rack_glass_glass"]
    temp = pvlib.temperature.sapm_cell(poa["poa_global"].clip(lower=0),
                                      weather["temp_air"], weather["wind_speed"], **params)
    dc = pvlib.pvsystem.pvwatts_dc(poa["poa_global"].clip(lower=0), temp,
                                  pdc0_w, gamma_pdc_per_c)
    return pd.DataFrame({"poa_global_w_m2": poa["poa_global"],
                         "cell_temperature_c": temp, "dc_power_w": dc.clip(lower=0)})
