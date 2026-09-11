import type { ScenarioExperimentRun } from './scenario-laboratory-engine'

export const RESILIENCE_MODEL_VERSION='CHIPU-RESILIENCE-0.1.0'
export type ResilienceAssessment={scenarioId:string;runId:string;stateId:string;strategy:string;waterContinuity:number;energyContinuity:number;foodContinuity:number;criticalLoadContinuity:number;vulnerabilityIndex:number;resilienceIndex:number;dominantRisk:string;recommendedAdaptations:string[];evidenceMode:string;modelVersion:string;notes:string[]}
const clamp=(v:number)=>Math.max(0,Math.min(1,v))
export function assessResilience(run:ScenarioExperimentRun):ResilienceAssessment{
  const best=run.strategies.find(s=>s.rank===1)??run.strategies[0]
  if(!best)throw new Error('Scenario run has no strategy evaluation.')
  const water=clamp(1-best.expectedWaterDeficitIndex)
  const energy=clamp(1-best.expectedEnergyDeficitIndex)
  const food=clamp(1-Math.max(best.expectedCropRiskIndex,best.expectedFoodLossRiskIndex))
  const critical=clamp(1-best.unmetCriticalLoadIndex)
  const risks=[['Water continuity',1-water],['Energy continuity',1-energy],['Food continuity',1-food],['Critical-load continuity',1-critical]] as const
  const dominant=[...risks].sort((a,b)=>b[1]-a[1])[0][0]
  const vulnerability=clamp((1-water)*.30+(1-energy)*.25+(1-food)*.30+(1-critical)*.15)
  const adaptations:string[]=[]
  if(water<.75)adaptations.push('Evaluate irrigation timing, water storage, pumping capacity, or demand reduction.')
  if(energy<.75)adaptations.push('Evaluate dispatch, battery reserve, flexible loads, or additional generation availability.')
  if(food<.75)adaptations.push('Evaluate crop-risk protection, cooling continuity, harvest timing, or postharvest capacity.')
  if(critical<.85)adaptations.push('Protect critical loads explicitly in the control strategy and reserve policy.')
  if(!adaptations.length)adaptations.push('No high-consequence continuity gap is indicated by this research scenario; continue sensitivity testing.')
  return {scenarioId:run.scenario.id,runId:run.runId,stateId:run.stateId,strategy:best.strategy,waterContinuity:+water.toFixed(3),energyContinuity:+energy.toFixed(3),foodContinuity:+food.toFixed(3),criticalLoadContinuity:+critical.toFixed(3),vulnerabilityIndex:+vulnerability.toFixed(3),resilienceIndex:+((1-vulnerability)*100).toFixed(1),dominantRisk:dominant,recommendedAdaptations:adaptations,evidenceMode:run.evidenceMode,modelVersion:RESILIENCE_MODEL_VERSION,notes:['Composite index is a transparent research-stage decision indicator, not an independently validated resilience metric.','Continuity weights are explicit model parameters: water 0.30, energy 0.25, food 0.30, critical loads 0.15.']}
}
