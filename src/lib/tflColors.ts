// Official TfL line colours (from TfL brand guidelines / line diagrams)
export const LINE_COLORS: Record<string, string> = {
  bakerloo: '#B36305',
  central: '#E32017',
  circle: '#FFD300',
  district: '#00782A',
  'hammersmith-city': '#F3A9BB',
  jubilee: '#A0A5A9',
  metropolitan: '#9B0056',
  northern: '#000000',
  piccadilly: '#003688',
  victoria: '#0098D4',
  'waterloo-city': '#95CDBA',
  'london-overground': '#FA7B05',
  'elizabeth': '#60399E',
  dlr: '#00AFAD',
  tram: '#5FB526',
  liberty: '#606667',
  lioness: '#EF9600',
  mildmay: '#2774AE',
  suffragette: '#5BA763',
  weaver: '#893B67',
  windrush: '#D22730',
}

export const MODE_LABELS: Record<string, string> = {
  tube: 'Underground',
  dlr: 'DLR',
  'overground': 'Overground',
  'elizabeth-line': 'Elizabeth line',
  tram: 'Tram',
  bus: 'Bus',
}

export function colorForLine(lineId: string, mode: string): string {
  if (LINE_COLORS[lineId]) return LINE_COLORS[lineId]
  if (mode === 'overground') return LINE_COLORS['london-overground']
  if (mode === 'elizabeth-line') return LINE_COLORS['elizabeth']
  if (mode === 'dlr') return LINE_COLORS.dlr
  if (mode === 'tram') return LINE_COLORS.tram
  if (mode === 'bus') return '#DC241F'
  return '#888888'
}
