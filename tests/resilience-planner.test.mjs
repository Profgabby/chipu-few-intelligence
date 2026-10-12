import test from 'node:test'
import assert from 'node:assert/strict'
import {assessEvent,exploreResilience,resilienceDefaults as p,defaultBounds} from '../src/lib/resilience-planner.ts'
test('energy loss prevents pumping even with water stored',()=>{const r=assessEvent({...p,solarDaily:0,batteryUsable:0});assert.equal(r.metrics[0],0);assert.equal(r.metrics[2],0);assert.ok(r.rows.every(d=>d.delivered===0))})
test('daily water and energy balances close',()=>{const r=assessEvent(p);let w=p.waterStored,b=p.batteryUsable;for(const d of r.rows){assert.ok(Math.abs(w+p.waterSupply-d.delivered-d.water)<1e-9);assert.ok(Math.abs(b+p.solarDaily-d.critical-d.other-d.pump-d.battery-d.unused)<1e-9);w=d.water;b=d.battery}})
test('zero demand is not falsely scored as resilient',()=>{const r=assessEvent({...p,waterDemand:0,criticalDaily:0,otherDaily:0});assert.equal(r.metrics[0],null);assert.equal(r.metrics[1],null);assert.equal(r.metrics[2],null);assert.equal(r.metrics[3],null)})
test('seeded uncertainty reproducible and quantiles ordered',()=>{const a=exploreResilience(p,defaultBounds(p));assert.deepEqual(a,exploreResilience(p,defaultBounds(p)));for(const u of a.uncertainty)if(u.p10!==null)assert.ok(u.p10<=u.p50&&u.p50<=u.p90)})
test('degenerate ranges yield zero sensitivity',()=>{const b=defaultBounds(p);for(const k in b)b[k]={low:p[k],high:p[k]};const r=exploreResilience(p,b);assert.ok(r.sensitivity.every(s=>s.swing===0))})
test('invalid duration and ranges rejected',()=>{assert.throws(()=>assessEvent({...p,days:0}));const b=defaultBounds(p);b.solarDaily.low=100;assert.throws(()=>exploreResilience(p,b))})
