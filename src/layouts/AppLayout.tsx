import { NavLink, Outlet } from 'react-router-dom'
import { Activity, BarChart3, BookOpen, Database, Droplets, Gauge, LayoutDashboard, Menu, ShieldCheck, Sprout, TrendingUp, X, Zap } from 'lucide-react'
import { useState, type ComponentType } from 'react'
import { ResearchContextProvider } from '../lib/research-context'
import { PlaceContextBoundary } from '../components/PlaceContextBoundary'
import { ResearchContextBar } from '../components/ResearchContextBar'
import { CHIPU_PRODUCT } from '../lib/chipu-modules'

type NavItem = readonly [string,string,ComponentType<{size?:number}>]
type NavGroup = { label:string; items:readonly NavItem[] }

const groups:readonly NavGroup[]=[
  {label:'Research system',items:[
    ['/app','Overview',LayoutDashboard],
    ['/app/data','Data & Context',Database],
    ['/app/location','Location & System',Database],
    ['/app/twin','Digital Twin',Activity],
    ['/app/model-laboratory','Model Laboratory',BarChart3],
    ['/app/predict','Prediction',TrendingUp],
  ]},
  {label:'FEW intelligence',items:[
    ['/app/food','Food / Crop',Sprout],
    ['/app/water','Water',Droplets],
    ['/app/energy','Energy',Zap],
    ['/app/control','Scenarios & Control',Gauge],
    ['/app/economics','Economics',BarChart3],
    ['/app/resilience','Resilience',ShieldCheck],
  ]},
  {label:'Research',items:[
    ['/app/experiments','Experiments',BookOpen],
    ['/app/methods','Methods & Evidence',BookOpen],
  ]},
] as const

function Sidebar({onNavigate}:{onNavigate?:()=>void}){
  return <aside className="sidebar">
    <div className="sidebar-brand"><span className="brand-mark">CF</span><div><strong>{CHIPU_PRODUCT.name}</strong><small>Integrated FEW research platform</small></div></div>
    <nav className="research-nav" aria-label="Research workspaces">
      {groups.map(group=><section className="research-nav-group" key={group.label}><div className="sidebar-label">{group.label}</div>{group.items.map(([to,label,Icon])=><NavLink key={to} to={to} end={to==='/app'} onClick={onNavigate} className={({isActive})=>`nav-item ${isActive?'nav-item-active':''}`}><Icon size={16}/><span>{label}</span></NavLink>)}</section>)}
    </nav>
    <div className="sidebar-footer"><div className="avatar">R</div><div><strong>Research workspace</strong><small>Traceable · reproducible · evidence-aware</small></div></div>
  </aside>
}

export function AppLayout(){
  const[mobileOpen,setMobileOpen]=useState(false)
  return <ResearchContextProvider><div className="app-shell">
    <div className="mobile-header"><button className="icon-button" onClick={()=>setMobileOpen(true)} aria-label="Open navigation"><Menu size={19}/></button><strong>{CHIPU_PRODUCT.shortName}</strong></div>
    <div className={`mobile-drawer ${mobileOpen?'mobile-drawer-open':''}`}><div className="mobile-drawer-top"><strong>Research workspaces</strong><button className="icon-button" onClick={()=>setMobileOpen(false)} aria-label="Close navigation"><X size={18}/></button></div><Sidebar onNavigate={()=>setMobileOpen(false)}/></div>
    <div className="desktop-sidebar"><Sidebar/></div>
    <main className="app-main"><ResearchContextBar/><PlaceContextBoundary/></main>
  </div></ResearchContextProvider>
}