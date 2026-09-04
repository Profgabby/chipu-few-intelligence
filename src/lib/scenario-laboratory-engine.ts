import { getTwinState, listTwinStates, type TwinStateEstimate } from './state-engine'
import { runWaterAnalysis, type WaterAnalysisResult } from './water-intelligence-engine'
import { runEnergyAnalysis, type EnergyAnalysisResult } from './energy-intelligence-engine'
import type { AllocationStrategy, AllocationWeights, StrategyEvaluation } from './resource-allocation-engine'

const DB_NAME='cropsmart-scenario-lab-db'
const DB_VERSION=1
const STORE='experiment_runs'

export type ScenarioDefinition={
  id:string
  name:string
  category:'BASELINE'|'WATER'|'ENERGY'|'LOAD'|'AGRIVOLTAIC'|'COMPOUND'
  description:string
  waterDemandMultiplier:number
  waterDeficitOffset:number
  pvAvailabilityMultiplier:number
  batteryAvailabilityMultiplier:number
  coolingLoadMultiplier:number
  processingLoadMultiplier:number
  reserveMultiplier:number
  assumptionNote:string
}

export type ScenarioStrategyResult=StrategyEvaluation & {rank:number}

export type ScenarioExperimentRun={
  experimentId:string
  runId:string
  scenario:ScenarioDefinition
  stateId:string
  waterAnalysisId:string
  energyAnalysisId:string
  evidenceMode:TwinStateEstimate['evidenceMode']
  createdAt:string
  modelVersion:string
  parameterVersion:string
  weights:AllocationWeights
  baseline:{grossIrrigationMm:number;availableEnergyKwh:number;totalDemandKwh:number}
  perturbed:{grossIrrigationMm:number;availableEnergyKwh:number;pumpingDemandKwh:number;coolingDemandKwh:number;processingDemandKwh:number;criticalDemandKwh:number}
  strategies:ScenarioStrategyResult[]
  bestStrategy:AllocationStrategy
  bestScore:number
  warnings:string[]
  reproducibilityKey:string
}

export const scenarioCatalog:ScenarioDefinition[]=[
 {id:'S00',name:'Reference baseline',category:'BASELINE',description:'Unmodified analytical baseline for controlled comparison.',waterDemandMultiplier:1,waterDeficitOffset:0,pvAvailabilityMultiplier:1,batteryAvailabilityMultiplier:1,coolingLoadMultiplier:1,processingLoadMultiplier:1,reserveMultiplier:1,assumptionNote:'Reference condition; no scenario perturbation.'},
 {id:'S01',name:'Higher crop-water demand',category:'WATER',description:'Tests sensitivity to a 25% increase in modeled irrigation demand.',waterDemandMultiplier:1.25,waterDeficitOffset:0.01,pvAvailabilityMultiplier:1,batteryAvailabilityMultiplier:1,coolingLoadMultiplier:1,processingLoadMultiplier:1,reserveMultiplier:1,assumptionNote:'Demonstration perturbation, not a measured response coefficient.'},
 {id:'S02',name:'Delayed irrigation',category:'WATER',description:'Represents greater root-zone deficit before irrigation response.',waterDemandMultiplier:1.1,waterDeficitOffset:0.025,pvAvailabilityMultiplier:1,batteryAvailabilityMultiplier:1,coolingLoadMultiplier:1,processingLoadMultiplier:1,reserveMultiplier:1,assumptionNote:'Deficit offset is a transparent research parameter.'},
 {id:'S03',name:'Reduced PV availability',category:'ENERGY',description:'Tests resource allocation with PV availability reduced to 65% of baseline.',waterDemandMultiplier:1,waterDeficitOffset:0,pvAvailabilityMultiplier:0.65,batteryAvailabilityMultiplier:1,coolingLoadMultiplier:1,processingLoadMultiplier:1,reserveMultiplier:1,assumptionNote:'PV multiplier is a scenario parameter rather than a site-specific prediction.'},
 {id:'S04',name:'Protected energy reserve',category:'ENERGY',description:'Tests stronger reserve protection and reduced immediately usable battery energy.',waterDemandMultiplier:1,waterDeficitOffset:0,pvAvailabilityMultiplier:1,batteryAvailabilityMultiplier:0.72,coolingLoadMultiplier:1,processingLoadMultiplier:1,reserveMultiplier:1.5,assumptionNote:'Reserve multiplier is an experimental policy parameter.'},
 {id:'S05',name:'High cooling demand',category:'LOAD',description:'Tests postharvest cooling pressure at 1.6 times baseline demand.',waterDemandMultiplier:1,waterDeficitOffset:0,pvAvailabilityMultiplier:1,batteryAvailabilityMultiplier:1,coolingLoadMultiplier:1.6,processingLoadMultiplier:1,reserveMultiplier:1,assumptionNote:'Cooling-demand multiplier is illustrative pending calibrated storage models.'},
 {id:'S06',name:'AV configuration A',category:'AGRIVOLTAIC',description:'Demonstration configuration with lower water demand and modestly lower PV availability.',waterDemandMultiplier:0.9,waterDeficitOffset:0,pvAvailabilityMultiplier:0.92,batteryAvailabilityMultiplier:1,coolingLoadMultiplier:1,processingLoadMultiplier:1,reserveMultiplier:1,assumptionNote:'Configuration multipliers are illustrative and must not be interpreted as measured agrivoltaic performance.'},
 {id:'S07',name:'AV configuration B',category:'AGRIVOLTAIC',description:'Demonstration configuration with stronger water-demand reduction and lower PV availability.',waterDemandMultiplier:0.82,waterDeficitOffset:0,pvAvailabilityMultiplier:0.84,batteryAvailabilityMultiplier:1,coolingLoadMultiplier:1,processingLoadMultiplier:1,reserveMultiplier:1,assumptionNote:'Configuration multipliers are illustrative and not field-validation results.'},
 {id:'S08',name:'Compound resource stress',category:'COMPOUND',description:'Higher water and cooling demand combined with reduced PV and battery availability.',waterDemandMultiplier:1.3,waterDeficitOffset:0.02,pvAvailabilityMultiplier:0.6,batteryAvailabilityMultiplier:0.75,coolingLoadMultiplier:1.4,processingLoadMultiplier:1.1,reserveMultiplier:1.2,assumptionNote:'Compound-stress parameters are transparent research assumptions for sensitivity testing.'},
]

