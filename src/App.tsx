import { useCallback, useState } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import MapView from './components/MapView'
import TransitLayers from './components/TransitLayers'
import BusLayer from './components/BusLayer'
import LayerControls from './components/LayerControls'
import StationPanel from './components/StationPanel'

function App() {
  const [map, setMap] = useState<MapLibreMap | null>(null)

  const onMapReady = useCallback((map: MapLibreMap) => {
    setMap(map)
  }, [])

  return (
    <main className="map-app" aria-label="London transport map">
      <MapView onMapReady={onMapReady} />
      {map && <TransitLayers map={map} />}
      {map && <BusLayer map={map} />}
      <div className="pointer-events-none absolute inset-0">
        <LayerControls map={map} />
        <StationPanel />
      </div>
    </main>
  )
}

export default App
