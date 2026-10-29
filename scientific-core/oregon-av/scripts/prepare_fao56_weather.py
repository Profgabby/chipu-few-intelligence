"""Convert the 2024 paired POWER/AgriMet daily comparison to FAO-56 inputs.

Never blend station and gridded columns. Retain source checksum, provenance,
and flags. Output may be processed by fao56_daily_et0.py only after station
elevation and 2-m wind height are independently verified.
"""
import argparse
import csv
import hashlib
import json
import math
from pathlib import Path

VARIABLES=("tmin_c","tmax_c","tmean_c","rh_pct","wind_m_s","solar_kwh_m2_day")
def prepare(source_path,out_path,source):
    if source not in ("station","power"):raise ValueError("Unknown source")
    with source_path.open(newline="",encoding="utf-8") as f:
        reader=csv.DictReader(f)
        expected={"date"}|{f"{key}_{source}" for key in VARIABLES}
        if not reader.fieldnames or not expected.issubset(reader.fieldnames):
            raise ValueError("Paired dataset missing required source columns")
        rows=list(reader)
    if len({r["date"] for r in rows})!=len(rows):
        raise ValueError("Duplicate dates")
    prepared=[];flags=[]
    for r in rows:
        row={"date":r["date"]}
        for key in VARIABLES:
            raw=r[f"{key}_{source}"]
            try:
                value=float(raw)
                if not math.isfinite(value) or value<=-900:raise ValueError()
                row[key]=value
            except ValueError:
                row[key]=""
                flags.append({"date":r["date"],"field":key,"reason":"missing_or_invalid"})
        prepared.append(row)
    out_path.parent.mkdir(parents=True,exist_ok=True)
    with out_path.open("w",newline="",encoding="utf-8") as f:
        writer=csv.DictWriter(f,fieldnames=["date",*VARIABLES])
        writer.writeheader();writer.writerows(prepared)
    report={"source":source,"classification":"station observations" if source=="station" else "gridded estimates",
      "input_sha256":hashlib.sha256(source_path.read_bytes()).hexdigest(),
      "output_sha256":hashlib.sha256(out_path.read_bytes()).hexdigest(),
      "days":len(rows),"flags":flags,
      "status":"review_required" if flags else "prepared_not_model_approved",
      "notes":["Wind measurement height and site elevation require independent metadata.",
               "RHmean used as an approximation for actual vapor pressure in FAO-56.",
               "No missing values are imputed; gridded and station sources are not mixed."]}
    out_path.with_suffix(".provenance.json").write_text(json.dumps(report,indent=2)+"\n")
    return report
if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--paired",required=True,type=Path)
    p.add_argument("--source",required=True,choices=["station","power"])
    p.add_argument("--output",required=True,type=Path)
    a=p.parse_args()
    report=prepare(a.paired,a.output,a.source)
    print(json.dumps({k:v for k,v in report.items() if k!="flags"},indent=2))
    if report["flags"]:raise SystemExit("Incomplete meteorological inputs: review flags before ET0")
