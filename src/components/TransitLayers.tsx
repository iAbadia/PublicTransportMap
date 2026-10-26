import { useEffect, useRef } from 'react'
import { Popup, type GeoJSONSource, type Map as MapLibreMap, type MapGeoJSONFeature } from 'maplibre-gl'
import { trackNetworkOverview } from '../lib/networkOverview'
import { useMapStore } from '../store/useMapStore'
import { visibleRailLines } from '../lib/railVisibility'
import { colorForLine, LINE_COLORS, MODE_LABELS } from '../lib/tflColors'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildLineColorExpression(): any {
  const stops: string[] = []
  for (const [id, color] of Object.entries(LINE_COLORS)) {
    stops.push(id, color)
  }
  return ['match', ['get', 'id'], ...stops, '#888888']
}

interface TransitLayersProps {
  map: MapLibreMap
}

export default function TransitLayers({ map }: TransitLayersProps) {
  const visibleModes = useMapStore((s) => s.visibleModes)
  const tubeLines = useMapStore(s => s.visibleTubeLines)
  const setSelectedStation = useMapStore((s) => s.setSelectedStation)
  const setDataStatus = useMapStore((s) => s.setDataStatus)
  const popupRef = useRef<Popup | null>(null)
  const initializedRef = useRef(false)

  // One-time setup of sources + layers
  useEffect(() => {
    if (initializedRef.current || map.getSource('rail-lines')) return
    initializedRef.current = true

    setDataStatus('rail', 'loading')

    map.addSource('rail-lines', { type: 'geojson', data: `${import.meta.env.BASE_URL}data/rail-lines.geojson` })
    map.addSource('rail-stations', {
      type: 'geojson',
      data: `${import.meta.env.BASE_URL}data/rail-stations.geojson`,
    })

    map.addLayer({
      id: 'rail-lines-casing',
      type: 'line',
      source: 'rail-lines',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#0a0a0a',
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 4, 14, 7, 18, 11],
        'line-opacity': 0.6,
      },
    })

    map.addLayer({
      id: 'rail-lines-layer',
      type: 'line',
      source: 'rail-lines',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': buildLineColorExpression(),
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 2, 14, 4, 18, 8],
      },
    })

    map.addLayer({
      id: 'rail-stations-halo',
      type: 'circle',
      source: 'rail-stations',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 3, 14, 6, 18, 12],
        'circle-color': '#0a0a0a',
      },
    })

    map.addLayer({
      id: 'rail-stations-layer',
      type: 'circle',
      source: 'rail-stations',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2, 14, 4.5, 18, 9],
        'circle-color': '#ffffff',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#0a0a0a',
      },
    })

    map.on('mouseenter', 'rail-stations-layer', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'rail-stations-layer', () => {
      map.getCanvas().style.cursor = ''
    })

    map.on('click', 'rail-stations-layer', (e) => {
      const feature = e.features?.[0] as MapGeoJSONFeature | undefined
      if (!feature || feature.geometry.type !== 'Point') return
      const [lon, lat] = feature.geometry.coordinates as [number, number]
      const props = feature.properties as { id: string; name: string; modes: string; lines: string }
      const modes = props.modes.split('|').filter(Boolean)
      const lines = props.lines.split('|').filter(Boolean)

      setSelectedStation({ id: props.id, name: props.name, lines, modes, lat, lon })

      popupRef.current?.remove()
      const html = `
        <div style="background:#171717;color:#fff;padding:12px 14px;min-width:180px;font-family:system-ui,sans-serif;">
          <div style="font-weight:600;font-size:14px;margin-bottom:6px;">${props.name}</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;">
            ${lines
              .map((id) => {
                const mode = modes[0]
                const color = colorForLine(id, mode)
                return `<span style="display:inline-block;background:${color};color:#fff;font-size:11px;padding:2px 8px;border-radius:999px;text-shadow:0 1px 2px rgba(0,0,0,0.5);">${id}</span>`
              })
              .join('')}
          </div>
        </div>`

      popupRef.current = new Popup({ closeButton: true, offset: 12 })
        .setLngLat([lon, lat])
        .setHTML(html)
        .addTo(map)
    })

  }, [map, setSelectedStation, setDataStatus])

  useEffect(() => {
    // Read the actual extent, including the Elizabeth line out to Reading.
    // Hard-coded London bounds exclude several outer stations.
    return trackNetworkOverview(map, map.getSource('rail-stations') as GeoJSONSource, () => {
      setDataStatus('rail', 'loaded')
    }, () => setDataStatus('rail', 'error'))
  }, [map, setDataStatus])

  // React to layer toggles
  useEffect(() => {
    const activeLines = visibleRailLines(visibleModes, tubeLines)

    const applyFilters = () => {
      if (!map.getLayer('rail-lines-layer')) return
      const lineFilter = ['in', ['get', 'id'], ['literal', activeLines]]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.setFilter('rail-lines-layer', lineFilter as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.setFilter('rail-lines-casing', lineFilter as any)

      const stationFilter = activeLines.length ? ['any', ...activeLines.map(id => ['in', `|${id}|`, ['get', 'lines']])] : ['==', 1, 0]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.setFilter('rail-stations-layer', stationFilter as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.setFilter('rail-stations-halo', stationFilter as any)
    }

    if (map.isStyleLoaded() && map.getLayer('rail-lines-layer')) {
      applyFilters()
    } else {
      map.once('idle', applyFilters)
    }
    return () => { map.off('idle', applyFilters) }
  }, [map, visibleModes, tubeLines])

  return null
}

export { MODE_LABELS }
