import {validateCrop,type CropProfile} from './crop-registry'
export type VersionedCropEntry={profile:CropProfile;version:string;reference:string;reviewStatus:'SYNTHETIC'|'RESEARCH_REVIEWED'|'FIELD_CALIBRATED';applicableRegions:string[]}
export function createVersionedCropRegistry(entries:VersionedCropEntry[]){
 const ids=new Set<string>()
 for(const e of entries){
  validateCrop(e.profile)
  if(!e.version?.trim()||!e.reference?.trim()||!e.applicableRegions.length||ids.has(e.profile.id+'@'+e.version))throw Error('Invalid or duplicate crop registry entry')
  if(e.reviewStatus!=='SYNTHETIC'&&e.profile.sourceReference==='SYNTHETIC_NOT_CALIBRATED')throw Error('Synthetic crop cannot be labeled scientifically reviewed')
  ids.add(e.profile.id+'@'+e.version)
 }
 return {schema:'chipu.crop.registry.v0.1' as const,entries:entries.map(e=>({...e,applicableRegions:[...e.applicableRegions]}))}
}
