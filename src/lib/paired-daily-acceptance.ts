import {simulateAVTimeSeries,AV_TIMESERIES_SCHEMA,type DailyForcing} from './av-timeseries-engine'
import {createIllustrativeParameters,DEFAULT_SETTINGS} from './avModelLaboratory'
import {applyTreatmentMicroclimate} from './treatment-microclimate-forcing'
/** Deterministic paired control, identical soil, precipitation, irrigation efficiency and pumping configuration. */
export function runPairedDailyAcceptance(){
 const assert=(x:boolean,s:string)=>{if(!x)throw Error('Paired simulation: '+s)}
 const forcing:DailyForcing[]=Array.from({length:5},(_,i)=>({date:`2026-07-0${i+1}`,precipitationMm:i===3?18:0,etoMm:5,irradiationKwhM2:5,cropCoefficient:1,transmittedFraction:1}))
 const paired=applyTreatmentMicroclimate(forcing,{source:'ILLUSTRATIVE_SCENARIO',sourceReference:'deterministic synthetic acceptance fixture',method:'explicit 20% ETo reduction; NOT derived from shading',siteId:'fixture',designId:'SS01',days:forcing.map(f=>({date:f.date,etoMm:4}))})
 const parameters=createIllustrativeParameters().SS01
 const shared={schemaVersion:AV_TIMESERIES_SCHEMA,modelId:'SS01' as const,sourceType:'SYNTHETIC' as const,parameters,settings:DEFAULT_SETTINGS,soil:{initialStorageMm:70,capacityMm:80},pvAreaM2:0,pvModuleEfficiency:0.2,irrigatedAreaM2:10000,irrigationTargetStorageMm:70}
 const control=simulateAVTimeSeries({...shared,forcing:paired.control})
 const treatment=simulateAVTimeSeries({...shared,forcing:paired.treatment})
 const totals=(r:typeof control)=>({irrigationMm:r.summary.totalIrrigationMm,irrigationVolumeM3:r.summary.totalIrrigationMm*shared.irrigatedAreaM2/1000/parameters.irrigationEfficiency,pumpingKwh:r.summary.totalPumpKwh,actualEtMm:r.summary.totalEtMm,drainageMm:r.points.reduce((s,p)=>s+p.drainageMm,0),finalStorageMm:r.points.at(-1)!.storageMm})
 const a=totals(control),b=totals(treatment)
 const diff={irrigationMm:b.irrigationMm-a.irrigationMm,irrigationVolumeM3:b.irrigationVolumeM3-a.irrigationVolumeM3,pumpingKwh:b.pumpingKwh-a.pumpingKwh,actualEtMm:b.actualEtMm-a.actualEtMm,drainageMm:b.drainageMm-a.drainageMm,finalStorageMm:b.finalStorageMm-a.finalStorageMm}
 assert(control.points.length===5&&treatment.points.length===5,'matched daily dates')
 assert(Math.abs(a.actualEtMm-25)<1e-9&&Math.abs(b.actualEtMm-20)<1e-9,'independent ETo forcing propagates to actual ET')
 assert(Math.abs(a.irrigationMm-20)<1e-9&&Math.abs(b.irrigationMm-16)<1e-9,'threshold irrigation mass balance')
 assert(Math.abs(a.drainageMm-13)<1e-9&&Math.abs(b.drainageMm-14)<1e-9,'storm drainage accounting')
 assert(Math.abs(a.finalStorageMm-70)<1e-9&&Math.abs(b.finalStorageMm-70)<1e-9,'final soil storage')
 assert(Math.abs(diff.irrigationVolumeM3+50)<1e-9,'irrigation withdrawal delta including application efficiency')
 assert(Math.abs(diff.pumpingKwh-(-50*1000*9.81*30/(0.6*3600000)))<1e-9,'pumping energy difference')
 assert(control.summary.maxAbsWaterResidualMm<1e-9&&treatment.summary.maxAbsWaterResidualMm<1e-9,'water balance closure')
 return {passed:true,cases:8,source:'SYNTHETIC_DETERMINISTIC',control:a,treatment:b,treatmentMinusControl:diff}
}
