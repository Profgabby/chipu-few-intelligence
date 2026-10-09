/** Annual engineering screening. Presets are illustrative hypotheses, not product specifications. */
export type ModelFamily = 'small' | 'medium' | 'commercial'
export type ModelId = `SS0${1|2|3|4|5}` | `MS0${1|2|3|4|5}` | `CS0${1|2|3|4|5}`
export interface AVModel { id: ModelId; name: string; family: ModelFamily; image: string }
const names = {
  SS: ['GardenLift','ShadeStrips','SolarPump Plot','OrchardCanopy Lite','Community Food-Energy Pod'],
  MS: ['RowSpan AV','PastureSolar','Dryland Buffer AV','HortiTrack','WaterSmart AV'],
  CS: ['AgriGrid Fixed','AgriGrid Tracker','GrazingGrid','OrchardGrid','IrrigationGrid'],
} as const
export const AV_MODELS: AVModel[] = (Object.entries(names) as [keyof typeof names,readonly string[]][]).flatMap(([prefix,entries]) =>
  entries.map((name,i) => ({id:`${prefix}0${i+1}` as ModelId,name,family:({SS:'small',MS:'medium',CS:'commercial'} as const)[prefix],image:`/models/${prefix}0${i+1}.webp`})))
export interface ModelParameters {
  pvKwPerHa: number
  performanceRatio: number
  poaKwhPerM2Year: number
  netIrrigationRatio: number
  irrigationEfficiency: number
  capexPerKw: number
  opexPerKwYear: number
}
export interface ComparisonSettings {
  mode: 'equal-land' | 'equal-capacity'
  areaHa: number
  capacityKw: number
  baselineNetIrrigationMmYear: number
  baselineIrrigationEfficiency: number
  pumpHeadM: number
  pumpEfficiency: number
  electricityValuePerKwh: number
  discountRate: number
  lifetimeYears: number
}
export const DEFAULT_SETTINGS: ComparisonSettings = {
  mode:'equal-land',areaHa:1,capacityKw:100,baselineNetIrrigationMmYear:400,
  baselineIrrigationEfficiency:0.8,pumpHeadM:30,pumpEfficiency:0.6,
  electricityValuePerKwh:0.12,discountRate:0.05,lifetimeYears:25,
}
/** Deliberately synthetic density scenarios to demonstrate configuration propagation.
 * No shading, tracking, crop, or water-saving performance is inferred from images/names. */
