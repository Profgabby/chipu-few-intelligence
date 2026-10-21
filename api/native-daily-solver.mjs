/** Portable server-side implementation of the CHIPU daily bucket / energy baseline.
 * Mirrors the independently tested TypeScript baseline; not a Richards-equation solver.
 */
export function runNativeDaily(prepared,system){
 if(prepared?.status!=='READY_FOR_NATIVE_EXECUTION'||!Array.isArray(prepared.forcing)||!prepared.forcing.length)throw Error('Validated orchestration input required')
 const stages=prepared.crop?.profile?.stages
 if(!Array.isArray(stages)||!stages.length||stages.some(s=>!Number.isInteger(s.days)||s.days<1||![s.kc,s.lai,s.rootDepthCm].every(v=>Number.isFinite(v)&&v>=0)))throw Error('Complete versioned crop stages required')
 const season=stages.reduce((n,s)=>n+s.days,0)
 if(prepared.forcing.length>season)throw Error('Weather series exceeds crop stages')
 const {capacityMm,initialStorageMm}=prepared.soil
 const {irrigationMmPerDay,areaM2,pumpHeadM,pumpEfficiency,pvAreaM2,pvEfficiency,pvPerformanceRatio}=system||{}
 if(![capacityMm,initialStorageMm,irrigationMmPerDay,areaM2,pumpHeadM,pvAreaM2].every(x=>Number.isFinite(x)&&x>=0)||initialStorageMm>capacityMm||capacityMm<=0||![pumpEfficiency,pvEfficiency,pvPerformanceRatio].every(x=>Number.isFinite(x)&&x>0&&x<=1))throw Error('Invalid native model system')
 let storage=initialStorageMm,day=0,stageEnd=0,stageIndex=0
 const points=prepared.forcing.map(d=>{
  day++
  while(day>stageEnd){stageEnd+=stages[stageIndex++].days}
  const stage=stages[stageIndex-1]
  if(![d.precipitationMm,d.irradiationKwhM2,d.etoMm].every(x=>Number.isFinite(x)&&x>=0))throw Error('Invalid forcing')
  const available=storage+d.precipitationMm+irrigationMmPerDay
  const actualEtMm=Math.min(available,d.etoMm*stage.kc)
  const drainageMm=Math.max(0,available-actualEtMm-capacityMm)
  storage=available-actualEtMm-drainageMm
  const waterResidualMm=available-actualEtMm-drainageMm-storage
  if(Math.abs(waterResidualMm)>1e-9)throw Error('Water conservation failed')
  return {date:d.date,stage:stage.name,storageMm:storage,actualEtMm,drainageMm,waterResidualMm,pumpKwh:1000*9.81*(irrigationMmPerDay*areaM2/1000)*pumpHeadM/pumpEfficiency/3600000,pvKwh:d.irradiationKwhM2*pvAreaM2*pvEfficiency*pvPerformanceRatio}
 })
 return {status:'SIMULATED',solver:'chipu-daily-water-energy',evidence:prepared.evidence,provenance:prepared.provenance,points,limitations:['Lumped water bucket; no Richards equation','No field-calibrated yield or soil hydraulic prediction','Results inherit the supplied crop and soil evidence status']}
}
