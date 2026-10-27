"""Retrieve original USBR Pacific Northwest AgriMet archive responses.

Do not infer absent variables, replace missing values, or call downloads validated.
"""
import argparse
import hashlib
import json
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request,urlopen

STATIONS={"central_oregon_madras":"MRSO","willamette_aurora":"ARAO"}
CODES=("MM","MN","MX","PP","SR","TA","UA")
BASE="https://www.usbr.gov/pn-bin/webarccsv.pl"

def url(station,year):
    params=[("parameter",",".join(f"{station} {code}" for code in CODES)),
            ("syer",year),("smnth",1),("sdy",1),
            ("eyer",year),("emnth",12),("edy",31),("format",2)]
    return BASE+"?"+urlencode(params)

def acquire(outdir,year):
    outdir.mkdir(parents=True,exist_ok=True)
    manifest={"source":"USBR Pacific Northwest AgriMet daily archive",
              "data_class":"station archive observations; provisional pending provider QA",
              "year":year,"retrieved_utc":datetime.now(timezone.utc).isoformat(),"stations":{}}
    for region,station in STATIONS.items():
        endpoint=url(station,year)
        with urlopen(Request(endpoint,headers={"User-Agent":"CHIPU-Oregon-Research/0.1"}),timeout=120) as response:
            raw=response.read()
            content_type=response.headers.get("Content-Type","")
        # Fail closed if service returns HTML, an error page or empty data.
        decoded=raw.decode("utf-8-sig",errors="replace")
        if "BEGIN DATA" not in decoded or "END DATA" not in decoded:
            raise ValueError(f"{station}: no recognized archive data delimiters; content-type={content_type}")
        name=f"{station}_{year}_agrimet_original.txt"
        (outdir/name).write_bytes(raw)
        manifest["stations"][region]={"station_id":station,"url":endpoint,"raw_file":name,
             "sha256":hashlib.sha256(raw).hexdigest(),"bytes":len(raw),
             "content_type":content_type,"validation":"downloaded_not_harmonized"}
    (outdir/"agrimet_manifest.json").write_text(json.dumps(manifest,indent=2,sort_keys=True)+"\n")
    print(json.dumps({"stations":{k:v["sha256"] for k,v in manifest["stations"].items()}},indent=2))

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--year",type=int,default=2024)
    p.add_argument("--outdir",type=Path,default=Path("results/oregon-agrimet"))
    a=p.parse_args()
    acquire(a.outdir,a.year)
