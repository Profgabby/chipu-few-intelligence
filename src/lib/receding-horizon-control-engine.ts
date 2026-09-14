import type { ForecastPoint, ForecastRun } from './forecast-engine'
import { scenarioCatalog, type ScenarioExperimentRun, type ScenarioStrategyResult } from './scenario-laboratory-engine'
import type { AllocationStrategy, AllocationWeights } from './resource-allocation-engine'

const DB_NAME='chipu-receding-horizon-control-db'
const DB_VERSION=1
const STORE='runs'
const MODEL_VERSION='RECEDING-HORIZON-CONTROL-0.1.0'
const defaultWeights:AllocationWeights={waterDeficit:1,energyDeficit:.8,cropRisk:1.2,foodLossRisk:1,unmetCriticalLoad:1.2,operatingCost:.35}
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v))
const id=(prefix:string)=>`${prefix}-${new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14)}-${Math.random().toString(36).slice(2,6).toUpperCase()}`

export type RollingControlState={soilWater:number|null;tankLevel:number|null;batterySoc:number|null}
export type RollingControlAction={strategy:AllocationStrategy;irrigationFraction:number;pumpingEnergyKwh:number;coolingEnergyKwh:number;processingEnergyKwh:number;criticalEnergyKwh:number;reserveEnergyKwh:number}
export type RollingControlStep={index:number;validTime:string;leadHours:number;lookaheadHours:number;preState:RollingControlState;forecastPoint:ForecastPoint;action:RollingControlAction;postState:RollingControlState;consequenceScore:number;uncertaintyMultiplier:number}
export type RecedingHorizonControlRun=ScenarioExperimentRun&{forecastId:string;controlMode:'RECEDING_HORIZON';lookaheadHours:number;decisionIntervalHours:number;steps:RollingControlStep[];stateUpdates:number;trajectorySummary:{totalIrrigationServedMm:number;totalPumpingEnergyKwh:number;totalPvEnergyKwh:number;minimumBatterySoc:number|null;endingBatterySoc:number|null;minimumSoilWater:number|null;endingTankLevel:number|null;meanConsequenceScore:number}}

type ScenarioDef=NonNullable<ReturnType<typeof scenarioCatalog.find>>

type StepEvaluation={result:ScenarioStrategyResult;servedIrrigationMm:number;availableEnergyKwh:number}

function openDb():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{if(typeof indexedDB==='undefined'){reject(new Error('IndexedDB is not available in this browser.'));return}const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE)){const s=db.createObjectStore(STORE,{keyPath:'runId'});s.createIndex('createdAt','createdAt');s.createIndex('forecastId','forecastId')}};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error??new Error('Could not open receding-horizon control database.'))})}
async function persist(run:RecedingHorizonControlRun){const db=await openDb();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(run);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error??new Error('Could not persist receding-horizon control run.'))}})}
export async function listRecedingHorizonRuns(limit=50):Promise<RecedingHorizonControlRun[]>{const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const req=tx.objectStore(STORE).getAll();req.onsuccess=()=>{const rows=(req.result as RecedingHorizonControlRun[]).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)).slice(0,limit);db.close();resolve(rows)};req.onerror=()=>{db.close();reject(req.error??new Error('Could not read receding-horizon history.'))}})}

function aggregateWindow(points:ForecastPoint[],stepHours:number,scenario:ScenarioDef){const cropWater=points.reduce((s,p)=>s+p.cropWaterDemand,0)*scenario.waterDemandMultiplier;const irrigation=points.reduce((s,p)=>s+p.irrigationRequirement,0)*scenario.waterDemandMultiplier;const pump=points.reduce((s,p)=>s+p.pumpingEnergy,0)*scenario.waterDemandMultiplier;const pv=points.reduce((s,p)=>s+(p.pvPower??0)*stepHours,0)*scenario.pvAvailabilityMultiplier;const cooling=Math.max(0,points.length*stepHours/24*5.5*scenario.coolingLoadMultiplier);const processing=Math.max(0,points.length*stepHours/24*3.5*scenario.processingLoadMultiplier);const critical=Math.max(0,points.length*stepHours/24*2.5);const uncertainty=points.length?points.reduce((s,p)=>s+p.uncertaintyMultiplier,0)/points.length:1;return{cropWater,irrigation,pump,pv,cooling,processing,critical,uncertainty}}

