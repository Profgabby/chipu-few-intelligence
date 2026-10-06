import { Link } from 'react-router-dom'
import { observations, farmState } from '../lib/cropsmart-model'
import type { CommandCenterState } from '../lib/command-center-engine'

export function OverviewResearchContent({zoneId,state}:{zoneId:string;state:CommandCenterState|null}) {
  const rows=observations(zoneId)
  const series=[{variable:'irrigation_flow',label:'Irrigation flow',color:'#006B3C'},{variable:'pv_power',label:'PV power',color:'#FDB515'}]
  const start=Date.parse(rows[0].time),end=Date.parse(rows[rows.length-1].time)
  const recent=[{label:'Twin state',run:state?.twin,to:'/app/twin'},{label:'Forecast',run:state?.forecast,to:'/app/predict'},{label:'Control analysis',run:state?.scenarioRun,to:'/app/control'}]
  return <>
    <section className="research-overview-grid">
      <article className="research-surface"><header><h2>Dataset summary</h2><span className="research-demo-label">Synthetic demonstration</span></header>
        <dl className="dataset-facts"><div><dt>Dataset</dt><dd>{farmState.dataset}</dd></div><div><dt>Zone</dt><dd>{zoneId}</dd></div><div><dt>Coverage · UTC</dt><dd>26 Aug–1 Sep 2026</dd></div><div><dt>Records / variables</dt><dd>{rows.length} / {new Set(rows.map(r=>r.variable)).size}</dd></div><div><dt>Quality flags</dt><dd>{rows.filter(r=>r.quality==='SUSPECT').length} suspect</dd></div><div><dt>Field measurements</dt><dd>Missing · no measured dataset connected</dd></div></dl>
        <Link to="/app/data">Inspect dataset →</Link>
      </article>
      <article className="research-surface"><header><h2>Water–energy observations</h2><span className="research-demo-label">Synthetic demonstration</span></header>
        {series.map(s=>{const values=rows.filter(r=>r.variable===s.variable);const max=Math.max(...values.map(r=>r.value))*1.1;return <div className="overview-plot" key={s.variable}><strong>{s.label} · {values[0].unit}</strong><svg viewBox="0 0 580 100" role="img" aria-label={`${s.label}, synthetic samples from 26 August to 1 September 2026; range zero to ${max.toFixed(1)} ${values[0].unit}`}><text x="0" y="16">{max.toFixed(1)}</text><text x="22" y="75">0</text><path d="M48 10V72H560" fill="none" stroke="#a9b9b1"/>{values.map(r=><circle key={r.id} cx={48+(Date.parse(r.time)-start)/(end-start)*510} cy={72-r.value/max*60} r="3.5" fill={s.color} stroke="#173f31" strokeWidth=".5"><title>{r.time}: {r.value} {r.unit} · {r.provenance}</title></circle>)}<text x="48" y="94">26 Aug</text><text x="493" y="94">1 Sep · UTC</text></svg></div>})}
        <p>Separate scales; points show available samples. Variables are sampled at different hours. No interpolation or measured values implied.</p>
      </article>
    </section>
    <section className="research-overview-grid">
      <article className="research-surface"><header><h2>Recent analyses</h2></header><p>Latest saved record per analysis type for this zone.</p>{recent.map(({label,run,to})=><div className="analysis-row" key={label}><div><strong>{label}</strong><small>{run?('id' in run?run.id:run.runId):'No saved analysis'}</small>{run&&<small>{'createdAt' in run?run.createdAt:'issuedAt' in run?run.issuedAt:''}</small>}</div><Link to={to}>{run?'Inspect':'Create'} →</Link></div>)}</article>
      <article className="research-surface"><header><h2>Next actions</h2></header><ol className="research-next-actions"><li><Link to="/app/data">Review observations and quality flags</Link><small>Check source records before analysis.</small></li><li><Link to={state?.twin?'/app/water':'/app/twin'}>{state?.twin?'Inspect water conditions':'Build a system snapshot'}</Link><small>{state?.twin?'Select the snapshot and review missing inputs.':'Select observations and a reference time.'}</small></li><li><Link to={state?.forecast?'/app/control':'/app/predict'}>{state?.forecast?'Compare control scenarios':'Prepare a forecast'}</Link><small>Review assumptions and evidence before running.</small></li></ol></article>
    </section>
  </>
}
