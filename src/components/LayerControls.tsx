import { useEffect, useState } from 'react'
import { useMapStore, type Mode } from '../store/useMapStore'
import { colorForLine } from '../lib/tflColors'
import type { Map as MapLibreMap } from 'maplibre-gl'
import ReferencePoints from './ReferencePoints'
import { UNDERGROUND_LINES } from '../lib/railVisibility'

const MODE_ORDER: { mode: Mode; label: string; swatch: string; ready: boolean }[] = [
  { mode: 'tube', label: 'Underground', swatch: '#DC241F', ready: true },
  { mode: 'overground', label: 'Overground', swatch: colorForLine('mildmay', 'overground'), ready: true },
  { mode: 'dlr', label: 'DLR', swatch: colorForLine('dlr', 'dlr'), ready: true },
  { mode: 'elizabeth-line', label: 'Elizabeth line', swatch: colorForLine('elizabeth', 'elizabeth-line'), ready: true },
  { mode: 'tram', label: 'Tram', swatch: colorForLine('tram', 'tram'), ready: true },
  { mode: 'bus', label: 'Bus', swatch: '#DC241F', ready: true },
]

export default function LayerControls({ map }: { map: MapLibreMap | null }) {
  const visibleModes = useMapStore((s) => s.visibleModes)
  const toggleMode = useMapStore((s) => s.toggleMode)
  const tubeLines = useMapStore(s => s.visibleTubeLines)
  const toggleTubeLine = useMapStore(s => s.toggleTubeLine)
  const [tubeExpanded, setTubeExpanded] = useState(false)
  const [expanded, setExpanded] = useState(() => !window.matchMedia('(max-width: 600px)').matches)
  const [referencesExpanded, setReferencesExpanded] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(max-width: 600px)')
    const onChange = () => { if (media.matches) setExpanded(false) }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  const activeCount = MODE_ORDER.filter(({ mode }) => visibleModes[mode]).length

  return (
    <section className="layer-panel map-panel" aria-label="Map layers">
      <header className="panel-heading">
        <svg className="transit-mark" width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M8 5v22M24 5v22M5 11h22M5 21h22" stroke="currentColor" strokeWidth="2" />
          <circle cx="8" cy="11" r="3" fill="var(--surface)" stroke="currentColor" strokeWidth="2" />
          <circle cx="24" cy="21" r="3" fill="var(--surface)" stroke="currentColor" strokeWidth="2" />
        </svg>
        <div><h1>London Transit Map</h1><p>Geographically accurate routes</p></div>
      </header>
      <button className="layer-disclosure" aria-expanded={expanded} aria-controls="transport-layers" onClick={() => {
        setExpanded(!expanded)
        if (!expanded && window.matchMedia('(max-width: 600px)').matches) setReferencesExpanded(false)
      }}>
        <span>Transport layers <span className="layer-count">{activeCount} of 6</span></span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ transform: expanded ? 'rotate(180deg)' : undefined }}><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <div id="transport-layers" hidden={!expanded}>
      <div className="mode-list">
        {MODE_ORDER.map(({ mode, label, swatch, ready }) => {
          const active = visibleModes[mode]
          return (
            <div key={mode} className={mode === 'tube' ? 'tube-group' : undefined}>
            <div className="mode-row">
            <button
              disabled={!ready}
              aria-pressed={active}
              onClick={() => toggleMode(mode)}
              className={`mode-button ${active ? 'is-active' : ''}`}
            >
              <span
                className="mode-swatch"
                style={{ backgroundColor: swatch }}
              />
              <span className="mode-label">{label}</span>
              <span className="mode-switch" aria-hidden="true"><span /></span>
              {!ready && <span className="text-[10px] uppercase tracking-wide text-neutral-500">soon</span>}
            </button>
            {mode === 'tube' && <button className="tube-disclosure" aria-label="Underground lines" aria-expanded={tubeExpanded} aria-controls="underground-lines" onClick={() => setTubeExpanded(!tubeExpanded)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ transform: tubeExpanded ? 'rotate(180deg)' : undefined }}><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" /></svg>
            </button>}
            </div>
            {mode === 'tube' && <div id="underground-lines" hidden={!tubeExpanded}>
              <p className="tube-hint">{visibleModes.tube ? `${Object.values(tubeLines).filter(Boolean).length} of 11 lines selected` : 'Underground is off. Your line choices are kept.'}</p>
              {UNDERGROUND_LINES.map(([id, name]) => <button key={id} className={`mode-button tube-line ${visibleModes.tube && tubeLines[id] ? 'is-active' : ''}`} disabled={!visibleModes.tube} aria-pressed={tubeLines[id]} onClick={() => toggleTubeLine(id)}>
                <span className="mode-swatch" style={{ backgroundColor: colorForLine(id, 'tube') }} />
                <span className="mode-label">{name}</span>
                <span className="mode-switch" aria-hidden="true"><span /></span>
              </button>)}
            </div>}
            </div>
          )
        })}
      </div>
      <p className="panel-hint" role="status">{activeCount === 0 ? 'All layers hidden. Turn one on to explore.' : 'Select a station or stop to see its lines.'}</p>
      </div>
      <ReferencePoints map={map} open={referencesExpanded} onToggle={() => {
        setReferencesExpanded(!referencesExpanded)
        if (!referencesExpanded && window.matchMedia('(max-width: 600px)').matches) setExpanded(false)
      }} />
    </section>
  )
}