function evaluateStrategy(strategy:AllocationStrategy,window:ReturnType<typeof aggregateWindow>,state:RollingControlState,scenario:ScenarioDef,weights:AllocationWeights,current:ForecastPoint):StepEvaluation{
  const batteryEnergy=Math.max(0,(state.batterySoc??current.batterySoc??0)/100*window.pv*.22*scenario.batteryAvailabilityMultiplier)
  const available=Math.max(0,window.pv+batteryEnergy)
  let remaining=available,pump=0,cooling=0,processing=0,critical=0,reserve=0
  const take=(d:number)=>{const served=Math.min(Math.max(0,d),remaining);remaining-=served;return served}
  if(strategy==='WATER_FIRST'){pump=take(window.pump);critical=take(window.critical);cooling=take(window.cooling);processing=take(window.processing)}
  else if(strategy==='ENERGY_RESERVE'){const target=available*.22*scenario.reserveMultiplier;remaining=Math.max(0,available-target);reserve=target;critical=take(window.critical);cooling=take(window.cooling);pump=take(window.pump);processing=take(window.processing)}
  else if(strategy==='CONSEQUENCE_AWARE'){const target=available*.12*scenario.reserveMultiplier;remaining=Math.max(0,available-target);reserve=target;const items=[{key:'pump',d:window.pump,score:weights.waterDeficit+weights.cropRisk},{key:'critical',d:window.critical,score:weights.unmetCriticalLoad},{key:'cooling',d:window.cooling,score:weights.foodLossRisk},{key:'processing',d:window.processing,score:weights.operatingCost}].sort((a,b)=>b.score-a.score);for(const item of items){const served=take(item.d);if(item.key==='pump')pump=served;if(item.key==='critical')critical=served;if(item.key==='cooling')cooling=served;if(item.key==='processing')processing=served}}
  else{pump=take(window.pump);cooling=take(window.cooling);processing=take(window.processing);critical=take(window.critical)}
  reserve+=Math.max(0,remaining)
  const irrigationFraction=window.pump>0?clamp(pump/window.pump):1
  const totalDemand=Math.max(1,window.pump+window.cooling+window.processing+window.critical)
  const served=pump+cooling+processing+critical
  const soilDeficit=state.soilWater===null?0:clamp((.29-state.soilWater)/.12)
  const uncertaintyPenalty=clamp((window.uncertainty-1)/1.2,0,.5)
  const waterDef=clamp(soilDeficit*.45+(1-irrigationFraction)*.4+uncertaintyPenalty*.15)
  const energyDef=clamp((totalDemand-served)/totalDemand+uncertaintyPenalty*.15)
  const cropRisk=clamp(waterDef*.72+uncertaintyPenalty*.28)
  const foodRisk=clamp((1-clamp(cooling/(window.cooling||1)))*.75+(1-clamp(processing/(window.processing||1)))*.25)
  const criticalRisk=clamp(1-clamp(critical/(window.critical||1)))
  const operating=clamp((processing/totalDemand)*.3+(1-clamp(reserve/Math.max(1,available*.12)))*.2+uncertaintyPenalty*.2)
  const score=+(weights.waterDeficit*waterDef+weights.energyDeficit*energyDef+weights.cropRisk*cropRisk+weights.foodLossRisk*foodRisk+weights.unmetCriticalLoad*criticalRisk+weights.operatingCost*operating).toFixed(4)
  const result:ScenarioStrategyResult={strategy,irrigationFraction:+irrigationFraction.toFixed(3),pumpingEnergyAllocatedKwh:+pump.toFixed(3),coolingEnergyAllocatedKwh:+cooling.toFixed(3),processingEnergyAllocatedKwh:+processing.toFixed(3),criticalEnergyAllocatedKwh:+critical.toFixed(3),reserveEnergyRetainedKwh:+reserve.toFixed(3),expectedWaterDeficitIndex:+waterDef.toFixed(3),expectedEnergyDeficitIndex:+energyDef.toFixed(3),expectedCropRiskIndex:+cropRisk.toFixed(3),expectedFoodLossRiskIndex:+foodRisk.toFixed(3),unmetCriticalLoadIndex:+criticalRisk.toFixed(3),operatingCostIndex:+operating.toFixed(3),consequenceScore:score,status:'CANDIDATE',explanation:`${strategy.split('_').join(' ')} evaluated over a moving ${window.irrigation>=0?'lookahead':'planning'} window; only the current-step action is applied.`,rank:0}
  return{result,servedIrrigationMm:+(current.irrigationRequirement*scenario.waterDemandMultiplier*irrigationFraction).toFixed(3),availableEnergyKwh:available}
}

