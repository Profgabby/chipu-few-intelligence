import { queryObservations, type ObservationRecord, type SourceMode } from './observation-store'
import { variableByKey, type ObservationQuality } from './variable-registry'

const DB_NAME = 'cropsmart-twin-state-db'
const DB_VERSION = 1
const STORE = 'states'

export type StateEvidenceMode = Exclude<SourceMode, 'ALL'>

export type StateComponent = {
  variable: string
  label: string
  value: number | null
  unit: string
  observationId?: string
  sensorId?: string
  observationTimestamp?: string
  provenance?: string
  observationQuality?: ObservationQuality
  freshness: 'CURRENT' | 'AGING' | 'STALE' | 'MISSING'
  ageHours: number | null
  uncertainty: number | null
  lower: number | null
  upper: number | null
  assimilationWeight: number
  status: 'ASSIMILATED' | 'HELD' | 'REJECTED' | 'MISSING'
  note: string
}

export type TwinStateEstimate = {
  id: string
  farmId: string
  zoneId: string
  evidenceMode: StateEvidenceMode
  createdAt: string
  referenceTime: string
  modelVersion: string
  method: string
  componentCount: number
  assimilatedCount: number
  missingCount: number
  staleCount: number
  completeness: number
  aggregateQuality: 'PASS' | 'WATCH' | 'INSUFFICIENT'
  sourceObservationIds: string[]
  components: StateComponent[]
}

const STATE_VARIABLES = [
  'soil_water_rootzone',
  'tank_level',
  'pv_power',
  'pump_power',
  'water_flow',
  'battery_soc',
  'air_temperature',
  'relative_humidity',
  'shortwave_radiation',
  'par',
  'canopy_temperature',
  'irrigation_pressure',
] as const

const FRESHNESS_HOURS: Record<string, number> = {
  soil_water_rootzone: 6,
  tank_level: 2,
  pv_power: 1,
  pump_power: 1,
  water_flow: 1,
  battery_soc: 1,
  air_temperature: 1,
  relative_humidity: 1,
  shortwave_radiation: 1,
  par: 1,
  canopy_temperature: 2,
  irrigation_pressure: 1,
}

const DEFAULT_RELATIVE_UNCERTAINTY: Record<string, number> = {
  soil_water_rootzone: 0.05,
  tank_level: 0.02,
  pv_power: 0.03,
  pump_power: 0.03,
  water_flow: 0.03,
  battery_soc: 0.02,
  air_temperature: 0.02,
  relative_humidity: 0.03,
  shortwave_radiation: 0.05,
  par: 0.06,
  canopy_temperature: 0.03,
  irrigation_pressure: 0.04,
}

function openStateDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser.'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt')
        store.createIndex('zoneId', 'zoneId')
        store.createIndex('evidenceMode', 'evidenceMode')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open Twin State database.'))
  })
}

function stateId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `STATE-${stamp}-${suffix}`
}

function qualityWeight(quality: ObservationQuality) {
  if (quality === 'PASS') return 1
  if (quality === 'SUSPECT') return 0.5
  if (quality === 'STALE') return 0.2
  return 0
}

function freshnessFor(record: ObservationRecord, variable: string, referenceMs: number) {
  const ageHours = Math.max(0, (referenceMs - Date.parse(record.timestamp)) / 3_600_000)
  const threshold = FRESHNESS_HOURS[variable] ?? 2
  if (ageHours <= threshold) return { freshness: 'CURRENT' as const, ageHours }
  if (ageHours <= threshold * 3) return { freshness: 'AGING' as const, ageHours }
  return { freshness: 'STALE' as const, ageHours }
}

function uncertaintyFor(record: ObservationRecord, variable: string, freshness: StateComponent['freshness']) {
  const explicit = Number(record.uncertainty)
  const baseline = Number.isFinite(explicit) && explicit >= 0
    ? explicit
    : Math.max(Math.abs(record.value) * (DEFAULT_RELATIVE_UNCERTAINTY[variable] ?? 0.05), 0.001)
  const freshnessMultiplier = freshness === 'CURRENT' ? 1 : freshness === 'AGING' ? 1.5 : 2.5
  const qualityMultiplier = record.quality === 'PASS' ? 1 : record.quality === 'SUSPECT' ? 1.8 : record.quality === 'STALE' ? 2.5 : 4
  return baseline * freshnessMultiplier * qualityMultiplier
}

function selectLatest(rows: ObservationRecord[], variable: string) {
  return rows
    .filter(row => row.variable === variable && row.quality !== 'FAIL')
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0]
}

