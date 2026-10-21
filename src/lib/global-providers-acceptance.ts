import {parseNasaPowerDaily,parseEra5LandDaily,nasaPowerDailyUrl} from './global-weather-providers'
import {parseSoilGridsProperties} from './global-soilgrids-provider'
import {createVersionedCropRegistry} from './versioned-crop-registry'
import {SYNTHETIC_CROPS} from './crop-registry'
import {standardizeEnvironment} from './global-environment-adapter'
export function runGlobalProviderAcceptance(){
 const source={provider:'SYNTHETIC',dataset:'TEST',version:'1',retrievedAt:'2026-10-16T00:00:00Z',reference:'TEST_FIXTURE'}
 const url=nasaPowerDailyUrl(9,8,'20260101','20260102')
 if(!url.includes('PRECTOTCORR'))throw Error('POWER parameter request missing')
 const power=parseNasaPowerDaily({properties:{parameter:{PRECTOTCORR:{'20260101':3},ALLSKY_SFC_SW_DWN:{'20260101':5}}}},{'20260101':4},source)
 const era=parseEra5LandDaily([{date:'2026-01-01',totalPrecipitationM:0.003,surfaceSolarRadiationJm2:18000000,etoMm:4}],source)
 for(const w of [power,era]){
  const normalized=standardizeEnvironment(w,{source,capacity:100,initialStorage:50,waterUnit:'mm'})
  if(normalized.days[0].precipitationMm!==3||normalized.days[0].irradiationKwhM2!==5)throw Error('Provider conversion mismatch')
 }
 const soil=parseSoilGridsProperties({properties:{layers:[{name:'clay',unit_measure:{mapped_units:'g/kg',d_factor:10},depths:[{label:'0-5cm',values:{mean:250}}]}]}},source)
 if(soil.storageReady!==false||soil.layers[0].value!==25)throw Error('SoilGrids metadata conversion mismatch')
 const crops=createVersionedCropRegistry([{profile:SYNTHETIC_CROPS[0],version:'0.1',reference:'SYNTHETIC',reviewStatus:'SYNTHETIC',applicableRegions:['GLOBAL_TEST_ONLY']}])
 if(crops.entries.length!==1)throw Error('Crop registry failed')
 let rejected=0
 for(const f of [()=>parseNasaPowerDaily({properties:{parameter:{PRECTOTCORR:{'20260101':-999},ALLSKY_SFC_SW_DWN:{'20260101':5}}}},{'20260101':4},source),()=>parseSoilGridsProperties({properties:{layers:[]}},source),()=>createVersionedCropRegistry([{profile:SYNTHETIC_CROPS[0],version:'0.1',reference:'TEST',reviewStatus:'FIELD_CALIBRATED',applicableRegions:['GLOBAL']}])])try{f()}catch{rejected++}
 if(rejected!==3)throw Error('Provider invalid-input gate failed')
 return {passed:true,cases:7,liveProviderRequests:0,externalModelRequired:false}
}
