# Cozy Rapids — Notes

## Decisions (ChatGPT writes here)

- Task A: Low-resolution 360px-max-tall WebGL canvas (nearest/pixelated via CSS); local Three.js only; open-water testing first. Auto throttle + left-side swipe, keyboard or optional device-tilt steer. Boats and wakes use procedural geometry/points until art assets exist.
- Boat kinematics use arcade acceleration and inertial velocity blending rather than expensive rigid-body simulation. Wave displacement uses a 64x64 local mesh and the same analytic function for boat bob.
- No service worker: reserved for Claude as required in README. Portrait playable, landscape preferred.

- Task B: Sunny Cove is a closed Catmull-Rom path; buoy-marked navigable area is bounded by soft corrective side pushes. 12 ordered checkpoint sectors per lap prevent shortcutting across the start. Two ramps launch with ballistic motion; midair steering accumulates trick spin, rewarding a complete rotation with boost. Respawning blue pickups refill boost pips. Solo three-lap finish uses a temporary results overlay (expanded in Task C).
- Task B scope: track records for future maps are placeholders, not playable yet; only Sunny Cove is instantiated. Keyboard Space or BOOST button consumes pickups; holding BOOST consumes subsequent pips as effects expire.

- Task C: five procedural AI racers use spline lookahead steering, five lane offsets, periodic steering mistakes, player-relative pace adjustment and occasional boost. Player- and AI-pair collisions soft-push without damage. A 3-2-1 countdown starts each race; HUD shows placement, lap, speed, boost and live canvas minimap. Race results grant 1–3 stars and coins (persistent saving is Task D).
- Positions are sorted by completed distance and finish time, not Euclidean distance to finish. AI boat physics is identical to player physics with tuned speed and simple catch-up.

- Task D: Menu flow title -> boat select -> track select -> race -> results, with retry and main menu. Four stat-differentiated boats; unlock additional boats using race coins (100/200/300). Only Sunny Cove can start until Task F supplies other courses; track 2 and 3 shown as unavailable previews.
- Persistent v1 localStorage stores coins, best lap, best stars, unlocked boats and tracks, and settings; all reads/writes guarded against storage errors. Optional tilt requires browser sensor permissions. Three AI difficulty presets, optional vertex snap (shader toggle), mute toggle, WebAudio sound effects and engine pitch all operate locally without downloaded audio.
- Art compatibility: loads sprites/list.json when present; if it maps driver_<boatId> or drivers.<boatId> to a sprites/*.webp file, mounts the transparent cutout over procedural driver. Missing list/images safely use built-in placeholder. Art Task E is deliberately untouched.
- No service worker is created per README. No external libraries/assets are imported at runtime; Three.js remains vendored in lib/.

- Post-D static QA: inspected all local JS imports, DOM identifiers, and parsed all nine project JS modules successfully (after removing ES module declarations for syntax checking). Fixed initial 3D menu preview, signed lap progress for reversing, and local sprite path handling. No browser/WebGL or physical-device playtest has been performed in this session; frame rate, handling and long-race behavior remain unverified.

## Known bugs / TODO

## Playtest feedback (owner + Claude write here)
