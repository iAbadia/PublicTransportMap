import { defaultTubeLines, visibleRailLines } from './railVisibility.ts'

export interface ReferencePoint {
  id: string
  name: string
  description: string
  lon: number
  lat: number
}

export interface RailStation {
  name: string
  lon: number
  lat: number
  modes: string[]
  lines: string[]
}

export function distanceKm(a: { lon: number; lat: number }, b: { lon: number; lat: number }) {
  const rad = Math.PI / 180
  const h = Math.sin((b.lat - a.lat) * rad / 2) ** 2
    + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin((b.lon - a.lon) * rad / 2) ** 2
  return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1, h)))
}

export function nearestStation(point: ReferencePoint, stations: RailStation[], visible: Record<string, boolean>, tubeLines = defaultTubeLines()) {
  const activeLines = new Set(visibleRailLines(visible, tubeLines))
  let nearest: { station: RailStation; km: number } | undefined
  for (const station of stations) {
    if (!station.lines.some(line => activeLines.has(line))) continue
    const km = distanceKm(point, station)
    if (!nearest || km < nearest.km) nearest = { station, km }
  }
  return nearest
}

export function isReferencePoint(value: unknown): value is ReferencePoint {
  if (!value || typeof value !== 'object') return false
  const p = value as ReferencePoint
  return typeof p.id === 'string' && typeof p.name === 'string' && p.name.trim().length > 0
    && typeof p.description === 'string' && Number.isFinite(p.lon) && Number.isFinite(p.lat)
    && Math.abs(p.lon) <= 180 && Math.abs(p.lat) <= 85
}

export function loadReferencePoints(): ReferencePoint[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('london-transit-reference-points') ?? '[]')
    return Array.isArray(saved) ? saved.filter(isReferencePoint) : []
  } catch { return [] }
}

export async function searchPlaces(query: string, signal: AbortSignal): Promise<ReferencePoint[]> {
  const params = new URLSearchParams({ q: query, limit: '6', lat: '51.5074', lon: '-0.1276', lang: 'en' })
  const response = await fetch(`https://photon.komoot.io/api/?${params}`, { signal })
  if (!response.ok) throw new Error('Place search is unavailable. Please try again.')
  const data = await response.json()
  if (!Array.isArray(data.features)) throw new Error('Place search returned an invalid response. Please try again.')
  return data.features.flatMap((feature: { geometry?: { type?: string; coordinates?: number[] }; properties?: Record<string, unknown> }) => {
    const p = feature.properties
    const coords = feature.geometry?.coordinates
    if (!p || feature.geometry?.type !== 'Point' || !coords) return []
    const point = {
      id: `${p.osm_type}-${p.osm_id}`,
      name: typeof p.name === 'string' ? p.name : typeof p.street === 'string' ? p.street : '',
      description: [...new Set([p.city, p.county, p.country].filter((v): v is string => typeof v === 'string'))].join(', '),
      lon: coords[0], lat: coords[1],
    }
    return isReferencePoint(point) ? [point] : []
  })
}
