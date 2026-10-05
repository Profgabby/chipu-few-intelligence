import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, FlaskConical, MapPin, ShieldCheck } from 'lucide-react'
import { farmState, scenarios } from '../lib/cropsmart-model'
import { hasResearchSession, listDomainRecords } from '../lib/chipu-domain-api'
import { useResearchContext } from '../lib/research-context'

type PlaceRecord = { id:string; farm_id:string; name:string; administrative_area?:string }

export function ResearchContextBar(){
  const {workspaceName,farmId,setFarmId,siteId,setSiteId,zoneId,setZoneId,scenario,setScenario}=useResearchContext()
  const[places,setPlaces]=useState<PlaceRecord[]>([])
  useEffect(()=>{let live=true;if(!hasResearchSession()){setPlaces([]);return}listDomainRecords<PlaceRecord>('places').then(rows=>{if(live)setPlaces(rows)}).catch(()=>{if(live)setPlaces([])});return()=>{live=false}},[])
  const siteOptions=useMemo(()=>[{id:'CEDAR-CREEK',farm_id:'CEDAR-CREEK',name:farmState.name},...places.filter(p=>p.id!=='CEDAR-CREEK')],[places])
  const selectSite=(id:string)=>{setSiteId(id);const selected=siteOptions.find(item=>item.id===id);if(selected?.farm_id)setFarmId(selected.farm_id)}
  return <header className="research-context-bar">
    <div className="research-mode"><ShieldCheck size={14}/><span>Research mode</span></div>
    <div className="research-context-summary"><FlaskConical size={13}/><strong>{workspaceName}</strong><span className="context-separator">/</span><MapPin size={13}/><strong>{farmId}</strong><span>·</span><strong>{zoneId}</strong><span>·</span><strong>{scenario}</strong></div>
    <details className="context-editor"><summary>Change context <ChevronDown size={13}/></summary><div className="context-editor-panel">
      <label>Farm / site<select value={siteId} onChange={e=>selectSite(e.target.value)}>{siteOptions.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Zone<select value={zoneId} onChange={e=>setZoneId(e.target.value)}>{farmState.zones.map(item=><option key={item.id} value={item.id}>{item.id}</option>)}</select></label>
      <label>Scenario<select value={scenario} onChange={e=>setScenario(e.target.value)}>{scenarios.map(item=><option key={item.id} value={item.id}>{item.id} · {item.name}</option>)}</select></label>
    </div></details>
  </header>
}