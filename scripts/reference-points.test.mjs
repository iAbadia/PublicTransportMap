import { test } from 'node:test'
import assert from 'node:assert/strict'
import { distanceKm, nearestStation, isReferencePoint, searchPlaces } from '../src/lib/referencePoints.ts'

test('geographic distances handle coincident points, known cities and the date line', () => {
  const london = { lon: -0.1276, lat: 51.5074 }
  assert.equal(distanceKm(london, london), 0)
  const paris = { lon: 2.3522, lat: 48.8566 }
  assert.ok(Math.abs(distanceKm(london, paris) - 343.5) < 1)
  assert.ok(distanceKm({ lon: 179.9, lat: 0 }, { lon: -179.9, lat: 0 }) < 23)
})

test('nearest station follows visible rail modes and returns none when hidden', () => {
  const point = { id: 'test', name: 'Test', description: '', lon: 0, lat: 51.5 }
  const stations = [
    { name: 'Overground', lon: 0.01, lat: 51.5, modes: ['overground'], lines: ['lioness'] },
    { name: 'Tube', lon: 0.1, lat: 51.5, modes: ['tube'], lines: ['central'] },
  ]
  assert.equal(nearestStation(point, stations, { tube: true, overground: true }).station.name, 'Overground')
  assert.equal(nearestStation(point, stations, { tube: true, overground: false }).station.name, 'Tube')
  assert.equal(nearestStation(point, stations, {}), undefined)
  assert.equal(nearestStation(point, [], { tube: true }), undefined)
})

test('individual line toggles update nearest station while retaining visible interchanges', () => {
  const point = { id: 'p', name: 'Pin', description: '', lon: 0, lat: 51.5 }
  const stations = [
    { name: 'Central only', lon: .01, lat: 51.5, modes: ['tube'], lines: ['central'] },
    { name: 'Interchange', lon: .02, lat: 51.5, modes: ['tube'], lines: ['central', 'victoria'] },
    { name: 'Victoria only', lon: .03, lat: 51.5, modes: ['tube'], lines: ['victoria'] },
  ]
  assert.equal(nearestStation(point, stations, { tube: true }, { central: true, victoria: true }).station.name, 'Central only')
  assert.equal(nearestStation(point, stations, { tube: true }, { central: false, victoria: true }).station.name, 'Interchange')
  assert.equal(nearestStation(point, stations, { tube: true }, {}), undefined)
})

test('saved pins reject missing names and invalid geographic coordinates', () => {
  const point = { id: 'test', name: 'Place', description: '', lon: -0.3, lat: 51.8 }
  assert.ok(isReferencePoint(point))
  for (const value of [null, {}, { ...point, lat: NaN }, { ...point, lon: 181 }, { ...point, name: '' }]) {
    assert.equal(isReferencePoint(value), false)
  }
})

test('place search encodes the query and rejects malformed results', async t => {
  let requested
  t.mock.method(globalThis, 'fetch', async url => {
    requested = String(url)
    return new Response(JSON.stringify({ features: [
      { properties: { osm_type: 'W', osm_id: 123, name: 'Airport', city: 'Luton' }, geometry: { type: 'Point', coordinates: [-0.36, 51.87] } },
      { properties: { name: 'Bad coordinates' }, geometry: { type: 'Point', coordinates: [Infinity, 91] } },
    ] }), { status: 200 })
  })
  const results = await searchPlaces('Luton & Airport', new AbortController().signal)
  assert.equal(new URL(requested).searchParams.get('q'), 'Luton & Airport')
  assert.equal(results.length, 1)
  assert.equal(results[0].name, 'Airport')
  assert.equal(results[0].id, 'W-123')
})

test('failed search surfaces a retryable error', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 503 }))
  await assert.rejects(searchPlaces('Airport', new AbortController().signal), /try again/)
})
