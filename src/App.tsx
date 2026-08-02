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
    <div className="relative h-screen w-screen bg-neutral-950">
      <MapView onMapReady={onMapReady} />
      {map && <TransitLayers map={map} />}
      {map && <BusLayer map={map} />}
      <div className="pointer-events-none absolute inset-0">
        <LayerControls />
        <StationPanel />
      </div>
    </div>
  )
}

export default App
