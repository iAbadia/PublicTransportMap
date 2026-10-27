# Woven London L exploration

Brief: replace the overly generic two-station favicon with a custom L woven from two routes and an interchange built into negative space. Preserve the product name and the existing app interface. Priorities: distinctive, structured, clearly an L, and legible at favicon scale.

Ideas explored: parallel L routes joined by a diamond interchange; diagonal underpass at the elbow; rounded twin-route turn; isolated interchange island; overlapping ribbon loop; split baseline; frame-cut L; and a three-route braid. The first three are developed as related alternatives; the rest add ambiguity or excessive detail at small sizes.

Recommendation: A, Woven interchange. Its two parallel stems and two horizontal routes preserve a clear L silhouette. The diamond opening is an embedded interchange rather than a separate terminal dot. B is sharper and more directional; C is softer and less architectural.

Each has a 256-unit master. The v2 drawings enlarge the interchange opening; C also receives a four-unit optical centring correction. SVG audits pass without findings. Both rounds were rendered and visually inspected, including the 64/32/16 px comparison, monochrome/reversed versions, and mirrored/rotated treatments. At 16 px the interchange is a small opening, so the overall double-route L must carry recognition.

Library study: Weave for the principle of separating crossing bands, plus the prior negative-space construction study. No library artwork is incorporated.

`build_concepts.py` reproduces v2 geometry using Python and Shapely; this is design tooling, not an app dependency.

## Selected colour version

A was selected and developed in multiple colours: outer route coral `#ff7468`, inner route cyan `#54c9db`, interchange amber `#f8cf76`, on the app's dark `#181c20` tile. Colour follows the two routes and their shared interchange; it does not add geometry. The diamond remains a genuine opening. The monochrome v2 master remains the single-colour fallback.

`build_color.py` partitions the approved silhouette and asserts that the coloured regions reconstruct it exactly. `woven-l-color.svg` is the transparent colour master and `woven-l-favicon-master.svg` includes the dark tile. Exported SVG/ICO/PNG/touch/manifest icons are installed in `public/`; the existing base-aware HTML links and relative manifest paths remain in use. The earlier two-station favicon in `docs/branding/favicon/` is superseded.
