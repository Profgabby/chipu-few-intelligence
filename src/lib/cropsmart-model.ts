export type Quality = 'PASS' | 'SUSPECT' | 'STALE' | 'FAIL'
export type Provenance = 'SYNTHETIC' | 'ESTIMATED' | 'PREDICTED' | 'MODELED' | 'DERIVED'

export type Zone = {
  id: string; name: string; type: string; crop: string; variety: string; stage: string
  dap: number; shade: number; soilWater: number; threshold: number; demand: number
  irrigation: number; deficitHours: number; stress: number; harvest: number
  marketable: number; radiation: number; pvPower: number; pvEnergy: number; pumpEnergy: number
}

export type Scenario = { id: string; name: string; water: number; energy: number; pump: number; pv: number; description: string }
export type ScenarioResult = { irrigation: number; waterDeficit: number; tank: number; pumpEnergy: number; pvEnergy: number; soc: number; cropRisk: number; foodRisk: number; reliability: number }

export const farmState = {
  name: 'Cedar Creek Research Farm', model: 'WE-0.3.1', dataset: 'SYNTH-7D-HOURLY-01',
  stateRun: 'STATE-0047', predictionRun: 'PRED-0048', experiment: 'EXP-014', scenario: 'S00',
  resources: { water: 2840, tank: 68, pvPower: 50.5, pvEnergy: 271, pumpPower: 38.2, pumpEnergy: 40.1, soc: 74, cooling: 18.6, reserve: 33 },
  zones: [
    { id: 'OPEN-A', name: 'Open-field reference', type: 'OPEN-FIELD REFERENCE', crop: 'Tomato', variety: 'Roma VF', stage: 'Fruit development', dap: 58, shade: 0, soilWater: .294, threshold: .24, demand: 5.6, irrigation: 4.1, deficitHours: 42, stress: .18, harvest: 72, marketable: 410, radiation: 6.4, pvPower: 0, pvEnergy: 0, pumpEnergy: 10.8 },
    { id: 'AV-A', name: 'Agrivoltaic configuration A', type: 'AGRIVOLTAIC TREATMENT', crop: 'Tomato', variety: 'Roma VF', stage: 'Fruit development', dap: 58, shade: .32, soilWater: .287, threshold: .24, demand: 5.1, irrigation: 3.5, deficitHours: 18, stress: .21, harvest: 69, marketable: 386, radiation: 4.5, pvPower: 27.4, pvEnergy: 142, pumpEnergy: 9.2 },
    { id: 'AV-B', name: 'Agrivoltaic configuration B', type: 'AGRIVOLTAIC TREATMENT', crop: 'Pepper', variety: 'Carmen', stage: 'Flowering', dap: 46, shade: .18, soilWater: .301, threshold: .25, demand: 5.8, irrigation: 4.8, deficitHours: 31, stress: .16, harvest: 54, marketable: 332, radiation: 5.3, pvPower: 23.1, pvEnergy: 129, pumpEnergy: 12.7 },
    { id: 'EXPERIMENTAL-A', name: 'Alternative experimental treatment', type: 'EXPERIMENTAL TREATMENT', crop: 'Lettuce', variety: 'Green Butter', stage: 'Vegetative', dap: 31, shade: .08, soilWater: .276, threshold: .22, demand: 3.7, irrigation: 3.1, deficitHours: 26, stress: .24, harvest: 81, marketable: 198, radiation: 5.9, pvPower: 0, pvEnergy: 0, pumpEnergy: 7.4 },
  ] as Zone[],
}

