export type ObservationProvenance = 'MEASURED' | 'MANUAL' | 'MODELED' | 'PREDICTED' | 'SYNTHETIC' | 'DERIVED'
export type ObservationQuality = 'PASS' | 'SUSPECT' | 'STALE' | 'FAIL'

export type VariableDefinition = {
  key: string
  label: string
  unit: string
  min: number
  max: number
  description: string
  sourceTypes: ObservationProvenance[]
  category: 'WATER' | 'ENERGY' | 'ENVIRONMENT' | 'CROP' | 'INFRASTRUCTURE'
}

export const provenanceClasses: ObservationProvenance[] = [
  'MEASURED',
  'MANUAL',
  'MODELED',
  'PREDICTED',
  'SYNTHETIC',
  'DERIVED',
]

export const qualityFlags: ObservationQuality[] = ['PASS', 'SUSPECT', 'STALE', 'FAIL']

export const variableRegistry: VariableDefinition[] = [
  {
    key: 'soil_water_rootzone',
    label: 'Root-zone soil water',
    unit: 'm³/m³',
    min: 0,
    max: 0.65,
    description: 'Volumetric water content represented for the active root zone.',
    sourceTypes: ['MEASURED', 'MANUAL', 'MODELED', 'PREDICTED', 'SYNTHETIC', 'DERIVED'],
    category: 'WATER',
  },
  {
    key: 'pv_power',
    label: 'PV power',
    unit: 'kW',
    min: 0,
    max: 5000,
    description: 'Instantaneous direct-current or metered system power associated with the PV subsystem.',
    sourceTypes: ['MEASURED', 'MANUAL', 'MODELED', 'PREDICTED', 'SYNTHETIC', 'DERIVED'],
    category: 'ENERGY',
  },
  {
    key: 'pump_power',
    label: 'Pump power',
    unit: 'kW',
    min: 0,
    max: 2000,
    description: 'Instantaneous electrical demand of the irrigation pumping system.',
    sourceTypes: ['MEASURED', 'MANUAL', 'MODELED', 'PREDICTED', 'SYNTHETIC', 'DERIVED'],
    category: 'ENERGY',
  },
  {
    key: 'water_flow',
    label: 'Water flow',
    unit: 'L/min',
    min: 0,
    max: 100000,
    description: 'Measured or modeled volumetric flow through the irrigation delivery system.',
    sourceTypes: ['MEASURED', 'MANUAL', 'MODELED', 'PREDICTED', 'SYNTHETIC', 'DERIVED'],
    category: 'WATER',
  },
  {
    key: 'irrigation_pressure',
    label: 'Irrigation pressure',
    unit: 'kPa',
    min: 0,
    max: 5000,
    description: 'Hydraulic pressure at the monitored irrigation line or manifold.',
    sourceTypes: ['MEASURED', 'MANUAL', 'MODELED', 'SYNTHETIC', 'DERIVED'],
    category: 'INFRASTRUCTURE',
  },
  {
    key: 'tank_level',
    label: 'Tank level',
    unit: '%',
    min: 0,
    max: 100,
    description: 'Available water-storage level as a percentage of configured tank capacity.',
    sourceTypes: ['MEASURED', 'MANUAL', 'MODELED', 'PREDICTED', 'SYNTHETIC', 'DERIVED'],
    category: 'WATER',
  },
  {
    key: 'air_temperature',
    label: 'Air temperature',
    unit: '°C',
    min: -40,
    max: 65,
    description: 'Near-surface air temperature associated with the monitored field or zone.',
    sourceTypes: ['MEASURED', 'MANUAL', 'MODELED', 'PREDICTED', 'SYNTHETIC', 'DERIVED'],
    category: 'ENVIRONMENT',
  },
  {
    key: 'relative_humidity',
    label: 'Relative humidity',
    unit: '%',
    min: 0,
    max: 100,
    description: 'Relative humidity at the monitored field or zone.',
    sourceTypes: ['MEASURED', 'MANUAL', 'MODELED', 'PREDICTED', 'SYNTHETIC', 'DERIVED'],
    category: 'ENVIRONMENT',
  },
  {
    key: 'shortwave_radiation',
    label: 'Shortwave radiation',
    unit: 'W/m²',
    min: 0,
    max: 1600,
    description: 'Incoming shortwave irradiance at the observation location.',
    sourceTypes: ['MEASURED', 'MANUAL', 'MODELED', 'PREDICTED', 'SYNTHETIC', 'DERIVED'],
    category: 'ENVIRONMENT',
  },
  {
    key: 'par',
    label: 'Photosynthetically active radiation',
    unit: 'µmol/m²/s',
    min: 0,
    max: 3500,
    description: 'Photosynthetically active photon flux density for crop-light analysis.',
    sourceTypes: ['MEASURED', 'MANUAL', 'MODELED', 'PREDICTED', 'SYNTHETIC', 'DERIVED'],
    category: 'ENVIRONMENT',
  },
  {
    key: 'canopy_temperature',
    label: 'Canopy temperature',
    unit: '°C',
    min: -20,
    max: 70,
    description: 'Crop canopy temperature from infrared or modeled observations.',
    sourceTypes: ['MEASURED', 'MANUAL', 'MODELED', 'PREDICTED', 'SYNTHETIC', 'DERIVED'],
    category: 'CROP',
  },
  {
    key: 'battery_soc',
    label: 'Battery state of charge',
    unit: '%',
    min: 0,
    max: 100,
    description: 'Available battery state of charge expressed as percentage of configured capacity.',
    sourceTypes: ['MEASURED', 'MANUAL', 'MODELED', 'PREDICTED', 'SYNTHETIC', 'DERIVED'],
    category: 'ENERGY',
  },
  {
    key: 'wind_speed',
    label: 'Wind speed',
    unit: 'm/s',
    min: 0,
    max: 80,
    description: 'Wind speed used for environmental and energy-model forcing.',
    sourceTypes: ['MEASURED', 'MANUAL', 'MODELED', 'PREDICTED', 'SYNTHETIC'],
    category: 'ENVIRONMENT',
  },
]

export const variableByKey = Object.fromEntries(variableRegistry.map(item => [item.key, item])) as Record<string, VariableDefinition>

export function validateVariableValue(variable: string, value: number, unit: string) {
  const definition = variableByKey[variable]
  if (!definition) return { quality: 'FAIL' as ObservationQuality, message: 'Unknown variable.' }
  if (!Number.isFinite(value)) return { quality: 'FAIL' as ObservationQuality, message: 'Value must be numeric.' }
  if (unit !== definition.unit) return { quality: 'FAIL' as ObservationQuality, message: `Expected unit ${definition.unit}.` }
  if (value < definition.min || value > definition.max) {
    return { quality: 'SUSPECT' as ObservationQuality, message: `Outside expected range ${definition.min}–${definition.max} ${definition.unit}.` }
  }
  return { quality: 'PASS' as ObservationQuality, message: 'Valid.' }
}
