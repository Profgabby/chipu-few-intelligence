/** CHIPU-FEW Geometry Registry v0.1. All dimensions are hypothetical design inputs, not as-built measurements. */
export const GEOMETRY_SCHEMA='chipu.geometry.v0.1' as const
export type GeometryId=`${'SS'|'MS'|'CS'|'RT'}0${1|2|3|4|5}`
export type Archetype='elevated-fixed'|'vertical-bifacial'|'single-axis-tracker'|'low-fixed'|'canopy-fixed'
export type EvidenceLevel='ILLUSTRATIVE'|'ENGINEERING_APPROVED'|'MANUFACTURER'|'MEASURED'
export interface DesignGeometry {
 id:GeometryId;revision:string;archetype:Archetype;evidence:EvidenceLevel;
 sourceNote:string;moduleLengthM:number;moduleWidthM:number;modulesPerRow:number;
 rows:number;pitchM:number;clearanceM:number;tiltDeg:number;azimuthDeg:number;
 pvEfficiency:number;performanceRatio:number;cropRowSpacingM:number;cropOffsetM:number;
 irrigationEfficiency:number;nominalDcKw:number;trackingLimitDeg:number;
}
const ids=(['SS','MS','CS','RT'] as const).flatMap(prefix=>[1,2,3,4,5].map(i=>`${prefix}0${i}` as GeometryId))
const archetypes:Archetype[]=['elevated-fixed','low-fixed','elevated-fixed','canopy-fixed','canopy-fixed','elevated-fixed','vertical-bifacial','low-fixed','single-axis-tracker','elevated-fixed','elevated-fixed','single-axis-tracker','vertical-bifacial','canopy-fixed','elevated-fixed','single-axis-tracker','vertical-bifacial','canopy-fixed','elevated-fixed','single-axis-tracker']
const assumptions:Record<Archetype,{pitch:number;clearance:number;tilt:number;tracking:number}>={
 'elevated-fixed':{pitch:6,clearance:2.6,tilt:20,tracking:0},
 'vertical-bifacial':{pitch:8,clearance:0.6,tilt:90,tracking:0},
 'single-axis-tracker':{pitch:7,clearance:2.5,tilt:0,tracking:55},
 'low-fixed':{pitch:5,clearance:1.1,tilt:25,tracking:0},
 'canopy-fixed':{pitch:7,clearance:3.2,tilt:12,tracking:0}}
