import { useEffect, useRef, useState, type FormEvent } from 'react'
import { LngLatBounds, Marker, type GeoJSONSource, type Map as MapLibreMap } from 'maplibre-gl'
import type { FeatureCollection, LineString, Point } from 'geojson'
import { useMapStore } from '../store/useMapStore'
import { nearestStation, searchPlaces, type RailStation, type ReferencePoint } from '../lib/referencePoints'
import { overviewPadding } from '../lib/networkOverview'

const SOURCE = 'reference-connections'

function focusPoint(map: MapLibreMap, point: ReferencePoint, nearest?: ReturnType<typeof nearestStation>) {
  const bounds = new LngLatBounds([point.lon, point.lat], [point.lon, point.lat])
  if (nearest) bounds.extend([nearest.station.lon, nearest.station.lat])
  const padding = overviewPadding(map)
  const camera = map.cameraForBounds(bounds, { padding, maxZoom: 12 })
  if (camera?.zoom !== undefined) map.setMinZoom(Math.max(0, Math.min(map.getMinZoom(), camera.zoom - 0.5)))
  map.fitBounds(bounds, { padding, maxZoom: 12, duration: 0 })
}

export default function ReferencePoints({ map, open, onToggle }: { map: MapLibreMap | null; open: boolean; onToggle: () => void }) {
  const points = useMapStore(s => s.referencePoints)
  const add = useMapStore(s => s.addReferencePoint)
  const remove = useMapStore(s => s.removeReferencePoint)
  const visible = useMapStore(s => s.visibleModes)
  const tubeLines = useMapStore(s => s.visibleTubeLines)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ReferencePoint[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [storageError, setStorageError] = useState(false)
  const [stations, setStations] = useState<RailStation[]>([])
  const [stationError, setStationError] = useState(false)
  const request = useRef<AbortController>()

  useEffect(() => () => request.current?.abort(), [])
  useEffect(() => {
    try { localStorage.setItem('london-transit-reference-points', JSON.stringify(points)) }
    catch { setStorageError(true) }
  }, [points])

  useEffect(() => {
    if (!map) return
    const controller = new AbortController()
    void fetch(`${import.meta.env.BASE_URL}data/rail-stations.geojson`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Station data unavailable'); return response.json() as Promise<FeatureCollection<Point>> })
      .then(data => setStations(data.features.map(feature => ({
        name: String(feature.properties?.name ?? 'Station'),
        lon: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1],
        modes: String(feature.properties?.modes ?? '').split('|').filter(Boolean),
        lines: String(feature.properties?.lines ?? '').split('|').filter(Boolean),
      }))))
      .catch(() => { if (!controller.signal.aborted) setStationError(true) })
    return () => controller.abort()
  }, [map])

  const focus = (point: ReferencePoint) => {
    if (!map) return
    focusPoint(map, point, nearestStation(point, stations, visible, tubeLines))
  }

  useEffect(() => {
    if (!map) return
    const connections: FeatureCollection<LineString> = { type: 'FeatureCollection', features: [] }
    const markers = points.map(point => {
      const nearest = nearestStation(point, stations, visible, tubeLines)
      if (nearest) connections.features.push({ type: 'Feature', properties: {}, geometry: {
        type: 'LineString', coordinates: [[point.lon, point.lat], [nearest.station.lon, nearest.station.lat]],
      } })
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'reference-marker'
      button.setAttribute('aria-label', `Show ${point.name}`)
      const dot = document.createElement('span')
      dot.className = 'reference-dot'
      dot.setAttribute('aria-hidden', 'true')
      const label = document.createElement('span')
      label.className = 'reference-label'
      label.textContent = point.name
      button.append(dot, label)
      // The marker is only rebuilt when its data changes, so this handler sees
      // the same station/filter state used for the distance and connector.
      button.onclick = () => focusPoint(map, point, nearest)
      return new Marker({ element: button, anchor: 'left', offset: [-10, 0] }).setLngLat([point.lon, point.lat]).addTo(map)
    })
    if (!map.getSource(SOURCE)) {
      map.addSource(SOURCE, { type: 'geojson', data: connections })
      map.addLayer({ id: SOURCE, type: 'line', source: SOURCE, paint: {
        'line-color': '#f8cf76', 'line-width': 2, 'line-dasharray': [3, 3],
      } })
    } else (map.getSource(SOURCE) as GeoJSONSource).setData(connections)
    return () => {
      markers.forEach(marker => marker.remove())
      if (map.getLayer(SOURCE)) map.removeLayer(SOURCE)
      if (map.getSource(SOURCE)) map.removeSource(SOURCE)
    }
  }, [map, points, stations, visible, tubeLines])

  const search = async (event: FormEvent) => {
    event.preventDefault()
    if (query.trim().length < 2) return
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setStatus('loading')
    setResults([])
    try {
      const found = await searchPlaces(query.trim(), AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]))
      if (controller.signal.aborted) return
      setResults(found)
      setStatus('done')
    } catch {
      if (controller.signal.aborted) return
      setError('Place search is unavailable. Check your connection and try again.')
      setStatus('error')
    }
  }

  return <section className="reference-section" aria-label="Reference points">
    <button className="layer-disclosure" aria-expanded={open} aria-controls="reference-panel" onClick={onToggle}>
      <span>Reference points <span className="layer-count">{points.length || 'Add a place'}</span></span>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : undefined }}><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
    </button>
    <div id="reference-panel" hidden={!open} className="reference-body">
      <form onSubmit={search}>
        <label htmlFor="place-search">Find a place</label>
        <div className="place-search-row">
          <input id="place-search" type="search" value={query} placeholder="e.g. Luton Airport" minLength={2} maxLength={160} required onChange={event => {
            request.current?.abort(); setQuery(event.target.value); setStatus('idle'); setResults([])
          }} />
          <button className="search-button" disabled={!map || query.trim().length < 2 || status === 'loading'} type="submit">Search</button>
        </div>
      </form>
      <p className="search-credit">Searches sent to <a href="https://photon.komoot.io/" target="_blank" rel="noreferrer">Photon</a> · OpenStreetMap</p>
      <div role="status" className="search-status">
        {status === 'loading' && 'Searching places…'}
        {status === 'error' && error}
        {status === 'done' && (results.length ? `${results.length} places found. Select one to add a pin.` : 'No places found. Try a more specific name.')}
      </div>
      {results.length > 0 && <ul className="place-results" aria-label="Place search results">
        {results.map(point => <li key={point.id}><button disabled={points.some(p => p.id === point.id)} onClick={() => {
          add(point); setResults([]); setStatus('idle'); setQuery('')
        }}><strong>{point.name}</strong><span>{point.description}</span>{points.some(p => p.id === point.id) && <span>Already added</span>}</button></li>)}
      </ul>}
      {points.length === 0 && <p className="reference-help">Pin an airport, landmark or address to compare it with the rail network.</p>}
      {points.length > 0 && <>
        <p className="reference-help">Straight-line distance to the nearest station on visible rail layers. Not a walking route.</p>
        <ul className="saved-points" aria-label="Saved reference points">{points.map(point => {
          const nearest = nearestStation(point, stations, visible, tubeLines)
          return <li key={point.id}>
            <button className="saved-point" disabled={!map} onClick={() => focus(point)} aria-label={`Show ${point.name} and nearest station`}>
              <strong>{point.name}</strong>
              <span role="status">{nearest ? `${nearest.km.toFixed(1)} km to ${nearest.station.name}` : stationError ? 'Distance unavailable. Reload to retry.' : stations.length ? 'Enable a rail line to see distance.' : 'Loading station distances…'}</span>
            </button>
            <button className="remove-point" aria-label={`Remove ${point.name}`} onClick={() => remove(point.id)}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button>
          </li>
        })}</ul>
        <p className="search-credit">{storageError ? 'Browser storage is unavailable. Pins will last for this visit only.' : 'Pins are saved in this browser.'}</p>
      </>}
    </div>
  </section>
}
