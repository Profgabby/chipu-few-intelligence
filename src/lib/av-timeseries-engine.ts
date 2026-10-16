/** Research-stage daily time-series engine for all registered Model Laboratory designs.
 * Requires explicitly supplied weather, soil and PV forcing; never invents AV shading gains.
 */
import { AV_MODELS, type ModelId, type ModelParameters, type ComparisonSettings } from './avModelLaboratory'
import { waterBucketStep, cropEtMm, pumpEnergyKwh, pvEnergyKwh } from './predata-scientific-baselines'
export const AV_TIMESERIES_SCHEMA = 'chipu.av.timeseries.v0.1' as const
export type DailyForcing = {
  date: string; precipitationMm: number; etoMm: number; irradiationKwhM2: number
  cropCoefficient: number; transmittedFraction: number
}
export type DailySoilInput = {initialStorageMm:number; capacityMm:number}
export type AVTimeSeriesRequest = {
  schemaVersion:typeof AV_TIMESERIES_SCHEMA; modelId:ModelId
  sourceType:'SYNTHETIC'|'USER_SUPPLIED'|'EXTERNAL_MODEL'
  parameters:ModelParameters; settings:ComparisonSettings
  soil:DailySoilInput; forcing:DailyForcing[]
  pvAreaM2:number; pvModuleEfficiency:number; irrigatedAreaM2:number
  irrigationTargetStorageMm:number
  /** Explicit ETo forcing multiplier; scenario assumption, never inferred from model ID. */
  etoMultiplier?:number
}
const finite=(n:number)=>Number.isFinite(n)
export function simulateAVTimeSeries(req:AVTimeSeriesRequest) {
  if(req.schemaVersion!==AV_TIMESERIES_SCHEMA) throw Error('Unsupported time-series schema')
  if(!AV_MODELS.some(m=>m.id===req.modelId)) throw Error('Unknown Model Laboratory design')
  if(!['SYNTHETIC','USER_SUPPLIED','EXTERNAL_MODEL'].includes(req.sourceType)) throw Error('Unknown evidence type')
  const {soil,forcing}=req
  if(!forcing.length || forcing.length>3660) throw Error('Provide 1–3660 daily forcing records')
  if(![soil.initialStorageMm,soil.capacityMm,req.pvAreaM2,req.pvModuleEfficiency,req.irrigatedAreaM2,req.irrigationTargetStorageMm].every(finite)
    ||soil.capacityMm<=0||soil.initialStorageMm<0||soil.initialStorageMm>soil.capacityMm
    ||req.irrigatedAreaM2<=0||req.pvAreaM2<0||req.pvModuleEfficiency<0||req.pvModuleEfficiency>1
    ||req.irrigationTargetStorageMm<0||req.irrigationTargetStorageMm>soil.capacityMm)
    throw Error('Invalid soil, area or PV parameters')
  if(!finite(req.etoMultiplier ?? 1)||(req.etoMultiplier ?? 1)<0||(req.etoMultiplier ?? 1)>2) throw Error('Invalid ETo multiplier')
  let storage=soil.initialStorageMm
  let previous=''
  let totalIrrigationMm=0,totalPumpKwh=0,totalPvKwh=0,totalEtMm=0
  const points=forcing.map(f=>{
    const time=Date.parse(f.date+'T00:00:00Z')
    if(!/^\d{4}-\d{2}-\d{2}$/.test(f.date)||!Number.isFinite(time)
      ||new Date(time).toISOString().slice(0,10)!==f.date||f.date<=previous)
      throw Error('Forcing dates must be valid and strictly increasing')
    if(previous && (time-Date.parse(previous+'T00:00:00Z'))!==86400000)
      throw Error('Daily forcing must be contiguous; missing dates are not interpolated')
    previous=f.date
    if(![f.precipitationMm,f.etoMm,f.irradiationKwhM2,f.cropCoefficient,f.transmittedFraction].every(finite)
      ||f.precipitationMm<0||f.etoMm<0||f.irradiationKwhM2<0||f.cropCoefficient<0
      ||f.transmittedFraction<0||f.transmittedFraction>1) throw Error('Invalid daily forcing')
    const etDemandMm=cropEtMm(f.etoMm*(req.etoMultiplier ?? 1),f.cropCoefficient)
    const irrigationMm=Math.max(0,req.irrigationTargetStorageMm-(storage+f.precipitationMm-etDemandMm))
    const water=waterBucketStep({storageMm:storage,precipitationMm:f.precipitationMm,irrigationMm,
      etDemandMm,capacityMm:soil.capacityMm})
    if(!finite(req.parameters.irrigationEfficiency)||req.parameters.irrigationEfficiency<=0||req.parameters.irrigationEfficiency>1)
      throw Error('Invalid irrigation application efficiency')
    const volumeM3=irrigationMm*req.irrigatedAreaM2/1000/req.parameters.irrigationEfficiency
    if(!finite(volumeM3))
      throw Error('Invalid irrigation application efficiency')
    const pumpingEnergyKwh=pumpEnergyKwh(volumeM3,req.settings.pumpHeadM,req.settings.pumpEfficiency)
    const pvProductionKwh=pvEnergyKwh(f.irradiationKwhM2,req.pvAreaM2,req.pvModuleEfficiency,req.parameters.performanceRatio)
    storage=water.nextStorageMm
    totalIrrigationMm+=irrigationMm
    totalPumpKwh+=pumpingEnergyKwh
    totalPvKwh+=pvProductionKwh
    totalEtMm+=water.actualEtMm
    return {date:f.date,modelId:req.modelId,storageMm:storage,irrigationMm,
      actualEtMm:water.actualEtMm,drainageMm:water.drainageMm,unmetEtMm:water.unmetEtMm,
      waterResidualMm:water.residualMm,pumpingEnergyKwh,pvProductionKwh,
      transmittedIrradiationKwhM2:f.irradiationKwhM2*f.transmittedFraction}
  })
  return {schemaVersion:AV_TIMESERIES_SCHEMA,modelId:req.modelId,sourceType:req.sourceType,
    etoMultiplier:req.etoMultiplier ?? 1,
    validationStatus:'NOT_FIELD_VALIDATED' as const,modelVersion:'AV-DAILY-BUCKET-0.1.0',
    points,summary:{days:points.length,totalIrrigationMm,totalPumpKwh,totalPvKwh,totalEtMm,
      maxAbsWaterResidualMm:Math.max(...points.map(p=>Math.abs(p.waterResidualMm)))},
    limitations:['Bucket soil-water model, not HYDRUS','Crop coefficient and AV radiation transmission must be supplied',
      'No field-calibrated prediction intervals','PV generation uses supplied irradiance and efficiency']}
}
