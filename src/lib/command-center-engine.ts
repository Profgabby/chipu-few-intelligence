import { listTwinStates, type TwinStateEstimate } from './state-engine'
import { listForecasts, type ForecastRun } from './forecast-engine'
import { listScenarioRuns, type ScenarioExperimentRun } from './scenario-laboratory-engine'
import { hasResearchSession, listDomainRecords } from './chipu-domain-api'

export type CommandCenterState = {
  loadedAt: string
  connected: boolean
  twin?: TwinStateEstimate
  forecast?: ForecastRun
  scenarioRun?: ScenarioExperimentRun
  stakeholderCount: number | null
  placeCount: number | null
  latestResilience?: Record<string, unknown>
  latestEconomic?: Record<string, unknown>
  errors: string[]
}

async function safe<T>(label: string, task: () => Promise<T>, errors: string[]): Promise<T | undefined> {
  try { return await task() } catch { errors.push(`${label} unavailable`) ; return undefined }
}

export async function loadCommandCenterState(farmId?: string): Promise<CommandCenterState> {
  const errors: string[] = []
  const twinRows = await safe('Twin state', () => listTwinStates(20), errors) ?? []
  const forecastRows = await safe('Forecast', () => listForecasts(20), errors) ?? []
  const scenarioRows = await safe('Scenario history', () => listScenarioRuns(20), errors) ?? []
  const twin = twinRows.find(row => !farmId || row.farmId === farmId) ?? twinRows[0]
  const forecast = forecastRows.find(row => !farmId || row.farmId === farmId) ?? forecastRows[0]
  const scenarioRun = scenarioRows.find(row => !farmId || row.stateId === twin?.id) ?? scenarioRows[0]
  const connected = hasResearchSession()
  let stakeholderCount: number | null = null
  let placeCount: number | null = null
  let latestResilience: Record<string, unknown> | undefined
  let latestEconomic: Record<string, unknown> | undefined
  if (connected) {
    const [stakeholders, places, resilience, economics] = await Promise.all([
      safe('People records', () => listDomainRecords<Record<string, unknown>>('stakeholders', farmId), errors),
      safe('Place records', () => listDomainRecords<Record<string, unknown>>('places', farmId), errors),
      safe('Resilience records', () => listDomainRecords<Record<string, unknown>>('resilienceResults', farmId), errors),
      safe('Economics records', () => listDomainRecords<Record<string, unknown>>('economicResults', farmId), errors),
    ])
    stakeholderCount = stakeholders?.length ?? 0
    placeCount = places?.length ?? 0
    latestResilience = resilience?.[0]
    latestEconomic = economics?.[0]
  }
  return { loadedAt: new Date().toISOString(), connected, twin, forecast, scenarioRun, stakeholderCount, placeCount, latestResilience, latestEconomic, errors }
}

export function stateComponent(state: TwinStateEstimate | undefined, variable: string) {
  return state?.components.find(item => item.variable === variable)
}
