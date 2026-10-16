import {simulateGlobalNative,GLOBAL_MODEL_SCHEMA,SYNTHETIC_CROPS,type GlobalModelRequest} from './global-native-model'
export function runGlobalNativeAcceptance(){
 let cases=0
 for(const crop of SYNTHETIC_CROPS){
  const req:GlobalModelRequest={schemaVersion:GLOBAL_MODEL_SCHEMA,crop,site:{id:'global-test',latitude:8.5,longitude:7.2,reference:'SYNTHETIC'},soil:{capacityMm:100,initialStorageMm:50,reference:'SYNTHETIC'},forcing:{reference:'SYNTHETIC',days:[{date:'2026-06-01',precipitationMm:2,etoMm:5,irradiationKwhM2:4},{date:'2026-06-02',precipitationMm:0,etoMm:4,irradiationKwhM2:5}]},system:{irrigationMmPerDay:3,areaM2:1000,pumpHeadM:20,pumpEfficiency:0.65,pvAreaM2:100,pvEfficiency:0.2,pvPerformanceRatio:0.8}}
  const out=simulateGlobalNative(req)
  if(out.points.length!==2||out.points.some(p=>Math.abs(p.waterResidualMm)>1e-10||p.storageMm<0||p.pumpKwh<0||p.pvKwh<0))throw Error('Global native conservation failure '+crop.id)
  cases++
  let rejected=false
  try{simulateGlobalNative({...req,site:{...req.site,latitude:100}})}catch{rejected=true}
  if(!rejected)throw Error('Invalid location accepted')
  cases++
 }
 return {passed:true,cases,crops:SYNTHETIC_CROPS.length,backend:'CHIPU_NATIVE',externalSolverRequired:false}
}
