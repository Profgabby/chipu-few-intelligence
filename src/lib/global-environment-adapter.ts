/** Provenance-preserving environmental inputs; no network or vendor dependency. */
export const ENVIRONMENT_SCHEMA='chipu.environment.v0.1' as const
export type EnvironmentalSource={provider:string;dataset:string;version:string;retrievedAt:string;reference:string;license?:string}
export type EnvironmentalWeatherRow={date:string;precipitation:number;precipitationUnit:'mm'|'cm'|'m';eto:number;etoUnit:'mm'|'cm'|'m';irradiation:number;irradiationUnit:'kWh/m2'|'MJ/m2'}
export type EnvironmentalSoil={capacity:number;initialStorage:number;waterUnit:'mm'|'cm'|'m';source:EnvironmentalSource}
export type EnvironmentalWeather={source:EnvironmentalSource;rows:EnvironmentalWeatherRow[]}
const depth=(v:number,u:'mm'|'cm'|'m')=>v*(u==='mm'?1:u==='cm'?10:1000)
function sourceValid(s:EnvironmentalSource){if(!s.provider?.trim()||!s.dataset?.trim()||!s.version?.trim()||!s.reference?.trim()||!/^\d{4}-\d{2}-\d{2}/.test(s.retrievedAt)||!Number.isFinite(Date.parse(s.retrievedAt)))throw Error('Environmental source provenance incomplete')}
export function standardizeEnvironment(weather:EnvironmentalWeather,soil:EnvironmentalSoil){
 sourceValid(weather.source);sourceValid(soil.source)
 if(!weather.rows.length||weather.rows.length>3660)throw Error('Invalid weather time series length')
 let previous=NaN
 const days=weather.rows.map(r=>{
  const t=Date.parse(r.date+'T00:00:00Z')
  if(!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!Number.isFinite(t)||new Date(t).toISOString().slice(0,10)!==r.date||(Number.isFinite(previous)&&t-previous!==86400000))throw Error('Weather dates must be valid and contiguous')
  previous=t
  if(![r.precipitation,r.eto,r.irradiation].every(v=>Number.isFinite(v)&&v>=0))throw Error('Invalid environmental measurements')
  if(!['mm','cm','m'].includes(r.precipitationUnit)||!['mm','cm','m'].includes(r.etoUnit)||!['kWh/m2','MJ/m2'].includes(r.irradiationUnit))throw Error('Unsupported weather unit')
  return {date:r.date,precipitationMm:depth(r.precipitation,r.precipitationUnit),etoMm:depth(r.eto,r.etoUnit),irradiationKwhM2:r.irradiation*(r.irradiationUnit==='MJ/m2'?1/3.6:1)}
 })
 if(!['mm','cm','m'].includes(soil.waterUnit)||![soil.capacity,soil.initialStorage].every(v=>Number.isFinite(v)&&v>=0))throw Error('Invalid soil storage')
 const capacityMm=depth(soil.capacity,soil.waterUnit),initialStorageMm=depth(soil.initialStorage,soil.waterUnit)
 if(initialStorageMm>capacityMm)throw Error('Initial soil storage exceeds capacity')
 return {schemaVersion:ENVIRONMENT_SCHEMA,days,soil:{capacityMm,initialStorageMm},provenance:{weather:weather.source,soil:soil.source},quality:{dailyRecords:days.length,missingValues:0,etoProvidedExternally:true},limitations:['Soil storage capacity is a lumped root-zone input, not a hydraulic retention curve','Daily ETo must be independently supplied or computed by a separately verified method']}
}