const defaultWeights:AllocationWeights={waterDeficit:1,energyDeficit:.8,cropRisk:1.2,foodLossRisk:1,unmetCriticalLoad:1.2,operatingCost:.35}
function clamp(v:number,min=0,max=1){return Math.max(min,Math.min(max,v))}
function norm(v:number,s:number){return clamp(s<=0?0:v/s)}
function sid(prefix:string){return `${prefix}-${new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14)}-${Math.random().toString(36).slice(2,6).toUpperCase()}`}

function evaluate(strategy:AllocationStrategy,water:WaterAnalysisResult,energy:EnergyAnalysisResult,scenario:ScenarioDefinition,weights:AllocationWeights):StrategyEvaluation{
 const grossWater=water.grossIrrigationRequirement*scenario.waterDemandMultiplier
 const baseWaterDeficit=(water.waterDeficit??0.05)+scenario.waterDeficitOffset
 const pumpNeed=energy.pumpingDemandKwh*scenario.waterDemandMultiplier
 const coolingNeed=energy.coolingDemandKwh*scenario.coolingLoadMultiplier
 const processingNeed=energy.processingDemandKwh*scenario.processingLoadMultiplier
 const criticalNeed=energy.otherCriticalDemandKwh
 const availablePv=energy.predictedPvEnergyKwh*scenario.pvAvailabilityMultiplier
 const availableBattery=energy.usableBatteryEnergyKwh*scenario.batteryAvailabilityMultiplier
 const available=availablePv+availableBattery
 const protectedReserve=Math.min(available,energy.reserveEnergyKwh*scenario.reserveMultiplier)
 let remaining=available,pump=0,cooling=0,processing=0,critical=0,reserve=0
 const take=(d:number)=>{const x=Math.min(Math.max(0,d),remaining);remaining-=x;return x}
 if(strategy==='CONVENTIONAL'){pump=take(pumpNeed);cooling=take(coolingNeed);processing=take(processingNeed);critical=take(criticalNeed);reserve=remaining}
 else if(strategy==='WATER_FIRST'){pump=take(pumpNeed);critical=take(criticalNeed);cooling=take(coolingNeed);processing=take(processingNeed);reserve=remaining}
 else if(strategy==='ENERGY_RESERVE'){remaining=Math.max(0,available-protectedReserve);reserve=protectedReserve;critical=take(criticalNeed);cooling=take(coolingNeed);pump=take(pumpNeed);processing=take(processingNeed);reserve+=remaining}
 else {
   const targetReserve=Math.min(available,protectedReserve*.6);remaining=Math.max(0,available-targetReserve);reserve=targetReserve
   const urgency=water.thresholdLeadHours!==null&&water.thresholdLeadHours<=24?1:norm(grossWater,12)
   const items=[{k:'pump',d:pumpNeed,s:weights.waterDeficit*urgency+weights.cropRisk*urgency},{k:'critical',d:criticalNeed,s:weights.unmetCriticalLoad*.9},{k:'cooling',d:coolingNeed,s:weights.foodLossRisk*.75+weights.unmetCriticalLoad*.35},{k:'processing',d:processingNeed,s:weights.operatingCost*.25+weights.energyDeficit*.25}].sort((a,b)=>b.s-a.s)
   for(const item of items){const served=take(item.d);if(item.k==='pump')pump=served;if(item.k==='critical')critical=served;if(item.k==='cooling')cooling=served;if(item.k==='processing')processing=served} reserve+=remaining
 }
 const irrigationFraction=pumpNeed>0?clamp(pump/pumpNeed):1
 const coolingFraction=coolingNeed>0?clamp(cooling/coolingNeed):1
 const criticalFraction=criticalNeed>0?clamp(critical/criticalNeed):1
 const totalDemand=Math.max(1,pumpNeed+coolingNeed+processingNeed+criticalNeed);const totalServed=pump+cooling+processing+critical
 const expectedWaterDeficitIndex=clamp(norm(baseWaterDeficit,.08)+(1-irrigationFraction)*.65)
 const expectedEnergyDeficitIndex=clamp((totalDemand-totalServed)/totalDemand)
 const thresholdUrgency=water.thresholdLeadHours===null?.25:water.thresholdLeadHours<=12?1:water.thresholdLeadHours<=24?.8:water.thresholdLeadHours<=48?.5:.2
 const expectedCropRiskIndex=clamp(expectedWaterDeficitIndex*.7+thresholdUrgency*.3)
 const expectedFoodLossRiskIndex=clamp((1-coolingFraction)*.75+(1-clamp(processing/(processingNeed||1)))*.25)
 const unmetCriticalLoadIndex=clamp(1-criticalFraction)
 const operatingCostIndex=clamp((processing/totalDemand)*.35+(1-clamp(reserve/Math.max(1,protectedReserve)))*.2)
 const consequenceScore=+(weights.waterDeficit*expectedWaterDeficitIndex+weights.energyDeficit*expectedEnergyDeficitIndex+weights.cropRisk*expectedCropRiskIndex+weights.foodLossRisk*expectedFoodLossRiskIndex+weights.unmetCriticalLoad*unmetCriticalLoadIndex+weights.operatingCost*operatingCostIndex).toFixed(4)
 const explanation=strategy==='CONSEQUENCE_AWARE'?'Ranks loads using the selected consequence weights under this scenario.':strategy==='WATER_FIRST'?'Serves pumping before non-water loads.':strategy==='ENERGY_RESERVE'?'Protects the scenario-adjusted reserve before load service.':'Uses a fixed sequential allocation.'
 return {strategy,irrigationFraction:+irrigationFraction.toFixed(3),pumpingEnergyAllocatedKwh:+pump.toFixed(2),coolingEnergyAllocatedKwh:+cooling.toFixed(2),processingEnergyAllocatedKwh:+processing.toFixed(2),criticalEnergyAllocatedKwh:+critical.toFixed(2),reserveEnergyRetainedKwh:+reserve.toFixed(2),expectedWaterDeficitIndex:+expectedWaterDeficitIndex.toFixed(3),expectedEnergyDeficitIndex:+expectedEnergyDeficitIndex.toFixed(3),expectedCropRiskIndex:+expectedCropRiskIndex.toFixed(3),expectedFoodLossRiskIndex:+expectedFoodLossRiskIndex.toFixed(3),unmetCriticalLoadIndex:+unmetCriticalLoadIndex.toFixed(3),operatingCostIndex:+operatingCostIndex.toFixed(3),consequenceScore,status:'CANDIDATE',explanation}
}

