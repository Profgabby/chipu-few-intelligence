import { useState } from 'react'
import { useResearchContext } from '../lib/research-context'
import { blankProfile, systemTypes, validateProfile, type PlaceProfile } from '../lib/place-profile'
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
const countries = Array.from({length:26*26},(_,i)=>String.fromCharCode(65+Math.floor(i/26),65+i%26)).filter(code=>{const name=regionNames.of(code);return name && name!==code && !['ZZ','XA','XB','EU','UN','EZ'].includes(code)}).sort((a,b)=>(regionNames.of(a)||a).localeCompare(regionNames.of(b)||b))
export function LocationWorkspace() {
  const { profile, saveProfile } = useResearchContext()
  const [draft, setDraft] = useState<PlaceProfile>(()=>profile.kind==='configured'?{...profile}:blankProfile(''))
  const [message,setMessage] = useState('')
  const field = (key: keyof PlaceProfile, label: string, type='text', placeholder='') => <label>{label}<input type={type} step={type==='number'?'any':undefined} value={draft[key]} placeholder={placeholder} onChange={e=>setDraft({...draft,[key]:e.target.value})}/></label>
  return <div className="workspace"><header className="console-heading"><div><div className="eyebrow">LIFEWS · GLOBAL RESEARCH CONTEXT</div><h1>Location & system</h1></div></header>
    <form onSubmit={e=>{e.preventDefault();const error=validateProfile(draft);if(error){setMessage(error);return}try{saveProfile({...draft,kind:'configured'});setMessage('Location and system saved. Active research context updated.')}catch{setMessage('Could not save this profile. Browser storage may be unavailable.')}}}>
    <details className="simulation-presets"><summary>Simulation setups</summary><div className="place-toolbar"><button type="button" className="button button-outline" onClick={()=>{setDraft({...blankProfile('US'),name:'Oregon simulation',zone:'Simulation zone',experiment:'SIMULATION · Oregon'});setMessage('Simulation setup loaded.')}}>Oregon simulation</button><button type="button" className="button button-outline" onClick={()=>{setDraft({...blankProfile('NG'),name:'Nigeria simulation',zone:'Simulation zone',experiment:'SIMULATION · Nigeria'});setMessage('Simulation setup loaded.')}}>Nigeria simulation</button></div><small>Configuration presets · no simulation results generated.</small></details>
    <fieldset><legend>1 · Place and research site</legend><div className="place-fields">
      {field('name','Research site name')}
      <label>Country / territory<select value={draft.country} onChange={e=>setDraft({...draft,country:e.target.value,region:'',district:'',currency:e.target.value==='NG'?'NGN':e.target.value==='US'?'USD':'',timezone:e.target.value==='NG'?'Africa/Lagos':'UTC'})}><option value="">Choose location</option>{countries.map(c=><option key={c} value={c}>{regionNames.of(c)}</option>)}</select></label>
      {field('region',draft.country==='US'||draft.country==='NG'?'State':'State / province / region')}{field('district',draft.country==='NG'?'Local Government Area (LGA)':'County / district / municipality')}
      {field('latitude','Latitude (decimal degrees)','number')}{field('longitude','Longitude (decimal degrees)','number')}{field('elevation','Elevation (m)','number')}{field('timezone','Timezone','text','IANA timezone')}{field('currency','Currency code','text','Three-letter code')}
    </div></fieldset>
    <fieldset><legend>2 · System and experimental context</legend><div className="place-fields"><label>System type<select value={draft.systemType} onChange={e=>setDraft({...draft,systemType:e.target.value})}>{systemTypes.map(s=><option key={s}>{s}</option>)}</select></label>{field('zone','Parcel / zone name','text','Open sun A / Agrivoltaic B')}{field('experiment','Experiment reference (optional)')}{field('crop','Crop / cultivar (optional)')}<label>Scientific units<input readOnly value="SI · m, m², m³, °C, W, kWh"/></label></div></fieldset>
    <fieldset><legend>3 · Local configuration and evidence references</legend><div className="place-fields">{field('weather','Weather dataset / station reference')}{field('soil','Soil profile / parameter reference')}{field('irrigation','Water source, irrigation and pump configuration')}{field('pv','PV geometry, capacity and storage configuration')}{field('tariff',`Electricity tariff (${draft.currency||'local currency'}/kWh)`,'number')}{field('calibration','Calibration / validation study reference')}</div></fieldset>
    <p role="status">{message}</p><button className="button button-primary" type="submit">Save location</button><small className="place-save-note">Saved on this device.</small>
    </form></div>
}
