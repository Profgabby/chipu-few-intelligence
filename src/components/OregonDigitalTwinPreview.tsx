import { useState } from 'react'
import { Link } from 'react-router-dom'
import './OregonDigitalTwinPreview.css'

const geometry = [
  ['Location', 'Oregon illustrative site'], ['Latitude / longitude', '45.30° N · 122.75° W'],
  ['Modules', '3 rows × 4 modules'], ['Module dimensions', '1.10 × 2.00 m'],
  ['Tilt / azimuth', '25° / 180°'], ['Row pitch', '6.00 m'],
  ['Module clearance', '1.50 m'], ['Ground albedo', '0.20'],
]
const gates = [
  {name:'FAO-56 reference equation',state:'Implemented',detail:'Published reference test exists; current-revision CI verification pending'},
  {name:'Synthetic weather fixture',state:'Illustrative',detail:'8,760-hour generated EPW, not observed Oregon weather'},
  {name:'Array and ground geometry',state:'Illustrative',detail:'Proposed layout, not surveyed or field calibrated'},
  {name:'Radiance ray tracing',state:'Pending',detail:'Numerical run and irradiance output not independently verified'},
  {name:'Ground-sensor convergence',state:'Pending',detail:'31 vs 61 sensor convergence and open-field control required'},
  {name:'Field validation',state:'Pending',detail:'No measured crop, soil, PV or irrigation comparison available'},
]
type Tab = 'overview' | 'geometry' | 'evidence'
export function OregonDigitalTwinPreview() {
  const [tab,setTab] = useState<Tab>('overview')
  return <div className="odt-shell">
    <header className="odt-topbar">
      <Link to="/oregon-digital-twin" className="odt-brand"><span className="odt-mark">O</span><span><strong>OREGON DIGITAL TWIN</strong><small>Agrivoltaic FEW research · v0.1</small></span></Link>
      <div className="odt-top-actions"><span className="odt-preview-tag">ISOLATED RESEARCH PREVIEW</span><Link className="odt-return" to="/app">← Return to CHIPU-FEW</Link></div>
    </header>
    <main className="odt-main">
      <div className="odt-intro"><div><div className="odt-kicker">OREGON · SCIENTIFIC MODEL WORKSPACE</div><h1>Agrivoltaic Digital Twin</h1><p>Explore proposed system geometry, food–energy–water model readiness, and reproducible scientific evidence in a dedicated Oregon workspace.</p></div><div className="odt-state"><span className="odt-status-dot"/><div><strong>Verification pending</strong><small>Research outputs are not validated</small></div></div></div>
      <nav className="odt-tabs" aria-label="Oregon digital twin sections">{([['overview','Research overview'],['geometry','System & geometry'],['evidence','Evidence & methods']] as const).map(([key,label])=><button key={key} className={tab===key?'odt-tab odt-tab-active':'odt-tab'} onClick={()=>setTab(key)} aria-current={tab===key?'page':undefined}>{label}</button>)}</nav>
      <div className="odt-notice"><strong>Illustrative research environment.</strong> This preview contains proposed geometry and software-readiness information, not live sensor measurements or validated Radiance, crop, energy or irrigation results.</div>
      {tab==='overview'&&<>
        <section className="odt-kpis" aria-label="Food energy water readiness">
          {[
            ['FOOD','Crop and soil response','Awaiting data','No measured yield or soil-water series'],
            ['ENERGY','PV and irradiance','Awaiting simulation','Radiance numerical verification pending'],
            ['WATER','ET₀ and irrigation','Awaiting model run','FAO-56 reference ≠ site forecast'],
            ['RESEARCH','Scientific release gate','Not approved','Independent verification required'],
          ].map(([label,title,value,note])=><article className="odt-kpi" key={label}><div className="odt-kpi-label">{label}</div><h3>{title}</h3><strong>{value}</strong><p>{note}</p></article>)}
        </section>
        <section className="odt-grid">
          <article className="odt-panel odt-panel-wide"><div className="odt-panel-head"><div><span className="odt-eyebrow">SYSTEM CONCEPT</span><h2>Proposed agrivoltaic array</h2></div><button className="odt-text-button" onClick={()=>setTab('geometry')}>Explore geometry →</button></div><div className="odt-panel-body">
            <svg className="odt-array" viewBox="0 0 640 250" role="img" aria-label="Illustrative overhead schematic with three rows of four solar modules, not to scale">
              <rect x="0" y="0" width="640" height="250" rx="12" fill="#edf4ee"/>
              {Array.from({length:3},(_,row)=>Array.from({length:4},(_,col)=><g key={row+'-'+col}><rect x={46+col*145} y={26+row*76} width="116" height="45" rx="4" fill="#195b4c" stroke="#b6d5c3" strokeWidth="2"/><path d={`M${104+col*145} ${28+row*76}v41 M${48+col*145} ${48+row*76}h112`} stroke="#659d8a" strokeWidth="1.5"/></g>))}
            </svg><div className="odt-schematic-caption">12-module conceptual plan · 3 rows · not to scale · not a Radiance output</div>
          </div></article>
          <article className="odt-panel"><div className="odt-panel-head"><div><span className="odt-eyebrow">RESEARCH INTEGRITY</span><h2>Scientific readiness</h2></div></div><div className="odt-panel-body"><div className="odt-readiness"><span>Implementation</span><strong>In progress</strong></div><div className="odt-readiness"><span>Numerical verification</span><strong>Pending</strong></div><div className="odt-readiness"><span>Empirical validation</span><strong>Pending</strong></div><button className="odt-text-button" onClick={()=>setTab('evidence')}>View verification gates →</button></div></article>
        </section>
      </>}
      {tab==='geometry'&&<section className="odt-panel"><div className="odt-panel-head"><div><span className="odt-eyebrow">SIMULATION INPUTS</span><h2>Geometry and forcing assumptions</h2></div></div><div className="odt-panel-body"><div className="odt-details">{geometry.map(([name,value])=><div key={name}><span>{name}</span><strong>{value}</strong></div>)}</div><p className="odt-footnote">These are synthetic configuration values from the research prototype, not measurements from a surveyed installation. Weather forcing is a deterministic smoke-test fixture and must not be interpreted as observed meteorology.</p></div></section>}
      {tab==='evidence'&&<section className="odt-panel"><div className="odt-panel-head"><div><span className="odt-eyebrow">PROVENANCE & VALIDATION</span><h2>Scientific verification register</h2></div></div><div className="odt-panel-body"><div className="odt-gates">{gates.map(g=><div className="odt-gate" key={g.name}><div><strong>{g.name}</strong><p>{g.detail}</p></div><span>{g.state}</span></div>)}</div><a className="odt-source" href="https://github.com/Profgabby/chipu-few-intelligence/tree/feature/oregon-av-digital-twin-v01/scientific-core/oregon-av" target="_blank" rel="noreferrer">Review source code and research documentation ↗</a></div></section>}
      <footer className="odt-footer"><span>CHIPU-FEW Intelligence · Oregon research preview · No validated results displayed</span><Link to="/app">Return to main platform →</Link></footer>
    </main>
  </div>
}
