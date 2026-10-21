import {standardizeEnvironment,type EnvironmentalWeather,type EnvironmentalSoil} from './global-environment-adapter'
import {simulateGlobalNative,type GlobalModelRequest} from './global-native-model'
/** Pure adapter: a caller can supply ERA5-Land, NASA POWER or local data after source-specific QA. */
export function runGlobalEnvironmentModel(request:Omit<GlobalModelRequest,'soil'|'forcing'>,weather:EnvironmentalWeather,soil:EnvironmentalSoil){
 const standardized=standardizeEnvironment(weather,soil)
 const result=simulateGlobalNative({...request,soil:{...standardized.soil,reference:standardized.provenance.soil.reference},forcing:{days:standardized.days,reference:standardized.provenance.weather.reference}})
 return {...result,inputSources:standardized.provenance,inputQuality:standardized.quality}
}
