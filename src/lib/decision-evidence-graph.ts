import type { CommandCenterState } from './command-center-engine'
import type { Zone } from './cropsmart-model'

export type EvidenceNodeStatus = 'available' | 'partial' | 'missing' | 'protected' | 'context'
export type EvidenceEdgeStatus = 'active' | 'partial' | 'blocked'

export type EvidenceNodeId = 'people'|'place'|'food'|'energy'|'water'|'twin'|'predict'|'control'|'economics'|'resilience'|'decision'

export type EvidenceNode = {
  id: EvidenceNodeId
  label: string
  stage: string
  route?: string
  status: EvidenceNodeStatus
  signal: string
  evidence: string
  source: string
  nextAction: string
  column: number
  row: number
}

export type EvidenceEdge = { from: EvidenceNodeId; to: EvidenceNodeId; status: EvidenceEdgeStatus; label: string }
export type DecisionEvidenceGraph = { nodes: EvidenceNode[]; edges: EvidenceEdge[]; activeEdges: number; blockedEdges: number; decisionReadiness: 'READY'|'PARTIAL'|'BLOCKED' }

const numeric=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)?value:null
const hasComponent=(state:CommandCenterState['twin'],key:string)=>Boolean(state?.components.find(item=>item.variable===key&&item.value!==null))
const edge=(from:EvidenceNodeId,to:EvidenceNodeId,status:EvidenceEdgeStatus,label:string):EvidenceEdge=>({from,to,status,label})

