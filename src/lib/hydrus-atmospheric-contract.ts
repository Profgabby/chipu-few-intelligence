/** HYDRUS-1D atmospheric forcing INTERCHANGE contract; not a native ATMOSPH.IN writer. */
export const HYDRUS_ATMOSPHERIC_SCHEMA='chipu.hydrus.atmospheric.v0.1' as const
export type HydrusAtmosphericDay={
 date:string;precipitationMm:number;irrigationMm:number;
 potentialSoilEvaporationMm:number;potentialRootTranspirationMm:number;
 leafAreaIndex:number;rootDepthCm:number
}
export type HydrusAtmosphericManifest={
 schemaVersion:typeof HYDRUS_ATMOSPHERIC_SCHEMA;
 treatment:'OPEN_FIELD'|'AGRIVOLTAIC';siteId:string;designId:string|null;
 sourceReference:string;partitionMethod:string;irrigationMethod:string;
 rootUptakeModel:'FEDDES'|'OTHER_EXPLICIT';soilHydraulicParameterSetId:string;
 lowerBoundaryCondition:string;initialConditionReference:string;
 days:HydrusAtmosphericDay[]
}
/** Validate potential atmospheric demand; actual uptake is solved by HYDRUS, not supplied as potential. */
export function validateHydrusAtmosphericManifest(m:HydrusAtmosphericManifest){
 if(m.schemaVersion!==HYDRUS_ATMOSPHERIC_SCHEMA)throw Error('Unknown HYDRUS forcing schema')
 if(!['OPEN_FIELD','AGRIVOLTAIC'].includes(m.treatment)||!m.siteId?.trim()||!m.sourceReference?.trim()||!m.partitionMethod?.trim()||!m.irrigationMethod?.trim()||!m.soilHydraulicParameterSetId?.trim()||!m.lowerBoundaryCondition?.trim()||!m.initialConditionReference?.trim())throw Error('Missing HYDRUS forcing provenance')
 if(m.treatment==='AGRIVOLTAIC'&&!m.designId?.trim())throw Error('AV design identifier required')
 if(!['FEDDES','OTHER_EXPLICIT'].includes(m.rootUptakeModel))throw Error('Root uptake model must be explicit')
 if(!m.days.length||m.days.length>3660)throw Error('HYDRUS forcing day count out of range')
 let last=NaN
 for(const d of m.days){
  const t=Date.parse(d.date+'T00:00:00Z')
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||!Number.isFinite(t)||new Date(t).toISOString().slice(0,10)!==d.date||Number.isFinite(last)&&t-last!==86400000)throw Error('HYDRUS forcing dates must be valid and contiguous')
  last=t
  const values=[d.precipitationMm,d.irrigationMm,d.potentialSoilEvaporationMm,d.potentialRootTranspirationMm,d.leafAreaIndex,d.rootDepthCm]
  if(!values.every(v=>Number.isFinite(v)&&v>=0))throw Error('HYDRUS forcing must be finite and nonnegative')
 }
 return {valid:true,days:m.days.length,units:{waterDepth:'mm/day',rootDepth:'cm',leafAreaIndex:'dimensionless'},
  mapping:{Prec:'(precipitationMm + irrigationMm) / 10 in cm/day',rSoil:'potentialSoilEvaporationMm / 10 in cm/day',rRoot:'potentialRootTranspirationMm / 10 in cm/day'},
  note:'Root uptake is a soil-domain sink computed by HYDRUS; runoff, infiltration limits and actual evaporation require HYDRUS boundary solver. Verify ATMOSPH.IN columns, sign convention and model version before writing native files.'}
}
export function partitionPotentialEt(etoMm:number,cropCoefficient:number,lai:number,extinctionCoefficient:number){
 if(![etoMm,cropCoefficient,lai,extinctionCoefficient].every(Number.isFinite)||etoMm<0||cropCoefficient<0||lai<0||extinctionCoefficient<0)throw Error('Invalid ET partition')
 const total=etoMm*cropCoefficient
 const potentialSoilEvaporationMm=total*Math.exp(-extinctionCoefficient*lai)
 return {potentialSoilEvaporationMm,potentialRootTranspirationMm:total-potentialSoilEvaporationMm,
  method:'ILLUSTRATIVE_BEER_LAMBERT_PARTITION_NOT_CALIBRATED'}
}
