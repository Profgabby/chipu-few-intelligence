import {strict as assert} from 'node:assert'
import {prepareGlobalRun} from '../api/global-run-service.mjs'
import {runNativeDaily} from '../api/native-daily-solver.mjs'
const crop={id:'maize',sourceReference:'SYNTHETIC_NOT_CALIBRATED',stages:[{name:'initial',days:2,kc:0.5,lai:0.2,rootDepthCm:15}]}
const input={site:{latitude:8,longitude:7},dates:{start:'20260101',end:'20260102'},crop:{reference:'SYNTHETIC',version:'0.1',reviewStatus:'SYNTHETIC',profile:crop},soil:{reference:'SYNTHETIC',method:'EXPLICIT',reviewStatus:'SYNTHETIC',capacityMm:100,initialStorageMm:50},etoByDate:{'2026-01-01':4,'2026-01-02':4}}
const retrieve=async()=>({days:[{date:'2026-01-01',precipitationMm:3,irradiationKwhM2:5},{date:'2026-01-02',precipitationMm:0,irradiationKwhM2:6}],provenance:{provider:'MOCK'}})
const prepared=await prepareGlobalRun(input,{retrieve})
const system={irrigationMmPerDay:2,areaM2:1000,pumpHeadM:20,pumpEfficiency:0.65,pvAreaM2:100,pvEfficiency:0.2,pvPerformanceRatio:0.8}
const result=runNativeDaily(prepared,system)
assert.equal(result.status,'SIMULATED')
assert.equal(result.points.length,2)
assert.equal(result.points[0].storageMm,53)
assert.equal(result.evidence.evidenceClass,'SYNTHETIC_EXPLORATORY')
assert(result.points.every(p=>Math.abs(p.waterResidualMm)<1e-9))
let rejected=0
for(const bad of [{...system,pumpEfficiency:0},{...system,pvAreaM2:-1}])try{runNativeDaily(prepared,bad)}catch{rejected++}
assert.equal(rejected,2)
console.log('Native server simulation acceptance PASS',JSON.stringify({passed:true,cases:6,days:2,evidence:'SYNTHETIC_EXPLORATORY'}))
