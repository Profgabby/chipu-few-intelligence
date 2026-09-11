import { Link } from 'react-router-dom'
import { ArrowRight, CircleAlert, Database, Layers3 } from 'lucide-react'
import { CHIPU_MODULES, CHIPU_PRODUCT } from '../lib/chipu-modules'

const architecture = [
  'People + Place',
  'Food ↔ Energy ↔ Water',
  'Twin',
  'Predict',
  'Control',
  'Economics + Resilience',
  'Decision Support',
]

export function ChipuOverviewWorkspace() {
  return <div className="workspace chipu-overview">
    <header className="workspace-header chipu-overview-hero">
      <div>
        <div className="eyebrow eyebrow-status"><span className="status-dot" />INTEGRATED FEW RESEARCH PLATFORM</div>
        <h1>{CHIPU_PRODUCT.name}</h1>
        <p>{CHIPU_PRODUCT.descriptor}</p>
      </div>
    </header>

    <section className="panel">
      <div className="panel-header"><div className="eyebrow">SYSTEM ARCHITECTURE</div><h2>One platform, ten connected decision modules</h2></div>
      <div className="panel-body">
        <div className="chipu-architecture-flow">{architecture.map((item,index)=><div key={item} className="chipu-architecture-step"><strong>{item}</strong>{index<architecture.length-1&&<span>↓</span>}</div>)}</div>
      </div>
    </section>

    <section className="panel">
      <div className="panel-header"><div className="eyebrow">MODULES</div><h2>Scientific and decision architecture</h2></div>
      <div className="panel-body chipu-module-grid">
        {CHIPU_MODULES.map(module=><Link className="chipu-module-card" key={module.id} to={module.route}>
          <div><span className={`chipu-status chipu-status-${module.status}`}>{module.status==='implemented'?'Mapped capability':'Foundation'}</span><h3>{module.name}</h3><p>{module.description}</p></div><ArrowRight size={16}/>
        </Link>)}
      </div>
    </section>

    <section className="two-col">
      <article className="panel"><div className="panel-header"><div className="eyebrow">DATA STATE</div><h2>Production-safe empty states</h2></div><div className="panel-body"><div className="callout"><Database size={18}/><div><strong>No production values are fabricated.</strong><p>Measured, manually entered, modeled, predicted, synthetic and derived records remain explicitly distinguishable. Connect a data source or run a documented model to populate scientific outputs.</p></div></div></div></article>
      <article className="panel"><div className="panel-header"><div className="eyebrow">SCOPE</div><h2>Broader than one application</h2></div><div className="panel-body"><div className="callout"><Layers3 size={18}/><div><strong>Integrated FEW applications</strong><p>Agrivoltaics, farm photovoltaic systems, irrigation, batteries, farm microgrids, pumping, water storage, cold storage, processing and controlled-environment agriculture can reuse the same module architecture.</p></div></div><div className="callout callout-amber"><CircleAlert size={18}/><div><strong>Scientific capability remains evidence-bound.</strong><p>Advanced models that are not implemented are shown as not configured rather than represented by synthetic production values.</p></div></div></div></article>
    </section>
  </div>
}