export const GEOMETRY_REGISTRY:readonly DesignGeometry[]=ids.map((id,i)=>{
 const archetype=archetypes[i],a=assumptions[archetype]
 const rows=id.startsWith('SS')?2:id.startsWith('MS')?6: id.startsWith('CS')?14:4
 const modulesPerRow=id.startsWith('SS')?6:id.startsWith('MS')?12:id.startsWith('CS')?24:10
 const moduleLengthM=2.1,moduleWidthM=1.1,pvEfficiency=0.2
 return {id,revision:'0.1.0',archetype,evidence:'ILLUSTRATIVE' as const,
 sourceNote:'Conceptual parametric archetype; no engineering drawing, manufacturer part number or physical measurement.',
 moduleLengthM,moduleWidthM,modulesPerRow,rows,pitchM:a.pitch,clearanceM:a.clearance,
 tiltDeg:a.tilt,azimuthDeg:180,pvEfficiency,performanceRatio:0.8,
 cropRowSpacingM:0.35,cropOffsetM:0.8,irrigationEfficiency:0.85,
 nominalDcKw:rows*modulesPerRow*moduleLengthM*moduleWidthM*pvEfficiency,trackingLimitDeg:a.tracking}
})
export function geometryMetrics(g:DesignGeometry){
 const tableWidthM=g.moduleLengthM
 const projectedWidthM=tableWidthM*Math.abs(Math.cos(g.tiltDeg*Math.PI/180))
 const gcr=projectedWidthM/g.pitchM
 const moduleAreaM2=g.moduleLengthM*g.moduleWidthM*g.modulesPerRow*g.rows
 const groundFootprintM2=g.rows*g.pitchM*g.modulesPerRow*g.moduleWidthM
 return {projectedWidthM,gcr,clearGapM:g.pitchM-projectedWidthM,moduleAreaM2,groundFootprintM2,
 calculatedDcKw:moduleAreaM2*g.pvEfficiency}
}
export function validateGeometry(g:DesignGeometry):string[]{
 const errors:string[]=[]
 const positive=['moduleLengthM','moduleWidthM','modulesPerRow','rows','pitchM','pvEfficiency','performanceRatio','cropRowSpacingM','irrigationEfficiency','nominalDcKw'] as const
 for(const k of positive)if(!Number.isFinite(g[k])||g[k]<=0)errors.push(`Invalid ${k}`)
 for(const k of ['clearanceM','cropOffsetM','trackingLimitDeg'] as const)if(!Number.isFinite(g[k])||g[k]<0)errors.push(`Invalid ${k}`)
 if(!Number.isInteger(g.rows)||!Number.isInteger(g.modulesPerRow))errors.push('Module and row counts must be integers')
 if(g.pvEfficiency>1||g.performanceRatio>1||g.irrigationEfficiency>1)errors.push('Efficiencies must not exceed 1')
 if(!Number.isFinite(g.tiltDeg)||g.tiltDeg<0||g.tiltDeg>90)errors.push('Tilt outside 0–90 degrees')
 if(!Number.isFinite(g.azimuthDeg)||g.azimuthDeg<0||g.azimuthDeg>=360)errors.push('Azimuth outside 0–360 degrees')
 if(g.trackingLimitDeg>90)errors.push('Tracker rotation limit exceeds 90 degrees')
 if(g.archetype!=='single-axis-tracker'&&g.trackingLimitDeg!==0)errors.push('Fixed designs cannot have tracking limits')
 const m=geometryMetrics(g)
 if(!Number.isFinite(m.gcr)||m.gcr>1||m.clearGapM<0)errors.push('Invalid pitch, overlap or GCR')
 if(g.cropOffsetM>=g.pitchM)errors.push('Crop offset must fit within row pitch')
 if(Math.abs(m.calculatedDcKw-g.nominalDcKw)>1e-7)errors.push('Nominal DC capacity inconsistent with module area and efficiency at 1 kW/m² STC')
 if(!g.sourceNote.trim())errors.push('Missing engineering provenance')
 return errors
}
export function getGeometry(id:GeometryId):DesignGeometry{
 const record=GEOMETRY_REGISTRY.find(g=>g.id===id)
 if(!record)throw Error('Unknown geometry design')
 const errors=validateGeometry(record)
 if(errors.length)throw Error(`Geometry ${id}: ${errors.join('; ')}`)
 return record
}
/** Solar position: NOAA-style approximation, degrees; UTC timestamp and site coordinates required. */
export function solarPosition(utc:Date,latitudeDeg:number,longitudeDeg:number){
 if(!Number.isFinite(utc.getTime())||Math.abs(latitudeDeg)>90||Math.abs(longitudeDeg)>180)throw Error('Invalid solar position inputs')
 const yearStart=Date.UTC(utc.getUTCFullYear(),0,1)
 const day=(utc.getTime()-yearStart)/86400000+1
 const hour=utc.getUTCHours()+utc.getUTCMinutes()/60+utc.getUTCSeconds()/3600
 const gamma=2*Math.PI/365*(day-1+(hour-12)/24)
 const eqtime=229.18*(0.000075+0.001868*Math.cos(gamma)-0.032077*Math.sin(gamma)-0.014615*Math.cos(2*gamma)-0.040849*Math.sin(2*gamma))
 const decl=0.006918-0.399912*Math.cos(gamma)+0.070257*Math.sin(gamma)-0.006758*Math.cos(2*gamma)+0.000907*Math.sin(2*gamma)-0.002697*Math.cos(3*gamma)+0.00148*Math.sin(3*gamma)
 const ha=(hour*60+eqtime+4*longitudeDeg-720)/4*Math.PI/180
 const lat=latitudeDeg*Math.PI/180
 const cosZenith=Math.max(-1,Math.min(1,Math.sin(lat)*Math.sin(decl)+Math.cos(lat)*Math.cos(decl)*Math.cos(ha)))
 const elevationDeg=90-Math.acos(cosZenith)*180/Math.PI
 const azimuthDeg=(Math.atan2(Math.sin(ha),Math.cos(ha)*Math.sin(lat)-Math.tan(decl)*Math.cos(lat))*180/Math.PI+180+360)%360
 return {elevationDeg,azimuthDeg}
}
/** First-order cross-row geometric shade, not a validated 3D ray-tracing model. */
export function shadingAt(g:DesignGeometry,solar:{elevationDeg:number;azimuthDeg:number},cropCrossRowM:number){
 const m=geometryMetrics(g)
 if(solar.elevationDeg<=0)return {shadeFraction:0,directTransmission:0}
 const sun=Math.PI/180*solar.elevationDeg
 const az=(solar.azimuthDeg-g.azimuthDeg)*Math.PI/180
 const projectedShadowM=m.projectedWidthM+g.clearanceM/Math.tan(sun)*Math.abs(Math.sin(az))
 const shadeFraction=Math.max(0,Math.min(1,projectedShadowM/g.pitchM))
 const center=((cropCrossRowM%g.pitchM)+g.pitchM)%g.pitchM
 return {shadeFraction,directTransmission:center<projectedShadowM?0:1}
}
export function radiationPartition(ghiKwhM2:number,diffuseKwhM2:number,directTransmission:number,diffuseTransmission:number){
 if(![ghiKwhM2,diffuseKwhM2,directTransmission,diffuseTransmission].every(Number.isFinite)||ghiKwhM2<0||diffuseKwhM2<0||diffuseKwhM2>ghiKwhM2||directTransmission<0||directTransmission>1||diffuseTransmission<0||diffuseTransmission>1)throw Error('Invalid radiation components')
 const directHorizontal=ghiKwhM2-diffuseKwhM2
 return {transmittedKwhM2:directHorizontal*directTransmission+diffuseKwhM2*diffuseTransmission,blockedKwhM2:directHorizontal*(1-directTransmission)+diffuseKwhM2*(1-diffuseTransmission)}
}
export function pvEnergyFromPoa(g:DesignGeometry,poaKwhM2:number,cellTempC:number){
 if(!Number.isFinite(poaKwhM2)||poaKwhM2<0||!Number.isFinite(cellTempC))throw Error('Invalid PV forcing')
 const temperatureFactor=Math.max(0,1-0.004*(cellTempC-25))
 return geometryMetrics(g).calculatedDcKw*poaKwhM2*temperatureFactor*g.performanceRatio
}
/** FAO-style Kc * externally determined ETo; no invented shade-to-ETo relationship. */
export function cropWaterDemandMm(etoMm:number,kc:number){
 if(!Number.isFinite(etoMm)||etoMm<0||!Number.isFinite(kc)||kc<0)throw Error('Invalid crop water forcing')
 return etoMm*kc
}
