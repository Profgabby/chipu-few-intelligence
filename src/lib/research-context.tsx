import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { farmState } from './cropsmart-model'

type Value = {
  workspaceId: string
  workspaceName: string
  farmId: string
  setFarmId: (value: string) => void
  siteId: string
  setSiteId: (value: string) => void
  zoneId: string
  setZoneId: (value: string) => void
  scenario: string
  setScenario: (value: string) => void
  stateRun: string
  predictionRun: string
  setStateRun: (value: string) => void
  setPredictionRun: (value: string) => void
}

const Context = createContext<Value | null>(null)
const read = (key: string, fallback: string) => typeof sessionStorage === 'undefined' ? fallback : sessionStorage.getItem(key) || fallback
const write = (key: string, value: string) => { if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, value) }

export function ResearchContextProvider({ children }: { children: ReactNode }) {
  const workspaceId = 'RESEARCH-WORKSPACE'
  const workspaceName = 'Research Workspace'
  const [farmIdState, setFarmIdState] = useState(() => read('chipu_context_farm', 'CEDAR-CREEK'))
  const [siteIdState, setSiteIdState] = useState(() => read('chipu_context_site', 'CEDAR-CREEK'))
  const [zoneIdState, setZoneIdState] = useState(() => read('chipu_context_zone', farmState.zones[1].id))
  const [scenarioState, setScenarioState] = useState(() => read('chipu_context_scenario', farmState.scenario))
  const [stateRun, setStateRun] = useState(farmState.stateRun)
  const [predictionRun, setPredictionRun] = useState(farmState.predictionRun)
  const setFarmId = (value: string) => { setFarmIdState(value); write('chipu_context_farm', value) }
  const setSiteId = (value: string) => { setSiteIdState(value); write('chipu_context_site', value) }
  const setZoneId = (value: string) => { setZoneIdState(value); write('chipu_context_zone', value) }
  const setScenario = (value: string) => { setScenarioState(value); write('chipu_context_scenario', value) }
  const value = useMemo(() => ({ workspaceId, workspaceName, farmId: farmIdState, setFarmId, siteId: siteIdState, setSiteId, zoneId: zoneIdState, setZoneId, scenario: scenarioState, setScenario, stateRun, predictionRun, setStateRun, setPredictionRun }), [farmIdState, siteIdState, zoneIdState, scenarioState, stateRun, predictionRun])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useResearchContext() {
  const value = useContext(Context)
  if (!value) throw new Error('Research context is unavailable')
  return value
}
