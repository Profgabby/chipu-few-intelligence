import { useState } from 'react'
import { useResearchContext } from '../lib/research-context'
import { blankProfile, systemTypes, validateProfile, type PlaceProfile } from '../lib/place-profile'
import { ResearchStatus } from './ResearchStatus'
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
const countries = Array.from({length:26*26},(_,i)=>String.fromCharCode(65+Math.floor(i/26),65+i%26)).filter(code=>{const name=regionNames.of(code);return name && name!==code && !['ZZ','XA','XB','EU','UN','EZ'].includes(code)}).sort((a,b)=>(regionNames.of(a)||a).localeCompare(regionNames.of(b)||b))
export function LocationWorkspace() {
  const { profile, saveProfile } = useResearchContext()
  const [draft, setDraft] = useState<PlaceProfile>(()=>profile.kind==='configured'?{...profile}:blankProfile())
  const [message,setMessage] = useState('')
  const field = (key: keyof PlaceProfile, label: string, type='text', placeholder='') => <label>{label}<input type={type} step={type==='number'?'any':undefined} value={draft[key]} placeholder={placeholder} onChange={e=>setDraft({...draft,[key]:e.target.value})}/></label>
  return <div className="workspace"><header className="console-heading"><div><div className="eyebrow">LIFEWS · GLOBAL RESEARCH CONTEXT</div><h1>Location & system</h1><p>Configure a place anywhere. Oregon is the first validation target; Nigeria is the next deployment priority.</p></div></header>
    <section className="place-boundary"><ResearchStatus state="context" label="Global location configuration"/><ResearchStatus state="missing" label="Model validation not established"/><p>Profiles are saved in this browser. These describe the research setting; they do not download weather, calibrate models, convert model units or establish scientific validity.</p></section>
    <form onSubmit={e=>{e.preventDefault();const error=validateProfile(draft);if(error){setMessage(error);return}try{saveProfile({...draft,kind:'configured'});setMessage('Location and system saved. Active research context updated.')}catch{setMessage('Could not save this profile. Browser storage may be unavailable.')}}}>
    <div className="place-toolbar"><button type="button" className="button button-outline" onClick={()=>{setDraft(blankProfile('US'));setMessage('')}}>New Oregon profile</button><button type="button" className="button button-outline" onClick={()=>{setDraft(blankProfile('NG'));setMessage('')}}>New Nigeria profile</button><button type="button" className="button button-outline" onClick={()=>{setDraft({...blankProfile(''),region:'',currency:'',timezone:'UTC'});setMessage('')}}>New global profile</button></div>
    <fieldset><legend>1 · Place and research site</legend><div className="place-fields">
      {field('name','Research site name')}
      <label>Country / territory<select value={draft.country} onChange={e=>setDraft({...draft,country:e.target.value,region:'',district:'',currency:e.target.value==='NG'?'NGN':e.target.value==='US'?'USD':'',timezone:e.target.value==='NG'?'Africa/Lagos':'UTC'})}><option value="">Choose location</option>{countries.map(c=><option key={c} value={c}>{regionNames.of(c)}</option>)}</select></label>
      {field('region',draft.country==='US'||draft.country==='NG'?'State':'State / province / region')}{field('district',draft.country==='NG'?'Local Government Area (LGA)':'County / district / municipality')}
      {field('latitude','Latitude (decimal degrees)','number')}{field('longitude','Longitude (decimal degrees)','number')}{field('elevation','Elevation (m)','number')}{field('timezone','Timezone','text','America/Los_Angeles')}{field('currency','Currency code','text','USD / NGN')}
    </div></fieldset>
    <fieldset><legend>2 · System and experimental context</legend><div className="place-fields"><label>System type<select value={draft.systemType} onChange={e=>setDraft({...draft,systemType:e.target.value})}>{systemTypes.map(s=><option key={s}>{s}</option>)}</select></label>{field('zone','Parcel / zone name','text','Open sun A / Agrivoltaic B')}{field('experiment','Experiment reference (optional)')}{field('crop','Crop / cultivar (optional)')}<label>Scientific units<input readOnly value="SI · m, m², m³, °C, W, kWh"/></label></div></fieldset>
    <fieldset><legend>3 · Local configuration and evidence references</legend><p>Record source identifiers or descriptions. A reference is not an imported dataset or a validation result.</p><div className="place-fields">{field('weather','Weather dataset / station reference')}{field('soil','Soil profile / parameter reference')}{field('irrigation','Water source, irrigation and pump configuration')}{field('pv','PV geometry, capacity and storage configuration')}{field('tariff',`Electricity tariff (${draft.currency||'local currency'}/kWh)`,'number')}{field('calibration','Calibration / validation study reference')}</div></fieldset>
    <p role="status">{message}</p><button className="button button-primary" type="submit">Save and use this location</button>
    </form></div>
}
