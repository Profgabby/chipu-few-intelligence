import { getTwinState, listTwinStates, type TwinStateEstimate } from './state-engine'
import { runWaterAnalysis } from './water-intelligence-engine'
import { runEnergyAnalysis } from './energy-intelligence-engine'
import { scenarioCatalog, type ScenarioDefinition } from './scenario-laboratory-engine'
import type { AllocationStrategy } from './resource-allocation-engine'

const DB_NAME='cropsmart-uncertainty-db'
const DB_VERSION=1
const STORE='ensemble_runs'

export type UncertaintyParameter={
  key:'waterDemand'|'pvAvailability'|'batteryAvailability'|'coolingDemand'|'processingDemand'|'waterDeficit'
  label:string
  relativeSd:number
  lowerMultiplier:number
  upperMultiplier:number
}

export type StrategyDistribution={
  strategy:AllocationStrategy
  meanScore:number
  medianScore:number
  p10:number
  p90:number
  minScore:number
  maxScore:number
  bestCount:number
  bestProbability:number
  meanWaterDeficitIndex:number
  meanEnergyDeficitIndex:number
  meanCropRiskIndex:number
  meanFoodLossRiskIndex:number
  meanCriticalLoadIndex:number
}

export type SensitivityResult={parameter:UncertaintyParameter['key'];label:string;correlation:number;absoluteCorrelation:number}

export type EnsembleRun={
  id:string
  stateId:string
  scenarioId:string
  scenarioName:string
  evidenceMode:TwinStateEstimate['evidenceMode']
  createdAt:string
  modelVersion:string
  parameterVersion:string
  seed:number
  sampleCount:number
  parameters:UncertaintyParameter[]
  strategyDistributions:StrategyDistribution[]
  robustStrategy:AllocationStrategy
  robustStrategyProbability:number
  sensitivity:SensitivityResult[]
  warnings:string[]
  method:string
}

type Sample={
  waterDemand:number;pvAvailability:number;batteryAvailability:number;coolingDemand:number;processingDemand:number;waterDeficit:number
  scores:Record<AllocationStrategy,number>
  consequences:Record<AllocationStrategy,{water:number;energy:number;crop:number;food:number;critical:number}>
  best:AllocationStrategy
}

export const defaultUncertaintyParameters:UncertaintyParameter[]=[
 {key:'waterDemand',label:'Water-demand multiplier',relativeSd:.12,lowerMultiplier:.7,upperMultiplier:1.35},
 {key:'pvAvailability',label:'PV-availability multiplier',relativeSd:.15,lowerMultiplier:.45,upperMultiplier:1.25},
 {key:'batteryAvailability',label:'Battery-availability multiplier',relativeSd:.12,lowerMultiplier:.5,upperMultiplier:1.2},
 {key:'coolingDemand',label:'Cooling-demand multiplier',relativeSd:.18,lowerMultiplier:.6,upperMultiplier:1.6},
 {key:'processingDemand',label:'Processing-demand multiplier',relativeSd:.15,lowerMultiplier:.6,upperMultiplier:1.5},
 {key:'waterDeficit',label:'Root-zone deficit perturbation',relativeSd:.2,lowerMultiplier:.5,upperMultiplier:1.8},
]

