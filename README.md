# Ruang Matriks

Media belajar interaktif Matriks untuk **Matematika Tingkat Lanjut - Kelas 11**.
100% frontend (vanilla HTML/CSS/JS), tanpa backend, tanpa build step.

---

## Cara Menjalankan

Aplikasi memuat konten lewat `fetch()`, dan browser memblokir `fetch` pada protokol
`file://`. Karena itu **harus dijalankan lewat server lokal** — bukan dengan
klik ganda `index.html`.

### Opsi 1 — Python (paling gampang, sudah ada di kebanyakan komputer)

```bash
python -m http.server 5173 --directory "matriks-lab-interaktif"
```

Lalu buka **http://localhost:5173** di browser.

### Opsi 2 — Node.js

```bash
npx serve matriks-lab-interaktif -l 5173
```

### Opsi 3 — VS Code

Pasang ekstensi **Live Server**, klik kanan `index.html` → *Open with Live Server*.

> **Catatan:** hentikan server dengan `Ctrl + C` di terminal.

---

## Struktur Proyek

```
matriks-lab-interaktif/
├── index.html                  Shell SPA (memuat KaTeX & GSAP via CDN)
├── PRD.md                      Dokumen kebutuhan produk
├── README.md
│
├── content/                    Naskah materi (Markdown) — sumber untuk review manusia
│   ├── 01_Konsep_Dasar.md
│   ├── 02_Operasi_Aljabar.md
│   ├── 03_Determinan_Invers.md
│   └── 04_Pemodelan_TKA.md
│
├── data/                       Konten terkompilasi yang dibaca aplikasi
│   ├── lessons.json            Manifest bab + urutan sub-topik
│   ├── quizzes.json            Bank soal mode Kuis (+ konfigurasi Simulasi TKA)
│   └── chapters/               Isi tiap bab (lazy-load, satu berkas per bab)
│
├── css/
│   ├── base.css                Design token, reset, tipografi
│   ├── layout.css              Shell 100vh, header, main menu
│   ├── components.css          Tombol, kartu, Mathpad, Toast, Modal
│   ├── matrix.css              Grid matriks, chip, drop-zone, panggung simulasi
│   ├── simulations.css         Komponen simulasi + Whiteboard sandbox
│   ├── scrollbars.css          Scrollbar kustom bertema
│   ├── animations.css          Keyframes fallback & util animasi
│   ├── phase7.css              Kunci tanpa-scroll, identitas gambar kerja
│   ├── phase8.css              Densitas lanskap + komponen ketuk-ketuk
│   ├── phase9.css              Sistem desain TRANSFORMASI
│   └── phase10.css             Sidebar & Stage, header, poles presisi (TERAKHIR)
│
├── js/
│   ├── app.js                  Entry point + seluruh layar
│   ├── router.js               Router berbasis hash (deep-link)
│   ├── engine/                 matrix.js · validator.js · katexRenderer.js
│   ├── state/progressStore.js  Pembungkus localStorage (pencapaian, permanen)
│   ├── state/sessionState.js   Pembungkus sessionStorage (posisi, sepanjang sesi)
│   ├── ui/mathpad.js           Papan angka, papan variabel, DAN papan huruf teks
│   ├── interactions/           dragDrop · flyToAnimation · mergeAnimation
│   ├── ui/                     mathpad · toast · modal · icons
│   └── modules/                belajar/ · kuis/
│
└── tests/
    ├── smoke.py                Uji asap Playwright (end-to-end)
    └── engine.test.mjs         Uji matematika murni (21 pemeriksaan)
```

---

## Tiga Mode

> **Fase 9 — media terkunci lanskap.** Aplikasi ini bukan sandbox. Ia hanya
> berjalan dalam orientasi **landscape**; di potret, layar penuh berisi pesan
> yang meminta perangkat diputar. Ada layar masuk singkat (nama & asal sekolah)
> sebelum menu utama, dan **keyboard OS tidak pernah dipakai** — bahkan untuk
> teks, siswa mengetik lewat papan huruf kustom.

