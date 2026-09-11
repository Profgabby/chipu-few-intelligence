export const ECONOMICS_MODEL_VERSION='CHIPU-ECONOMICS-0.1.0'
export type EconomicInputs={capex:number;annualOpex:number;annualEnergyBenefit:number;annualWaterBenefit:number;annualProductionBenefit:number;annualAvoidedLoss:number;annualOtherBenefit:number;analysisYears:number;discountRate:number}
export type EconomicResult=EconomicInputs&{annualGrossBenefit:number;annualNetBenefit:number;npv:number;simplePaybackYears:number|null;discountedPaybackYears:number|null;lifecycleCost:number;modelVersion:string;notes:string[]}
export function calculateEconomics(i:EconomicInputs):EconomicResult{
  if(i.capex<0||i.annualOpex<0)throw new Error('CAPEX and OPEX must be non-negative.')
  if(i.analysisYears<1||i.analysisYears>100)throw new Error('Analysis years must be between 1 and 100.')
  if(i.discountRate<0||i.discountRate>1)throw new Error('Discount rate must be between 0 and 1.')
  const gross=i.annualEnergyBenefit+i.annualWaterBenefit+i.annualProductionBenefit+i.annualAvoidedLoss+i.annualOtherBenefit
  const net=gross-i.annualOpex
  let npv=-i.capex,lifecycle=i.capex,discounted=-i.capex,discountedPayback:number|null=null
  for(let y=1;y<=i.analysisYears;y++){const factor=Math.pow(1+i.discountRate,y);npv+=net/factor;lifecycle+=i.annualOpex/factor;discounted+=net/factor;if(discountedPayback===null&&discounted>=0)discountedPayback=y}
  const simple=net>0?i.capex/net:null
  return {...i,annualGrossBenefit:+gross.toFixed(2),annualNetBenefit:+net.toFixed(2),npv:+npv.toFixed(2),simplePaybackYears:simple===null?null:+simple.toFixed(2),discountedPaybackYears:discountedPayback,lifecycleCost:+lifecycle.toFixed(2),modelVersion:ECONOMICS_MODEL_VERSION,notes:['Results depend entirely on entered assumptions and do not constitute an investment recommendation.','IRR, LCOE and cost-of-water require additional project-specific cash-flow or production denominators and are not fabricated when those inputs are absent.']}
}
