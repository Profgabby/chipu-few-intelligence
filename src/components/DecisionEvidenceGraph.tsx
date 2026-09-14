import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, ArrowRight, BarChart3, BrainCircuit, CircleDot, Droplets, Gauge, Globe2, Play, ShieldCheck, Sprout, Sun, UsersRound } from 'lucide-react'
import type { CommandCenterState } from '../lib/command-center-engine'
import type { Zone } from '../lib/cropsmart-model'
import { runForecast } from '../lib/forecast-engine'
import { runForecastDrivenControl } from '../lib/forecast-control-engine'
import { buildDecisionEvidenceGraph, type EvidenceEdge, type EvidenceNode, type EvidenceNodeId } from '../lib/decision-evidence-graph'
import '../evidence-graph.css'

const icons:Record<EvidenceNodeId,typeof Activity>={people:UsersRound,place:Globe2,food:Sprout,energy:Sun,water:Droplets,twin:Activity,predict:BrainCircuit,control:Gauge,economics:BarChart3,resilience:ShieldCheck,decision:CircleDot}
const nodePos=(node:EvidenceNode)=>({left:`${5+(node.column-1)*15}%`,top:`${node.row===1?12:node.row===2?49:86}%`})
const svgPos=(node:EvidenceNode)=>({x:95+(node.column-1)*210,y:node.row===1?92:node.row===2?255:418})
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
    if(item.from==='predict'&&item.to==='control') return {label:'Run Forecast-Driven Control',detail:state?.forecast?`Run ${scenarioId} across all ${state.forecast.points.length} forecast points over the ${state.forecast.horizonHours}-hour planning horizon, propagating crop-water demand, photovoltaic availability, pumping demand, battery state and forecast uncertainty into strategy ranking.`:'A forecast is required first.',enabled:Boolean(state?.forecast)}
    if(item.from==='control'&&item.to==='economics') return {label:'Open pre-filled Economics',detail:state?.scenarioRun?'Carry the selected Control run into Economics as documented operational context. Monetary inputs remain researcher-entered.':'A Control run is required first.',enabled:Boolean(state?.scenarioRun)}
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
        const run=await runForecastDrivenControl({forecast:state.forecast,scenarioId})
        setWorkflowMessage(`Forecast-driven Control ${run.runId} evaluated ${run.trajectory.pointCount} forecast steps across ${run.trajectory.horizonHours} hours. Best strategy: ${run.bestStrategy}.`)
        await onEvidenceChanged();return
      }
      if(item.from==='control'&&item.to==='economics'){
        if(!state?.scenarioRun)throw new Error('Run Control before opening Economics.')
        navigate('/app/economics',{state:{controlRun:state.scenarioRun,source:'decision-evidence-graph'}});return
      }
      if(item.from==='control'&&item.to==='resilience'){
        if(!state?.scenarioRun)throw new Error('Run Control before opening Resilience.')
        navigate('/app/resilience',{state:{controlRun:state.scenarioRun,source:'decision-evidence-graph'}});return
      }
      const target=graph.nodes.find(node=>node.id===item.to)
      if(target?.route)navigate(target.route)
    }catch(error){setWorkflowMessage(error instanceof Error?error.message:String(error))}finally{setBusyEdge(null)}
  }

  return <section className="evidence-layer">
    <div className="evidence-layer-head"><div><div className="eyebrow">LIVE CROSS-MODULE DECISION LAYER</div><h2>Evidence moves through the system—not just between pages.</h2><p>Select a node to inspect lineage, or select a dependency line to run the workflow that completes it.</p></div><div className={`decision-readiness decision-readiness-${graph.decisionReadiness.toLowerCase()}`}><span>DECISION CHAIN</span><strong>{graph.decisionReadiness}</strong><small>{graph.activeEdges} active · {graph.blockedEdges} blocked</small></div></div>
    <div className="evidence-graph-shell">
      <div className="evidence-stage-band"><span>CONTEXT</span><span>FEW STATE</span><span>STATE</span><span>PREDICT</span><span>CONTROL</span><span>CONSEQUENCE</span><span>DECISION</span></div>
      <div className="evidence-canvas">
        <svg className="evidence-edge-layer" viewBox="0 0 1400 510" preserveAspectRatio="none"><defs><marker id="edge-arrow-active" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z"/></marker><marker id="edge-arrow-muted" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z"/></marker></defs>{graph.edges.map((item,index)=>{const from=graph.nodes.find(node=>node.id===item.from)!;const to=graph.nodes.find(node=>node.id===item.to)!;const a=svgPos(from),b=svgPos(to);const d=`M ${a.x+70} ${a.y} C ${a.x+120} ${a.y}, ${b.x-70} ${b.y}, ${b.x-40} ${b.y}`;const key=edgeKey(item);return <g key={`${key}-${index}`} className={selectedEdge===key?'evidence-edge-group-selected':''}><path className={`evidence-edge evidence-edge-${item.status}`} d={d} markerEnd={item.status==='active'?'url(#edge-arrow-active)':'url(#edge-arrow-muted)'}/><path className="evidence-edge-hit" d={d} role="button" tabIndex={0} aria-label={`${from.label} to ${to.label}: ${item.label}. ${item.status}`} onClick={()=>selectEdge(item)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectEdge(item)}}}/></g>})}</svg>
        {graph.nodes.map(node=>{const Icon=icons[node.id];return <button key={node.id} className={`evidence-node evidence-node-${node.status} ${!selectedEdge&&selected.id===node.id?'evidence-node-selected':''}`} style={nodePos(node)} onClick={()=>selectNode(node.id)} aria-label={`Inspect ${node.label}`}><span className="evidence-node-icon"><Icon size={17}/></span><span className="evidence-node-copy"><em>{node.stage}</em><strong>{node.label}</strong><small>{node.signal}</small></span><i className={`node-state-dot node-state-${node.status}`}/></button>})}
      </div>
      <aside className="evidence-inspector">{edge?(()=>{const from=graph.nodes.find(node=>node.id===edge.from)!;const to=graph.nodes.find(node=>node.id===edge.to)!;const workflow=workflowFor(edge);return <><div className="inspector-title"><div><span>DEPENDENCY WORKFLOW</span><h3>{from.label} → {to.label}</h3></div><span className={`inspector-status inspector-status-${edge.status}`}>{edge.status}</span></div><div className="inspector-signal"><span>EVIDENCE TRANSFER</span><strong>{edge.label}</strong><small>{from.evidence} → {to.evidence}</small></div><dl><div><dt>Upstream</dt><dd>{from.signal}</dd></div><div><dt>Downstream</dt><dd>{to.signal}</dd></div><div><dt>Workflow boundary</dt><dd>{workflow.detail}</dd></div></dl>{workflow.route?<Link className="inspector-action" to={workflow.route}>{workflow.label}<ArrowRight size={15}/></Link>:<button className="inspector-action inspector-workflow-button" disabled={!workflow.enabled||busyEdge===edgeKey(edge)} onClick={()=>void runEdgeWorkflow(edge)}><Play size={14}/>{busyEdge===edgeKey(edge)?'Running workflow…':workflow.label}</button>}{workflowMessage&&<div className="workflow-message">{workflowMessage}</div>}</>})():<><div className="inspector-title"><div><span>{selected.stage}</span><h3>{selected.label}</h3></div><span className={`inspector-status inspector-status-${selected.status}`}>{selected.status}</span></div><div className="inspector-signal"><span>CURRENT SIGNAL</span><strong>{selected.signal}</strong><small>{selected.evidence}</small></div><dl><div><dt>Evidence source</dt><dd>{selected.source}</dd></div><div><dt>Inputs</dt><dd>{incoming.length?incoming.map(item=><button key={`${item.from}-${item.to}`} className={`lineage-pill lineage-${item.status}`} onClick={()=>selectEdge(item)}>{graph.nodes.find(node=>node.id===item.from)?.label} · {item.label}</button>):<span className="lineage-pill">Origin/context node</span>}</dd></div><div><dt>Feeds</dt><dd>{outgoing.length?outgoing.map(item=><button key={`${item.from}-${item.to}`} className={`lineage-pill lineage-${item.status}`} onClick={()=>selectEdge(item)}>{graph.nodes.find(node=>node.id===item.to)?.label} · {item.label}</button>):<span className="lineage-pill">Decision output</span>}</dd></div></dl>{selected.route?<Link className="inspector-action" to={selected.route}>{selected.nextAction}<ArrowRight size={15}/></Link>:<div className="inspector-action inspector-action-disabled">{selected.nextAction}</div>}</>}</aside>
    </div>
    <div className="evidence-legend"><span><i className="node-state-dot node-state-available"/>Available evidence</span><span><i className="node-state-dot node-state-context"/>Research context</span><span><i className="node-state-dot node-state-partial"/>Partial</span><span><i className="node-state-dot node-state-protected"/>Protected</span><span><i className="node-state-dot node-state-missing"/>Missing</span><span>Select any connection to act on it</span></div>
  </section>
}
