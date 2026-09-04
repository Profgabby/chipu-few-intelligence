import { getTwinState, listTwinStates, type TwinStateEstimate } from './state-engine'
import { runWaterAnalysis, type WaterAnalysisResult } from './water-intelligence-engine'
import { runEnergyAnalysis, type EnergyAnalysisResult } from './energy-intelligence-engine'

export type AllocationStrategy = 'CONVENTIONAL' | 'WATER_FIRST' | 'ENERGY_RESERVE' | 'CONSEQUENCE_AWARE'

export type AllocationWeights = {
  waterDeficit: number
  energyDeficit: number
  cropRisk: number
  foodLossRisk: number
  unmetCriticalLoad: number
  operatingCost: number
}

export type StrategyEvaluation = {
  strategy: AllocationStrategy
  irrigationFraction: number
  pumpingEnergyAllocatedKwh: number
  coolingEnergyAllocatedKwh: number
  processingEnergyAllocatedKwh: number
  criticalEnergyAllocatedKwh: number
  reserveEnergyRetainedKwh: number
  expectedWaterDeficitIndex: number
  expectedEnergyDeficitIndex: number
  expectedCropRiskIndex: number
  expectedFoodLossRiskIndex: number
  unmetCriticalLoadIndex: number
  operatingCostIndex: number
  consequenceScore: number
  status: 'BEST' | 'CANDIDATE' | 'HIGH_CONSEQUENCE'
  explanation: string
}

export type ResourceAllocationResult = {
  id: string
  stateId: string
  waterAnalysisId: string
  energyAnalysisId: string
  zoneId: string
  evidenceMode: TwinStateEstimate['evidenceMode']
  createdAt: string
  modelVersion: string
  status: 'PASS' | 'WATCH' | 'INSUFFICIENT'
  weights: AllocationWeights
  recommendedStrategy: AllocationStrategy
  evaluations: StrategyEvaluation[]
  warnings: string[]
  method: string
}

function rid(){return `ALLOC-${new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14)}-${Math.random().toString(36).slice(2,6).toUpperCase()}`}
function clamp(v:number,min=0,max=1){return Math.max(min,Math.min(max,v))}
function norm(v:number, scale:number){return clamp(scale<=0?0:v/scale)}

function evaluateStrategy(strategy:AllocationStrategy, water:WaterAnalysisResult, energy:EnergyAnalysisResult, weights:AllocationWeights):StrategyEvaluation {
  const available=energy.totalAvailableEnergyKwh
  const pumpNeed=energy.pumpingDemandKwh
  const coolingNeed=energy.coolingDemandKwh
  const processingNeed=energy.processingDemandKwh
  const criticalNeed=energy.otherCriticalDemandKwh
  let pump=0,cooling=0,processing=0,critical=0,reserve=0
  let remaining=available

  const take=(demand:number)=>{const served=Math.min(Math.max(0,demand),remaining);remaining-=served;return served}

  if(strategy==='CONVENTIONAL'){
    pump=take(pumpNeed); cooling=take(coolingNeed); processing=take(processingNeed); critical=take(criticalNeed); reserve=Math.max(0,remaining)
  } else if(strategy==='WATER_FIRST'){
    pump=take(pumpNeed); critical=take(criticalNeed); cooling=take(coolingNeed); processing=take(processingNeed); reserve=Math.max(0,remaining)
  } else if(strategy==='ENERGY_RESERVE'){
    const protectedReserve=Math.min(available,Math.max(energy.reserveEnergyKwh,available*0.18)); remaining=Math.max(0,available-protectedReserve); reserve=protectedReserve
    critical=take(criticalNeed); cooling=take(coolingNeed); pump=take(pumpNeed); processing=take(processingNeed); reserve+=Math.max(0,remaining)
  } else {
    const waterUrgency=water.thresholdLeadHours!==null && water.thresholdLeadHours<=24 ? 1 : norm(water.grossIrrigationRequirement,12)
    const coolingUrgency=energy.coolingDemandKwh>0 ? 0.75 : 0
    const criticalUrgency=criticalNeed>0 ? 0.9 : 0
    const reserveTarget=Math.min(available,energy.reserveEnergyKwh*0.55)
    remaining=Math.max(0,available-reserveTarget); reserve=reserveTarget
    const demands=[
      {key:'pump',d:pumpNeed,score:weights.waterDeficit*waterUrgency+weights.cropRisk*waterUrgency},
      {key:'critical',d:criticalNeed,score:weights.unmetCriticalLoad*criticalUrgency},
      {key:'cooling',d:coolingNeed,score:weights.foodLossRisk*coolingUrgency+weights.unmetCriticalLoad*0.35},
      {key:'processing',d:processingNeed,score:weights.operatingCost*0.25+weights.energyDeficit*0.25},
    ].sort((a,b)=>b.score-a.score)
    for(const item of demands){const served=take(item.d);if(item.key==='pump')pump=served;if(item.key==='critical')critical=served;if(item.key==='cooling')cooling=served;if(item.key==='processing')processing=served}
    reserve+=Math.max(0,remaining)
  }

  const irrigationFraction=pumpNeed>0?clamp(pump/pumpNeed):1
  const coolingFraction=coolingNeed>0?clamp(cooling/coolingNeed):1
  const criticalFraction=criticalNeed>0?clamp(critical/criticalNeed):1
  const totalDemand=Math.max(1,pumpNeed+coolingNeed+processingNeed+criticalNeed)
  const totalServed=pump+cooling+processing+critical

  const baseWaterDeficit=water.waterDeficit===null?0.6:norm(water.waterDeficit,0.08)
  const expectedWaterDeficitIndex=clamp(baseWaterDeficit+(1-irrigationFraction)*0.65)
  const expectedEnergyDeficitIndex=clamp((totalDemand-totalServed)/totalDemand)
  const thresholdUrgency=water.thresholdLeadHours===null?0.25:water.thresholdLeadHours<=12?1:water.thresholdLeadHours<=24?0.8:water.thresholdLeadHours<=48?0.5:0.2
  const expectedCropRiskIndex=clamp(expectedWaterDeficitIndex*0.7+thresholdUrgency*0.3)
  const expectedFoodLossRiskIndex=clamp((1-coolingFraction)*0.75+(1-clamp(processing/(processingNeed||1)))*0.25)
  const unmetCriticalLoadIndex=clamp(1-criticalFraction)
  const gridLikePenalty=totalServed>available?1:0
  const operatingCostIndex=clamp((processing/Math.max(1,totalDemand))*0.35 + gridLikePenalty*0.65 + (1-clamp(reserve/Math.max(1,energy.reserveEnergyKwh)))*0.2)

  const consequenceScore=+(
    weights.waterDeficit*expectedWaterDeficitIndex+
    weights.energyDeficit*expectedEnergyDeficitIndex+
    weights.cropRisk*expectedCropRiskIndex+
    weights.foodLossRisk*expectedFoodLossRiskIndex+
    weights.unmetCriticalLoad*unmetCriticalLoadIndex+
    weights.operatingCost*operatingCostIndex
  ).toFixed(4)

  const explanation = strategy==='CONSEQUENCE_AWARE'
    ? 'Ranks competing loads by weighted agricultural consequences while retaining a reduced energy reserve.'
    : strategy==='WATER_FIRST'
      ? 'Prioritizes irrigation pumping before non-water agricultural loads.'
      : strategy==='ENERGY_RESERVE'
        ? 'Protects a larger energy reserve before serving farm loads.'
        : 'Uses a fixed sequential allocation without consequence weighting.'

  return {strategy,irrigationFraction:+irrigationFraction.toFixed(3),pumpingEnergyAllocatedKwh:+pump.toFixed(2),coolingEnergyAllocatedKwh:+cooling.toFixed(2),processingEnergyAllocatedKwh:+processing.toFixed(2),criticalEnergyAllocatedKwh:+critical.toFixed(2),reserveEnergyRetainedKwh:+reserve.toFixed(2),expectedWaterDeficitIndex:+expectedWaterDeficitIndex.toFixed(3),expectedEnergyDeficitIndex:+expectedEnergyDeficitIndex.toFixed(3),expectedCropRiskIndex:+expectedCropRiskIndex.toFixed(3),expectedFoodLossRiskIndex:+expectedFoodLossRiskIndex.toFixed(3),unmetCriticalLoadIndex:+unmetCriticalLoadIndex.toFixed(3),operatingCostIndex:+operatingCostIndex.toFixed(3),consequenceScore,status:'CANDIDATE',explanation}
}

