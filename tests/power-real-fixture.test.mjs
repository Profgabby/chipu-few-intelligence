import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {retrievePower} from '../api/power-service.mjs'
const fixture=JSON.parse(readFileSync(new URL('../research/fixtures/nasa-power-aurora-20240701-07.json',import.meta.url)))
test('recorded NASA POWER AG response converts MJ to kWh',async()=>{
 const result=await retrievePower({latitude:45.28,longitude:-122.75,start:'20240701',end:'20240707'},{fetcher:async()=>({ok:true,json:async()=>fixture.payload}),durable:null})
 assert.equal(result.days.length,7)
 assert.ok(Math.abs(result.days[0].irradiationKwhM2-23.53/3.6)<1e-12)
 assert.equal(result.days[0].precipitationMm,0.15)
 assert.equal(result.provenance.sourceUnits.solar,'MJ/m^2/day')
})
