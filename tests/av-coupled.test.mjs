import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_SETTINGS, createIllustrativeParameters } from '../src/lib/avModelLaboratory.ts'
import { DEFAULT_COUPLED, DEFAULT_RESPONSE, syntheticYear, validateDailyData, simulateCoupled } from '../src/lib/avCoupledEngine.ts'
const p=createIllustrativeParameters().SS01,s={...DEFAULT_SETTINGS},c={...DEFAULT_COUPLED},response={...DEFAULT_RESPONSE}
const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<tol,`${a} vs ${b}`)
const run=(data=syntheticYear(),pp=p,ss=s,cc=c,rr=response)=>simulateCoupled('SS01',pp,ss,cc,rr,data)
test('full-year daily data validation rejects gaps, duplicates, invalid dates and missing fields',()=>{
 assert.equal(validateDailyData(syntheticYear()).length,365)
 for(const mutate of [d=>d.pop(),d=>d[3].date=d[2].date,d=>d[0].date='2025-02-30',d=>delete d[0].rhPct,d=>d[0].gridAvailable='yes',d=>d[0].poaKwhM2=NaN]){const d=syntheticYear();mutate(d);assert.throws(()=>validateDailyData(d))}
 const leap=Array.from({length:366},(_,i)=>({...syntheticYear()[0],date:new Date(Date.UTC(2024,0,i+1)).toISOString().slice(0,10),kc:1}));assert.equal(validateDailyData(leap).length,366)
})
test('daily balances conserve water and electricity under outage and water stress',()=>{
 const r=run();for(const x of [r.av,r.baseline]){near(x.waterBalanceResidualMm,0);for(const d of x.trace){near(d.pvKwh+d.gridImportKwh+d.unservedKwh,d.pumpKwh+d.loadKwh+d.exportKwh+d.curtailedKwh);assert.ok(d.soilWaterMm>=-1e-8);assert.ok(d.soilWaterMm<=54+1e-8)}}
 near(r.av.pv,180*1500*.8);assert.ok(r.av.stressDays>0);assert.ok(r.av.deficitDays>0)
})
test('neutral response with unrestricted grid/water reproduces open-sun crop and water',()=>{
 const r=run(syntheticYear().map(d=>({...d,gridAvailable:true,waterLimitMm:1000})));near(r.av.yieldKgHa,r.baseline.yieldKgHa);near(r.av.irrigation,r.baseline.irrigation);near(r.av.meanTheta,r.baseline.meanTheta);near(r.av.meanVpd,r.baseline.meanVpd)
})
test('no grid and no PV cannot pump or serve critical loads',()=>{
 const d=syntheticYear().map(x=>({...x,gridAvailable:false,rainMm:0}));const r=run(d,{...p,performanceRatio:0});near(r.av.irrigation,0);near(r.av.pump,0);near(r.av.imports,0);near(r.av.exports,0);near(r.av.unserved,365*20);assert.ok(r.av.yieldKgHa<c.potentialYieldKgHa)
})
test('zero export limit curtails surplus without fictitious revenue',()=>{
 const r=run(syntheticYear(),p,s,c,{...response,exportLimitKwhDay:0});near(r.av.exports,0);near(r.exportRevenue,0);assert.ok(r.av.curtailed>0)
})
test('coupled economics use actual grid savings and exports, not gross PV sales',()=>{
 const r=run();near(r.cashFlow,r.gridSavings+r.exportRevenue+r.cropMargin+r.waterSavings-r.operatingCost)
 near(r.gridSavings,(r.baseline.imports-r.av.imports)*s.electricityValuePerKwh)
 near(r.avoidedOperationalKgCo2,(r.baseline.imports-r.av.imports)*c.gridKgCo2Kwh)
 const zero=run(syntheticYear(),p,{...s,discountRate:0});near(zero.npv,-zero.capitalCost+zero.cashFlow*s.lifetimeYears)
 near(zero.cashFlowByYear.at(-1).discounted,zero.npv)
})
test('explicit microclimate offsets affect diagnostics; independent light factor affects yield',()=>{
 const d=syntheticYear().map(x=>({...x,gridAvailable:true,waterLimitMm:1000}));const a=run(d),b=run(d,p,s,c,{...response,parTransmission:.5,lightYieldFactor:.7,airDeltaC:-2,soilDeltaC:-3});near(b.av.meanDli,a.av.meanDli*.5);near(b.av.yieldKgHa,a.av.yieldKgHa*.7);near(b.av.meanAirC,a.av.meanAirC-2);near(b.av.meanSoilC,a.av.meanSoilC-3)
})
test('equal-capacity land normalization and model response propagation',()=>{
 const r=run(syntheticYear(),p,{...s,mode:'equal-capacity',capacityKw:100});near(r.areaHa,100/p.pvKwPerHa);near(r.av.pv,120000)
 const d=syntheticYear().map(x=>({...x,gridAvailable:true,waterLimitMm:1000,rainMm:0}));const a=run(d),b=run(d,p,s,c,{...response,etMultiplier:.7});assert.ok(b.av.irrigation<a.av.irrigation)
})
test('invalid physical parameters are rejected before simulation',()=>{
 assert.throws(()=>run(syntheticYear(),p,s,{...c,fieldCapacity:.1,wiltingPoint:.2}));assert.throws(()=>run(syntheticYear(),p,s,c,{...response,parTransmission:2}));assert.throws(()=>run(syntheticYear(),p,s,{...c,rootDepthM:NaN}))
})
