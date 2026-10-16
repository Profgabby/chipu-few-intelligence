/** Crop-independent, provenance-explicit registry. All defaults below are synthetic test fixtures. */
export const CROP_REGISTRY_VERSION='chipu.crop.v0.1'
export type CropStage={name:string;days:number;kc:number;lai:number;rootDepthCm:number}
export type CropProfile={id:string;name:string;scientificName:string;waterManagement:'UPLAND'|'FLOODED'|'SPECIALIZED';sourceReference:string;rootStressParametersId:string;stages:CropStage[]}
const ids:[string,string,string,CropProfile['waterManagement']][]=[
 ['maize','Maize','Zea mays','UPLAND'],['wheat','Wheat','Triticum aestivum','UPLAND'],
 ['soybean','Soybean','Glycine max','UPLAND'],['tomato','Tomato','Solanum lycopersicum','UPLAND'],
 ['potato','Potato','Solanum tuberosum','UPLAND'],['rice','Rice','Oryza sativa','FLOODED']]
export const SYNTHETIC_CROPS:CropProfile[]=ids.map(([id,name,scientificName,waterManagement])=>({
 id,name,scientificName,waterManagement,sourceReference:'SYNTHETIC_NOT_CALIBRATED',rootStressParametersId:'UNASSIGNED',
 stages:[{name:'initial',days:20,kc:0.45,lai:0.3,rootDepthCm:15},{name:'development',days:30,kc:0.8,lai:1.5,rootDepthCm:40},{name:'midseason',days:40,kc:1.1,lai:3,rootDepthCm:80},{name:'late',days:20,kc:0.65,lai:1.2,rootDepthCm:80}]}))
export function validateCrop(c:CropProfile){
 if(!/^[a-z][a-z0-9-]*$/.test(c.id)||!c.name?.trim()||!c.scientificName?.trim()||!c.sourceReference?.trim()||!c.rootStressParametersId?.trim()||!c.stages?.length)throw Error('Invalid crop identity')
 if(!['UPLAND','FLOODED','SPECIALIZED'].includes(c.waterManagement))throw Error('Unsupported water-management mode')
 for(const s of c.stages)if(!s.name?.trim()||!Number.isInteger(s.days)||s.days<1||![s.kc,s.lai,s.rootDepthCm].every(v=>Number.isFinite(v)&&v>=0))throw Error('Invalid crop stage')
 return {valid:true,seasonDays:c.stages.reduce((sum,s)=>sum+s.days,0),hydrusReady:c.waterManagement==='UPLAND'&&c.rootStressParametersId!=='UNASSIGNED'}
}
export function cropStageAtDay(c:CropProfile,day:number){
 validateCrop(c);if(!Number.isInteger(day)||day<1)throw Error('Invalid growing day')
 let end=0;for(const stage of c.stages){end+=stage.days;if(day<=end)return stage}
 throw Error('Growing day exceeds defined crop season')
}
