"""Compare a NASA POWER daily raw response with independent station observations.

The station CSV MUST contain date (YYYY-MM-DD), tmean_c, precip_mm;
optional solar_kwh_m2_day. All fields are station observations or independently
derived measurements with documented provenance, not synthetic fixtures.
This script never downloads or invents station measurements.
"""
import argparse
import csv
import hashlib
import json
import math
from datetime import datetime, timezone
from pathlib import Path

VARIABLES = {"tmean_c": "T2M", "precip_mm": "PRECTOTCORR", "solar_kwh_m2_day": "ALLSKY_SFC_SW_DWN"}
def finite(x):
    try:
        v=float(x)
        return v if math.isfinite(v) and v > -900 else None
    except (TypeError, ValueError):
        return None

def metrics(pairs):
    if not pairs:
        return {"n":0,"bias":None,"mae":None,"rmse":None}
    errors=[a-b for a,b in pairs]  # POWER minus station
    return {"n":len(errors),"bias":sum(errors)/len(errors),
            "mae":sum(abs(e) for e in errors)/len(errors),
            "rmse":math.sqrt(sum(e*e for e in errors)/len(errors))}

def compare(raw_power:Path, station_csv:Path, metadata:dict):
    required=("station_id","station_name","latitude","longitude","provider",
              "source_url","retrieved_utc","timezone","variable_methods")
    missing=[k for k in required if not metadata.get(k)]
    if missing:
        raise ValueError("Station provenance fields required: "+", ".join(missing))
    raw=raw_power.read_bytes()
    power=json.loads(raw)["properties"]["parameter"]
    rows=list(csv.DictReader(station_csv.open(newline="",encoding="utf-8")))
    if not rows or not {"date","tmean_c","precip_mm"}.issubset(rows[0]):
        raise ValueError("Station CSV requires date,tmean_c,precip_mm")
    unique=set()
    pairs={k:[] for k in VARIABLES}
    omitted={k:0 for k in VARIABLES}
    for row in rows:
        date=datetime.strptime(row["date"],"%Y-%m-%d").strftime("%Y%m%d")
        if date in unique: raise ValueError("Duplicate station date "+date)
        unique.add(date)
        for col,field in VARIABLES.items():
            if col not in row or field not in power: continue
            station=finite(row[col])
            grid=finite(power[field].get(date))
            if station is None or grid is None:
                omitted[col]+=1
                continue
            if col=="precip_mm" and (station<0 or grid<0): raise ValueError("Negative precipitation")
            pairs[col].append((grid,station))
    result={"classification":"independent gridded-product versus station comparison; NOT PV model validation",
            "station":metadata,"power_raw_sha256":hashlib.sha256(raw).hexdigest(),
            "station_csv_sha256":hashlib.sha256(station_csv.read_bytes()).hexdigest(),
            "generated_utc":datetime.now(timezone.utc).isoformat(),
            "station_rows":len(rows),"variables":{}}
    for col,p in pairs.items():
        result["variables"][col]={"metrics":metrics(p),"omitted_rows":omitted[col],
                                   "units":{"tmean_c":"degC","precip_mm":"mm/day",
                                            "solar_kwh_m2_day":"kWh/m2/day"}[col]}
    return result

if __name__=="__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("--power",required=True,type=Path)
    ap.add_argument("--station",required=True,type=Path)
    ap.add_argument("--metadata",required=True,type=Path)
    ap.add_argument("--output",required=True,type=Path)
    args=ap.parse_args()
    report=compare(args.power,args.station,json.loads(args.metadata.read_text()))
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,indent=2,sort_keys=True)+"\n")
    print(json.dumps({k:v["metrics"] for k,v in report["variables"].items()},indent=2))
