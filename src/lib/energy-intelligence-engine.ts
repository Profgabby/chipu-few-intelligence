import { getTwinState, listTwinStates, type TwinStateEstimate } from './state-engine'
import { listForecasts, type ForecastRun } from './forecast-engine'
import { runWaterAnalysis, type WaterAnalysisResult } from './water-intelligence-engine'

export type EnergyAllocation = {
  load: 'PUMPING' | 'COOLING' | 'PROCESSING' | 'OTHER_CRITICAL'
  demandKwh: number
  servedKwh: number
  unmetKwh: number
  priority: number
}

export type EnergyAnalysisResult = {
  id: string
  stateId: string
  forecastId?: string
  waterAnalysisId: string
  zoneId: string
  evidenceMode: TwinStateEstimate['evidenceMode']
  createdAt: string
  modelVersion: string
  status: 'PASS' | 'WATCH' | 'INSUFFICIENT'
  horizonHours: number
  pvPowerKw: number | null
  predictedPvEnergyKwh: number
  batterySocPct: number | null
  batteryCapacityKwh: number
  usableBatteryEnergyKwh: number
  reserveFloorPct: number
  reserveEnergyKwh: number
  pumpingDemandKwh: number
  coolingDemandKwh: number
  processingDemandKwh: number
  otherCriticalDemandKwh: number
  totalDemandKwh: number
  totalAvailableEnergyKwh: number
  servedEnergyKwh: number
  unmetEnergyKwh: number
  surplusEnergyKwh: number
  waterEnergyIntensityKwhM3: number | null
  allocations: EnergyAllocation[]
  warnings: string[]
  method: string
}

function value(state: TwinStateEstimate, key: string) {
  return state.components.find(c => c.variable === key)?.value ?? null
}
function id() { return `ENERGY-${new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14)}-${Math.random().toString(36).slice(2,6).toUpperCase()}` }
function clamp(v:number,min:number,max:number){return Math.min(max,Math.max(min,v))}

