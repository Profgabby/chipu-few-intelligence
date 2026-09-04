import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, CheckCircle2, Database, Download, FileUp, Filter, Plus, RefreshCw, ShieldCheck } from 'lucide-react'
import { farmState } from '../lib/cropsmart-model'
import {
  addObservation,
  addObservationBatch,
  initializeObservationStore,
  observationCounts,
  observationCsvTemplate,
  parseObservationCsv,
  queryObservations,
  type ObservationInput,
  type ObservationRecord,
  type SourceMode,
} from '../lib/observation-store'
import {
  provenanceClasses,
  variableByKey,
  variableRegistry,
  type ObservationProvenance,
} from '../lib/variable-registry'
import { useResearchContext } from '../lib/research-context'

type Tab = 'QUERY' | 'MANUAL' | 'CSV' | 'REGISTRY'

type Counts = Awaited<ReturnType<typeof observationCounts>>

const blankCounts: Counts = { total: 0, observed: 0, computational: 0, synthetic: 0, suspect: 0, failed: 0 }

const initialManual = {
  timestamp: new Date().toISOString().slice(0, 16),
  farmId: 'CEDAR-CREEK',
  zoneId: 'AV-A',
  sensorId: 'soil-01',
  variable: 'soil_water_rootzone',
  value: '0.287',
  provenance: 'MANUAL' as ObservationProvenance,
  sourceName: 'Researcher manual entry',
  sourceDataset: '',
  uncertainty: '',
  note: '',
}