function applyAction(state:RollingControlState,point:ForecastPoint,evaln:StepEvaluation,stepHours:number,scenario:ScenarioDef):RollingControlState{
  const irrigation=evaln.servedIrrigationMm
  const cropDemand=point.cropWaterDemand*scenario.waterDemandMultiplier
  const rain=point.forcing.precipitationMm
  const soilWater=state.soilWater===null?(point.soilWater??null):+clamp(state.soilWater-(cropDemand/1000)+(rain/1000)+(irrigation/1000),.05,.6).toFixed(4)
  const tankLevel=state.tankLevel===null?(point.tankLevel??null):+clamp(state.tankLevel-irrigation*.18,0,100).toFixed(2)
  const pvEnergy=(point.pvPower??0)*stepHours*scenario.pvAvailabilityMultiplier
  const actionEnergy=evaln.result.pumpingEnergyAllocatedKwh+evaln.result.coolingEnergyAllocatedKwh+evaln.result.processingEnergyAllocatedKwh+evaln.result.criticalEnergyAllocatedKwh
  const batterySoc=state.batterySoc===null?(point.batterySoc??null):+clamp(state.batterySoc+(pvEnergy-actionEnergy)*.8,0,100).toFixed(2)
  return{soilWater,tankLevel,batterySoc}
}