export const scenarios: Scenario[] = [
  ['S00', 'Baseline', 1, 1, .78, 1, 'Reference operating conditions.'], ['S01', 'Water Limited', .64, 1, .78, 1, 'Available water is reduced by 36%.'], ['S02', 'Energy Limited', 1, .68, .78, .72, 'PV availability and load headroom are constrained.'], ['S03', 'Combined Water–Energy Constraint', .7, .68, .78, .72, 'Coupled water and energy constraint.'], ['S04', 'Environmental Event', 1.12, 1.08, .78, .84, 'Hot, low-radiation event forcing higher demand.'], ['S05', 'Observation Degradation', 1, 1, .78, 1, 'Lower observation quality and stale sensors.'], ['S06', 'Pump Degradation', 1, 1.16, .56, 1, 'Reduced pump efficiency increases energy demand.'], ['S07', 'Harvest / Cooling Pressure', 1, 1.18, .78, 1, 'Cooling demand rises after harvest.'], ['S08', 'Battery Unavailable', 1, 1.05, .78, 1, 'Battery support is removed from allocation.'], ['S09', 'Counterfactual Management', .82, .9, .82, 1.05, 'Alternative management assumptions.']
].map(([id, name, water, energy, pump, pv, description]) => ({ id: id as string, name: name as string, water: water as number, energy: energy as number, pump: pump as number, pv: pv as number, description: description as string }))

export const getZone = (id: string) => farmState.zones.find(zone => zone.id === id) ?? farmState.zones[1]
export const getScenario = (id: string) => scenarios.find(item => item.id === id) ?? scenarios[0]

export function calculateScenario(zone: Zone, id: string, shade = zone.shade): ScenarioResult {
  const item = getScenario(id); const shadeEffect = zone.type === 'AGRIVOLTAIC TREATMENT' ? 1 - (shade - zone.shade) * .35 : 1
  const irrigation = Math.max(0, zone.irrigation * item.water * shadeEffect)
  const pumpEnergy = zone.pumpEnergy * item.energy * (.78 / item.pump)
  const pvEnergy = (zone.pvEnergy || farmState.resources.pvEnergy) * item.pv
  const cropRisk = Math.min(1, zone.stress + Math.max(0, 1 - item.water) * .22 + Math.max(0, 1 - item.energy) * .12)
  return { irrigation: +irrigation.toFixed(2), waterDeficit: +Math.max(0, (zone.threshold - (zone.soilWater + irrigation * .002)) * 1000).toFixed(2), tank: +Math.max(0, farmState.resources.tank - irrigation * .8).toFixed(1), pumpEnergy: +pumpEnergy.toFixed(2), pvEnergy: +pvEnergy.toFixed(1), soc: item.id === 'S08' ? 0 : +Math.max(8, farmState.resources.soc - pumpEnergy * .18 + pvEnergy * .025).toFixed(1), cropRisk: +cropRisk.toFixed(3), foodRisk: +Math.min(1, .18 + (100 - zone.harvest) / 240 + (id === 'S07' ? .24 : 0)).toFixed(3), reliability: +Math.max(0, 1 - cropRisk * .35 - Math.max(0, pumpEnergy - pvEnergy / 20) * .006).toFixed(3) }
}

export function observations(zoneId: string) {
  const zone = getZone(zoneId); const vars = [['soil_water_rootzone', zone.soilWater, 'm³/m³', 'soil-01'], ['air_temperature', 24, '°C', 'weather-01'], ['shortwave_radiation', zone.radiation, 'MJ/m²', 'weather-01'], ['irrigation_flow', zone.irrigation, 'mm/h', 'flow-01'], ['tank_volume', farmState.resources.tank, '%', 'tank-01'], ['pv_power', zone.pvPower || farmState.resources.pvPower, 'kW', 'pv-01']] as const
  return Array.from({ length: 168 }, (_, index) => { const day = Math.floor(index / 24); const hour = index % 24; const item = vars[index % vars.length]; const wave = Math.sin(hour / 24 * Math.PI * 2) * .08 + Math.sin(day * 1.7) * .03; const value = item[1] + (item[0] === 'air_temperature' ? wave * 18 : wave * Number(item[1])); return { id: `OBS-${1080 + index}`, time: new Date(Date.UTC(2026, 7, 26 + day, hour)).toISOString(), zoneId, sensor: item[3], variable: item[0], value: +value.toFixed(3), unit: item[2], provenance: 'SYNTHETIC' as Provenance, quality: index === 43 ? 'SUSPECT' as Quality : 'PASS' as Quality } })
}