| Mode | Rute | Isi |
|---|---|---|
| **Belajar** | `#/belajar` | 22 sub-topik, tiap sub-topik: Materi → Simulasi → Mini Kuis |
| **Kuis** | `#/kuis` | Latihan soal per bab |
| **Simulasi TKA** | `#/tka` | Placeholder — mode ujian lintas bab sedang disiapkan |

> **Lab Maya dicabut di Fase 9.** Sebagai gantinya, simulasi di mode Belajar
> diperkaya: perkalian matriks kini punya tiga kasus dengan ordo berbeda.

---

## Tema "TRANSFORMASI"

Kertas terang `#EFF4FF` dengan tiga bidang warna lembut (`.blob`) yang
mengambang sangat pelan di belakang, ditumpuk pola titik halus yang memudar ke
tepi. Seluruh konten hidup di **kartu putih murni** bersudut besar dengan
bayangan lembut — tidak pernah langsung di atas latar.

Tipografi: **Montserrat** 700/800/900 untuk judul (geometris, tegas, tetap
ramah) dan **Roboto** untuk teks isi (keterbacaan tinggi di ukuran kecil).

Aksen: royal `#1D4ED8` · cyan `#06B6D4` · kuning `#FFC800` · magenta `#EC0F8C`.

Mode gelap dan pengalihnya **dicabut** di Fase 9 — satu tema saja, konsisten di
proyektor kelas maupun tablet.

## Aturan Arsitektur yang Ditegakkan

Kontrak berikut bukan preferensi — semuanya diuji otomatis di `tests/smoke.py`:

1. **Tidak ada UI native.** `alert()`, `confirm()`, dan `prompt()` dilarang total.
   Semua input angka lewat **Mathpad** kustom (field `readonly` + `inputmode="none"`
   agar keyboard OS tidak pernah muncul dan merusak tata letak). Mode pecahan
   ditampilkan **bertumpuk vertikal**: pembilang, garis, penyebut.
2. **Umpan balik konstruktif.** Setiap penolakan interaksi wajib disertai Toast
   yang menjelaskan **mengapa** — indikator merah/getar tidak boleh berdiri sendiri.
3. **Viewport terkunci 100vh.** `<body>` tidak pernah scroll; scroll hanya terjadi
   di panel internal, dengan scrollbar bertema (bukan scrollbar bawaan OS).
4. **Tidak ada tautan teks telanjang.** Setiap aksi yang bisa diklik punya kotak,
   batas, padding, dan status hover — termasuk segmen kecil seperti "Angka/Pecahan".
7. **Kecepatan animasi konstan.** Pengatur 0.5x/1x/2x dihapus; setiap durasi sudah
   ditimbang secara pedagogis. Satu-satunya penyimpangan adalah
   `prefers-reduced-motion`.
8. **Toast error singleton.** Hanya satu Toast kesalahan boleh aktif; yang baru
   langsung menggantikan yang lama, tidak pernah menumpuk.
9. **Opsi salah dikunci.** Pilihan/label yang keliru dimatikan permanen agar siswa
   mengerucut ke kemungkinan yang tersisa, bukan menebak berulang.
10. **Dua cara memindahkan elemen.** Setiap interaksi seret juga bisa dilakukan
    dengan **ketuk-ketuk**: ketuk sumber → ketuk tujuan. Keduanya memanggil
    callback yang sama, jadi animasi Fly/Merge-nya identik. Ini wajib karena
    menyeret elemen kecil di ponsel/tablet sering gagal.
11. **State slide tidak bocor.** Slide/kasus yang sudah diselesaikan tetap
    terlihat selesai saat dikunjungi ulang — tidak direset dan tidak dijalankan
    ulang.
