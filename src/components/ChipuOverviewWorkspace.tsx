import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, BarChart3, BatteryCharging, BrainCircuit, CircleAlert, Database, Droplets, Gauge, Globe2, HeartHandshake, RefreshCw, ShieldCheck, Sprout, Sun, UsersRound } from 'lucide-react'
import { CHIPU_PRODUCT } from '../lib/chipu-modules'
import { getZone } from '../lib/cropsmart-model'
import { loadCommandCenterState, stateComponent, type CommandCenterState } from '../lib/command-center-engine'
import { useResearchContext } from '../lib/research-context'
import { DecisionEvidenceGraph } from './DecisionEvidenceGraph'

type Card = { id:string; title:string; kicker:string; route:string; icon:typeof Activity; status:string; detail:string; evidence?:string; action:string }
const value = (n: unknown) => typeof n === 'number' && Number.isFinite(n) ? n : null
const money = (n: unknown) => value(n) === null ? null : Number(n).toLocaleString(undefined,{maximumFractionDigits:0})

export function ChipuOverviewWorkspace() {
  const { farmId, zoneId, scenario, workspaceName } = useResearchContext()
  const [state,setState]=useState<CommandCenterState|null>(null)
  const [busy,setBusy]=useState(false)
  const refresh=async()=>{setBusy(true);try{setState(await loadCommandCenterState(farmId))}finally{setBusy(false)}}
  useEffect(()=>{void refresh()},[farmId,zoneId,scenario])
  const zone=getZone(zoneId)
  const soil=stateComponent(state?.twin,'soil_water_rootzone')
  const tank=stateComponent(state?.twin,'tank_level')
  const pv=stateComponent(state?.twin,'pv_power')
  const battery=stateComponent(state?.twin,'battery_soc')
  const resilienceIndex=value(state?.latestResilience?.resilience_index)
  const npv=money(state?.latestEconomic?.npv)
  const cards=useMemo<Card[]>(()=>[
    {id:'people',title:'People',kicker:'DECISION CONTEXT',route:'/app/people',icon:UsersRound,status:state?.connected?(state.stakeholderCount===0?'No stakeholder data':`${state?.stakeholderCount??0} persistent record${state?.stakeholderCount===1?'':'s'}`):'Protected persistence',detail:state?.connected?'Producer, stakeholder and institutional context linked to the selected research farm.':'Connect the protected research session to inspect persistent stakeholder evidence.',evidence:state?.connected?'PERSISTENT':'PROTECTED',action:state?.connected&&state.stakeholderCount===0?'Add stakeholder data':'Open People'},
    {id:'place',title:'Place',kicker:'SITE CONTEXT',route:'/app/place',icon:Globe2,status:state?.connected?(state.placeCount===0?'No site data':`${state?.placeCount??0} persistent site record${state?.placeCount===1?'':'s'}`):'Add site data',detail:'Land, infrastructure, geographic and operating context for the selected farm/site.',evidence:state?.connected?'PERSISTENT':'NOT CONNECTED',action:'Open Place'},
    {id:'food',title:'Food',kicker:'PRODUCTION SYSTEM',route:'/app/food',icon:Sprout,status:`${zone.crop} · ${zone.stage}`,detail:'Existing CropSmart crop, harvest and storage research capability remains available under CHIPU-FEW Food.',evidence:'SYNTHETIC RESEARCH DATA',action:'Open Food'},
    {id:'energy',title:'Energy',kicker:'PV · STORAGE · LOADS',route:'/app/energy',icon:Sun,status:pv?.value!==null&&pv?.value!==undefined?`${pv.value} ${pv.unit}`:'Run / build Twin state',detail:battery?.value!==null&&battery?.value!==undefined?`Battery state available: ${battery.value} ${battery.unit}.`:'No current battery state is available in the latest Twin state.',evidence:state?.twin?.evidenceMode,action:'Open Energy'},
    {id:'water',title:'Water',kicker:'SOIL · IRRIGATION · STORAGE',route:'/app/water',icon:Droplets,status:soil?.value!==null&&soil?.value!==undefined?`${soil.value} ${soil.unit}`:'Run / build Twin state',detail:tank?.value!==null&&tank?.value!==undefined?`Water-storage state available: ${tank.value} ${tank.unit}.`:'No current tank state is available in the latest Twin state.',evidence:state?.twin?.evidenceMode,action:'Open Water'},
    {id:'twin',title:'Twin',kicker:'SYSTEM STATE',route:'/app/twin',icon:Activity,status:state?.twin?`${state.twin.completeness}% complete · ${state.twin.aggregateQuality}`:'No Twin state available',detail:state?.twin?`${state.twin.id} · ${state.twin.zoneId}`:'Build a state from documented observations before downstream prediction and control.',evidence:state?.twin?.evidenceMode,action:state?.twin?'Inspect Twin':'Build Twin'},
    {id:'predict',title:'Predict',kicker:'FORECAST & UNCERTAINTY',route:'/app/predict',icon:BrainCircuit,status:state?.forecast?`${state.forecast.horizonHours} h forecast · ${state.forecast.status}`:'No forecast available',detail:state?.forecast?`${state.forecast.id} · issued ${new Date(state.forecast.issuedAt).toLocaleString()}`:'A persisted Twin state is required before a forecast can be run.',evidence:state?.forecast?.evidenceMode,action:state?.forecast?'Inspect forecast':'Run model'},
    {id:'control',title:'Control',kicker:'ALLOCATION & SCHEDULING',route:'/app/control',icon:Gauge,status:state?.scenarioRun?`Latest best strategy: ${state.scenarioRun.bestStrategy}`:'No scenario/control run',detail:state?.scenarioRun?`${state.scenarioRun.scenario.name} · consequence score ${state.scenarioRun.bestScore}`:'Run a documented scenario to compare allocation strategies.',evidence:state?.scenarioRun?.evidenceMode,action:state?.scenarioRun?'Inspect Control':'Run scenario'},
    {id:'economics',title:'Economics',kicker:'TEA & INVESTMENT',route:'/app/economics',icon:BarChart3,status:npv!==null?`Latest persisted NPV: ${npv}`:'No persisted economic case',detail:npv!==null?'Result exists in the protected research database; inspect assumptions before interpretation.':'Enter documented assumptions and calculate a TEA case. No default economics are fabricated.',evidence:npv!==null?'PERSISTENT ANALYSIS':'NO DATA',action:npv!==null?'Inspect Economics':'Add assumptions'},
    {id:'resilience',title:'Resilience',kicker:'STRESS · CONTINUITY · ADAPTATION',route:'/app/resilience',icon:ShieldCheck,status:resilienceIndex!==null?`Latest persisted index: ${resilienceIndex}/100`:'No persisted resilience result',detail:resilienceIndex!==null?'Research-stage composite result from an explicit scenario run.':'Run a scenario-derived resilience assessment; no resilience score is shown before a run exists.',evidence:resilienceIndex!==null?'MODELED / PERSISTED':'NO DATA',action:resilienceIndex!==null?'Inspect Resilience':'Run assessment'},
  ],[state,zone,soil,tank,pv,battery,npv,resilienceIndex])
  const ready=cards.filter(card=>!['No data','NO DATA','NOT CONNECTED','PROTECTED'].includes(card.evidence||'')).length
  return <div className="workspace command-center">
    <header className="command-hero">
      <div className="command-hero-copy"><div className="eyebrow eyebrow-status"><span className="status-dot"/>INTEGRATED FEW COMMAND CENTER</div><h1>{CHIPU_PRODUCT.name}</h1><p>One research cockpit for context, system state, prediction, control, economics and resilience—without invented production values.</p><div className="command-context-line"><span>{workspaceName}</span><i/> <span>{farmId}</span><i/> <span>{zoneId}</span><i/> <span>{scenario}</span></div></div>
      <button className="command-refresh" onClick={()=>void refresh()} disabled={busy}><RefreshCw size={16} className={busy?'spin':''}/>{busy?'Refreshing':'Refresh evidence'}</button>
    </header>

    <section className="command-ribbon">
      <div><span>RESEARCH CONTEXT</span><strong>People + Place</strong></div><ArrowRight/><div><span>RESOURCE SYSTEM</span><strong>Food ↔ Energy ↔ Water</strong></div><ArrowRight/><div><span>STATE</span><strong>Twin</strong></div><ArrowRight/><div><span>ANTICIPATE</span><strong>Predict</strong></div><ArrowRight/><div><span>ACT</span><strong>Control</strong></div><ArrowRight/><div><span>CONSEQUENCE</span><strong>Economics + Resilience</strong></div>
    </section>

    <section className="command-intelligence-strip">
      <div><Database size={18}/><span>EVIDENCE LOAD</span><strong>{busy?'Refreshing…':`${ready}/10 module signals available`}</strong></div>
      <div><BatteryCharging size={18}/><span>TWIN QUALITY</span><strong>{state?.twin?state.twin.aggregateQuality:'No state'}</strong></div>
      <div><HeartHandshake size={18}/><span>PERSISTENCE</span><strong>{state?.connected?'Protected research session':'Not connected'}</strong></div>
      <div><CircleAlert size={18}/><span>DATA BOUNDARY</span><strong>Measured / modeled / synthetic kept distinct</strong></div>
    </section>

    <DecisionEvidenceGraph state={state} zone={zone} scenarioId={scenario} onEvidenceChanged={refresh}/>

    <section className="command-grid">{cards.map(({icon:Icon,...card})=><Link to={card.route} className={`command-card command-card-${card.id}`} key={card.id}><div className="command-card-top"><div className="command-card-icon"><Icon size={19}/></div><div><span>{card.kicker}</span><h2>{card.title}</h2></div>{card.evidence&&<em>{card.evidence}</em>}</div><div className="command-card-signal"><strong>{card.status}</strong><p>{card.detail}</p></div><div className="command-card-action">{card.action}<ArrowRight size={15}/></div></Link>)}</section>

    {state?.errors.length?<section className="command-note"><CircleAlert size={18}/><div><strong>Some evidence sources are unavailable.</strong><p>{state.errors.join(' · ')}. The command center leaves those modules unpopulated rather than substituting sample values.</p></div></section>:null}
  </div>
}
