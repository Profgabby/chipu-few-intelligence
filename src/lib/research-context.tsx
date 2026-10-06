import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { readProfiles, validateProfile, unconfigured, demonstration, initialProfileId, type PlaceProfile } from './place-profile'
import { farmState } from './cropsmart-model'

type Value = {
  profiles: PlaceProfile[]
  profile: PlaceProfile
  selectProfile: (id: string) => void
  saveProfile: (profile: PlaceProfile) => void
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
const persist = (key: string, value: string) => { if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, value) }

export function ResearchContextProvider({ children, demonstrationMode = false }: { children: ReactNode; demonstrationMode?: boolean }) {
  const write = (key: string, value: string) => { if (!demonstrationMode) persist(key, value) }
  const [profiles, setProfiles] = useState(readProfiles)
  const [profileId, setProfileId] = useState(() => demonstrationMode ? demonstration.id : initialProfileId(profiles, read('chipu_place_active_v2', ''), read('chipu_place_active_v1', '')))
  const profile = profiles.find(p => p.id === profileId) ?? unconfigured
  const workspaceId = 'RESEARCH-WORKSPACE'
  const workspaceName = 'Research Workspace'
  const [farmIdState, setFarmIdState] = useState(profile.id)
  const [siteIdState, setSiteIdState] = useState(profile.id)
  const [zoneIdState, setZoneIdState] = useState(profile.zone)
  const [scenarioState, setScenarioState] = useState(() => demonstrationMode ? farmState.scenario : read('chipu_context_scenario', farmState.scenario))
  const [stateRun, setStateRun] = useState('')
  const [predictionRun, setPredictionRun] = useState('')
  const setFarmId = (value: string) => { setFarmIdState(value); write('chipu_context_farm', value) }
  const setSiteId = (value: string) => { setSiteIdState(value); write('chipu_context_site', value) }
  const setZoneId = (value: string) => { setZoneIdState(value); write('chipu_context_zone', value) }
  const setScenario = (value: string) => { setScenarioState(value); write('chipu_context_scenario', value) }
  const selectProfile = (id: string) => {
    const next = profiles.find(p => p.id === id)
    if (!next) return
    setProfileId(id); write('chipu_place_active_v2', id)
    setFarmId(id); setSiteId(id); setZoneId(next.zone); setScenario('S00')
    setStateRun(''); setPredictionRun('')
  }
  const saveProfile = (next: PlaceProfile) => {
    const error = validateProfile(next)
    if (error) throw new Error(error)
    const updated = [...profiles.filter(p => p.id !== next.id), next]
    if (!demonstrationMode) localStorage.setItem('chipu_place_profiles_v1', JSON.stringify(updated.filter(p => p.kind === 'configured')))
    setProfiles(updated); setProfileId(next.id); write('chipu_place_active_v2', next.id)
    setFarmId(next.id); setSiteId(next.id); setZoneId(next.zone); setScenario('S00'); setStateRun(''); setPredictionRun('')
  }
  const value = useMemo(() => ({ profiles, profile, selectProfile, saveProfile, workspaceId, workspaceName, farmId: farmIdState, setFarmId, siteId: siteIdState, setSiteId, zoneId: zoneIdState, setZoneId, scenario: scenarioState, setScenario, stateRun, predictionRun, setStateRun, setPredictionRun }), [profiles, profileId, farmIdState, siteIdState, zoneIdState, scenarioState, stateRun, predictionRun])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useResearchContext() {
  const value = useContext(Context)
  if (!value) throw new Error('Research context is unavailable')
  return value
}
