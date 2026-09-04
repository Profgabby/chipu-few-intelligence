import { farmState } from './cropsmart-model'
import {
  provenanceClasses,
  qualityFlags,
  validateVariableValue,
  variableByKey,
  type ObservationProvenance,
  type ObservationQuality,
} from './variable-registry'

const DB_NAME = 'cropsmart-research-db'
const DB_VERSION = 1
const STORE = 'observations'

export type ObservationRecord = {
  id: string
  farmId: string
  zoneId: string
  sensorId: string
  variable: string
  value: number
  unit: string
  timestamp: string
  provenance: ObservationProvenance
  quality: ObservationQuality
  sourceName: string
  sourceDataset?: string
  uncertainty?: number
  note?: string
  createdAt: string
}

export type ObservationInput = Omit<ObservationRecord, 'id' | 'quality' | 'createdAt'> & {
  id?: string
  quality?: ObservationQuality
  createdAt?: string
}

export type SourceMode = 'OBSERVED' | 'COMPUTATIONAL' | 'SYNTHETIC' | 'ALL'

export type ObservationQuery = {
  farmId?: string
  zoneId?: string
  sensorId?: string
  variable?: string
  sourceMode: SourceMode
  start?: string
  end?: string
  limit?: number
}

export type ValidationResult = {
  accepted: boolean
  quality: ObservationQuality
  messages: string[]
  record?: ObservationRecord
}

export type BatchResult = {
  accepted: ObservationRecord[]
  rejected: { row: number; messages: string[]; raw: Record<string, string> }[]
  suspect: number
}

function id(prefix = 'OBS') {
  const token = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 12).toUpperCase()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase()
  return `${prefix}-${token}`
}

function openDatabase(): Promise<IDBDatabase> {
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
        store.createIndex('timestamp', 'timestamp')
        store.createIndex('farmId', 'farmId')
        store.createIndex('zoneId', 'zoneId')
        store.createIndex('variable', 'variable')
        store.createIndex('sensorId', 'sensorId')
        store.createIndex('provenance', 'provenance')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open CropSmart observation database.'))
  })
}

function transactionResult<T>(requestFactory: (store: IDBObjectStore) => IDBRequest<T>, mode: IDBTransactionMode = 'readonly'): Promise<T> {
  return openDatabase().then(db => new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode)
    const request = requestFactory(transaction.objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Observation database operation failed.'))
    transaction.oncomplete = () => db.close()
    transaction.onerror = () => reject(transaction.error ?? new Error('Observation database transaction failed.'))
  }))
}

export async function getAllObservations(): Promise<ObservationRecord[]> {
  return transactionResult(store => store.getAll()) as Promise<ObservationRecord[]>
}

function sourceMatches(record: ObservationRecord, mode: SourceMode) {
  if (mode === 'ALL') return true
  if (mode === 'SYNTHETIC') return record.provenance === 'SYNTHETIC'
  if (mode === 'OBSERVED') return record.provenance === 'MEASURED' || record.provenance === 'MANUAL'
  return ['MODELED', 'PREDICTED', 'DERIVED'].includes(record.provenance)
}

export async function queryObservations(query: ObservationQuery): Promise<ObservationRecord[]> {
  const rows = await getAllObservations()
  const start = query.start ? Date.parse(query.start) : Number.NEGATIVE_INFINITY
  const end = query.end ? Date.parse(query.end) : Number.POSITIVE_INFINITY
  return rows
    .filter(row => !query.farmId || row.farmId === query.farmId)
    .filter(row => !query.zoneId || row.zoneId === query.zoneId)
    .filter(row => !query.sensorId || row.sensorId.toLowerCase().includes(query.sensorId.toLowerCase()))
    .filter(row => !query.variable || row.variable === query.variable)
    .filter(row => sourceMatches(row, query.sourceMode))
    .filter(row => {
      const time = Date.parse(row.timestamp)
      return time >= start && time <= end
    })
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, query.limit ?? 500)
}

function normalizeTimestamp(value: string) {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : ''
}

