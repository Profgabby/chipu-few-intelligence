/** Model Laboratory time-series diagnostics, never a field-validation claim. */
import { AV_MODELS, type ModelId } from './avModelLaboratory'
import { AV_TIMESERIES_SCHEMA, simulateAVTimeSeries, type AVTimeSeriesRequest } from './av-timeseries-engine'
export function seriesMetrics(observed:number[],predicted:number[]) {
  if(!observed.length||observed.length!==predicted.length||![...observed,...predicted].every(Number.isFinite))
    throw Error('Matched finite observation and prediction arrays required')
  const errors=observed.map((v,i)=>predicted[i]-v)
  return {n:errors.length,mae:errors.reduce((s,e)=>s+Math.abs(e),0)/errors.length,
    rmse:Math.sqrt(errors.reduce((s,e)=>s+e*e,0)/errors.length),
    bias:errors.reduce((s,e)=>s+e,0)/errors.length}
}
export function compareDailyModels(requests:AVTimeSeriesRequest[]) {
  if(requests.length<2) throw Error('At least two Model Laboratory designs required')
  const ids=new Set<ModelId>()
  for(const req of requests) {
    if(req.schemaVersion!==AV_TIMESERIES_SCHEMA || !AV_MODELS.some(m=>m.id===req.modelId) || ids.has(req.modelId))
      throw Error('Invalid or duplicate Model Laboratory design')
    ids.add(req.modelId)
  }
  const first=requests[0].forcing.map(x=>x.date).join('|')
  if(requests.some(r=>r.forcing.map(x=>x.date).join('|')!==first))
    throw Error('Paired scenarios must have identical daily date coverage')
  const results=requests.map(simulateAVTimeSeries)
  return {schemaVersion:'chipu.av.daily-comparison.v0.1',results,
    comparisonStatus:'SCENARIO_DIFFERENCES_NOT_CAUSAL_EVIDENCE',
    commonDays:results[0].summary.days,
    modelIds:results.map(r=>r.modelId)}
}
