// Fetches accurate route geometry + station locations for London's rail-based
// public transport (tube, DLR, Overground lines, Elizabeth line, tram) from
// the TfL Unified API, and writes static GeoJSON the app loads at runtime.
// Run with: node scripts/fetch-tfl-rail.mjs
import { writeFile, mkdir } from 'node:fs/promises'

const MODES = ['tube', 'dlr', 'overground', 'elizabeth-line', 'tram']
const OUT_DIR = new URL('../public/data/', import.meta.url)

async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  return res.json()
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const lines = await getJson(
    `https://api.tfl.gov.uk/Line/Mode/${MODES.join(',')}/Route?serviceTypes=Regular`,
  )
  console.log(`Found ${lines.length} rail lines across modes: ${MODES.join(', ')}`)

  const lineFeatures = []
  const stationsById = new Map()

  for (const line of lines) {
    process.stdout.write(`Fetching ${line.name} (${line.id})... `)
    let seq
    try {
      seq = await getJson(
        `https://api.tfl.gov.uk/Line/${line.id}/Route/Sequence/all?excludeCrowding=true`,
      )
    } catch (err) {
      console.log(`FAILED: ${err.message}`)
      continue
    }

    for (const raw of seq.lineStrings) {
      const parts = JSON.parse(raw)
      for (const coords of parts) {
        lineFeatures.push({
          type: 'Feature',
          properties: { id: line.id, name: line.name, mode: line.modeName },
          geometry: { type: 'LineString', coordinates: coords },
        })
      }
    }

    for (const st of seq.stations) {
      const existing = stationsById.get(st.id)
      if (existing) {
        if (!existing.lineIds.includes(line.id)) existing.lineIds.push(line.id)
        for (const m of st.modes) if (!existing.modes.includes(m)) existing.modes.push(m)
      } else {
        stationsById.set(st.id, {
          id: st.id,
          name: st.name,
          lat: st.lat,
          lon: st.lon,
          modes: [...st.modes],
          lineIds: [line.id],
        })
      }
    }

    console.log(`${seq.lineStrings.length} line string(s), ${seq.stations.length} stops`)
    await sleep(120)
  }

  // Encoded as delimited strings ("|tube|dlr|") rather than JSON arrays: GeoJSON
  // sources flatten array properties inconsistently across MapLibre versions,
  // so string filtering/parsing on the client is more reliable.
  const stationFeatures = [...stationsById.values()].map((s) => ({
    type: 'Feature',
    properties: {
      id: s.id,
      name: s.name,
      modes: `|${s.modes.join('|')}|`,
      lines: `|${s.lineIds.join('|')}|`,
      lineCount: s.lineIds.length,
    },
    geometry: { type: 'Point', coordinates: [s.lon, s.lat] },
  }))

  await writeFile(
    new URL('rail-lines.geojson', OUT_DIR),
    JSON.stringify({ type: 'FeatureCollection', features: lineFeatures }),
  )
  await writeFile(
    new URL('rail-stations.geojson', OUT_DIR),
    JSON.stringify({ type: 'FeatureCollection', features: stationFeatures }),
  )

  console.log(
    `\nWrote ${lineFeatures.length} line segments and ${stationFeatures.length} stations.`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