export async function runRecedingHorizonControl(options:{forecast:ForecastRun;scenarioId:string;lookaheadHours?:number;weights?:Partial<AllocationWeights>}):Promise<RecedingHorizonControlRun>{
  const forecast=options.forecast
  const scenario=scenarioCatalog.find(s=>s.id===options.scenarioId)
  if(!scenario)throw new Error(`Unknown scenario ${options.scenarioId}.`)
  if(forecast.points.length<2)throw new Error('Forecast requires at least two points for receding-horizon control.')
  const lookaheadHours=Math.max(forecast.stepHours,options.lookaheadHours??24)
  const weights={...defaultWeights,...options.weights}
  const points=forecast.points.filter(p=>p.leadHours>0)
  let state:RollingControlState={soilWater:forecast.points[0].soilWater,tankLevel:forecast.points[0].tankLevel,batterySoc:forecast.points[0].batterySoc}
  const steps:RollingControlStep[]=[]
  const strategyScores=new Map<AllocationStrategy,number[]>()
  for(let i=0;i<points.length;i++){
    const current=points[i]
    const windowPoints=points.filter(p=>p.leadHours>=current.leadHours&&p.leadHours<current.leadHours+lookaheadHours)
    const window=aggregateWindow(windowPoints,forecast.stepHours,scenario)
    const evaluations=(['CONVENTIONAL','WATER_FIRST','ENERGY_RESERVE','CONSEQUENCE_AWARE'] as AllocationStrategy[]).map(strategy=>evaluateStrategy(strategy,window,state,scenario,weights,current)).sort((a,b)=>a.result.consequenceScore-b.result.consequenceScore)
    evaluations.forEach((e,rank)=>{e.result.rank=rank+1;e.result.status=rank===0?'BEST':rank===evaluations.length-1?'HIGH_CONSEQUENCE':'CANDIDATE';const scores=strategyScores.get(e.result.strategy)??[];scores.push(e.result.consequenceScore);strategyScores.set(e.result.strategy,scores)})
    const chosen=evaluations[0]
    const preState={...state}
    state=applyAction(state,current,chosen,forecast.stepHours,scenario)
    steps.push({index:i,validTime:current.validTime,leadHours:current.leadHours,lookaheadHours,preState,forecastPoint:current,action:{strategy:chosen.result.strategy,irrigationFraction:chosen.result.irrigationFraction,pumpingEnergyKwh:chosen.result.pumpingEnergyAllocatedKwh,coolingEnergyKwh:chosen.result.coolingEnergyAllocatedKwh,processingEnergyKwh:chosen.result.processingEnergyAllocatedKwh,criticalEnergyKwh:chosen.result.criticalEnergyAllocatedKwh,reserveEnergyKwh:chosen.result.reserveEnergyRetainedKwh},postState:{...state},consequenceScore:chosen.result.consequenceScore,uncertaintyMultiplier:current.uncertaintyMultiplier})
  }
  const aggregateStrategies=([...strategyScores.entries()].map(([strategy,scores])=>({strategy,mean:scores.reduce((a,b)=>a+b,0)/scores.length})) as {strategy:AllocationStrategy;mean:number}[]).sort((a,b)=>a.mean-b.mean)
  const strategies:ScenarioStrategyResult[]=aggregateStrategies.map((item,index)=>({strategy:item.strategy,irrigationFraction:0,pumpingEnergyAllocatedKwh:0,coolingEnergyAllocatedKwh:0,processingEnergyAllocatedKwh:0,criticalEnergyAllocatedKwh:0,reserveEnergyRetainedKwh:0,expectedWaterDeficitIndex:0,expectedEnergyDeficitIndex:0,expectedCropRiskIndex:0,expectedFoodLossRiskIndex:0,unmetCriticalLoadIndex:0,operatingCostIndex:0,consequenceScore:+item.mean.toFixed(4),status:index===0?'BEST':index===aggregateStrategies.length-1?'HIGH_CONSEQUENCE':'CANDIDATE',explanation:`Mean receding-horizon consequence score across ${steps.length} decisions.`,rank:index+1}))
  const irrigationServed=steps.reduce((s,step)=>s+step.forecastPoint.irrigationRequirement*scenario.waterDemandMultiplier*step.action.irrigationFraction,0)
  const pumpEnergy=steps.reduce((s,step)=>s+step.action.pumpingEnergyKwh,0)
  const pvEnergy=points.reduce((s,p)=>s+(p.pvPower??0)*forecast.stepHours*scenario.pvAvailabilityMultiplier,0)
  const batteryValues=steps.map(s=>s.postState.batterySoc).filter((v):v is number=>v!==null)
  const soilValues=steps.map(s=>s.postState.soilWater).filter((v):v is number=>v!==null)
  const meanScore=steps.reduce((s,step)=>s+step.consequenceScore,0)/Math.max(1,steps.length)
  const run:RecedingHorizonControlRun={experimentId:id('EXP-RHC'),runId:id('RHC'),scenario,stateId:forecast.initialStateId,waterAnalysisId:`RHC-WATER-${forecast.id}`,energyAnalysisId:`RHC-ENERGY-${forecast.id}`,evidenceMode:forecast.evidenceMode,createdAt:new Date().toISOString(),modelVersion:MODEL_VERSION,parameterVersion:'RHC-PARAMS-0.1.0',weights,baseline:{grossIrrigationMm:points.reduce((s,p)=>s+p.irrigationRequirement,0),availableEnergyKwh:points.reduce((s,p)=>s+(p.pvPower??0)*forecast.stepHours,0),totalDemandKwh:points.reduce((s,p)=>s+p.pumpingEnergy,0)},perturbed:{grossIrrigationMm:+(points.reduce((s,p)=>s+p.irrigationRequirement,0)*scenario.waterDemandMultiplier).toFixed(3),availableEnergyKwh:+pvEnergy.toFixed(2),pumpingDemandKwh:+(points.reduce((s,p)=>s+p.pumpingEnergy,0)*scenario.waterDemandMultiplier).toFixed(3),coolingDemandKwh:+(points.length*forecast.stepHours/24*5.5*scenario.coolingLoadMultiplier).toFixed(2),processingDemandKwh:+(points.length*forecast.stepHours/24*3.5*scenario.processingLoadMultiplier).toFixed(2),criticalDemandKwh:+(points.length*forecast.stepHours/24*2.5).toFixed(2)},strategies,bestStrategy:strategies[0].strategy,bestScore:strategies[0].consequenceScore,warnings:[...forecast.warnings,scenario.assumptionNote,'Receding-horizon controller evaluates a moving lookahead window and applies only the current-step action before updating modeled water, tank and battery states.','This is a research-stage predictive controller and does not represent field-validated autonomous operation.'],reproducibilityKey:[forecast.id,scenario.id,MODEL_VERSION,lookaheadHours,JSON.stringify(weights)].join('|'),forecastId:forecast.id,controlMode:'RECEDING_HORIZON',lookaheadHours,decisionIntervalHours:forecast.stepHours,steps,stateUpdates:steps.length,trajectorySummary:{totalIrrigationServedMm:+irrigationServed.toFixed(3),totalPumpingEnergyKwh:+pumpEnergy.toFixed(3),totalPvEnergyKwh:+pvEnergy.toFixed(2),minimumBatterySoc:batteryValues.length?+Math.min(...batteryValues).toFixed(2):null,endingBatterySoc:batteryValues.length?batteryValues[batteryValues.length-1]:null,minimumSoilWater:soilValues.length?+Math.min(...soilValues).toFixed(4):null,endingTankLevel:steps.length?steps[steps.length-1].postState.tankLevel:null,meanConsequenceScore:+meanScore.toFixed(4)}}
  await persist(run)
  return run
}
