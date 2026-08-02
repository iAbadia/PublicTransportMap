import { useEffect, useRef } from 'react'
import { Popup, type Map as MapLibreMap, type MapGeoJSONFeature } from 'maplibre-gl'
import { useMapStore } from '../store/useMapStore'

const BUS_RED = '#DC241F'

interface BusLayerProps {
  map: MapLibreMap
}

export default function BusLayer({ map }: BusLayerProps) {
  const busVisible = useMapStore((s) => s.visibleModes.bus)
  const setSelectedStation = useMapStore((s) => s.setSelectedStation)
  const setDataStatus = useMapStore((s) => s.setDataStatus)
  const dataStatus = useMapStore((s) => s.dataStatus.bus)
  const popupRef = useRef<Popup | null>(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!busVisible || loadedRef.current) return
    loadedRef.current = true
    setDataStatus('bus', 'loading')

    map.addSource('bus-lines', { type: 'geojson', data: `${import.meta.env.BASE_URL}data/bus-lines.geojson` })
    map.addSource('bus-stops', { type: 'geojson', data: `${import.meta.env.BASE_URL}data/bus-stops.geojson` })

    map.addLayer(
      {
        id: 'bus-lines-layer',
        type: 'line',
        source: 'bus-lines',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': BUS_RED,
          'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.6, 14, 1.6, 18, 3.5],
          'line-opacity': 0.55,
        },
      },
      'rail-lines-casing',
    )

    map.addLayer({
      id: 'bus-stops-layer',
      type: 'circle',
      source: 'bus-stops',
      minzoom: 13,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 1.5, 16, 3, 18, 5],
        'circle-color': BUS_RED,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#0a0a0a',
      },
    })

    map.on('mouseenter', 'bus-stops-layer', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'bus-stops-layer', () => {
      map.getCanvas().style.cursor = ''
    })

    map.on('click', 'bus-stops-layer', (e) => {
      const feature = e.features?.[0] as MapGeoJSONFeature | undefined
      if (!feature || feature.geometry.type !== 'Point') return
      const [lon, lat] = feature.geometry.coordinates as [number, number]
      const props = feature.properties as { id: string; name: string; routes: string }
      const routes = props.routes.split('|').filter(Boolean)

      setSelectedStation({ id: props.id, name: props.name, lines: routes, modes: ['bus'], lat, lon })

      popupRef.current?.remove()
      const html = `
        <div style="background:#171717;color:#fff;padding:12px 14px;min-width:180px;font-family:system-ui,sans-serif;">
          <div style="font-weight:600;font-size:14px;margin-bottom:6px;">${props.name}</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;">
            ${routes
              .map(
                (r) =>
                  `<span style="display:inline-block;background:${BUS_RED};color:#fff;font-size:11px;font-weight:600;padding:2px 7px;border-radius:4px;">${r}</span>`,
              )
              .join('')}
          </div>
        </div>`

      popupRef.current = new Popup({ closeButton: true, offset: 12 }).setLngLat([lon, lat]).setHTML(html).addTo(map)
    })

    const src = map.getSource('bus-lines')
    const checkLoaded = () => {
      if (map.isSourceLoaded('bus-lines') && map.isSourceLoaded('bus-stops')) {
        setDataStatus('bus', 'loaded')
        map.off('sourcedata', checkLoaded)
      }
    }
    if (src) map.on('sourcedata', checkLoaded)
  }, [busVisible, map, setSelectedStation, setDataStatus])

  useEffect(() => {
    if (!loadedRef.current) return
    const visibility = busVisible ? 'visible' : 'none'
    if (map.getLayer('bus-lines-layer')) map.setLayoutProperty('bus-lines-layer', 'visibility', visibility)
    if (map.getLayer('bus-stops-layer')) map.setLayoutProperty('bus-stops-layer', 'visibility', visibility)
  }, [busVisible, map])

  if (dataStatus === 'loading') {
    return (
      <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-neutral-900/90 px-4 py-1.5 text-xs text-neutral-200 shadow-lg backdrop-blur-md">
        Loading bus routes…
      </div>
    )
  }
  return null
}
