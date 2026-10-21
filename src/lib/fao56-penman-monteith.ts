/** FAO-56 daily grass-reference Penman–Monteith. Daily meteorological forcing must be supplied independently per treatment. */
export const FAO56_SCHEMA='chipu.fao56.pm.daily.v0.1' as const
export type Fao56Weather={date:string;latitudeDeg:number;elevationM:number;dayOfYear:number;tmaxC:number;tminC:number;relativeHumidityMaxPct:number;relativeHumidityMinPct:number;windSpeed2mMps:number;solarRadiationMjM2Day:number}
const sat=(t:number)=>0.6108*Math.exp(17.27*t/(t+237.3))
export function fao56DailyEto(w:Fao56Weather){
 const fields=[w.latitudeDeg,w.elevationM,w.dayOfYear,w.tmaxC,w.tminC,w.relativeHumidityMaxPct,w.relativeHumidityMinPct,w.windSpeed2mMps,w.solarRadiationMjM2Day]
 if(!fields.every(Number.isFinite)||Math.abs(w.latitudeDeg)>90||w.elevationM< -500||w.elevationM>9000||!Number.isInteger(w.dayOfYear)||w.dayOfYear<1||w.dayOfYear>366||w.tminC>w.tmaxC||w.tminC<=-237.3||w.tmaxC<=-237.3||w.relativeHumidityMaxPct<0||w.relativeHumidityMaxPct>100||w.relativeHumidityMinPct<0||w.relativeHumidityMinPct>100||w.relativeHumidityMinPct>w.relativeHumidityMaxPct||w.windSpeed2mMps<0||w.solarRadiationMjM2Day<0)throw Error('Invalid FAO-56 weather forcing')
 const t=(w.tmaxC+w.tminC)/2
 const es=(sat(w.tmaxC)+sat(w.tminC))/2
 const ea=(sat(w.tminC)*w.relativeHumidityMaxPct/100+sat(w.tmaxC)*w.relativeHumidityMinPct/100)/2
 const delta=4098*sat(t)/Math.pow(t+237.3,2)
 const pressure=101.3*Math.pow((293-0.0065*w.elevationM)/293,5.26)
 const gamma=0.000665*pressure
 const phi=w.latitudeDeg*Math.PI/180
 const dr=1+0.033*Math.cos(2*Math.PI*w.dayOfYear/365)
 const decl=0.409*Math.sin(2*Math.PI*w.dayOfYear/365-1.39)
 const x=Math.max(-1,Math.min(1,-Math.tan(phi)*Math.tan(decl)))
 const omega=Math.acos(x)
 const ra=(24*60/Math.PI)*0.0820*dr*(omega*Math.sin(phi)*Math.sin(decl)+Math.cos(phi)*Math.cos(decl)*Math.sin(omega))
 const rso=(0.75+2e-5*w.elevationM)*ra
 if(rso<=0)throw Error('FAO-56 clear-sky radiation unavailable for this polar day; use a validated polar method')
 if(w.solarRadiationMjM2Day>rso*1.25)throw Error('Measured solar radiation exceeds plausible clear-sky envelope')
 const rns=0.77*w.solarRadiationMjM2Day
 const sigma=4.903e-9
 const cloud=Math.max(0.05,Math.min(1,w.solarRadiationMjM2Day/rso))
 const rnl=sigma*(Math.pow(w.tmaxC+273.16,4)+Math.pow(w.tminC+273.16,4))/2*(0.34-0.14*Math.sqrt(Math.max(0,ea)))*(1.35*cloud-0.35)
 const rn=rns-rnl
 const numerator=0.408*delta*rn+gamma*(900/(t+273))*w.windSpeed2mMps*(es-ea)
 const denominator=delta+gamma*(1+0.34*w.windSpeed2mMps)
 const etoMm=Math.max(0,numerator/denominator)
 if(!Number.isFinite(etoMm))throw Error('FAO-56 computation failed')
 return {schemaVersion:FAO56_SCHEMA,date:w.date,etoMm,netRadiationMjM2Day:rn,actualVaporPressureKpa:ea,saturationVaporPressureKpa:es,slopeKpaC:delta,psychrometricConstantKpaC:gamma,extraterrestrialRadiationMjM2Day:ra,clearSkyRadiationMjM2Day:rso,method:'FAO-56 grass reference, daily PM, G=0',validationStatus:'NOT_FIELD_VALIDATED' as const}
}
