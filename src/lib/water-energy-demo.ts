// Illustrative hourly scenario, not calibrated or location-specific.
export const demoAssumptions = { areaM2: 1000, headM: 25, efficiency: 0.6, peakPvKw: 5, applicationMmH: 2, startHour: 10, endHour: 13 }
export function waterEnergyDemo() {
  const a=demoAssumptions
  const cloud=[1,0.75,0.9,0.45,0.8,1,0.65]
  return Array.from({length:168},(_,i)=>{
    const hour=i%24,day=Math.floor(i/24)
    const daylight=hour>6&&hour<18?Math.sin(Math.PI*(hour-6)/12):0
    const irrigation=hour>=a.startHour&&hour<a.endHour?a.applicationMmH:0
    const flowM3H=irrigation/1000*a.areaM2
    const pumpKw=1000*9.81*(flowM3H/3600)*a.headM/a.efficiency/1000
    return {hour:i,irrigation,pvKw:a.peakPvKw*daylight*cloud[day],pumpKw,flowM3H}
  })
}
