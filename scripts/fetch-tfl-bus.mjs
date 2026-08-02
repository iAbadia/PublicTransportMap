// Fetches accurate route geometry + stop locations for every London bus route
// from the TfL Unified API. Bus routes are rendered as a single uniform red
// (the standard London Buses colour) since a per-route palette across ~680
// routes would be illegible; the route number itself is the identifier.
// Run with: node scripts/fetch-tfl-bus.mjs
import { writeFile, mkdir } from 'node:fs/promises'

const OUT_DIR = new URL('../public/data/', import.meta.url)
const CONCURRENCY = 1
const REQUEST_DELAY_MS = 300
const MAX_RETRIES = 6

async function getJson(url) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url)
    if (res.ok) return res.json()
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
      await sleep(2000 * 2 ** attempt)
      continue
    }
    throw new Error(`${res.status} ${res.statusText} for ${url}`)
  }
  throw new Error(`exhausted retries for ${url}`)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function processLine(line, lineFeatures, stationsById) {
  let seq
  try {
    seq = await getJson(`https://api.tfl.gov.uk/Line/${line.id}/Route/Sequence/all?excludeCrowding=true`)
  } catch (err) {
    console.log(`${line.id} FAILED: ${err.message}`)
    return
  }

  for (const raw of seq.lineStrings) {
    const parts = JSON.parse(raw)
    for (const coords of parts) {
      lineFeatures.push({
        type: 'Feature',
        properties: { id: line.id, name: line.name },
        geometry: { type: 'LineString', coordinates: coords },
      })
    }
  }

  for (const st of seq.stations) {
    const existing = stationsById.get(st.id)
    if (existing) {
      if (!existing.lineIds.includes(line.id)) existing.lineIds.push(line.id)
    } else {
      stationsById.set(st.id, {
        id: st.id,
        name: st.name,
        lat: st.lat,
        lon: st.lon,
        lineIds: [line.id],
      })
    }
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  let lines = await getJson('https://api.tfl.gov.uk/Line/Mode/bus/Route?serviceTypes=Regular')
  const limit = Number(process.env.BUS_LIMIT || 0)
  if (limit > 0) lines = lines.slice(0, limit)
  console.log(`Found ${lines.length} bus routes${limit ? ` (limited to ${limit})` : ''}`)

  const lineFeatures = []
  const stationsById = new Map()

  let done = 0
  let idx = 0
  async function worker() {
    while (idx < lines.length) {
      const line = lines[idx++]
      await processLine(line, lineFeatures, stationsById)
      done++
      if (done % 25 === 0 || done === lines.length) {
        console.log(`${done}/${lines.length} routes fetched`)
      }
      await sleep(REQUEST_DELAY_MS)
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  const stationFeatures = [...stationsById.values()].map((s) => ({
    type: 'Feature',
    properties: { id: s.id, name: s.name, routes: `|${s.lineIds.join('|')}|`, routeCount: s.lineIds.length },
    geometry: { type: 'Point', coordinates: [s.lon, s.lat] },
  }))

  await writeFile(
    new URL('bus-lines.geojson', OUT_DIR),
    JSON.stringify({ type: 'FeatureCollection', features: lineFeatures }),
  )
  await writeFile(
    new URL('bus-stops.geojson', OUT_DIR),
    JSON.stringify({ type: 'FeatureCollection', features: stationFeatures }),
  )

  console.log(`\nWrote ${lineFeatures.length} line segments and ${stationFeatures.length} bus stops.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
