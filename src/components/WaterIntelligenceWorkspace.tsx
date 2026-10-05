import { useEffect, useState } from 'react'
import { Droplets, Play, RefreshCw } from 'lucide-react'
import { runWaterAnalysis, type WaterAnalysisResult } from '../lib/water-intelligence-engine'
import { listTwinStates, type TwinStateEstimate } from '../lib/state-engine'
import { listForecasts, type ForecastRun } from '../lib/forecast-engine'
import { ResearchWorkspaceGrammar } from './ResearchWorkspaceGrammar'

export function WaterIntelligenceWorkspace() {
  const [states,setStates]=useState<TwinStateEstimate[]>([])
  const [forecasts,setForecasts]=useState<ForecastRun[]>([])
  const [stateId,setStateId]=useState('')
  const [forecastId,setForecastId]=useState('')
  const [result,setResult]=useState<WaterAnalysisResult|null>(null)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')

  async function refresh(){
    const [s,f]=await Promise.all([listTwinStates(30),listForecasts(30)])
    setStates(s);setForecasts(f)
    if(!stateId&&s[0]) setStateId(s[0].id)
    if(!forecastId&&f[0]) setForecastId(f[0].id)
  }
  useEffect(()=>{refresh().catch(e=>setError(String(e)))},[])

  async function execute(){
    setBusy(true);setError('')
    try{setResult(await runWaterAnalysis({stateId:stateId||undefined,forecastId:forecastId||undefined}))}
    catch(e){setError(e instanceof Error?e.message:String(e))}
    finally{setBusy(false)}
  }

  return <div className="water-engine-workspace">
    <ResearchWorkspaceGrammar active={['Context','Inputs','Method / Model','State / Indicators','FEW Dependencies','Outputs','Uncertainty','Provenance']} note="Water calculations consume persisted state and, when available, a matching prediction. Missing flow or pump-power evidence remains missing." />
    <section className="water-hero"><div><span className="research-kicker">OBSERVATION-INFORMED WATER INTELLIGENCE</span><h1>Water Intelligence</h1><p>Translate Twin State and prediction outputs into transparent irrigation demand, volume, runtime, and pumping-energy calculations.</p></div><div className="water-actions"><select value={stateId} onChange={e=>setStateId(e.target.value)}><option value="">Select Twin State</option>{states.map(s=><option key={s.id} value={s.id}>{s.id} · {s.evidenceMode}</option>)}</select><select value={forecastId} onChange={e=>setForecastId(e.target.value)}><option value="">No forecast</option>{forecasts.map(f=><option key={f.id} value={f.id}>{f.id}</option>)}</select><button onClick={execute} disabled={busy}><Play size={15}/>{busy?'Running…':'Run Water Analysis'}</button><button onClick={()=>refresh()}><RefreshCw size={15}/>Refresh</button></div></section>
    {error&&<div className="water-warning">{error}</div>}
    {result&&<>
      <section className="water-meta"><div><small>ANALYSIS</small><strong>{result.id}</strong></div><div><small>STATE</small><strong>{result.stateId}</strong></div><div><small>FORECAST</small><strong>{result.forecastId??'NONE'}</strong></div><div><small>EVIDENCE</small><strong>{result.evidenceMode}</strong></div><div><small>MODEL</small><strong>{result.modelVersion}</strong></div><div><small>STATUS</small><strong>{result.status}</strong></div></section>
      {result.warnings.map(w=><div className="water-warning" key={w}>{w}</div>)}
      <section className="water-kpis"><article><span>θr</span><strong>{result.rootZoneWater?.toFixed(3)??'—'}</strong><small>m³/m³ · root-zone water</small></article><article><span>I<sub>net</sub></span><strong>{result.irrigationRequirement.toFixed(2)}</strong><small>mm · net irrigation</small></article><article><span>I<sub>gross</sub></span><strong>{result.grossIrrigationRequirement.toFixed(2)}</strong><small>mm · efficiency adjusted</small></article><article><span>V<sub>irr</sub></span><strong>{result.irrigationVolumeM3.toFixed(1)}</strong><small>m³ · {result.areaM2} m² zone</small></article></section>
      <section className="water-grid"><article><h2>Water-balance calculation</h2><dl><div><dt>Target root-zone water</dt><dd>{result.targetWater.toFixed(3)} m³/m³</dd></div><div><dt>Root-zone deficit</dt><dd>{result.waterDeficit?.toFixed(3)??'—'} m³/m³</dd></div><div><dt>Crop-water demand</dt><dd>{result.cropWaterDemand.toFixed(3)} mm</dd></div><div><dt>Effective precipitation</dt><dd>{result.effectivePrecipitation.toFixed(3)} mm</dd></div><div><dt>Irrigation efficiency</dt><dd>{(result.irrigationEfficiency*100).toFixed(0)}%</dd></div><div><dt>Tank level</dt><dd>{result.tankLevel?.toFixed(1)??'—'}%</dd></div></dl></article><article><h2>Hydraulic & energy consequence</h2><dl><div><dt>Water flow</dt><dd>{result.pumpFlowLmin?.toFixed(1)??'—'} L/min</dd></div><div><dt>Irrigation runtime</dt><dd>{result.irrigationRuntimeHours?.toFixed(2)??'—'} h</dd></div><div><dt>Pump power</dt><dd>{result.pumpPowerKw?.toFixed(2)??'—'} kW</dd></div><div><dt>Pumping energy</dt><dd>{result.pumpingEnergyKwh?.toFixed(2)??'—'} kWh</dd></div><div><dt>Predicted threshold</dt><dd>{result.thresholdLeadHours===null?'not reached':`+${result.thresholdLeadHours} h`}</dd></div></dl></article></section>
      <section className="water-method"><div className="water-method-icon"><Droplets size={18}/></div><div><h2>Method & interpretation</h2><p>{result.method}. This module is a research calculation layer. Synthetic or insufficient inputs remain explicitly marked and should not be interpreted as an operational irrigation prescription.</p></div></section>
    </>}
  </div>
}
