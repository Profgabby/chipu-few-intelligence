import { useState } from 'react'

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
    const payload = { schemaVersion: 'ss01-evidence-case-1.0', caseId: 'SS01-vs-open-sun', status: 'evidence-intake-unverified', simulationReady: false, results: null, generatedAt: new Date().toISOString(), comparison: 'Same site, period, land area, crop and management; explicitly document treatment differences.', evidence: requirements.map(([id, title]) => ({ id, title, referenceAndNotes: entries[id] || null, verified: false })), missing: requirements.filter(([id]) => !entries[id]?.trim()).map(([id]) => id), limitations: 'References are user-entered notes, not uploaded or validated source files. No geometry-driven model or validated SS01 result is available. Completing notes does not enable simulation.' }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = 'SS01-open-sun-evidence-case.json'; a.click(); URL.revokeObjectURL(url)
  }
  return <section aria-labelledby="ss01-case"><h2 id="ss01-case">SS01 versus open sun — evidence case</h2>
    <p><strong>Awaiting source evidence. No SS01 performance results are available.</strong> The repository contains a concept illustration and demonstration parameters, but no traceable SS01 engineering specification or paired site dataset for this case.</p>
    <p>Record the source document or dataset reference and relevant values with units below. These notes are unverified and stay in this page until exported; reloading clears them. Data files are not uploaded by this form.</p>
    {requirements.map(([id, title, help]) => <details key={id}><summary>{title} — {entries[id]?.trim() ? 'reference recorded; unverified' : 'missing evidence'}</summary><p>{help}</p><label className="av-field">Source reference, values, units and unresolved gaps<textarea rows={4} value={entries[id] || ''} onChange={e => setEntries(previous => ({ ...previous, [id]: e.target.value }))}/></label></details>)}
    <p><strong>Calculation status:</strong> geometry-driven radiation/PV, paired water/crop response and observation-based validation are not connected. Economic performance cannot be established until supported energy, water, crop and cost inputs are available. Demonstration outputs below are excluded from this case.</p>
    <button type="button" onClick={download}>Export SS01 evidence case (JSON)</button>
  </section>
}
