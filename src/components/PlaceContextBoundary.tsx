import { Link, Outlet, useLocation } from 'react-router-dom'
import { ResearchContextProvider, useResearchContext } from '../lib/research-context'

export function PlaceContextBoundary() {
  const { profile } = useResearchContext()
  const { pathname } = useLocation()
  const shared = ['/app/location', '/app/place', '/app/people', '/app/methods', '/app/models-methods', '/app/help'].includes(pathname)
  if (profile.kind === 'demonstrator' || shared || (pathname === '/app/economics' && profile.kind === 'configured')) {
    return <Outlet key={profile.id}/>
  }
  return <>
    <section className="command-note" aria-label="Displayed dataset">
      <div><strong>Demonstration dataset</strong><p>{profile.kind === 'configured' ? `${profile.name} has no connected analysis dataset. Displaying the Cedar Creek demonstration, not results for this location.` : 'Exploring the Cedar Creek demonstration dataset.'}</p></div>
      <Link className="button" to="/app/location">Choose location &amp; system</Link>
    </section>
    <ResearchContextProvider key={`demonstration-${profile.id}`} demonstrationMode><Outlet/></ResearchContextProvider>
  </>
}
