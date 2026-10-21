/** Server-side simulation eligibility gate. Never upgrade synthetic data to validated evidence. */
export function validateSimulationEvidence(input){
 const {crop,soil,etoByDate,weatherDays,site}=input||{}
 if(!site||![site.latitude,site.longitude].every(Number.isFinite)||Math.abs(site.latitude)>90||Math.abs(site.longitude)>180)throw Error('Invalid site')
 if(!crop||!['RESEARCH_REVIEWED','FIELD_CALIBRATED','SYNTHETIC'].includes(crop.reviewStatus)||!crop.reference||!crop.version||!crop.profile)throw Error('Versioned crop evidence required')
 if(!soil||!soil.reference||!soil.method||!['RESEARCH_REVIEWED','FIELD_CALIBRATED','SYNTHETIC'].includes(soil.reviewStatus)||![soil.capacityMm,soil.initialStorageMm].every(Number.isFinite)||soil.capacityMm<=0||soil.initialStorageMm<0||soil.initialStorageMm>soil.capacityMm)throw Error('Independent soil-water capacity evidence required')
 if(!Array.isArray(weatherDays)||!weatherDays.length||weatherDays.length>366||!etoByDate||typeof etoByDate!=='object')throw Error('Complete daily weather and ETo required')
 const dates=new Set()
 for(const d of weatherDays){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||dates.has(d.date)||![d.precipitationMm,d.irradiationKwhM2,etoByDate[d.date]].every(v=>Number.isFinite(v)&&v>=0))throw Error('Missing or invalid daily environmental forcing')
  dates.add(d.date)
 }
 const synthetic=crop.reviewStatus==='SYNTHETIC'||soil.reviewStatus==='SYNTHETIC'||crop.profile.sourceReference==='SYNTHETIC_NOT_CALIBRATED'
 return {eligible:true,evidenceClass:synthetic?'SYNTHETIC_EXPLORATORY':'RESEARCH_PARAMETERIZED',fieldValidated:crop.reviewStatus==='FIELD_CALIBRATED'&&soil.reviewStatus==='FIELD_CALIBRATED'}
}
