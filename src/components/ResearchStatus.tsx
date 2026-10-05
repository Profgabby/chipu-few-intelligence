import { CheckCircle2, Info, TriangleAlert, LockKeyhole, CircleDashed, CircleX } from 'lucide-react'

export type ResearchState = 'available' | 'context' | 'partial' | 'protected' | 'missing' | 'failed'
const icons = { available: CheckCircle2, context: Info, partial: TriangleAlert, protected: LockKeyhole, missing: CircleDashed, failed: CircleX }
/** Presentation only: callers supply the evidence state; availability is not validation. */
export function ResearchStatus({ state, label }: { state: ResearchState; label?: string }) {
  const Icon = icons[state]
  return <span className={`research-status research-status-${state}`}><Icon size={14} aria-hidden="true"/><span>{label ?? state}</span></span>
}
