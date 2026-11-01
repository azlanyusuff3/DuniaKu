# Momo Maze 🐾

Game maze top-down (PWA). Bantu **Momo** si anak kucing cari jalan pulang ke rumah.
Main terus di browser atau Install ke home screen. Boleh main offline.

## Cara main
- **Swipe** ke arah nak gerak. Momo terus berjalan ikut lorong dan berhenti di simpang.
- Kutip **3 ⭐** setiap level (rating level). Sampai **rumah 🏡** = menang.
- 3 nyawa ❤️. Kena musuh/duri = hilang 1 nyawa dan balik ke titik mula.
- D-pad dan bunyi boleh on/off dalam menu Rehat (⏸). Keyboard: arrow / WASD.

## 5 dunia × 20 level = 100 level (makin lama makin susah)
| Dunia | Level | Benda baru |
|---|---|---|
| 🌷 Taman Bunga | 1–20 | Maze asas, saiz makin besar |
| 🌲 Hutan Kunci | 21–40 | Kunci warna buka pintu warna sama (1–3 pintu) |
| 🕯️ Gua Gelap | 41–60 | Gelap, nampak dekat je. Kutip obor untuk lebih terang |
| ❄️ Lembah Salji | 61–80 | Snowbo meronda di simpang, kena tunggu masa sesuai |
| 🏰 Istana Hantu | 81–100 | Duri timbul-tenggelam + hantu Boo + gelap (81–90 terang) |

Semua level dijana dengan seed tetap (level sama = maze sama) dan **dibuktikan boleh siap** oleh `tests/validate.js`:
kunci sentiasa boleh dicapai sebelum pintunya, dan bintang/kunci tak pernah diletak dalam kawasan rondaan musuh.

## Fail
- `index.html`, `style.css`: UI
- `levels.js`: penjana maze & level
- `art.js`: loader sprite sheet ChatGPT + placeholder procedural
- `game.js`: gameplay, input, save (localStorage), PWA
- `sw.js`: service worker (bump `CACHE` setiap kali update)
- `sprites/sheets/`: gambar dari ChatGPT. Lihat **PROMPTS.md**
- `tests/validate.js`: `node tests/validate.js`

## Art
Gambar sheet magenta di `sprites/sheets/` dibaca terus oleh game (magenta dibuang, grid dipotong automatik).
Kalau fail tiada, game guna placeholder. Spec penuh dalam **PROMPTS.md**.
