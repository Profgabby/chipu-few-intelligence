import {validateHydrusAtmosphericManifest,type HydrusAtmosphericManifest} from './hydrus-atmospheric-contract'
import {serialize417Records,parse417Records,type Atmosph417Row} from './hydrus-417-records'
/** The caller must supply project-specific auxiliary boundary columns. No implicit physical defaults. */
export type Hydrus417Auxiliary={hCritA:number;rB:number;hB:number;ht:number;tTop:number;tBot:number;Ampl:number;cTop:number;cBot:number}
export type Hydrus417AuxiliarySource={reference:string;verifiedForProject:boolean;byDay:Hydrus417Auxiliary[]}
export function mapManifestTo417Records(manifest:HydrusAtmosphericManifest,aux:Hydrus417AuxiliarySource){
 validateHydrusAtmosphericManifest(manifest)
 if(!aux.reference?.trim()||!aux.verifiedForProject||aux.byDay.length!==manifest.days.length)throw Error('Verified project-specific HYDRUS auxiliary records required')
 const rows:Atmosph417Row[]=manifest.days.map((d,i)=>{
  const a=aux.byDay[i]
  if(!a||Object.values(a).some(v=>!Number.isFinite(v)))throw Error('Invalid HYDRUS auxiliary values')
  return {tAtm:i+1,Prec:(d.precipitationMm+d.irrigationMm)/10,rSoil:d.potentialSoilEvaporationMm/10,rRoot:d.potentialRootTranspirationMm/10,...a}
 })
 const roundTrip=parse417Records(serialize417Records(rows))
 if(roundTrip.length!==rows.length)throw Error('HYDRUS record round-trip mismatch')
 return {rows,provenance:{forcing:manifest.sourceReference,auxiliary:aux.reference},status:'RECORDS_ONLY_NOT_NATIVE_FILE' as const}
}
