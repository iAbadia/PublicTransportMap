import { useMapStore } from '../store/useMapStore'
import { colorForLine, MODE_LABELS } from '../lib/tflColors'

export default function StationPanel() {
  const station = useMapStore((s) => s.selectedStation)
  const setSelectedStation = useMapStore((s) => s.setSelectedStation)

  if (!station) return null

  return (
    <section className="station-panel map-panel" aria-label="Selected station" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2>{station.name}</h2>
          <p className="station-modes">
            {station.modes.map((m) => MODE_LABELS[m] ?? m).join(' · ')}
          </p>
        </div>
        <button
          onClick={() => setSelectedStation(null)}
          className="close-button"
          aria-label="Close station details"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="station-lines">
        {station.lines.map((lineId) => (
          <span
            key={lineId}
            className="station-line"
          >
            <span className="line-swatch" style={{ backgroundColor: colorForLine(lineId, station.modes[0]) }} />
            {lineId.replace(/-/g, ' ')}
          </span>
        ))}
      </div>
    </section>
  )
}
