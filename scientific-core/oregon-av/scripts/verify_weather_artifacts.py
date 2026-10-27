"""Verify BOTH acquired source artifacts before any station comparison.

Expected input folders are extracted GitHub Actions artifacts.
This check never fabricates data and fails if either artifact is missing.
"""
import argparse
import hashlib
import json
from pathlib import Path

SITES={"central_oregon_madras":"MRSO","willamette_aurora":"ARAO"}

def verify(root, manifest_name, collection, raw_key):
    manifest_file=root/manifest_name
    if not manifest_file.is_file():
        raise FileNotFoundError(f"Missing acquisition manifest: {manifest_file}")
    manifest=json.loads(manifest_file.read_text())
    entries=manifest[collection]
    if set(entries)!=set(SITES):
        raise ValueError(f"{manifest_name}: missing or unexpected regions")
    result={}
    for region,record in entries.items():
        candidate=(root/record[raw_key]).resolve()
        if not candidate.is_relative_to(root.resolve()) or not candidate.is_file():
            raise ValueError(f"Missing/unsafe raw path for {region}")
        data=candidate.read_bytes()
        digest=hashlib.sha256(data).hexdigest()
        if digest!=record["sha256"]:
            raise ValueError(f"Checksum mismatch for {region}")
        result[region]={"bytes":len(data),"sha256":digest,"file":str(candidate)}
    return result

def run(power,agrimet):
    p=verify(power,"manifest.json","locations","raw_file")
    a=verify(agrimet,"agrimet_manifest.json","stations","raw_file")
    for region,station in SITES.items():
        manifest=json.loads((agrimet/"agrimet_manifest.json").read_text())
        if manifest["stations"][region]["station_id"]!=station:
            raise ValueError(f"Station mismatch for {region}")
    return {"status":"raw_integrity_verified_only","power":p,"agrimet":a,
            "limitations":["Archive structure not confirmed","Station data not harmonized",
                           "No NASA POWER-AgriMet comparison computed",
                           "No FAO-56 model-forcing approval"]}

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--power",type=Path,required=True)
    parser.add_argument("--agrimet",type=Path,required=True)
    parser.add_argument("--output",type=Path)
    args=parser.parse_args()
    result=run(args.power,args.agrimet)
    if args.output:
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(json.dumps(result,indent=2)+"\n")
    print(json.dumps(result,indent=2))
