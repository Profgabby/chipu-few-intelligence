import { getTwinState, listTwinStates, type TwinStateEstimate } from './state-engine'
import { listForecasts, type ForecastRun } from './forecast-engine'

export type WaterAnalysisResult = {
  id: string
  stateId: string
  forecastId?: string
  zoneId: string
  evidenceMode: TwinStateEstimate['evidenceMode']
  createdAt: string
  modelVersion: string
  status: 'PASS' | 'WATCH' | 'INSUFFICIENT'
  rootZoneWater: number | null
  targetWater: number
  waterDeficit: number | null
  cropWaterDemand: number
  effectivePrecipitation: number
  irrigationRequirement: number
  grossIrrigationRequirement: number
  irrigationEfficiency: number
  irrigationVolumeM3: number
  areaM2: number
  pumpFlowLmin: number | null
  irrigationRuntimeHours: number | null
  pumpPowerKw: number | null
  pumpingEnergyKwh: number | null
  tankLevel: number | null
  thresholdLeadHours: number | null
  warnings: string[]
  method: string
}

function value(state: TwinStateEstimate, key: string) {
  return state.components.find(c => c.variable === key)?.value ?? null
}

function analysisId() {
  return `WATER-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0,14)}-${Math.random().toString(36).slice(2,6).toUpperCase()}`
}

export async function latestWaterInputs() {
  const state = (await listTwinStates(1))[0]
  const forecast = (await listForecasts(1))[0]
  return { state, forecast }
}

export async function runWaterAnalysis(options: {
  stateId?: string
  forecastId?: string
  targetWater?: number
  irrigationEfficiency?: number
  areaM2?: number
} = {}): Promise<WaterAnalysisResult> {
  const { state: latestState, forecast: latestForecast } = await latestWaterInputs()
  const state = options.stateId ? await getTwinState(options.stateId) : latestState
  if (!state) throw new Error('A persisted Twin State is required before Water Intelligence can run.')

  const forecast: ForecastRun | undefined = options.forecastId
    ? (await listForecasts(50)).find(f => f.id === options.forecastId)
    : latestForecast?.initialStateId === state.id ? latestForecast : undefined

  const rootZoneWater = value(state, 'soil_water_rootzone')
  const tankLevel = value(state, 'tank_level')
  const pumpFlowLmin = value(state, 'water_flow')
  const pumpPowerKw = value(state, 'pump_power')
  const targetWater = options.targetWater ?? 0.29
  const irrigationEfficiency = options.irrigationEfficiency ?? 0.90
  const areaM2 = options.areaM2 ?? 1000

  const forecast24 = forecast?.points.find(p => p.leadHours === 24)
  const cropWaterDemand = forecast24?.cropWaterDemand ?? 4.8
  const effectivePrecipitation = forecast24?.forcing.precipitationMm ?? 0
  const waterDeficit = rootZoneWater === null ? null : Math.max(0, targetWater - rootZoneWater)
  const storageDepthMm = waterDeficit === null ? 0 : waterDeficit * 120
  const netIrrigationRequirement = Math.max(0, storageDepthMm + cropWaterDemand - effectivePrecipitation)
  const grossIrrigationRequirement = netIrrigationRequirement / irrigationEfficiency
  const irrigationVolumeM3 = grossIrrigationRequirement * areaM2 / 1000
  const irrigationRuntimeHours = pumpFlowLmin && pumpFlowLmin > 0
    ? irrigationVolumeM3 * 1000 / pumpFlowLmin / 60
    : null
  const pumpingEnergyKwh = irrigationRuntimeHours !== null && pumpPowerKw !== null
    ? irrigationRuntimeHours * pumpPowerKw
    : null

  const threshold = 0.24
  const thresholdLeadHours = forecast
    ? forecast.points.find(p => p.soilWater !== null && p.soilWater <= threshold)?.leadHours ?? null
    : null

  const warnings: string[] = []
  if (state.aggregateQuality === 'INSUFFICIENT') warnings.push('Initial Twin State is insufficient; calculated water requirements are demonstrative only.')
  if (state.evidenceMode === 'SYNTHETIC') warnings.push('The analysis is based on synthetic evidence and is not a field irrigation prescription.')
  if (pumpFlowLmin === null) warnings.push('No usable water-flow state is available; runtime cannot be calculated.')
  if (pumpPowerKw === null) warnings.push('No usable pump-power state is available; pumping energy cannot be calculated.')
  if (!forecast) warnings.push('No forecast initialized from this state was found; crop-water demand uses the demonstration fallback value.')

  const status: WaterAnalysisResult['status'] = state.aggregateQuality === 'INSUFFICIENT'
    ? 'INSUFFICIENT'
    : thresholdLeadHours !== null && thresholdLeadHours <= 24
      ? 'WATCH'
      : 'PASS'

  return {
    id: analysisId(), stateId: state.id, forecastId: forecast?.id, zoneId: state.zoneId,
    evidenceMode: state.evidenceMode, createdAt: new Date().toISOString(), modelVersion: 'WATER-ENGINE-0.1.0',
    status, rootZoneWater, targetWater, waterDeficit, cropWaterDemand, effectivePrecipitation,
    irrigationRequirement: +netIrrigationRequirement.toFixed(3),
    grossIrrigationRequirement: +grossIrrigationRequirement.toFixed(3), irrigationEfficiency,
    irrigationVolumeM3: +irrigationVolumeM3.toFixed(3), areaM2,
    pumpFlowLmin, irrigationRuntimeHours: irrigationRuntimeHours === null ? null : +irrigationRuntimeHours.toFixed(3),
    pumpPowerKw, pumpingEnergyKwh: pumpingEnergyKwh === null ? null : +pumpingEnergyKwh.toFixed(3),
    tankLevel, thresholdLeadHours, warnings,
    method: 'root-zone deficit plus forecast crop-water demand, adjusted for effective precipitation and irrigation efficiency; runtime derived from observed/state flow and energy from state pump power',
  }
}
