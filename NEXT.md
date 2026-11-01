# Cozy Rapids — NEXT tasks for ChatGPT

Read `README.md` (brief + hard rules) and `PROMPTS.md` (art rules) first.
Do the tasks in order, commit after each one (letter in the commit message),
and tick the box here (`[ ]` → `[x]`) when done. This file is the only non-game file you may edit
besides `NOTES.md` (write decisions / known bugs there).

**Always keep the game runnable at every commit.** If a sprite is missing, fall back to a procedural placeholder.

---

## [ ] Task A — Skeleton + water + one boat that drives
- `index.html`, `style.css`, `manifest.json`, `main.js`, `input.js`, `camera.js`, `boat.js`.
- Low-res pixelated renderer, fog, pastel sky colour, animated wave water plane.
- Player boat (box-built, candy colours) with arcade physics: auto throttle, steering, drift slide, bob on waves, blob shadow, wake particles.
- Chase camera with FOV-by-speed. Touch drag + keyboard + tilt toggle.
- Simple FPS counter behind `?debug=1`.
Done when: opening the page lets me steer a boat on open water smoothly.

## [ ] Task B — Track system (Sunny Cove) + laps
- `data.js` + `track.js`: define tracks as spline control points + width; generate banks/cliffs (instanced), buoy gates, checkpoints, start line.
- Collision with banks (soft bounce), lap counting with checkpoints, wrong-way detection.
- Ramps with proper air time, landing splash, jump trick spin (see README).
- Boost pickups + boost meter + boost button.
Done when: Sunny Cove is fully playable solo for 3 laps with a finish screen.

## [ ] Task C — AI racers, HUD, race flow
- `ai.js`: 5 AI boats with rubber-banding, lane offsets, mistakes, boost use, 3 difficulties.
- `hud.js`: position, lap, speed, boost pips, minimap, 3-2-1-GO countdown, results screen with stars/coins.
- Boat collisions between racers (soft push, no damage).
Done when: a full 6-boat race works start to finish and feels fair and fun.

## [ ] Task D — Menus, boats, save, audio
- Title → boat select (4 boats with stat bars, driver billboard) → track select (best lap, stars) → race → results → retry/menu.
- `audio.js` WebAudio sfx + engine hum, mute toggle. Settings: tilt, PS1 wobble, sound, difficulty.
- `localStorage` save (key in README).
Done when: I can play the full menu flow without touching the code.

## [ ] Task E — Art sheets (do this in PARALLEL chats if you want, see `PROMPTS.md`)
Generate the image sheets listed in `PROMPTS.md` and commit the raw PNGs to `sprites/sheets/`.
Claude will cut them into `sprites/*.webp` and write `sprites/list.json`.
The game must already look for `sprites/list.json` and use any sprite listed there, otherwise keep the placeholder.

## [ ] Task F — Tracks 2 and 3 (Lantern Canyon, Frostbite Falls)
- Add both tracks with unique scenery, sky/fog colours, hazards and one shortcut each.
- Unlock order: finish top 3 on the previous track.

## [ ] Task G — Polish pass (only after the owner has playtested)
Wait for the owner's feedback in `NOTES.md` (section "Playtest feedback") before doing anything here.
