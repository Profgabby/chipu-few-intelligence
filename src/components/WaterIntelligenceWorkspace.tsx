import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useResearchContext } from '../lib/research-context'
import { ResearchStatus } from './ResearchStatus'
import { Droplets, Play, RefreshCw } from 'lucide-react'
import { runWaterAnalysis, type WaterAnalysisResult } from '../lib/water-intelligence-engine'
import { listTwinStates, type TwinStateEstimate } from '../lib/state-engine'
import { listForecasts, type ForecastRun } from '../lib/forecast-engine'


export function WaterIntelligenceWorkspace() {
  const { farmId, zoneId } = useResearchContext()
  const [states,setStates]=useState<TwinStateEstimate[]>([])
  const [forecasts,setForecasts]=useState<ForecastRun[]>([])
  const [stateId,setStateId]=useState('')
  const [forecastId,setForecastId]=useState('')
  const [result,setResult]=useState<WaterAnalysisResult|null>(null)
  const [mode,setMode]=useState<'inspect'|'forecast'|'simulation'>('inspect')
  const selected=states.find(s=>s.id===stateId && s.farmId===farmId && s.zoneId===zoneId)
  const waterVariables=[['soil_water_rootzone','Root-zone moisture'],['tank_level','Tank level'],['water_flow','Flow'],['pump_power','Pump power'],['irrigation_pressure','Pressure']]
  const moisture=selected?.components.find(c=>c.variable==='soil_water_rootzone')
  const usableMoisture=moisture?.value!=null && moisture.status!=='REJECTED' && moisture.status!=='MISSING' && moisture.freshness!=='STALE'
  const matchingForecast=forecasts.find(f=>f.id===forecastId && f.initialStateId===stateId)
  const blocked=!selected?'Choose a snapshot to continue.':mode==='inspect'?'Snapshot inspection only. Choose an analysis mode to calculate irrigation.':!usableMoisture?'Usable root-zone moisture is required.':mode==='forecast'&&!matchingForecast?'Choose a matching forecast to continue.':''
  const stamp=(value:string)=>new Date(value).toLocaleString()
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')

  async function refresh(){
    const [s,f]=await Promise.all([listTwinStates(30),listForecasts(30)])
    const scoped = s.filter(row=>row.farmId===farmId && row.zoneId===zoneId)
    setStates(scoped);setForecasts(f.filter(row=>row.farmId===farmId && row.zoneId===zoneId))
    setStateId(current=>scoped.some(row=>row.id===current)?current:scoped[0]?.id||'')
    setForecastId('');setResult(null)
  }
  useEffect(()=>{setResult(null);setStateId('');setForecastId('');setStates([]);refresh().catch(e=>setError(String(e)))},[farmId,zoneId])

  async function execute(){
    if(blocked)return
    if(!states.some(s=>s.id===stateId && s.farmId===farmId && s.zoneId===zoneId))return
    setBusy(true);setError('');setResult(null)
    try{setResult(await runWaterAnalysis({stateId:stateId||undefined,forecastId:mode==='forecast'?forecastId:null}))}
    catch(e){setError(e instanceof Error?e.message:String(e))}
    finally{setBusy(false)}
  }

  return <div className="water-engine-workspace">
    <section className="water-hero"><div><span className="research-kicker">FOOD · WATER · ENERGY</span><h1>Water system</h1><p>Soil water, irrigation demand and pumping requirements.</p></div><ResearchStatus state={result?'available':states.length?'partial':'missing'} label={result?'Analysis available':states.length?'Ready to configure':'Awaiting site evidence'}/></section>
    <section className="water-input-bar" aria-label="Analysis inputs"><label>System snapshot<select value={stateId} disabled={busy} onChange={e=>{setStateId(e.target.value);setForecastId('');setResult(null)}}><option value="">{states.length?'Choose snapshot':'No snapshot available'}</option>{states.map(s=><option key={s.id} value={s.id}>{stamp(s.referenceTime)} · {s.zoneId} · {s.evidenceMode} · {s.aggregateQuality}</option>)}</select></label><label>Analysis mode<select value={mode} disabled={busy} onChange={e=>{setMode(e.target.value as typeof mode);setForecastId('');setResult(null)}}><option value="inspect">Inspect snapshot</option><option value="forecast">Forecast-assisted</option><option value="simulation">Simulation · assumed demand</option></select></label>{mode==='forecast'&&<label>Matching forecast<select value={forecastId} disabled={busy} onChange={e=>{setForecastId(e.target.value);setResult(null)}}><option value="">Choose forecast</option>{forecasts.filter(f=>f.initialStateId===stateId).map(f=><option key={f.id} value={f.id}>{f.id} · {f.id}</option>)}</select></label>}<button className="button button-primary" onClick={execute} disabled={busy||!!blocked} aria-describedby="water-run-requirement"><Play size={15}/>{busy?'Running…':'Run analysis'}</button><button className="button button-outline" disabled={busy} onClick={()=>refresh().catch(e=>setError(String(e)))}><RefreshCw size={15}/>Refresh</button></section>
    <p id="water-run-requirement" className="water-run-requirement" role="status">{blocked||'Inputs selected. Ready for analysis.'}</p>
    {!selected&&<Link className="text-link" to="/app/twin">Create snapshot →</Link>}
    {selected&&<section className="water-snapshot" aria-label="Selected snapshot water conditions"><header><div><h2>Snapshot water conditions</h2><p>{stamp(selected.referenceTime)} · {Math.max(0,Math.floor((Date.now()-Date.parse(selected.referenceTime))/3600000))} h old · {selected.evidenceMode}</p></div><ResearchStatus state={selected.aggregateQuality==='PASS'?'available':'partial'} label={`Quality: ${selected.aggregateQuality}`}/></header><div className="table-wrap"><table><thead><tr><th>Variable</th><th>Value</th><th>Condition</th><th>Observed at</th><th>Source</th></tr></thead><tbody>{waterVariables.map(([key,label])=>{const c=selected.components.find(c=>c.variable===key);const missing=c?.value==null||c.status==='REJECTED'||c.status==='MISSING';return <tr key={key}><td>{label}</td><td>{missing?'—':`${c.value?.toFixed(3)} ${c.unit}`}</td><td><ResearchStatus state={missing?'missing':c.freshness==='CURRENT'?'available':'partial'} label={missing?(c?.status==='REJECTED'?'Rejected':'Missing'):`${c.status} · ${c.freshness}`}/></td><td>{c?.observationTimestamp?stamp(c.observationTimestamp):'—'}</td><td>{c?.provenance||'—'}{c?.sensorId?` · ${c.sensorId}`:''}</td></tr>})}</tbody></table></div><p>Root-zone moisture supports irrigation demand. Flow supports runtime; pump power supports energy. Missing flow or power leaves those outputs unavailable.</p><details><summary>Snapshot provenance</summary><p>{selected.id} · {selected.modelVersion}</p><p>{selected.method}</p></details></section>}
    {!result&&<>
      <section className="water-kpis" aria-label="Water indicators">{[['Soil water','m³/m³'],['Net irrigation','mm'],['Irrigation volume','m³'],['Pumping energy','kWh']].map(([label,unit])=><article key={label}><span>{label}</span><strong>{label==='Soil water'&&moisture?.value!=null&&moisture.status!=='REJECTED'&&moisture.status!=='MISSING'?moisture.value.toFixed(3):'—'}</strong><small>{unit} · {label==='Soil water'&&selected?'selected snapshot':'awaiting analysis'}</small></article>)}</section>
      <section className="water-grid water-start"><article><h2>Soil & root zone</h2><p>Root-zone moisture, target water content and storage deficit.</p><Link to="/app/twin">Inspect Twin State →</Link></article><article><h2>Irrigation demand</h2><p>Crop-water demand and rainfall, adjusted for irrigation efficiency.</p><Link to="/app/predict">Inspect prediction →</Link></article><article><h2>Water source & storage</h2><p>Tank level is available from Twin State. Source capacity, groundwater level and abstraction limits are not yet connected.</p><Link to="/app/location">Configure water source →</Link></article><article><h2>Pumping & energy</h2><p>Flow and pump-power evidence determine runtime and energy requirements.</p><Link to="/app/data">Review observations →</Link></article></section>
      {!states.length&&<div className="water-next"><Droplets size={22}/><div><h2>Start with site observations</h2><p>No Twin State is available for {farmId} · {zoneId}.</p><Link className="button button-primary" to="/app/twin">Build Twin State</Link></div></div>}
    </>}
    <details className="water-assumptions"><summary>Calculation assumptions</summary><p>Demonstration defaults: 1,000 m² area · 0.12 m root-zone depth · 0.290 m³/m³ target moisture · 90% irrigation efficiency. Without a matching forecast: 4.8 mm crop-water demand and 0 mm precipitation. These are model assumptions, not site observations.</p></details>
    {error&&<div className="water-warning">{error}</div>}
    {result&&<>
      <section className="water-meta"><div><small>ANALYSIS</small><strong>{result.id}</strong></div><div><small>STATE</small><strong>{result.stateId}</strong></div><div><small>FORECAST</small><strong>{result.forecastId??'NONE'}</strong></div><div><small>EVIDENCE</small><strong>{result.evidenceMode}</strong></div><div><small>MODEL</small><strong>{result.modelVersion}</strong></div><div><small>STATUS</small><strong>{result.status}</strong></div></section>
      {result.warnings.map(w=><div className="water-warning" key={w}>{w}</div>)}
      <section className="water-kpis"><article><span>Root-zone water · θ</span><strong>{result.rootZoneWater?.toFixed(3)??'—'}</strong><small>m³/m³ · root-zone water</small></article><article><span>I<sub>net</sub></span><strong>{result.irrigationRequirement.toFixed(2)}</strong><small>mm · net irrigation</small></article><article><span>I<sub>gross</sub></span><strong>{result.grossIrrigationRequirement.toFixed(2)}</strong><small>mm · efficiency adjusted</small></article><article><span>V<sub>irr</sub></span><strong>{result.irrigationVolumeM3.toFixed(1)}</strong><small>m³ · {result.areaM2} m² zone</small></article></section>
      <section className="water-grid"><article><h2>Water-balance calculation</h2><dl><div><dt>Target root-zone water</dt><dd>{result.targetWater.toFixed(3)} m³/m³</dd></div><div><dt>Root-zone deficit</dt><dd>{result.waterDeficit?.toFixed(3)??'—'} m³/m³</dd></div><div><dt>Crop-water demand</dt><dd>{result.cropWaterDemand.toFixed(3)} mm</dd></div><div><dt>Effective precipitation</dt><dd>{result.effectivePrecipitation.toFixed(3)} mm</dd></div><div><dt>Irrigation efficiency</dt><dd>{(result.irrigationEfficiency*100).toFixed(0)}%</dd></div><div><dt>Tank level</dt><dd>{result.tankLevel?.toFixed(1)??'—'}%</dd></div></dl></article><article><h2>Hydraulic & energy consequence</h2><dl><div><dt>Water flow</dt><dd>{result.pumpFlowLmin?.toFixed(1)??'—'} L/min</dd></div><div><dt>Irrigation runtime</dt><dd>{result.irrigationRuntimeHours?.toFixed(2)??'—'} h</dd></div><div><dt>Pump power</dt><dd>{result.pumpPowerKw?.toFixed(2)??'—'} kW</dd></div><div><dt>Pumping energy</dt><dd>{result.pumpingEnergyKwh?.toFixed(2)??'—'} kWh</dd></div><div><dt>Predicted threshold</dt><dd>{result.thresholdLeadHours===null?(result.forecastId?'not reached in forecast':'No forecast'):`+${result.thresholdLeadHours} h`}</dd></div></dl></article></section>
      <section className="water-method"><div className="water-method-icon"><Droplets size={18}/></div><div><h2>Method & interpretation</h2><p>{result.method}. This module is a research calculation layer. Synthetic or insufficient inputs remain explicitly marked and should not be interpreted as an operational irrigation prescription.</p></div></section>
    </>}
  </div>
}
