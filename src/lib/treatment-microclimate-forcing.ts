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
