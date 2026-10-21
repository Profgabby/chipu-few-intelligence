import {standardizeEnvironment,type EnvironmentalSource} from './global-environment-adapter'
export function runEnvironmentAdapterAcceptance(){
 const src:EnvironmentalSource={provider:'SYNTHETIC',dataset:'UNIT_TEST',version:'1',retrievedAt:'2026-10-16T00:00:00Z',reference:'synthetic-fixture'}
 const weather={source:src,rows:[{date:'2026-06-01',precipitation:0.5,precipitationUnit:'cm' as const,eto:0.004,etoUnit:'m' as const,irradiation:18,irradiationUnit:'MJ/m2' as const}]}
 const soil={source:src,capacity:0.1,initialStorage:0.05,waterUnit:'m' as const}
 const result=standardizeEnvironment(weather,soil)
 if(result.days[0].precipitationMm!==5||result.days[0].etoMm!==4||Math.abs(result.days[0].irradiationKwhM2-5)>1e-10||result.soil.capacityMm!==100)throw Error('Environmental unit conversion mismatch')
 let rejected=0
 for(const w of [{...weather,source:{...src,reference:''}},{...weather,rows:[{...weather.rows[0],eto:-1}]},{...weather,rows:[weather.rows[0],{...weather.rows[0],date:'2026-06-03'}]}]){
  try{standardizeEnvironment(w,soil)}catch{rejected++}
 }
 if(rejected!==3)throw Error('Environmental adapter failed to reject bad provenance, negative data or gaps')
 return {passed:true,cases:4,source:'SYNTHETIC',liveProvidersConnected:0}
}