const strategies:AllocationStrategy[]=['CONVENTIONAL','WATER_FIRST','ENERGY_RESERVE','CONSEQUENCE_AWARE']
const weights={water:1,energy:.8,crop:1.2,food:1,critical:1.2,cost:.35}
function clamp(v:number,min=0,max=1){return Math.max(min,Math.min(max,v))}
function rid(){return `UNC-${new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14)}-${Math.random().toString(36).slice(2,6).toUpperCase()}`}
function mulberry32(seed:number){return()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function normal(rng:()=>number){const u=Math.max(1e-12,rng()),v=Math.max(1e-12,rng());return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function bounded(base:number,p:UncertaintyParameter,rng:()=>number){const raw=base*(1+p.relativeSd*normal(rng));return Math.max(base*p.lowerMultiplier,Math.min(base*p.upperMultiplier,raw))}
function percentile(values:number[],q:number){if(!values.length)return 0;const a=[...values].sort((x,y)=>x-y);const i=(a.length-1)*q;const lo=Math.floor(i),hi=Math.ceil(i);return lo===hi?a[lo]:a[lo]+(a[hi]-a[lo])*(i-lo)}
function corr(xs:number[],ys:number[]){const n=Math.min(xs.length,ys.length);if(n<2)return 0;const mx=xs.reduce((a,b)=>a+b,0)/n,my=ys.reduce((a,b)=>a+b,0)/n;let num=0,dx=0,dy=0;for(let i=0;i<n;i++){const x=xs[i]-mx,y=ys[i]-my;num+=x*y;dx+=x*x;dy+=y*y}return dx&&dy?num/Math.sqrt(dx*dy):0}

function evaluate(strategy:AllocationStrategy,input:{pump:number;cool:number;process:number;critical:number;available:number;reserve:number;baseDeficit:number;thresholdUrgency:number}){
 let {pump:pn,cool:cn,process:prn,critical:crn,available,reserve}=input
 let pump=0,cool=0,process=0,critical=0,kept=0,remaining=available
 const take=(d:number)=>{const s=Math.min(Math.max(0,d),remaining);remaining-=s;return s}
 if(strategy==='CONVENTIONAL'){pump=take(pn);cool=take(cn);process=take(prn);critical=take(crn);kept=remaining}
 else if(strategy==='WATER_FIRST'){pump=take(pn);critical=take(crn);cool=take(cn);process=take(prn);kept=remaining}
 else if(strategy==='ENERGY_RESERVE'){const protectedReserve=Math.min(available,Math.max(reserve,available*.18));remaining=Math.max(0,available-protectedReserve);kept=protectedReserve;critical=take(crn);cool=take(cn);pump=take(pn);process=take(prn);kept+=remaining}
 else {const target=Math.min(available,reserve*.55);remaining=Math.max(0,available-target);kept=target;const items=[{k:'pump',d:pn,s:weights.water+weights.crop},{k:'critical',d:crn,s:weights.critical*.9},{k:'cool',d:cn,s:weights.food*.8+weights.critical*.3},{k:'process',d:prn,s:weights.cost*.3+weights.energy*.25}].sort((a,b)=>b.s-a.s);for(const it of items){const s=take(it.d);if(it.k==='pump')pump=s;if(it.k==='critical')critical=s;if(it.k==='cool')cool=s;if(it.k==='process')process=s}kept+=remaining}
 const irrigation=pn>0?clamp(pump/pn):1,cooling=cn>0?clamp(cool/cn):1,criticalFrac=crn>0?clamp(critical/crn):1,processing=prn>0?clamp(process/prn):1
 const total=Math.max(1,pn+cn+prn+crn),served=pump+cool+process+critical
 const water=clamp(input.baseDeficit/.08+(1-irrigation)*.65)
 const energy=clamp((total-served)/total)
 const crop=clamp(water*.7+input.thresholdUrgency*.3)
 const food=clamp((1-cooling)*.75+(1-processing)*.25)
 const criticalGap=clamp(1-criticalFrac)
 const cost=clamp((process/total)*.35+(1-clamp(kept/Math.max(1,reserve)))*.2)
 const score=weights.water*water+weights.energy*energy+weights.crop*crop+weights.food*food+weights.critical*criticalGap+weights.cost*cost
 return {score,water,energy,crop,food,critical:criticalGap}
}

function openDb():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE)){const s=db.createObjectStore(STORE,{keyPath:'id'});s.createIndex('createdAt','createdAt');s.createIndex('stateId','stateId');s.createIndex('scenarioId','scenarioId')}};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error??new Error('Could not open uncertainty database.'))})}
async function persist(run:EnsembleRun){const db=await openDb();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(run);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error??new Error('Could not persist ensemble run.'))}})}

