import { Link, Outlet, useLocation } from 'react-router-dom'
import { ResearchContextProvider, useResearchContext } from '../lib/research-context'

export function PlaceContextBoundary() {
  const { profile } = useResearchContext()
  const { pathname } = useLocation()
  const shared = ['/app/model-laboratory', '/app/location', '/app/place', '/app/people', '/app/methods', '/app/models-methods', '/app/help'].includes(pathname)
  if (profile.kind === 'demonstrator' || shared || (pathname === '/app/economics' && profile.kind === 'configured')) {
    return <Outlet key={profile.id}/>
  }
  return <>
    <section className="command-note" aria-label="Displayed dataset">
      <div><strong>Simulation example</strong><p>{profile.kind === 'configured' ? `${profile.name} is selected. The workspace below uses example data; connect your dataset for site-specific analysis.` : 'Explore the research tools using a synthetic example dataset, or choose a location and add your own data.'}</p></div>
      <Link className="button" to="/app/location">Choose location &amp; system</Link>
    </section>
    <ResearchContextProvider key={`demonstration-${profile.id}`} demonstrationMode><Outlet/></ResearchContextProvider>
  </>
}
