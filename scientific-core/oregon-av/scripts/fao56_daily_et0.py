"""FAO-56 daily grass-reference Penman-Monteith ET0 (mm/day).

Input: genuine harmonized daily station CSV with columns:
date,tmin_c,tmax_c,tmean_c,rh_pct,wind_m_s,solar_kwh_m2_day
Wind MUST be measured/normalized at 2 m. Relative humidity is daily MEAN:
ea from RHmean is an explicitly flagged approximation, not RHmax/RHmin.
Site elevation and latitude are REQUIRED measured/authoritative metadata.
No precipitation or crop coefficients enter reference ET0.
No implicit weather imputation, no synthetic fallback, no model validation claim.
"""
import argparse
import csv
import hashlib
import json
import math
from datetime import date,datetime,timezone
from pathlib import Path

GSC=0.0820  # MJ m-2 min-1
SIGMA=4.903e-9  # MJ K-4 m-2 day-1
def esat(t): return 0.6108*math.exp(17.27*t/(t+237.3))
def et0_day(day,tmin,tmax,tmean,rhmean,u2,rs_mj,latitude,elevation):
    if not (-90<latitude<90 and -500<=elevation<=9000):
        raise ValueError("Invalid latitude or elevation")
    if not (-90<tmin<=tmean<=tmax<65 and 0<=rhmean<=100 and 0<=u2<=40 and 0<=rs_mj<=14):
        raise ValueError("Invalid meteorological bounds")
    rs_mj=rs_mj*3.6  # incoming solar_kwh_m2_day -> FAO-56 MJ/m2/day
    j=day.timetuple().tm_yday
    phi=math.radians(latitude)
    dr=1+0.033*math.cos(2*math.pi*j/365)
    delta=0.409*math.sin(2*math.pi*j/365-1.39)
    arg=-math.tan(phi)*math.tan(delta)
    ws=math.acos(max(-1,min(1,arg)))
    ra=(24*60/math.pi)*GSC*dr*(ws*math.sin(phi)*math.sin(delta)+math.cos(phi)*math.cos(delta)*math.sin(ws))
    rso=(0.75+2e-5*elevation)*ra
    if rso<=0: raise ValueError("Clear-sky radiation nonpositive")
    rs_ratio=min(1,max(0,rs_mj/rso))
    es=(esat(tmax)+esat(tmin))/2
    ea=es*rhmean/100  # approximation from RHmean; document in output
    delta_s=4098*esat(tmean)/(tmean+237.3)**2
    pressure=101.3*((293-0.0065*elevation)/293)**5.26
    gamma=0.000665*pressure
    rns=(1-0.23)*rs_mj
    rnl=SIGMA*((tmax+273.16)**4+(tmin+273.16)**4)/2*(0.34-0.14*math.sqrt(max(0,ea)))*(1.35*rs_ratio-0.35)
    rn=rns-rnl
    numerator=0.408*delta_s*rn+gamma*(900/(tmean+273))*u2*(es-ea)
    denominator=delta_s+gamma*(1+0.34*u2)
    return max(0,numerator/denominator)

def calculate(csv_path,latitude,elevation,wind_height_m,expected_year):
    if abs(wind_height_m-2)>0.001:
        raise ValueError("Wind speed measurement height is not verified as 2 m; do not assume normalization")
    rows=list(csv.DictReader(csv_path.open(encoding="utf-8",newline="")))
    required={"date","tmin_c","tmax_c","tmean_c","rh_pct","wind_m_s","solar_kwh_m2_day"}
    if not rows or not required.issubset(rows[0]): raise ValueError("Missing daily input columns")
    result=[];flags=[];seen=set()
    for row in rows:
        key=row["date"]
        try:
            day=date.fromisoformat(key)
            if day.year!=expected_year or key in seen:raise ValueError("wrong year or duplicate")
            seen.add(key)
            vals=[float(row[k]) for k in ("tmin_c","tmax_c","tmean_c","rh_pct","wind_m_s","solar_kwh_m2_day")]
            if not all(math.isfinite(x) for x in vals):raise ValueError("nonfinite")
            et=et0_day(day,*vals,latitude,elevation)
            result.append({"date":key,"et0_mm_day":round(et,5)})
        except (ValueError,OverflowError,ZeroDivisionError) as exc:
            flags.append({"date":key,"reason":str(exc)})
    expected=(date(expected_year+1,1,1)-date(expected_year,1,1)).days
    if len(seen)!=expected:flags.append({"reason":"incomplete year","unique_dates":len(seen),"expected":expected})
    return {"status":"review_required" if flags else "calculated_not_field_validated",
      "method":"FAO-56 daily Penman-Monteith grass reference; RHmean-based ea approximation; G=0",
      "source_sha256":hashlib.sha256(csv_path.read_bytes()).hexdigest(),
      "latitude":latitude,"elevation_m":elevation,"wind_height_m":wind_height_m,
      "year":expected_year,"expected_days":expected,"valid_days":len(result),
      "flags":flags,"daily":result}

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--input",required=True,type=Path)
    p.add_argument("--latitude",required=True,type=float)
    p.add_argument("--elevation-m",required=True,type=float)
    p.add_argument("--wind-height-m",required=True,type=float)
    p.add_argument("--year",type=int,default=2024)
    p.add_argument("--output",required=True,type=Path)
    a=p.parse_args()
    report=calculate(a.input,a.latitude,a.elevation_m,a.wind_height_m,a.year)
    a.output.parent.mkdir(parents=True,exist_ok=True)
    a.output.write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps({k:v for k,v in report.items() if k!="daily"},indent=2))
    if report["flags"]:raise SystemExit("Quality gate failed: inspect output; do not use for model forcing")
