import { LngLatBounds, type GeoJSONSource, type Map as MapLibreMap } from 'maplibre-gl'
import { useMapStore } from '../store/useMapStore'

export function overviewPadding(map: MapLibreMap) {
  const container = map.getContainer()
  const rect = container.getBoundingClientRect()
  const panel = container.parentElement?.querySelector('.layer-panel')?.getBoundingClientRect()
  const mobile = container.clientWidth <= 600
  return {
    top: Math.min(mobile ? (panel?.bottom ?? rect.top + 134) - rect.top + 24 : 48, container.clientHeight * 0.6),
    bottom: 48,
    left: Math.min(mobile ? 24 : (panel?.right ?? rect.left + 316) - rect.left + 24, container.clientWidth * 0.45),
    right: 72,
  }
}

/** Keep the full network reachable at every viewport size, including behind UI. */
export function trackNetworkOverview(
  map: MapLibreMap,
  source: GeoJSONSource,
  onLoaded: () => void,
  onError: () => void,
) {
  let disposed = false
  let bounds: LngLatBounds | undefined
  let overviewZoom = 0

  const update = (initial = false) => {
    if (!bounds || disposed) return
    const wasOverview = initial || map.getZoom() <= overviewZoom + 0.05
    const padding = overviewPadding(map)
    const fullBounds = new LngLatBounds(bounds.getSouthWest(), bounds.getNorthEast())
    for (const point of useMapStore.getState().referencePoints) fullBounds.extend([point.lon, point.lat])
    const camera = map.cameraForBounds(fullBounds, { padding })
    if (camera?.zoom === undefined) return
    overviewZoom = camera.zoom
    // A little extra zoom-out room leaves breathing space around end stations.
    map.setMinZoom(Math.max(0, overviewZoom - 0.5))
    if (wasOverview) map.fitBounds(fullBounds, { padding, duration: 0 })
  }

  const onResize = () => update()
  const panelObserver = new ResizeObserver(() => update())
  const panel = map.getContainer().parentElement?.querySelector('.layer-panel')
  if (panel) panelObserver.observe(panel)
  const unsubscribe = useMapStore.subscribe((state, previous) => {
    if (state.referencePoints !== previous.referencePoints) update(true)
  })
  const readBounds = async () => {
    try {
      const extent = await source.getBounds()
      if (disposed) return
      if (extent.isEmpty()) throw new Error('Station data has no bounds')
      bounds = new LngLatBounds(extent.getSouthWest(), extent.getNorthEast())
      update(true)
      map.on('resize', onResize)
      onLoaded()
    } catch {
      if (!disposed) onError()
    }
  }
  void readBounds()
  return () => {
    disposed = true
    panelObserver.disconnect()
    unsubscribe()
    map.off('resize', onResize)
  }
}
