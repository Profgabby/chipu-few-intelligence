import { Link } from 'react-router-dom'
import { ArrowRight, CircleAlert } from 'lucide-react'
import { getChipuModule, type ChipuModuleId } from '../lib/chipu-modules'

const moduleContent: Partial<Record<ChipuModuleId,{intro:string;emptyTitle:string;emptyText:string;links?:{label:string;to:string}[]}>> = {
  people: {
    intro: 'Human, stakeholder and institutional context for integrated food–energy–water decisions.',
    emptyTitle: 'No stakeholder data available',
    emptyText: 'Add stakeholder roles, priorities, constraints, adoption/readiness indicators or decision notes before this module produces evidence-backed outputs.',
    links: [{label:'Data & Provenance',to:'/app/data'}],
  },
  place: {
    intro: 'Site-specific geographic, land, soil, infrastructure and operational context for FEW decisions.',
    emptyTitle: 'Add site data',
    emptyText: 'Place context is not yet configured as a dedicated production dataset. Existing farm, zone and agrivoltaic comparison views remain available while the place model is expanded.',
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
    emptyTitle: 'Use the existing food research tools',
    emptyText: 'Current crop, harvest and storage functionality is preserved and mapped into CHIPU-FEW Food.',
    links: [{label:'Crop & Harvest',to:'/app/crops'},{label:'Food Loss & Storage',to:'/app/storage'}],
  },
}

export function ChipuFoundationWorkspace({moduleId}:{moduleId:ChipuModuleId}) {
  const module = getChipuModule(moduleId)
  const content = moduleContent[moduleId]
  if (!module || !content) return <div className="workspace"><section className="panel"><div className="panel-body">Module not configured.</div></section></div>
  return <div className="workspace">
    <header className="workspace-header"><div><div className="eyebrow eyebrow-status"><span className="status-dot" />CHIPU-FEW MODULE</div><h1>{module.name}</h1><p>{content.intro}</p></div></header>
    <section className="panel"><div className="panel-header"><div className="eyebrow">CURRENT IMPLEMENTATION STATE</div><h2>{content.emptyTitle}</h2></div><div className="panel-body"><div className="callout callout-amber"><CircleAlert size={18}/><div><strong>{module.status==='foundation'?'Foundation established':'Existing capability mapped'}</strong><p>{content.emptyText}</p></div></div>{content.links&&<div className="chipu-link-row">{content.links.map(link=><Link className="button button-outline" key={link.to} to={link.to}>{link.label}<ArrowRight size={14}/></Link>)}</div>}</div></section>
  </div>
}
