import {SYNTHETIC_CROPS,validateCrop,cropStageAtDay,type CropProfile} from './crop-registry'
import {selectSolver} from './solver-registry'
import {waterBucketStep,cropEtMm,pumpEnergyKwh,pvEnergyKwh} from './predata-scientific-baselines'
/** Portable scientific request: all forcing and soil inputs explicit, with provenance. */
export const GLOBAL_MODEL_SCHEMA='chipu.global.model.v0.1' as const
export type GlobalDailyForcing={date:string;precipitationMm:number;etoMm:number;irradiationKwhM2:number}
export type GlobalModelRequest={schemaVersion:typeof GLOBAL_MODEL_SCHEMA;crop:CropProfile;site:{id:string;latitude:number;longitude:number;reference:string};soil:{capacityMm:number;initialStorageMm:number;reference:string};forcing:{reference:string;days:GlobalDailyForcing[]};system:{irrigationMmPerDay:number;areaM2:number;pumpHeadM:number;pumpEfficiency:number;pvAreaM2:number;pvEfficiency:number;pvPerformanceRatio:number}}
export function simulateGlobalNative(r:GlobalModelRequest){
 selectSolver(['WATER_BUCKET','PV_ENERGY','PUMPING_ENERGY'])
 if(r.schemaVersion!==GLOBAL_MODEL_SCHEMA)throw Error('Unknown global model schema')
 const crop=validateCrop(r.crop)
 if(!r.site.id?.trim()||!r.site.reference?.trim()||!r.soil.reference?.trim()||!r.forcing.reference?.trim()||!Number.isFinite(r.site.latitude)||Math.abs(r.site.latitude)>90||!Number.isFinite(r.site.longitude)||Math.abs(r.site.longitude)>180)throw Error('Invalid site provenance or coordinates')
 const s=r.system
 if(![r.soil.capacityMm,r.soil.initialStorageMm,s.irrigationMmPerDay,s.areaM2,s.pumpHeadM,s.pvAreaM2].every(x=>Number.isFinite(x)&&x>=0)||r.soil.initialStorageMm>r.soil.capacityMm||![s.pumpEfficiency,s.pvEfficiency,s.pvPerformanceRatio].every(x=>Number.isFinite(x)&&x>0&&x<=1))throw Error('Invalid soil or system')
 if(!r.forcing.days.length||r.forcing.days.length>crop.seasonDays)throw Error('Forcing outside crop season')
 let storage=r.soil.initialStorageMm,previous=NaN
 const points=r.forcing.days.map((d,i)=>{
  const time=Date.parse(d.date+'T00:00:00Z')
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==d.date||(Number.isFinite(previous)&&time-previous!==86400000))throw Error('Forcing dates must be valid and contiguous')
  previous=time
  if(![d.precipitationMm,d.etoMm,d.irradiationKwhM2].every(x=>Number.isFinite(x)&&x>=0))throw Error('Invalid daily forcing')
  const stage=cropStageAtDay(r.crop,i+1)
  const water=waterBucketStep({storageMm:storage,precipitationMm:d.precipitationMm,irrigationMm:s.irrigationMmPerDay,etDemandMm:cropEtMm(d.etoMm,stage.kc),capacityMm:r.soil.capacityMm})
  storage=water.nextStorageMm
  return {date:d.date,stage:stage.name,storageMm:storage,actualEtMm:water.actualEtMm,drainageMm:water.drainageMm,waterResidualMm:water.residualMm,pumpKwh:pumpEnergyKwh(s.irrigationMmPerDay*s.areaM2/1000,s.pumpHeadM,s.pumpEfficiency),pvKwh:pvEnergyKwh(d.irradiationKwhM2,s.pvAreaM2,s.pvEfficiency,s.pvPerformanceRatio)}
 })
 return {schemaVersion:GLOBAL_MODEL_SCHEMA,solver:'chipu-daily-water-energy',cropId:r.crop.id,siteId:r.site.id,provenance:{crop:r.crop.sourceReference,site:r.site.reference,soil:r.soil.reference,forcing:r.forcing.reference},points,limits:['Bucket model, not Richards equation','No runoff, capillary rise or explicit root stress','No crop yield prediction','No treatment microclimate inferred from PV shading']}
}
export {SYNTHETIC_CROPS}
