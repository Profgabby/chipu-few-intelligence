import {SYNTHETIC_CROPS,validateCrop,cropStageAtDay} from './crop-registry'
import {HYDRUS_ATMOSPHERIC_SCHEMA,partitionPotentialEt,validateHydrusAtmosphericManifest,type HydrusAtmosphericManifest} from './hydrus-atmospheric-contract'
import {prepareHydrusAtmosphericRows,type HydrusNativeProfile} from './hydrus-atmosph-exporter'
/** Six crop fixtures; no crop is assumed to be scientifically calibrated. */
export function runMultiCropAcceptance(){
 let cases=0
 const profile:HydrusNativeProfile={version:'HYDRUS-1D 4.17.0140',templateReference:'VERSION_SPECIFIC_FORMAT_REVIEW_PENDING',verifiedAgainstInstalledVersion:true,lengthUnit:'cm',timeUnit:'day',timeOrigin:'DAYS_FROM_FIRST_RECORD',precipitationSign:'POSITIVE_DOWNWARD',evaporationSign:'POSITIVE_POTENTIAL',requiredColumns:['tAtm','Prec','rSoil','rRoot']}
 for(const crop of SYNTHETIC_CROPS){
  const info=validateCrop(crop)
  if(!info.valid||info.seasonDays!==110)throw Error('Crop season invalid: '+crop.id)
  cases++
  const stage=cropStageAtDay(crop,21)
  if(stage.name!=='development')throw Error('Crop stage transition invalid: '+crop.id)
  cases++
  const p=partitionPotentialEt(5,stage.kc,stage.lai,0.5)
  const manifest:HydrusAtmosphericManifest={schemaVersion:HYDRUS_ATMOSPHERIC_SCHEMA,treatment:'OPEN_FIELD',siteId:'SYNTHETIC_SITE',designId:null,sourceReference:crop.sourceReference,partitionMethod:'ILLUSTRATIVE_BEER_LAMBERT',irrigationMethod:'SYNTHETIC',rootUptakeModel:'FEDDES',soilHydraulicParameterSetId:'SYNTHETIC_SOIL',lowerBoundaryCondition:'FREE_DRAINAGE_TEST',initialConditionReference:'SYNTHETIC',days:[{date:'2026-06-01',precipitationMm:3,irrigationMm:2,potentialSoilEvaporationMm:p.potentialSoilEvaporationMm,potentialRootTranspirationMm:p.potentialRootTranspirationMm,leafAreaIndex:stage.lai,rootDepthCm:stage.rootDepthCm}]}
  validateHydrusAtmosphericManifest(manifest)
  const rows=prepareHydrusAtmosphericRows(manifest,profile).rows
  if(Math.abs(rows[0].Prec-0.5)>1e-10||Math.abs(rows[0].rSoil+rows[0].rRoot-0.5*stage.kc)>1e-10)throw Error('HYDRUS flux mapping invalid: '+crop.id)
  cases++
  if(crop.waterManagement==='FLOODED'&&info.hydrusReady)throw Error('Flooded rice must not be accepted as generic upland simulation')
  cases++
 }
 return {passed:true,cases,crops:SYNTHETIC_CROPS.map(c=>c.id),evidence:'SYNTHETIC_ONLY',nativeFileWritten:false}
}
