import { useState } from 'react'
import type { ModelId, ModelParameters, ComparisonSettings } from '../lib/avModelLaboratory'
import { AV_TIMESERIES_SCHEMA, simulateAVTimeSeries, type DailyForcing, type AVTimeSeriesRequest } from '../lib/av-timeseries-engine'
import { compareDailyModels } from '../lib/av-timeseries-statistics'

export function AVDailySimulation({selected,parameters,settings}:{selected:ModelId[];parameters:Record<ModelId,ModelParameters>;settings:ComparisonSettings}) {
  const [weather,setWeather]=useState('')
  const [error,setError]=useState('')
  const [results,setResults]=useState<ReturnType<typeof simulateAVTimeSeries>[]|null>(null)
  function run() {
    try {
      const forcing=JSON.parse(weather) as DailyForcing[]
      if(!Array.isArray(forcing)) throw Error('Expected JSON array of daily weather records')
      if(!selected.length) throw Error('Select at least one model')
      const requests:AVTimeSeriesRequest[]=selected.map(modelId=>{
        const p=parameters[modelId]
        const areaHa=settings.mode==='equal-land'?settings.areaHa:settings.capacityKw/p.pvKwPerHa
        return {schemaVersion:AV_TIMESERIES_SCHEMA,modelId,sourceType:'USER_SUPPLIED',
          parameters:p,settings,soil:{initialStorageMm:60,capacityMm:120},forcing,
          pvAreaM2:areaHa*p.pvKwPerHa/0.2,pvModuleEfficiency:0.2,
          irrigatedAreaM2:areaHa*10000,irrigationTargetStorageMm:75}
      })
      setResults(requests.length===1?[simulateAVTimeSeries(requests[0])]:compareDailyModels(requests).results)
      setError('')
    } catch(e) {setResults(null);setError(e instanceof Error?e.message:'Simulation failed')}
  }
  return <section aria-label="Daily time-series research simulation">
    <h2>5. Daily water–energy research simulation</h2>
    <p>Research-only daily bucket simulation. Enter consecutive daily forcing as JSON. Fixed demonstration soil settings: initial 60 mm, capacity 120 mm, target 75 mm; PV module efficiency 0.20. Replace these with site-calibrated inputs before scientific interpretation.</p>
    <label>Daily forcing JSON (date, precipitationMm, etoMm, irradiationKwhM2, cropCoefficient, transmittedFraction)
      <textarea rows={6} value={weather} onChange={e=>{setWeather(e.target.value);setResults(null)}} placeholder='[{"date":"2026-07-01","precipitationMm":0,"etoMm":4,"irradiationKwhM2":5,"cropCoefficient":0.85,"transmittedFraction":0.7}]'/>
    </label>
    <button type="button" onClick={run} disabled={!selected.length}>Run daily simulation</button>
    {error?<p role="alert">{error}</p>:null}
    {results?<div role="status"><p>{results.length} model(s) simulated. Not field validated.</p>
      <table><thead><tr><th>Model</th><th>Days</th><th>Irrigation mm</th><th>Pump kWh</th><th>PV kWh</th><th>Max water residual mm</th></tr></thead>
      <tbody>{results.map(r=><tr key={r.modelId}><td>{r.modelId}</td><td>{r.summary.days}</td><td>{r.summary.totalIrrigationMm.toFixed(3)}</td><td>{r.summary.totalPumpKwh.toFixed(3)}</td><td>{r.summary.totalPvKwh.toFixed(3)}</td><td>{r.summary.maxAbsWaterResidualMm.toExponential(2)}</td></tr>)}</tbody></table>
    </div>:null}
  </section>
}
