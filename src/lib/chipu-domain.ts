import type { ChipuModuleId } from './chipu-modules'

export type ChipuEvidenceKind = 'MEASURED' | 'MANUAL' | 'MODELED' | 'PREDICTED' | 'SYNTHETIC' | 'DERIVED'

export interface ChipuEvidenceMetadata {
  source?: string
  model?: string
  modelVersion?: string
  timestamp?: string
  evidenceKind?: ChipuEvidenceKind
  confidence?: number
  uncertaintyLower?: number
  uncertaintyUpper?: number
  notes?: string
}

export interface ChipuStakeholder {
  id: string
  farmId?: string
  zoneId?: string
  role: string
  decisionAuthority?: string
  priorities?: string[]
  constraints?: string[]
  perceivedBenefits?: string[]
  perceivedRisks?: string[]
  adoptionReadiness?: string
  trustNotes?: string
  decisionNotes?: string
  evidence?: ChipuEvidenceMetadata
}

export interface ChipuPlaceContext {
  id: string
  farmId?: string
  name: string
  latitude?: number
  longitude?: number
  administrativeArea?: string
  landAreaHa?: number
  landUse?: string
  soil?: string
  elevationM?: number
  waterAvailability?: string
  gridAccess?: string
  energyInfrastructure?: string[]
  waterInfrastructure?: string[]
  croppingSystem?: string[]
  regulatoryConstraints?: string[]
  hazards?: string[]
  evidence?: ChipuEvidenceMetadata
}

export interface ChipuControlDecision {
  id: string
  farmId?: string
  zoneId?: string
  module: ChipuModuleId | 'integrated'
  actionType: string
  targetId?: string
  recommendedValue?: number | string | boolean
  unit?: string
  reason?: string
  confidence?: number
  sourceModel?: string
  status: 'recommended' | 'approved' | 'executed' | 'rejected' | 'expired'
  createdAt: string
  validUntil?: string
  evidence?: ChipuEvidenceMetadata
}

export interface ChipuResilienceScenario {
  id: string
  farmId?: string
  zoneId?: string
  name: string
  stressors: string[]
  assumptions: Record<string, string | number | boolean | null>
  status: 'configured' | 'running' | 'completed' | 'not_configured'
  evidence?: ChipuEvidenceMetadata
}

export interface ChipuResilienceResult {
  scenarioId: string
  vulnerabilityScore?: number
  resilienceScore?: number
  recoveryTimeHours?: number
  unmetEnergyDemandKwh?: number
  unmetWaterDemandM3?: number
  foodProductionImpact?: number
  economicLoss?: number
  criticalAssets?: string[]
  recommendedAdaptations?: string[]
  evidence?: ChipuEvidenceMetadata
}
