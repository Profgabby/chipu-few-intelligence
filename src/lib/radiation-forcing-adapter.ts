/** Opt-in research-stage hourly radiation adapter. Never infers hourly irradiance from daily totals. */
import { getGeometry, radiationPartition, solarPosition, shadingAt, type GeometryId } from './geometry-registry'
import type { DailyForcing } from './av-timeseries-engine'
export const RADIATION_ADAPTER_SCHEMA='chipu.radiation.adapter.v0.1' as const
export type HourlyRadiation={timestampUtc:string;ghiKwhM2:number;dhiKwhM2:number;poaKwhM2:number;cellTempC:number}
export type RadiationInput={latitudeDeg:number;longitudeDeg:number;hours:HourlyRadiation[];diffuseTransmission:number;cropCrossRowM:number}
export type RadiationDay={date:string;incidentKwhM2:number;transmittedKwhM2:number;blockedKwhM2:number;poaKwhM2:number;pvKwh:number;transmittedFraction:number;hours:number}
export function adaptHourlyRadiation(modelId:GeometryId,input:RadiationInput):RadiationDay[]{
 const g=getGeometry(modelId)
 if(g.archetype==='single-axis-tracker'||g.archetype==='vertical-bifacial')throw Error('Tracking and vertical bifacial geometries require a dedicated validated orientation/shading solver')
 if(!Number.isFinite(input.latitudeDeg)||Math.abs(input.latitudeDeg)>90||!Number.isFinite(input.longitudeDeg)||Math.abs(input.longitudeDeg)>180)throw Error('Valid site coordinates are required')
 if(!Number.isFinite(input.diffuseTransmission)||input.diffuseTransmission<0||input.diffuseTransmission>1||!Number.isFinite(input.cropCrossRowM)||input.cropCrossRowM<0||input.cropCrossRowM>=g.pitchM)throw Error('Invalid diffuse transmission or crop location')
 if(!input.hours.length||input.hours.length>87840)throw Error('Provide 1–87840 hourly records')
 const groups=new Map<string,RadiationDay>()
 let prev=NaN
 for(const hour of input.hours){
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:00:00Z$/.test(hour.timestampUtc))throw Error('Timestamp must be UTC at exact hourly boundaries')
  const ms=Date.parse(hour.timestampUtc)
  if(!Number.isFinite(ms)||new Date(ms).toISOString()!==hour.timestampUtc||(!Number.isNaN(prev)&&ms-prev!==3600000))throw Error('Hourly timestamps must be valid, unique and contiguous')
  prev=ms
  if(![hour.ghiKwhM2,hour.dhiKwhM2,hour.poaKwhM2,hour.cellTempC].every(Number.isFinite)||hour.ghiKwhM2<0||hour.dhiKwhM2<0||hour.dhiKwhM2>hour.ghiKwhM2||hour.poaKwhM2<0)throw Error('Invalid hourly irradiance or temperature')
  const date=hour.timestampUtc.slice(0,10)
  const sun=solarPosition(new Date(ms+1800000),input.latitudeDeg,input.longitudeDeg)
  const beam=shadingAt(g,sun,input.cropCrossRowM)
  const partition=radiationPartition(hour.ghiKwhM2,hour.dhiKwhM2,beam.directTransmission,input.diffuseTransmission)
  const current=groups.get(date)??{date,incidentKwhM2:0,transmittedKwhM2:0,blockedKwhM2:0,poaKwhM2:0,pvKwh:0,transmittedFraction:0,hours:0}
  current.incidentKwhM2+=hour.ghiKwhM2
  current.transmittedKwhM2+=partition.transmittedKwhM2
  current.blockedKwhM2+=partition.blockedKwhM2
  current.poaKwhM2+=hour.poaKwhM2
  const thermalFactor=Math.max(0,1-0.004*(hour.cellTempC-25))
  current.pvKwh+=g.nominalDcKw*hour.poaKwhM2*thermalFactor*g.performanceRatio
  current.hours++
  groups.set(date,current)
 }
 const days=[...groups.values()]
 if(days.some(d=>d.hours!==24))throw Error('Radiation adapter requires complete 24-hour UTC days; convert local days explicitly upstream')
 return days.map(d=>({...d,transmittedFraction:d.incidentKwhM2>0?d.transmittedKwhM2/d.incidentKwhM2:0}))
}
export function attachRadiationToDailyForcing(forcing:DailyForcing[],days:RadiationDay[]):DailyForcing[]{
 if(forcing.length!==days.length)throw Error('Weather and radiation day counts differ')
 return forcing.map((f,i)=>{
  if(f.date!==days[i].date)throw Error('Weather and radiation dates do not match')
  if(Math.abs(f.irradiationKwhM2-days[i].incidentKwhM2)>1e-5)throw Error('Daily weather irradiation must match summed hourly GHI; do not silently replace inputs')
  return {...f,transmittedFraction:days[i].transmittedFraction}
 })
}
