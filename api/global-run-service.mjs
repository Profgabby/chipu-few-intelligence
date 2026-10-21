import {retrievePower} from './power-service.mjs'
import {validateSimulationEvidence} from './simulation-evidence.mjs'
/** Server-side orchestration readiness. Numerical execution remains in the typed native core. */
export async function prepareGlobalRun(input,{retrieve=retrievePower}={}){
 const {site,dates,crop,soil,etoByDate}=input||{}
 if(!dates||typeof dates.start!=='string'||typeof dates.end!=='string')throw Error('Date window required')
 const weather=await retrieve({latitude:site?.latitude,longitude:site?.longitude,start:dates.start,end:dates.end})
 const gate=validateSimulationEvidence({site,crop,soil,etoByDate,weatherDays:weather.days})
 const forcing=weather.days.map(d=>({...d,etoMm:etoByDate[d.date]}))
 return {status:'READY_FOR_NATIVE_EXECUTION',schemaVersion:'chipu.global.model.v0.1',site,crop,soil,forcing,provenance:{weather:weather.provenance,crop:{reference:crop.reference,version:crop.version,reviewStatus:crop.reviewStatus},soil:{reference:soil.reference,method:soil.method,reviewStatus:soil.reviewStatus}},evidence:gate,limitations:['Numerical native simulation not executed by this endpoint','Soil capacity is independently supplied, not inferred from SoilGrids','Daily ETo is supplied, not derived from shade']}
}