export async function runUncertaintyEnsemble(options:{stateId?:string;scenarioId?:string;sampleCount?:number;seed?:number;parameters?:UncertaintyParameter[]}={}):Promise<EnsembleRun>{
 const state=options.stateId?await getTwinState(options.stateId):(await listTwinStates(1))[0];if(!state)throw new Error('A persisted Twin State is required before uncertainty analysis can run.')
 const scenario:ScenarioDefinition=scenarioCatalog.find(s=>s.id===(options.scenarioId??'S00'))??scenarioCatalog[0]
 const water=await runWaterAnalysis({stateId:state.id});const energy=await runEnergyAnalysis({stateId:state.id})
 const sampleCount=Math.max(50,Math.min(2000,Math.round(options.sampleCount??300)));const seed=Math.round(options.seed??20260904);const rng=mulberry32(seed);const parameters=options.parameters??defaultUncertaintyParameters
 const pmap=Object.fromEntries(parameters.map(p=>[p.key,p])) as Record<UncertaintyParameter['key'],UncertaintyParameter>
 const samples:Sample[]=[]
 for(let i=0;i<sampleCount;i++){
  const waterDemand=bounded(scenario.waterDemandMultiplier,pmap.waterDemand,rng),pvAvailability=bounded(scenario.pvAvailabilityMultiplier,pmap.pvAvailability,rng),batteryAvailability=bounded(scenario.batteryAvailabilityMultiplier,pmap.batteryAvailability,rng),coolingDemand=bounded(scenario.coolingLoadMultiplier,pmap.coolingDemand,rng),processingDemand=bounded(scenario.processingLoadMultiplier,pmap.processingDemand,rng)
  const deficitBase=Math.max(.002,(water.waterDeficit??.04)+scenario.waterDeficitOffset);const waterDeficit=bounded(deficitBase,pmap.waterDeficit,rng)
  const input={pump:energy.pumpingDemandKwh*waterDemand,cool:energy.coolingDemandKwh*coolingDemand,process:energy.processingDemandKwh*processingDemand,critical:energy.otherCriticalDemandKwh,available:energy.predictedPvEnergyKwh*pvAvailability+energy.usableBatteryEnergyKwh*batteryAvailability,reserve:energy.reserveEnergyKwh*scenario.reserveMultiplier,baseDeficit:waterDeficit,thresholdUrgency:water.thresholdLeadHours===null?.25:water.thresholdLeadHours<=12?1:water.thresholdLeadHours<=24?.8:water.thresholdLeadHours<=48?.5:.2}
  const scores={} as Record<AllocationStrategy,number>,consequences={} as Sample['consequences'];for(const s of strategies){const e=evaluate(s,input);scores[s]=e.score;consequences[s]={water:e.water,energy:e.energy,crop:e.crop,food:e.food,critical:e.critical}}
  const best=[...strategies].sort((a,b)=>scores[a]-scores[b])[0];samples.push({waterDemand,pvAvailability,batteryAvailability,coolingDemand,processingDemand,waterDeficit,scores,consequences,best})
 }
 const strategyDistributions:StrategyDistribution[]=strategies.map(strategy=>{const vals=samples.map(s=>s.scores[strategy]),bestCount=samples.filter(s=>s.best===strategy).length;return{strategy,meanScore:+(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(4),medianScore:+percentile(vals,.5).toFixed(4),p10:+percentile(vals,.1).toFixed(4),p90:+percentile(vals,.9).toFixed(4),minScore:+Math.min(...vals).toFixed(4),maxScore:+Math.max(...vals).toFixed(4),bestCount,bestProbability:+(bestCount/sampleCount).toFixed(3),meanWaterDeficitIndex:+(samples.reduce((a,s)=>a+s.consequences[strategy].water,0)/sampleCount).toFixed(3),meanEnergyDeficitIndex:+(samples.reduce((a,s)=>a+s.consequences[strategy].energy,0)/sampleCount).toFixed(3),meanCropRiskIndex:+(samples.reduce((a,s)=>a+s.consequences[strategy].crop,0)/sampleCount).toFixed(3),meanFoodLossRiskIndex:+(samples.reduce((a,s)=>a+s.consequences[strategy].food,0)/sampleCount).toFixed(3),meanCriticalLoadIndex:+(samples.reduce((a,s)=>a+s.consequences[strategy].critical,0)/sampleCount).toFixed(3)}}).sort((a,b)=>b.bestProbability-a.bestProbability||a.meanScore-b.meanScore)
 const robustStrategy=strategyDistributions[0].strategy,robustScores=samples.map(s=>s.scores[robustStrategy])
 const inputs:{key:UncertaintyParameter['key'];label:string;values:number[]}[]=[{key:'waterDemand',label:'Water-demand multiplier',values:samples.map(s=>s.waterDemand)},{key:'pvAvailability',label:'PV-availability multiplier',values:samples.map(s=>s.pvAvailability)},{key:'batteryAvailability',label:'Battery-availability multiplier',values:samples.map(s=>s.batteryAvailability)},{key:'coolingDemand',label:'Cooling-demand multiplier',values:samples.map(s=>s.coolingDemand)},{key:'processingDemand',label:'Processing-demand multiplier',values:samples.map(s=>s.processingDemand)},{key:'waterDeficit',label:'Root-zone deficit perturbation',values:samples.map(s=>s.waterDeficit)}]
 const sensitivity=inputs.map(x=>{const c=corr(x.values,robustScores);return{parameter:x.key,label:x.label,correlation:+c.toFixed(3),absoluteCorrelation:+Math.abs(c).toFixed(3)}}).sort((a,b)=>b.absoluteCorrelation-a.absoluteCorrelation)
 const warnings:string[]=[];if(state.evidenceMode==='SYNTHETIC')warnings.push('Ensemble analysis uses synthetic evidence and is a research demonstration only.');if(state.aggregateQuality==='INSUFFICIENT')warnings.push('Initial Twin State is insufficient; uncertainty results are not operational recommendations.');warnings.push('Input distributions are bounded demonstration assumptions, not fitted probability distributions from field calibration.');warnings.push('Reported P10/P90 intervals describe this computational ensemble only and should not be interpreted as validated statistical confidence intervals.')
 const run:EnsembleRun={id:rid(),stateId:state.id,scenarioId:scenario.id,scenarioName:scenario.name,evidenceMode:state.evidenceMode,createdAt:new Date().toISOString(),modelVersion:'UNCERTAINTY-ENSEMBLE-0.1.0',parameterVersion:'UNCERTAINTY-PARAMETERS-0.1.0',seed,sampleCount,parameters,strategyDistributions,robustStrategy,robustStrategyProbability:strategyDistributions[0].bestProbability,sensitivity,warnings,method:'seeded bounded Monte Carlo-style ensemble around transparent scenario multipliers. Strategy robustness is summarized by frequency of lowest modeled consequence score; sensitivity uses Pearson correlation with the robust-strategy score. The ensemble is for research development and is not independently calibrated or field validated.'}
 await persist(run);return run
}

export async function listEnsembleRuns(limit=30):Promise<EnsembleRun[]>{const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const r=tx.objectStore(STORE).getAll();r.onsuccess=()=>{const rows=(r.result as EnsembleRun[]).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)).slice(0,limit);db.close();resolve(rows)};r.onerror=()=>{db.close();reject(r.error??new Error('Could not read ensemble history.'))}})}
export function exportEnsembleRun(run:EnsembleRun){return JSON.stringify(run,null,2)}
