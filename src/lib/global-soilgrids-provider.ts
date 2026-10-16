import type {EnvironmentalSource} from './global-environment-adapter'
/** SoilGrids supplies depth-resolved soil properties, not directly measured root-zone storage capacity. */
export type SoilGridsLayer={name:string;depth:string;unit:string;value:number;conversionFactor:number}
export type SoilGridsProfile={source:EnvironmentalSource;layers:SoilGridsLayer[];status:'SOIL_PROPERTIES_ONLY';storageReady:false}
export function parseSoilGridsProperties(payload:unknown,source:EnvironmentalSource):SoilGridsProfile{
 const p=payload as {properties?:{layers?:Array<{name?:string;unit_measure?:{mapped_units?:string;d_factor?:number};depths?:Array<{label?:string;values?:{mean?:number}}>} >}}
 const layers=p?.properties?.layers
 if(!Array.isArray(layers)||!layers.length||!source.reference?.trim())throw Error('Missing SoilGrids layers or provenance')
 const out:SoilGridsLayer[]=[]
 for(const layer of layers){
  const factor=layer.unit_measure?.d_factor
  if(!layer.name?.trim()||!Number.isFinite(factor)||factor!<=0||!Array.isArray(layer.depths))throw Error('Invalid SoilGrids metadata')
  for(const d of layer.depths){
   const raw=d.values?.mean
   if(!d.label?.trim()||!Number.isFinite(raw)||raw!<0)throw Error('SoilGrids missing property estimate')
   out.push({name:layer.name,depth:d.label,unit:layer.unit_measure?.mapped_units||'SOURCE_UNSPECIFIED',value:raw!/factor!,conversionFactor:factor!})
  }
 }
 if(!out.length)throw Error('No SoilGrids soil properties')
 return {source,layers:out,status:'SOIL_PROPERTIES_ONLY',storageReady:false}
}
