import test from 'node:test'
import assert from 'node:assert/strict'
import {planWater,defaultWaterInputs,validateWaterInputs} from '../src/lib/water-planner.ts'
const days=Array.from({length:7},(_,i)=>({date:`2026-10-${String(i+11).padStart(2,'0')}`,rain:i===3?80:0,et0:4,kc:1}))
test('daily soil and tank balances close',()=>{const p=defaultWaterInputs,r=planWater(p,days);for(const d of r.rows){assert.ok(Math.abs(d.balanceError)<1e-9);assert.ok(Math.abs(d.tankStart+d.refill-d.delivered-d.tankEnd)<1e-9);assert.ok(d.tankEnd>=0&&d.tankEnd<=p.tankCapacity);assert.ok(d.end<=r.fc+1e-9)}assert.ok(r.totals.drainage>0)})
test('identical assumptions give identical paired results',()=>{const p={...defaultWaterInputs,baselineEfficiency:defaultWaterInputs.efficiency,etFactor:1};assert.deepEqual(planWater(p,days),planWater(p,days,true))})
test('zero supply delivers no water and exposes shortage',()=>{const r=planWater({...defaultWaterInputs,tankInitial:0,refill:0,theta:.13},days.map(d=>({...d,rain:0})));assert.equal(r.totals.delivered,0);assert.ok(r.totals.shortfall>0);assert.ok(r.totals.unmetET>0)})
test('wet zero-demand outlook needs no irrigation',()=>{const r=planWater({...defaultWaterInputs,theta:.3},days.map(d=>({...d,rain:0,et0:0})));assert.equal(r.next,undefined);assert.equal(r.totals.delivered,0)})
test('pump capacity caps delivery and runtime at 24 hours',()=>{const r=planWater({...defaultWaterInputs,theta:.13,flow:.01},days);assert.ok(r.rows.every(d=>d.hours<=24+1e-9));assert.ok(r.totals.shortfall>0)})
test('invalid parameters and dates rejected',()=>{for(const p of [{...defaultWaterInputs,efficiency:0},{...defaultWaterInputs,fieldCapacity:.1},{...defaultWaterInputs,theta:NaN}])assert.throws(()=>validateWaterInputs(p,days));assert.throws(()=>validateWaterInputs(defaultWaterInputs,days.map(d=>({...d,date:days[0].date}))))})
