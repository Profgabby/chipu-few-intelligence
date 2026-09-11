import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, BarChart3, BrainCircuit, CircleDot, Droplets, Gauge, Globe2, HeartHandshake, ShieldCheck, Sprout, Sun, UsersRound } from 'lucide-react'
import type { CommandCenterState } from '../lib/command-center-engine'
import type { Zone } from '../lib/cropsmart-model'
import { buildDecisionEvidenceGraph, type EvidenceNode, type EvidenceNodeId } from '../lib/decision-evidence-graph'

const icons:Record<EvidenceNodeId,typeof Activity>={people:UsersRound,place:Globe2,food:Sprout,energy:Sun,water:Droplets,twin:Activity,predict:BrainCircuit,control:Gauge,economics:BarChart3,resilience:ShieldCheck,decision:CircleDot}
const nodePos=(node:EvidenceNode)=>({left:`${5+(node.column-1)*15}%`,top:`${node.row===1?12:node.row===2?49:86}%`})
const svgPos=(node:EvidenceNode)=>({x:95+(node.column-1)*210,y:node.row===1?92:node.row===2?255:418})

export function DecisionEvidenceGraph({state,zone}:{state:CommandCenterState|null;zone:Zone}){
  const graph=useMemo(()=>buildDecisionEvidenceGraph(state,zone),[state,zone])
  const [selectedId,setSelectedId]=useState<EvidenceNodeId>('twin')
  const selected=graph.nodes.find(node=>node.id===selectedId)??graph.nodes[0]
  const incoming=graph.edges.filter(edge=>edge.to===selected.id)
  const outgoing=graph.edges.filter(edge=>edge.from===selected.id)
  return <section className="evidence-layer">
    <div className="evidence-layer-head"><div><div className="eyebrow">LIVE CROSS-MODULE DECISION LAYER</div><h2>Evidence moves through the system—not just between pages.</h2><p>Each connection is derived from the evidence currently available in the selected research context. Missing dependencies stay visible as gaps.</p></div><div className={`decision-readiness decision-readiness-${graph.decisionReadiness.toLowerCase()}`}><span>DECISION CHAIN</span><strong>{graph.decisionReadiness}</strong><small>{graph.activeEdges} active · {graph.blockedEdges} blocked</small></div></div>
    <div className="evidence-graph-shell">
      <div className="evidence-stage-band"><span>CONTEXT</span><span>FEW STATE</span><span>STATE</span><span>PREDICT</span><span>CONTROL</span><span>CONSEQUENCE</span><span>DECISION</span></div>
      <div className="evidence-canvas">
        <svg className="evidence-edge-layer" viewBox="0 0 1400 510" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="edge-arrow-active" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z"/></marker><marker id="edge-arrow-muted" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z"/></marker></defs>{graph.edges.map((edge,index)=>{const from=graph.nodes.find(node=>node.id===edge.from)!;const to=graph.nodes.find(node=>node.id===edge.to)!;const a=svgPos(from),b=svgPos(to);return <path key={`${edge.from}-${edge.to}-${index}`} className={`evidence-edge evidence-edge-${edge.status}`} d={`M ${a.x+70} ${a.y} C ${a.x+120} ${a.y}, ${b.x-70} ${b.y}, ${b.x-40} ${b.y}`} markerEnd={edge.status==='active'?'url(#edge-arrow-active)':'url(#edge-arrow-muted)'}/>})}</svg>
        {graph.nodes.map(node=>{const Icon=icons[node.id];return <button key={node.id} className={`evidence-node evidence-node-${node.status} ${selected.id===node.id?'evidence-node-selected':''}`} style={nodePos(node)} onClick={()=>setSelectedId(node.id)} aria-label={`Inspect ${node.label}`}><span className="evidence-node-icon"><Icon size={17}/></span><span className="evidence-node-copy"><em>{node.stage}</em><strong>{node.label}</strong><small>{node.signal}</small></span><i className={`node-state-dot node-state-${node.status}`}/></button>})}
      </div>
      <aside className="evidence-inspector"><div className="inspector-title"><div><span>{selected.stage}</span><h3>{selected.label}</h3></div><span className={`inspector-status inspector-status-${selected.status}`}>{selected.status}</span></div><div className="inspector-signal"><span>CURRENT SIGNAL</span><strong>{selected.signal}</strong><small>{selected.evidence}</small></div><dl><div><dt>Evidence source</dt><dd>{selected.source}</dd></div><div><dt>Inputs</dt><dd>{incoming.length?incoming.map(edge=><span key={`${edge.from}-${edge.to}`} className={`lineage-pill lineage-${edge.status}`}>{graph.nodes.find(node=>node.id===edge.from)?.label} · {edge.label}</span>):<span className="lineage-pill">Origin/context node</span>}</dd></div><div><dt>Feeds</dt><dd>{outgoing.length?outgoing.map(edge=><span key={`${edge.from}-${edge.to}`} className={`lineage-pill lineage-${edge.status}`}>{graph.nodes.find(node=>node.id===edge.to)?.label} · {edge.label}</span>):<span className="lineage-pill">Decision output</span>}</dd></div></dl>{selected.route?<Link className="inspector-action" to={selected.route}>{selected.nextAction}<ArrowRight size={15}/></Link>:<div className="inspector-action inspector-action-disabled">{selected.nextAction}</div>}</aside>
    </div>
    <div className="evidence-legend"><span><i className="node-state-dot node-state-available"/>Available evidence</span><span><i className="node-state-dot node-state-context"/>Research context</span><span><i className="node-state-dot node-state-partial"/>Partial</span><span><i className="node-state-dot node-state-protected"/>Protected</span><span><i className="node-state-dot node-state-missing"/>Missing</span></div>
  </section>
}
