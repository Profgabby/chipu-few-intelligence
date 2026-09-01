import { NavLink, Outlet } from 'react-router-dom'
import { Activity, Beaker, BookOpen, Database, Droplets, FlaskConical, Gauge, GitBranch, GitCompare, Info, LayoutDashboard, Menu, SlidersHorizontal, Snowflake, Sprout, Sun, Upload, X, Zap } from 'lucide-react'
import { useState } from 'react'
import { ResearchContextProvider } from '../lib/research-context'
import { ResearchContextBar } from '../components/ResearchContextBar'

const nav = [
  ['/app', 'Research Home', LayoutDashboard], ['/app/farm', 'Farm Digital Twin', GitBranch], ['/app/data', 'Data & Provenance', Database], ['/app/twin-state', 'Twin State', Activity], ['/app/forecast', 'Forecast & Prediction', Sun], ['/app/water', 'Water Intelligence', Droplets], ['/app/energy', 'Energy Intelligence', Zap], ['/app/agrivoltaics', 'Agrivoltaic Comparison', GitCompare], ['/app/crops', 'Crop & Harvest', Sprout], ['/app/storage', 'Food Loss & Storage', Snowflake], ['/app/scenarios', 'Scenario Laboratory', FlaskConical], ['/app/uncertainty', 'Uncertainty Explorer', SlidersHorizontal], ['/app/resource-allocation', 'Resource Allocation', Gauge], ['/app/experiments', 'Experiment Registry', Beaker], ['/app/export', 'Research Export', Upload], ['/app/methods', 'Models & Methods', BookOpen], ['/app/about', 'About the Research', Info],
] as const

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return <aside className="sidebar"><div className="sidebar-brand"><span className="brand-mark">C</span><div><strong>CropSmart™</strong><small>Research digital twin</small></div></div><div className="sidebar-label">Research environment</div><nav className="sidebar-nav">{nav.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/app'} onClick={onNavigate} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}><Icon size={16} /><span>{label}</span></NavLink>)}</nav><div className="sidebar-footer"><div className="avatar">U</div><div><strong>Research user</strong><small>Synthetic workspace</small></div></div></aside>
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  return <ResearchContextProvider><div className="app-shell"><div className="mobile-header"><button className="icon-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={19} /></button><strong>CropSmart™</strong></div><div className={`mobile-drawer ${mobileOpen ? 'mobile-drawer-open' : ''}`}><div className="mobile-drawer-top"><strong>Navigation</strong><button className="icon-button" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button></div><Sidebar onNavigate={() => setMobileOpen(false)} /></div><div className="desktop-sidebar"><Sidebar /></div><main className="app-main"><ResearchContextBar /><Outlet /></main></div></ResearchContextProvider>
}
