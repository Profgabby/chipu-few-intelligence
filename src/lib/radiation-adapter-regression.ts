import { fao56DailyEto } from './fao56-penman-monteith'
import { applyFao56Treatment } from './treatment-microclimate-forcing'
import { applyTreatmentMicroclimate } from './treatment-microclimate-forcing'
import { GEOMETRY_REGISTRY,geometryMetrics,validateGeometry,radiationPartition,solarPosition } from './geometry-registry'
import { adaptHourlyRadiation,attachRadiationToDailyForcing,type HourlyRadiation } from './radiation-forcing-adapter'
/** Deterministic research smoke tests; call explicitly from a test runner. */
export function runRadiationAdapterRegressionTests(){
 const assert=(ok:boolean,message:string)=>{if(!ok)throw Error('Radiation regression: '+message)}
 assert(GEOMETRY_REGISTRY.length===20,'20 records')
 for(const g of GEOMETRY_REGISTRY){assert(validateGeometry(g).length===0,g.id+' invalid');assert(geometryMetrics(g).gcr>=0&&geometryMetrics(g).gcr<=1,g.id+' GCR')}
 const p=radiationPartition(0.8,0.3,0.5,0.75)
 assert(Math.abs(p.transmittedKwhM2+p.blockedKwhM2-0.8)<1e-10,'radiation conservation')
 const sun=solarPosition(new Date('2026-06-21T19:00:00Z'),45,-123)
 assert(sun.elevationDeg>50,'summer solar elevation')
 const hours:HourlyRadiation[]=Array.from({length:24},(_,h)=>({timestampUtc:`2026-07-01T${String(h).padStart(2,'0')}:00:00Z`,ghiKwhM2:h>=12&&h<20?0.5:0,dhiKwhM2:h>=12&&h<20?0.15:0,poaKwhM2:h>=12&&h<20?0.55:0,cellTempC:25}))
 const days=adaptHourlyRadiation('SS01',{latitudeDeg:45,longitudeDeg:-123,hours,diffuseTransmission:0.8,cropCrossRowM:1})
 assert(days.length===1&&days[0].hours===24,'complete daily aggregation')
 assert(Math.abs(days[0].incidentKwhM2-days[0].transmittedKwhM2-days[0].blockedKwhM2)<1e-9,'daily radiation balance')
 const forcing=attachRadiationToDailyForcing([{date:'2026-07-01',precipitationMm:0,etoMm:4,irradiationKwhM2:4,cropCoefficient:0.85,transmittedFraction:1}],days)
 assert(forcing[0].transmittedFraction>=0&&forcing[0].transmittedFraction<=1,'transmission bounds')
 let rejected=false
 try{adaptHourlyRadiation('MS02',{latitudeDeg:45,longitudeDeg:-123,hours,diffuseTransmission:0.8,cropCrossRowM:1})}catch{rejected=true}
 assert(rejected,'vertical bifacial unsupported')
 rejected=false
 try{attachRadiationToDailyForcing([{...forcing[0],irradiationKwhM2:5}],days)}catch{rejected=true}
 assert(rejected,'daily GHI mismatch rejected')
 const source={source:'MEASURED' as const,sourceReference:'synthetic-test-reference',method:'independent test ETo',siteId:'site-test',designId:'SS01',days:[{date:'2026-07-01',etoMm:2}]}
 const paired=applyTreatmentMicroclimate(forcing,source)
 assert(paired.control[0].etoMm===4&&paired.treatment[0].etoMm===2,'treatment ETo isolated from open-field control')
 assert(paired.treatment[0].transmittedFraction===forcing[0].transmittedFraction,'radiation fraction preserved')
 rejected=false
 try{applyTreatmentMicroclimate(forcing,{...source,days:[{date:'2026-07-02',etoMm:2}]})}catch{rejected=true}
 assert(rejected,'mismatched microclimate date rejected')
 rejected=false
 try{applyTreatmentMicroclimate(forcing,{...source,sourceReference:' '})}catch{rejected=true}
 assert(rejected,'missing provenance rejected')
 const w={date:'2026-07-01',latitudeDeg:45,elevationM:100,dayOfYear:182,tmaxC:28,tminC:14,relativeHumidityMaxPct:85,relativeHumidityMinPct:35,windSpeed2mMps:2,solarRadiationMjM2Day:23}
 const pm=fao56DailyEto(w)
 assert(pm.etoMm>0&&pm.etoMm<15,'FAO-56 physically plausible positive ETo')
 const coupled=applyFao56Treatment(forcing,{...source,weather:[w]})
 assert(Math.abs(coupled.treatment[0].etoMm-pm.etoMm)<1e-10&&coupled.control[0].etoMm===4,'FAO-56 treatment isolation')
 rejected=false
 try{applyFao56Treatment(forcing,{...source,weather:[{...w,dayOfYear:1}]})}catch{rejected=true}
 assert(rejected,'invalid FAO-56 day-of-year rejected')
 rejected=false
 try{fao56DailyEto({...w,relativeHumidityMinPct:110})}catch{rejected=true}
 assert(rejected,'invalid FAO-56 humidity rejected')
 return {passed:true,designs:GEOMETRY_REGISTRY.length,cases:16}
}
