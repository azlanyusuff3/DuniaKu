# Cozy Rapids: Thunder Boats — Game Brief (for ChatGPT)

> **ChatGPT: read this file fully, then open `NEXT.md` and do the tasks in order.**
> Art rules are in `PROMPTS.md`.

A 3D arcade **powerboat racing** game for mobile browsers (PWA), inspired by the *feel* of
old PS1/arcade boat racers (huge jumps, boost pickups, shortcuts, big water, fast and floaty).
Original game: do NOT copy Hydro Thunder (no names, boats, tracks, logos, music or art from it).
Part of the MyCozyWorld family of games, so the mood is **cozy + cute + chaotic fun**, not gritty.

## Look: "PS1 low-poly, but cute"
- Three.js (WebGL), **vendored locally in `lib/`** so it works offline. Do NOT use a CDN.
  Import with `import * as THREE from './lib/three.module.js'` (it imports `./three.core.js` itself).
- Render to a **low-res canvas** (about 360 px tall, width follows the screen aspect), upscale with
  CSS `image-rendering: pixelated`. No antialiasing.
- `NearestFilter` on all textures (crunchy pixels), low-poly meshes, flat/vertex colours,
  thick coloured **fog** that hides the draw distance, no real-time shadows (use a blob shadow under boats).
- Optional PS1 wobble: snap vertex positions in a small custom shader or `onBeforeCompile`
  (keep it subtle, must stay readable and not cause nausea; add a settings toggle).
- Palette: pastel sky, teal/turquoise water, warm sunset, candy-coloured boats.
- All 3D objects are built **in code from primitives** (boxes, cones, cylinders, extruded shapes).
  No `.glb` files. Textures and billboards come from ChatGPT art in `sprites/` (see `PROMPTS.md`);
  until a sprite exists, use procedural canvas textures / solid colours as fallback so the game always runs.

## Gameplay
- Race vs **5 AI boats**, **3 laps**, 6 racers. Finish position gives stars and coins.
- Controls (mobile first):
  - Steer: drag left/right on the left half of the screen **or** device tilt (toggle in settings), keyboard A/D / arrows on desktop.
  - Big **BOOST** button bottom-right (also Space). Throttle is automatic.
  - **Jump trick**: leaving a ramp in the air, hold a direction to spin for a boost bonus on landing.
- **Boost**: collect glowing boost pickups on the water to fill the boost meter (3 pips). Hold boost to burn a pip for a speed burst + FOV kick + wake particles.
- **Water**: rolling waves via a simple animated vertex displacement plane; boats bob and tilt to the wave. Splash particles (sprites) on landing and turns.
- **Track**: closed spline circuit with banks (cliffs/rocks/palms), buoy gates marking the route, big ramps, 1–2 **shortcuts** per track (hidden cave, waterfall jump) that are faster but risky.
- **Hazards**: rocks, floating logs, drifting barrels, small whirlpools (slow you down). Hitting walls slows and bounces, never kills.
- **AI**: follow the spline with lane offsets, rubber-banding (slightly faster when far behind, slightly slower when far ahead), random mistakes, uses boost pickups and sometimes shortcuts. 3 difficulty levels.
- **Camera**: chase cam behind and above, smooth follow, slight roll on turns, FOV widens with speed, look-back button optional.
- **HUD** (DOM overlay, readable on phones): position (1st/6), lap (1/3), speedometer, boost pips, minimap (draw the spline in a small canvas with dots for racers), countdown 3-2-1-GO, wrong-way warning.

## Content for v1
- **3 tracks**: 
  1. *Sunny Cove* — easy, wide, tropical, first ramp tutorial.
  2. *Lantern Canyon* — narrower canyon, sunset, shortcut through a cave.
  3. *Frostbite Falls* — snow banks, ice chunks, big waterfall jump.
- **4 boats** with stats (speed, accel, handling, boost) in `data.js`, each with its own colour scheme and a cute driver billboard: *Mochi Dart* (balanced), *Kopi Cruiser* (heavy, fast top speed), *Bubble Bee* (agile), *Rocket Pudding* (huge boost, poor handling).
- Menu: Title → Boat select → Track select → Race → Results. Coins unlock cosmetic colours (optional, v1.5).
- Save with `localStorage` key `mycozyworld_cozy_rapids_v1` (best lap per track, stars, coins, settings, unlocked boats). Wrap in try/catch.
- Sound: tiny WebAudio synth sfx (engine hum pitch follows speed, boost whoosh, splash, countdown beeps, pickup ding). No external audio files. Mute toggle. Start audio only after the first tap.

## File layout (repo root)
```
index.html         shell, canvas, HUD overlay, menus
style.css
main.js            boot, state machine, loop
data.js            boats, tracks (spline control points), tuning numbers
track.js           builds track, water, scenery, ramps, pickups from data
boat.js            boat mesh + physics (arcade, not simulation)
ai.js
camera.js
hud.js
audio.js
input.js
sprites/           final .webp assets + list.json (Claude cuts these from sheets/)
sprites/sheets/    raw PNG sheets from ChatGPT
lib/               three.module.js, three.core.js (already committed, do not edit)
manifest.json      PWA manifest for the game (name "Cozy Rapids", display standalone, portrait OR landscape)
```
ES modules only, no build step, must run by just opening `index.html` over GitHub Pages.

## Hard rules
- **This repo is dedicated to this game; the game lives at the repo root** (GitHub Pages: main branch, root). Do NOT delete `lib/`, `README.md`, `NEXT.md`, `PROMPTS.md`. Claude will add the service worker / PWA caching later, so do not create a `sw.js` yourself.
- Commit straight to `main`. Small commits, clear messages like `feat(rapids): task B water + boat`.
- Performance target: **60 fps on a mid-range phone**. Keep draw calls low (merge static scenery into few meshes, use `InstancedMesh` for buoys/rocks/palms), cap particles, cap pixel ratio at 1 (the low-res canvas does the rest).
- Landscape is preferred while racing; show a "rotate your phone" hint if portrait, but make portrait playable too.
- No external network requests at runtime.
- Don't ask the owner (Azlan) technical questions, make the best decision and note it in `NOTES.md`.
