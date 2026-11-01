# Cozy Rapids — Art Prompts for ChatGPT

> **ChatGPT: the task list is in `NEXT.md`. Art tasks = Task E.**

Do ONE sheet per message. Never redesign a character between sheets: always look at the
reference sheet already committed in `sprites/sheets/` and match it exactly.

## RULES (apply to every image)
- Original art for "Cozy Rapids" (NO Hydro Thunder boats/logos, no copyrighted characters or brands).
- Style: cute chibi 2D cartoon, soft pastel colours, clean thick dark outlines (#2f3b5c deep navy-blue), soft cel shading, same look as the other MyCozyWorld games. It will be used as small billboards/textures in a **low-res PS1-style 3D game**, so keep shapes bold and simple, and avoid tiny details.
- Canvas exactly 1536x1024 px, PNG.
- Sprite sheets: flat solid magenta `#FF00FF` background everywhere (no gradient, no shadow, no texture). Grid 3 columns x 2 rows, each cell 512x512, one item per cell, centred, nothing touching the cell edges (40 px margin).
- Texture sheets (marked TEXTURE): NO magenta, grid 3x2 of 512x512 **seamlessly tileable** squares, flat lighting, no perspective.
- No text, no labels, no grid lines.
- Commit the PNG straight to GitHub repo `azlanyusuff3/DuniaKu`, branch `main`, path `sprites/sheets/<filename>`. Do not touch any other file.

---

## SHEET 1 — Drivers → `drivers.png` (sprite sheet)
Four cute drivers shown from the BACK-3/4 view, sitting and holding a steering handle, upper body + helmet only (they are billboards on top of boats), plus two extra expressions of the first driver.
- Row 1: **Mochi** (round white-pink mochi-bun creature with a tiny aviator cap and goggles, balanced racer), **Kopi** (chubby brown bear in a captain hat and orange life vest), **Bubble** (small yellow bee-girl with antennae and a striped racing helmet).
- Row 2: **Pudding** (wobbly caramel pudding blob with a red rocket helmet), **Mochi cheering** (front view, both arms up, big happy mouth), **Mochi scared** (front view, wide eyes, sweat drop, hands on cheeks).

## SHEET 2 — Boat paint textures → `boat_tex.png` (TEXTURE)
Flat painted hull textures (tileable, used on box-built boats), candy colours with white racing stripes and simple star/wave decals:
Row 1: Mochi Dart (pink + white), Kopi Cruiser (orange + cocoa brown), Bubble Bee (yellow + black stripes).
Row 2: Rocket Pudding (red + cream), neutral AI boat A (teal + white), neutral AI boat B (purple + mint).

## SHEET 3 — Water & ground textures → `tex_water.png` (TEXTURE)
Row 1: calm turquoise water with soft white ripple lines, deeper blue water, sunset orange-pink water.
Row 2: icy pale-blue water with small white ice flecks, white foam/splash, wet sand.

## SHEET 4 — Scenery textures → `tex_scenery.png` (TEXTURE)
Row 1: warm rocky cliff, mossy green cliff, dark canyon rock with glowing lantern dots.
Row 2: snow and ice wall, palm-leaf green, wooden plank (ramps and docks).

## SHEET 5 — Props & effects → `props.png` (sprite sheet)
Row 1: boost pickup (glowing blue-white lightning orb with a halo), coin (gold with a star), buoy gate marker (red-white striped buoy).
Row 2: splash (white water splash burst), speed-lines puff (soft white puff), palm tree (chunky cartoon palm, simple).

## SHEET 6 — HUD icons → `hud.png` (sprite sheet, round chunky badges with thick outline)
Row 1: boost button icon (lightning bolt, big and bold), lap flag (chequered flag), position medal (gold medal with a "1" shape only, no text elsewhere).
Row 2: speedometer dial (empty, no numbers), wrong-way arrow (red U-turn arrow), pause icon (two bars).

## SHEET 7 — Sky panoramas → `sky.png` (NOT magenta, NOT grid)
Size 1536x1024: three horizontal bands (each 1536x341) stacked vertically, each a seamless horizontally-tiling soft sky strip with simple cartoon clouds and low distant hills at the bottom edge:
Band 1: sunny day (pale blue, white puffy clouds). Band 2: sunset (peach, pink, purple clouds). Band 3: snowy dusk (lavender grey with soft snowfall dots).

## SHEET 8 — Title logo → `logo.png` (single image, magenta background, no grid)
1536x1024: a big chunky rounded logo "Cozy Rapids" with a small cute speedboat jumping over the word, splashes around, colours match the other MyCozyWorld logos (soft pastel candy colours, thick outline, sparkles). This is the only image where text is allowed.

---
After each sheet is committed, Claude cuts the sheets into `sprites/*.webp` and updates `sprites/list.json`.