5. **Konten selalu di dalam kartu opak.** Teori dan simulasi tidak pernah dirender
   langsung di atas latar grid, sehingga garis blueprint tidak pernah mengganggu
   keterbacaan.
6. **Bahasa warna, bukan jargon.** Instruksi menyebut "yang **berwarna biru**"
   alih-alih "yang disorot", didampingi legenda warna dan denyut
   (`@keyframes hlPulse*`) yang berjalan terus pada elemen target.

## Perilaku Belajar

- **Sub-topik baru** berjalan berurutan: Materi → Simulasi → Mini Kuis.
- **Simulasi selesai** langsung mengunci seluruh elemen interaktifnya
  (`.sim--done`) dan tombol "Lanjut ke Mini Kuis" mulai berdenyut sebagai pemandu.
- **Simulasi bertahap** memakai slider dengan titik navigasi: siswa bisa
  mengulang satu langkah tertentu tanpa mereset seluruh simulasi.
- **Kuis** disajikan satu soal per layar penuh, dengan titik navigasi antar soal.
- **Sub-topik yang sudah selesai** masuk **Mode Review**: tab Materi | Simulasi |
  Mini Kuis menjadi tombol yang bisa diklik bebas, tanpa harus mengulang urutan.
- **Bab yang tuntas** ditandai aksen emas + ikon piala di daftar bab.
- **Kuis di mode review** tidak menjalankan logika kuis sama sekali — yang tampil
  adalah soal beserta **kunci jawaban dan pembahasannya** untuk dibaca ulang.

## Rancangan Simulasi (Fase 5)

| Sub-topik | Mekanik |
|---|---|
| Letak baris/kolom | Analogi denah tempat duduk; pilih baris biru / kolom oranye, lalu seret label alamat |
| Ordo | Slider baris & kolom + tombol **Cek Ordo**; tiap tantangan direset bersih |
| Jenis matriks | Materi berupa **carousel** 6 kartu; simulasi menyeret **label ke matriks** (bisa banyak label) |
| Transpose | **Morph**: tiap baris berputar 90° menjadi kolom (metafora "melipat" dibuang) |
| Kesamaan | Klik elemen kiri → pasangan kanan menyala otomatis |
| Jumlah/Kurang | Horizontal `A + B = C`; slide pertama mendemonstrasikan penolakan ordo berbeda |
| Skalar | Seret chip ke **setiap elemen satu per satu**; chip tidak habis |
| Kombinasi | Skalar manual, lalu penjumlahan **juga manual** |
| Ordo perkalian | Mini-simulasi khusus: angka dalam (biru) vs angka luar (kuning) |
| Perkalian matriks | Horizontal `A × B = C`; seret pasangan **langsung ke sel target**, tanpa akumulator |
| Determinan 2×2 | **Tarik garis** pada diagonal biru lalu oranye; ekspresi `(ad) − (bc)` berwarna senada |
| Determinan 3×3 | Salin 2 kolom + **garis pemisah kuning**; ketuk 6 diagonal, garis coretnya **menetap** sebagai jejak |
| Invers 2×2 | Tiga tahap: determinan manual → adjoin lewat ketukan → skalar $1/\det$ ke tiap elemen |

## Dukungan Perangkat Sentuh

Semua interaksi seret punya pasangan **ketuk-ketuk**:

1. Ketuk elemen sumber → ia tersorot, dan **semua tujuan yang sah ikut berdenyut hijau**.
2. Ketuk tujuannya → animasi Fly/Merge yang sama persis dengan drag langsung berjalan.

Ketuk ulang sumber yang sama (atau tekan `Esc`, atau ketuk ruang kosong) untuk
membatalkan. Memulai gerakan seret otomatis membatalkan pilihan ketuk, sehingga
kedua mekanik tidak pernah saling bentrok.

Pada perkalian matriks, sel target berdenyut kuning dan sebuah **garis putus-putus
beranimasi plus kursor hantu** memperagakan lintasan yang harus ditempuh — afordans
yang sebelumnya hilang.

