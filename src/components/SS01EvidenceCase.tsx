import { useState } from 'react'
import configuration from '../../docs/model-laboratory/ss01-v0.1/SS01-parameters.json'
import layoutUrl from '../../docs/model-laboratory/ss01-v0.1/SS01-dimensioned-layout.svg'
import parametersUrl from '../../docs/model-laboratory/ss01-v0.1/SS01-parameters.json?url'

const requirements = [
  ['site', 'Site and comparison boundary', 'Coordinates, elevation, dates, equal land area, crop and management shared by SS01 and open sun.'],
  ['geometry', 'SS01 physical design', 'Dimensioned drawing; module count, dimensions and rated power; row spacing, height, tilt, azimuth and tracking status. The concept image is not a specification.'],
  ['weather', 'Weather and radiation', 'Timestamped weather file, units, time zone, source, coverage and quality checks; identify measured versus reanalysis data.'],
  ['soil', 'Soil and irrigation', 'Soil profile, hydraulic parameters, initial conditions, rooting depth, irrigation schedule, application efficiency, pump head and efficiency, with sources.'],
  ['crop', 'Crop and observations', 'Cultivar, planting and harvest dates, crop parameters and paired open-sun/AV observations where available. Record absent observations explicitly.'],
  ['economics', 'Costs and energy use', 'Dated equipment/installation quotes, operating costs, electricity import/export tariffs and load data; distinguish quotes from assumptions.'],
] as const

export function SS01EvidenceCase() {
  const [entries, setEntries] = useState<Record<string, string>>({})
  function download() {
    const payload = { schemaVersion: 'ss01-evidence-case-1.0', caseId: 'SS01-vs-open-sun', status: 'proposed-geometry-evidence-unverified', configuration, simulationReady: false, results: null, generatedAt: new Date().toISOString(), comparison: 'Same site, period, land area, crop and management; explicitly document treatment differences.', evidence: requirements.map(([id, title]) => ({ id, title, referenceAndNotes: entries[id] || null, verified: false })), missing: requirements.filter(([id]) => !entries[id]?.trim()).map(([id]) => id), limitations: 'References are user-entered notes, not uploaded or validated source files. No geometry-driven model or validated SS01 result is available. Completing notes does not enable simulation.' }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = 'SS01-open-sun-evidence-case.json'; a.click(); URL.revokeObjectURL(url)
  }
  return <section aria-labelledby="ss01-case"><h2 id="ss01-case">SS01 versus open sun — evidence case</h2>
    <p><strong>Awaiting source evidence. No SS01 performance results are available.</strong> The proposed SS01 v0.1 geometry is loaded below. Hardware specifications, site data and performance validation remain unresolved.</p>
    <h3>SS01 GardenLift — proposed engineering configuration v0.1</h3>
    <p>Design choices for review, not measured specifications or construction approval. The values below come directly from the downloadable parameter record.</p>
    <div className="av-table-scroll"><table><caption>Proposed geometry and derived capacity; no performance prediction</caption><thead><tr><th scope="col">Parameter</th><th scope="col">Value</th></tr></thead><tbody>{[
      ['Gross area per plot', `${configuration.derived.plot_area_m2} m²`],
      ['Planted area per plot', `${configuration.derived.planted_area_per_plot_m2} m²`],
      ['Modules', `${configuration.design_inputs.row_count} rows × ${configuration.design_inputs.modules_per_row} modules`],
      ['DC capacity target', `${configuration.derived.dc_capacity_target_kWp} kWp`],
      ['Module rating target', `${configuration.design_inputs.module_rating_target_Wp} Wp; supplier not selected`],
      ['Module envelope', `${configuration.design_inputs.module_slope_length_m} × ${configuration.design_inputs.module_east_west_width_m} m; provisional`],
      ['Row length / pitch', `${configuration.derived.row_length_including_gaps_m.toFixed(3)} m / ${configuration.design_inputs.row_pitch_m} m`],
      ['Tilt / azimuth', `${configuration.design_inputs.surface_tilt_deg}° / ${configuration.design_inputs.surface_azimuth_deg_clockwise_from_north}° from true north`],
      ['Lower / upper module edge', `${configuration.design_inputs.lower_module_edge_height_m.toFixed(3)} m / ${configuration.derived.upper_module_edge_height_m.toFixed(3)} m`],
    ].map(([label,value])=><tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody></table></div>
    <figure style={{margin:'1rem 0'}}><img src={layoutUrl} alt="Dimensioned SS01 and open-sun plot plans and side elevation: two rows at six metre pitch, twelve modules, six beds per plot" style={{display:'block',width:'100%',height:'auto'}}/><figcaption>Separate local plot coordinates; drawing placement does not establish control separation. Blue rectangles are module projections, not predicted shadows.</figcaption></figure>
    <div className="av-toolbar"><a href={layoutUrl} target="_blank" rel="noreferrer">Open full-size dimensioned layout</a><a href={layoutUrl} download="SS01-dimensioned-layout.svg">Download layout (SVG)</a><a href={parametersUrl} download="SS01-parameters.json">Download engineering parameters (JSON)</a></div>
    <details><summary>Unresolved engineering inputs</summary><ul>{configuration.unresolved.map(item=><li key={item}>{item}</li>)}</ul></details>
    <p>Record the source document or dataset reference and relevant values with units below. These notes are unverified and stay in this page until exported; reloading clears them. Data files are not uploaded by this form.</p>
    {requirements.map(([id, title, help]) => <details key={id}><summary>{title} — {entries[id]?.trim() ? 'reference recorded; unverified' : id === 'geometry' ? 'proposed v0.1 loaded; unverified' : 'missing evidence'}</summary><p>{help}</p><label className="av-field">Source reference, values, units and unresolved gaps<textarea rows={4} value={entries[id] || ''} onChange={e => setEntries(previous => ({ ...previous, [id]: e.target.value }))}/></label></details>)}
    <p><strong>Calculation status:</strong> geometry-driven radiation/PV, paired water/crop response and observation-based validation are not connected. Economic performance cannot be established until supported energy, water, crop and cost inputs are available. Demonstration outputs below are excluded from this case.</p>
    <button type="button" onClick={download}>Export SS01 evidence case (JSON)</button>
  </section>
}
