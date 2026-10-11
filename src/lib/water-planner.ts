export type WaterInputs = { area:number; rootDepth:number; theta:number; fieldCapacity:number; wiltingPoint:number; depletion:number; efficiency:number; baselineEfficiency:number; etFactor:number; runoffFraction:number; tankCapacity:number; tankInitial:number; refill:number; dailyLimit:number; flow:number; pumpKw:number }
export type WaterDay = {date:string; rain:number; et0:number; kc:number}
export const defaultWaterInputs:WaterInputs={area:48,rootDepth:0.3,theta:0.22,fieldCapacity:0.3,wiltingPoint:0.12,depletion:0.45,efficiency:0.9,baselineEfficiency:0.75,etFactor:1,runoffFraction:0.1,tankCapacity:2,tankInitial:1.5,refill:0.25,dailyLimit:1,flow:10,pumpKw:0.15}
export function exampleWaterDays():WaterDay[]{const now=new Date();return Array.from({length:7},(_,i)=>({date:new Date(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()+i)).toISOString().slice(0,10),rain:i===3?8:0,et0:4,kc:1}))}
export function validateWaterInputs(p:WaterInputs,days:WaterDay[]){
 for(const [key,value] of Object.entries(p))if(typeof value!=='number'||!Number.isFinite(value)||value<0)throw new Error(`${key}: enter a finite, non-negative number.`)
 for(const key of Object.keys(defaultWaterInputs) as (keyof WaterInputs)[])if(!Number.isFinite(p[key]))throw new Error(`Required input: ${key}`)
 if(p.area<=0||p.rootDepth<=0||p.flow<=0||p.tankCapacity<=0)throw new Error('Area, root depth, flow and tank capacity must be greater than zero.')
 if(!(p.wiltingPoint<p.fieldCapacity&&p.fieldCapacity<=0.6&&p.theta<=0.6))throw new Error('Use wilting point < field capacity ≤ 0.6; moisture must be ≤ 0.6 m³/m³.')
 if(p.efficiency<=0||p.efficiency>1||p.baselineEfficiency<=0||p.baselineEfficiency>1||p.depletion<=0||p.depletion>=1||p.runoffFraction>1||p.etFactor>2)throw new Error('Efficiencies: (0,1]; depletion: (0,1); runoff: [0,1]; ET factor: [0,2].')
 if(p.tankInitial>p.tankCapacity)throw new Error('Initial tank water cannot exceed tank capacity.')
 if(!Array.isArray(days)||days.length!==7)throw new Error('Provide exactly seven consecutive daily records.')
 days.forEach((d,i)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||!Number.isFinite(Date.parse(d.date))||new Date(d.date).toISOString().slice(0,10)!==d.date||i>0&&Date.parse(d.date)-Date.parse(days[i-1].date)!==86400000)throw new Error('Dates must be valid, consecutive calendar days.');for(const k of ['rain','et0','kc'] as const)if(typeof d[k]!=='number'||!Number.isFinite(d[k])||d[k]<0)throw new Error(`${d.date}: ${k} must be non-negative.`)})
}
export function planWater(p:WaterInputs,days:WaterDay[],baseline=false){
 validateWaterInputs(p,days)
 const z=p.rootDepth*1000,fc=p.fieldCapacity*z,wp=p.wiltingPoint*z,trigger=fc-p.depletion*(fc-wp),eff=baseline?p.baselineEfficiency:p.efficiency
 let soil=p.theta*z,tank=p.tankInitial
 const rows=days.map(d=>{
  const start=soil,tankStart=tank,refill=Math.min(p.refill,p.tankCapacity-tank);tank+=refill
  const runoff=d.rain*p.runoffFraction;soil+=d.rain-runoff
  const drainage=Math.max(0,soil-fc);soil-=drainage
  const demand=d.et0*d.kc*(baseline?1:p.etFactor)
  const netNeed=soil-demand<=trigger?Math.max(0,fc-soil):0
  const requested=netNeed*p.area/1000/eff
  const delivered=Math.min(requested,tank,p.dailyLimit,p.flow*60*24/1000)
  const net=delivered*1000/p.area*eff,applicationLoss=delivered*(1-eff)
  tank-=delivered;soil+=net
  const ks=Math.min(1,Math.max(0,(soil-wp)/(trigger-wp)))
  const actualET=Math.min(Math.max(0,soil-wp),demand*ks);soil-=actualET
  const hours=delivered*1000/p.flow/60
  return {...d,start,end:soil,theta:soil/z,available:Math.max(0,soil-wp),runoff,drainage,demand,actualET,unmetET:demand-actualET,requested,delivered,net,applicationLoss,shortfall:requested-delivered,tankStart,refill,tankEnd:tank,hours,energy:hours*p.pumpKw,balanceError:start+d.rain+net-runoff-drainage-actualET-soil}
 })
 const sum=(key:keyof typeof rows[number])=>rows.reduce((a,r)=>a+Number(r[key]),0)
 return {rows,trigger,fc,wp,initialStorage:p.theta*p.rootDepth*p.area,initialAvailable:Math.max(0,p.theta-p.wiltingPoint)*p.rootDepth*p.area,totals:{delivered:sum('delivered'),requested:sum('requested'),applicationLoss:sum('applicationLoss'),runoff:sum('runoff')*p.area/1000,drainage:sum('drainage')*p.area/1000,et:sum('actualET')*p.area/1000,unmetET:sum('unmetET'),shortfall:sum('shortfall'),energy:sum('energy'),hours:sum('hours'),rain:sum('rain')*p.area/1000},next:rows.find(r=>r.requested>1e-9)}
}
