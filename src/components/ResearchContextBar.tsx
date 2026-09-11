import { useEffect, useMemo, useState } from 'react'
import { FlaskConical, MapPin, ShieldCheck } from 'lucide-react'
import { farmState, scenarios } from '../lib/cropsmart-model'
import { hasResearchSession, listDomainRecords } from '../lib/chipu-domain-api'
import { useResearchContext } from '../lib/research-context'

type PlaceRecord = { id: string; farm_id: string; name: string; administrative_area?: string }

export function ResearchContextBar() {
  const { workspaceName, farmId, setFarmId, siteId, setSiteId, zoneId, setZoneId, scenario, setScenario } = useResearchContext()
  const [places, setPlaces] = useState<PlaceRecord[]>([])
  useEffect(() => {
    let live = true
    if (!hasResearchSession()) { setPlaces([]); return }
    listDomainRecords<PlaceRecord>('places').then(rows => { if (live) setPlaces(rows) }).catch(() => { if (live) setPlaces([]) })
    return () => { live = false }
  }, [])
  const siteOptions = useMemo(() => [{ id: 'CEDAR-CREEK', farm_id: 'CEDAR-CREEK', name: farmState.name }, ...places.filter(p => p.id !== 'CEDAR-CREEK')], [places])
  const selectSite = (id: string) => {
    setSiteId(id)
    const selected = siteOptions.find(item => item.id === id)
    if (selected?.farm_id) setFarmId(selected.farm_id)
  }
  return <div className="context-bar context-bar-v2">
    <span className="context-status"><ShieldCheck size={14}/> RESEARCH MODE</span>
    <div className="context-crumb"><FlaskConical size={13}/><span>WORKSPACE</span><strong>{workspaceName}</strong></div>
    <div className="context-crumb"><MapPin size={13}/><span>FARM / SITE</span><select value={siteId} onChange={event => selectSite(event.target.value)}>{siteOptions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
    <label>ZONE <select value={zoneId} onChange={event => setZoneId(event.target.value)}>{farmState.zones.map(item => <option key={item.id} value={item.id}>{item.id}</option>)}</select></label>
    <label>SCENARIO <select value={scenario} onChange={event => setScenario(event.target.value)}>{scenarios.map(item => <option key={item.id} value={item.id}>{item.id} · {item.name}</option>)}</select></label>
    <strong className="context-tail">{farmId} · {zoneId} · {scenario}</strong>
  </div>
}