export function validateObservation(input: ObservationInput): ValidationResult {
  const messages: string[] = []
  const timestamp = normalizeTimestamp(input.timestamp)
  if (!input.farmId?.trim()) messages.push('farmId is required.')
  if (!input.zoneId?.trim()) messages.push('zoneId is required.')
  if (!input.sensorId?.trim()) messages.push('sensorId is required.')
  if (!timestamp) messages.push('timestamp must be a valid date/time.')
  if (!provenanceClasses.includes(input.provenance)) messages.push('provenance is not recognized.')
  if (!variableByKey[input.variable]) messages.push('variable is not in the controlled registry.')

  const variableCheck = validateVariableValue(input.variable, Number(input.value), input.unit)
  if (variableCheck.quality === 'FAIL') messages.push(variableCheck.message)

  if (input.provenance === 'MEASURED' && input.sourceName.trim().length < 2) {
    messages.push('MEASURED observations require a sourceName identifying the instrument or acquisition source.')
  }

  const fatal = messages.length > 0
  if (fatal) return { accepted: false, quality: 'FAIL', messages }

  const requestedQuality = input.quality && qualityFlags.includes(input.quality) ? input.quality : undefined
  const quality: ObservationQuality = requestedQuality ?? variableCheck.quality
  const record: ObservationRecord = {
    ...input,
    id: input.id ?? id(),
    value: Number(input.value),
    timestamp,
    quality,
    createdAt: input.createdAt ?? new Date().toISOString(),
  }
  const informational = variableCheck.quality === 'SUSPECT' ? [variableCheck.message] : []
  return { accepted: true, quality, messages: informational, record }
}

function duplicateKey(record: Pick<ObservationRecord, 'farmId' | 'zoneId' | 'sensorId' | 'variable' | 'timestamp'>) {
  return [record.farmId, record.zoneId, record.sensorId, record.variable, record.timestamp].join('|')
}

export async function addObservation(input: ObservationInput): Promise<ValidationResult> {
  const validation = validateObservation(input)
  if (!validation.accepted || !validation.record) return validation

  const existing = await getAllObservations()
  if (existing.some(row => duplicateKey(row) === duplicateKey(validation.record!))) {
    return { accepted: false, quality: 'FAIL', messages: ['Duplicate observation: farm, zone, sensor, variable, and timestamp already exist.'] }
  }

  await transactionResult(store => store.add(validation.record!), 'readwrite')
  return validation
}

export async function addObservationBatch(inputs: ObservationInput[]): Promise<BatchResult> {
  const existing = await getAllObservations()
  const seen = new Set(existing.map(duplicateKey))
  const accepted: ObservationRecord[] = []
  const rejected: BatchResult['rejected'] = []
  let suspect = 0

  inputs.forEach((input, index) => {
    const validation = validateObservation(input)
    if (!validation.accepted || !validation.record) {
      rejected.push({ row: index + 2, messages: validation.messages, raw: input as unknown as Record<string, string> })
      return
    }
    const key = duplicateKey(validation.record)
    if (seen.has(key)) {
      rejected.push({ row: index + 2, messages: ['Duplicate observation.'], raw: input as unknown as Record<string, string> })
      return
    }
    seen.add(key)
    if (validation.quality === 'SUSPECT') suspect += 1
    accepted.push(validation.record)
  })

  if (accepted.length) {
    const db = await openDatabase()
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite')
      const store = transaction.objectStore(STORE)
      accepted.forEach(record => store.add(record))
      transaction.oncomplete = () => { db.close(); resolve() }
      transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error('Batch insert failed.')) }
    })
  }

  return { accepted, rejected, suspect }
}

export function parseObservationCsv(text: string): { rows: ObservationInput[]; errors: string[] } {
  const errors: string[] = []
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim())
  if (!lines.length) return { rows: [], errors: ['CSV file is empty.'] }

  const split = (line: string) => {
    const cells: string[] = []
    let current = ''
    let quoted = false
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i]
      if (char === '"' && line[i + 1] === '"' && quoted) { current += '"'; i += 1; continue }
      if (char === '"') { quoted = !quoted; continue }
      if (char === ',' && !quoted) { cells.push(current.trim()); current = ''; continue }
      current += char
    }
    cells.push(current.trim())
    return cells
  }

  const headers = split(lines[0]).map(item => item.trim())
  const required = ['timestamp', 'farmId', 'zoneId', 'sensorId', 'variable', 'value', 'unit', 'provenance', 'sourceName']
  const missing = required.filter(field => !headers.includes(field))
  if (missing.length) return { rows: [], errors: [`Missing required columns: ${missing.join(', ')}`] }

  const rows = lines.slice(1).map(line => {
    const cells = split(line)
    const raw = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']))
    return {
      timestamp: raw.timestamp,
      farmId: raw.farmId,
      zoneId: raw.zoneId,
      sensorId: raw.sensorId,
      variable: raw.variable,
      value: Number(raw.value),
      unit: raw.unit,
      provenance: raw.provenance as ObservationProvenance,
      sourceName: raw.sourceName,
      sourceDataset: raw.sourceDataset || undefined,
      uncertainty: raw.uncertainty ? Number(raw.uncertainty) : undefined,
      note: raw.note || undefined,
      quality: raw.quality as ObservationQuality || undefined,
    } satisfies ObservationInput
  })

  return { rows, errors }
}

