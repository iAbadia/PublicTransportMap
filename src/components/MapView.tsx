import { useEffect, useRef } from 'react'
import { Map as MapLibreMap, NavigationControl, GeolocateControl, ScaleControl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const LONDON_CENTER: [number, number] = [-0.1276, 51.5074]
const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

interface MapViewProps {
  onMapReady: (map: MapLibreMap) => void
}

export default function MapView({ onMapReady }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new MapLibreMap({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      center: LONDON_CENTER,
      zoom: 11,
      minZoom: 5,
      maxZoom: 18,
      attributionControl: { compact: true },
    })

    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new GeolocateControl({ positionOptions: { enableHighAccuracy: true } }), 'top-right')
    map.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-left')

    map.on('load', () => {
      mapRef.current = map
      onMapReady(map)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0 }}
    />
  )
}
