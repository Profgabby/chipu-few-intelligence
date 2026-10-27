"""Audit independently downloaded NASA POWER records; never fabricate missing inputs.

Usage: python scripts/audit_oregon_weather.py --dir results/oregon-weather
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

PARAMS = ("T2M","T2M_MAX","T2M_MIN","PRECTOTCORR","RH2M","WS2M","ALLSKY_SFC_SW_DWN")

def audit(folder: Path):
    manifest = json.loads((folder / "manifest.json").read_text(encoding="utf-8"))
    if set(manifest["locations"]) != {"central_oregon_madras", "willamette_aurora"}:
        raise ValueError("Expected both Oregon reference areas")
    output = {"source": manifest["dataset"], "data_class": manifest["data_class"],
              "year": manifest["year"], "sites": {}, "comparisons": {}}
    for site, meta in manifest["locations"].items():
        file = (folder / meta["raw_file"]).resolve()
        if not file.is_relative_to(folder.resolve()):
            raise ValueError("Raw file escapes dataset directory")
        raw = file.read_bytes()
        digest = hashlib.sha256(raw).hexdigest()
        if digest != meta["sha256"]:
            raise ValueError(f"{site}: SHA-256 mismatch")
        data = json.loads(raw)
        series = data["properties"]["parameter"]
        expected_days = meta["qc"]["days"]
        if any(len(series[k]) != expected_days for k in PARAMS):
            raise ValueError(f"{site}: incomplete time coverage")
        days = sorted(series["T2M"])
        flags = []
        valid_days = []
        for day in days:
            v = {k:series[k].get(day) for k in PARAMS}
            if any(x is None or not isinstance(x,(float,int)) or not math.isfinite(x) or x <= -900 for x in v.values()):
                flags.append({"date":day,"reason":"missing_or_nonfinite"})
                continue
            if v["T2M_MIN"] > v["T2M"] or v["T2M"] > v["T2M_MAX"]:
                flags.append({"date":day,"reason":"temperature_order"})
            if v["PRECTOTCORR"] < 0 or v["ALLSKY_SFC_SW_DWN"] < 0 or not 0 <= v["RH2M"] <= 100:
                flags.append({"date":day,"reason":"physical_bounds"})
            valid_days.append((day,v))
        output["sites"][site] = {"sha256_verified":True,"days":len(days),
           "complete_case_days":len(valid_days),"quality_flags":flags,
           "summary":{k: {"mean":round(sum(v[k] for _,v in valid_days)/len(valid_days),4) if valid_days else None,
                          "min":min((v[k] for _,v in valid_days),default=None),
                          "max":max((v[k] for _,v in valid_days),default=None)}
                      for k in PARAMS}}
    for key in ("T2M","PRECTOTCORR","ALLSKY_SFC_SW_DWN"):
        a=output["sites"]["central_oregon_madras"]["summary"][key]["mean"]
        b=output["sites"]["willamette_aurora"]["summary"][key]["mean"]
        output["comparisons"][key]={"central_minus_willamette":round(a-b,4) if a is not None and b is not None else None,
                                    "interpretation":"descriptive gridded-product contrast; not field validation"}
    return output

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--dir",type=Path,default=Path("results/oregon-weather"))
    args=p.parse_args()
    report=audit(args.dir)
    dest=args.dir/"audit.json"
    dest.write_text(json.dumps(report,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    print(json.dumps({"sites":{k:{"days":v["days"],"flags":len(v["quality_flags"])} for k,v in report["sites"].items()},
                      "comparison":report["comparisons"]},indent=2))
    if any(v["quality_flags"] for v in report["sites"].values()):
        raise SystemExit("Quality flags found: inspect audit.json before model use")
