import { getTwinState, listTwinStates, type TwinStateEstimate } from './state-engine'

const DB_NAME = 'cropsmart-forecast-db'
const DB_VERSION = 1
const STORE = 'forecasts'

export type ForecastForcing = {
  leadHours: number
  airTemperature: number
  relativeHumidity: number
  shortwaveRadiation: number
  windSpeed: number
  precipitationMm: number
  referenceEtMm: number
}

export type ForecastPoint = {
  validTime: string
  leadHours: number
  soilWater: number | null
  tankLevel: number | null
  pvPower: number | null
  batterySoc: number | null
  cropWaterDemand: number
  irrigationRequirement: number
  pumpingEnergy: number
  lowerSoilWater: number | null
  upperSoilWater: number | null
  lowerPvPower: number | null
  upperPvPower: number | null
  uncertaintyMultiplier: number
  forcing: ForecastForcing
}

export type ForecastRun = {
  id: string
  initialStateId: string
  farmId: string
  zoneId: string
  evidenceMode: TwinStateEstimate['evidenceMode']
  issuedAt: string
  horizonHours: number
  stepHours: number
  modelVersion: string
  method: string
  forcingSource: 'DETERMINISTIC-DEMONSTRATION' | 'MANUAL'
  status: 'COMPLETE' | 'INSUFFICIENT_INITIAL_STATE'
  warnings: string[]
  points: ForecastPoint[]
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('issuedAt', 'issuedAt')
        store.createIndex('initialStateId', 'initialStateId')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open forecast database.'))
  })
}

function component(state: TwinStateEstimate, key: string) {
  return state.components.find(item => item.variable === key)
}

function value(state: TwinStateEstimate, key: string) {
  return component(state, key)?.value ?? null
}

function clamp(v: number, min: number, max: number) { return Math.min(max, Math.max(min, v)) }

function deterministicForcing(issuedAt: string, leadHours: number): ForecastForcing {
  const valid = new Date(Date.parse(issuedAt) + leadHours * 3_600_000)
  const hour = valid.getUTCHours()
  const daylight = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI))
  const dayWave = Math.sin((leadHours / 24) * Math.PI * 2)
  return {
    leadHours,
    airTemperature: +(16.5 + daylight * 14 + dayWave * 1.5).toFixed(2),
    relativeHumidity: +clamp(84 - daylight * 39 - dayWave * 3, 20, 100).toFixed(1),
    shortwaveRadiation: +(daylight * 900).toFixed(1),
    windSpeed: +(2.1 + Math.abs(Math.sin(leadHours / 7)) * 2.4).toFixed(2),
    precipitationMm: leadHours >= 42 && leadHours <= 48 ? 1.4 : 0,
    referenceEtMm: +(0.03 + daylight * 0.24).toFixed(3),
  }
}

