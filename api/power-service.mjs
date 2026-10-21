import {createDurableCache} from './durable-cache.mjs'
/** Server-only POWER transport. Ephemeral per-instance cache; not a distributed persistent cache. */
const cache=new Map()
const TTL=6*60*60*1000
export function validatePowerRequest(q){
 const {latitude,longitude,start,end}=q||{}
 if(![latitude,longitude].every(Number.isFinite)||Math.abs(latitude)>90||Math.abs(longitude)>180||typeof start!=='string'||typeof end!=='string'||!/^\d{8}$/.test(start)||!/^\d{8}$/.test(end)||start>end)throw Error('Invalid coordinates or date range')
 const first=Date.parse(start.slice(0,4)+'-'+start.slice(4,6)+'-'+start.slice(6,8)+'T00:00:00Z')
 const last=Date.parse(end.slice(0,4)+'-'+end.slice(4,6)+'-'+end.slice(6,8)+'T00:00:00Z')
 if(!Number.isFinite(first)||!Number.isFinite(last)||new Date(first).toISOString().slice(0,10)!==start.slice(0,4)+'-'+start.slice(4,6)+'-'+start.slice(6,8)||new Date(last).toISOString().slice(0,10)!==end.slice(0,4)+'-'+end.slice(4,6)+'-'+end.slice(6,8)||last-first>366*86400000)throw Error('Invalid or oversized date range')
 return {latitude,longitude,start,end}
}
export function powerUrl(q){
 const v=validatePowerRequest(q)
 const p=new URLSearchParams({parameters:'PRECTOTCORR,ALLSKY_SFC_SW_DWN',community:'AG',longitude:String(v.longitude),latitude:String(v.latitude),start:v.start,end:v.end,format:'JSON'})
 return 'https://power.larc.nasa.gov/api/temporal/daily/point?'+p
}
export async function retrievePower(q,{fetcher=fetch,now=Date.now(),durable=createDurableCache()}={}){
 const url=powerUrl(q)
 const cached=cache.get(url)
 if(cached&&cached.expires>now)return {...cached.value,cache:'HIT_EPHEMERAL'}
 const key='units-v2:'+url
 if(durable){const shared=await durable.get(key);if(shared){cache.set(url,{value:shared,expires:now+TTL});return {...shared,cache:'HIT_DURABLE'}}}
 const response=await fetcher(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(15000)})
 if(!response.ok)throw Error('NASA POWER upstream HTTP '+response.status)
 const payload=await response.json()
 const solarUnit=payload?.parameters?.ALLSKY_SFC_SW_DWN?.units
 const rainUnit=payload?.parameters?.PRECTOTCORR?.units
 const solarFactor=solarUnit==='MJ/m^2/day'?1/3.6:solarUnit==='kW-hr/m^2/day'?1:null
 if(solarFactor===null||rainUnit!=='mm/day')throw Error('NASA POWER missing or unsupported units')
 const rain=payload?.properties?.parameter?.PRECTOTCORR
 const solar=payload?.properties?.parameter?.ALLSKY_SFC_SW_DWN
 if(!rain||!solar||!Object.keys(rain).length)throw Error('NASA POWER returned incomplete parameters')
 const days=Object.keys(rain).sort().map(d=>{
  const precipitationMm=rain[d],irradiationKwhM2=solar[d]*solarFactor
  if(!/^\d{8}$/.test(d)||![precipitationMm,irradiationKwhM2].every(x=>Number.isFinite(x)&&x>=0))throw Error('NASA POWER missing or invalid measurement')
  return {date:d.slice(0,4)+'-'+d.slice(4,6)+'-'+d.slice(6,8),precipitationMm,irradiationKwhM2}
 })
 const value={days,provenance:{provider:'NASA POWER',dataset:'Daily point',sourceUnits:{precipitation:rainUnit,solar:solarUnit},outputUnits:{precipitation:'mm/day',solar:'kWh/m2/day'},parameters:['PRECTOTCORR','ALLSKY_SFC_SW_DWN'],requestUrl:url,retrievedAt:new Date(now).toISOString()},quality:{etoAvailable:false,soilAvailable:false,sourceTemporalScale:'DAILY'}}
 if(cache.size>=100)cache.delete(cache.keys().next().value)
 if(durable)await durable.set(key,value,TTL/1000)
 cache.set(url,{value,expires:now+TTL})
 return {...value,cache:'MISS'}
}
