import { Link, Outlet, useLocation } from 'react-router-dom'
import { useResearchContext } from '../lib/research-context'
import { ResearchStatus } from './ResearchStatus'
export function PlaceContextBoundary(){
 const { profile, zoneId, scenario }=useResearchContext();const {pathname}=useLocation()
 const configure=['/app/location','/app/place','/app/people','/app/methods','/app/models-methods','/app/help'].includes(pathname)
 if(profile.kind==='demonstrator'||configure)return <Outlet key={profile.id}/>
 const evidence=[['Weather',profile.weather],['Soil',profile.soil],['Crop',profile.crop],['Water / irrigation',profile.irrigation],['PV / storage',profile.pv]]
 return <div className="workspace"><header className="console-heading"><div><div className="eyebrow">ACTIVE PLACE · {profile.country} · {profile.region}</div><h1>{profile.name}</h1><p>{profile.systemType} · {zoneId} · {profile.experiment||'Experiment not specified'} · {scenario}</p></div></header><div className="place-boundary"><ResearchStatus state="context" label="Location configured"/><ResearchStatus state="missing" label="Model validation not established"/><p>This site is ready for configuration. Analytical execution is not yet connected to this profile. Demonstrator parameters and results are not used for your location.</p></div><section className="panel"><div className="panel-body"><h2>Local evidence readiness</h2>{evidence.map(([name,ref])=><div className="list-row" key={name}><strong>{name}</strong><span>{ref||'No reference supplied'}</span><ResearchStatus state={ref?'partial':'missing'} label={ref?'Reference only':'Missing'}/></div>)}<p>Next: ingest site observations, connect local parameter sets, then calibrate and independently validate each model. Supplying a study reference alone does not mark a model validated.</p><Link className="button button-primary" to="/app/location">Configure location & system</Link></div></section></div>
}
