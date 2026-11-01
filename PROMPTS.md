# Momo Maze: Art Brief untuk ChatGPT

Game ni **dah siap dan boleh dimain**. Semua gambar sekarang dilukis guna placeholder dalam code.
Tugas kau (ChatGPT): **jana 12 gambar di bawah dan commit ke `sprites/sheets/`** dengan nama fail yang TEPAT.
Game akan baca gambar tu automatik. **Jangan ubah sebarang file code** (`*.js`, `*.html`, `*.css`).

## Peraturan wajib (semua gambar)

1. **Background warna magenta penuh `#FF00FF`.** Game buang warna ni jadi transparent. Jangan guna magenta/pink terang dalam watak.
2. **Grid tepat** ikut saiz yang ditulis (contoh 3x2 = 3 lajur, 2 baris). Setiap petak SAMA besar. Satu objek satu petak, letak di **tengah petak** dengan ruang kosong sekeliling.
3. **Tiada** garisan grid, nombor, label, teks, bayang di atas background, atau frame.
4. **Style sama untuk SEMUA gambar:** cozy chibi mobile game, soft painted shading, outline gelap tebal, warna cerah dan hangat, pandangan **top-down 3/4** (nampak atas dan sedikit depan), macam game Cozy Arena.
5. Saiz fail: PNG, **1536x1024** untuk 3x2, **1024x1024** untuk 2x2, **1536x512** untuk 3x1.
6. Buat **satu gambar satu mesej**, ikut urutan. Lepas setiap gambar, commit terus ke `main`:
   `art(maze): <nama fail>`.
7. Kalau hasil tak ikut grid atau watak lain rupa, **jana semula** sebelum commit.

## Watak utama: Momo

Anak kucing oren (orange tabby) yang comel, kepala besar badan kecil (chibi), mata bulat besar coklat gelap,
hidung pink kecil, **skaf biru** di leher, **beg galas kecil coklat**. Ekor panjang berbelang.
Momo mesti nampak SAMA dalam setiap frame (warna, skaf, beg, saiz).

---

## 1. `hero_walk.png` (3x2, 1536x1024)
Momo berjalan, seluruh badan, kaki di bahagian bawah petak.
- Baris 1: **depan** langkah kiri, **depan** langkah kanan, **belakang** (nampak beg & ekor) langkah kiri
- Baris 2: **belakang** langkah kanan, **tepi menghadap KANAN** langkah 1, **tepi menghadap KANAN** langkah 2

## 2. `hero_pose.png` (3x1, 1536x512)
Momo seluruh badan menghadap depan: **berdiri santai (idle)**, **gembira melompat tangan ke atas**, **pening/sakit (mata X, bintang kecil atas kepala)**.

## 3. `items.png` (3x2, 1536x1024)
- Baris 1: **bintang emas** berkilat (collectible), **hati merah** comel, **obor kayu** dengan api oren
- Baris 2: **rumah kecil Momo** (pintu terbuka, lampu kuning menyala, ini garisan penamat), **perangkap duri MASUK** (plat batu segi empat dengan lubang), **perangkap duri KELUAR** (plat sama, duri besi tajam terpacak)

## 4. `keys.png` (3x2, 1536x1024)
- Baris 1: **kunci merah**, **kunci biru**, **kunci hijau** (kunci antik, besar, mudah nampak)
- Baris 2: **pintu kayu bingkai merah**, **pintu kayu bingkai biru**, **pintu kayu bingkai hijau**. Setiap pintu ada lubang kunci, pandangan 3/4 macam blok tembok (nampak atas & depan), isi penuh petak.

## 5. `enemies.png` (2x2, 1024x1024)
Musuh comel tapi nakal, seluruh badan, menghadap KANAN.
- Baris 1: **Snowbo** (manusia salji bulat kecil, hidung lobak, mata biru marah-comel) frame 1, frame 2 (badan condong/langkah)
- Baris 2: **Boo** (hantu ungu lembut separa lutsinar, lidah keluar) frame 1, frame 2 (ekor beralun)

## 6. `worlds.png` (3x2, 1536x1024)
Lencana bulat (badge) untuk peta dunia:
- Baris 1: **Taman Bunga** (bunga tulip & pagar hijau), **Hutan Kunci** (pokok & kunci emas), **Gua Gelap** (gua & kristal biru bercahaya)
- Baris 2: **Lembah Salji** (gunung salji & Snowbo kecil), **Istana Hantu** (istana ungu & bulan), **badge terkunci** (kelabu dengan mangga)

## 7–11. Tile dunia (3x2, 1536x1024 setiap satu)
Setiap tile **segi empat sama, isi penuh petak** (tak perlu ruang kosong sangat). Pandangan top-down.
- Baris 1: **lantai A**, **lantai B** (sedikit variasi), **lantai dengan hiasan kecil**
- Baris 2: **blok dinding A**, **blok dinding B**, **blok dinding dengan hiasan**
- Blok dinding = pandangan 3/4: **atas** blok nampak (75%) + **muka depan** lebih gelap di bawah (25%). Dinding mesti **lebih gelap** dari lantai supaya laluan jelas.

| Fail | Lantai | Dinding |
|---|---|---|
| `tiles_taman.png` | rumput hijau muda, bunga kecil | pagar pokok renek (hedge) hijau gelap |
| `tiles_hutan.png` | denai tanah coklat muda, daun gugur | pokok/semak hutan hijau tua |
| `tiles_gua.png` | lantai batu kelabu-ungu | dinding batu gelap, ada kristal biru |
| `tiles_salji.png` | salji putih lembut | tembok ais biru gelap |
| `tiles_istana.png` | jubin istana lavender cerah | tembok bata ungu gelap, ada lilin |

## 12. `title_bg.png` (1024x1536, portrait, BUKAN grid, tiada magenta)
Ilustrasi skrin utama: Momo berdiri di pintu masuk maze pagar hijau yang besar, jalan berliku ke rumah kecil jauh di belakang,
langit petang hangat. **Ruang kosong di tengah atas** untuk logo (jangan letak teks). Bahagian bawah lebih gelap sedikit untuk butang.

---

## Selepas semua siap
Buka game. Kalau gambar nampak, tick dalam senarai bawah dan commit.

- [x] hero_walk.png
- [x] hero_pose.png
- [ ] items.png
- [ ] keys.png
- [ ] enemies.png
- [ ] worlds.png
- [ ] tiles_taman.png
- [ ] tiles_hutan.png
- [ ] tiles_gua.png
- [ ] tiles_salji.png
- [ ] tiles_istana.png
- [ ] title_bg.png
