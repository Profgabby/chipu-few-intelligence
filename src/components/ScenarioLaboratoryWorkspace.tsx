import { useEffect, useMemo, useState } from 'react'
import { Download, FlaskConical, Play, RefreshCw } from 'lucide-react'
import { exportScenarioRun, listScenarioRuns, runScenarioExperiment, scenarioCatalog, type ScenarioExperimentRun } from '../lib/scenario-laboratory-engine'
import { listTwinStates, type TwinStateEstimate } from '../lib/state-engine'

function label(value:string){return value.replace(/_/g,' ')}
function download(name:string,text:string){const blob=new Blob([text],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}

export function ScenarioLaboratoryWorkspace(){
  const [states,setStates]=useState<TwinStateEstimate[]>([])
  const [stateId,setStateId]=useState('')
  const [scenarioId,setScenarioId]=useState('S00')
  const [active,setActive]=useState<ScenarioExperimentRun|null>(null)
  const [history,setHistory]=useState<ScenarioExperimentRun[]>([])
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')

  async function refresh(){
    const [stateRows,runRows]=await Promise.all([listTwinStates(30),listScenarioRuns(50)])
    setStates(stateRows);setHistory(runRows)
    if(!stateId&&stateRows[0])setStateId(stateRows[0].id)
    if(!active&&runRows[0])setActive(runRows[0])
  }
  useEffect(()=>{refresh().catch(e=>setError(String(e)))},[])

  async function run(){
    if(!stateId){setError('Create a Twin State before running a scenario experiment.');return}
    setBusy(true);setError('')
    try{const result=await runScenarioExperiment({stateId,scenarioId});setActive(result);await refresh()}
    catch(e){setError(e instanceof Error?e.message:String(e))}
    finally{setBusy(false)}
  }

  const scenario=scenarioCatalog.find(item=>item.id===scenarioId)??scenarioCatalog[0]
  const comparison=useMemo(()=>active?[
    ['Gross irrigation',active.baseline.grossIrrigationMm,active.perturbed.grossIrrigationMm,'mm'],
    ['Available energy',active.baseline.availableEnergyKwh,active.perturbed.availableEnergyKwh,'kWh'],
    ['Total baseline demand',active.baseline.totalDemandKwh,active.baseline.totalDemandKwh,'kWh'],
  ] as const:[],[active])

  return <div className="scenario-lab-workspace">
    <section className="scenario-lab-hero">
      <div><span>REPRODUCIBLE MANAGEMENT-STRATEGY EXPERIMENTS</span><h1>Scenario Laboratory</h1><p>Run controlled perturbations through the CropSmart water–energy decision chain and preserve the state, parameters, model versions, strategy ranking, and experiment record.</p></div>
      <div className="scenario-lab-actions"><select value={stateId} onChange={e=>setStateId(e.target.value)}><option value="">Select Twin State</option>{states.map(s=><option key={s.id} value={s.id}>{s.id} · {s.evidenceMode} · {s.aggregateQuality}</option>)}</select><select value={scenarioId} onChange={e=>setScenarioId(e.target.value)}>{scenarioCatalog.map(s=><option key={s.id} value={s.id}>{s.id} · {s.name}</option>)}</select><button onClick={run} disabled={busy}><Play size={15}/>{busy?'Running…':'Run Experiment'}</button><button className="secondary" onClick={()=>refresh()}><RefreshCw size={15}/>Refresh</button></div>
    </section>

    <section className="scenario-catalog-card"><div><small>SELECTED SCENARIO</small><h2>{scenario.id} · {scenario.name}</h2><p>{scenario.description}</p></div><div className="scenario-parameters"><span>Water demand × <b>{scenario.waterDemandMultiplier}</b></span><span>PV availability × <b>{scenario.pvAvailabilityMultiplier}</b></span><span>Battery × <b>{scenario.batteryAvailabilityMultiplier}</b></span><span>Cooling × <b>{scenario.coolingLoadMultiplier}</b></span><span>Reserve × <b>{scenario.reserveMultiplier}</b></span></div><p className="scenario-assumption">{scenario.assumptionNote}</p></section>

    {error&&<div className="scenario-lab-warning">{error}</div>}
    {active&&<>
      <section className="scenario-lab-meta"><div><small>EXPERIMENT</small><strong>{active.experimentId}</strong></div><div><small>RUN</small><strong>{active.runId}</strong></div><div><small>SCENARIO</small><strong>{active.scenario.id}</strong></div><div><small>STATE</small><strong>{active.stateId}</strong></div><div><small>MODEL</small><strong>{active.modelVersion}</strong></div><div><small>EVIDENCE</small><strong>{active.evidenceMode}</strong></div></section>
      {active.warnings.map(w=><div className="scenario-lab-warning" key={w}>{w}</div>)}
      <section className="scenario-best"><FlaskConical/><div><small>LOWEST MODELED CONSEQUENCE IN THIS RUN</small><h2>{label(active.bestStrategy)}</h2><p>Weighted consequence score <strong>{active.bestScore.toFixed(4)}</strong>. This is a scenario-comparison result, not an autonomous control command.</p></div><button onClick={()=>download(`${active.runId}.json`,exportScenarioRun(active))}><Download size={15}/>Export run</button></section>

      <section className="scenario-comparison"><h2>Baseline → scenario perturbation</h2><div>{comparison.map(([name,b,p,unit])=><article key={name}><span>{name}</span><div><strong>{b.toFixed(2)}</strong><i>→</i><strong>{p.toFixed(2)}</strong><small>{unit}</small></div></article>)}</div></section>

      <section className="scenario-strategies"><h2>Management strategy ranking</h2><div className="scenario-strategy-grid">{active.strategies.map(s=><article key={s.strategy} className={s.rank===1?'scenario-winner':''}><header><span>#{s.rank} · {s.status}</span><strong>{s.consequenceScore.toFixed(4)}</strong></header><h3>{label(s.strategy)}</h3><p>{s.explanation}</p><dl><div><dt>Irrigation served</dt><dd>{Math.round(s.irrigationFraction*100)}%</dd></div><div><dt>Pumping allocation</dt><dd>{s.pumpingEnergyAllocatedKwh.toFixed(1)} kWh</dd></div><div><dt>Cooling allocation</dt><dd>{s.coolingEnergyAllocatedKwh.toFixed(1)} kWh</dd></div><div><dt>Reserve retained</dt><dd>{s.reserveEnergyRetainedKwh.toFixed(1)} kWh</dd></div><div><dt>Crop-risk index</dt><dd>{s.expectedCropRiskIndex.toFixed(3)}</dd></div><div><dt>Food-loss index</dt><dd>{s.expectedFoodLossRiskIndex.toFixed(3)}</dd></div></dl></article>)}</div></section>

      <section className="scenario-repro"><h2>Reproducibility record</h2><p><strong>Parameter version:</strong> {active.parameterVersion}</p><p><strong>Upstream lineage:</strong> {active.waterAnalysisId} · {active.energyAnalysisId}</p><code>{active.reproducibilityKey}</code></section>
    </>}

    {!active&&<section className="scenario-empty"><h2>No experiment run persisted yet</h2><p>Select a Twin State and scenario, then run the experiment. Results are persisted in this browser with explicit lineage and parameter versions.</p></section>}

    {history.length>0&&<section className="scenario-history"><h2>Experiment history</h2>{history.slice(0,12).map(r=><button key={r.runId} onClick={()=>setActive(r)}><strong>{r.scenario.id} · {r.scenario.name}</strong><span>{r.runId}</span><span>{label(r.bestStrategy)} · {r.bestScore.toFixed(3)}</span><span>{new Date(r.createdAt).toLocaleString()}</span></button>)}</section>}
  </div>
}
