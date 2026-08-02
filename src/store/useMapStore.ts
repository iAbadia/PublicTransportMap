import { create } from 'zustand'

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
  visibleModes: Record<Mode, boolean>
  toggleMode: (mode: Mode) => void
  selectedStation: SelectedStation | null
  setSelectedStation: (s: SelectedStation | null) => void
  dataStatus: Record<string, 'idle' | 'loading' | 'loaded' | 'error'>
  setDataStatus: (key: string, status: 'idle' | 'loading' | 'loaded' | 'error') => void
}

export const useMapStore = create<MapState>((set) => ({
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
