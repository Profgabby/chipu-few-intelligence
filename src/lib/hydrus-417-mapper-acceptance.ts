import {mapManifestTo417Records,type Hydrus417Auxiliary} from './hydrus-417-manifest-mapper'
import {HYDRUS_ATMOSPHERIC_SCHEMA,type HydrusAtmosphericManifest} from './hydrus-atmospheric-contract'
export function runHydrus417MapperAcceptance(){
 const day={date:'2026-06-01',precipitationMm:4,irrigationMm:6,potentialSoilEvaporationMm:2,potentialRootTranspirationMm:3,leafAreaIndex:2,rootDepthCm:40}
 const m:HydrusAtmosphericManifest={schemaVersion:HYDRUS_ATMOSPHERIC_SCHEMA,treatment:'OPEN_FIELD',siteId:'SYNTHETIC',designId:null,sourceReference:'SYNTHETIC',partitionMethod:'SYNTHETIC',irrigationMethod:'SYNTHETIC',rootUptakeModel:'FEDDES',soilHydraulicParameterSetId:'SYNTHETIC',lowerBoundaryCondition:'SYNTHETIC',initialConditionReference:'SYNTHETIC',days:[day]}
 const a:Hydrus417Auxiliary={hCritA:10000,rB:0,hB:0,ht:0,tTop:0,tBot:0,Ampl:0,cTop:0,cBot:0}
 const aux={reference:'SYNTHETIC_TEST_ONLY',verifiedForProject:true,byDay:[a]}
 const result=mapManifestTo417Records(m,aux)
 if(result.rows[0].Prec!==1||result.rows[0].rSoil!==0.2||result.rows[0].rRoot!==0.3)throw Error('HYDRUS conversion mismatch')
 let rejected=0
 for(const invalid of [{...aux,verifiedForProject:false},{...aux,byDay:[]},{...aux,byDay:[{...a,hB:NaN}]}]){
  try{mapManifestTo417Records(m,invalid)}catch{rejected++}
 }
 if(rejected!==3)throw Error('HYDRUS mapper did not reject invalid auxiliary input')
 return {passed:true,cases:4,nativeFileWritten:false}
}
