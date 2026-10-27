import { useState } from 'react'
import { Link } from 'react-router-dom'
import './OregonDigitalTwinPreview.css'

type Section = 'overview'|'design'|'simulation'|'analysis'|'evidence'
const sections: {key:Section;name:string}[] = [
  {key:'overview',name:'Overview'},{key:'design',name:'Site & system'},
  {key:'simulation',name:'Simulation'},{key:'analysis',name:'FEW analysis'},
  {key:'evidence',name:'Evidence'}
]
const evidence = [
  {name:'FAO-56 reference evapotranspiration',source:'FAO Irrigation and Drainage Paper 56 · Chapter 4, Example 17',value:'5.72 mm/day',scope:'Published Bangkok example; NOT an Oregon observation',status:'Published reference',url:'https://www.fao.org/4/x0490e/x0490e08.htm'},
  {name:'Oregon measured meteorological series',source:'No measured dataset attached to this workspace',value:'Unavailable',scope:'Site-specific ET₀ cannot be calculated',status:'Data required'},
  {name:'Surveyed Oregon agrivoltaic geometry',source:'No field-survey or as-built array specification supplied',value:'Unavailable',scope:'No physical installation geometry can be asserted',status:'Data required'},
  {name:'Radiance numerical results',source:'Ray-tracing workflow exists; verified output not yet supplied',value:'Unavailable',scope:'No measured or validated irradiance results',status:'Verification required'},
  {name:'Crop, soil and irrigation observations',source:'No paired AV/open-field field measurements attached',value:'Unavailable',scope:'Cannot estimate treatment effect',status:'Data required'},
]
const fields = [
  ['Study-site coordinates','Not supplied','Surveyed coordinates / site identifier'],
  ['PV geometry','Not supplied','As-built module, tilt, pitch, clearance and azimuth'],
  ['Meteorological forcing','Not connected','Observed or documented TMY weather series with time zone'],
  ['Soil and crop inputs','Not connected','Measured soil hydraulic parameters, crop and management records'],
  ['Open-field control','Not connected','Matched treatment and control measurements'],
]
function EvidenceTable(){return <div className="odt-data-table-wrap"><table className="odt-data-table"><thead><tr><th>Scientific quantity</th><th>Value / status</th><th>Evidence and applicability</th></tr></thead><tbody>{evidence.map(e=><tr key={e.name}><td><strong>{e.name}</strong><small>{e.source}</small></td><td><strong>{e.value}</strong><small>{e.status}</small></td><td>{e.scope}{e.url&&<a href={e.url} target="_blank" rel="noreferrer">Primary source ↗</a>}</td></tr>)}</tbody></table></div>}
export function OregonDigitalTwinPreview(){
 const [section,setSection]=useState<Section>('overview')
 return <div className="odt-shell">
  <header className="odt-topbar"><div className="odt-brand"><span className="odt-mark">CF</span><span><strong>CHIPU-FEW <em>/</em> OREGON</strong><small>Research data and model verification</small></span></div><div className="odt-top-actions"><span className="odt-preview-tag">DEVELOPMENT BRANCH</span><Link className="odt-return" to="/app">← Main platform</Link></div></header>
  <div className="odt-body"><aside className="odt-rail"><div className="odt-rail-title">RESEARCH WORKBENCH</div><nav aria-label="Oregon workbench">{sections.map((s,i)=><button key={s.key} className={section===s.key?'odt-rail-item odt-rail-active':'odt-rail-item'} onClick={()=>setSection(s.key)}><span>{String(i+1).padStart(2,'0')}</span>{s.name}</button>)}</nav><div className="odt-rail-note"><strong>Scientific release</strong><span>Site data not connected</span><p>Published benchmarks are distinguished from Oregon observations and model results.</p></div></aside>
  <main className="odt-main"><div className="odt-heading"><div><span className="odt-kicker">OREGON RESEARCH / {section.toUpperCase()}</span><h1>{section==='overview'?'Oregon research data workspace':sections.find(s=>s.key===section)?.name}</h1><p>Evidence-first agrivoltaic modeling · Source traceability · Paired treatment design</p></div><span className="odt-state">SITE VALIDATION PENDING</span></div>
   <div className="odt-inline-note"><strong>Data integrity:</strong> The synthetic EPW and demonstration array have been removed from the displayed research dataset. A published benchmark is not an Oregon observation. Site-dependent results remain unavailable until actual inputs and verified model outputs are connected.</div>
   {section==='overview'&&<><section className="odt-panel odt-results"><div className="odt-panel-heading"><span>01 / DATA READINESS</span><h2>Available scientific evidence</h2><p>One published reference benchmark is identified. No verified Oregon site observations or simulation results are connected.</p></div><EvidenceTable/></section><section className="odt-panel odt-comparison"><div className="odt-panel-heading"><span>02 / STUDY DESIGN</span><h2>Paired agrivoltaic and open-field analysis</h2><p>A matched comparison requires observed site inputs, an explicit control definition and reproducible simulations.</p></div><div className="odt-comparison-grid"><div className="odt-compare-col"><div className="odt-compare-title">Agrivoltaic treatment</div><div className="odt-compare-description">As-built geometry, crop observations and measured forcing required</div><div className="odt-compare-empty">No treatment dataset connected</div></div><div className="odt-compare-col"><div className="odt-compare-title">Open-field control</div><div className="odt-compare-description">Matched crop, soil, weather and management observations required</div><div className="odt-compare-empty">No control dataset connected</div></div></div></section></>}
   {section==='design'&&<section className="odt-panel"><div className="odt-panel-heading"><span>01 / SOURCE REQUIREMENTS</span><h2>Measured site and engineering inputs</h2><p>No assumed dimensions or coordinates are shown as real infrastructure.</p></div><div className="odt-checks">{fields.map(([name,value,requirement])=><div key={name}><strong>{name}</strong><span>{value}</span><small>{requirement}</small></div>)}</div></section>}
   {section==='simulation'&&<section className="odt-panel"><div className="odt-panel-heading"><span>02 / COMPUTATION</span><h2>Execution and numerical verification</h2></div><div className="odt-simulation"><strong>Site-specific simulation is not enabled.</strong><p>Radiance cannot generate defensible Oregon results without an authenticated weather series and defined array geometry. The existing synthetic EPW remains available only for isolated software tests and is not presented as research data.</p><a href="https://github.com/Profgabby/chipu-few-intelligence/actions" target="_blank" rel="noreferrer">Inspect GitHub Actions evidence ↗</a></div></section>}
   {section==='analysis'&&<section className="odt-panel odt-results"><div className="odt-panel-heading"><span>03 / FOOD–ENERGY–WATER</span><h2>Results by evidence class</h2><p>No Oregon treatment effects are calculated or inferred.</p></div><div className="odt-outputs"><div className="odt-output"><span>FOOD / CROP RESPONSE</span><strong>—</strong><small>Observed crop series required</small></div><div className="odt-output"><span>ENERGY / IRRADIANCE</span><strong>—</strong><small>Verified Radiance results required</small></div><div className="odt-output"><span>WATER / ET₀ & IRRIGATION</span><strong>—</strong><small>Observed weather and water balance required</small></div></div></section>}
   {section==='evidence'&&<section className="odt-panel"><div className="odt-panel-heading"><span>04 / SOURCE REGISTER</span><h2>Published references and missing site evidence</h2></div><EvidenceTable/><a className="odt-source" href="https://github.com/Profgabby/chipu-few-intelligence/tree/feature/oregon-av-digital-twin-v01/scientific-core/oregon-av" target="_blank" rel="noreferrer">Review scientific code and methods ↗</a></section>}
   <footer className="odt-footer"><span>CHIPU-FEW / OREGON · Only sourced benchmarks and documented data gaps are displayed</span><Link to="/app">Return to main platform ↗</Link></footer>
  </main></div>
 </div>
}