export async function runEnergyAnalysis(options: {
  stateId?: string
  forecastId?: string
  batteryCapacityKwh?: number
  reserveFloorPct?: number
  coolingDemandKwh?: number
  processingDemandKwh?: number
  otherCriticalDemandKwh?: number
  horizonHours?: number
} = {}): Promise<EnergyAnalysisResult> {
  const state = options.stateId ? await getTwinState(options.stateId) : (await listTwinStates(1))[0]
  if (!state) throw new Error('A persisted Twin State is required before Energy Intelligence can run.')
  const forecasts = await listForecasts(50)
  const forecast: ForecastRun | undefined = options.forecastId
    ? forecasts.find(f=>f.id===options.forecastId)
    : forecasts.find(f=>f.initialStateId===state.id)
  const water: WaterAnalysisResult = await runWaterAnalysis({stateId:state.id, forecastId:forecast?.id})

  const horizonHours = options.horizonHours ?? 24
  const pvPowerKw = value(state,'pv_power')
  const batterySocPct = value(state,'battery_soc')
  const batteryCapacityKwh = options.batteryCapacityKwh ?? 60
  const reserveFloorPct = options.reserveFloorPct ?? 20
  const usableBatteryEnergyKwh = batterySocPct === null ? 0 : batteryCapacityKwh * Math.max(0,batterySocPct-reserveFloorPct)/100
  const reserveEnergyKwh = batteryCapacityKwh * reserveFloorPct/100

  let predictedPvEnergyKwh = 0
  if (forecast) {
    const pts = forecast.points.filter(p=>p.leadHours<=horizonHours)
    for(let i=1;i<pts.length;i++){
      const dt=(pts[i].leadHours-pts[i-1].leadHours)
      predictedPvEnergyKwh += (((pts[i-1].pvPower??0)+(pts[i].pvPower??0))/2)*dt
    }
  } else if (pvPowerKw !== null) predictedPvEnergyKwh = pvPowerKw * Math.min(horizonHours,6) * 0.65
  predictedPvEnergyKwh=+predictedPvEnergyKwh.toFixed(2)

  const pumpingDemandKwh = water.pumpingEnergyKwh ?? 0
  const coolingDemandKwh = options.coolingDemandKwh ?? 18
  const processingDemandKwh = options.processingDemandKwh ?? 8
  const otherCriticalDemandKwh = options.otherCriticalDemandKwh ?? 6
  const demands: Array<[EnergyAllocation['load'],number,number]> = [
    ['PUMPING',pumpingDemandKwh,1],['COOLING',coolingDemandKwh,2],['OTHER_CRITICAL',otherCriticalDemandKwh,3],['PROCESSING',processingDemandKwh,4]
  ]
  let available = predictedPvEnergyKwh + usableBatteryEnergyKwh
  const totalAvailableEnergyKwh=+available.toFixed(2)
  const allocations: EnergyAllocation[]=[]
  for(const [load,demand,priority] of demands){
    const served=Math.min(demand,available); available-=served
    allocations.push({load,demandKwh:+demand.toFixed(2),servedKwh:+served.toFixed(2),unmetKwh:+Math.max(0,demand-served).toFixed(2),priority})
  }
  const totalDemandKwh=+demands.reduce((s,d)=>s+d[1],0).toFixed(2)
  const servedEnergyKwh=+allocations.reduce((s,a)=>s+a.servedKwh,0).toFixed(2)
  const unmetEnergyKwh=+allocations.reduce((s,a)=>s+a.unmetKwh,0).toFixed(2)
  const surplusEnergyKwh=+Math.max(0,totalAvailableEnergyKwh-servedEnergyKwh).toFixed(2)
  const waterEnergyIntensityKwhM3 = water.irrigationVolumeM3>0 && water.pumpingEnergyKwh!==null ? +(water.pumpingEnergyKwh/water.irrigationVolumeM3).toFixed(3) : null

  const warnings:string[]=[]
  if(state.aggregateQuality==='INSUFFICIENT') warnings.push('Initial Twin State is insufficient; energy results are demonstrative only.')
  if(state.evidenceMode==='SYNTHETIC') warnings.push('Synthetic evidence is being used; this is not an operational dispatch instruction.')
  if(!forecast) warnings.push('No matching prediction run was found; PV energy uses a simplified fallback estimate.')
  if(batterySocPct===null) warnings.push('Battery state is unavailable; no battery contribution is credited.')
  if(water.pumpingEnergyKwh===null) warnings.push('Pumping-energy demand could not be resolved from Water Intelligence and is treated as zero in allocation totals.')
  if(unmetEnergyKwh>0) warnings.push(`${unmetEnergyKwh.toFixed(1)} kWh of modeled agricultural demand remains unmet under the current priority order.`)
  const status:EnergyAnalysisResult['status']=state.aggregateQuality==='INSUFFICIENT'?'INSUFFICIENT':unmetEnergyKwh>0?'WATCH':'PASS'

  return {id:id(),stateId:state.id,forecastId:forecast?.id,waterAnalysisId:water.id,zoneId:state.zoneId,evidenceMode:state.evidenceMode,createdAt:new Date().toISOString(),modelVersion:'ENERGY-ENGINE-0.1.0',status,horizonHours,pvPowerKw,predictedPvEnergyKwh,batterySocPct,batteryCapacityKwh,usableBatteryEnergyKwh:+usableBatteryEnergyKwh.toFixed(2),reserveFloorPct,reserveEnergyKwh:+reserveEnergyKwh.toFixed(2),pumpingDemandKwh:+pumpingDemandKwh.toFixed(2),coolingDemandKwh,processingDemandKwh,otherCriticalDemandKwh,totalDemandKwh,totalAvailableEnergyKwh,servedEnergyKwh,unmetEnergyKwh,surplusEnergyKwh,waterEnergyIntensityKwhM3,allocations,warnings,method:'24-hour state- and forecast-informed energy balance; predicted PV energy plus battery energy above a protected reserve is allocated by explicit agricultural priority to pumping, cooling, other critical loads, and processing. Demonstration logic is transparent and not an autonomous controller.'}
}
