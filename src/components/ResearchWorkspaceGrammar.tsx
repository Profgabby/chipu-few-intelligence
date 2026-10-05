import type { ReactNode } from 'react'

export type ResearchStage =
  | 'Context'
  | 'Evidence / Observations'
  | 'Inputs'
  | 'Method / Model'
  | 'State / Indicators'
  | 'FEW Dependencies'
  | 'Outputs'
  | 'Uncertainty'
  | 'Provenance'

const stages: ResearchStage[] = [
  'Context','Evidence / Observations','Inputs','Method / Model','State / Indicators',
  'FEW Dependencies','Outputs','Uncertainty','Provenance',
]

export function ResearchWorkspaceGrammar({
  active,
  note = 'Panels are shown only when supported by the current research implementation.',
}: {
  active: ResearchStage[]
  note?: ReactNode
}) {
  const enabled = new Set(active)
  return <section className="research-grammar" aria-label="Research workspace structure">
    <div className="research-grammar-track">
      {stages.map((stage, index) => <div
        key={stage}
        className={`research-grammar-step ${enabled.has(stage) ? 'research-grammar-step-active' : 'research-grammar-step-inactive'}`}
      >
        <span>{String(index + 1).padStart(2, '0')}</span>
        <strong>{stage}</strong>
      </div>)}
    </div>
    <p>{note}</p>
  </section>
}
