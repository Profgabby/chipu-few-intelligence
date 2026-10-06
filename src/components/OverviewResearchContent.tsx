import { waterEnergyDemo } from '../lib/water-energy-demo'
import { Link } from 'react-router-dom'
import { observations, farmState } from '../lib/cropsmart-model'
import type { CommandCenterState } from '../lib/command-center-engine'

export function OverviewResearchContent({zoneId,state}:{zoneId:string;state:CommandCenterState|null}) {
  const rows=observations(zoneId)
  const simulation=waterEnergyDemo()
  const series=[{key:'irrigation' as const,label:'Irrigation application',unit:'mm/h',color:'#006B3C'},{key:'pvKw' as const,label:'PV power',unit:'kW',color:'#FDB515'},{key:'pumpKw' as const,label:'Pumping power',unit:'kW',color:'#006B3C'}]
  const recent=[{label:'Twin state',run:state?.twin,to:'/app/twin'},{label:'Forecast',run:state?.forecast,to:'/app/predict'},{label:'Control analysis',run:state?.scenarioRun,to:'/app/control'}]
  return <>
    <section className="research-overview-grid">
      <article className="research-surface"><header><h2>Dataset summary</h2><span className="research-demo-label">Synthetic demonstration</span></header>
        <dl className="dataset-facts"><div><dt>Dataset</dt><dd>{farmState.dataset}</dd></div><div><dt>Zone</dt><dd>{zoneId}</dd></div><div><dt>Coverage · UTC</dt><dd>26 Aug–1 Sep 2026</dd></div><div><dt>Records / variables</dt><dd>{rows.length} / {new Set(rows.map(r=>r.variable)).size}</dd></div><div><dt>Quality flags</dt><dd>{rows.filter(r=>r.quality==='SUSPECT').length} suspect</dd></div><div><dt>Field measurements</dt><dd>Missing · no measured dataset connected</dd></div></dl>
        <Link to="/app/data">Inspect dataset →</Link>
      </article>
      <article className="research-surface"><header><h2>Water–energy simulation</h2><span className="research-demo-label">Illustrative · unvalidated</span></header>
        {series.map(s=>{const max=Math.max(0.1,...simulation.map(r=>r[s.key]))*1.1;return <div className="overview-plot" key={s.key}><strong>{s.label} · {s.unit}</strong><svg viewBox="0 0 580 100" role="img" aria-label={`${s.label}, seven simulated days, ${s.unit}`}><text x="0" y="16">{max.toFixed(2)}</text><text x="22" y="75">0</text><path d="M48 10V72H560" fill="none" stroke="#a9b9b1"/>{simulation.map(r=><circle key={r.hour} cx={48+r.hour/167*510} cy={72-r[s.key]/max*60} r="2" fill={s.color}><title>Day {Math.floor(r.hour/24)+1}, hour {r.hour%24}: {r[s.key].toFixed(3)} {s.unit}</title></circle>)}<text x="48" y="94">Day 1</text><text x="493" y="94">Day 7</text></svg></div>})}
        <details><summary>Simulation assumptions</summary><p>Separate illustrative scenario; not the observation dataset at left. Hourly steps; assumed daylight 06:00–18:00; 5 kW peak PV with daily cloud factors 1, 0.75, 0.9, 0.45, 0.8, 1, 0.65. Irrigation: 2 mm/h from 10:00–13:00 over 1,000 m² (6 m³/day). Pump: 25 m head, 60% efficiency; P = ρgQH/η. Pump demand follows water flow. No storage, grid dispatch, soil balance or site calibration. Hours are a scenario clock, not site time.</p></details>
        <p>Separate scales. Assumed operating behavior, not field measurements or validated predictions.</p>
      </article>
    </section>
    <section className="research-overview-grid">
      <article className="research-surface"><header><h2>Recent analyses</h2></header><p>Latest saved record per analysis type for this zone.</p>{recent.map(({label,run,to})=><div className="analysis-row" key={label}><div><strong>{label}</strong><small>{run?('id' in run?run.id:run.runId):'No saved analysis'}</small>{run&&<small>{'createdAt' in run?run.createdAt:'issuedAt' in run?run.issuedAt:''}</small>}</div><Link to={to}>{run?'Inspect':'Create'} →</Link></div>)}</article>
      <article className="research-surface"><header><h2>Next actions</h2></header><ol className="research-next-actions"><li><Link to="/app/data">Review observations and quality flags</Link><small>Check source records before analysis.</small></li><li><Link to={state?.twin?'/app/water':'/app/twin'}>{state?.twin?'Inspect water conditions':'Build a system snapshot'}</Link><small>{state?.twin?'Select the snapshot and review missing inputs.':'Select observations and a reference time.'}</small></li><li><Link to={state?.forecast?'/app/control':'/app/predict'}>{state?.forecast?'Compare control scenarios':'Prepare a forecast'}</Link><small>Review assumptions and evidence before running.</small></li></ol></article>
    </section>
  </>
}
