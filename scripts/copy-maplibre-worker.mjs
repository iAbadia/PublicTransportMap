// MapLibre GL JS resolves its worker script at runtime as
// `new URL('./maplibre-gl-worker.mjs', import.meta.url)` relative to wherever
// the bundle ends up, and that worker script itself imports a sibling
// `./maplibre-gl-shared.mjs` chunk. Vite bundles maplibre-gl into the single
// app chunk and never emits either file on its own, so both 404 in production
// (dev works because Vite serves node_modules unbundled). Copy them into
// dist/assets after every build so they sit next to the bundle at the exact
// relative paths maplibre expects, matching whatever maplibre-gl version is
// installed.
import { copyFile, mkdir } from 'node:fs/promises'

const destDir = new URL('../dist/assets/', import.meta.url)
await mkdir(destDir, { recursive: true })

for (const name of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
  const src = new URL(`../node_modules/maplibre-gl/dist/${name}`, import.meta.url)
  await copyFile(src, new URL(name, destDir))
  console.log(`Copied ${name} into dist/assets/`)
}
