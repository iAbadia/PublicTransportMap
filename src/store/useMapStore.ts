import { create } from 'zustand'
import { loadReferencePoints, type ReferencePoint } from '../lib/referencePoints'
import { defaultTubeLines } from '../lib/railVisibility'

export type Mode = 'tube' | 'overground' | 'dlr' | 'elizabeth-line' | 'tram' | 'bus'

export interface SelectedStation {
  id: string
  name: string
  lines: string[]
  modes: string[]
  lat: number
  lon: number
}

interface MapState {
  visibleTubeLines: Record<string, boolean>
  toggleTubeLine: (id: string) => void
  referencePoints: ReferencePoint[]
  addReferencePoint: (point: ReferencePoint) => void
  removeReferencePoint: (id: string) => void
  visibleModes: Record<Mode, boolean>
  toggleMode: (mode: Mode) => void
  selectedStation: SelectedStation | null
  setSelectedStation: (s: SelectedStation | null) => void
  dataStatus: Record<string, 'idle' | 'loading' | 'loaded' | 'error'>
  setDataStatus: (key: string, status: 'idle' | 'loading' | 'loaded' | 'error') => void
}

export const useMapStore = create<MapState>((set) => ({
  visibleTubeLines: defaultTubeLines(),
  toggleTubeLine: (id) => set(state => ({ visibleTubeLines: { ...state.visibleTubeLines, [id]: !state.visibleTubeLines[id] } })),
  referencePoints: loadReferencePoints(),
  addReferencePoint: (point) => set(state => ({ referencePoints: state.referencePoints.some(p => p.id === point.id)
    ? state.referencePoints : [...state.referencePoints, point] })),
  removeReferencePoint: (id) => set(state => ({ referencePoints: state.referencePoints.filter(p => p.id !== id) })),
  visibleModes: {
    tube: true,
    overground: true,
    dlr: true,
    'elizabeth-line': true,
    tram: true,
    bus: false,
  },
  toggleMode: (mode) =>
    set((state) => ({
      visibleModes: { ...state.visibleModes, [mode]: !state.visibleModes[mode] },
    })),
  selectedStation: null,
  setSelectedStation: (s) => set({ selectedStation: s }),
  dataStatus: {},
  setDataStatus: (key, status) =>
    set((state) => ({ dataStatus: { ...state.dataStatus, [key]: status } })),
}))
