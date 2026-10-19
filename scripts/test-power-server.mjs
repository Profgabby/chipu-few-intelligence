import {strict as assert} from 'node:assert'
import {retrievePower,validatePowerRequest} from '../api/power-service.mjs'
let calls=0
const fetcher=async()=>{calls++;return {ok:true,json:async()=>({properties:{parameter:{PRECTOTCORR:{20260101:3},ALLSKY_SFC_SW_DWN:{20260101:5}}}})}}
const query={latitude:8,longitude:7,start:'20260101',end:'20260101'}
const first=await retrievePower(query,{fetcher,now:1000})
const second=await retrievePower(query,{fetcher,now:2000})
assert.equal(first.days[0].precipitationMm,3)
assert.equal(first.days[0].irradiationKwhM2,5)
assert.equal(second.cache,'HIT_EPHEMERAL')
assert.equal(calls,1)
let rejected=0
for(const bad of [{...query,latitude:91},{...query,start:'20261301'},{...query,end:'20280101'}])try{validatePowerRequest(bad)}catch{rejected++}
assert.equal(rejected,3)
console.log('POWER server acceptance PASS',JSON.stringify({passed:true,cases:6,liveRequests:0,cache:'EPHEMERAL'}))
