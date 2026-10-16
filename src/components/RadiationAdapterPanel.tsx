import { useState } from 'react'
import { adaptHourlyRadiation,attachRadiationToDailyForcing,type HourlyRadiation } from '../lib/radiation-forcing-adapter'
import type { DailyForcing } from '../lib/av-timeseries-engine'
import type { ModelId } from '../lib/avModelLaboratory'
import type { PlaceProfile } from '../lib/place-profile'
export function RadiationAdapterPanel({profile,selected,weather,onApply}:{profile:PlaceProfile;selected:ModelId[];weather:string;onApply:(forcing:DailyForcing[],manifest:unknown)=>void}){
 const [hours,setHours]=useState('')
 const [diffuse,setDiffuse]=useState(0.8)
 const [cropX,setCropX]=useState(1)
 const [model,setModel]=useState<ModelId>('SS01')
 const [error,setError]=useState('')
 const [summary,setSummary]=useState('')
 function preview(){
  try{
   if(!profile.latitude||!profile.longitude||profile.kind!=='configured')throw Error('Select a configured research site with latitude and longitude first')
   if(!selected.includes(model))throw Error('Select the geometry design in the Model Laboratory first')
   const data=JSON.parse(hours) as HourlyRadiation[]
   if(!Array.isArray(data))throw Error('Hourly forcing must be a JSON array')
   const days=adaptHourlyRadiation(model,{latitudeDeg:Number(profile.latitude),longitudeDeg:Number(profile.longitude),hours:data,diffuseTransmission:diffuse,cropCrossRowM:cropX})
   const daily=JSON.parse(weather) as DailyForcing[]
   if(!Array.isArray(daily))throw Error('Daily weather must be a JSON array')
   const adapted=attachRadiationToDailyForcing(daily,days)
   const manifest={schema:'chipu.radiation.adapter.v0.1',design:model,siteId:profile.id,siteCoordinates:[profile.latitude,profile.longitude],diffuseTransmission:diffuse,cropCrossRowM:cropX,evidence:'ILLUSTRATIVE_GEOMETRY_USER_SUPPLIED_HOURLY',limitations:'Daily crop ETo and PV energy are NOT recomputed from this adapter. Crop radiation diagnostic only.',days}
   onApply(adapted,manifest)
   setSummary('Applied '+days.length+' matched daily transmitted-radiation fractions. ETo and PV forcing remain unchanged.')
   setError('')
  }catch(e){setSummary('');setError(e instanceof Error?e.message:'Radiation adapter failed')}
 }
 return <details><summary>Experimental geometry-based radiation forcing (opt-in)</summary>
 <p>Requires complete UTC hourly GHI, DHI, POA (kWh/m² per hour) and cell temperature (°C). This adapter only updates the transmitted-radiation diagnostic in the daily model. It does not alter ETo, irrigation, pumping or PV output.</p>
 <div className="av-fields"><label>Geometry design<select value={model} onChange={e=>setModel(e.target.value as ModelId)}>{selected.map(id=><option key={id} value={id}>{id}</option>)}</select></label><label>Diffuse transmission assumption<input type="number" min="0" max="1" step="0.05" value={diffuse} onChange={e=>setDiffuse(e.target.valueAsNumber)}/></label><label>Crop cross-row offset (m)<input type="number" min="0" step="0.1" value={cropX} onChange={e=>setCropX(e.target.valueAsNumber)}/></label></div>
 <label>Hourly forcing JSON<textarea style={{width:'100%',minHeight:130,fontFamily:'monospace'}} value={hours} placeholder='[{"timestampUtc":"2026-07-01T00:00:00Z","ghiKwhM2":0,"dhiKwhM2":0,"poaKwhM2":0,"cellTempC":20}, ... 24 records per day]' onChange={e=>{setHours(e.target.value);setSummary('')}}/></label>
 <button type="button" onClick={preview}>Validate and apply transmitted radiation</button>
 {error?<p role="alert">{error}</p>:null}{summary?<p role="status">{summary}</p>:null}
 </details>
}
