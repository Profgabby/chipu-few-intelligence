import test from 'node:test'
import assert from 'node:assert/strict'
import { waterEnergyDemo } from '../src/lib/water-energy-demo.ts'
test('PV is zero at night and responds to daylight and cloud assumptions',()=>{const r=waterEnergyDemo();assert.equal(r.length,168);for(const p of r){if(p.hour%24<=6||p.hour%24>=18)assert.equal(p.pvKw,0);assert.ok(p.pvKw>=0&&p.pvKw<=5)}assert.ok(r[12].pvKw>r[84].pvKw)})
test('water volume and pump energy obey the stated hydraulic balance',()=>{const r=waterEnergyDemo();assert.equal(r.reduce((s,p)=>s+p.flowM3H,0),42);for(const p of r){assert.ok(Math.abs(p.pumpKw-(1000*9.81*p.flowM3H/3600*25/.6/1000))<1e-12);if(p.irrigation===0)assert.equal(p.pumpKw,0)}})