export async function runResourceAllocation(options:{stateId?:string;weights?:Partial<AllocationWeights>}={}):Promise<ResourceAllocationResult>{
  const state=options.stateId?await getTwinState(options.stateId):(await listTwinStates(1))[0]
  if(!state) throw new Error('A persisted Twin State is required before Resource Allocation can run.')
  const water=await runWaterAnalysis({stateId:state.id})
  const energy=await runEnergyAnalysis({stateId:state.id})
  const weights:AllocationWeights={waterDeficit:options.weights?.waterDeficit??1.0,energyDeficit:options.weights?.energyDeficit??0.8,cropRisk:options.weights?.cropRisk??1.2,foodLossRisk:options.weights?.foodLossRisk??1.0,unmetCriticalLoad:options.weights?.unmetCriticalLoad??1.2,operatingCost:options.weights?.operatingCost??0.35}
  const evaluations=(['CONVENTIONAL','WATER_FIRST','ENERGY_RESERVE','CONSEQUENCE_AWARE'] as AllocationStrategy[]).map(s=>evaluateStrategy(s,water,energy,weights)).sort((a,b)=>a.consequenceScore-b.consequenceScore)
  evaluations.forEach((e,i)=>{e.status=i===0?'BEST':e.consequenceScore>=evaluations[0].consequenceScore*1.5?'HIGH_CONSEQUENCE':'CANDIDATE'})
  const warnings:string[]=[]
  if(state.evidenceMode==='SYNTHETIC') warnings.push('Allocation comparison is based on synthetic evidence and is a research demonstration only.')
  if(state.aggregateQuality==='INSUFFICIENT') warnings.push('The initial Twin State is insufficient; strategy ranking should not be treated as an operational recommendation.')
  if(energy.status==='INSUFFICIENT'||water.status==='INSUFFICIENT') warnings.push('One or more upstream analytical modules reported insufficient inputs.')
  warnings.push('Consequence weights are explicit research parameters and require calibration or stakeholder justification before applied decision use.')
  return {id:rid(),stateId:state.id,waterAnalysisId:water.id,energyAnalysisId:energy.id,zoneId:state.zoneId,evidenceMode:state.evidenceMode,createdAt:new Date().toISOString(),modelVersion:'RESOURCE-ALLOCATION-0.1.0',status:state.aggregateQuality==='INSUFFICIENT'?'INSUFFICIENT':evaluations[0].consequenceScore>1.5?'WATCH':'PASS',weights,recommendedStrategy:evaluations[0].strategy,evaluations,warnings,method:'multi-criteria agricultural consequence comparison across four transparent management strategies. Lower weighted consequence score is preferred. Scores are normalized research indices, not empirically calibrated loss functions.'}
}
