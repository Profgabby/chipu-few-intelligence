import { listTwinStates } from './state-engine'
import { listForecasts } from './forecast-engine'
import { listScenarioRuns } from './scenario-laboratory-engine'
import { listEnsembleRuns } from './uncertainty-ensemble-engine'

const DB='cropsmart-experiment-registry-db', VERSION=1, STORE='manifests'
export type RegistryManifest={id:string;createdAt:string;title:string;stateId:string;forecastId?:string;scenarioRunId?:string;scenarioId?:string;ensembleRunId?:string;evidenceMode:string;modelVersions:Record<string,string>;parameterVersions:Record<string,string>;lineage:string[];reproducibilityKey:string;notes:string[]}

function openDb(){return new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(DB,VERSION);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE)){const s=db.createObjectStore(STORE,{keyPath:'id'});s.createIndex('createdAt','createdAt');s.createIndex('stateId','stateId');s.createIndex('reproducibilityKey','reproducibilityKey')}};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function save(m:RegistryManifest){const db=await openDb();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(m);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});db.close()}
export async function listRegistryManifests(limit=100){const db=await openDb();const rows=await new Promise<RegistryManifest[]>((resolve,reject)=>{const r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result as RegistryManifest[]);r.onerror=()=>reject(r.error)});db.close();return rows.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,limit)}
function hash(s:string){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')}
export async function createExperimentManifest(options:{stateId?:string;title?:string;notes?:string[]}={}):Promise<RegistryManifest>{
 const states=await listTwinStates(100);const state=options.stateId?states.find(s=>s.id===options.stateId):states[0];if(!state)throw new Error('A persisted Twin State is required.')
 const forecasts=await listForecasts(100);const forecast=forecasts.find(f=>f.initialStateId===state.id)
 const scenarios=await listScenarioRuns(100);const scenario=scenarios.find(s=>s.stateId===state.id)
 const ensembles=await listEnsembleRuns(100);const ensemble=ensembles.find(e=>e.stateId===state.id&&(scenario?e.scenarioId===scenario.scenarioId:true))
 const modelVersions:Record<string,string>={state:state.modelVersion};if(forecast)modelVersions.forecast=forecast.modelVersion;if(scenario)modelVersions.scenario=scenario.modelVersion;if(ensemble)modelVersions.uncertainty=ensemble.modelVersion
 const parameterVersions:Record<string,string>={};if(scenario)parameterVersions.scenario=scenario.parameterVersion;if(ensemble)parameterVersions.uncertainty=ensemble.parameterVersion
 const lineage=[state.id,...(forecast?[forecast.id]:[]),...(scenario?[scenario.waterAnalysisId,scenario.energyAnalysisId,scenario.id]:[]),...(ensemble?[ensemble.id]:[])]
 const canonical=JSON.stringify({stateId:state.id,forecastId:forecast?.id,scenarioRunId:scenario?.id,scenarioId:scenario?.scenarioId,ensembleRunId:ensemble?.id,evidenceMode:state.evidenceMode,modelVersions,parameterVersions,lineage})
 const createdAt=new Date().toISOString();const manifest:RegistryManifest={id:`REG-${createdAt.replace(/[-:.TZ]/g,'').slice(0,14)}-${hash(canonical).slice(0,4).toUpperCase()}`,createdAt,title:options.title??`CropSmart experiment · ${scenario?.scenarioId??'state analysis'}`,stateId:state.id,forecastId:forecast?.id,scenarioRunId:scenario?.id,scenarioId:scenario?.scenarioId,ensembleRunId:ensemble?.id,evidenceMode:state.evidenceMode,modelVersions,parameterVersions,lineage,reproducibilityKey:`CS-${hash(canonical)}`,notes:[...(options.notes??[]),'Registry manifests record analytical lineage and version identifiers; they do not establish independent field validation.']};await save(manifest);return manifest
}
export function exportManifest(m:RegistryManifest){return JSON.stringify(m,null,2)}