export function createIllustrativeParameters(): Record<ModelId, ModelParameters> {
  const densities = [180,120,60,150,100,240,180,160,220,200,300,260,200,240,280]
  return Object.fromEntries(AV_MODELS.map((model,i)=>[model.id,{
    pvKwPerHa:densities[i],performanceRatio:0.8,poaKwhPerM2Year:1500,
    netIrrigationRatio:1,irrigationEfficiency:0.8,capexPerKw:1500,opexPerKwYear:25,
  }])) as Record<ModelId,ModelParameters>
}
function range(value:number,name:string,min:number,max=Number.MAX_VALUE,exclusiveMin=false) {
  if(!Number.isFinite(value)||value<min||value>max||(exclusiveMin&&value===min)) throw Error(`Invalid ${name}`)
}
export function validateSettings(s:ComparisonSettings) {
  if(!['equal-land','equal-capacity'].includes(s.mode)) throw Error('Invalid comparison mode')
  range(s.areaHa,'land area',0,Number.MAX_VALUE,true)
  range(s.capacityKw,'PV capacity',0,Number.MAX_VALUE,true)
  range(s.baselineNetIrrigationMmYear,'baseline irrigation',0)
  range(s.baselineIrrigationEfficiency,'baseline irrigation efficiency',0,1,true)
  range(s.pumpHeadM,'pump head',0)
  range(s.pumpEfficiency,'pump efficiency',0,1,true)
  range(s.electricityValuePerKwh,'electricity value',0)
  range(s.discountRate,'discount rate',0,1)
  range(s.lifetimeYears,'lifetime',1,100)
  if(!Number.isInteger(s.lifetimeYears)) throw Error('Lifetime must be whole years')
}
export function simulateAV(modelId:ModelId,p:ModelParameters,s:ComparisonSettings) {
  if(!AV_MODELS.some(m=>m.id===modelId)) throw Error('Unknown model')
  validateSettings(s)
  range(p.pvKwPerHa,'PV density',0,Number.MAX_VALUE,true)
  range(p.performanceRatio,'PV performance ratio',0,1)
  range(p.poaKwhPerM2Year,'annual plane-of-array irradiation',0)
  range(p.netIrrigationRatio,'net irrigation ratio',0,2)
  range(p.irrigationEfficiency,'irrigation efficiency',0,1,true)
  range(p.capexPerKw,'capital cost',0)
  range(p.opexPerKwYear,'operating cost',0)
  const areaHa=s.mode==='equal-land'?s.areaHa:s.capacityKw/p.pvKwPerHa
  const capacityKw=areaHa*p.pvKwPerHa
  const pvEnergyKwh=capacityKw*p.poaKwhPerM2Year*p.performanceRatio
  const baselineIrrigationM3=s.baselineNetIrrigationMmYear*10*areaHa/s.baselineIrrigationEfficiency
  const irrigationM3=s.baselineNetIrrigationMmYear*10*areaHa*p.netIrrigationRatio/p.irrigationEfficiency
  const waterSavedM3=baselineIrrigationM3-irrigationM3
  const waterSavedPct=baselineIrrigationM3>0?100*waterSavedM3/baselineIrrigationM3:null
  const pumpKwhPerM3=1000*9.81*s.pumpHeadM/(3_600_000*s.pumpEfficiency)
  const pumpEnergyKwh=irrigationM3*pumpKwhPerM3
  const baselinePumpEnergyKwh=baselineIrrigationM3*pumpKwhPerM3
  const capitalCost=capacityKw*p.capexPerKw
  const annualOperatingCost=capacityKw*p.opexPerKwYear
  const r=s.discountRate,n=s.lifetimeYears
  const annuityFactor=r===0?n:(1-Math.pow(1+r,-n))/r
  // Incremental electricity-only cash flow vs open sun. All PV valued at the entered blended tariff.
  const annualCashFlow=(pvEnergyKwh+baselinePumpEnergyKwh-pumpEnergyKwh)*s.electricityValuePerKwh-annualOperatingCost
  const npv=-capitalCost+annualCashFlow*annuityFactor
  const annualizedNetBenefit=annualCashFlow-capitalCost/annuityFactor
  const simplePaybackYears=annualCashFlow>0?capitalCost/annualCashFlow:null
  const lcoe=pvEnergyKwh>0?(capitalCost/annuityFactor+annualOperatingCost)/pvEnergyKwh:null
  const result={modelId,areaHa,capacityKw,pvEnergyKwh,pvKwhPerHa:pvEnergyKwh/areaHa,
    baselineIrrigationM3,irrigationM3,irrigationM3PerHa:irrigationM3/areaHa,waterSavedM3,waterSavedPct,
    pumpEnergyKwh,baselinePumpEnergyKwh,capitalCost,annualOperatingCost,annualCashFlow,npv,
    annualizedNetBenefit,simplePaybackYears,lcoe,evidence:'illustrative-screening' as const}
  if(Object.values(result).some(v=>typeof v==='number'&&!Number.isFinite(v))) throw Error('Inputs exceed numeric range')
  return result
}
export function compareAV(ids:ModelId[],parameters:Record<ModelId,ModelParameters>,settings:ComparisonSettings) {
  if(ids.length<2) throw Error('Select at least two models to compare')
  if(new Set(ids).size!==ids.length) throw Error('Duplicate model selection')
  return ids.map(id=>simulateAV(id,parameters[id],settings))
}
export type SimulationOutput = ReturnType<typeof simulateAV>
