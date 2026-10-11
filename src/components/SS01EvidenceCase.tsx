import { useMemo, useState } from 'react'
import configuration from '../../docs/model-laboratory/ss01-v0.1/SS01-parameters.json'
import layoutUrl from '../../docs/model-laboratory/ss01-v0.1/SS01-dimensioned-layout.svg'
import parametersUrl from '../../docs/model-laboratory/ss01-v0.1/SS01-parameters.json?url'
import { DEFAULT_SETTINGS, createIllustrativeParameters, simulateAV } from '../lib/avModelLaboratory'
import { AVSubsystems } from './AVSubsystems'

export function SS01EvidenceCase() {
  const [inputs,setInputs]=useState({capacity:5.16,cropArea:48,poa:1500,pr:.8,head:30,pumpEfficiency:.6,irrigationEfficiency:.8,capex:1500,opex:25,tariff:.12,discount:.05,life:25})
  const [edited,setEdited]=useState(false)
  const computed=useMemo(()=>{try{
    if(!Number.isFinite(inputs.cropArea)||inputs.cropArea<=0||!Number.isFinite(inputs.capacity)||inputs.capacity<=0)throw Error('Enter positive crop area and PV capacity.')
    const settings={...DEFAULT_SETTINGS,areaHa:inputs.cropArea/10000,pumpHeadM:inputs.head,pumpEfficiency:inputs.pumpEfficiency,electricityValuePerKwh:inputs.tariff,discountRate:inputs.discount,lifetimeYears:inputs.life,baselineIrrigationEfficiency:inputs.irrigationEfficiency}
    const parameters=createIllustrativeParameters();parameters.SS01={...parameters.SS01,pvKwPerHa:inputs.capacity/settings.areaHa,poaKwhPerM2Year:inputs.poa,performanceRatio:inputs.pr,irrigationEfficiency:inputs.irrigationEfficiency,capexPerKw:inputs.capex,opexPerKwYear:inputs.opex}
    return {settings,parameters,results:[simulateAV('SS01',parameters.SS01,settings)],error:''}
  }catch(e){return {error:e instanceof Error?e.message:'Invalid inputs'}}},[inputs])
  const fields:[keyof typeof inputs,string,number,number][]=[['capacity','PV capacity (kWp)',.01,100000],['cropArea','Modeled cropped area (m²)',.01,10000000],['poa','Annual plane-of-array irradiation (kWh/m²)',0,10000],['pr','PV performance ratio',0,1],['head','Pump head (m)',0,1000],['pumpEfficiency','Pump efficiency',.01,1],['irrigationEfficiency','Irrigation efficiency',.01,1],['capex','Capital cost (USD/kW)',0,100000],['opex','Annual operating cost (USD/kW)',0,10000],['tariff','Import electricity price (USD/kWh)',0,100],['discount','Discount rate (fraction)',0,1],['life','Project life (whole years)',1,100]]
  return <section aria-labelledby="ss01-case"><h2 id="ss01-case">SS01 versus open sun — simulation</h2>
    <p><strong>{edited?'Custom parameter scenario':'Assumed SS01 scenario'}</strong> · Results recalculate as you edit. Start with assumed inputs or replace them with your measurements and upload daily data below.</p>
    <p>This is a simplified scenario simulation. Shading, microclimate offsets and crop light response are input assumptions. “Live” recalculation means immediate browser updates; no sensor stream is connected.</p>
    <details><summary>SS01 layout and design parameters</summary><p>12 modules × 430 Wp = 5.16 kWp; two rows at 6 m pitch; 20° tilt; 144 m² gross plot and 48 m² cropped beds per treatment. Scenario inputs below can differ from this reference layout.</p><img src={layoutUrl} alt="SS01 dimensioned plans and side elevation" style={{width:'100%',height:'auto'}}/><div className="av-toolbar"><a href={layoutUrl} target="_blank" rel="noreferrer">Open full-size layout</a><a href={layoutUrl} download>Download layout (SVG)</a><a href={parametersUrl} download>Download design parameters (JSON)</a></div></details>
    <h3>Your system inputs</h3><div className="av-fields">{fields.map(([key,label,min,max])=><label className="av-field" key={key}>{label}<input type="number" step={key==='life'?1:'any'} min={min} max={max} value={Number.isNaN(inputs[key])?'':inputs[key]} onChange={e=>{setInputs(p=>({...p,[key]:e.target.valueAsNumber}));setEdited(true)}}/></label>)}</div>
    <p>Water and crop calculations use {Number.isFinite(inputs.cropArea)?inputs.cropArea:'—'} m² of cropped area in each treatment. Per-hectare values use cropped area, not the {configuration.derived.plot_area_m2} m² gross reference plot. PV generation uses the entered annual irradiation; imported daily irradiation determines its seasonal distribution.</p>
    {computed.results&&computed.parameters&&computed.settings?<AVSubsystems instant results={computed.results} parameters={computed.parameters} settings={computed.settings}/>:<p role="alert">{computed.error}</p>}
  </section>
}
