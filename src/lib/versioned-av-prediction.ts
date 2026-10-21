/** Versioned Model Laboratory request/response. Research screening, not trained inference. */
import { AV_MODELS, simulateAV, type ModelId, type ModelParameters, type ComparisonSettings } from './avModelLaboratory'
import { pumpEnergyKwh } from './predata-scientific-baselines'

export const AV_PREDICTION_SCHEMA = 'chipu.av.prediction.v0.1' as const
export type PredictionRequest = {
  schemaVersion: typeof AV_PREDICTION_SCHEMA
  modelId: ModelId
  parameters: ModelParameters
  settings: ComparisonSettings
  sourceType: 'ILLUSTRATIVE' | 'USER_SUPPLIED'
}
export function predictAV(request: PredictionRequest) {
  if (request.schemaVersion !== AV_PREDICTION_SCHEMA) throw Error('Unsupported prediction schema')
  const model = AV_MODELS.find(m => m.id === request.modelId)
  if (!model) throw Error('Model is not registered in the live Model Laboratory')
  if (!['ILLUSTRATIVE','USER_SUPPLIED'].includes(request.sourceType)) throw Error('Invalid source type')
  const result = simulateAV(request.modelId, request.parameters, request.settings)
  const physicalPumpKwh = pumpEnergyKwh(result.irrigationM3, request.settings.pumpHeadM, request.settings.pumpEfficiency)
  const residual = result.pumpEnergyKwh - physicalPumpKwh
  if (Math.abs(residual) > 1e-7 * Math.max(1,physicalPumpKwh)) throw Error('Pump-energy conservation cross-check failed')
  return {
    schemaVersion: AV_PREDICTION_SCHEMA,
    modelId: model.id, modelName: model.name, family: model.family,
    modelVersion: 'AV-SCREENING-0.1.0',
    physicsVersion: 'PRE-DATA-0.1.0',
    evidenceStatus: request.sourceType,
    validationStatus: 'NOT_FIELD_VALIDATED' as const,
    predictionType: 'ANNUAL_SCENARIO_SCREENING' as const,
    input: request, result,
    checks: {pumpEnergyResidualKwh:residual, pumpEnergyConsistent:true},
    limitations: ['No field-calibrated predictive uncertainty','No weather time-series or HYDRUS coupling',
      'Model names and illustrations do not determine shading or crop responses'],
  }
}