export async function buildTwinState(options: {
  farmId: string
  zoneId: string
  evidenceMode: StateEvidenceMode
  referenceTime?: string
  modelVersion?: string
}): Promise<TwinStateEstimate> {
  const referenceTime = options.referenceTime ?? new Date().toISOString()
  const referenceMs = Date.parse(referenceTime)
  const rows = await queryObservations({
    farmId: options.farmId,
    zoneId: options.zoneId,
    sourceMode: options.evidenceMode,
    end: referenceTime,
    limit: 5000,
  })

  const components: StateComponent[] = STATE_VARIABLES.map(variable => {
    const definition = variableByKey[variable]
    const record = selectLatest(rows, variable)
    if (!record) {
      return {
        variable,
        label: definition?.label ?? variable,
        value: null,
        unit: definition?.unit ?? '',
        freshness: 'MISSING',
        ageHours: null,
        uncertainty: null,
        lower: null,
        upper: null,
        assimilationWeight: 0,
        status: 'MISSING',
        note: `No ${options.evidenceMode.toLowerCase()} observation available before the state reference time.`,
      }
    }

    const { freshness, ageHours } = freshnessFor(record, variable, referenceMs)
    const uncertainty = uncertaintyFor(record, variable, freshness)
    const freshnessWeight = freshness === 'CURRENT' ? 1 : freshness === 'AGING' ? 0.65 : 0.25
    const assimilationWeight = +(qualityWeight(record.quality) * freshnessWeight).toFixed(2)
    const status: StateComponent['status'] = assimilationWeight >= 0.5 ? 'ASSIMILATED' : assimilationWeight > 0 ? 'HELD' : 'REJECTED'

    return {
      variable,
      label: definition?.label ?? variable,
      value: record.value,
      unit: record.unit,
      observationId: record.id,
      sensorId: record.sensorId,
      observationTimestamp: record.timestamp,
      provenance: record.provenance,
      observationQuality: record.quality,
      freshness,
      ageHours: +ageHours.toFixed(2),
      uncertainty: +uncertainty.toFixed(4),
      lower: +(record.value - uncertainty).toFixed(4),
      upper: +(record.value + uncertainty).toFixed(4),
      assimilationWeight,
      status,
      note: status === 'ASSIMILATED'
        ? 'Latest eligible observation assimilated into the current state representation.'
        : 'Observation retained for lineage but down-weighted because of age or quality.',
    }
  })

  const assimilatedCount = components.filter(item => item.status === 'ASSIMILATED').length
  const missingCount = components.filter(item => item.status === 'MISSING').length
  const staleCount = components.filter(item => item.freshness === 'STALE').length
  const completeness = Math.round((components.filter(item => item.value !== null).length / components.length) * 100)
  const aggregateQuality: TwinStateEstimate['aggregateQuality'] = completeness < 40
    ? 'INSUFFICIENT'
    : staleCount > 2 || assimilatedCount < Math.ceil(components.length * 0.6)
      ? 'WATCH'
      : 'PASS'

  const state: TwinStateEstimate = {
    id: stateId(),
    farmId: options.farmId,
    zoneId: options.zoneId,
    evidenceMode: options.evidenceMode,
    createdAt: new Date().toISOString(),
    referenceTime,
    modelVersion: options.modelVersion ?? 'STATE-ENGINE-0.1.0',
    method: 'latest-eligible-observation assimilation with freshness and QC weighting',
    componentCount: components.length,
    assimilatedCount,
    missingCount,
    staleCount,
    completeness,
    aggregateQuality,
    sourceObservationIds: components.flatMap(item => item.observationId ? [item.observationId] : []),
    components,
  }

  await saveTwinState(state)
  return state
}

export async function saveTwinState(state: TwinStateEstimate) {
  const db = await openStateDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite')
    transaction.objectStore(STORE).put(state)
    transaction.oncomplete = () => { db.close(); resolve() }
    transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error('Could not save Twin State.')) }
  })
}

export async function listTwinStates(limit = 30): Promise<TwinStateEstimate[]> {
  const db = await openStateDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly')
    const request = transaction.objectStore(STORE).getAll()
    request.onsuccess = () => {
      const rows = (request.result as TwinStateEstimate[])
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, limit)
      db.close()
      resolve(rows)
    }
    request.onerror = () => { db.close(); reject(request.error ?? new Error('Could not read Twin State history.')) }
  })
}

export async function getTwinState(id: string): Promise<TwinStateEstimate | undefined> {
  const db = await openStateDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly')
    const request = transaction.objectStore(STORE).get(id)
    request.onsuccess = () => { db.close(); resolve(request.result as TwinStateEstimate | undefined) }
    request.onerror = () => { db.close(); reject(request.error ?? new Error('Could not read Twin State.')) }
  })
}

export function exportTwinStateJson(state: TwinStateEstimate) {
  return JSON.stringify(state, null, 2)
}