---

## Papan Coret Berdampingan (Fase 19)

Tombol **"Coret"** di sudut kanan-bawah panggung membuka kertas coretan.
Bawaannya **berdampingan**: kertas di kanan, soal mengalir ulang di kiri dan
tetap bisa dijawab — siswa tidak perlu menutup papan atau menahan tombol apa
pun untuk membaca ulang angka matriks.

| Tata letak | Kapan dipakai |
|---|---|
| **Berdampingan** (bawaan) | Hampir semua hitungan; soal & kertas terlihat bersamaan |
| **Kertas penuh** | Hitungan sangat panjang; tahan ikon mata untuk melihat soal |
| **Kalkir** | Menandai soalnya langsung (kertas tembus pandang) |

Lebar kertas diatur lewat pembatas di antara soal dan kertas: **seret**, atau
**ketuk** untuk berganti 40% → 50% → 60%. Pilihan tata letak diingat per
perangkat. Di layar sempit (lanskap ponsel) papan otomatis tampil sebagai
kertas penuh.

## Sistem Visual "Presisi Tenang" (Fase 19)

Penyegaran tampilan untuk belajar berjam-jam: bidang luas netral dan
bersuhu rendah, saturasi merek hanya untuk sinyal (aksi utama, posisi aktif,
status), garis rambut + bayangan berlapis alih-alih garis tebal, judul
Montserrat 800, teks bacaan bertinta lunak, dan angka tabular. Palet merek
TRANSFORMASI tetap sama — yang dimurnikan adalah cara memakainya. Seluruh
gayanya ada di `css/phase18.css` (§19.A dan §19.B).

---

## Arsitektur "Sidebar & Stage" (Fase 10)

Layar belajar dibelah dua kolom, bukan ditumpuk vertikal:

```
┌─────────────────┬───────────────────────────────────────┐
│  ← Judul Bab    │                                       │
│  Sub-topik      │        A  ×  B  =  C                  │
│                 │       ┌──┐   ┌──┐   ┌──┐              │
│  [1][2][3] tab  │       │  │   │  │   │  │              │
│                 │       └──┘   └──┘   └──┘              │
│  Petunjuk       │        2×2    2×2    2×2              │
│  langkah ini    │                                       │
│                 │                                       │
│  [ Lanjut → ]   │                                       │
└─────────────────┴───────────────────────────────────────┘
      25–30%                      69–76%
```

**Kiri (`.ws-side`)** memegang seluruh kendali: tombol kembali, judul bab dan
sub-topik, tab Materi | Simulasi | Mini Kuis, petunjuk langkah-demi-langkah,
dan bilah aksi.

**Kanan (`.ws-stage`)** adalah kanvas murni. Tidak ada tab, tidak ada prompt,
tidak ada tombol di sana — hanya matriks, persamaan, atau teks teori.

Alasannya konkret: sebelum ini semuanya bertumpuk vertikal, dan di lanskap
pendek tumpukan itu menyisakan begitu sedikit tinggi sehingga matriks 3×3 harus
dikecilkan sampai sulit diketuk. Dengan dua kolom, persamaan 3×3 · 3×3 muat satu
baris utuh bahkan di layar 844×390.

Simulasi menaruh petunjuknya lewat `Simulation.addHint()`. Bila `hintHost`
diberikan (mode Belajar selalu memberikannya), brief, legenda warna, prompt,
checklist, pemilih kasus, dan slider langkah semuanya mendarat di panel kiri.

Header dibagi tiga kolom simetris: identitas kiri, **progress ring di tengah**,
dan tombol **Layar Penuh di sudut kanan atas**. Kolom kanan header sengaja
dikosongkan selebar tombol itu supaya keduanya tidak pernah bertabrakan.

## Orientasi Lanskap & Layar Masuk (Fase 9)

