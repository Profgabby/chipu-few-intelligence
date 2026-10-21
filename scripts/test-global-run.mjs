import {strict as assert} from 'node:assert'
import {prepareGlobalRun} from '../api/global-run-service.mjs'
const input={site:{latitude:8,longitude:7},dates:{start:'20260101',end:'20260101'},crop:{reference:'SYNTHETIC',version:'0.1',reviewStatus:'SYNTHETIC',profile:{id:'maize',sourceReference:'SYNTHETIC_NOT_CALIBRATED'}},soil:{reference:'SYNTHETIC',method:'EXPLICIT',reviewStatus:'SYNTHETIC',capacityMm:100,initialStorageMm:50},etoByDate:{'2026-01-01':4}}
const retrieve=async()=>({days:[{date:'2026-01-01',precipitationMm:3,irradiationKwhM2:5}],provenance:{provider:'MOCK'}})
const out=await prepareGlobalRun(input,{retrieve})
assert.equal(out.status,'READY_FOR_NATIVE_EXECUTION')
assert.equal(out.evidence.evidenceClass,'SYNTHETIC_EXPLORATORY')
assert.equal(out.forcing[0].etoMm,4)
let rejected=0
for(const bad of [{...input,etoByDate:{}},{...input,soil:{...input.soil,reference:''}},{...input,crop:{...input.crop,version:''}}]){
 try{await prepareGlobalRun(bad,{retrieve})}catch{rejected++}
}
assert.equal(rejected,3)
console.log('Global orchestration acceptance PASS',JSON.stringify({passed:true,cases:6,liveProviderRequests:0,nativeSimulationExecuted:false}))
