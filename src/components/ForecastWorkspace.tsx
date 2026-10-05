import { useEffect, useState } from 'react'
import { Download, Play, RefreshCw } from 'lucide-react'
import { exportForecastJson, listForecasts, runForecast, type ForecastRun } from '../lib/forecast-engine'
import { listTwinStates, type TwinStateEstimate } from '../lib/state-engine'
import { ResearchWorkspaceGrammar } from './ResearchWorkspaceGrammar'

function download(name: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url)
}

export function ForecastWorkspace() {
  const [states, setStates] = useState<TwinStateEstimate[]>([])
  const [history, setHistory] = useState<ForecastRun[]>([])
  const [selectedState, setSelectedState] = useState('')
  const [active, setActive] = useState<ForecastRun | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function refresh() {
    const [s, f] = await Promise.all([listTwinStates(30), listForecasts(20)])
    setStates(s); setHistory(f); if (!selectedState && s[0]) setSelectedState(s[0].id); if (!active && f[0]) setActive(f[0])
  }
  useEffect(() => { refresh().catch(e => setError(String(e))) }, [])

  async function execute() {
    if (!selectedState) { setError('Create a Twin State before running prediction.'); return }
    setBusy(true); setError('')
    try { const result = await runForecast({ initialStateId: selectedState, horizonHours: 72, stepHours: 3 }); setActive(result); await refresh() }
    catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setBusy(false) }
  }

  const checkpoints = active?.points.filter(p => [0, 24, 48, 72].includes(p.leadHours)) ?? []
  return <div className="forecast-engine-workspace">
    <ResearchWorkspaceGrammar active={['Context','Inputs','Method / Model','State / Indicators','FEW Dependencies','Outputs','Uncertainty','Provenance']} note="Prediction consumes a persisted Twin State. Deterministic demonstration forcing and expanding uncertainty remain explicitly identified." />
    <section className="forecast-hero">
      <div><span className="research-kicker">PREDICTIVE DIGITAL TWIN · RESEARCH DEMONSTRATION</span><h1>Forecast & Prediction</h1><p>State-initialized +24 / +48 / +72 hour trajectories with explicit issue time, forcing, lineage, and expanding uncertainty.</p></div>
      <div className="forecast-actions"><select value={selectedState} onChange={e=>setSelectedState(e.target.value)}><option value="">Select Twin State</option>{states.map(s=><option key={s.id} value={s.id}>{s.id} · {s.evidenceMode} · {s.aggregateQuality}</option>)}</select><button onClick={execute} disabled={busy}><Play size={15}/>{busy?'Running…':'Run 72 h Prediction'}</button><button onClick={()=>refresh()}><RefreshCw size={15}/>Refresh</button></div>
    </section>
    {error && <div className="forecast-warning">{error}</div>}
    {active && <>
      <section className="forecast-meta"><div><small>PREDICTION ID</small><strong>{active.id}</strong></div><div><small>INITIAL STATE</small><strong>{active.initialStateId}</strong></div><div><small>ISSUED</small><strong>{new Date(active.issuedAt).toLocaleString()}</strong></div><div><small>EVIDENCE</small><strong>{active.evidenceMode}</strong></div><div><small>MODEL</small><strong>{active.modelVersion}</strong></div><div><small>STATUS</small><strong>{active.status}</strong></div></section>
      {active.warnings.map(w=><div className="forecast-warning" key={w}>{w}</div>)}
      <section className="forecast-checkpoints">{checkpoints.map(p=><article key={p.leadHours}><span>+{p.leadHours} h</span><h3>{p.soilWater?.toFixed(3) ?? '—'} <small>m³/m³</small></h3><p>Root-zone water</p><dl><div><dt>PV power</dt><dd>{p.pvPower?.toFixed(1) ?? '—'} kW</dd></div><div><dt>Battery</dt><dd>{p.batterySoc?.toFixed(1) ?? '—'}%</dd></div><div><dt>Tank</dt><dd>{p.tankLevel?.toFixed(1) ?? '—'}%</dd></div><div><dt>Uncertainty ×</dt><dd>{p.uncertaintyMultiplier}</dd></div></dl></article>)}</section>
      <section className="forecast-table-card"><div className="forecast-table-head"><div><h2>Prediction trajectory</h2><p>Every row is tied to the persisted initial state and a forecast lead time.</p></div><button onClick={()=>download(`${active.id}.json`,exportForecastJson(active))}><Download size={15}/>Export JSON</button></div><div className="forecast-table-wrap"><table><thead><tr><th>Lead</th><th>Valid time</th><th>Soil water</th><th>95-ish research band</th><th>PV</th><th>Tank</th><th>Battery</th><th>Water demand</th><th>Irrigation</th></tr></thead><tbody>{active.points.map(p=><tr key={p.leadHours}><td>+{p.leadHours} h</td><td>{new Date(p.validTime).toLocaleString()}</td><td>{p.soilWater?.toFixed(4)??'—'}</td><td>{p.lowerSoilWater?.toFixed(4)??'—'}–{p.upperSoilWater?.toFixed(4)??'—'}</td><td>{p.pvPower?.toFixed(2)??'—'} kW</td><td>{p.tankLevel?.toFixed(1)??'—'}%</td><td>{p.batterySoc?.toFixed(1)??'—'}%</td><td>{p.cropWaterDemand.toFixed(3)} mm</td><td>{p.irrigationRequirement.toFixed(3)} mm</td></tr>)}</tbody></table></div></section>
      <section className="forecast-method"><h2>Method & limitations</h2><p>{active.method}. Forcing source: <strong>{active.forcingSource}</strong>. This release implements the prediction architecture and reproducible trajectory contract. Its deterministic forcing and simplified process equations are demonstration models and are not presented as independently field-validated predictive models.</p></section>
    </>}
    {!active && <section className="forecast-empty"><h2>No persisted prediction yet</h2><p>Create a Twin State, select it above, and run the 72-hour trajectory.</p></section>}
    {history.length>0 && <section className="forecast-history"><h2>Prediction history</h2>{history.slice(0,8).map(r=><button key={r.id} onClick={()=>setActive(r)}><strong>{r.id}</strong><span>{r.initialStateId}</span><span>{new Date(r.issuedAt).toLocaleString()}</span></button>)}</section>}
  </div>
}