Aplikasi mengunci dirinya ke orientasi **landscape**. Di potret, sebuah lapisan
`z-index: 9999` menutupi layar: latar diburamkan, ikon perangkat berputar, dan
pesannya lugas — *"Mohon putar perangkat Anda ke mode Landscape untuk
pengalaman belajar terbaik."* Isi aplikasi disembunyikan sepenuhnya, bukan
sekadar tertutup, supaya tidak ada interaksi yang bocor lewat overlay.

Sebelum menu utama, siswa melewati **layar masuk**: nama dan asal sekolah.
Keduanya `readonly` + `inputmode="none"`, jadi keyboard OS tidak pernah muncul;
yang terbuka adalah **papan huruf QWERTY** milik Mathpad (26 huruf, spasi,
hapus, Shift). Datanya disimpan di `sessionStorage` — ini perkenalan untuk satu
sesi, bukan akun, sehingga perangkat yang dipakai bergantian di kelas tidak
menyapa siswa berikutnya dengan nama siswa sebelumnya.

Tombol **Layar Penuh** mengambang tetap di sudut kanan bawah, hidup di luar
`#app` agar tidak ikut dibongkar setiap kali layar berganti.

## Tiga Kasus Perkalian Matriks (Fase 9)

Simulasi perkalian tidak lagi berhenti di 2×2. Sub-navigasi di atas panggung
menawarkan tiga kasus, dan ordonya yang berganti-ganti itulah pelajarannya:

| Kasus | Ordo | Yang dilatih |
|---|---|---|
| 1 | 2×2 · 2×2 | Pola dasar baris × kolom |
| 2 | 2×3 · 3×1 | Hasilnya **2×1** — bukan mengikuti salah satu operan |
| 3 | 3×3 · 3×3 | Sembilan sel, masing-masing dari tiga pasang elemen |

Engine menskalakan sel dan jarak secara otomatis mengikuti ordo terlebar, jadi
3×3 · 3×3 tetap muat satu layar lanskap. Menyelesaikan kasus pertama sudah
membuka Mini Kuis; dua kasus lain tetap terbuka sebagai latihan tambahan.

## Navigasi Mini Kuis (Fase 9)

Setiap kuis punya tombol **Sebelumnya / Berikutnya** yang berdiri sendiri dan
pelacak progres yang menyebut angkanya: *"Soal 1 dari 3."* Titik-titik kecil
versi lama sulit ditekan di layar sentuh dan tidak pernah memberi tahu berapa
soal yang tersisa. Soal yang belum pernah dibuka tetap terkunci.

## Aritmetika Pecahan Eksak

`js/engine/rational.js` menangani semua bilangan sebagai pasangan
pembilang/penyebut yang disederhanakan dengan FPB, dengan penyebut selalu
positif. Konsekuensinya, perkalian skalar pecahan **tetap pecahan**:

`1/2 × 3 = 3/2`  ·  `2/4 × 2 = 1`  ·  `1/3 × 1/3 = 1/9`

Tidak ada pembulatan desimal, dan hasilnya dirender KaTeX sebagai `\frac{a}{b}`.

## Perkalian Matriks Langkah demi Langkah

Alur satu sel hasil, dari nol sampai jadi:

1. Sel hasil berkedip mengundang (`.cell--invite`) — siswa mengkliknya untuk
   memilih target.
2. Sel target berdenyut kuning; garis putus-putus beranimasi memperagakan
   lintasan yang harus ditempuh.
3. Seret elemen **baris** → sel menampilkan `3`.
4. Seret elemen **kolom** pasangannya → berubah jadi `(3×1)`.
5. Pasangan berikutnya → `(3×1) + (3×0)`, dan seterusnya.
6. Setelah semua pasangan lengkap, tombol **hitung** baru muncul. Sebelum itu
   tombolnya memang tidak ada — tidak ada jalan pintas.
7. Menekannya menjalankan animasi `cell--resolving`, lalu nilai akhirnya ditulis.

