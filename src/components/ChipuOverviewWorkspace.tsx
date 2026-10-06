import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, BrainCircuit, CircleAlert, Droplets, Gauge, RefreshCw, Sprout, Sun } from 'lucide-react'
import { getZone } from '../lib/cropsmart-model'
import { loadCommandCenterState, stateComponent, type CommandCenterState } from '../lib/command-center-engine'
import { useResearchContext } from '../lib/research-context'
import { OverviewResearchContent } from './OverviewResearchContent'
import { DecisionEvidenceGraph } from './DecisionEvidenceGraph'

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
    {id:'water',title:'Water',kicker:'SOIL + IRRIGATION',route:'/app/water',icon:Droplets,status:soil?.value!==null&&soil?.value!==undefined?`${soil.value} ${soil.unit}`:'Awaiting Twin state',action:'Open Water'},
    {id:'energy',title:'Energy',kicker:'PV + STORAGE + LOADS',route:'/app/energy',icon:Sun,status:pv?.value!==null&&pv?.value!==undefined?`${pv.value} ${pv.unit}`:'Awaiting Twin state',action:'Open Energy'},
    {id:'twin',title:'Digital Twin',kicker:'SYSTEM STATE',route:'/app/twin',icon:Activity,status:state?.twin?`${state.twin.completeness}% complete`:'No state yet',action:state?.twin?'Inspect state':'Build Twin'},
    {id:'predict',title:'Prediction',kicker:'FORECAST + UNCERTAINTY',route:'/app/predict',icon:BrainCircuit,status:state?.forecast?`${state.forecast.horizonHours} h horizon`:'No forecast yet',action:state?.forecast?'Inspect forecast':'Run model'},
    {id:'control',title:'Scenarios & Control',kicker:'ALLOCATION + DECISION',route:'/app/control',icon:Gauge,status:state?.scenarioRun?'Decision run available':'No run yet',action:state?.scenarioRun?'Inspect run':'Run scenario'},
  ],[state,zone,soil,pv,hasEvidenceContext])
  const ready=[state?.twin,state?.forecast,state?.scenarioRun,state?.latestEconomic,state?.latestResilience].filter(Boolean).length
  return <div className="workspace command-center research-instrument">
    <header className="console-heading">
      <div>
        <div className="eyebrow">CHIPU-FEW INTELLIGENCE</div>
        <h1>System overview</h1>
        <p>Integrated food–energy–water research workspace for state estimation, prediction and decision analysis.</p>
      </div>
      <Link className="button button-primary" to="/app/location">{profile.kind==='unconfigured'?'Choose location & system':'Manage location & system'}</Link>
      {hasEvidenceContext&&<button className="console-refresh" onClick={()=>void refresh()} disabled={busy}><RefreshCw size={16} className={busy?'spin':''}/>{busy?'Refreshing':'Refresh'}</button>}
    </header>

    <section className="overview-summary" aria-label="Active research context">
      <div><span>ACTIVE CONTEXT</span><strong>{profile.kind==='unconfigured'?'No site selected':profile.name}</strong><small>{profile.kind==='unconfigured'?'Choose a location to connect site evidence':[profile.country,profile.region,zoneId].filter(Boolean).join(' · ')}</small></div>
      <div><span>EVIDENCE</span><strong>{ready}/5 downstream results</strong><small>{state?.connected?'Research persistence connected':'Local research session'}</small></div>
      <div><span>DIGITAL TWIN</span><strong>{state?.twin?state.twin.aggregateQuality:'Not built'}</strong><small>{state?.twin?`${state.twin.completeness}% state completeness`:'Build from documented observations'}</small></div>
    </section>

    {hasEvidenceContext&&<OverviewResearchContent zoneId={zoneId} state={state}/>}

    <section className="console-section-heading module-heading"><div><span>CORE WORKSPACES</span><h2>Research system</h2></div></section>
    <section className="command-grid command-grid-core">{cards.map(({icon:Icon,...card})=><Link to={card.route} className={`command-card command-card-${card.id}`} key={card.id}>
      <div className="command-card-top"><div className="command-card-icon"><Icon size={22}/></div><div><span>{card.kicker}</span><h2>{card.title}</h2></div></div>
      <div className="command-card-signal"><strong>{card.status}</strong></div>
      <div className="command-card-action">{card.action}<ArrowRight size={17}/></div>
    </Link>)}</section>

    <section className="overview-analysis">
      <div className="console-section-heading"><div><span>PROVENANCE</span><h2>Decision evidence</h2></div></div>
      {hasEvidenceContext?<DecisionEvidenceGraph state={state} zone={zone} scenarioId={scenario} onEvidenceChanged={refresh}/>:<div className="panel"><div className="panel-body"><h3>Site evidence</h3><p>{profile.kind==='unconfigured'?'Select a site to inspect its observations and analysis readiness.':'Connect local observations and model parameters to prepare site analyses.'}</p>{[['Weather',profile.weather],['Soil',profile.soil],['Crop',profile.crop],['Water / irrigation',profile.irrigation],['PV / storage',profile.pv]].map(([label,reference])=><div className="list-row" key={label}><strong>{label}</strong><span>{reference||'Not connected'}</span></div>)}<Link className="button" to="/app/location">Review location & system<ArrowRight size={16}/></Link></div></div>}
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
