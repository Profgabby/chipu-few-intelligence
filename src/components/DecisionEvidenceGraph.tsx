import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, ArrowRight, BarChart3, BrainCircuit, CircleDot, Droplets, Gauge, Globe2, Play, ShieldCheck, Sprout, Sun, UsersRound } from 'lucide-react'
import type { CommandCenterState } from '../lib/command-center-engine'
import type { Zone } from '../lib/cropsmart-model'
import { runForecast } from '../lib/forecast-engine'
import { runRecedingHorizonControl } from '../lib/receding-horizon-control-engine'
import { buildDecisionEvidenceGraph, type EvidenceEdge, type EvidenceNodeId } from '../lib/decision-evidence-graph'
import '../evidence-graph.css'
import { ResearchStatus } from './ResearchStatus'

const icons:Record<EvidenceNodeId,typeof Activity>={people:UsersRound,place:Globe2,food:Sprout,energy:Sun,water:Droplets,twin:Activity,predict:BrainCircuit,control:Gauge,economics:BarChart3,resilience:ShieldCheck,decision:CircleDot}
const workspacePrompts:Record<EvidenceNodeId,{action:string;description:string}>={
  people:{action:'Review context',description:'Define stakeholder priorities and management goals.'},
  place:{action:'Review site inputs',description:'Review location, soil and infrastructure inputs.'},
  food:{action:'Explore crop inputs',description:'Review the example crop and growing conditions.'},
  energy:{action:'Explore energy inputs',description:'Review solar generation, storage and electricity demand.'},
  water:{action:'Explore water inputs',description:'Review soil moisture, irrigation and pumping inputs.'},
  twin:{action:'Create system snapshot',description:'Use observations and assumptions to prepare a system snapshot.'},
  predict:{action:'Run prediction',description:'Create a forecast after preparing a system snapshot.'},
  control:{action:'Run analysis',description:'Compare operating strategies using a prepared forecast.'},
  economics:{action:'Explore economics',description:'Enter costs and benefits to calculate economic outcomes.'},
  resilience:{action:'Explore resilience',description:'Set disruption assumptions and assess system performance.'},
  decision:{action:'Compare scenarios',description:'Explore simulation outcomes and the assumptions behind them.'},
}
const workspaceLabel=(node:{id:EvidenceNodeId;status:string})=>node.status==='available'?'View results':node.status==='partial'?'Review inputs':workspacePrompts[node.id].action
const edgeKey=(edge:EvidenceEdge)=>`${edge.from}-${edge.to}`