function forecastId() {
  return `PRED-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

export async function latestTwinState() {
  return (await listTwinStates(1))[0]
}

export async function runForecast(options: { initialStateId?: string; horizonHours?: number; stepHours?: number }): Promise<ForecastRun> {
  const state = options.initialStateId ? await getTwinState(options.initialStateId) : await latestTwinState()
  if (!state) throw new Error('A persisted Twin State is required before a forecast can be run.')
  const issuedAt = new Date().toISOString()
  const horizonHours = options.horizonHours ?? 72
  const stepHours = options.stepHours ?? 3
  const warnings: string[] = []
  if (state.aggregateQuality === 'INSUFFICIENT') warnings.push('Initial Twin State is marked INSUFFICIENT; trajectory is demonstrative and should not support operational decisions.')
  if (state.evidenceMode === 'SYNTHETIC') warnings.push('Initial state uses synthetic evidence. Forecast output is a research demonstration, not a field prediction.')

  let soilWater = value(state, 'soil_water_rootzone')
  let tankLevel = value(state, 'tank_level')
  let batterySoc = value(state, 'battery_soc')
  const initialPv = value(state, 'pv_power')
  const initialSoilUnc = component(state, 'soil_water_rootzone')?.uncertainty ?? 0.02
  const initialPvUnc = component(state, 'pv_power')?.uncertainty ?? Math.max((initialPv ?? 20) * 0.08, 1)
  const points: ForecastPoint[] = []

  for (let lead = 0; lead <= horizonHours; lead += stepHours) {
    const forcing = deterministicForcing(issuedAt, lead)
    const cropWaterDemand = +(forcing.referenceEtMm * stepHours * 0.78).toFixed(3)
    const targetSoilWater = 0.29
    const irrigationRequirement = soilWater === null ? 0 : +Math.max(0, (targetSoilWater - soilWater) * 38).toFixed(3)
    const pumpingEnergy = +(irrigationRequirement * 0.34).toFixed(3)
    const pvPower = initialPv === null ? null : +(Math.max(0, forcing.shortwaveRadiation / 900) * Math.max(initialPv, 28)).toFixed(2)

    if (lead > 0 && soilWater !== null) {
      const depletion = cropWaterDemand / 1000
      const recharge = forcing.precipitationMm / 1000 + irrigationRequirement / 1000
      soilWater = +clamp(soilWater - depletion + recharge, 0.05, 0.6).toFixed(4)
    }
    if (lead > 0 && tankLevel !== null) tankLevel = +clamp(tankLevel - irrigationRequirement * 0.18, 0, 100).toFixed(2)
    if (lead > 0 && batterySoc !== null) {
      const charge = (pvPower ?? 0) * stepHours * 0.05
      batterySoc = +clamp(batterySoc + charge - pumpingEnergy * 0.8 - 0.8, 0, 100).toFixed(2)
    }

    const uncertaintyMultiplier = +(1 + lead / 72).toFixed(3)
    const soilUnc = initialSoilUnc * uncertaintyMultiplier
    const pvUnc = initialPvUnc * uncertaintyMultiplier
    points.push({
      validTime: new Date(Date.parse(issuedAt) + lead * 3_600_000).toISOString(), leadHours: lead,
      soilWater, tankLevel, pvPower, batterySoc, cropWaterDemand, irrigationRequirement, pumpingEnergy,
      lowerSoilWater: soilWater === null ? null : +Math.max(0, soilWater - soilUnc).toFixed(4),
      upperSoilWater: soilWater === null ? null : +(soilWater + soilUnc).toFixed(4),
      lowerPvPower: pvPower === null ? null : +Math.max(0, pvPower - pvUnc).toFixed(2),
      upperPvPower: pvPower === null ? null : +(pvPower + pvUnc).toFixed(2),
      uncertaintyMultiplier, forcing,
    })
  }

  const run: ForecastRun = {
    id: forecastId(), initialStateId: state.id, farmId: state.farmId, zoneId: state.zoneId,
    evidenceMode: state.evidenceMode, issuedAt, horizonHours, stepHours,
    modelVersion: 'FORECAST-ENGINE-0.1.0',
    method: 'state-initialized deterministic trajectory with simplified water-energy propagation and lead-dependent uncertainty expansion',
    forcingSource: 'DETERMINISTIC-DEMONSTRATION',
    status: state.aggregateQuality === 'INSUFFICIENT' ? 'INSUFFICIENT_INITIAL_STATE' : 'COMPLETE', warnings, points,
  }
  await saveForecast(run)
  return run
}

export async function saveForecast(run: ForecastRun) {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(run)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error ?? new Error('Could not persist forecast run.')) }
  })
}

export async function listForecasts(limit = 20): Promise<ForecastRun[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const request = tx.objectStore(STORE).getAll()
    request.onsuccess = () => { const rows = (request.result as ForecastRun[]).sort((a,b) => Date.parse(b.issuedAt)-Date.parse(a.issuedAt)).slice(0,limit); db.close(); resolve(rows) }
    request.onerror = () => { db.close(); reject(request.error ?? new Error('Could not read forecast history.')) }
  })
}

export function exportForecastJson(run: ForecastRun) { return JSON.stringify(run, null, 2) }
