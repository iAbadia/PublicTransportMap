# Favicon exploration

Product: London Transit Map, a geographic transport explorer with line filters and personal reference points.

Scope: a compact browser-tab identifier, not a new identity or an official TfL mark. Assume the existing dark neutral interface stays. Priorities: clear, precise, recognisable, useful at 16 pixels. Colour comes after selecting a silhouette.

Avoid: the TfL roundel, generic location pins, train-front pictograms, tiny multicolour networks, and detailed maps of London.

Word map: London / lines / layers / stations / reference / compare / connect / reveal. Intersections: a route with a purposeful offset, an L ending at a station, an M made from map folds.

## Longlist

| Idea | Clarity / distinction / simplicity / relevance / tiny-size (out of 5 each) |
| --- | --- |
| Interchange: two open station rings connected by a stepped route | 5 / 4 / 5 / 5 / 5 |
| Line L: a heavy L route ending in a station ring | 5 / 4 / 5 / 5 / 5 |
| Folded M: three separated planes create a map-like M silhouette | 4 / 4 / 5 / 4 / 4 |
| Reference offset: an isolated dot aligned with an open route corner | 3 / 4 / 5 / 4 / 4 |
| Layered junction: an overpass cut through a crossing | 4 / 3 / 4 / 5 / 4 |
| Northbound: an arrow hidden inside a route bend | 4 / 2 / 5 / 4 / 5 |
| London window: a square crop containing one diagonal route | 3 / 3 / 4 / 4 / 4 |
| Network weave: three routes share a single interchange | 4 / 3 / 3 / 5 / 2 |

Build the first three: route pictogram, letterform, and folded abstract letterform. The others repeat navigation conventions or lose their detail at favicon sizes.

## Construction and research

- All marks use a 256-unit square and solid black geometry first.
- A: 32-unit route, 64-unit station rings, 32-unit clear holes, and a 45-degree bend. Square footprint centred on (128, 128).
- B: a 40-unit L stem/foot and an open station terminal. The L remains readable without colour.
- C: three filled map planes with 16-unit separation; no outline or interior decoration.
- Skill library research: map-category summary (9 examples); Kotlin, Framer and Pagekit studied for economical geometry/negative space. References are studied, not traced or incorporated.

Recommendation before colour: A. It connects directly to this app's station-and-route interaction without relying on initials or imitating the Underground roundel. B is strongest if a London initial is preferred; C is less specific to rail.