function openDb():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE)){const s=db.createObjectStore(STORE,{keyPath:'runId'});s.createIndex('createdAt','createdAt');s.createIndex('scenarioId','scenario.id');s.createIndex('stateId','stateId')}};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error??new Error('Could not open Scenario Laboratory database.'))})}
async function persist(run:ScenarioExperimentRun){const db=await openDb();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(run);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error??new Error('Could not persist scenario run.'))}})}

export async function runScenarioExperiment(options:{stateId?:string;scenarioId:string;weights?:Partial<AllocationWeights>}):Promise<ScenarioExperimentRun>{
 const state=options.stateId?await getTwinState(options.stateId):(await listTwinStates(1))[0];if(!state)throw new Error('A persisted Twin State is required before the Scenario Laboratory can run.')
 const scenario=scenarioCatalog.find(s=>s.id===options.scenarioId);if(!scenario)throw new Error(`Unknown scenario ${options.scenarioId}.`)
 const water=await runWaterAnalysis({stateId:state.id});const energy=await runEnergyAnalysis({stateId:state.id})
 const weights={...defaultWeights,...options.weights};const strategies=(['CONVENTIONAL','WATER_FIRST','ENERGY_RESERVE','CONSEQUENCE_AWARE'] as AllocationStrategy[]).map(s=>evaluate(s,water,energy,scenario,weights)).sort((a,b)=>a.consequenceScore-b.consequenceScore).map((e,i)=>({...e,rank:i+1,status:i===0?'BEST' as const:e.consequenceScore>=1.5*(arguments as any)?'CANDIDATE' as const:'CANDIDATE' as const}))
 strategies.forEach((e,i)=>{e.status=i===0?'BEST':e.consequenceScore>=strategies[0].consequenceScore*1.5?'HIGH_CONSEQUENCE':'CANDIDATE'})
 const experimentId=sid('EXP'),runId=sid('RUN');const warnings:string[]=[]
 if(state.evidenceMode==='SYNTHETIC')warnings.push('Scenario experiment uses synthetic evidence and is a research demonstration only.')
 if(state.aggregateQuality==='INSUFFICIENT')warnings.push('Initial Twin State is insufficient; scenario rankings are not operational recommendations.')
 warnings.push(scenario.assumptionNote);warnings.push('Scenario multipliers and consequence weights are explicit research parameters requiring later calibration or documented justification.')
 const perturbedAvailable=energy.predictedPvEnergyKwh*scenario.pvAvailabilityMultiplier+energy.usableBatteryEnergyKwh*scenario.batteryAvailabilityMultiplier
 const perturbedPump=energy.pumpingDemandKwh*scenario.waterDemandMultiplier
 const perturbedCooling=energy.coolingDemandKwh*scenario.coolingLoadMultiplier
 const perturbedProcessing=energy.processingDemandKwh*scenario.processingLoadMultiplier
 const key=[state.id,scenario.id,'SCENARIO-LAB-0.1.0',JSON.stringify(weights),scenario.waterDemandMultiplier,scenario.pvAvailabilityMultiplier,scenario.batteryAvailabilityMultiplier,scenario.coolingLoadMultiplier].join('|')
 const run:ScenarioExperimentRun={experimentId,runId,scenario,stateId:state.id,waterAnalysisId:water.id,energyAnalysisId:energy.id,evidenceMode:state.evidenceMode,createdAt:new Date().toISOString(),modelVersion:'SCENARIO-LAB-0.1.0',parameterVersion:'SCENARIO-CATALOG-0.1.0',weights,baseline:{grossIrrigationMm:water.grossIrrigationRequirement,availableEnergyKwh:energy.totalAvailableEnergyKwh,totalDemandKwh:energy.totalDemandKwh},perturbed:{grossIrrigationMm:+(water.grossIrrigationRequirement*scenario.waterDemandMultiplier).toFixed(3),availableEnergyKwh:+perturbedAvailable.toFixed(2),pumpingDemandKwh:+perturbedPump.toFixed(2),coolingDemandKwh:+perturbedCooling.toFixed(2),processingDemandKwh:+perturbedProcessing.toFixed(2),criticalDemandKwh:energy.otherCriticalDemandKwh},strategies,bestStrategy:strategies[0].strategy,bestScore:strategies[0].consequenceScore,warnings,reproducibilityKey:key}
 await persist(run);return run
}

export async function listScenarioRuns(limit=50):Promise<ScenarioExperimentRun[]>{const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const r=tx.objectStore(STORE).getAll();r.onsuccess=()=>{const rows=(r.result as ScenarioExperimentRun[]).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)).slice(0,limit);db.close();resolve(rows)};r.onerror=()=>{db.close();reject(r.error??new Error('Could not read scenario history.'))}})}
export function exportScenarioRun(run:ScenarioExperimentRun){return JSON.stringify(run,null,2)}
