import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, BrainCircuit, CircleAlert, Droplets, Gauge, RefreshCw, Sprout, Sun } from 'lucide-react'
import { getZone } from '../lib/cropsmart-model'
import { loadCommandCenterState, stateComponent, type CommandCenterState } from '../lib/command-center-engine'
import { useResearchContext } from '../lib/research-context'
import { OverviewResearchContent } from './OverviewResearchContent'
import { DecisionEvidenceGraph } from './DecisionEvidenceGraph'
import '../overview-gardenlift.css'

type Card = { id:string; title:string; kicker:string; route:string; icon:typeof Activity; status:string; action:string }
export function ChipuOverviewWorkspace() {
  const { profile, farmId, zoneId, scenario } = useResearchContext()
  const [state,setState]=useState<CommandCenterState|null>(null)
  const [busy,setBusy]=useState(false)
  const hasEvidenceContext=profile.kind==='demonstrator'
  const refresh=async()=>{if(!hasEvidenceContext){setState(null);return}setBusy(true);try{setState(await loadCommandCenterState(farmId,zoneId))}finally{setBusy(false)}}
  useEffect(()=>{void refresh()},[farmId,zoneId,scenario,hasEvidenceContext])
  const zone=getZone(zoneId)
  const soil=stateComponent(state?.twin,'soil_water_rootzone')
  const pv=stateComponent(state?.twin,'pv_power')
  const cards=useMemo<Card[]>(()=>[
    {id:'food',title:'Food',kicker:'CROP SYSTEM',route:'/app/food',icon:Sprout,status:hasEvidenceContext?`${zone.crop} · ${zone.stage}`:'Crop & growing conditions',action:'Open Food'},
    {id:'water',title:'Water',kicker:'SOIL + IRRIGATION',route:'/app/water',icon:Droplets,status:soil?.value!==null&&soil?.value!==undefined?`${soil.value} ${soil.unit}`:'Soil moisture and irrigation analysis',action:'Open Water'},
    {id:'energy',title:'Energy',kicker:'PV + STORAGE + LOADS',route:'/app/energy',icon:Sun,status:pv?.value!==null&&pv?.value!==undefined?`${pv.value} ${pv.unit}`:'Solar generation, storage and demand',action:'Open Energy'},
    {id:'twin',title:'Digital Twin',kicker:'SYSTEM STATE',route:'/app/twin',icon:Activity,status:state?.twin?`${state.twin.completeness}% complete`:'Observation-based system modeling',action:state?.twin?'Inspect state':'Open Digital Twin'},
    {id:'predict',title:'Prediction',kicker:'FORECAST + UNCERTAINTY',route:'/app/predict',icon:BrainCircuit,status:state?.forecast?`${state.forecast.horizonHours} h horizon`:'Explore forecasts and uncertainty',action:state?.forecast?'Inspect forecast':'Run model'},
    {id:'control',title:'Scenarios & Control',kicker:'ALLOCATION + DECISION',route:'/app/control',icon:Gauge,status:state?.scenarioRun?'Decision run available':'Compare operating strategies',action:state?.scenarioRun?'Inspect run':'Run scenario'},
  ],[state,zone,soil,pv,hasEvidenceContext])
  const ready=[state?.twin,state?.forecast,state?.scenarioRun,state?.latestEconomic,state?.latestResilience].filter(Boolean).length
  return <div className="workspace command-center research-instrument">
    <header className="console-heading">
      <div>
        <div className="eyebrow">CHIPU-FEW INTELLIGENCE</div>
        <h1>System overview</h1>
        <p>Review your analysis context, run a comparison, or continue a saved analysis.</p>
      </div>
      {hasEvidenceContext&&<button className="console-refresh" onClick={()=>void refresh()} disabled={busy}><RefreshCw size={16} className={busy?'spin':''}/>{busy?'Refreshing':'Refresh'}</button>}
    </header>

    <section className="overview-summary" aria-label="Active research context">
      <div><span>ANALYSIS CONTEXT</span><strong>{hasEvidenceContext?'Simulation example':profile.name}</strong><small>{hasEvidenceContext?'Synthetic example data · not site measurements':'Review site inputs using the location control above'}</small></div>
      <div><span>INPUTS</span><strong>{hasEvidenceContext?'Assumed parameters':'Site configuration'}</strong><small>Review weather, soil, crop and system values before running.</small></div>
      <div><span>RESULT HISTORY</span><strong>{busy?'Loading saved analyses…':ready?`${ready} analysis types with saved records`:'No saved analyses loaded'}</strong><small>Standalone calculator runs are not automatically added here.</small></div>
    </section>

    <section className="overview-gardenlift" aria-labelledby="gardenlift-heading">
      <figure className="overview-gardenlift-visual">
        <img src="/models/SS01.webp" alt="GardenLift concept showing crops beneath elevated solar panels alongside a water tank and irrigation system" width="1600" height="900" loading="lazy"/>
        <figcaption>SS01 GardenLift · Concept illustration</figcaption>
      </figure>
      <div className="overview-gardenlift-content">
        <span className="eyebrow">LIFEWS · START A COMPARISON</span>
        <h2 id="gardenlift-heading">SS01 GardenLift versus open sun</h2>
        <p>Starting configuration: 12 modules · 5.16 kWp · 48 m² crop area. Review the assumed design and annual inputs, then compare water, energy, crop and financial outcomes.</p>
        <Link className="button button-primary" to="/app/model-laboratory">Run SS01 versus open sun<ArrowRight size={17} aria-hidden="true"/></Link>
        <small>Opens the SS01 setup for review before running. This starting case is independent of the site selected above.</small>
      </div>
    </section>

    <section className="overview-saved-results research-surface" aria-label="Available analysis records"><header><h2>Saved analysis records</h2><span>{state?.connected?'Connected research session':'Local research session'}</span></header>
      <p>{ready?'Continue an available analysis below.':'Start with the SS01 comparison above, or open a workspace below. This overview checks saved system-state, forecast, control, economic and resilience records; it does not collect unsaved calculator outputs.'}</p>
      <div className="overview-record-links">{[
        {name:'System state',available:!!state?.twin,route:'/app/twin'},
        {name:'Forecast',available:!!state?.forecast,route:'/app/predict'},
        {name:'Control scenario',available:!!state?.scenarioRun,route:'/app/control'},
        {name:'Techno-economics',available:!!state?.latestEconomic,route:'/app/economics'},
        {name:'Resilience',available:!!state?.latestResilience,route:'/app/resilience'},
      ].filter(item=>item.available).map(item=><Link key={item.name} to={item.route}>Review {item.name}<ArrowRight size={15}/></Link>)}</div>
      {state?.errors.length? <p>Some records could not be loaded. Use Refresh to retry.</p>:null}
    </section>
    {hasEvidenceContext&&<details className="overview-context-details"><summary>View dataset details and research context</summary><OverviewResearchContent zoneId={zoneId} state={state}/></details>}

    <section className="console-section-heading module-heading"><div><span>CORE WORKSPACES</span><h2>Research system</h2></div></section>
    <section className="command-grid command-grid-core">{cards.map(({icon:Icon,...card})=><Link to={card.route} className={`command-card command-card-${card.id}`} key={card.id}>
      <div className="command-card-top"><div className="command-card-icon"><Icon size={22}/></div><div><span>{card.kicker}</span><h2>{card.title}</h2></div></div>
      <div className="command-card-signal"><strong>{card.status}</strong></div>
      <div className="command-card-action">{card.action}<ArrowRight size={17}/></div>
    </Link>)}</section>

    <section className="overview-analysis">
      <div className="console-section-heading"><div><span>PROVENANCE</span><h2>Decision evidence</h2></div></div>
      {hasEvidenceContext?<DecisionEvidenceGraph state={state} zone={zone} scenarioId={scenario} onEvidenceChanged={refresh}/>:<div className="panel"><div className="panel-body"><h3>Site evidence</h3><p>{profile.kind==='unconfigured'?'Select a site to inspect its observations and analysis readiness.':'Connect local observations and model parameters to prepare site analyses.'}</p>{[['Weather',profile.weather],['Soil',profile.soil],['Crop',profile.crop],['Water / irrigation',profile.irrigation],['PV / storage',profile.pv]].map(([label,reference])=><div className="list-row" key={label}><strong>{label}</strong><span>{reference||'Not connected'}</span></div>)}<p>Use the location control at the top of the page to review these inputs.</p></div></div>}
    </section>

    {state?.errors.length ? (
      <section className="command-note">
        <CircleAlert size={18}/>
        <div>
          <strong>Some evidence sources are unavailable.</strong>
          <p>The interface leaves unavailable research evidence unpopulated rather than substituting values.</p>
        </div>
      </section>
    ) : null}
  </div>
}
