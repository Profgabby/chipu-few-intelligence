import { listTwinStates, type TwinStateEstimate } from './state-engine'
import { listForecasts, type ForecastRun } from './forecast-engine'
import { listScenarioRuns, type ScenarioExperimentRun } from './scenario-laboratory-engine'
import { listForecastControlRuns, type ForecastDrivenControlRun } from './forecast-control-engine'
import { listRecedingHorizonRuns, type RecedingHorizonControlRun } from './receding-horizon-control-engine'
import { hasResearchSession, listDomainRecords } from './chipu-domain-api'

export type ControlRun=ScenarioExperimentRun|ForecastDrivenControlRun|RecedingHorizonControlRun
export type CommandCenterState={loadedAt:string;connected:boolean;twin?:TwinStateEstimate;forecast?:ForecastRun;scenarioRun?:ControlRun;forecastControlRun?:ForecastDrivenControlRun;recedingHorizonRun?:RecedingHorizonControlRun;stakeholderCount:number|null;placeCount:number|null;latestResilience?:Record<string,unknown>;latestEconomic?:Record<string,unknown>;errors:string[]}
async function safe<T>(label:string,task:()=>Promise<T>,errors:string[]):Promise<T|undefined>{try{return await task()}catch{errors.push(`${label} unavailable`);return undefined}}
export async function loadCommandCenterState(farmId?:string):Promise<CommandCenterState>{
  const errors:string[]=[]
  const twinRows=await safe('Twin state',()=>listTwinStates(20),errors)??[]
  const forecastRows=await safe('Forecast',()=>listForecasts(20),errors)??[]
  const scenarioRows=await safe('Scenario history',()=>listScenarioRuns(20),errors)??[]
  const forecastControlRows=await safe('Forecast-driven control history',()=>listForecastControlRuns(20),errors)??[]
  const rollingRows=await safe('Receding-horizon control history',()=>listRecedingHorizonRuns(20),errors)??[]
  const twin=twinRows.find(row=>!farmId||row.farmId===farmId)
  const forecast=forecastRows.find(row=>!farmId||row.farmId===farmId)
  const recedingHorizonRun=forecast ? rollingRows.find(row=>row.forecastId===forecast.id) : undefined
  const forecastControlRun=forecast ? forecastControlRows.find(row=>row.forecastId===forecast.id) : undefined
  const legacyScenarioRun=twin ? scenarioRows.find(row=>row.stateId===twin.id) : undefined
  const scenarioRun:ControlRun|undefined=recedingHorizonRun??forecastControlRun??legacyScenarioRun
  const connected=hasResearchSession()
  let stakeholderCount:number|null=null,placeCount:number|null=null
  let latestResilience:Record<string,unknown>|undefined,latestEconomic:Record<string,unknown>|undefined
  if(connected){const [stakeholders,places,resilience,economics]=await Promise.all([safe('People records',()=>listDomainRecords<Record<string,unknown>>('stakeholders',farmId),errors),safe('Place records',()=>listDomainRecords<Record<string,unknown>>('places',farmId),errors),safe('Resilience records',()=>listDomainRecords<Record<string,unknown>>('resilienceResults',farmId),errors),safe('Economics records',()=>listDomainRecords<Record<string,unknown>>('economicResults',farmId),errors)]);stakeholderCount=stakeholders?.length??0;placeCount=places?.length??0;latestResilience=resilience?.[0];latestEconomic=economics?.[0]}
  return{loadedAt:new Date().toISOString(),connected,twin,forecast,scenarioRun,forecastControlRun,recedingHorizonRun,stakeholderCount,placeCount,latestResilience,latestEconomic,errors}
}
export function stateComponent(state:TwinStateEstimate|undefined,variable:string){return state?.components.find(item=>item.variable===variable)}
