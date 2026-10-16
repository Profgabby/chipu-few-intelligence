import { fao56DailyEto, type Fao56Weather } from './fao56-penman-monteith'
/** Research-stage treatment-specific ETo forcing. Shading is not an ETo predictor. */
import type { DailyForcing } from './av-timeseries-engine'
export const MICROCLIMATE_SCHEMA='chipu.microclimate.forcing.v0.1' as const
export type MicroclimateEvidence='MEASURED'|'EXTERNAL_MODEL'|'ILLUSTRATIVE_SCENARIO'
export type TreatmentEtoDay={date:string;etoMm:number}
export type MicroclimateRequest={source:MicroclimateEvidence;sourceReference:string;method:string;siteId:string;designId:string;days:TreatmentEtoDay[]}
export function applyTreatmentMicroclimate(control:DailyForcing[],request:MicroclimateRequest){
 if(!['MEASURED','EXTERNAL_MODEL','ILLUSTRATIVE_SCENARIO'].includes(request.source))throw Error('Invalid microclimate provenance')
 if(!request.sourceReference.trim()||!request.method.trim()||!request.siteId.trim()||!request.designId.trim())throw Error('Microclimate source, method, site and design are required')
 if(!control.length||request.days.length!==control.length)throw Error('Microclimate must cover every control forcing day')
 const treatment=control.map((f,i)=>{
  const day=request.days[i]
  if(!day||day.date!==f.date||!Number.isFinite(day.etoMm)||day.etoMm<0||day.etoMm>40)throw Error('Invalid or unmatched treatment ETo day')
  return {...f,etoMm:day.etoMm}
 })
 return {schemaVersion:MICROCLIMATE_SCHEMA,control:control.map(f=>({...f})),treatment,
  provenance:{...request,days:request.days.map(d=>({...d}))},
  limitations:['Treatment ETo is supplied independently; no shading-to-ETo inference','Crop coefficient and soil-water bucket are unchanged','No field validation implied by provenance classification']}
}

/** Derive treatment ETo from independently supplied daily treatment weather, not shading. */
export function applyFao56Treatment(control:DailyForcing[],input:Omit<MicroclimateRequest,'days'> & {weather:Fao56Weather[]}){
 if(input.weather.length!==control.length)throw Error('FAO-56 treatment weather must cover every control date')
 const days=input.weather.map((w,i)=>{
  if(w.date!==control[i].date)throw Error('FAO-56 treatment weather date mismatch')
  const expectedDay=Math.floor((Date.parse(w.date+'T00:00:00Z')-Date.UTC(Number(w.date.slice(0,4)),0,1))/86400000)+1
  if(!/^\d{4}-\d{2}-\d{2}$/.test(w.date)||!Number.isFinite(expectedDay)||new Date(w.date+'T00:00:00Z').toISOString().slice(0,10)!==w.date||w.dayOfYear!==expectedDay)throw Error('Invalid FAO-56 day-of-year')
  return {date:w.date,etoMm:fao56DailyEto(w).etoMm}
 })
 const result=applyTreatmentMicroclimate(control,{...input,days,method:'FAO-56 daily Penman–Monteith; '+input.method})
 return {...result,weatherProvenance:input.weather.map(w=>({...w})),referenceEtMethod:'FAO-56 PM'}
}
