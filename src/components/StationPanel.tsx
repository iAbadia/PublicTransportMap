import { useMapStore } from '../store/useMapStore'
import { colorForLine, MODE_LABELS } from '../lib/tflColors'

export default function StationPanel() {
  const station = useMapStore((s) => s.selectedStation)
  const setSelectedStation = useMapStore((s) => s.setSelectedStation)

  if (!station) return null

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-10 w-[min(90vw,380px)] -translate-x-1/2 rounded-2xl border border-white/10 bg-neutral-900/90 p-4 shadow-2xl backdrop-blur-md sm:bottom-4 sm:left-auto sm:right-4 sm:translate-x-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">{station.name}</h2>
          <p className="mt-0.5 text-xs text-neutral-400">
            {station.modes.map((m) => MODE_LABELS[m] ?? m).join(' · ')}
          </p>
        </div>
        <button
          onClick={() => setSelectedStation(null)}
          className="rounded-full p-1 text-neutral-400 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {station.lines.map((lineId) => (
          <span
            key={lineId}
            className="rounded-full px-2.5 py-1 text-xs font-medium text-white shadow-sm"
            style={{ backgroundColor: colorForLine(lineId, station.modes[0]) }}
          >
            {lineId.replace(/-/g, ' ')}
          </span>
        ))}
      </div>
    </div>
  )
}
