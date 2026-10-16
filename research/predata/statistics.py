"""Statistical diagnostics and seeded Monte Carlo for software verification only."""
import math
import random

def metrics(observed, predicted):
    obs, pred = list(observed), list(predicted)
    if not obs or len(obs) != len(pred) or not all(math.isfinite(v) for v in obs + pred):
        raise ValueError("Matched, nonempty finite vectors required")
    errors = [p-o for o,p in zip(obs,pred)]
    n=len(errors)
    return {"n":n,"mae":sum(map(abs,errors))/n,
            "rmse":math.sqrt(sum(e*e for e in errors)/n),
            "bias":sum(errors)/n}

def monte_carlo_pump(volume_m3, head_m, efficiency_min, efficiency_max, n=1000, seed=42):
    from .physics import pump_energy_kwh
    if not (0 < efficiency_min <= efficiency_max <= 1 and 1 <= n <= 100000):
        raise ValueError("Invalid simulation settings")
    rng=random.Random(seed)
    draws=sorted(pump_energy_kwh(volume_m3,head_m,rng.uniform(efficiency_min,efficiency_max))
                 for _ in range(n))
    return {"median_kwh":draws[n//2],"p05_kwh":draws[int((n-1)*0.05)],
            "p95_kwh":draws[int((n-1)*0.95)],"n":n,
            "interpretation":"assumption-based sensitivity interval; not calibrated predictive coverage"}
