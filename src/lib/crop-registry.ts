/** Crop-independent profiles; parameters require evidence before solver use. */
export type CropProfile = { id: string; name: string; scientificName: string; stages: { days: number; kc: number; lai: number; rootDepthCm: number }[]; sourceReference: string }
export const CROP_REGISTRY_VERSION = 'chipu.crop.v0.1'
