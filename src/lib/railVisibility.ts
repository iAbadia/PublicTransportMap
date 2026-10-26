export const UNDERGROUND_LINES = [
  ['bakerloo', 'Bakerloo'], ['central', 'Central'], ['circle', 'Circle'],
  ['district', 'District'], ['hammersmith-city', 'Hammersmith & City'],
  ['jubilee', 'Jubilee'], ['metropolitan', 'Metropolitan'], ['northern', 'Northern'],
  ['piccadilly', 'Piccadilly'], ['victoria', 'Victoria'], ['waterloo-city', 'Waterloo & City'],
] as const

export function visibleRailLines(modes: Record<string, boolean>, tubeLines: Record<string, boolean>) {
  return [
    ...(modes.tube ? UNDERGROUND_LINES.filter(([id]) => tubeLines[id]).map(([id]) => id) : []),
    ...(modes.overground ? ['liberty', 'lioness', 'mildmay', 'suffragette', 'weaver', 'windrush'] : []),
    ...(modes.dlr ? ['dlr'] : []), ...(modes['elizabeth-line'] ? ['elizabeth'] : []),
    ...(modes.tram ? ['tram'] : []),
  ]
}

export const defaultTubeLines = () => Object.fromEntries(UNDERGROUND_LINES.map(([id]) => [id, true]))
