import { useMapStore, type Mode } from '../store/useMapStore'
import { colorForLine } from '../lib/tflColors'

const MODE_ORDER: { mode: Mode; label: string; swatch: string; ready: boolean }[] = [
  { mode: 'tube', label: 'Underground', swatch: '#DC241F', ready: true },
  { mode: 'overground', label: 'Overground', swatch: colorForLine('mildmay', 'overground'), ready: true },
  { mode: 'dlr', label: 'DLR', swatch: colorForLine('dlr', 'dlr'), ready: true },
  { mode: 'elizabeth-line', label: 'Elizabeth line', swatch: colorForLine('elizabeth', 'elizabeth-line'), ready: true },
  { mode: 'tram', label: 'Tram', swatch: colorForLine('tram', 'tram'), ready: true },
  { mode: 'bus', label: 'Bus', swatch: '#DC241F', ready: true },
]

export default function LayerControls() {
  const visibleModes = useMapStore((s) => s.visibleModes)
  const toggleMode = useMapStore((s) => s.toggleMode)

  return (
    <div className="pointer-events-auto absolute left-4 top-4 z-10 w-64 rounded-2xl border border-white/10 bg-neutral-900/80 p-4 shadow-2xl backdrop-blur-md">
      <h1 className="text-sm font-semibold tracking-wide text-white">London Transit Map</h1>
      <p className="mt-0.5 text-xs text-neutral-400">Geographically accurate routes</p>

      <div className="mt-4 flex flex-col gap-1.5">
        {MODE_ORDER.map(({ mode, label, swatch, ready }) => {
          const active = visibleModes[mode]
          return (
            <button
              key={mode}
              disabled={!ready}
              onClick={() => toggleMode(mode)}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                ready ? 'cursor-pointer hover:bg-white/5' : 'cursor-not-allowed opacity-40'
              } ${active && ready ? 'bg-white/5' : ''}`}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full ring-1 ring-white/20"
                style={{ backgroundColor: swatch, opacity: active && ready ? 1 : 0.3 }}
              />
              <span className={`flex-1 ${active && ready ? 'text-white' : 'text-neutral-400'}`}>{label}</span>
              {!ready && <span className="text-[10px] uppercase tracking-wide text-neutral-500">soon</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
