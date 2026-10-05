import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Database, Download, RefreshCw, ShieldCheck } from 'lucide-react'
import { farmState } from '../lib/cropsmart-model'
import { useResearchContext } from '../lib/research-context'
import {
import { ResearchWorkspaceGrammar } from './ResearchWorkspaceGrammar'
  buildTwinState,
  exportTwinStateJson,
  listTwinStates,
  type StateEvidenceMode,
  type TwinStateEstimate,
} from '../lib/state-engine'

function download(name: string, content: string, type = 'application/json') {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([content], { type }))
  link.download = name
  link.click()
  URL.revokeObjectURL(link.href)
}

function qualityClass(value: string) {
  return value.toLowerCase().replace(/_/g, '-')
}

function formatAge(hours: number | null) {
  if (hours === null) return '—'
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`
  return `${hours.toFixed(hours < 10 ? 1 : 0)} h`
}

export function TwinStateWorkspace() {
  const { zoneId, setZoneId, setStateRun } = useResearchContext()
  const [evidenceMode, setEvidenceMode] = useState<StateEvidenceMode>('SYNTHETIC')
  const [state, setState] = useState<TwinStateEstimate | null>(null)
  const [history, setHistory] = useState<TwinStateEstimate[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const loadHistory = async () => setHistory(await listTwinStates())

  useEffect(() => {
    loadHistory().catch(err => setError(err instanceof Error ? err.message : String(err)))
  }, [])

  const runState = async () => {
    setBusy(true)
    setError('')
    try {
      const next = await buildTwinState({
        farmId: 'CEDAR-CREEK',
        zoneId,
        evidenceMode,
        modelVersion: 'STATE-ENGINE-0.1.0',
      })
      setState(next)
      setStateRun(next.id)
      await loadHistory()
      window.dispatchEvent(new CustomEvent('cropsmart-toast', { detail: `${next.id} created · ${next.aggregateQuality}` }))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const components = state?.components ?? []
  const grouped = useMemo(() => ({
    water: components.filter(item => ['soil_water_rootzone', 'tank_level', 'water_flow', 'irrigation_pressure'].includes(item.variable)),
    energy: components.filter(item => ['pv_power', 'pump_power', 'battery_soc'].includes(item.variable)),
    environment: components.filter(item => ['air_temperature', 'relative_humidity', 'shortwave_radiation', 'par', 'canopy_temperature'].includes(item.variable)),
  }), [components])

  return <div className="workspace twin-state-workspace">
    <header className="workspace-header twin-state-header">
      <div>
        <div className="eyebrow eyebrow-status"><span className="status-dot" />OBSERVATION-INFORMED STATE ESTIMATION</div>
        <h1>Twin State</h1>
        <p>Convert quality-controlled observations into a versioned state estimate with freshness, uncertainty, assimilation weight, and source lineage.</p>
      </div>
      <div className="workspace-controls">
        <label>ZONE
          <select value={zoneId} onChange={event => setZoneId(event.target.value)}>
            <option>AV-A</option><option>OPEN-A</option><option>AV-B</option><option>EXPERIMENTAL-A</option>
          </select>
        </label>
        <label>EVIDENCE MODE
          <select value={evidenceMode} onChange={event => setEvidenceMode(event.target.value as StateEvidenceMode)}>
            <option value="OBSERVED">OBSERVED · measured/manual only</option>
            <option value="COMPUTATIONAL">COMPUTATIONAL · modeled/predicted/derived</option>
            <option value="SYNTHETIC">SYNTHETIC · demonstration only</option>
          </select>
        </label>
        <button className="button button-primary" onClick={runState} disabled={busy}>
          <RefreshCw size={14} />{busy ? 'Building state…' : 'Run State Update'}
        </button>
      </div>
    </header>

    <ResearchWorkspaceGrammar active={['Context','Evidence / Observations','Inputs','Method / Model','State / Indicators','FEW Dependencies','Outputs','Uncertainty','Provenance']} />

    {error && <div className="state-error"><strong>State engine error</strong><span>{error}</span></div>}

    <div className="state-source-boundary">
      <ShieldCheck size={18} />
      <div><strong>Evidence boundary: {evidenceMode}</strong><span>The state engine queries only this source class. It does not silently mix observed, computational, and synthetic evidence.</span></div>
    </div>

    {!state ? <section className="panel state-empty">
      <div className="panel-body">
        <Database size={28} />
        <h2>Create the first state estimate</h2>
        <p>Select an evidence mode and run the update. Synthetic mode is appropriate for the current public demonstration; observed mode will use only real measured/manual records already stored in Data & Provenance.</p>
        <button className="button button-primary" onClick={runState} disabled={busy}><RefreshCw size={14} />Run State Update</button>
      </div>
    </section> : <>
      <section className="state-summary-grid">
        <div className="state-summary-card"><span>STATE ID</span><strong className="mono">{state.id}</strong><small>{new Date(state.createdAt).toLocaleString()}</small></div>
        <div className="state-summary-card"><span>QUALITY</span><strong className={`state-quality state-quality-${qualityClass(state.aggregateQuality)}`}>{state.aggregateQuality}</strong><small>{state.assimilatedCount}/{state.componentCount} assimilated</small></div>
        <div className="state-summary-card"><span>COMPLETENESS</span><strong>{state.completeness}%</strong><small>{state.missingCount} missing · {state.staleCount} stale</small></div>
        <div className="state-summary-card"><span>MODEL</span><strong className="mono">{state.modelVersion}</strong><small>{state.evidenceMode} evidence</small></div>
      </section>

      <div className="two-col state-main-grid">
        <section className="panel">
          <div className="panel-header"><div className="eyebrow">CURRENT STATE VECTOR</div><h2>Assimilated system state</h2></div>
          <div className="panel-body state-component-list">
            {components.map(item => <div className="state-component" key={item.variable}>
              <div className="state-component-main">
                <span className="state-variable-code">{item.variable}</span>
                <strong>{item.label}</strong>
                <small>{item.observationId ?? 'No eligible observation'}</small>
              </div>
              <div className="state-component-value">
                <strong>{item.value === null ? '—' : item.value}</strong><span>{item.unit}</span>
                {item.uncertainty !== null && <small>± {item.uncertainty}</small>}
              </div>
              <div className="state-component-status">
                <span className={`state-chip state-chip-${qualityClass(item.status)}`}>{item.status}</span>
                <small>{item.freshness} · {formatAge(item.ageHours)}</small>
              </div>
            </div>)}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header"><div className="eyebrow">TRACEABILITY</div><h2>State lineage</h2></div>
          <div className="panel-body state-lineage">
            <div className="state-lineage-row"><span>Farm</span><strong>{farmState.name}</strong></div>
            <div className="state-lineage-row"><span>Zone</span><strong>{state.zoneId}</strong></div>
            <div className="state-lineage-row"><span>Reference time</span><strong>{new Date(state.referenceTime).toLocaleString()}</strong></div>
            <div className="state-lineage-row"><span>Method</span><strong>{state.method}</strong></div>
            <div className="state-lineage-row"><span>Source observations</span><strong>{state.sourceObservationIds.length}</strong></div>
            <div className="state-lineage-row"><span>Evidence mode</span><strong>{state.evidenceMode}</strong></div>
            <div className="state-lineage-actions">
              <button className="button button-outline" onClick={() => download(`${state.id}.json`, exportTwinStateJson(state))}><Download size={14} />Export state JSON</button>
            </div>
            <div className="state-method-note"><CheckCircle2 size={15} /><span>FAIL observations are rejected. SUSPECT, STALE, and aging records are down-weighted and remain visible in lineage rather than being silently discarded.</span></div>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-header"><div className="eyebrow">UNCERTAINTY AND FRESHNESS</div><h2>State quality by subsystem</h2></div>
        <div className="panel-body state-subsystem-grid">
          {[['Water & hydraulic', grouped.water], ['Energy', grouped.energy], ['Environment & crop', grouped.environment]].map(([name, items]) => {
            const rows = items as typeof components
            const available = rows.filter(item => item.value !== null).length
            const assimilated = rows.filter(item => item.status === 'ASSIMILATED').length
            return <div className="state-subsystem" key={name as string}>
              <span>{name as string}</span><strong>{assimilated}/{rows.length} assimilated</strong><small>{available} values available</small>
              <div className="state-progress"><i style={{ width: `${rows.length ? (assimilated / rows.length) * 100 : 0}%` }} /></div>
            </div>
          })}
        </div>
      </section>
    </>}

    <section className="panel state-history-panel">
      <div className="panel-header"><div className="eyebrow">VERSIONED HISTORY</div><h2>Recent state estimates</h2></div>
      <div className="panel-body">
        {history.length === 0 ? <p className="muted">No persisted state estimates yet.</p> : <div className="state-history-list">
          {history.slice(0, 12).map(item => <button key={item.id} className="state-history-row" onClick={() => { setState(item); setEvidenceMode(item.evidenceMode); setStateRun(item.id) }}>
            <span className="mono">{item.id}</span><span>{item.zoneId}</span><span>{item.evidenceMode}</span><span>{item.completeness}%</span><span className={`state-quality state-quality-${qualityClass(item.aggregateQuality)}`}>{item.aggregateQuality}</span><span>{new Date(item.createdAt).toLocaleString()}</span>
          </button>)}
        </div>}
      </div>
    </section>

    <footer className="workspace-footer">STATE ENGINE 0.1.0 · browser-persistent research state store<span><CheckCircle2 size={13} />source-separated observation assimilation · no autonomous control</span></footer>
  </div>
}
