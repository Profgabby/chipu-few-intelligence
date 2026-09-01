import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { farmState } from './cropsmart-model'

type Value = { zoneId: string; setZoneId: (value: string) => void; scenario: string; setScenario: (value: string) => void; stateRun: string; predictionRun: string; setStateRun: (value: string) => void; setPredictionRun: (value: string) => void }
const Context = createContext<Value | null>(null)
export function ResearchContextProvider({ children }: { children: ReactNode }) { const [zoneId, setZoneId] = useState(farmState.zones[1].id); const [scenario, setScenario] = useState(farmState.scenario); const [stateRun, setStateRun] = useState(farmState.stateRun); const [predictionRun, setPredictionRun] = useState(farmState.predictionRun); const value = useMemo(() => ({ zoneId, setZoneId, scenario, setScenario, stateRun, predictionRun, setStateRun, setPredictionRun }), [zoneId, scenario, stateRun, predictionRun]); return <Context.Provider value={value}>{children}</Context.Provider> }
export function useResearchContext() { const value = useContext(Context); if (!value) throw new Error('Research context is unavailable'); return value }
