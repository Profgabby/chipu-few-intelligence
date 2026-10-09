import { simulateAV, type ModelId, type ModelParameters, type ComparisonSettings } from './avModelLaboratory.ts'

export interface DailyForcing {
  date:string; et0Mm:number; rainMm:number; poaKwhM2:number; parMolM2:number;
  airC:number; soilC:number; rhPct:number; kc:number;
  criticalLoadKwhHa:number; waterLimitMm:number; gridAvailable:boolean;
}
export interface CoupledSettings {
  fieldCapacity:number; wiltingPoint:number; rootDepthM:number; depletionFraction:number;
  potentialYieldKgHa:number; yieldResponseKy:number; cropMarginPerKg:number;
  exportPrice:number; waterPriceM3:number; gridKgCo2Kwh:number; referencePvKwhHa:number;
}
export interface CoupledParameters {
  etMultiplier:number; parTransmission:number; lightYieldFactor:number;
  airDeltaC:number; soilDeltaC:number; rhDeltaPct:number; exportLimitKwhDay:number;
}
export const DEFAULT_COUPLED:CoupledSettings={fieldCapacity:0.30,wiltingPoint:0.12,rootDepthM:0.3,depletionFraction:0.5,potentialYieldKgHa:20000,yieldResponseKy:1,cropMarginPerKg:0.15,exportPrice:0.05,waterPriceM3:0,gridKgCo2Kwh:0.4,referencePvKwhHa:1200000}
export const DEFAULT_RESPONSE:CoupledParameters={etMultiplier:1,parTransmission:1,lightYieldFactor:1,airDeltaC:0,soilDeltaC:0,rhDeltaPct:0,exportLimitKwhDay:100000}
const clamp=(x:number,a=0,b=1)=>Math.max(a,Math.min(b,x))
function check(x:number,name:string,min:number,max=1e12){if(typeof x!=='number'||!Number.isFinite(x)||x<min||x>max)throw Error(`Invalid ${name}: expected ${min} to ${max}`)}
export function validateDailyData(raw:unknown):DailyForcing[]{
  if(!Array.isArray(raw)||(raw.length!==365&&raw.length!==366))throw Error('Provide one complete calendar year: 365 or 366 daily rows')
  let previous=0,year=0
  raw.forEach((d,i)=>{
    if(!d||typeof d!=='object')throw Error(`Invalid row ${i+1}`)
    if(typeof d.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d.date))throw Error(`Invalid date at row ${i+1}`)
    const t=Date.parse(d.date+'T00:00:00Z');if(!Number.isFinite(t)||new Date(t).toISOString().slice(0,10)!==d.date)throw Error('Invalid calendar date')
    if(i===0){year=new Date(t).getUTCFullYear();if(!d.date.endsWith('-01-01'))throw Error('The year must start on January 1')}
    else if(t-previous!==86400000)throw Error('Dates must be contiguous and unique')
    if(new Date(t).getUTCFullYear()!==year)throw Error('Rows must cover one calendar year');previous=t
    for(const [key,max] of Object.entries({et0Mm:30,rainMm:1000,poaKwhM2:15,parMolM2:100,rhPct:100,kc:2,criticalLoadKwhHa:1e7,waterLimitMm:1000}))check(d[key],key,0,max)
    check(d.airC,'air temperature',-60,60);check(d.soilC,'soil temperature',-60,70)
    if(typeof d.gridAvailable!=='boolean')throw Error('gridAvailable must be true or false')
  })
  if(!raw[raw.length-1].date.endsWith('-12-31'))throw Error('The year must end on December 31')
  if(!raw.some(d=>d.kc>0&&d.et0Mm>0))throw Error('At least one growing day with positive ET0 and Kc is required')
  if(raw.reduce((sum,d)=>sum+d.poaKwhM2,0)<=0)throw Error('Positive annual irradiation required')
  return raw as DailyForcing[]
}
export function syntheticYear():DailyForcing[]{
  return Array.from({length:365},(_,i)=>{const season=Math.max(0,Math.sin(Math.PI*(i-60)/240));return {
    date:new Date(Date.UTC(2025,0,i+1)).toISOString().slice(0,10),et0Mm:1+4*season,
    rainMm:i%9===0?12:0,poaKwhM2:1.5+4.5*season,parMolM2:10+30*season,
    airC:10+16*season,soilC:12+12*season,rhPct:65-20*season,kc:i>=100&&i<220?1:0,
    criticalLoadKwhHa:20,waterLimitMm:i>=160&&i<180?0:20,gridAvailable:!(i>=170&&i<175),
  }})
}
export function validateCoupled(c:CoupledSettings,p:CoupledParameters){
  check(c.fieldCapacity,'field capacity',0.01,0.8);check(c.wiltingPoint,'wilting point',0,0.79)
  if(c.fieldCapacity<=c.wiltingPoint)throw Error('Field capacity must exceed wilting point')
  check(c.rootDepthM,'root depth',0.01,5);check(c.depletionFraction,'depletion fraction',0.01,0.99)
  check(c.potentialYieldKgHa,'potential yield',0,1e6);check(c.yieldResponseKy,'yield response Ky',0,3)
  check(c.cropMarginPerKg,'net crop margin',0,1000);check(c.exportPrice,'export price',0,100)
  check(c.waterPriceM3,'water price',0,1000);check(c.gridKgCo2Kwh,'grid emissions factor',0,10)
  check(c.referencePvKwhHa,'standalone PV reference',0.01,1e8)
  check(p.etMultiplier,'ET multiplier',0.01,2);check(p.parTransmission,'PAR transmission',0,1)
  check(p.lightYieldFactor,'light yield factor',0,1.5);check(p.airDeltaC,'air temperature offset',-15,15)
  check(p.soilDeltaC,'soil temperature offset',-15,15);check(p.rhDeltaPct,'RH offset',-30,30)
  check(p.exportLimitKwhDay,'daily export limit',0,1e9)
}
/** Daily allocation is an ideal within-day energy balance, NOT hourly dispatch or battery autonomy. */
export function simulateCoupled(id:ModelId,model:ModelParameters,s:ComparisonSettings,c:CoupledSettings,response:CoupledParameters,raw:DailyForcing[]){
  const data=validateDailyData(raw);validateCoupled(c,response)
  const annual=simulateAV(id,model,s),area=annual.areaHa
  const taw=1000*(c.fieldCapacity-c.wiltingPoint)*c.rootDepthM,rawMm=taw*c.depletionFraction
  const specific=1000*9.81*s.pumpHeadM/(3600000*s.pumpEfficiency)
  const solarSum=data.reduce((sum,d)=>sum+d.poaKwhM2,0)
  function run(baseline:boolean){
    let store=taw;let totalRain=0,netWater=0,drain=0,et=0,potentialEt=0,irrigation=0,requested=0,pv=0,pump=0,self=0,imports=0,exports=0,curtailed=0,unserved=0,stressDays=0,deficitDays=0,longestDeficit=0,streak=0,theta=0,dli=0,air=0,soil=0,vpd=0,ksSum=0,growingDays=0
    const trace=[]
    for(const d of data){
      const crop=d.kc>0,eff=baseline?s.baselineIrrigationEfficiency:model.irrigationEfficiency
      const pvet=baseline?1:response.etMultiplier
      const rain=d.rainMm;totalRain+=rain;const excess=Math.max(0,store+rain-taw);drain+=excess;store=Math.min(taw,store+rain)
      const requestedMm=crop&&taw-store>=rawMm?(taw-store)/eff:0
      requested+=requestedMm*10*area
      const pvDay=baseline?0:annual.pvEnergyKwh*d.poaKwhM2/solarSum
      const supplyMm=Math.min(requestedMm,d.waterLimitMm)
      const affordableMm=d.gridAvailable||specific===0?supplyMm:pvDay/(specific*10*area)
      const appliedMm=Math.min(supplyMm,affordableMm);const volume=appliedMm*10*area
      const pumpDay=volume*specific;store+=appliedMm*eff;netWater+=appliedMm*eff;irrigation+=volume
      const deficit=requestedMm-appliedMm>1e-8
      if(deficit){deficitDays++;streak++;longestDeficit=Math.max(longestDeficit,streak)}else streak=0
      const ks=store>=taw-rawMm?1:clamp(store/(taw-rawMm))
      const target=d.et0Mm*d.kc*pvet,actual=Math.min(store,target*ks);store-=actual
      potentialEt+=target;et+=actual
      if(crop){growingDays++;const effectiveKs=target>0?actual/target:1;ksSum+=effectiveKs;if(effectiveKs<1-1e-8)stressDays++}
      const load=d.criticalLoadKwhHa*area,remainingPv=Math.max(0,pvDay-pumpDay)
      const pumpPv=Math.min(pvDay,pumpDay),loadPv=Math.min(remainingPv,load)
      const missing=Math.max(0,pumpDay-pvDay)+load-loadPv
      const importDay=d.gridAvailable?missing:0
      // Export only when the grid is present. Both flows use a daily energy limit.
      const exportDay=d.gridAvailable?Math.min(Math.max(0,remainingPv-loadPv),response.exportLimitKwhDay):0
      const curtailedDay=Math.max(0,pvDay-pumpPv-loadPv-exportDay)
      const unmetDay=d.gridAvailable?0:missing
      pv+=pvDay;pump+=pumpDay;self+=pumpPv+loadPv;imports+=importDay;exports+=exportDay;curtailed+=curtailedDay;unserved+=unmetDay
      const temp=d.airC+(baseline?0:response.airDeltaC),rh=clamp(d.rhPct+(baseline?0:response.rhDeltaPct),0,100)
      const soilTemp=d.soilC+(baseline?0:response.soilDeltaC)
      const vapor=0.6108*Math.exp(17.27*temp/(temp+237.3))*(1-rh/100)
      theta+=c.wiltingPoint+store/(1000*c.rootDepthM);air+=temp;soil+=soilTemp;vpd+=vapor
      if(crop)dli+=d.parMolM2*(baseline?1:response.parTransmission)
      trace.push({date:d.date,soilWaterMm:store,ks,requestedM3:requestedMm*10*area,irrigationM3:volume,etMm:actual,pvKwh:pvDay,pumpKwh:pumpDay,loadKwh:load,gridImportKwh:importDay,exportKwh:exportDay,curtailedKwh:curtailedDay,unservedKwh:unmetDay})
    }
    const stressYield=potentialEt>0?clamp(1-c.yieldResponseKy*(1-et/potentialEt)):0
    const yieldKgHa=c.potentialYieldKgHa*stressYield*(baseline?1:response.lightYieldFactor)
    return {irrigation,requested,pv,pump,self,imports,exports,curtailed,unserved,stressDays,deficitDays,longestDeficit,
      yieldKgHa,meanKs:growingDays?ksSum/growingDays:null,meanDli:growingDays?dli/growingDays:null,meanTheta:theta/data.length,meanAirC:air/data.length,meanSoilC:soil/data.length,meanVpd:vpd/data.length,
      irrigationReliability:requested>0?100*irrigation/requested:null,et,potentialEt,drain,finalWaterMm:store,
      waterBalanceResidualMm:taw+totalRain+netWater-et-drain-store,trace}
  }
  const baseline=run(true),av=run(false)
  const gridSavings=(baseline.imports-av.imports)*s.electricityValuePerKwh
  const exportRevenue=av.exports*c.exportPrice
  const cropMargin=(av.yieldKgHa-baseline.yieldKgHa)*area*c.cropMarginPerKg
  const waterSavings=(baseline.irrigation-av.irrigation)*c.waterPriceM3
  const cashFlow=gridSavings+exportRevenue+cropMargin+waterSavings-annual.annualOperatingCost
  const factor=s.discountRate===0?s.lifetimeYears:(1-(1+s.discountRate)**(-s.lifetimeYears))/s.discountRate
  const cashFlowByYear=Array.from({length:s.lifetimeYears+1},(_,year)=>({year,cumulative:-annual.capitalCost+cashFlow*year,discounted:-annual.capitalCost+cashFlow*(s.discountRate===0?year:(1-(1+s.discountRate)**(-year))/s.discountRate)}))
  const result={modelId:id,areaHa:area,baseline,av,gridSavings,exportRevenue,cropMargin,waterSavings,cashFlow,
    capitalCost:annual.capitalCost,operatingCost:annual.annualOperatingCost,npv:-annual.capitalCost+cashFlow*factor,
    annualizedBenefit:cashFlow-annual.capitalCost/factor,payback:cashFlow>0?annual.capitalCost/cashFlow:null,
    waterSavedPct:baseline.irrigation>0?100*(baseline.irrigation-av.irrigation)/baseline.irrigation:null,
    yieldChangePct:baseline.yieldKgHa>0?100*(av.yieldKgHa-baseline.yieldKgHa)/baseline.yieldKgHa:null,
    waterProductivity:av.irrigation>0?av.yieldKgHa*area/av.irrigation:null,
    avoidedOperationalKgCo2:(baseline.imports-av.imports)*c.gridKgCo2Kwh,
    ler:baseline.yieldKgHa>0?av.yieldKgHa/baseline.yieldKgHa+(av.pv/area)/c.referencePvKwhHa:null,cashFlowByYear}
  function finite(value:unknown):void{if(typeof value==='number'&&!Number.isFinite(value))throw Error('Coupled calculation exceeds numeric range');if(value&&typeof value==='object')Object.values(value).forEach(finite)}
  finite(result)
  return result
}
export type CoupledResult=ReturnType<typeof simulateCoupled>
