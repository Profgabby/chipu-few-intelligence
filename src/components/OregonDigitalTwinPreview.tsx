import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import weather from '../data/oregonWeather2024.json'
import './OregonDigitalTwinPreview.css'

type Region = keyof typeof weather.regions
type Source = 'station'|'power'
type Variable = 'temp'|'precip'|'solar'|'rh'|'wind'
const regions:Region[]=['central_oregon','willamette_valley']
const labels=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const variables:{id:Variable;name:string;unit:string;index:number}[]=[
 {id:'temp',name:'Air temperature',unit:'°C',index:0},
 {id:'precip',name:'Precipitation',unit:'mm/month',index:2},
 {id:'solar',name:'Global solar radiation',unit:'kWh/m²/day',index:4},
 {id:'rh',name:'Relative humidity',unit:'%',index:6},
 {id:'wind',name:'Wind speed',unit:'m/s',index:8}
]
const evidence=[
 ['AgriMet daily meteorology','MRSO and ARAO, 2024','Station observations · 366 calendar dates per station'],
 ['NASA POWER daily meteorology','Madras and Aurora grid points, 2024','Gridded environmental estimates · 366 dates per region'],
 ['Independent source comparison','Bias, MAE, RMSE and monthly differences','Weather-source agreement only; not field validation'],
 ['Measured PV array geometry','Not supplied','No surveyed module tilt, clearance, pitch or azimuth'],
 ['Crop, soil, irrigation and control','Not supplied','No agrivoltaic crop or water treatment effect can be estimated']
]
const fmt=(n:number,d=2)=>Number.isFinite(n)?n.toFixed(d):'—'
function stats(rows:number[][],index:number){
 const diff=rows.map(r=>r[index+1]-r[index])
 return {bias:diff.reduce((a,b)=>a+b,0)/diff.length,mae:diff.reduce((a,b)=>a+Math.abs(b),0)/diff.length,rmse:Math.sqrt(diff.reduce((a,b)=>a+b*b,0)/diff.length)}
}
export function OregonDigitalTwinPreview(){
 const [region,setRegion]=useState<Region>('central_oregon')
 const [source,setSource]=useState<Source>('station')
 const [variable,setVariable]=useState<Variable>('solar')
 const [section,setSection]=useState<'overview'|'data'|'simulation'|'evidence'>('overview')
 const [pvArea,setPvArea]=useState(26.4)
 const [efficiency,setEfficiency]=useState(20)
 const [derate,setDerate]=useState(85)
 const [run,setRun]=useState(false)
 const selected=weather.regions[region]
 const rows=selected.monthly as number[][]
 const v=variables.find(x=>x.id===variable)!
 const column=v.index+(source==='power'?1:0)
 const days=[31,29,31,30,31,30,31,31,30,31,30,31]
 const totalSolar=useMemo(()=>rows.reduce((sum,r,i)=>sum+r[4+(source==='power'?1:0)]*days[i],0),[rows,source])
 const annualPotential=totalSolar*pvArea*(efficiency/100)*(derate/100)
 const chartValues=rows.map(r=>r[column])
 const chartMin=Math.min(0,...chartValues)
 const chartMax=Math.max(1,...chartValues)
 const comparison=stats(rows,v.index)
 const changeRegion=(value:Region)=>{setRegion(value);setRun(false)}
 return <div className="odt-shell">
  <header className="odt-topbar"><div className="odt-brand"><span className="odt-mark">CF</span><span><strong>CHIPU-FEW <em>/</em> OREGON</strong><small>Observed weather · Gridded comparison · Explicit model assumptions</small></span></div><div className="odt-top-actions"><span className="odt-preview-tag">RESEARCH DEVELOPMENT</span><Link className="odt-return" to="/app">← Main platform</Link></div></header>
  <div className="odt-body"><aside className="odt-rail"><div className="odt-rail-title">OREGON RESEARCH WORKBENCH</div><nav aria-label="Oregon workbench">{([['overview','Overview'],['data','Meteorological data'],['simulation','Simulation workbench'],['evidence','Evidence & limitations']] as const).map(([id,name],i)=><button key={id} className={section===id?'odt-rail-item odt-rail-active':'odt-rail-item'} onClick={()=>setSection(id)}><span>{String(i+1).padStart(2,'0')}</span>{name}</button>)}</nav><div className="odt-rail-note"><strong>2024 source records connected</strong><span>FAO-56 and AV validation pending</span><p>Monthly values derive from actual date-aligned AgriMet and NASA POWER records, not illustrative observations.</p></div></aside>
  <main className="odt-main"><div className="odt-heading"><div><span className="odt-kicker">OREGON / {section.toUpperCase()}</span><h1>{section==='overview'?'Oregon agrivoltaic research dashboard':section==='data'?'Meteorological observations':section==='simulation'?'Weather-driven simulation workbench':'Evidence and model readiness'}</h1><p>2024 · Central Oregon and Willamette Valley · source traceability and reproducible calculations</p></div><span className="odt-state">WEATHER SOURCES COMPARED · MODELS NOT VALIDATED</span></div>
  <div className="odt-inline-note"><strong>Scientific classification:</strong> AgriMet provides station observations; NASA POWER provides gridded estimates. Values below are derived from uploaded 2024 data. Site-specific agrivoltaic results, FAO-56 ET₀, crop yields and irrigation savings have not been validated.</div>
  <section className="odt-panel odt-region-panel"><div className="odt-panel-heading"><span>01 / DATA CONTROLS</span><h2>Regional weather selection</h2><p>Switch region and source to update the observed weather display and exploratory solar-energy calculation.</p></div><div className="odt-region-controls"><label htmlFor="odt-region">Reference region</label><select id="odt-region" value={region} onChange={e=>changeRegion(e.target.value as Region)}>{regions.map(key=><option key={key} value={key}>{weather.regions[key].label}</option>)}</select><label htmlFor="odt-source">Weather data source</label><select id="odt-source" value={source} onChange={e=>{setSource(e.target.value as Source);setRun(false)}}><option value="station">USBR AgriMet · station</option><option value="power">NASA POWER · gridded</option></select><span>Station {selected.station} · {selected.latitude}° N, {Math.abs(selected.longitude)}° W · 2024 (366 days)</span></div></section>
  {(section==='overview'||section==='data')&&<><section className="odt-panel"><div className="odt-panel-heading"><span>02 / MONTHLY OBSERVATIONS</span><h2>Measured and estimated meteorology</h2><p>Monthly averages except precipitation (monthly totals). All displayed values are derived from the supplied daily paired files.</p></div><div className="odt-region-controls"><label htmlFor="odt-variable">Variable</label><select id="odt-variable" value={variable} onChange={e=>setVariable(e.target.value as Variable)}>{variables.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div><div className="odt-weather-chart" role="img" aria-label={v.name+' by month, '+v.unit}>{chartValues.map((value,i)=><div className="odt-weather-bar" key={i}><div className="odt-weather-track"><div style={{height:((value-chartMin)/(chartMax-chartMin)*100)+'%'}}/></div><strong>{fmt(value,1)}</strong><small>{labels[i]}</small></div>)}</div><p className="odt-chart-note">{v.name} · {v.unit} · {source==='station'?'AgriMet station observations':'NASA POWER gridded estimates'}</p><div className="odt-data-table-wrap"><table className="odt-data-table"><thead><tr><th>Month</th><th>AgriMet ({v.unit})</th><th>NASA POWER ({v.unit})</th><th>POWER − station</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}><td>{labels[i]}</td><td>{fmt(r[v.index])}</td><td>{fmt(r[v.index+1])}</td><td>{fmt(r[v.index+1]-r[v.index])}</td></tr>)}</tbody></table></div><p className="odt-chart-note">Unweighted monthly comparison: bias {fmt(comparison.bias)}; MAE {fmt(comparison.mae)}; RMSE {fmt(comparison.rmse)} {v.unit}. These are monthly-aggregate metrics, not the previously calculated daily paired metrics.</p></section></>}
  {(section==='overview'||section==='simulation')&&<section className="odt-panel"><div className="odt-panel-heading"><span>03 / EXPLORATORY SIMULATION</span><h2>Weather-driven PV energy potential</h2><p>Executable, transparent solar-energy screening calculation using actual monthly global horizontal irradiance. Not an array-level PV prediction or calibrated agrivoltaic simulation.</p></div><div className="odt-sim-controls"><label>PV module area (m²)<input type="number" min="0.1" max="100000" step="0.1" value={pvArea} onChange={e=>{setPvArea(Number(e.target.value));setRun(false)}}/></label><label>Assumed conversion efficiency (%)<input type="number" min="1" max="100" value={efficiency} onChange={e=>{setEfficiency(Number(e.target.value));setRun(false)}}/></label><label>Assumed system derate (%)<input type="number" min="1" max="100" value={derate} onChange={e=>{setDerate(Number(e.target.value));setRun(false)}}/></label></div><button className="odt-run-button" disabled={pvArea<=0||pvArea>100000||efficiency<=0||efficiency>100||derate<=0||derate>100} onClick={()=>setRun(true)}>Run weather-driven screening calculation</button>{run&&<div className="odt-simulation"><strong>Exploratory result: {fmt(annualPotential,1)} kWh/year</strong><p>2024 measured/estimated horizontal solar irradiation: {fmt(totalSolar,1)} kWh/m²/year. Calculation: annual GHI × {fmt(pvArea,1)} m² × {efficiency}% efficiency × {derate}% derate.</p><p>This is an assumption-driven upper-level screening calculation. It does not resolve panel tilt, plane-of-array irradiance, module temperature, shading, inverter losses, crop response or validated electrical output. Inputs are not measured array specifications.</p></div>}</section>}
  {section==='evidence'&&<section className="odt-panel"><div className="odt-panel-heading"><span>04 / EVIDENCE REGISTER</span><h2>Connected evidence and scientific boundaries</h2></div><div className="odt-data-table-wrap"><table className="odt-data-table"><thead><tr><th>Dataset / component</th><th>Status</th><th>Interpretation</th></tr></thead><tbody>{evidence.map(e=><tr key={e[0]}><td><strong>{e[0]}</strong></td><td>{e[1]}</td><td>{e[2]}</td></tr>)}</tbody></table></div><p>Data provenance: uploaded 2024 POWER–AgriMet paired comparison; monthly aggregates committed with source labels and unit metadata. MRSO March precipitation excludes one negative observation, so its monthly total is incomplete. Daily observation windows and station exposure have not been reconciled.</p><a className="odt-source" href="https://github.com/Profgabby/chipu-few-intelligence/tree/feature/oregon-av-digital-twin-v01/scientific-core/oregon-av" target="_blank" rel="noreferrer">Scientific methods and source scripts ↗</a></section>}
  <footer className="odt-footer"><span>CHIPU-FEW · 2024 genuine weather-source data · Simulation outputs clearly labeled exploratory</span><Link to="/app">Return to main platform ↗</Link></footer>
  </main></div></div>
}
