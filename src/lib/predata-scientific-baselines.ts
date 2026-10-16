/** Research-stage, pure, unit-explicit baselines. No field-validation claims. */
export const PRE_DATA_BASELINE_VERSION = 'PRE-DATA-0.1.0'
const finiteNonnegative = (x: number) => Number.isFinite(x) && x >= 0

export function waterBucketStep(input: {
  storageMm: number; precipitationMm: number; irrigationMm: number;
  etDemandMm: number; capacityMm: number
}) {
  const {storageMm, precipitationMm, irrigationMm, etDemandMm, capacityMm} = input
  if (![storageMm, precipitationMm, irrigationMm, etDemandMm, capacityMm].every(finiteNonnegative)
      || storageMm > capacityMm) throw new Error('Invalid water-balance inputs')
  const available = storageMm + precipitationMm + irrigationMm
  const actualEtMm = Math.min(available, etDemandMm)
  const drainageMm = Math.max(0, available - actualEtMm - capacityMm)
  const nextStorageMm = available - actualEtMm - drainageMm
  const residualMm = available - actualEtMm - drainageMm - nextStorageMm
  return {nextStorageMm, actualEtMm, drainageMm, unmetEtMm: etDemandMm - actualEtMm, residualMm}
}

export function cropEtMm(etoMm: number, kc: number) {
  if (![etoMm, kc].every(finiteNonnegative)) throw new Error('Invalid ET inputs')
  return etoMm * kc
}

export function pumpEnergyKwh(volumeM3: number, headM: number, efficiency: number) {
  if (![volumeM3, headM].every(finiteNonnegative) || !Number.isFinite(efficiency)
      || efficiency <= 0 || efficiency > 1) throw new Error('Invalid pump inputs')
  return 1000 * 9.81 * volumeM3 * headM / efficiency / 3_600_000
}

export function measuredPumpEnergyKwh(runtimeHours: number, measuredPowerKw: number) {
  if (![runtimeHours, measuredPowerKw].every(finiteNonnegative)) throw new Error('Invalid measured pump inputs')
  return runtimeHours * measuredPowerKw
}

export function pvEnergyKwh(irradiationKwhM2: number, areaM2: number, efficiency: number, performanceRatio = 1) {
  if (![irradiationKwhM2, areaM2].every(finiteNonnegative)
      || ![efficiency, performanceRatio].every(x => Number.isFinite(x) && x >= 0 && x <= 1))
    throw new Error('Invalid PV inputs')
  return irradiationKwhM2 * areaM2 * efficiency * performanceRatio
}