## Kebijakan Tanpa-Scroll

`html` dan `body` dikunci (`overflow: hidden; position: fixed`). Tinggi layar
dibagi grid tiga baris: header (auto) · layar (`minmax(0,1fr)`) · footer (auto).
Satu-satunya wadah yang boleh menggulir adalah `.scroll-area` / `.workspace__body`
/ `.menu`.

### Lanskap dan potret ditangani berbeda (Fase 8)

Keduanya sempit di sumbu yang berlawanan, jadi solusinya juga berlawanan.

**Lanskap — nol gulir halaman.** Yang berlimpah di sini adalah lebar. Materi
tidak digulir melainkan **dipaginasi**: blok-bloknya diukur di DOM sungguhan
lalu dijejalkan ke kolom setinggi layar, dan kolom yang tidak muat pindah ke
halaman berikutnya yang dinavigasi dengan titik — pola yang sama dengan kuis dan
simulasi. Panggung simulasi pun mengalir **menyamping**, bukan bertumpuk.
Kerangka (header, bilah judul, bilah aksi) dirampingkan agar tiap piksel yang
dihemat jadi ruang baca.

Bila sebuah simulasi memang lebih tinggi dari layar lanskap, yang menggulir
adalah **panggungnya sendiri** — halamannya tidak, dan bilah aksinya tetap
terlihat.

**Potret — boleh menggulir, tapi lega.** Di sini yang sempit adalah lebar, jadi
materi mengalir satu kolom dan digulir vertikal seperti biasa, dengan padding
yang justru **diperbesar**. Memampatkan potret sampai muat satu layar hanya
membuatnya sesak tanpa manfaat.

**Bilah aksi hidup di luar area scroll.** Tombol utama ("Mulai Simulasi",
"Lanjut ke Mini Kuis") ditempatkan di `.workspace__actions`, sebuah baris grid
tersendiri di bawah area yang menggulir, sehingga aksi utama selalu terlihat
tanpa siswa perlu menggulir apa pun.

Portrait ponsel 375×720 muat penuh tanpa scrollbar — diuji otomatis.

## Anti-Pergeseran Tata Letak

Tidak ada elemen yang boleh mendorong elemen lain saat state berubah:

- Banner "Simulasi selesai" adalah **overlay absolut**, bukan elemen aliran.
- Tombol yang sudah selesai dipakai disembunyikan dengan `visibility: hidden`,
  **tidak** dengan `remove()` — menghapusnya akan mengempiskan barisnya.
- `.stage`, `.workstrip-row`, dan `.actionbar` punya tinggi minimum tetap.
- Wadah pesan memakai `.reserved-slot` bertinggi tetap.

## Footer

Footer global permanen, memakai tanda registrasi khas lembar gambar teknik:

> Copyright Penta Putra Purnomo, S.Pd., Gr. | SMAS YPVDP Bontang.

---

## Menjalankan Pengujian

```bash
node tests/engine.test.mjs
```

```bash
python tests/smoke.py --serve
```

656 pengujian end-to-end (Playwright) + 21 pengujian unit engine.

`smoke.py` membutuhkan Playwright:

```bash
pip install playwright && playwright install chromium
```

---

## Cakupan Kurikulum

Selaras dengan kisi-kisi TKA (`docs/TKA Matriks kemendikdasmen.png`): elemen matriks
berupa bilangan real, **determinan dan invers dibatasi ordo 2×2 dan 3×3**. Bank soal
memuat butir yang diadaptasi dari soal asli TKA Matematika Lanjut 2025, termasuk
format **"pilih semua jawaban benar"** yang memang muncul di ujian aslinya.

---

## Dukungan Browser

Chrome/Edge/Firefox/Safari versi modern (butuh ES6 modules native, `dvh`, dan
Pointer Events). Mode `prefers-reduced-motion` dihormati: animasi dipersingkat
tanpa mengubah urutan pedagogisnya.
