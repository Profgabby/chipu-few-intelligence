"""Parse a USBR AgriMet daily archive only when its format is recognized.

Accepts explicitly delimited archive data, preserving original raw file unchanged.
Rejects unrecognized headers, dates, missing-value sentinels and duplicates.
Output is a *candidate* harmonized dataset, not approved model forcing.
"""
import argparse
import csv
import hashlib
import io
import json
import re
from datetime import datetime
from pathlib import Path

DATE_RE=re.compile(r"^(?:\d{4}-\d{2}-\d{2}|\d{8})$")
MISSING={"","--","---","NA","N/A","M","-999","-9999","-999.0","-9999.0"}
CONVERSIONS={"MM":lambda x:(x-32)*5/9,"MN":lambda x:(x-32)*5/9,
             "MX":lambda x:(x-32)*5/9,"PP":lambda x:x*25.4,
             "SR":lambda x:x*0.0116222222222,"TA":float,"UA":lambda x:x*0.44704}
FIELDS={"MM":"tmean_c","MN":"tmin_c","MX":"tmax_c","PP":"precip_mm",
        "SR":"solar_kwh_m2_day","TA":"rh_pct","UA":"wind_m_s"}

def parse(raw:bytes,station:str):
    text=raw.decode("utf-8-sig")
    start=re.search(r"(?im)^\s*BEGIN DATA\s*$",text)
    end=re.search(r"(?im)^\s*END DATA\s*$",text)
    if not start or not end or end.start()<=start.end():
        raise ValueError("Unrecognized AgriMet archive: BEGIN DATA/END DATA not found")
    lines=[s.strip() for s in text[start.end():end.start()].splitlines() if s.strip()]
    if not lines: raise ValueError("Empty archive data section")
    # Explicitly support CSV or whitespace-delimited tables; never guess column order.
    comma="," in lines[0]
    split=(lambda s:next(csv.reader([s]))) if comma else (lambda s:re.split(r"\s+",s.strip()))
    header=[x.strip().strip('"').upper() for x in split(lines[0])]
    if not header or header[0] not in ("DATE","DAY"):
        raise ValueError("Archive header does not start with DATE/DAY")
    columns=[]
    for token in header[1:]:
        t=token.replace("_"," ").strip()
        m=re.fullmatch(r"([A-Z0-9]+)\s+([A-Z0-9]+)",t)
        if m and m.group(1)==station.upper() and m.group(2) in FIELDS:
            columns.append(m.group(2))
        elif t in FIELDS:
            columns.append(t)
        else:
            columns.append(None)
    if not columns or not any(columns): raise ValueError("No supported station variables")
    out=[];seen=set()
    for line in lines[1:]:
        cells=[x.strip().strip('"') for x in split(line)]
        if len(cells)!=len(header): raise ValueError("Unexpected archive column count")
        date_token=cells[0]
        if not DATE_RE.fullmatch(date_token): raise ValueError("Unrecognized archive date "+date_token)
        dt=datetime.strptime(date_token,"%Y%m%d" if len(date_token)==8 else "%Y-%m-%d")
        day=dt.strftime("%Y-%m-%d")
        if day in seen: raise ValueError("Duplicate date "+day)
        seen.add(day)
        record={"date":day}
        for code,value in zip(columns,cells[1:]):
            if code is None:continue
            field=FIELDS[code]
            if value.upper() in MISSING:
                record[field]=""
            else:
                try: record[field]=round(CONVERSIONS[code](float(value)),8)
                except ValueError as e:raise ValueError(f"{day}: invalid {code} value") from e
        out.append(record)
    return out

def convert(raw_path:Path,station:str,out_path:Path):
    raw=raw_path.read_bytes()
    rows=parse(raw,station)
    columns=["date"]+[FIELDS[k] for k in FIELDS if any(FIELDS[k] in row for row in rows)]
    out_path.parent.mkdir(parents=True,exist_ok=True)
    with out_path.open("w",newline="",encoding="utf-8") as f:
        writer=csv.DictWriter(f,fieldnames=columns);writer.writeheader();writer.writerows(rows)
    report={"station":station,"raw_sha256":hashlib.sha256(raw).hexdigest(),
            "parsed_rows":len(rows),"start":min(r["date"] for r in rows),
            "end":max(r["date"] for r in rows),"fields":columns,
            "missing_counts":{k:sum(r.get(k,"")=="" for r in rows) for k in columns if k!="date"},
            "status":"parsed_not_station_validated"}
    out_path.with_suffix(".provenance.json").write_text(json.dumps(report,indent=2)+"\n")
    return report

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--raw",required=True,type=Path)
    p.add_argument("--station",required=True,choices=["MRSO","ARAO"])
    p.add_argument("--output",required=True,type=Path)
    a=p.parse_args()
    print(json.dumps(convert(a.raw,a.station,a.output),indent=2))