function downloadText(filename: string, text: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function csvEscape(value: unknown) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function recordsToCsv(rows: ObservationRecord[]) {
  const headers = ['timestamp', 'farmId', 'zoneId', 'sensorId', 'variable', 'value', 'unit', 'provenance', 'quality', 'sourceName', 'sourceDataset', 'uncertainty', 'note', 'id']
  return [headers.join(','), ...rows.map(row => headers.map(header => csvEscape(row[header as keyof ObservationRecord])).join(','))].join('\n')
}

export function DataProvenanceWorkspace() {
  const { zoneId } = useResearchContext()
  const [tab, setTab] = useState<Tab>('QUERY')
  const [rows, setRows] = useState<ObservationRecord[]>([])
  const [counts, setCounts] = useState<Counts>(blankCounts)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('Initializing persistent observation store…')
  const [sourceMode, setSourceMode] = useState<SourceMode>('OBSERVED')
  const [queryZone, setQueryZone] = useState(zoneId)
  const [queryVariable, setQueryVariable] = useState('')
  const [querySensor, setQuerySensor] = useState('')
  const [queryStart, setQueryStart] = useState('')
  const [queryEnd, setQueryEnd] = useState('')
  const [manual, setManual] = useState({ ...initialManual, zoneId })
  const [csvPreview, setCsvPreview] = useState<ObservationInput[]>([])
  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const [csvName, setCsvName] = useState('')

  const selectedDefinition = variableByKey[manual.variable]

  const refresh = async () => {
    setLoading(true)
    const [nextRows, nextCounts] = await Promise.all([
      queryObservations({
        farmId: 'CEDAR-CREEK',
        zoneId: queryZone || undefined,
        sensorId: querySensor || undefined,
        variable: queryVariable || undefined,
        sourceMode,
        start: queryStart || undefined,
        end: queryEnd || undefined,
        limit: 500,
      }),
      observationCounts(),
    ])
    setRows(nextRows)
    setCounts(nextCounts)
    setLoading(false)
    setMessage(`${nextRows.length} records returned · ${sourceMode} source boundary`)
  }

  useEffect(() => {
    initializeObservationStore()
      .then(refresh)
      .catch(error => {
        setLoading(false)
        setMessage(error instanceof Error ? error.message : 'Observation store initialization failed.')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setQueryZone(zoneId)
    setManual(current => ({ ...current, zoneId }))
  }, [zoneId])

  const sourceNotice = useMemo(() => {
    if (sourceMode === 'OBSERVED') return 'Observed mode contains only MEASURED and MANUAL records.'
    if (sourceMode === 'COMPUTATIONAL') return 'Computational mode contains MODELED, PREDICTED, and DERIVED records.'
    if (sourceMode === 'SYNTHETIC') return 'Synthetic demonstration mode is isolated from observed research records.'
    return 'ALL SOURCES intentionally combines source classes for inspection. Interpret mixed-source results with caution.'
  }, [sourceMode])

  const submitManual = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedDefinition) return
    const result = await addObservation({
      timestamp: manual.timestamp,
      farmId: manual.farmId,
      zoneId: manual.zoneId,
      sensorId: manual.sensorId,
      variable: manual.variable,
      value: Number(manual.value),
      unit: selectedDefinition.unit,
      provenance: manual.provenance,
      sourceName: manual.sourceName,
      sourceDataset: manual.sourceDataset || undefined,
      uncertainty: manual.uncertainty ? Number(manual.uncertainty) : undefined,
      note: manual.note || undefined,
    })
    if (!result.accepted) {
      setMessage(`Record rejected · ${result.messages.join(' ')}`)
      return
    }
    setMessage(`Observation stored · ${result.record?.id} · quality ${result.quality}`)
    setSourceMode(result.record?.provenance === 'SYNTHETIC' ? 'SYNTHETIC' : ['MEASURED', 'MANUAL'].includes(result.record?.provenance ?? '') ? 'OBSERVED' : 'COMPUTATIONAL')
    setQueryZone(manual.zoneId)
    await refresh()
  }

  const chooseCsv = async (file?: File) => {
    if (!file) return
    setCsvName(file.name)
    const parsed = parseObservationCsv(await file.text())
    setCsvPreview(parsed.rows)
    setCsvErrors(parsed.errors)
    setMessage(parsed.errors.length ? 'CSV structure requires correction.' : `${parsed.rows.length} CSV rows parsed and ready for validation.`)
  }

  const commitCsv = async () => {
    if (!csvPreview.length || csvErrors.length) return
    const result = await addObservationBatch(csvPreview)
    setMessage(`CSV import complete · ${result.accepted.length} accepted · ${result.suspect} suspect · ${result.rejected.length} rejected`)
    setCsvErrors(result.rejected.slice(0, 12).map(item => `Row ${item.row}: ${item.messages.join(' ')}`))
    setCsvPreview([])
    await refresh()
  }

  return <div className="workspace data-workspace">
    <header className="workspace-header data-workspace-header">
      <div>
        <div className="eyebrow eyebrow-status"><span className="status-dot" />Persistent evidence layer · browser database</div>
        <h1>Data & Provenance</h1>
        <p>Store, validate, separate, and query time-stamped scientific observations before they enter state estimation, prediction, or decision analysis.</p>
      </div>
      <div className="data-integrity-badge"><ShieldCheck size={18} /><span><b>Source separation enforced</b><small>No silent mixing of observed and synthetic records</small></span></div>
    </header>

    <div className="data-local-note"><Database size={15} /><span><b>Persistent research store:</b> records are stored in IndexedDB on this browser and domain. This is durable across reloads on this device, but it is not yet a shared multi-user server database.</span></div>

    <div className="data-kpis">
      <DataKpi label="Observed" value={counts.observed} note="MEASURED + MANUAL" />
      <DataKpi label="Computational" value={counts.computational} note="MODELED + PREDICTED + DERIVED" />
      <DataKpi label="Synthetic" value={counts.synthetic} note="ISOLATED DEMONSTRATION" />
      <DataKpi label="QC attention" value={counts.suspect + counts.failed} note={`${counts.suspect} SUSPECT · ${counts.failed} FAIL`} />
    </div>

    <div className="data-tabs" role="tablist">
      <button className={tab === 'QUERY' ? 'data-tab-active' : ''} onClick={() => setTab('QUERY')}>Observation query</button>
      <button className={tab === 'MANUAL' ? 'data-tab-active' : ''} onClick={() => setTab('MANUAL')}>Manual entry</button>
      <button className={tab === 'CSV' ? 'data-tab-active' : ''} onClick={() => setTab('CSV')}>CSV import</button>
      <button className={tab === 'REGISTRY' ? 'data-tab-active' : ''} onClick={() => setTab('REGISTRY')}>Variable registry</button>
    </div>

    {tab === 'QUERY' && <section className="panel data-panel">
      <div className="panel-header data-panel-header"><div><div className="eyebrow">TIME-SERIES QUERY</div><h2>Persistent observation database</h2></div><button className="button button-outline" onClick={() => downloadText('cropsmart-observation-query.csv', recordsToCsv(rows))}><Download size={14} />Export query</button></div>
      <div className="panel-body">
        <div className={`source-boundary source-${sourceMode.toLowerCase()}`}>
          {sourceMode === 'ALL' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <div><b>{sourceMode} SOURCE BOUNDARY</b><span>{sourceNotice}</span></div>
        </div>
        <div className="query-grid">
          <label>SOURCE CLASS<select value={sourceMode} onChange={event => setSourceMode(event.target.value as SourceMode)}><option value="OBSERVED">Observed only</option><option value="COMPUTATIONAL">Computational only</option><option value="SYNTHETIC">Synthetic demonstration only</option><option value="ALL">All sources — explicit mix</option></select></label>
          <label>ZONE<select value={queryZone} onChange={event => setQueryZone(event.target.value)}><option value="">All zones</option>{farmState.zones.map(item => <option key={item.id}>{item.id}</option>)}</select></label>
          <label>VARIABLE<select value={queryVariable} onChange={event => setQueryVariable(event.target.value)}><option value="">All variables</option>{variableRegistry.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
          <label>SENSOR<input value={querySensor} onChange={event => setQuerySensor(event.target.value)} placeholder="sensor id contains…" /></label>
          <label>START<input type="datetime-local" value={queryStart} onChange={event => setQueryStart(event.target.value)} /></label>
          <label>END<input type="datetime-local" value={queryEnd} onChange={event => setQueryEnd(event.target.value)} /></label>
          <button className="button button-primary query-run" onClick={refresh}><Filter size={14} />Run query</button>
        </div>
        <div className="data-message">{loading ? 'Reading persistent records…' : message}</div>
        <ObservationTable rows={rows} />
      </div>
    </section>}

    {tab === 'MANUAL' && <section className="panel data-panel">
      <div className="panel-header"><div className="eyebrow">CONTROLLED RESEARCH ENTRY</div><h2>Add one observation</h2></div>
      <div className="panel-body">
        <form className="manual-grid" onSubmit={submitManual}>
          <label>TIMESTAMP<input type="datetime-local" required value={manual.timestamp} onChange={event => setManual({ ...manual, timestamp: event.target.value })} /></label>
          <label>FARM ID<input required value={manual.farmId} onChange={event => setManual({ ...manual, farmId: event.target.value })} /></label>
          <label>ZONE<select value={manual.zoneId} onChange={event => setManual({ ...manual, zoneId: event.target.value })}>{farmState.zones.map(item => <option key={item.id}>{item.id}</option>)}</select></label>
          <label>SENSOR ID<input required value={manual.sensorId} onChange={event => setManual({ ...manual, sensorId: event.target.value })} /></label>
          <label>VARIABLE<select value={manual.variable} onChange={event => setManual({ ...manual, variable: event.target.value })}>{variableRegistry.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
          <label>VALUE<input type="number" step="any" required value={manual.value} onChange={event => setManual({ ...manual, value: event.target.value })} /></label>
          <label>UNIT<input readOnly value={selectedDefinition?.unit ?? ''} /></label>
          <label>PROVENANCE<select value={manual.provenance} onChange={event => setManual({ ...manual, provenance: event.target.value as ObservationProvenance })}>{provenanceClasses.map(item => <option key={item}>{item}</option>)}</select></label>
          <label>SOURCE NAME<input required value={manual.sourceName} onChange={event => setManual({ ...manual, sourceName: event.target.value })} /></label>
          <label>SOURCE DATASET<input value={manual.sourceDataset} onChange={event => setManual({ ...manual, sourceDataset: event.target.value })} placeholder="optional dataset/run" /></label>
          <label>UNCERTAINTY ±<input type="number" step="any" min="0" value={manual.uncertainty} onChange={event => setManual({ ...manual, uncertainty: event.target.value })} placeholder="optional" /></label>
          <label className="manual-note">NOTE<input value={manual.note} onChange={event => setManual({ ...manual, note: event.target.value })} placeholder="method, instrument condition, operator note…" /></label>
          <div className="variable-rule"><b>{selectedDefinition?.key}</b><span>Expected range {selectedDefinition?.min}–{selectedDefinition?.max} {selectedDefinition?.unit}</span><small>{selectedDefinition?.description}</small></div>
          <button className="button button-primary manual-submit" type="submit"><Plus size={14} />Validate & store observation</button>
        </form>
        <div className="data-message">{message}</div>
      </div>
    </section>}

    {tab === 'CSV' && <section className="panel data-panel">
      <div className="panel-header data-panel-header"><div><div className="eyebrow">BATCH INGESTION</div><h2>CSV validation and import</h2></div><button className="button button-outline" onClick={() => downloadText('cropsmart-observation-template.csv', observationCsvTemplate())}><Download size={14} />Download template</button></div>
      <div className="panel-body">
        <div className="upload-drop"><FileUp size={22} /><div><b>Select a CropSmart observation CSV</b><span>Rows are parsed first. Nothing is written until validation is accepted.</span></div><label className="button button-primary">Choose CSV<input type="file" accept=".csv,text/csv" hidden onChange={event => chooseCsv(event.target.files?.[0])} /></label></div>
        {csvName && <div className="upload-summary"><b>{csvName}</b><span>{csvPreview.length} parsed rows</span><span>{csvErrors.length} structural/import messages</span></div>}
        {csvErrors.length > 0 && <div className="csv-errors">{csvErrors.map((error, index) => <div key={`${error}-${index}`}><AlertTriangle size={14} />{error}</div>)}</div>}
        {csvPreview.length > 0 && <div className="csv-preview"><table><thead><tr><th>Timestamp</th><th>Zone</th><th>Sensor</th><th>Variable</th><th>Value</th><th>Provenance</th></tr></thead><tbody>{csvPreview.slice(0, 8).map((row, index) => <tr key={index}><td>{row.timestamp}</td><td>{row.zoneId}</td><td>{row.sensorId}</td><td>{row.variable}</td><td>{row.value} {row.unit}</td><td>{row.provenance}</td></tr>)}</tbody></table>{csvPreview.length > 8 && <small>Previewing first 8 of {csvPreview.length} rows.</small>}</div>}
        <div className="csv-actions"><button className="button button-primary" disabled={!csvPreview.length || csvErrors.length > 0} onClick={commitCsv}><Database size={14} />Validate & import batch</button><span>{message}</span></div>
      </div>
    </section>}

    {tab === 'REGISTRY' && <section className="panel data-panel">
      <div className="panel-header"><div className="eyebrow">CONTROLLED SCIENTIFIC DICTIONARY</div><h2>Variable registry</h2></div>
      <div className="panel-body">
        <div className="registry-table"><table><thead><tr><th>Key</th><th>Scientific variable</th><th>Unit</th><th>Expected range</th><th>Category</th><th>Allowed provenance</th></tr></thead><tbody>{variableRegistry.map(item => <tr key={item.key}><td className="mono green-text">{item.key}</td><td><b>{item.label}</b><small>{item.description}</small></td><td>{item.unit}</td><td>{item.min}–{item.max}</td><td>{item.category}</td><td className="registry-provenance">{item.sourceTypes.join(' · ')}</td></tr>)}</tbody></table></div>
        <div className="registry-foot"><ShieldCheck size={15} />Unknown variables and unit mismatches are rejected before storage; out-of-range values are retained only as explicitly SUSPECT records.</div>
      </div>
    </section>}

    <footer className="workspace-footer">OBSERVATION STORE · {counts.total} persistent records · {farmState.dataset}<span><CheckCircle2 size={13} />source lineage + QC retained for every stored value</span></footer>
  </div>
}

function DataKpi({ label, value, note }: { label: string; value: number; note: string }) {
  return <div className="data-kpi"><small>{label}</small><strong>{value.toLocaleString()}</strong><span>{note}</span></div>
}

function ObservationTable({ rows }: { rows: ObservationRecord[] }) {
  if (!rows.length) return <div className="empty-observations"><Database size={20} /><b>No records in this source boundary</b><span>Add a measured/manual record, change the query, or deliberately switch to the isolated synthetic demonstration dataset.</span></div>
  return <div className="table-wrap observation-table"><table><thead><tr>{['Time', 'Zone', 'Sensor', 'Variable', 'Value', 'Provenance', 'Quality', 'Source'].map(item => <th key={item}>{item}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><span className="mono">{new Date(row.timestamp).toISOString().replace('T', ' ').slice(0, 16)}</span><small>{row.id}</small></td><td className="mono">{row.zoneId}</td><td>{row.sensorId}</td><td><b>{variableByKey[row.variable]?.label ?? row.variable}</b><small className="mono">{row.variable}</small></td><td className="mono">{row.value} {row.unit}</td><td><span className={`provenance-chip provenance-${row.provenance.toLowerCase()}`}>{row.provenance}</span></td><td><span className={`quality-chip quality-${row.quality.toLowerCase()}`}>{row.quality}</span></td><td><span>{row.sourceName}</span><small>{row.sourceDataset ?? 'no dataset id'}</small></td></tr>)}</tbody></table></div>
}
