import { useState } from 'react'
import { Link } from 'react-router-dom'
import './OregonDigitalTwinPreview.css'

type Section = 'overview'|'design'|'simulation'|'analysis'|'evidence'
const sections: {key:Section;name:string}[] = [
  {key:'overview',name:'Overview'},{key:'design',name:'System design'},
  {key:'simulation',name:'Simulation'},{key:'analysis',name:'FEW analysis'},
  {key:'evidence',name:'Evidence'}
]
const inputs = [
  ['Study area','Oregon · illustrative'],
  ['Configuration','Fixed tilt · 3 × 4 modules'],
  ['Tilt / orientation','25° · 180°'],
  ['Pitch / clearance','6.00 m · 1.50 m'],
  ['Module size','1.10 × 2.00 m'],
  ['Surface albedo','0.20'],
  ['Weather source','Synthetic EPW fixture']
]
const checks = [
  ['Reference evapotranspiration','FAO-56 published-example test implemented','Latest revision not verified in CI'],
  ['Radiation engine','bifacial_radiance integration prepared','Actual ray-tracing outputs unverified'],
  ['Weather forcing','Deterministic 8,760-hour EPW generator','Synthetic; not observed Oregon weather'],
  ['Ground irradiance','31-sensor configuration specified','Convergence and open-field comparison pending'],
  ['Field comparison','No measured observations connected','Empirical validation not started'],
]
function ArrayDiagram({view}:{view:'plan'|'elevation'}) {
  return <svg className="odt-array" viewBox="0 0 720 325" role="img" aria-label={view==='plan'?'Conceptual overhead plan of three rows of four modules':'Conceptual elevation of agrivoltaic modules over crops'}>
    <rect width="720" height="325" fill="#f1f3ef"/>
    {view==='plan'?<>
      {Array.from({length:3},(_,row)=>Array.from({length:4},(_,col)=><g key={row+'-'+col}>
        <rect x={45+col*165} y={35+row*91} width="138" height="52" rx="2" fill="#234c46" stroke="#b4c8bc" strokeWidth="2"/>
        <path d={`M${114+col*165} ${37+row*91}v48 M${47+col*165} ${61+row*91}h134`} stroke="#638a7c" strokeWidth="1.5"/>
      </g>))}
      <path d="M45 305H675" stroke="#81998b" strokeWidth="1" strokeDasharray="4 6"/>
      <text x="45" y="318" fill="#62776c" fontSize="11">PLAN VIEW  /  3 ROWS × 4 MODULES  /  NOT TO SCALE</text>
    </>:<>
      <path d="M28 259H692" stroke="#7b9584" strokeWidth="2"/>
      {Array.from({length:3},(_,i)=><g key={i}>
        <path d={`M${80+i*220} 161l140 -47l8 20l-140 47z`} fill="#234c46" stroke="#779b8c" strokeWidth="2"/>
        <path d={`M${95+i*220} 180v79 M${205+i*220} 142v117`} stroke="#6b7e73" strokeWidth="5"/>
        {Array.from({length:4},(_,j)=><path key={j} d={`M${95+i*220+j*30} 259q-8 -24 -14 -22m14 22q8 -23 16 -21`} fill="none" stroke="#6d9d6b" strokeWidth="2"/>)}
      </g>)}
      <text x="35" y="302" fill="#62776c" fontSize="11">ELEVATION STUDY  /  SCHEMATIC ONLY  /  NOT TO SCALE</text>
    </>}
  </svg>
}
function Output({name,detail}:{name:string;detail:string}) {
  return <div className="odt-output"><span>{name}</span><strong>—</strong><small>{detail}</small></div>
}
export function OregonDigitalTwinPreview(){
  const [section,setSection]=useState<Section>('overview')
  const [view,setView]=useState<'plan'|'elevation'>('plan')
  return <div className="odt-shell">
    <header className="odt-topbar">
      <div className="odt-brand"><span className="odt-mark">CF</span><span><strong>CHIPU-FEW <em>/</em> OREGON</strong><small>Scientific digital twin · Research preview 0.1</small></span></div>
      <div className="odt-top-actions"><span className="odt-preview-tag">ISOLATED WORKSPACE</span><Link className="odt-return" to="/app">← Main platform</Link></div>
    </header>
    <div className="odt-body">
      <aside className="odt-rail">
        <div className="odt-rail-title">RESEARCH WORKBENCH</div>
        <nav aria-label="Oregon workbench">{sections.map((s,i)=><button key={s.key} className={section===s.key?'odt-rail-item odt-rail-active':'odt-rail-item'} onClick={()=>setSection(s.key)}><span>{String(i+1).padStart(2,'0')}</span>{s.name}</button>)}</nav>
        <div className="odt-rail-note"><strong>Scientific release</strong><span>Not yet verified</span><p>Results are withheld until execution and numerical checks pass.</p></div>
      </aside>
      <main className="odt-main">
        <div className="odt-heading"><div><span className="odt-kicker">OREGON RESEARCH / {section.toUpperCase()}</span><h1>{section==='overview'?'Agrivoltaic system workbench':sections.find(s=>s.key===section)?.name}</h1><p>Fixed-tilt agrivoltaics · Food–energy–water coupling · Illustrative Oregon configuration</p></div><span className="odt-state">RESEARCH PREVIEW <b>·</b> UNVERIFIED</span></div>
        <div className="odt-inline-note"><strong>Evidence classification:</strong> The geometry and weather fixture are illustrative. No site observations or independently verified Radiance outputs are represented here.</div>
        {(section==='overview'||section==='design')&&<div className="odt-workgrid">
          <section className="odt-panel odt-input-panel"><div className="odt-panel-heading"><span>01 / MODEL CONFIGURATION</span><h2>System definition</h2></div><div className="odt-inputs">{inputs.map(([k,v])=><div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div><div className="odt-input-footer">Read-only reference geometry · Not field surveyed</div></section>
          <section className="odt-panel odt-visual-panel"><div className="odt-panel-heading odt-visual-heading"><div><span>02 / ARRAY GEOMETRY</span><h2>Physical system</h2></div><div className="odt-view-switch"><button className={view==='plan'?'selected':''} onClick={()=>setView('plan')}>Plan</button><button className={view==='elevation'?'selected':''} onClick={()=>setView('elevation')}>Elevation</button></div></div><div className="odt-visual-body"><ArrayDiagram view={view}/><div className="odt-figure-legend"><span><b>12</b> modules</span><span><b>3</b> rows</span><span><b>6 m</b> pitch</span><span><b>25°</b> tilt</span></div><p>Conceptual geometry generated from model parameters; not a surveyed installation, engineering drawing or ray-tracing result.</p></div></section>
        </div>}
        {(section==='overview'||section==='analysis')&&<section className="odt-panel odt-results"><div className="odt-panel-heading"><span>03 / FOOD–ENERGY–WATER</span><h2>Model output register</h2><p>Blank values are intentional: no validated numerical outputs are connected.</p></div><div className="odt-outputs"><Output name="FOOD / CROP RESPONSE" detail="Yield and soil state not computed"/><Output name="ENERGY / IRRADIANCE" detail="Ray tracing not verified"/><Output name="WATER / ET₀ & IRRIGATION" detail="No Oregon site run"/></div></section>}
        {section==='simulation'&&<div className="odt-workgrid"><section className="odt-panel odt-input-panel"><div className="odt-panel-heading"><span>SIMULATION INPUTS</span><h2>Available model components</h2></div><div className="odt-inputs">{[['Radiation','bifacial_radiance integration'],['Weather','Synthetic EPW (smoke test only)'],['Evapotranspiration','FAO-56 reference calculation'],['Run mode','CI / scientific Python package']].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div></section><section className="odt-panel odt-visual-panel"><div className="odt-panel-heading"><span>EXECUTION CONTROL</span><h2>Scientific runs</h2></div><div className="odt-simulation"><strong>Simulation execution is not available from this preview.</strong><p>The scientific package executes separately through the isolated research workflow. No run button is shown until a secure, traceable execution service is integrated.</p><a href="https://github.com/Profgabby/chipu-few-intelligence/actions" target="_blank" rel="noreferrer">Inspect research workflow ↗</a></div></section></div>}
        {section==='evidence'&&<section className="odt-panel odt-evidence"><div className="odt-panel-heading"><span>VERIFICATION REGISTER</span><h2>Scientific methods and outstanding checks</h2></div><div className="odt-checks">{checks.map(([name,implemented,pending])=><div key={name}><strong>{name}</strong><span>{implemented}</span><small>{pending}</small></div>)}</div><a className="odt-source" href="https://github.com/Profgabby/chipu-few-intelligence/tree/feature/oregon-av-digital-twin-v01/scientific-core/oregon-av" target="_blank" rel="noreferrer">Scientific source and documentation ↗</a></section>}
        <footer className="odt-footer"><span>CHIPU-FEW INTELLIGENCE / OREGON · Scientific prototype, not validated decision support</span><Link to="/app">Return to main platform ↗</Link></footer>
      </main>
    </div>
  </div>
}
