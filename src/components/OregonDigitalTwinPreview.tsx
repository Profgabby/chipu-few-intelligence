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
    <defs>
      <linearGradient id="odt-soil" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a08a69"/><stop offset="1" stopColor="#d7c6a4"/></linearGradient>
      <linearGradient id="odt-module" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#274c60"/><stop offset="1" stopColor="#112e3d"/></linearGradient>
      <pattern id="odt-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#dce4dd" strokeWidth=".7"/></pattern>
    </defs>
    <rect width="720" height="325" fill="#f6f8f5"/><rect width="720" height="325" fill="url(#odt-grid)"/>
    {view==='plan'?<>
      <rect x="36" y="27" width="648" height="258" fill="#dce8d6" stroke="#9cb3a2" strokeDasharray="5 4"/>
      {Array.from({length:3},(_,row)=>Array.from({length:4},(_,col)=><g key={row+'-'+col}>
        <rect x={52+col*160} y={46+row*76} width="128" height="40" rx="1" fill="url(#odt-module)" stroke="#5b8a96" strokeWidth="1.5"/>
        <path d={`M${116+col*160} ${47+row*76}v38 M${53+col*160} ${66+row*76}h126`} stroke="#7b9eab" strokeWidth="1"/>
      </g>))}
      <path d="M36 305H684" stroke="#7b9183" strokeDasharray="4 4"/><text x="36" y="318" fill="#526b60" fontSize="10">PLAN / CONCEPTUAL MODULE ARRANGEMENT / NOT TO SCALE</text>
    </>:<>
      <path d="M25 248H694V290H25Z" fill="url(#odt-soil)" stroke="#8e795f"/>
      <path d="M25 267H694 M25 279H694" stroke="#b09b7e" strokeDasharray="3 5"/>
      {Array.from({length:3},(_,i)=><g key={i}>
        <path d={`M${54+i*222} 156l151 -58l12 26l-151 58z`} fill="url(#odt-module)" stroke="#42687b" strokeWidth="2"/>
        <path d={`M${91+i*222} 142l12 26 M${130+i*222} 127l12 26 M${169+i*222} 113l12 26`} stroke="#799eaf" strokeWidth="1.5"/>
        <path d={`M${76+i*222} 181v67 M${199+i*222} 130v118`} stroke="#596b66" strokeWidth="5"/>
        <path d={`M${68+i*222} 185l138 -52l26 115h-164z`} fill="#8ca7a0" fillOpacity=".12" stroke="#8ca7a0" strokeDasharray="4 5"/>
      </g>)}
      {Array.from({length:21},(_,i)=><g key={i} transform={`translate(${36+i*32} 248)`}>
        <path d="M0 0v-19m0 10q-11-12-15-9m15 5q12-13 16-10" stroke="#4d8553" strokeWidth="2.4" fill="none"/>
        <path d="M0 0q-7 12-5 19 M0 0q8 13 6 21" stroke="#795f46" strokeWidth="1.2" fill="none"/>
      </g>)}
      <path d="M34 307H686" stroke="#6d8274" strokeWidth="1"/><text x="35" y="320" fill="#526b60" fontSize="10">SECTION / PV STRUCTURE · CROP CANOPY · SOIL ROOT ZONE / CONCEPTUAL ONLY</text>
      <g fill="#3f6655" fontSize="10"><text x="45" y="35">PV ARRAY</text><path d="M89 38L115 128" stroke="#6a8b78" fill="none"/><text x="530" y="38">CROP CANOPY</text><path d="M585 42L575 227" stroke="#6a8b78" fill="none"/><text x="532" y="300">SOIL PROFILE</text></g>
    </>}
  </svg>
}
function Output({name,detail}:{name:string;detail:string}) {
  return <div className="odt-output"><span>{name}</span><strong>—</strong><small>{detail}</small></div>
}
export function OregonDigitalTwinPreview(){
  const [section,setSection]=useState<Section>('overview')
  const [view,setView]=useState<'plan'|'elevation'>('elevation')
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
          <section className="odt-panel odt-visual-panel"><div className="odt-panel-heading odt-visual-heading"><div><span>02 / ARRAY GEOMETRY</span><h2>Physical system</h2></div><div className="odt-view-switch"><button className={view==='plan'?'selected':''} onClick={()=>setView('plan')}>Plan</button><button className={view==='elevation'?'selected':''} onClick={()=>setView('elevation')}>Elevation</button></div></div><div className="odt-visual-body"><ArrayDiagram view={view}/><div className="odt-figure-legend"><span><b>12</b> modules</span><span><b>3</b> rows</span><span><b>6 m</b> pitch</span><span><b>25°</b> tilt</span></div><p>Conceptual engineering section. Array dimensions are illustrative; shadows, plant spacing and structure are not a calibrated rendering.</p></div></section>
        </div>}
        {(section==='overview'||section==='analysis')&&<section className="odt-panel odt-results"><div className="odt-panel-heading"><span>03 / FOOD–ENERGY–WATER</span><h2>Model output register</h2><p>Blank values are intentional: no validated numerical outputs are connected.</p></div><div className="odt-outputs"><Output name="FOOD / CROP RESPONSE" detail="Yield and soil state not computed"/><Output name="ENERGY / IRRADIANCE" detail="Ray tracing not verified"/><Output name="WATER / ET₀ & IRRIGATION" detail="No Oregon site run"/></div></section>}
        {section==='simulation'&&<div className="odt-workgrid"><section className="odt-panel odt-input-panel"><div className="odt-panel-heading"><span>SIMULATION INPUTS</span><h2>Available model components</h2></div><div className="odt-inputs">{[['Radiation','bifacial_radiance integration'],['Weather','Synthetic EPW (smoke test only)'],['Evapotranspiration','FAO-56 reference calculation'],['Run mode','CI / scientific Python package']].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div></section><section className="odt-panel odt-visual-panel"><div className="odt-panel-heading"><span>EXECUTION CONTROL</span><h2>Scientific runs</h2></div><div className="odt-simulation"><strong>Simulation execution is not available from this preview.</strong><p>The scientific package executes separately through the isolated research workflow. No run button is shown until a secure, traceable execution service is integrated.</p><a href="https://github.com/Profgabby/chipu-few-intelligence/actions" target="_blank" rel="noreferrer">Inspect research workflow ↗</a></div></section></div>}
        {section==='evidence'&&<section className="odt-panel odt-evidence"><div className="odt-panel-heading"><span>VERIFICATION REGISTER</span><h2>Scientific methods and outstanding checks</h2></div><div className="odt-checks">{checks.map(([name,implemented,pending])=><div key={name}><strong>{name}</strong><span>{implemented}</span><small>{pending}</small></div>)}</div><a className="odt-source" href="https://github.com/Profgabby/chipu-few-intelligence/tree/feature/oregon-av-digital-twin-v01/scientific-core/oregon-av" target="_blank" rel="noreferrer">Scientific source and documentation ↗</a></section>}
        <footer className="odt-footer"><span>CHIPU-FEW INTELLIGENCE / OREGON · Scientific prototype, not validated decision support</span><Link to="/app">Return to main platform ↗</Link></footer>
      </main>
    </div>
  </div>
}
