import { useState } from 'react'
import { RadiationAdapterPanel } from './RadiationAdapterPanel'
import type { PlaceProfile } from '../lib/place-profile'
import type { ModelId, ModelParameters, ComparisonSettings } from '../lib/avModelLaboratory'
import { AV_TIMESERIES_SCHEMA, simulateAVTimeSeries, type DailyForcing, type AVTimeSeriesRequest } from '../lib/av-timeseries-engine'

type Result = ReturnType<typeof simulateAVTimeSeries>
const example:DailyForcing[]=[
 {date:'2026-07-01',precipitationMm:0,etoMm:4,irradiationKwhM2:5,cropCoefficient:.85,transmittedFraction:1},
 {date:'2026-07-02',precipitationMm:2,etoMm:3.5,irradiationKwhM2:4.2,cropCoefficient:.85,transmittedFraction:1},
 {date:'2026-07-03',precipitationMm:0,etoMm:4.5,irradiationKwhM2:5.4,cropCoefficient:.85,transmittedFraction:1}
]
const fmt=(v:number)=>Number.isFinite(v)?v.toFixed(3):'N/A'
export function AVDailySimulation({selected,parameters,settings,profile}:{selected:ModelId[];parameters:Record<ModelId,ModelParameters>;settings:ComparisonSettings;profile:PlaceProfile}) {
 const [weather,setWeather]=useState(JSON.stringify(example,null,2))
 const [initial,setInitial]=useState(60)
 const [capacity,setCapacity]=useState(120)
 const [target,setTarget]=useState(75)
 const [efficiency,setEfficiency]=useState(.2)
 const [etoByModel,setEtoByModel]=useState<Partial<Record<ModelId,number>>>({})
 const [error,setError]=useState('')
 const [radiationManifest,setRadiationManifest]=useState<unknown>(null)
 const [forcingSource,setForcingSource]=useState<'EXAMPLE'|'USER_SUPPLIED'>('EXAMPLE')
 const [runs,setRuns]=useState<{control:Result;treatments:Result[];areas:number[]}|null>(null)
 const input=(label:string,value:number,change:(v:number)=>void)=><label style={{display:'flex',flexDirection:'column',gap:4}}>{label}<input type="number" step="any" value={value} onChange={e=>{change(e.target.valueAsNumber);setRuns(null)}}/></label>
 function run() {
  try {
   if(!selected.length) throw Error('Select at least one model')
   if(!Number.isFinite(efficiency)||efficiency<=0||efficiency>1) throw Error('PV module efficiency must be in (0,1]')
   if(settings.mode!=='equal-land') throw Error('Daily AV/open-field comparisons require equal-land mode. Switch comparison basis above.')
   const forcing=JSON.parse(weather) as DailyForcing[]
   if(!Array.isArray(forcing)) throw Error('Weather must be a JSON array')
   const base=parameters[selected[0]]
   const shared={schemaVersion:AV_TIMESERIES_SCHEMA,sourceType:'USER_SUPPLIED' as const,
    settings,soil:{initialStorageMm:initial,capacityMm:capacity},forcing,
    irrigatedAreaM2:settings.areaHa*10000,irrigationTargetStorageMm:target,pvModuleEfficiency:efficiency}
   const control=simulateAVTimeSeries({...shared,modelId:selected[0],
    parameters:{...base,irrigationEfficiency:settings.baselineIrrigationEfficiency,performanceRatio:0},
    pvAreaM2:0,etoMultiplier:1})
   const treatments=selected.map(modelId=>{
    const p=parameters[modelId]
    return simulateAVTimeSeries({...shared,modelId,parameters:p,
     pvAreaM2:settings.areaHa*p.pvKwPerHa/efficiency,
     etoMultiplier:etoByModel[modelId]??1})
   })
   setRuns({control,treatments,areas:treatments.map(()=>settings.areaHa)});setError('')
  }catch(e){setRuns(null);setError(e instanceof Error?e.message:'Simulation failed')}
 }
 function download(){
  if(!runs)return
  const payload={schemaVersion:AV_TIMESERIES_SCHEMA,evidence:forcingSource==='EXAMPLE'?'SYNTHETIC_EXAMPLE':'USER_SUPPLIED_UNVALIDATED',
   activeLocation:profile,radiationManifest,
   settings:{initial,capacity,target,efficiency,etoByModel,comparison:settings},forcing:JSON.parse(weather),
   openField:runs.control,agrivoltaic:runs.treatments}
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}))
  const a=document.createElement('a');a.href=url;a.download='chipu-av-open-field-daily.json';a.click();URL.revokeObjectURL(url)
 }
 return <section aria-label="Daily time-series research simulation" style={{display:'grid',gap:16}}>
  <h2>5. Daily water–energy research simulation</h2>
  <div className="av-context-summary"><strong>Active Location &amp; System:</strong> {profile.kind==='configured'?profile.name+' · '+profile.region+' · '+profile.country:'No configured research site selected'}<p>Crop: {profile.crop||'Not specified'} · Coordinates: {profile.latitude&&profile.longitude?profile.latitude+', '+profile.longitude:'Not specified'}</p><p>Weather reference: {profile.weather||'Not linked'} · Soil reference: {profile.soil||'Not linked'} · Calibration reference: {profile.calibration||'Not linked'}</p><p><a href="/app/location">Edit existing Location &amp; System profile</a></p><small>Dataset references are metadata only. Selecting a site does not download or validate weather or soil data. Daily forcing below remains independent until a verified dataset adapter is connected.</small></div>
  <p>Matched-date agrivoltaic versus open-field research screening. Open field has zero PV; its ETo multiplier is 1. Model-specific ETo multipliers are user-entered hypotheses, not derived from panel geometry. No HYDRUS coupling or field validation.</p>
  <div className="av-fields">
   {input('Initial root-zone storage (mm)',initial,setInitial)}
   {input('Root-zone storage capacity (mm)',capacity,setCapacity)}
   {input('Target storage (mm)',target,setTarget)}
   {input('PV module efficiency (fraction)',efficiency,setEfficiency)}
  </div>
  <h3>Design-specific microclimate hypotheses</h3>
  <p>Enter each design's ratio of daily reference ET to open-field ETo. Use 1.00 unless a measured or externally modeled microclimate adjustment is available. Different PV capacities alone do not imply water savings.</p>
  <div className="av-fields">{selected.map(id=><div key={id}>{input(id+' ETo / open-field ETo',etoByModel[id]??1,v=>setEtoByModel(old=>({...old,[id]:v})))}</div>)}</div>
  <label style={{display:'grid',gap:8}}>Daily weather forcing JSON
   <textarea style={{width:'100%',minHeight:240,boxSizing:'border-box',fontFamily:'monospace',fontSize:13}} value={weather} onChange={e=>{setWeather(e.target.value);setForcingSource('USER_SUPPLIED');setRadiationManifest(null);setRuns(null)}}/>
  </label>
  <RadiationAdapterPanel profile={profile} selected={selected} weather={weather} onApply={(forcing,manifest)=>{setWeather(JSON.stringify(forcing,null,2));setRadiationManifest(manifest);setForcingSource('USER_SUPPLIED');setRuns(null);setError('')}}/>
  <div className="av-toolbar"><button type="button" className="av-primary" onClick={run}>Run AV vs open field</button>
   {runs?<button type="button" onClick={download}>Export daily research JSON</button>:null}</div>
  {error?<p role="alert">{error}</p>:null}
  {runs?<div className="av-table-scroll" role="region" aria-label="Daily scenario comparison" tabIndex={0}>
   <p role="status">Open-field reference and {runs.treatments.length} AV design(s). {forcingSource==='EXAMPLE'?'Synthetic example forcing':'User-supplied forcing'}; not field validated.</p>
   <table><thead><tr><th>Design</th><th>Area ha</th><th>PV kW</th><th>ETo ratio</th><th>Irrigation mm</th><th>Pump kWh</th><th>PV kWh</th><th>Water residual mm</th><th>Water saving vs control %</th></tr></thead>
    <tbody>
     <tr><th scope="row">OPEN FIELD</th><td>{fmt(settings.areaHa)}</td><td>0</td><td>1.000</td><td>{fmt(runs.control.summary.totalIrrigationMm)}</td><td>{fmt(runs.control.summary.totalPumpKwh)}</td><td>0</td><td>{fmt(runs.control.summary.maxAbsWaterResidualMm)}</td><td>0</td></tr>
     {runs.treatments.map(r=><tr key={r.modelId}><th scope="row">{r.modelId}</th><td>{fmt(settings.areaHa)}</td><td>{fmt(settings.areaHa*parameters[r.modelId].pvKwPerHa)}</td><td>{fmt(r.etoMultiplier)}</td><td>{fmt(r.summary.totalIrrigationMm)}</td><td>{fmt(r.summary.totalPumpKwh)}</td><td>{fmt(r.summary.totalPvKwh)}</td><td>{fmt(r.summary.maxAbsWaterResidualMm)}</td><td>{runs.control.summary.totalIrrigationMm>0?fmt(100*(runs.control.summary.totalIrrigationMm-r.summary.totalIrrigationMm)/runs.control.summary.totalIrrigationMm):'N/A'}</td></tr>)}
    </tbody>
   </table>
  </div>:null}
 </section>
}
