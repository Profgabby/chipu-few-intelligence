import type {EnvironmentalSource,EnvironmentalWeather,EnvironmentalWeatherRow} from './global-environment-adapter'
/** NASA POWER daily point API. Uses externally supplied ETo: POWER does not provide FAO-56 ETo in this adapter. */
export function nasaPowerDailyUrl(latitude:number,longitude:number,start:string,end:string){
 if(!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180||!/^\d{8}$/.test(start)||!/^\d{8}$/.test(end)||start>end)throw Error('Invalid NASA POWER request')
 const q=new URLSearchParams({parameters:'PRECTOTCORR,ALLSKY_SFC_SW_DWN',community:'AG',longitude:String(longitude),latitude:String(latitude),start,end,format:'JSON'})
 return 'https://power.larc.nasa.gov/api/temporal/daily/point?'+q.toString()
}
export function parseNasaPowerDaily(payload:unknown,etoByDate:Record<string,number>,source:EnvironmentalSource):EnvironmentalWeather{
 const p=payload as {properties?:{parameter?:Record<string,Record<string,number>>};header?:{fill_value?:number}}
 const rain=p?.properties?.parameter?.PRECTOTCORR,solar=p?.properties?.parameter?.ALLSKY_SFC_SW_DWN
 if(!rain||!solar||!source.reference?.trim())throw Error('Missing NASA POWER parameters or provenance')
 const dates=Object.keys(rain).sort()
 if(!dates.length||dates.some(d=>!/^\d{8}$/.test(d)||!(d in solar)))throw Error('NASA POWER dates missing or invalid')
 const rows:EnvironmentalWeatherRow[]=dates.map(d=>{
  const precipitation=rain[d],irradiation=solar[d],eto=etoByDate[d]
  if(![precipitation,irradiation,eto].every(v=>Number.isFinite(v)&&v>=0)||[precipitation,irradiation].some(v=>v===-999||v===p.header?.fill_value))throw Error('NASA POWER missing or invalid daily measurement / ETo')
  return {date:d.slice(0,4)+'-'+d.slice(4,6)+'-'+d.slice(6,8),precipitation,precipitationUnit:'mm',eto,etoUnit:'mm',irradiation,irradiationUnit:'kWh/m2'}
 })
 return {source,rows}
}
/** ERA5-Land hourly accumulated precipitation [m] and solar radiation [J/m²].
 * Values must be decoded and de-accumulated upstream; do not sum overlapping cumulative steps.
 * ETo is an independently calculated or supplied daily quantity.
 */
export type Era5LandDailyDecoded={date:string;totalPrecipitationM:number;surfaceSolarRadiationJm2:number;etoMm:number}
export function parseEra5LandDaily(rows:Era5LandDailyDecoded[],source:EnvironmentalSource):EnvironmentalWeather{
 if(!rows.length)throw Error('Empty ERA5-Land daily input')
 return {source,rows:rows.map(r=>{
  if(![r.totalPrecipitationM,r.surfaceSolarRadiationJm2,r.etoMm].every(v=>Number.isFinite(v)&&v>=0))throw Error('Invalid ERA5-Land decoded forcing')
  return {date:r.date,precipitation:r.totalPrecipitationM,precipitationUnit:'m',eto:r.etoMm,etoUnit:'mm',irradiation:r.surfaceSolarRadiationJm2/3600000,irradiationUnit:'kWh/m2'}
 })}
}
