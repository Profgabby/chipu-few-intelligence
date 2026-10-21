import {validateHydrusAtmosphericManifest,type HydrusAtmosphericManifest} from './hydrus-atmospheric-contract'
/** Version-gated ATMOSPH.IN row preparation. Native file assembly requires an externally verified version template. */
export const HYDRUS_EXPORT_SCHEMA='chipu.hydrus.atmosph.export.v0.1' as const
export type HydrusNativeProfile={
 version:string;templateReference:string;verifiedAgainstInstalledVersion:boolean;
 lengthUnit:'cm';timeUnit:'day';timeOrigin:'DAYS_FROM_FIRST_RECORD';
 precipitationSign:'POSITIVE_DOWNWARD';evaporationSign:'POSITIVE_POTENTIAL';
 requiredColumns:readonly ['tAtm','Prec','rSoil','rRoot'];
}
export function prepareHydrusAtmosphericRows(manifest:HydrusAtmosphericManifest,profile:HydrusNativeProfile){
 validateHydrusAtmosphericManifest(manifest)
 if(!/^HYDRUS-1D (4\.|5\.)/.test(profile.version)||!profile.verifiedAgainstInstalledVersion||!profile.templateReference.trim())throw Error('Native HYDRUS export blocked: installed version and ATMOSPH.IN template must be verified')
 if(profile.lengthUnit!=='cm'||profile.timeUnit!=='day'||profile.timeOrigin!=='DAYS_FROM_FIRST_RECORD'||profile.precipitationSign!=='POSITIVE_DOWNWARD'||profile.evaporationSign!=='POSITIVE_POTENTIAL'||profile.requiredColumns.join('|')!=='tAtm|Prec|rSoil|rRoot')throw Error('Unsupported HYDRUS unit, sign or column mapping')
 const rows=manifest.days.map((d,i)=>({
  tAtm:i+1,
  Prec:(d.precipitationMm+d.irrigationMm)/10,
  rSoil:d.potentialSoilEvaporationMm/10,
  rRoot:d.potentialRootTranspirationMm/10,
  precipitationCmDay:d.precipitationMm/10,
  irrigationCmDay:d.irrigationMm/10
 }))
 if(rows.some(r=>Object.values(r).some(v=>!Number.isFinite(v)||v<0)))throw Error('Invalid converted HYDRUS flux')
 return {schemaVersion:HYDRUS_EXPORT_SCHEMA,version:profile.version,templateReference:profile.templateReference,
  treatment:manifest.treatment,siteId:manifest.siteId,designId:manifest.designId,
  rows,headerAndAuxiliaryColumns:'REQUIRE_VERIFIED_NATIVE_TEMPLATE',
  status:'PREPARED_NOT_NATIVE_FILE' as const,
  warnings:['Do not rename this output ATMOSPH.IN','Native HYDRUS header, optional columns, critical pressure head and variable boundary flags must match the installed version and project settings','Time origin, cumulative vs daily precipitation, interception and actual root uptake require project-specific validation']}
}
/** Fail closed until a verified HYDRUS native template renderer is supplied. */
export function exportNativeAtmosphIn():never{
 throw Error('Native ATMOSPH.IN export unavailable without verified version-specific header, full column layout and project boundary flags')
}
