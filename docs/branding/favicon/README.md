# Interchange favicon

This initial two-station design is superseded by the approved [multicolour woven L](../woven-l/README.md). The deployed icon files in `public/` use that newer design.

Chosen direction: A, Interchange. Two open station rings linked by a stepped route identify the map without using the TfL roundel. The final favicon uses the app's amber `#f8cf76` on its dark surface `#181c20`, so the mark remains legible on both light and dark browser chrome.

`interchange-v2.svg` is the monochrome silhouette; `favicon-master.svg` is the coloured tile. `public/` contains the deployed SVG favicon, ICO with 16/32/48 px images, PNG fallbacks, Apple touch icon, and regular/maskable manifest icons. HTML URLs use Vite's base path and manifest URLs are relative, supporting GitHub Pages under `/PublicTransportMap/`.

The icon set does not add offline support or a service worker. Keep the mark upright and preserve both station holes. Use the supplied small-size artwork rather than adding finer details.

Generated with the project-installed `.agents/skills/logo-design` export tools. Concept iterations and the greyscale test sheet are retained here for design history.
