"""Download immutable NASA POWER daily meteorology for two Oregon reference areas.

POWER is a gridded/satellite/reanalysis product, not station measurements.
This script makes real HTTPS requests; no fallback or synthetic substitutions.
"""
import argparse
import hashlib
import json
import math
from datetime import date, timedelta, datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

POINTS = {
    "central_oregon_madras": (44.63, -121.13),
    "willamette_aurora": (45.22, -122.75),
}
PARAMETERS = ["T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR", "RH2M", "WS2M", "ALLSKY_SFC_SW_DWN"]
UNITS = {"T2M": "degC", "T2M_MAX": "degC", "T2M_MIN": "degC", "PRECTOTCORR": "mm/day", "RH2M": "percent", "WS2M": "m/s", "ALLSKY_SFC_SW_DWN": "MJ/m2/day"}
BASE = "https://power.larc.nasa.gov/api/temporal/daily/point"

def request_url(lat, lon, year):
    return BASE + "?" + urlencode({"parameters": ",".join(PARAMETERS), "community": "AG",
        "longitude": lon, "latitude": lat, "start": f"{year}0101", "end": f"{year}1231", "format": "JSON"})

def process(raw, year):
    data = json.loads(raw)
    if data.get("messages"):
        raise ValueError("NASA POWER messages: " + repr(data["messages"]))
    if data.get("parameters", {}).get("ALLSKY_SFC_SW_DWN", {}).get("units") != "MJ/m^2/day":\n        raise ValueError("Unexpected NASA POWER solar radiation unit")\n    series = data["properties"]["parameter"]
    expected = [(date(year, 1, 1) + timedelta(days=i)).strftime("%Y%m%d") for i in range((date(year+1,1,1)-date(year,1,1)).days)]
    result = {}
    flags = []
    for key in PARAMETERS:
        values = series[key]
        if set(values) != set(expected):
            raise ValueError(f"{key}: date coverage mismatch ({len(values)} vs {len(expected)})")
        missing = sum(v is None or not isinstance(v,(int,float)) or not math.isfinite(v) or v <= -900 for v in values.values())
        valid = [v for v in values.values() if isinstance(v,(int,float)) and math.isfinite(v) and v > -900]
        bounds = {"RH2M": (0,100), "PRECTOTCORR": (0,1000), "WS2M": (0,100), "ALLSKY_SFC_SW_DWN": (0,45), "T2M": (-90,65), "T2M_MAX": (-90,65), "T2M_MIN": (-90,65)}
        low, high = bounds[key]
        outliers = [{"date": day, "value": value, "bounds": [low, high]} for day, value in values.items() if isinstance(value, (int,float)) and math.isfinite(value) and value > -900 and not low <= value <= high]
        out_of_range = len(outliers)
        flags.extend({"parameter": key, **item} for item in outliers)
        result[key] = {"unit": UNITS[key], "total_days": len(expected), "missing_days": missing,
                       "out_of_range_days": out_of_range, "min": min(valid) if valid else None,
                       "max": max(valid) if valid else None}
    return {"header": data.get("header", {}), "parameters": result, "days": len(expected),
            "quality_flags": flags, "status": "review_required" if flags or any(v["missing_days"] for v in result.values()) else "preliminary_qc_pass_not_model_approved"}

def run(outdir, year):
    outdir.mkdir(parents=True, exist_ok=True)
    manifest = {"dataset": "NASA POWER daily point", "data_class": "gridded estimates; NOT field observations",
                "retrieved_utc": datetime.now(timezone.utc).isoformat(), "year": year, "locations": {}}
    for site,(lat,lon) in POINTS.items():
        url = request_url(lat,lon,year)
        with urlopen(Request(url, headers={"User-Agent": "CHIPU-FEW-Oregon-Research/0.1"}), timeout=90) as response:
            raw = response.read()
        name = f"{site}_{year}_nasa_power_raw.json"
        (outdir/name).write_bytes(raw)
        try:
            summary = process(raw, year)
        except Exception as exc:
            summary = {"status": "processing_error", "error": str(exc), "quality_flags": []}
        manifest["locations"][site] = {"requested_latitude": lat, "requested_longitude": lon,
          "request_url": url, "raw_file": name, "sha256": hashlib.sha256(raw).hexdigest(), "qc": summary}
    (outdir/"manifest.json").write_text(json.dumps(manifest,indent=2,sort_keys=True)+"\n")
    print(json.dumps({k: {"sha256":v["sha256"], "status":v["qc"]["status"],
        "flags":v["qc"].get("quality_flags", [])[:20],
        "flag_count":len(v["qc"].get("quality_flags", []))}
        for k,v in manifest["locations"].items()},indent=2))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--year",type=int,default=2024)
    parser.add_argument("--outdir",type=Path,default=Path("results/oregon-weather"))
    args = parser.parse_args()
    if not 1981 <= args.year <= date.today().year-1:
        parser.error("Choose a completed year from 1981 to last year")
    run(args.outdir,args.year)
