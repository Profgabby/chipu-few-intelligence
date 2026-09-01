import { ShieldCheck } from 'lucide-react'
import { farmState, scenarios } from '../lib/cropsmart-model'
import { useResearchContext } from '../lib/research-context'

export function ResearchContextBar() {
  const { zoneId, setZoneId, scenario, setScenario, stateRun, predictionRun } = useResearchContext()
  return <div className="context-bar"><span className="context-status"><ShieldCheck size={14} /> RESEARCH DEMONSTRATION</span><span className="context-separator">|</span><span className="context-farm">{farmState.name}</span><label>ZONE <select value={zoneId} onChange={event => setZoneId(event.target.value)}><option>AV-A</option><option>OPEN-A</option><option>AV-B</option><option>EXPERIMENTAL-A</option></select></label><label>SCENARIO <select value={scenario} onChange={event => setScenario(event.target.value)}>{scenarios.map(item => <option key={item.id} value={item.id}>{item.id}</option>)}</select></label><span>{stateRun}</span><span className="context-optional">{predictionRun}</span><span className="context-optional">{farmState.model}</span><strong className="context-tail">{zoneId} · {scenario} · SYNTHETIC</strong></div>
}