export function DecisionEvidenceGraph({state,zone,scenarioId,onEvidenceChanged}:{state:CommandCenterState|null;zone:Zone;scenarioId:string;onEvidenceChanged:()=>Promise<void>}){
  const navigate=useNavigate()
  const graph=useMemo(()=>buildDecisionEvidenceGraph(state,zone),[state,zone])
  const [selectedId,setSelectedId]=useState<EvidenceNodeId>('twin')
  const [selectedEdge,setSelectedEdge]=useState<string|null>(null)
  const [busyEdge,setBusyEdge]=useState<string|null>(null)
  const [workflowMessage,setWorkflowMessage]=useState('')
  const selected=graph.nodes.find(node=>node.id===selectedId)??graph.nodes[0]
  const edge=selectedEdge?graph.edges.find(item=>edgeKey(item)===selectedEdge):undefined
  const incoming=graph.edges.filter(item=>item.to===selected.id)
  const outgoing=graph.edges.filter(item=>item.from===selected.id)
  const selectNode=(id:EvidenceNodeId)=>{setSelectedId(id);setSelectedEdge(null);setWorkflowMessage('')}
  const selectEdge=(item:EvidenceEdge)=>{setSelectedEdge(edgeKey(item));setWorkflowMessage('')}
  const workflowFor=(item:EvidenceEdge)=>{
    if(item.from==='twin'&&item.to==='predict') return {label:'Run Forecast',detail:state?.twin?'Create a forecast from the currently selected persisted Twin state.':'A Twin state is required first.',enabled:Boolean(state?.twin)}
    if(item.from==='predict'&&item.to==='control') return {label:'Run Receding-Horizon Control',detail:state?.forecast?`Use a moving 24-hour lookahead across the ${state.forecast.horizonHours}-hour forecast. At each ${state.forecast.stepHours}-hour decision step, evaluate strategies, apply only the current action, update modeled soil-water, tank and battery states, then optimize again.`:'A forecast is required first.',enabled:Boolean(state?.forecast)}
    if(item.from==='control'&&item.to==='economics') return {label:'Open Techno-economics',detail:state?.scenarioRun?'Carry the selected Control run into Techno-economics as documented operational context. Monetary inputs remain researcher-entered.':'A Control run is required first.',enabled:Boolean(state?.scenarioRun)}
    if(item.from==='control'&&item.to==='resilience') return {label:'Open pre-filled Resilience',detail:state?.scenarioRun?'Carry the selected Control run directly into the existing resilience assessment engine.':'A Control run is required first.',enabled:Boolean(state?.scenarioRun)}
    const target=graph.nodes.find(node=>node.id===item.to)
    return {label:target?.nextAction??'Open module',detail:`Complete the ${target?.label??item.to} evidence required by this dependency.`,enabled:Boolean(target?.route),route:target?.route}
  }
  const runEdgeWorkflow=async(item:EvidenceEdge)=>{
    const key=edgeKey(item);setBusyEdge(key);setWorkflowMessage('')
    try{
      if(item.from==='twin'&&item.to==='predict'){
        if(!state?.twin)throw new Error('Build a Twin state before running Predict.')
        const forecast=await runForecast({initialStateId:state.twin.id})
        setWorkflowMessage(`Forecast ${forecast.id} created from Twin state ${state.twin.id}.`)
        await onEvidenceChanged();return
      }
      if(item.from==='predict'&&item.to==='control'){
        if(!state?.forecast)throw new Error('Run Predict before launching Control.')
        const run=await runRecedingHorizonControl({forecast:state.forecast,scenarioId,lookaheadHours:24})
        setWorkflowMessage(`Receding-horizon Control ${run.runId} completed ${run.stateUpdates} sequential decisions with a ${run.lookaheadHours}-hour moving lookahead. Mean consequence score ${run.trajectorySummary.meanConsequenceScore}.`)
        await onEvidenceChanged();return
      }
      if(item.from==='control'&&item.to==='economics'){
        if(!state?.scenarioRun)throw new Error('Run Control before opening Techno-economics.')
        navigate('/app/economics',{state:{controlRun:state.scenarioRun,source:'decision-evidence-graph'}});return
      }
      if(item.from==='control'&&item.to==='resilience'){
        if(!state?.scenarioRun)throw new Error('Run Control before opening Resilience.')
        navigate('/app/resilience',{state:{controlRun:state.scenarioRun,source:'decision-evidence-graph'}});return
      }
      const target=graph.nodes.find(node=>node.id===item.to);if(target?.route)navigate(target.route)
    }catch(error){setWorkflowMessage(error instanceof Error?error.message:String(error))}finally{setBusyEdge(null)}
  }
  return <section className="evidence-layer">
    <div className="evidence-layer-head"><div><h2>From data to decisions</h2><p>Follow three steps to explore your system and compare options.</p></div></div>
    <ol className="evidence-steps">
      <li><span>1</span><h3>Set up your system</h3><p>Choose a location and add crop, water and energy inputs.</p><Link to="/app/location">Review system inputs <ArrowRight size={16}/></Link></li>
      <li><span>2</span><h3>Run a simulation</h3><p>Adjust assumptions and compare SS01 with open-sun growing conditions.</p><Link to="/app/model-laboratory">Open Model Laboratory <ArrowRight size={16}/></Link></li>
      <li><span>3</span><h3>Review the results</h3><p>Explore costs, resource use and trade-offs. Check the inputs behind each result.</p><Link to="/app/economics">Explore economics <ArrowRight size={16}/></Link></li>
    </ol>
    <details className="evidence-details"><summary>Explore workspaces and calculation inputs</summary>
    <p className="evidence-details-help">Choose a workspace to explore inputs, run an analysis or inspect saved results. SS01 simulations are available in the Model Laboratory.</p>
    <div className="evidence-graph-shell"><div className="evidence-canvas">{graph.nodes.map(node=>{const Icon=icons[node.id];return <button key={node.id} className={`evidence-node evidence-node-${node.status} ${!selectedEdge&&selected.id===node.id?'evidence-node-selected':''}`} aria-pressed={!selectedEdge&&selected.id===node.id} onClick={()=>selectNode(node.id)}><span className="evidence-node-icon"><Icon size={17}/></span><span className="evidence-node-copy"><strong>{node.label}</strong></span><span className="research-status research-status-context">{workspaceLabel(node)}</span></button>})}</div><aside className="evidence-inspector">{edge?(()=>{const from=graph.nodes.find(node=>node.id===edge.from)!;const to=graph.nodes.find(node=>node.id===edge.to)!;const workflow=workflowFor(edge);return <><div className="inspector-title"><div><span>DEPENDENCY WORKFLOW</span><h3>{from.label} → {to.label}</h3></div><ResearchStatus state={edge.status==='active'?'available':'context'} label={edge.status==='active'?'Results linked':'Prepare inputs'}/></div><div className="inspector-signal"><span>EVIDENCE TRANSFER</span><strong>{edge.label}</strong><small>{from.label} → {to.label}</small></div><dl><div><dt>Upstream</dt><dd>{from.status==='missing'||from.status==='protected'?workspacePrompts[from.id].description:from.signal}</dd></div><div><dt>Downstream</dt><dd>{to.status==='missing'||to.status==='protected'?workspacePrompts[to.id].description:to.signal}</dd></div><div><dt>Workflow boundary</dt><dd>{workflow.detail}</dd></div></dl>{workflow.route?<Link className="inspector-action" to={workflow.route}>{workflow.label}<ArrowRight size={15}/></Link>:<button className="inspector-action inspector-workflow-button" disabled={!workflow.enabled||busyEdge===edgeKey(edge)} onClick={()=>void runEdgeWorkflow(edge)}><Play size={14}/>{busyEdge===edgeKey(edge)?'Running workflow…':workflow.label}</button>}{workflowMessage&&<div className="workflow-message">{workflowMessage}</div>}</>})():<><div className="inspector-title"><div><span>{selected.stage}</span><h3>{selected.label}</h3></div><span className="research-status research-status-context">{workspaceLabel(selected)}</span></div><div className="inspector-signal"><span>{selected.status==='available'?'SAVED RESULT':'WORKSPACE'}</span><strong>{selected.status==='available'||selected.status==='partial'?selected.signal:workspacePrompts[selected.id].description}</strong><small>{selected.status==='context'?'Example crop inputs':selected.status==='available'?selected.evidence:'Use this workspace to prepare inputs and inspect calculations.'}</small></div><dl><div><dt>Evidence source</dt><dd>{selected.source}</dd></div><div><dt>Inputs</dt><dd>{incoming.length?incoming.map(item=><button key={`${item.from}-${item.to}`} className={`lineage-pill lineage-${item.status}`} onClick={()=>selectEdge(item)}>{graph.nodes.find(node=>node.id===item.from)?.label} · {item.label}</button>):<span className="lineage-pill">Origin/context node</span>}</dd></div><div><dt>Feeds</dt><dd>{outgoing.length?outgoing.map(item=><button key={`${item.from}-${item.to}`} className={`lineage-pill lineage-${item.status}`} onClick={()=>selectEdge(item)}>{graph.nodes.find(node=>node.id===item.to)?.label} · {item.label}</button>):<span className="lineage-pill">Decision output</span>}</dd></div></dl>{selected.route?<Link className="inspector-action" to={selected.route}>{workspaceLabel(selected)}<ArrowRight size={15}/></Link>:<Link className="inspector-action" to="/app/model-laboratory">Open Model Laboratory<ArrowRight size={15}/></Link>}</>}</aside></div>
    </details>
  </section>
}
