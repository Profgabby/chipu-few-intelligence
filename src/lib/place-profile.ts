export const systemTypes = ['Agrivoltaics', 'Open-field agriculture', 'Greenhouse / protected cropping', 'Irrigation and pumping', 'Solar PV and storage', 'Integrated food–energy–water'] as const
export type PlaceProfile = {
  id: string; name: string; country: string; region: string; district: string;
  latitude: string; longitude: string; elevation: string; timezone: string; currency: string;
  systemType: string; zone: string; experiment: string; crop: string;
  weather: string; soil: string; irrigation: string; pv: string; tariff: string;
  calibration: string; units: 'SI'; kind: 'demonstrator' | 'configured' | 'unconfigured';
}
export const demonstration: PlaceProfile = { id: 'CEDAR-CREEK', name: 'Cedar Creek demonstrator', country: '', region: '', district: '', latitude: '', longitude: '', elevation: '', timezone: 'UTC', currency: 'USD', systemType: 'Agrivoltaics', zone: 'AV-A', experiment: '', crop: '', weather: '', soil: '', irrigation: '', pv: '', tariff: '', calibration: '', units: 'SI', kind: 'demonstrator' }
export function blankProfile(country = 'US'): PlaceProfile {
  return { ...demonstration, id: crypto.randomUUID(), name: '', country, region: country === 'US' ? 'Oregon' : '', district: '', timezone: country === 'US' ? 'America/Los_Angeles' : country === 'NG' ? 'Africa/Lagos' : 'UTC', currency: country === 'NG' ? 'NGN' : country === 'US' ? 'USD' : '', zone: '', kind: 'configured' }
}
export function validateProfile(p: PlaceProfile): string | null {
  if (!p.name.trim() || !/^[A-Z]{2}$/.test(p.country) || !p.region.trim() || !p.zone.trim()) return 'Enter a site name, country, state/region and parcel/zone.'
  if (!systemTypes.includes(p.systemType as typeof systemTypes[number])) return 'Choose a supported system description.'
  for (const [label, value, min, max] of [['Latitude',p.latitude,-90,90],['Longitude',p.longitude,-180,180]] as const) {
    if (value !== '' && (!Number.isFinite(Number(value)) || Number(value)<min || Number(value)>max)) return `${label} must be between ${min} and ${max}.`
  }
  if (!!p.latitude !== !!p.longitude) return 'Provide both latitude and longitude, or leave both blank.'
  if (p.elevation && !Number.isFinite(Number(p.elevation))) return 'Elevation must be a number in metres.'
  try { new Intl.DateTimeFormat('en', { timeZone: p.timezone }) } catch { return 'Enter a valid IANA timezone, for example Africa/Lagos.' }
  if (!/^[A-Z]{3}$/.test(p.currency)) return 'Enter a three-letter currency code.'
  if (p.tariff && (!Number.isFinite(Number(p.tariff)) || Number(p.tariff)<0)) return 'Electricity tariff must be a nonnegative number.'
  return null
}
export function readProfiles(): PlaceProfile[] {
  try { const rows = JSON.parse(localStorage.getItem('chipu_place_profiles_v1') || '[]'); return [demonstration, ...(Array.isArray(rows) ? rows.filter((p: PlaceProfile) => p?.kind === 'configured' && typeof p.id === 'string' && !validateProfile(p)) : [])] } catch { return [demonstration] }
}

export const unconfigured: PlaceProfile = { ...demonstration, id: '', name: 'Select a site', zone: '', country: '', region: '', currency: '', kind: 'unconfigured' }
export function initialProfileId(profiles: PlaceProfile[], current: string, legacy: string): string {
  if (current && profiles.some(p=>p.id===current)) return current
  return profiles.find(p=>p.id===legacy && p.kind==='configured')?.id ?? ''
}
