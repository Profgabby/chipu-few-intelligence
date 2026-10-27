"""Download immutable NASA POWER daily meteorology for two Oregon reference areas.

POWER is a gridded/satellite/reanalysis product, not station measurements.
This script makes real HTTPS requests; no fallback or synthetic substitutions.
"""
import argparse
import hashlib
import json
from datetime import date, timedelta, datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

POINTS = {
    "central_oregon_madras": (44.63, -121.13),
    "willamette_aurora": (45.22, -122.75),
}
PARAMETERS = ["T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR", "RH2M", "WS2M", "ALLSKY_SFC_SW_DWN"]
UNITS = {"T2M": "degC", "T2M_MAX": "degC", "T2M_MIN": "degC", "PRECTOTCORR": "mm/day", "RH2M": "percent", "WS2M": "m/s", "ALLSKY_SFC_SW_DWN": "kWh/m2/day"}
BASE = "https://power.larc.nasa.gov/api/temporal/daily/point"

def request_url(lat, lon, year):
    return BASE + "?" + urlencode({"parameters": ",".join(PARAMETERS), "community": "AG",
        "longitude": lon, "latitude": lat, "start": f"{year}0101", "end": f"{year}1231", "format": "JSON"})

def process(raw, year):
    data = json.loads(raw)
    if data.get("messages"):
        raise ValueError("NASA POWER messages: " + repr(data["messages"]))
    series = data["properties"]["parameter"]
    expected = [(date(year, 1, 1) + timedelta(days=i)).strftime("%Y%m%d") for i in range((date(year+1,1,1)-date(year,1,1)).days)]
    result = {}
    for key in PARAMETERS:
        values = series[key]
        if set(values) != set(expected):
            raise ValueError(f"{key}: date coverage mismatch ({len(values)} vs {len(expected)})")
        missing = sum(v is None or not isinstance(v,(int,float)) or v <= -900 for v in values.values())
        valid = [v for v in values.values() if isinstance(v,(int,float)) and v > -900]
        bounds = {"RH2M": (0,100), "PRECTOTCORR": (0,1000), "WS2M": (0,100), "ALLSKY_SFC_SW_DWN": (0,20), "T2M": (-90,65), "T2M_MAX": (-90,65), "T2M_MIN": (-90,65)}
        low, high = bounds[key]
        out_of_range = sum(not low <= v <= high for v in valid)
        result[key] = {"unit": UNITS[key], "total_days": len(expected), "missing_days": missing,
                       "out_of_range_days": out_of_range, "min": min(valid) if valid else None,
                       "max": max(valid) if valid else None}
    if any(v["out_of_range_days"] for v in result.values()):
        raise ValueError("Physically implausible values detected")
    return {"header": data.get("header", {}), "parameters": result, "days": len(expected)}

def run(outdir, year):
    outdir.mkdir(parents=True, exist_ok=True)
    manifest = {"dataset": "NASA POWER daily point", "data_class": "gridded estimates; NOT field observations",
                "retrieved_utc": datetime.now(timezone.utc).isoformat(), "year": year, "locations": {}}
    for site,(lat,lon) in POINTS.items():
        url = request_url(lat,lon,year)
        with urlopen(Request(url, headers={"User-Agent": "CHIPU-FEW-Oregon-Research/0.1"}), timeout=90) as response:
            raw = response.read()
        summary = process(raw, year)
        name = f"{site}_{year}_nasa_power_raw.json"
        (outdir/name).write_bytes(raw)
        manifest["locations"][site] = {"requested_latitude": lat, "requested_longitude": lon,
          "request_url": url, "raw_file": name, "sha256": hashlib.sha256(raw).hexdigest(), "qc": summary}
    (outdir/"manifest.json").write_text(json.dumps(manifest,indent=2,sort_keys=True)+"\n")
    print(json.dumps({k: {"sha256":v["sha256"], "days":v["qc"]["days"],
        "missing": {p:d["missing_days"] for p,d in v["qc"]["parameters"].items()}}
        for k,v in manifest["locations"].items()},indent=2))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--year",type=int,default=2024)
    parser.add_argument("--outdir",type=Path,default=Path("results/oregon-weather"))
    args = parser.parse_args()
    if not 1981 <= args.year <= date.today().year-1:
        parser.error("Choose a completed year from 1981 to last year")
    run(args.outdir,args.year)
