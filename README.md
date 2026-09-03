# DuniaKu v2.0 — 2D Game Edition

DuniaKu is an offline-first kids playground PWA. v2 keeps all 21 activities from v1 and upgrades the main arcade experiences to a real 2D game-engine layer.

## What changed in v2

### Phaser 4 engine games
- Momo Pet World — animated 2D virtual pet room
- Fruit Merge — Matter physics, rolling / collision / merge
- Racing Challenge — animated top-down racing
- Endless Runner — Arcade physics
- Maze Adventure — animated 2D maze
- Bubble Pop — animated interactive Phaser mini-game

### Pet economy
Stars earned across activities can now be spent in Star Shop on:
- room themes: Sunny, Night, Forest, Space
- hats: Red Cap, Star Hat, Crown
- toys: Ball, Duck, Rocket
- pet skins: Gold, Sky, Mint, Berry

Daily Gift is included. Pet hunger / mood / cleanliness / energy still decay with real elapsed time and the pet can evolve through stages.

### Existing activities preserved
Memory Match, Word Hunt, Jigsaw Shuffle, Spot Difference, Rhythm Tap, Hidden Object, Logic Lights, Free Drawing, Colouring, Sticker Scene, Build-a-Room, Character Creator, Music Pad, Story Maker, and Block Coding remain available.

## Offline model
The app shell and local files are precached by `sw.js`.

Phaser 4.2.1 is loaded from the official jsDelivr distribution on the first online launch and cached by the service worker. After that first successful online load, engine games can run offline together with the rest of the PWA.

No login, database or analytics are required. User progress is stored in `localStorage` on the device.

## Publish with GitHub Pages
1. Create a GitHub repository, for example `duniaku`.
2. Upload **the contents of this folder** to the root of the repository.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select your main branch and `/ (root)` then Save.
6. Open the GitHub Pages URL once while online.
7. On Android Chrome or iPhone/iPad Safari, use **Add to Home Screen / Install App**.
8. Re-open after the first complete load to verify offline mode.

## Important files
- `index.html` — application shell
- `styles.css` — responsive UI and CSS artwork
- `app.js` — local state + non-engine activities
- `engine-games.js` — Phaser game layer, Pet World, shop and daily gift
- `sw.js` — PWA offline cache
- `manifest.json` — install metadata

## Engine
Phaser 4.2.1, MIT License: https://phaser.io/download/release/v4.2.1

DuniaKu's custom game logic and vector game artwork in this prototype are implemented directly in the project code. No third-party game artwork pack is required.