export function observationCsvTemplate() {
  return [
    'timestamp,farmId,zoneId,sensorId,variable,value,unit,provenance,sourceName,sourceDataset,uncertainty,note',
    '2026-09-04T18:00:00Z,CEDAR-CREEK,AV-A,soil-01,soil_water_rootzone,0.287,m³/m³,MEASURED,soil-01 logger,FIELD-2026,,',
    '2026-09-04T18:00:00Z,CEDAR-CREEK,AV-A,pv-01,pv_power,27.4,kW,MEASURED,pv meter,FIELD-2026,,',
  ].join('\n')
}

export async function observationCounts() {
  const rows = await getAllObservations()
  return {
    total: rows.length,
    observed: rows.filter(row => sourceMatches(row, 'OBSERVED')).length,
    computational: rows.filter(row => sourceMatches(row, 'COMPUTATIONAL')).length,
    synthetic: rows.filter(row => sourceMatches(row, 'SYNTHETIC')).length,
    suspect: rows.filter(row => row.quality === 'SUSPECT').length,
    failed: rows.filter(row => row.quality === 'FAIL').length,
  }
}

function syntheticRows(): ObservationInput[] {
  const start = Date.UTC(2026, 7, 26, 0, 0, 0)
  const variables = [
    ['soil_water_rootzone', 'soil-01'],
    ['air_temperature', 'weather-01'],
    ['relative_humidity', 'weather-01'],
    ['shortwave_radiation', 'weather-01'],
    ['par', 'par-01'],
    ['pv_power', 'pv-01'],
    ['pump_power', 'pump-01'],
    ['water_flow', 'flow-01'],
    ['tank_level', 'tank-01'],
    ['canopy_temperature', 'canopy-01'],
    ['battery_soc', 'battery-01'],
  ] as const

  return Array.from({ length: 168 }, (_, hourIndex) => {
    const hour = hourIndex % 24
    const daylight = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI))
    return variables.map(([variable, sensorId]) => {
      const definition = variableByKey[variable]
      const zone = farmState.zones[1]
      const values: Record<string, number> = {
        soil_water_rootzone: +(zone.soilWater + Math.sin(hourIndex / 9) * 0.012).toFixed(3),
        air_temperature: +(17 + daylight * 14 + Math.sin(hourIndex / 17) * 2).toFixed(2),
        relative_humidity: +(82 - daylight * 37 + Math.sin(hourIndex / 13) * 4).toFixed(1),
        shortwave_radiation: +(daylight * 910).toFixed(1),
        par: +(daylight * 1850).toFixed(0),
        pv_power: +(daylight * 31.5).toFixed(2),
        pump_power: hour >= 6 && hour <= 9 ? 9.8 : 0,
        water_flow: hour >= 6 && hour <= 9 ? 186 : 0,
        tank_level: +(72 - (hourIndex % 24) * 0.22 + Math.floor(hourIndex / 24) * 0.4).toFixed(1),
        canopy_temperature: +(16 + daylight * 16 + Math.sin(hourIndex / 11)).toFixed(2),
        battery_soc: +(62 + daylight * 22 - (hour > 18 ? (hour - 18) * 2.5 : 0)).toFixed(1),
      }
      return {
        farmId: 'CEDAR-CREEK',
        zoneId: 'AV-A',
        sensorId,
        variable,
        value: values[variable],
        unit: definition.unit,
        timestamp: new Date(start + hourIndex * 3600_000).toISOString(),
        provenance: 'SYNTHETIC' as ObservationProvenance,
        sourceName: 'CropSmart deterministic demonstration generator',
        sourceDataset: farmState.dataset,
        note: 'Synthetic demonstration record; not a field measurement.',
      }
    })
  }).flat()
}

export async function initializeObservationStore() {
  const rows = await getAllObservations()
  if (!rows.some(row => row.provenance === 'SYNTHETIC')) {
    await addObservationBatch(syntheticRows())
  }
}
