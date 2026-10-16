"""Deterministic synthetic software-test cases; never represent field observations."""
import random
from .physics import water_step

def generate_bucket_cases(days=120,seed=42):
    if not 6<=days<=10000: raise ValueError("days outside supported range")
    rng=random.Random(seed); storage=55.
    rows=[]
    for day in range(days):
        precipitation=round(rng.uniform(0,12) if rng.random()<0.25 else 0.,3)
        irrigation=10. if storage<30 else 0.
        et=round(rng.uniform(2,6),3)
        result=water_step(storage,precipitation,irrigation,et,100.)
        rows.append({"day":day,"storage_start_mm":storage,"precipitation_mm":precipitation,
                     "irrigation_mm":irrigation,"et_demand_mm":et,
                     "storage_end_mm":result.storage_mm,"drainage_mm":result.drainage_mm,
                     "mass_balance_residual_mm":result.residual_mm,
                     "source_type":"SYNTHETIC","model_version":"BUCKET-0.1.0"})
        storage=result.storage_mm
    return rows
