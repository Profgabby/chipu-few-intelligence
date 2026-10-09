/** CHIPU-FEW M1/M2: explicit engineering inputs, no assumed model performance. */
export type ModelFamily = "small" | "medium" | "commercial";
export type ModelId = `SS0${1|2|3|4|5}` | `MS0${1|2|3|4|5}` | `CS0${1|2|3|4|5}`;
export interface AVModel { id: ModelId; name: string; family: ModelFamily; image: string; }
const names = {
 SS: ["GardenLift","ShadeStrips","SolarPump Plot","OrchardCanopy Lite","Community Food-Energy Pod"],
 MS: ["RowSpan AV","PastureSolar","Dryland Buffer AV","HortiTrack","WaterSmart AV"],
 CS: ["AgriGrid Fixed","AgriGrid Tracker","GrazingGrid","OrchardGrid","IrrigationGrid"],
} as const;
export const AV_MODELS: AVModel[] = (Object.entries(names) as [keyof typeof names,readonly string[]][]).flatMap(([prefix,entries]) =>
 entries.map((name,i) => ({id:`${prefix}0${i+1}` as ModelId,name,family:({SS:"small",MS:"medium",CS:"commercial"} as const)[prefix],image:`/models/${prefix}0${i+1}.webp`}))
);
export interface SimulationInputs {
 modelId: ModelId;
 areaHa: number;
 pvCapacityKw: number;
 hourlyIrradianceKwhPerM2: number[];
 hourlyIrrigationM3: number[];
 pvPerformanceRatio: number; // measured or independently justified, 0..1
 pumpingSpecificEnergyKwhPerM3: number; // measured or engineering-derived
 electricityPricePerKwh?: number;
 annualizedCapitalCost?: number;
 annualOperatingCost?: number;
}
export interface SimulationOutput {
 modelId: ModelId;
 pvEnergyKwh: number;
 pumpEnergyKwh: number;
 energyBalanceKwh: number;
 irrigationM3: number;
 irrigationM3PerHa: number;
 netAnnualBenefit?: number;
 evidence: "parameterized-estimate";
}
export function simulateAV(input: SimulationInputs): SimulationOutput {
 if(!AV_MODELS.some(m=>m.id===input.modelId)) throw Error("Unknown model");
 const nonnegative = [input.areaHa,input.pvCapacityKw,input.pumpingSpecificEnergyKwhPerM3,...input.hourlyIrradianceKwhPerM2,...input.hourlyIrrigationM3];
 if(nonnegative.some(x=>!Number.isFinite(x)||x<0)||input.areaHa===0) throw Error("Invalid nonnegative engineering input");
 if(input.pvPerformanceRatio<0||input.pvPerformanceRatio>1||!Number.isFinite(input.pvPerformanceRatio)) throw Error("Invalid PV performance ratio");
 if(input.hourlyIrradianceKwhPerM2.length!==input.hourlyIrrigationM3.length) throw Error("Time series length mismatch");
 const pvEnergyKwh=input.hourlyIrradianceKwhPerM2.reduce((s,x)=>s+x,0)*input.pvCapacityKw*input.pvPerformanceRatio;
 const irrigationM3=input.hourlyIrrigationM3.reduce((s,x)=>s+x,0);
 const pumpEnergyKwh=irrigationM3*input.pumpingSpecificEnergyKwhPerM3;
 const energyBalanceKwh=pvEnergyKwh-pumpEnergyKwh;
 const hasEconomics=[input.electricityPricePerKwh,input.annualizedCapitalCost,input.annualOperatingCost].every(x=>x!==undefined&&Number.isFinite(x)&&x>=0);
 return {modelId:input.modelId,pvEnergyKwh,pumpEnergyKwh,energyBalanceKwh,irrigationM3,irrigationM3PerHa:irrigationM3/input.areaHa,
 ...(hasEconomics?{netAnnualBenefit:energyBalanceKwh*input.electricityPricePerKwh!-input.annualizedCapitalCost!-input.annualOperatingCost!}:{}),
 evidence:"parameterized-estimate"};
}
/** Same site/weather/time horizon; per-hectare normalization prevents scale bias.
 * Water savings and yield require explicit open-sun baseline/crop model and are intentionally not inferred.
 */
export function compareAV(inputs: SimulationInputs[]) {
 if(inputs.length<2) throw Error("Select at least two models");
 const hours=inputs[0].hourlyIrradianceKwhPerM2.length;
 if(inputs.some(x=>x.hourlyIrradianceKwhPerM2.length!==hours)) throw Error("Comparison horizons differ");
 return inputs.map(simulateAV);
}
