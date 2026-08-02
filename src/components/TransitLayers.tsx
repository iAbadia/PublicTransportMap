import { useEffect, useRef } from 'react'
import { Popup, type Map as MapLibreMap, type MapGeoJSONFeature } from 'maplibre-gl'
import { useMapStore, type Mode } from '../store/useMapStore'
import { colorForLine, LINE_COLORS, MODE_LABELS } from '../lib/tflColors'

const RAIL_MODES: Mode[] = ['tube', 'overground', 'dlr', 'elizabeth-line', 'tram']

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
  const setSelectedStation = useMapStore((s) => s.setSelectedStation)
  const setDataStatus = useMapStore((s) => s.setDataStatus)
  const popupRef = useRef<Popup | null>(null)
  const initializedRef = useRef(false)

  // One-time setup of sources + layers
  useEffect(() => {
    if (initializedRef.current) return
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

    map.fitBounds(
      [
        [-0.51, 51.29],
        [0.32, 51.7],
      ],
      { padding: 40, duration: 0 },
    )

    setDataStatus('rail', 'loaded')
  }, [map, setSelectedStation, setDataStatus])

  // React to layer toggles
  useEffect(() => {
    const activeRailModes = RAIL_MODES.filter((m) => visibleModes[m])

    const applyFilters = () => {
      if (!map.getLayer('rail-lines-layer')) return
      const lineFilter = ['in', ['get', 'mode'], ['literal', activeRailModes]]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.setFilter('rail-lines-layer', lineFilter as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.setFilter('rail-lines-casing', lineFilter as any)

      const stationFilter = ['any', ...activeRailModes.map((m) => ['in', `|${m}|`, ['get', 'modes']])]
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
  }, [map, visibleModes])

  return null
}

export { MODE_LABELS }
