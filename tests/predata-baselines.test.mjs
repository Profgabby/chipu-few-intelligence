import test from 'node:test'
import assert from 'node:assert/strict'
import {pumpEnergyKwh, measuredPumpEnergyKwh, waterBucketStep} from '../src/lib/predata-scientific-baselines.ts'
import {runNativeDaily} from '../api/native-daily-solver.mjs'
test('10 cubic metres lifted 20 metres at 50% efficiency requires 1.09 kWh', () => {
  assert.equal(pumpEnergyKwh(10,20,0.5),1.09)
  assert.equal(measuredPumpEnergyKwh(2,0.545),1.09)
  assert.equal(pumpEnergyKwh(0,20,0.5),0)
  for (const efficiency of [0,-1,1.1,NaN,Infinity]) assert.throws(()=>pumpEnergyKwh(10,20,efficiency))
})
test('server water and pumping results agree with independently exposed baseline', () => {
  const prepared={status:'READY_FOR_NATIVE_EXECUTION',crop:{profile:{stages:[{name:'initial',days:2,kc:1,lai:1,rootDepthCm:30}]}},soil:{capacityMm:60,initialStorageMm:50},forcing:[{date:'2026-01-01',precipitationMm:10,irradiationKwhM2:5,etoMm:5},{date:'2026-01-02',precipitationMm:0,irradiationKwhM2:0,etoMm:100}]}
  const result=runNativeDaily(prepared,{irrigationMmPerDay:20,areaM2:500,pumpHeadM:20,pumpEfficiency:0.5,pvAreaM2:10,pvEfficiency:0.2,pvPerformanceRatio:0.8})
  let storage=50
  for (const [i,p] of result.points.entries()) {
    const reference=waterBucketStep({storageMm:storage,precipitationMm:prepared.forcing[i].precipitationMm,irrigationMm:20,etDemandMm:prepared.forcing[i].etoMm,capacityMm:60})
    assert.equal(p.storageMm,reference.nextStorageMm)
    assert.equal(p.drainageMm,reference.drainageMm)
    assert.equal(p.actualEtMm,reference.actualEtMm)
    assert.equal(p.pumpKwh,1.09)
    assert.equal(p.waterResidualMm,0)
    storage=p.storageMm
  }
  assert.equal(result.points[0].pvKwh,8)
  assert.equal(result.points[1].pvKwh,0)
})
