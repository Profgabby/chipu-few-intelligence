import { useState } from 'react'
import { AV_MODELS, DEFAULT_SETTINGS, compareAV, createIllustrativeParameters, type ModelId, type ModelParameters, type ComparisonSettings, type SimulationOutput } from '../lib/avModelLaboratory'
import '../av-model-laboratory.css'

type NumberFieldProps = { label:string; value:number; onChange:(value:number)=>void; min?:number; max?:number; step?:number }
function NumberField({label,value,onChange,min=0,max,step=0.01}:NumberFieldProps) {
  return <label className="av-field">{label}<input type="number" value={Number.isNaN(value)?'':value} min={min} max={max} step={step} required onChange={event=>onChange(event.target.valueAsNumber)}/></label>
}
const format=(n:number|null,digits=0)=>n===null?'N/A':n.toLocaleString('en-US',{maximumFractionDigits:digits})
export function AVModelLaboratoryWorkspace() {
  const [selected,setSelected]=useState<ModelId[]>(['SS01','MS01','CS01'])
  const [family,setFamily]=useState('all')
  const [parameters,setParameters]=useState(createIllustrativeParameters)
  const [settings,setSettings]=useState<ComparisonSettings>({...DEFAULT_SETTINGS})
  const [results,setResults]=useState<SimulationOutput[]|null>(null)
  const [error,setError]=useState('')
  const invalidate=()=>{setResults(null);setError('')}
  function updateSetting<K extends keyof ComparisonSettings>(key:K,value:ComparisonSettings[K]) {setSettings(s=>({...s,[key]:value}));invalidate()}
  function updateParameter(id:ModelId,key:keyof ModelParameters,value:number) {setParameters(p=>({...p,[id]:{...p[id],[key]:value}}));invalidate()}
  function choose(ids:ModelId[]) {setSelected(ids);invalidate()}
  function run() {try {setResults(compareAV(selected,parameters,settings));setError('')} catch(e) {setResults(null);setError(e instanceof Error?e.message:'Unable to compare models')}}
  function download() {
    if(!results) return
    const payload={schemaVersion:'av-lab-1.0',generatedAt:new Date().toISOString(),evidence:'illustrative-screening',
      scope:'Independent annual manual-input experiment; not connected to site weather, HYDRUS, or field observations.',
      limitations:'No crop yield, shading physics, dispatch, degradation, tax or financing model. All PV valued at one blended tariff. Presets are synthetic, not engineering specifications.',settings,
      models:selected.map(id=>({id,parameters:parameters[id]})),results}
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}))
    const anchor=document.createElement('a');anchor.href=url;anchor.download='chipu-av-comparison.json';anchor.click();URL.revokeObjectURL(url)
  }
  return <div className="av-lab">
    <header><p className="av-eyebrow">LIFEWS · CHIPU-FEW Intelligence</p><h1>Agrivoltaic Model Laboratory</h1><p>Select configurations, inspect assumptions, and compare annual water, energy and electricity-only economics.</p></header>
    <aside className="av-notice"><strong>Illustrative engineering screening — not validated predictions</strong><p>This is an independent manual-input experiment. The location shown above does not supply this laboratory’s weather or crop data. Images are concept illustrations; the editable presets are synthetic examples, not measured model specifications. Water savings start at zero.</p></aside>
    <section aria-labelledby="av-select"><h2 id="av-select">1. Choose models</h2><div className="av-toolbar"><label>Family <select value={family} onChange={e=>setFamily(e.target.value)}><option value="all">All 15 models</option><option value="small">Small scale</option><option value="medium">Medium scale</option><option value="commercial">Commercial scale</option></select></label><button type="button" onClick={()=>choose(AV_MODELS.map(m=>m.id))}>Select all 15</button><button type="button" onClick={()=>choose([])}>Clear selection</button><span aria-live="polite">{selected.length} selected across all families</span></div>
      <div className="av-cards">{AV_MODELS.filter(m=>family==='all'||m.family===family).map(m=><label key={m.id} className={`av-card ${selected.includes(m.id)?'av-selected':''}`}><img src={m.image} alt={`${m.name} agrivoltaic concept`} loading="lazy" width="1600" height="900"/><span><input type="checkbox" checked={selected.includes(m.id)} onChange={()=>choose(selected.includes(m.id)?selected.filter(id=>id!==m.id):[...selected,m.id])}/><strong>{m.id} · {m.name}</strong></span><small>{m.family} scale · illustrative {parameters[m.id].pvKwPerHa} kW/ha</small></label>)}</div>
    </section>
    <form onSubmit={e=>{e.preventDefault();run()}}>
      <section aria-labelledby="av-boundary"><h2 id="av-boundary">2. Set shared comparison conditions</h2><p>All results cover one representative year. Each model is compared with open sun on its own land area; use per-hectare values when land areas differ.</p><div className="av-fields">
        <label className="av-field">Comparison basis<select value={settings.mode} onChange={e=>updateSetting('mode',e.target.value as ComparisonSettings['mode'])}><option value="equal-land">Equal land area</option><option value="equal-capacity">Equal PV capacity</option></select></label>
        {settings.mode==='equal-land'?<NumberField label="Land area (ha)" value={settings.areaHa} min={0.01} onChange={v=>updateSetting('areaHa',v)}/>:<NumberField label="PV capacity (kW)" value={settings.capacityKw} min={0.01} onChange={v=>updateSetting('capacityKw',v)}/>}
        <NumberField label="Open-sun net irrigation (mm/year)" value={settings.baselineNetIrrigationMmYear} onChange={v=>updateSetting('baselineNetIrrigationMmYear',v)}/>
        <NumberField label="Open-sun irrigation efficiency (0–1)" value={settings.baselineIrrigationEfficiency} min={0.01} max={1} onChange={v=>updateSetting('baselineIrrigationEfficiency',v)}/>
      </div><details><summary>Shared pump and economic assumptions</summary><div className="av-fields">
        <NumberField label="Total dynamic pump head (m)" value={settings.pumpHeadM} onChange={v=>updateSetting('pumpHeadM',v)}/>
        <NumberField label="Wire-to-water pump efficiency (0–1)" value={settings.pumpEfficiency} min={0.01} max={1} onChange={v=>updateSetting('pumpEfficiency',v)}/>
        <NumberField label="Blended electricity value (USD/kWh)" value={settings.electricityValuePerKwh} onChange={v=>updateSetting('electricityValuePerKwh',v)}/>
        <NumberField label="Discount rate (fraction)" value={settings.discountRate} max={1} onChange={v=>updateSetting('discountRate',v)}/>
        <NumberField label="Project life (years)" value={settings.lifetimeYears} min={1} max={100} step={1} onChange={v=>updateSetting('lifetimeYears',v)}/>
      </div></details></section>
      <section aria-labelledby="av-assumptions"><h2 id="av-assumptions">3. Review model assumptions</h2><p>Different default PV densities demonstrate parameter propagation only. They do not establish which design performs better. No tracking or shading advantage is assumed. Replace values with justified site-specific inputs.</p>
        {selected.map(id=><details key={id}><summary>{id} · {AV_MODELS.find(m=>m.id===id)?.name} — edit parameters</summary><div className="av-fields">
          <NumberField label="Installed PV density (kW/ha)" value={parameters[id].pvKwPerHa} min={0.01} onChange={v=>updateParameter(id,'pvKwPerHa',v)}/>
          <NumberField label="PV performance ratio (0–1)" value={parameters[id].performanceRatio} max={1} onChange={v=>updateParameter(id,'performanceRatio',v)}/>
          <NumberField label="Annual plane-of-array irradiation (kWh/m²)" value={parameters[id].poaKwhPerM2Year} onChange={v=>updateParameter(id,'poaKwhPerM2Year',v)}/>
          <NumberField label="Net irrigation / open-sun ratio (0–2)" value={parameters[id].netIrrigationRatio} max={2} onChange={v=>updateParameter(id,'netIrrigationRatio',v)}/>
          <NumberField label="Irrigation application efficiency (0–1)" value={parameters[id].irrigationEfficiency} min={0.01} max={1} onChange={v=>updateParameter(id,'irrigationEfficiency',v)}/>
          <NumberField label="Installed capital cost (USD/kW)" value={parameters[id].capexPerKw} onChange={v=>updateParameter(id,'capexPerKw',v)}/>
          <NumberField label="Operating cost (USD/kW/year)" value={parameters[id].opexPerKwYear} onChange={v=>updateParameter(id,'opexPerKwYear',v)}/>
        </div></details>)}
        <div className="av-toolbar"><button className="av-primary" type="submit" disabled={selected.length<2}>Run comparison</button><span>Select at least two models.</span></div>
        {error?<p role="alert">{error}</p>:null}
      </section>
    </form>
    <section aria-labelledby="av-results"><h2 id="av-results">4. Compare results</h2>{results?<><p role="status">{results.length} models compared · illustrative annual estimates</p><button type="button" onClick={download}>Export inputs &amp; results (JSON)</button><div className="av-table-scroll" tabIndex={0} role="region" aria-label="Scrollable model comparison"><table><caption>Annual totals unless specified. Economics are incremental vs open sun and exclude crop revenue.</caption><thead><tr>{['Model','Area (ha)','PV (kW)','PV (kWh)','PV (kWh/ha)','Irrigation (m³/ha)','Water saved (%)','Pump (kWh)','CAPEX (USD)','Annualized benefit (USD/year)','NPV (USD)','Payback (years)','LCOE (USD/kWh)'].map(t=><th key={t} scope="col">{t}</th>)}</tr></thead><tbody>{results.map(r=><tr key={r.modelId}><th scope="row">{r.modelId}</th>{[format(r.areaHa,2),format(r.capacityKw,1),format(r.pvEnergyKwh),format(r.pvKwhPerHa),format(r.irrigationM3PerHa),format(r.waterSavedPct,1),format(r.pumpEnergyKwh),format(r.capitalCost),format(r.annualizedNetBenefit),format(r.npv),format(r.simplePaybackYears,1),format(r.lcoe,3)].map((v,i)=><td key={i}>{v}</td>)}</tr>)}</tbody></table></div></>:<p>Run a comparison to see results. Changing inputs clears previous results.</p>}</section>
    <details><summary>Methods and research limits</summary><p>PV = capacity × annual plane-of-array irradiation ÷ 1 kW/m² × performance ratio. Irrigation = net depth × 10 × hectares × irrigation ratio ÷ application efficiency. Pump energy = volume × 1,000 × 9.81 × head ÷ (3,600,000 × efficiency).</p><p>Water saved compares gross applied irrigation with the same-area open-sun baseline; negative values mean more water use. A zero baseline gives N/A percent savings. The irrigation ratio is an input hypothesis, not a predicted crop response.</p><p>Economic cash flow = (PV electricity + baseline pump electricity − model pump electricity) × blended electricity value − annual OPEX. NPV discounts constant annual cash flow; annualized benefit subtracts annualized capital cost. LCOE includes capital and OPEX only. Payback is undiscounted and may exceed project life. No dispatch, export limits, degradation, replacement, tax, financing or crop income is modeled.</p><p>Crop yield, microclimate, HYDRUS coupling, observed-data validation and uncertainty are not implemented here. This M1/M2 screen is not a validated digital twin or a recommendation to purchase a system.</p></details>
  </div>
}
