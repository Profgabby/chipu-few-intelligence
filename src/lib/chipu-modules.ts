export type ChipuModuleId =
  | 'twin'
  | 'predict'
  | 'food'
  | 'energy'
  | 'water'
  | 'people'
  | 'place'
  | 'control'
  | 'economics'
  | 'resilience'

export type ChipuModule = {
  id: ChipuModuleId
  name: string
  shortName: string
  description: string
  route: string
  status: 'implemented' | 'foundation'
  legacyRoutes?: string[]
}

export const CHIPU_MODULES: readonly ChipuModule[] = [
  { id: 'twin', name: 'CHIPU-FEW Twin', shortName: 'Twin', description: 'Integrated digital-twin and system-state engine', route: '/app/twin', status: 'implemented', legacyRoutes: ['/app/farm', '/app/twin-state', '/app/state'] },
  { id: 'predict', name: 'CHIPU-FEW Predict', shortName: 'Predict', description: 'Forecasting, uncertainty and predictive analytics', route: '/app/predict', status: 'implemented', legacyRoutes: ['/app/forecast', '/app/uncertainty', '/app/uncertainty-explorer'] },
  { id: 'food', name: 'CHIPU-FEW Food', shortName: 'Food', description: 'Crops, production, agronomy and food systems', route: '/app/food', status: 'implemented', legacyRoutes: ['/app/crops', '/app/crop', '/app/storage'] },
  { id: 'energy', name: 'CHIPU-FEW Energy', shortName: 'Energy', description: 'Photovoltaic generation, storage, loads and dispatch', route: '/app/energy', status: 'implemented' },
  { id: 'water', name: 'CHIPU-FEW Water', shortName: 'Water', description: 'Crop-water demand, irrigation, pumping and storage', route: '/app/water', status: 'implemented' },
  { id: 'people', name: 'CHIPU-FEW People', shortName: 'People', description: 'Stakeholders, adoption, behavior and decision context', route: '/app/people', status: 'foundation' },
  { id: 'place', name: 'CHIPU-FEW Place', shortName: 'Place', description: 'Location, land, infrastructure and contextual conditions', route: '/app/place', status: 'foundation', legacyRoutes: ['/app/agrivoltaics', '/app/comparison'] },
  { id: 'control', name: 'CHIPU-FEW Control', shortName: 'Control', description: 'Optimization, scheduling and operational control', route: '/app/control', status: 'implemented', legacyRoutes: ['/app/resource-allocation', '/app/resources'] },
  { id: 'economics', name: 'CHIPU-FEW Economics', shortName: 'Economics', description: 'Costs, revenues, TEA, affordability and investment analysis', route: '/app/economics', status: 'foundation' },
  { id: 'resilience', name: 'CHIPU-FEW Resilience', shortName: 'Resilience', description: 'Scenarios, vulnerability, recovery and adaptation', route: '/app/resilience', status: 'implemented', legacyRoutes: ['/app/scenarios', '/app/scenario-laboratory'] },
] as const

export const CHIPU_PRODUCT = {
  name: 'CHIPU-FEW Intelligence',
  shortName: 'CHIPU-FEW',
  descriptor: 'Integrated Predictive Decision Systems for Food–Energy–Water Management',
} as const

export const CHIPU_UTILITY_NAV = [
  { id: 'data', label: 'Data', route: '/app/data' },
  { id: 'reports', label: 'Reports', route: '/app/export' },
  { id: 'settings', label: 'Settings', route: '/app/settings' },
  { id: 'administration', label: 'Administration', route: '/app/administration' },
  { id: 'help', label: 'Help', route: '/app/help' },
] as const

export function getChipuModule(id: ChipuModuleId) {
  return CHIPU_MODULES.find(module => module.id === id)
}
