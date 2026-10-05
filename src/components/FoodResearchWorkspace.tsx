import { Activity, Database, Droplets, Gauge, Leaf, Link2, SunMedium } from 'lucide-react'
import { Link } from 'react-router-dom'
import { farmState, getZone, observations } from '../lib/cropsmart-model'
import { useResearchContext } from '../lib/research-context'
import { ResearchWorkspaceGrammar } from './ResearchWorkspaceGrammar'

export function FoodResearchWorkspace() {
  const { zoneId, scenario } = useResearchContext()
  const zone = getZone(zoneId)
  const evidence = observations(zoneId)
  const recent = evidence.slice(-12)
  const suspect = evidence.filter(item => item.quality === 'SUSPECT').length

  return <div className="workspace food-research-workspace">
    <header className="workspace-header">
      <div>
        <div className="eyebrow eyebrow-status"><span className="status-dot" />CHIPU-FEW FOOD</div>
        <h1>Food system</h1>
        <p>Crop, harvest and postharvest research context connected explicitly to water, energy, state and scenario evidence.</p>
      </div>
    </header>

    <ResearchWorkspaceGrammar
      active={['Context','Evidence / Observations','Inputs','State / Indicators','FEW Dependencies','Outputs','Provenance']}
      note="Current Food capability uses the preserved CropSmart research dataset and crop/harvest/storage logic. No additional crop model or uncertainty model is implied here."
    />

    <section className="research-section">
      <div className="research-section-heading"><div><span>01 · CONTEXT</span><h2>Active crop system</h2></div><small>{zone.type}</small></div>
      <div className="research-fact-grid">
        <article><Leaf/><span>Crop</span><strong>{zone.crop}</strong><small>{zone.variety}</small></article>
        <article><Activity/><span>Development</span><strong>{zone.stage}</strong><small>{zone.dap} days after planting</small></article>
        <article><SunMedium/><span>Canopy / shade context</span><strong>{Math.round(zone.shade * 100)}%</strong><small>{zone.name}</small></article>
        <article><Database/><span>Research dataset</span><strong>{farmState.dataset}</strong><small>Scenario {scenario}</small></article>
      </div>
    </section>

    <section className="research-two-col">
      <article className="panel">
        <div className="panel-header"><div className="eyebrow">02 · EVIDENCE / OBSERVATIONS</div><h2>Available crop-system evidence</h2></div>
        <div className="panel-body">
          <div className="research-evidence-summary"><strong>{evidence.length}</strong><span>synthetic demonstration observations in the active zone</span></div>
          <div className="research-observation-list">
            {recent.slice(0,6).map(item => <div key={item.id}><span>{item.variable.replace(/_/g,' ')}</span><strong>{item.value} {item.unit}</strong><small>{item.provenance} · {item.quality}</small></div>)}
          </div>
          <p className="research-boundary">The bundled dataset is explicitly <strong>SYNTHETIC</strong>. It demonstrates the research architecture and must not be interpreted as measured field evidence.</p>
        </div>
      </article>

      <article className="panel">
        <div className="panel-header"><div className="eyebrow">03 · INPUTS + 05 · STATE / INDICATORS</div><h2>Current crop-state variables</h2></div>
        <div className="panel-body research-indicator-list">
          <div><span>Root-zone soil water</span><strong>{zone.soilWater.toFixed(3)} m³/m³</strong><small>threshold {zone.threshold.toFixed(2)} m³/m³</small></div>
          <div><span>Crop-water demand</span><strong>{zone.demand.toFixed(1)} mm</strong><small>research dataset value</small></div>
          <div><span>Crop stress index</span><strong>{zone.stress.toFixed(2)}</strong><small>modeled / synthetic context</small></div>
          <div><span>Harvest indicator</span><strong>{zone.harvest}%</strong><small>marketable quantity {zone.marketable}</small></div>
        </div>
      </article>
    </section>

    <section className="research-section">
      <div className="research-section-heading"><div><span>06 · FEW DEPENDENCIES</span><h2>Food does not operate in isolation</h2></div></div>
      <div className="research-dependency-grid">
        <Link to="/app/water"><Droplets/><div><span>WATER</span><strong>{zone.irrigation.toFixed(1)} mm irrigation context</strong><small>Open Water Intelligence →</small></div></Link>
        <Link to="/app/energy"><Gauge/><div><span>ENERGY</span><strong>{zone.pumpEnergy.toFixed(1)} kWh pumping context</strong><small>Open Energy Intelligence →</small></div></Link>
        <Link to="/app/twin"><Link2/><div><span>DIGITAL TWIN</span><strong>Build observation-informed shared state</strong><small>Open Twin State →</small></div></Link>
      </div>
    </section>

    <section className="research-two-col">
      <article className="panel">
        <div className="panel-header"><div className="eyebrow">07 · OUTPUTS</div><h2>Preserved research workspaces</h2></div>
        <div className="panel-body chipu-link-row">
          <Link className="button button-outline" to="/app/crops">Crop & harvest →</Link>
          <Link className="button button-outline" to="/app/storage">Food loss & storage →</Link>
        </div>
      </article>
      <article className="panel">
        <div className="panel-header"><div className="eyebrow">09 · PROVENANCE</div><h2>Evidence boundary</h2></div>
        <div className="panel-body research-provenance">
          <div><span>Dataset</span><strong>{farmState.dataset}</strong></div>
          <div><span>Provenance class</span><strong>SYNTHETIC</strong></div>
          <div><span>Quality flags</span><strong>{suspect} suspect · {evidence.length - suspect} pass</strong></div>
          <div><span>Model context</span><strong>{farmState.model}</strong></div>
        </div>
      </article>
    </section>
  </div>
}
