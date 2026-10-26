"""FAO-56 Eq. 6 grass reference ET from measured/derived daily terms."""
from math import isfinite


def reference_et_mm_day(delta_kpa_c, net_radiation_mj_m2_day,
                        soil_heat_flux_mj_m2_day, gamma_kpa_c,
                        mean_air_temp_c, wind_2m_m_s, es_kpa, ea_kpa):
    values = (delta_kpa_c, net_radiation_mj_m2_day, soil_heat_flux_mj_m2_day,
              gamma_kpa_c, mean_air_temp_c, wind_2m_m_s, es_kpa, ea_kpa)
    if not all(isfinite(v) for v in values):
        raise ValueError("Nonfinite input")
    if delta_kpa_c <= 0 or gamma_kpa_c <= 0 or mean_air_temp_c <= -273 or wind_2m_m_s < 0:
        raise ValueError("Invalid FAO-56 meteorological parameter")
    if es_kpa < ea_kpa or ea_kpa < 0:
        raise ValueError("Invalid vapor pressure deficit")
    numerator = (0.408 * delta_kpa_c * (net_radiation_mj_m2_day - soil_heat_flux_mj_m2_day)
                 + gamma_kpa_c * (900 / (mean_air_temp_c + 273))
                 * wind_2m_m_s * (es_kpa - ea_kpa))
    denominator = delta_kpa_c + gamma_kpa_c * (1 + 0.34 * wind_2m_m_s)
    return numerator / denominator
