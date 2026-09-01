import type { Provenance, Quality } from '../lib/cropsmart-model'

export function ScientificValue({ code, label, value, unit, provenance = 'SYNTHETIC', quality = 'PASS', uncertainty = '± 6.8%', run = 'STATE-0047' }: { code: string; label: string; value: string | number; unit: string; provenance?: Provenance; quality?: Quality; uncertainty?: string; run?: string }) {
  return <article className="metric-card"><div className="metric-top"><span className="eyebrow">{code}</span><span className={`quality quality-${quality.toLowerCase()}`}>{quality}</span></div><div className="metric-label">{label}</div><div className="metric-value">{value}<small>{unit}</small></div><div className="metric-meta"><b>{provenance}</b><span>unc. {uncertainty}</span><span>{run}</span></div></article>
}
