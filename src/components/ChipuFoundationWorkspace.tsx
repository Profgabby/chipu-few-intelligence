import { Link } from 'react-router-dom'
import { ArrowRight, CircleAlert, MapPin, Users } from 'lucide-react'
import { getChipuModule, type ChipuModuleId } from '../lib/chipu-modules'
import { farmState } from '../lib/cropsmart-model'
import { useResearchContext } from '../lib/research-context'

const moduleContent: Partial<Record<ChipuModuleId,{intro:string;emptyTitle:string;emptyText:string;links?:{label:string;to:string}[]}>> = {
  people: {
    intro: 'Human, stakeholder and institutional context for integrated food–energy–water decisions.',
    emptyTitle: 'No stakeholder records available',
    emptyText: 'The People domain now has a first-class route and shared type contract, but no stakeholder roles, priorities, constraints or adoption/readiness records are persisted yet.',
    links: [{label:'Data & Provenance',to:'/app/data'}],
  },
  place: {
    intro: 'Site-specific geographic, land, soil, infrastructure and operational context for FEW decisions.',
    emptyTitle: 'Dedicated place dataset not yet configured',
    emptyText: 'Existing farm and zone context is reused here. Soil, land, infrastructure, regulatory and hazard attributes will be persisted only after project/site scoping and RLS are designed explicitly.',
    links: [{label:'Farm Digital Twin',to:'/app/farm'},{label:'Agrivoltaic Comparison',to:'/app/agrivoltaics'}],
  },
  economics: {
    intro: 'Techno-economic analysis for costs, revenues, affordability, payback and investment decisions.',
    emptyTitle: 'Economic model not yet configured',
    emptyText: 'No production TEA dataset or validated economic model is currently persisted. Existing scientific calculations are preserved; future economic functions will be added with documented assumptions and provenance.',
    links: [{label:'Scenario Laboratory',to:'/app/scenarios'}],
  },
  food: {
    intro: 'Food-production, crop, harvest and postharvest intelligence linked to water and energy states.',
    emptyTitle: 'Existing food research tools mapped',
    emptyText: 'Current crop, harvest and storage functionality is preserved and mapped into CHIPU-FEW Food without duplicating the underlying legacy research logic.',
    links: [{label:'Crop & Harvest',to:'/app/crops'},{label:'Food Loss & Storage',to:'/app/storage'}],
  },
}

export function ChipuFoundationWorkspace({moduleId}:{moduleId:ChipuModuleId}) {
  const module = getChipuModule(moduleId)
  const content = moduleContent[moduleId]
  const { zoneId, scenario } = useResearchContext()
  if (!module || !content) return <div className="workspace"><section className="panel"><div className="panel-body">Module not configured.</div></section></div>
  return <div className="workspace">
    <header className="workspace-header"><div><div className="eyebrow eyebrow-status"><span className="status-dot" />CHIPU-FEW MODULE</div><h1>{module.name}</h1><p>{content.intro}</p></div></header>
    {(moduleId==='people'||moduleId==='place')&&<section className="panel"><div className="panel-header"><div className="eyebrow">CURRENT SHARED CONTEXT</div><h2>{moduleId==='people'?'Decision context':'Site context'}</h2></div><div className="panel-body"><div className="metric-grid"><div className="signal"><b>{moduleId==='people'?'Research workspace':'Farm / facility'}</b><strong>{moduleId==='people'?'Research user':farmState.name}</strong><small>{moduleId==='people'?'No persisted stakeholder profile':farmState.dataset}</small></div><div className="signal"><b>Active zone</b><strong>{zoneId}</strong><small>Shared research context</small></div><div className="signal"><b>Scenario</b><strong>{scenario}</strong><small>Shared scenario selection</small></div><div className="signal"><b>Domain status</b><strong>FOUNDATION</strong><small>No fabricated production records</small></div></div><div className="callout">{moduleId==='people'?<Users size={18}/>:<MapPin size={18}/>}<div><strong>Existing context is reused, not duplicated.</strong><p>{moduleId==='people'?'Stakeholder data will be layered onto the current farm/project context once a scoped persistence model is approved.':'The existing farm, zone and scenario context remains the source of truth while dedicated place attributes are added incrementally.'}</p></div></div></div></section>}
    <section className="panel"><div className="panel-header"><div className="eyebrow">CURRENT IMPLEMENTATION STATE</div><h2>{content.emptyTitle}</h2></div><div className="panel-body"><div className="callout callout-amber"><CircleAlert size={18}/><div><strong>{module.status==='foundation'?'Foundation established':'Existing capability mapped'}</strong><p>{content.emptyText}</p></div></div>{content.links&&<div className="chipu-link-row">{content.links.map(link=><Link className="button button-outline" key={link.to} to={link.to}>{link.label}<ArrowRight size={14}/></Link>)}</div>}</div></section>
  </div>
}
