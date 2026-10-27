import { Link } from 'react-router-dom'

const geometry = [
  ['Location', 'Oregon illustrative site · 45.30° N, 122.75° W'],
  ['Array', '3 rows × 4 modules per row'],
  ['Module dimensions', '1.10 m × 2.00 m'],
  ['Tilt / azimuth', '25° / 180°'],
  ['Row pitch', '6.00 m'],
  ['Module clearance', '1.50 m'],
  ['Ground albedo', '0.20'],
]
const statuses = [
  ['FAO-56 reference ET', 'Published example test implemented', 'Benchmark execution on latest revision not confirmed'],
  ['Synthetic EPW', 'Deterministic 8,760-hour fixture implemented', 'Not observed weather or a validated meteorological dataset'],
  ['Radiance geometry', 'Illustrative array defined', 'Not surveyed or field calibrated'],
  ['Radiance ray tracing', 'Execution workflow configured', 'Numerical results not yet verified'],
  ['Ground irradiance', '31-sensor sampling specified', 'Convergence and independent comparison pending'],
]
export function OregonDigitalTwinPreview() {
  return <main className="workspace" style={{maxWidth:1320}}>
    <header className="workspace-header">
      <div><div className="eyebrow">OREGON RESEARCH · ISOLATED PREVIEW · V0.1</div>
        <h1>Oregon Agrivoltaic Digital Twin</h1>
        <p>Food–energy–water research workspace for a proposed Oregon agrivoltaic system. This interface displays design assumptions and verification gates; it does not represent live telemetry, measured crop outcomes, or validated simulation results.</p>
      </div>
      <Link className="button button-outline" to="/app">Back to overview</Link>
    </header>
    <div role="status" style={{marginTop:18,padding:'14px 18px',border:'1px solid #e5c987',borderRadius:9,background:'#fff8e8',color:'#75500b',fontSize:13}}>
      <strong>Scientific status: NOT VALIDATED.</strong> Geometry and forcing are illustrative. Radiance outputs are unavailable until an actual run and independent numerical verification pass. No observed Oregon performance is implied.
    </div>
    <section className="module-stack">
      <div className="metric-grid">
        {[
          ['FOOD','Crop yield / soil-water response','Not calculated','No measured crop or soil inputs'],
          ['ENERGY','PV generation / irradiance','Not calculated','Radiance numerical gate pending'],
          ['WATER','ET₀ / irrigation demand','Not calculated','Reference test is not a site forecast'],
          ['MODEL','Research readiness','Verification pending','No advisor-reviewable outputs'],
        ].map(([tag,label,value,note])=><article className="metric-card" key={tag}>
          <div className="eyebrow">{tag}</div><div className="metric-label">{label}</div>
          <div className="metric-value" style={{fontSize:19}}>{value}</div><div className="metric-meta">{note}</div>
        </article>)}
      </div>
      <div className="two-col">
        <section className="panel"><div className="panel-header"><div className="eyebrow">SIMULATION SETUP</div><h2>Illustrative Oregon array</h2></div>
          <div className="panel-body">
            <svg viewBox="0 0 560 235" role="img" aria-label="Schematic plan view of three rows with four solar modules per row; not to scale" style={{width:'100%',maxHeight:245,background:'#f5f9f5',borderRadius:8}}>
              {Array.from({length:3},(_,row)=>Array.from({length:4},(_,col)=><g key={row+'-'+col}>
                <rect x={38+col*130} y={23+row*72} width="112" height="40" rx="3" fill="#1e6651" stroke="#e8b842" strokeWidth="2"/>
                <line x1={94+col*130} y1={25+row*72} x2={94+col*130} y2={61+row*72} stroke="#9bbcb0"/>
                <line x1={40+col*130} y1={43+row*72} x2={148+col*130} y2={43+row*72} stroke="#9bbcb0"/>
              </g>))}
            </svg>
            <p className="muted">Schematic top view · 12 modules · not to scale · not a Radiance rendering</p>
            <div className="detail-grid" style={{marginTop:18}}>
              {geometry.map(([label,value])=><div key={label} style={{padding:'9px 0',borderBottom:'1px solid #e1e9e3'}}><span className="muted">{label}</span><strong>{value}</strong></div>)}
            </div>
          </div>
        </section>
        <section className="panel"><div className="panel-header"><div className="eyebrow">PROVENANCE</div><h2>Input classification</h2></div>
          <div className="panel-body">
            <div className="list">
              {[
                ['Geometry','Illustrative, not field-surveyed'],
                ['Weather','Deterministic synthetic EPW; not observed'],
                ['Reference physics','FAO-56 example implemented'],
                ['Ray-tracing software','bifacial_radiance integration; execution pending'],
                ['Validation','No field validation or verified ray-tracing output'],
              ].map(([a,b])=><div className="list-row" key={a}><span><strong>{a}</strong><small>{b}</small></span></div>)}
            </div>
            <a className="text-link" href="https://github.com/Profgabby/chipu-few-intelligence/tree/feature/oregon-av-digital-twin-v01/scientific-core/oregon-av" target="_blank" rel="noreferrer">View scientific source and documentation ↗</a>
          </div>
        </section>
      </div>
      <section className="panel"><div className="panel-header"><div className="eyebrow">SCIENTIFIC ACCEPTANCE</div><h2>Verification gates</h2></div>
        <div className="panel-body"><div className="table-wrap"><table><thead><tr><th>Component</th><th>Implementation</th><th>Outstanding evidence</th></tr></thead>
        <tbody>{statuses.map(([a,b,c])=><tr key={a}><td><strong>{a}</strong></td><td>{b}</td><td>{c}</td></tr>)}</tbody></table></div></div>
      </section>
      <section className="panel"><div className="panel-header"><div className="eyebrow">MODEL OUTPUTS</div><h2>Results withheld until verified</h2></div>
        <div className="panel-body"><p style={{fontSize:13,lineHeight:1.7}}>No irradiance, PV output, evapotranspiration, irrigation saving, soil moisture or crop-yield result is displayed as a measured or validated Oregon result. Once numerical evidence passes the release gate, this area can show versioned comparisons with explicit units, weather provenance, uncertainty and reproducible run identifiers.</p></div>
      </section>
    </section>
  </main>
}
