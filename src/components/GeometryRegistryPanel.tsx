import { GEOMETRY_REGISTRY,geometryMetrics,validateGeometry } from '../lib/geometry-registry'
export function GeometryRegistryPanel(){
 const invalid=GEOMETRY_REGISTRY.flatMap(g=>validateGeometry(g).map(error=>g.id+': '+error))
 return <section aria-labelledby="geometry-register"><h2 id="geometry-register">Engineering geometry register · v0.1</h2>
 <p>20 illustrative concepts across SS, MS, CS and RT. Dimensions are hypothetical engineering inputs, not measured products, site-calibrated models or evidence of crop-water savings. The RT family is catalogued here but is not yet executable in the annual web simulator.</p>
 <p role="status">{invalid.length?invalid.length+' configuration errors: '+invalid.join('; '):'20/20 illustrative geometry records pass basic dimensional and consistency checks.'}</p>
 <div className="av-table-scroll" role="region" aria-label="Illustrative design geometry" tabIndex={0}>
 <table><thead><tr><th>Design</th><th>Archetype</th><th>Revision</th><th>Pitch m</th><th>Clearance m</th><th>Tilt °</th><th>GCR %</th><th>Modules</th><th>DC kWp</th><th>Crop spacing m</th><th>Evidence</th></tr></thead>
 <tbody>{GEOMETRY_REGISTRY.map(g=>{const m=geometryMetrics(g);return <tr key={g.id}><th scope="row">{g.id}</th><td>{g.archetype}</td><td>{g.revision}</td><td>{g.pitchM.toFixed(2)}</td><td>{g.clearanceM.toFixed(2)}</td><td>{g.tiltDeg}</td><td>{(m.gcr*100).toFixed(1)}</td><td>{g.rows*g.modulesPerRow}</td><td>{m.calculatedDcKw.toFixed(2)}</td><td>{g.cropRowSpacingM.toFixed(2)}</td><td>{g.evidence}</td></tr>})}</tbody></table></div>
 <p><small>PV power assumes STC irradiance 1 kW/m² and illustrative 20% module efficiency. GCR uses cross-row projected table width; tracker and vertical-bifacial cases require time-dependent and orientation-aware calculations before site simulation. Registry values are not automatically applied to existing annual or daily simulation results.</small></p>
 </section>
}