export function buildDecisionEvidenceGraph(state:CommandCenterState|null,zone:Zone):DecisionEvidenceGraph{
  const connected=Boolean(state?.connected)
  const peopleCount=state?.stakeholderCount
  const placeCount=state?.placeCount
  const hasPeople=peopleCount!==null&&peopleCount!==undefined&&peopleCount>0
  const hasPlace=placeCount!==null&&placeCount!==undefined&&placeCount>0
  const hasFood=Boolean(zone?.crop)
  const hasEnergy=hasComponent(state?.twin,'pv_power')||hasComponent(state?.twin,'battery_soc')||hasComponent(state?.twin,'pump_power')
  const hasWater=hasComponent(state?.twin,'soil_water_rootzone')||hasComponent(state?.twin,'tank_level')||hasComponent(state?.twin,'water_flow')
  const hasTwin=Boolean(state?.twin)
  const hasPredict=Boolean(state?.forecast)
  const hasControl=Boolean(state?.scenarioRun)
  const hasEconomics=numeric(state?.latestEconomic?.npv)!==null
  const hasResilience=numeric(state?.latestResilience?.resilience_index)!==null
  const consequenceCount=[hasEconomics,hasResilience].filter(Boolean).length

  const nodes:EvidenceNode[]=[
    {id:'people',label:'People',stage:'CONTEXT',route:'/app/people',status:!connected?'protected':hasPeople?'available':'missing',signal:!connected?'Protected persistence':hasPeople?`${peopleCount} stakeholder record${peopleCount===1?'':'s'}`:'No stakeholder data',evidence:!connected?'PROTECTED':hasPeople?'PERSISTENT':'NO DATA',source:'CHIPU-FEW People persistence',nextAction:!connected?'Connect research session':hasPeople?'Inspect stakeholder context':'Add stakeholder data',column:1,row:1},
    {id:'place',label:'Place',stage:'CONTEXT',route:'/app/place',status:!connected?'protected':hasPlace?'available':'missing',signal:!connected?'Protected persistence':hasPlace?`${placeCount} site record${placeCount===1?'':'s'}`:'No site data',evidence:!connected?'PROTECTED':hasPlace?'PERSISTENT':'NO DATA',source:'CHIPU-FEW Place persistence',nextAction:!connected?'Connect research session':hasPlace?'Inspect site context':'Add site data',column:1,row:3},
    {id:'food',label:'Food',stage:'FEW STATE',route:'/app/food',status:hasFood?'context':'missing',signal:hasFood?`${zone.crop} · ${zone.stage}`:'No crop context',evidence:hasFood?'SYNTHETIC RESEARCH CONTEXT':'NO DATA',source:'Existing CropSmart crop/agronomy context',nextAction:hasFood?'Inspect crop/harvest context':'Add crop data',column:2,row:1},
    {id:'energy',label:'Energy',stage:'FEW STATE',route:'/app/energy',status:hasEnergy?'available':hasTwin?'partial':'missing',signal:hasEnergy?'Energy state present':hasTwin?'Twin exists; energy state incomplete':'No energy state',evidence:state?.twin?.evidenceMode??'NO DATA',source:'Twin components: photovoltaic, battery, pump/load variables',nextAction:hasEnergy?'Inspect energy state':'Build/complete Twin state',column:2,row:2},
    {id:'water',label:'Water',stage:'FEW STATE',route:'/app/water',status:hasWater?'available':hasTwin?'partial':'missing',signal:hasWater?'Water state present':hasTwin?'Twin exists; water state incomplete':'No water state',evidence:state?.twin?.evidenceMode??'NO DATA',source:'Twin components: soil water, tank and flow variables',nextAction:hasWater?'Inspect water state':'Build/complete Twin state',column:2,row:3},
    {id:'twin',label:'Twin',stage:'STATE',route:'/app/twin',status:hasTwin?(state?.twin?.aggregateQuality==='INSUFFICIENT'?'partial':'available'):'missing',signal:hasTwin?`${state?.twin?.completeness}% complete · ${state?.twin?.aggregateQuality}`:'No Twin state',evidence:state?.twin?.evidenceMode??'NO DATA',source:'State engine / persisted browser Twin state',nextAction:hasTwin?'Inspect system state':'Build Twin state',column:3,row:2},
    {id:'predict',label:'Predict',stage:'ANTICIPATE',route:'/app/predict',status:hasPredict?(state?.forecast?.status==='COMPLETE'?'available':'partial'):'missing',signal:hasPredict?`${state?.forecast?.horizonHours} h · ${state?.forecast?.status}`:'No forecast',evidence:state?.forecast?.evidenceMode??'NO DATA',source:'Forecast engine initialized from Twin state',nextAction:hasPredict?'Inspect forecast and uncertainty':'Run prediction',column:4,row:2},
    {id:'control',label:'Control',stage:'ACT',route:'/app/control',status:hasControl?'available':'missing',signal:hasControl?`Best strategy: ${state?.scenarioRun?.bestStrategy}`:'No control/scenario run',evidence:state?.scenarioRun?.evidenceMode??'NO DATA',source:'Scenario Laboratory + resource-allocation engine',nextAction:hasControl?'Inspect strategy comparison':'Run scenario/control analysis',column:5,row:2},
    {id:'economics',label:'Economics',stage:'CONSEQUENCE',route:'/app/economics',status:!connected?'protected':hasEconomics?'available':'missing',signal:!connected?'Protected persistence':hasEconomics?`Persisted NPV: ${Number(state?.latestEconomic?.npv).toLocaleString()}`:'No persisted TEA result',evidence:!connected?'PROTECTED':hasEconomics?'PERSISTED ANALYSIS':'NO DATA',source:'CHIPU-FEW Economics persistence',nextAction:!connected?'Connect research session':hasEconomics?'Inspect TEA assumptions':'Run and persist TEA',column:6,row:1},
    {id:'resilience',label:'Resilience',stage:'CONSEQUENCE',route:'/app/resilience',status:!connected?'protected':hasResilience?'available':'missing',signal:!connected?'Protected persistence':hasResilience?`Persisted index: ${state?.latestResilience?.resilience_index}/100`:'No persisted resilience result',evidence:!connected?'PROTECTED':hasResilience?'MODELED / PERSISTED':'NO DATA',source:'CHIPU-FEW Resilience persistence',nextAction:!connected?'Connect research session':hasResilience?'Inspect resilience assessment':'Run resilience assessment',column:6,row:3},
    {id:'decision',label:'Decision Support',stage:'SYNTHESIS',status:hasControl&&consequenceCount===2?'available':hasControl&&consequenceCount>0?'partial':'missing',signal:hasControl&&consequenceCount===2?'Cross-module consequence evidence available':hasControl&&consequenceCount>0?'One consequence pathway available':'Decision chain incomplete',evidence:hasControl?'DERIVED READINESS':'NO DATA',source:'Evidence graph coordination layer',nextAction:hasControl&&consequenceCount===2?'Review trade-offs and provenance':'Complete missing downstream evidence',column:7,row:2},
  ]

  const linkStatus=(a:boolean,b:boolean):EvidenceEdgeStatus=>a&&b?'active':a||b?'partial':'blocked'
  const contextStatus=(present:boolean,downstream:boolean):EvidenceEdgeStatus=>present&&downstream?'active':present||downstream?'partial':'blocked'
  const edges:EvidenceEdge[]=[
    edge('people','food',contextStatus(hasPeople,hasFood),'priorities / management context'),
    edge('people','energy',contextStatus(hasPeople,hasEnergy),'behavior / operating priorities'),
    edge('people','water',contextStatus(hasPeople,hasWater),'allocation / irrigation priorities'),
    edge('place','food',contextStatus(hasPlace,hasFood),'soil / land / site conditions'),
    edge('place','energy',contextStatus(hasPlace,hasEnergy),'infrastructure / resource context'),
    edge('place','water',contextStatus(hasPlace,hasWater),'water source / infrastructure context'),
    edge('food','twin',linkStatus(hasFood,hasTwin),'crop state'),
    edge('energy','twin',linkStatus(hasEnergy,hasTwin),'energy state'),
    edge('water','twin',linkStatus(hasWater,hasTwin),'water state'),
    edge('twin','predict',linkStatus(hasTwin,hasPredict),'state initialization'),
    edge('predict','control',linkStatus(hasPredict,hasControl),'forecast-informed decision context'),
    edge('control','economics',linkStatus(hasControl,hasEconomics),'cost / benefit consequences'),
    edge('control','resilience',linkStatus(hasControl,hasResilience),'continuity / adaptation consequences'),
    edge('economics','decision',linkStatus(hasEconomics,hasControl),'investment consequence'),
    edge('resilience','decision',linkStatus(hasResilience,hasControl),'robustness consequence'),
  ]

  const activeEdges=edges.filter(item=>item.status==='active').length
  const blockedEdges=edges.filter(item=>item.status==='blocked').length
  const decisionReadiness:DecisionEvidenceGraph['decisionReadiness']=hasControl&&consequenceCount===2?'READY':hasControl?'PARTIAL':'BLOCKED'
  return {nodes,edges,activeEdges,blockedEdges,decisionReadiness}
}
