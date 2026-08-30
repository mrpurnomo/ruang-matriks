# HANDOFF — Ruang Matriks

> Dokumen serah-terima antar sesi. Diperbarui **30 Agustus 2026**, menutup Fase 10.
> Status: **fase 1–10 selesai, seluruh pengujian otomatis hijau (21/21 + 300/300).**
>
> ⚠️ **SESI BERIKUTNYA = FASE 11: BUG SQUASHING.** QA manual menemukan **9 masalah
> UI/UX** yang lolos dari suite otomatis. Cetak birunya ada di **§0 — baca itu
> lebih dulu sebelum apa pun.** Suite hijau BUKAN berarti aplikasinya benar;
> lihat catatan pengujian di §0.4.
>
> **Fase 10 mengubah nama dan tata letak.** Aplikasi kini bernama **Ruang Matriks**,
> dan layar belajar memakai arsitektur **Sidebar & Stage**: kendali di kolom kiri,
> kanvas matriks di kolom kanan. Repositori git sudah diinisialisasi.
>
> **Fase 9 adalah pivot besar.** Aplikasi bukan lagi sandbox: **Lab Maya dicabut
> total**, tampilannya berganti ke sistem desain terang "TRANSFORMASI", dan media
> ini **dikunci ke orientasi lanskap**. Ada layar masuk sendiri dengan papan huruf
> kustom. Simulasi invers 3×3 **masih** ditangguhkan (lihat §11).

---

## 0. FASE 11 — CETAK BIRU BUG SQUASHING (KERJAKAN INI DULU)

Sembilan temuan QA manual, lengkap dengan dugaan akar masalah dan berkas yang
harus disentuh. **Dugaan tetap dugaan** — verifikasi dengan pengukuran di
peramban sebelum menulis perbaikan. Beberapa di antaranya saling bertaut
(nomor 3, 5, dan 7 semuanya berakar di pembongkaran yang tidak tuntas), jadi
urutan pengerjaannya penting.

### 0.1 Urutan yang disarankan

Kerjakan **fondasi dulu**, karena tiga bug lain akan ikut sembuh atau berubah
bentuk setelahnya:

| Urut | Isu | Alasan didahulukan |
|---|---|---|
| 1 | **#5** Kebocoran animasi GSAP | Pembersihan global; #3 dan #7 ikut terbantu |
| 2 | **#7** Slider ganda | Bug pembongkaran paling sederhana — jadi kasus uji fondasi |
| 3 | **#3** Perkalian multi-kasus | Bug pembongkaran terberat; butuh #5 & #7 beres |
| 4 | **#8** Jumlah/Kurang jadi ketuk-ketuk | Menyentuh engine yang sama dengan #3 |
| 5 | **#4** Bypass login | Mandiri, cepat |
| 6 | **#2** Animasi denyut | Murni CSS |
| 7 | **#1**, **#9**, **#6** Skala & gulir | Murni tata letak; kerjakan berbarengan |

---

### 0.2 Sembilan isu, satu per satu

#### ISU 1 — Isi panggung terlalu kecil di layar besar

**Gejala.** Di monitor lebar, matriks dan teks di dalam Stage terlihat mungil;
ruang kosong terbuang.

**Dugaan akar masalah.** Ukuran ditulis dalam piksel tetap, bukan relatif:

- `css/phase10.css` §6 — `.ws-stage .cell { min-width: 52px; min-height: 50px }`
- `css/matrix.css` — `.cell` dasar juga piksel tetap
- `css/phase10.css` §5 — `.ws-stage .materi-card { width: min(920px, 100%) }`
  memaku lebar baca di 920px betapapun lebarnya layar

**Strategi.**

1. Ganti ukuran sel ke `clamp()` yang terikat viewport, mis.
   `min-width: clamp(46px, 3.4vw, 76px)`. Jaga ambang sentuh 44px sebagai
   batas bawah — itu kontrak yang sudah ada.
2. `font-size` sel ikut `clamp()` supaya angkanya membesar bersama kotaknya.
3. Naikkan batas lebar baca bertingkat: `min(920px, 100%)` di bawah 1440px,
   naik ke ~1100px di atasnya. Pertimbangkan container query (`@container`)
   pada `.ws-stage` — ia lebih tepat daripada media query karena yang relevan
   adalah lebar PANGGUNG, bukan lebar layar.
4. `.stage` `min-height` juga ikut `clamp` supaya kanvasnya tumbuh.

**Berkas.** `css/phase10.css`, `css/matrix.css`, mungkin `css/phase11.css` baru.

**Cara membuktikan.** Render di 1280, 1920, dan 2560. Ukur tinggi `.cell` dan
lebar `.materi-card`; keduanya harus naik, bukan datar.

---

#### ISU 2 — Denyut harus mengubah SELURUH latar sel

**Gejala.** Denyut sekarang hanya menggerakkan garis tepi dan bayangan. Dari
jarak pandang kelas, itu terlalu halus.

**Strategi.** Tambahkan keyframe yang menganimasikan `background-color` penuh,
bukan hanya `border-color`/`box-shadow`. Bedakan per peran, konsisten dengan
bahasa warna yang sudah dipakai (kontrak §5 butir 8 — sebut warnanya, jangan
bilang "disorot"):

| Peran | Kelas | Warna latar denyut |
|---|---|---|
| Sumber / baris | `.cell--pulse`, `.cell--row-hl` | biru (`--blue-100` → `--royal` tipis) |
| Kolom | `.cell--col-hl` | oranye/magenta (`--magenta-100`) |
| Target sedang dihitung | `.cell--target`, `.cell--invite` | kuning (`--yellow-100` → `--yellow`) |
| Terpilih (ketuk) | `.cell--picked` | kuning pekat, sudah ada |

Pastikan teksnya tetap terbaca saat latar paling pekat — cek kontras, jangan
hanya melihatnya sekilas. Hormati `prefers-reduced-motion` (sudah ada blok
khususnya di `css/animations.css`).

**Berkas.** `css/animations.css` (keyframes `hlPulse*`), `css/matrix.css`.

---

#### ISU 3 — Perkalian multi-kasus: seret rusak & progres hilang

Dua bug terpisah dalam satu engine. **Ini yang paling berat.**

**3a. Seret mati total setelah pindah kasus.**

Langkah reproduksi: selesaikan Kasus 1 → klik Kasus 2 → coba seret. Tidak ada
yang bergerak.

Dugaan akar masalah — periksa ketiganya:

1. `teardownCase()` di `simOperations.js` memanggil seluruh `this.cleanups`
   lalu **mengosongkan array itu**. Tetapi `this.releaseTargetZone` juga sudah
   didaftarkan lewat `this.track()`, jadi ia dilepas **dua kali**. Pelepasan
   kedua pada zona yang sudah hilang bisa melempar diam-diam dan menghentikan
   sisa pembongkaran.
2. `makeDraggable()` di `js/interactions/dragDrop.js` kemungkinan menyimpan
   state di level modul (sumber ketuk aktif, `suppressClickUntil`, daftar zona).
   Node lama sudah lenyap dari DOM tetapi masih dirujuk, sehingga pointer event
   berikutnya jatuh ke elemen hantu.
3. `document.body.classList` bisa tertinggal di `is-tap-armed` setelah kasus
   dibongkar di tengah jalan.

**Strategi.** Tambahkan fungsi reset global yang jujur di `dragDrop.js` —
mis. `resetDragSystem()` yang: melepas semua drop-zone terdaftar, membatalkan
pilihan ketuk, membersihkan kelas di `body`, dan menolkan state modul. Panggil
ia dari `teardownCase()` **dan** dari `Simulation.destroy()`. Jadikan
`this.track()` idempoten (cegah pelepasan ganda) atau berhenti mendaftarkan
`releaseTargetZone` dua kali.

**3b. Progres kasus hilang saat bolak-balik.**

`buildCase()` selalu membangun ulang dari nol; yang tersimpan hanya
`this.solvedCases` (kasus yang TUNTAS), bukan kemajuan sebagian.

**Strategi.** Simpan state per-kasus di `Map` berkunci indeks kasus:
sel mana yang sudah selesai beserta nilainya. Di `buildCase()`, pulihkan sel-sel
itu (isi angkanya, beri `cell--done`, tandai langkahnya). Progres HANYA boleh
dihapus ketika siswa menekan **"Ulangi Simulasi"** — bukan saat pindah kasus.
Pertimbangkan menaruhnya di `sessionState.js` supaya bertahan saat siswa keluar
ke menu (itu sudah jadi kontrak §5 butir 28).

**Berkas.** `js/modules/belajar/simulations/simOperations.js`,
`js/interactions/dragDrop.js`, mungkin `js/state/sessionState.js`.

**Cara membuktikan.** Skrip Playwright yang benar-benar menyelesaikan satu sel
di Kasus 1, pindah ke Kasus 2, menyeret, lalu kembali ke Kasus 1 dan memeriksa
sel yang tadi selesai MASIH selesai.

---

#### ISU 4 — Login bisa dilewati lewat ikon rumah

**Gejala.** Di layar masuk, tombol merek/rumah di kiri atas tetap bisa diklik
dan melompat ke menu tanpa mengisi nama.

**Dugaan akar masalah.** Penjaga identitas di `app.js` hanya berjalan **sekali**
di `init()`. Sesudah itu, navigasi hash apa pun lolos.

**Strategi.** Dua lapis, jangan hanya satu:

1. **Penjaga rute yang benar-benar menjaga.** Pasang pemeriksaan di setiap
   perpindahan rute (bungkus handler di `registerRoutes`, atau tambahkan hook
   di `router.js`): kalau `getIdentity()` kosong dan tujuannya bukan `/login`,
   alihkan kembali ke `#/login`. Ini menutup juga deep-link manual.
2. **Sembunyikan pemicunya.** Di rute `/login`, sembunyikan atau matikan
   `[data-role="home"]` (dan progress ring, yang juga tidak bermakna di sana).
   Menyembunyikan saja tidak cukup — tanpa lapis 1, mengetik hash di bilah
   alamat tetap tembus.

**Berkas.** `js/app.js`, mungkin `js/router.js`, `css/phase11.css`.

---

#### ISU 5 — Animasi GSAP terus jalan setelah pindah layar

**Gejala.** Klik Home saat animasi berjalan → animasinya lanjut di latar,
membakar CPU dan kadang menulis ke node yang sudah lenyap.

**Dugaan akar masalah.** `mountScreen()` di `app.js` memanggil
`activeView.destroy()`, tetapi `destroy()` hanya melepas cleanup yang terdaftar.
Timeline GSAP yang sedang berjalan, `setTimeout` yang tertunda, dan chip terbang
di `document.body` tidak tersentuh.

**Strategi.**

1. Buat satu titik pembersihan, mis. `killAllMotion()` yang diekspor dari
   `js/interactions/flyToAnimation.js` (atau modul `motion.js` baru). Isinya:
   - `gsap.globalTimeline.clear()` dan `gsap.killTweensOf('*')` bila GSAP ada
   - hapus `.fly-chip, .drag-ghost, .diag-trace` dari DOM
   - `hideDragCue()` + `clearTapSelection()`
2. Panggil dari `mountScreen()` **sebelum** `screenHost.innerHTML = ''`.
3. `setTimeout` tersebar di banyak engine. Tambahkan helper berjejak di kelas
   `Simulation` (mis. `this.later(fn, ms)`) yang menyimpan id-nya dan
   membatalkan semuanya di `destroy()`. Migrasikan `setTimeout` yang menyentuh
   DOM ke helper itu.

**Berkas.** `js/interactions/flyToAnimation.js`, `js/app.js`,
`js/modules/belajar/simulations/simCore.js`, seluruh `sim*.js`.

**Cara membuktikan.** Mulai animasi, klik Home, lalu baca
`gsap.globalTimeline.getChildren().length` — harus 0. Hitung juga
`document.querySelectorAll('.fly-chip').length`.

---

#### ISU 6 — Menu bab tidak bisa digulir (sempit) & terlalu kecil (lebar)

**Gejala.** Di lanskap ponsel, daftar bab terkunci — isinya tidak bisa digulir
sehingga bab terakhir tak terjangkau. Di layar lebar, kartunya kekecilan.

**Dugaan akar masalah.** Fase 10 memberi aturan gulir hanya kepada
`.ws-stage > .workspace__body` (jalur Sidebar & Stage). Layar daftar bab
memakai `.workspace` biasa, dan Fase 9 sempat menjadikan `.workspace__body`
sebuah `display:flex` **tanpa** `overflow-y` di jalur itu.

**Strategi.**

1. Beri aturan eksplisit untuk jalur non-split:
   `.workspace:not(.workspace--split) .workspace__body { overflow-y: auto; min-height: 0; }`
   `min-height: 0` wajib — tanpa itu flex item menolak menyusut dan gulirnya
   tidak pernah aktif (jebakan ini sudah menggigit dua kali, lihat §6).
2. Rapikan ukuran: `.chapter-list` / `.chapter-item` memakai `clamp()` untuk
   tinggi dan ukuran huruf, dan grid dua kolom di layar lebar supaya tidak
   ada lajur panjang yang kosong.
3. Terapkan hal yang sama pada daftar sub-topik (`#/belajar/:chapterId`) —
   masalahnya identik dan pasti muncul juga.

**Berkas.** `css/phase9.css`, `css/phase10.css`, `css/layout.css`.

**Cara membuktikan.** Di 844×390, ukur `scrollHeight > clientHeight` DAN
benar-benar gulirkan sampai item terakhir terlihat.

---

#### ISU 7 — Slider paginasi ganda (dobel/tripel)

**Gejala.** Di Penjumlahan (dan mungkin engine lain), muncul dua atau tiga
navigasi titik bertumpuk.

**Dugaan akar masalah.** `ElementwiseOpSim.renderComputeSlide()` memanggil
`this.useSteps(...)` **setiap kali** slide dirender ulang. Sejak Fase 10,
`useSteps()` menempelkan slider lewat `addHint()` — dan `addHint()` mendarat di
**panel kendali**, bukan di `.stage`. `resetStage()` hanya mengosongkan
`.stage`, jadi slider lama tidak pernah tersapu.

**Strategi.** Jadikan `useSteps()` idempoten: kalau `this.slider` sudah ada,
lepaskan dari DOM dan nolkan **sebelum** membuat yang baru. Ini satu perbaikan
di `simCore.js` yang menutup seluruh engine sekaligus. Sebagai jaring pengaman,
tambahkan pengujian yang menghitung `.slider__nav` di seluruh 22 sub-topik
setelah beberapa kali render ulang.

**Berkas.** `js/modules/belajar/simulations/simCore.js`.

---

#### ISU 8 — Jumlah/Kurang harus jadi ketuk-ketuk

**Gejala.** Engine ini masih menuntut seret ke sel hasil. Di ponsel itu sering
meleset — persis alasan determinan dan invers sudah dipindah ke ketukan.

**Strategi.** Cerminkan `Det2x2Sim`:

1. Ketuk elemen di `A` → pasangan seletaknya di `B` menyala, sel lain diredupkan
   (ini sudah berjalan lewat `pickFromA`).
2. Ketuk pasangan di `B` → **langsung** jalankan animasi terbang ke sel hasil.
   Hilangkan `registerDropZone` pada sel target dan `makeDraggable` pada sel
   sumber untuk engine ini.
3. Sel hasil menampilkan `(6+1)`, tombol hitung muncul, hasilnya mendarat.
   Alur ini sudah ada — yang dibuang hanya jalur seretnya.
4. Perbarui `brief` dan toast di
   `data/chapters/02_operasi_aljabar.json` supaya tidak lagi menyuruh menyeret.

**Catatan kontrak.** Kontrak §5 butir 12 mewajibkan setiap seret punya pasangan
ketuk. Menghapus seret sama sekali **tidak melanggarnya** — yang dilarang adalah
seret tanpa alternatif. Perbarui bunyi kontraknya agar tidak menyesatkan sesi
berikutnya.

**Berkas.** `js/modules/belajar/simulations/simOperations.js`,
`data/chapters/02_operasi_aljabar.json`, `tests/smoke.py` (§55, §69a).

---

#### ISU 9 — Kartu Mini Kuis kekecilan & tidak terpusat di layar lebar

**Gejala.** Di layar sempit tampilannya benar; di layar lebar kartunya kecil
dan melenceng dari tengah.

**Dugaan akar masalah.** `.ws-stage .quiz-slider` mewarisi `width: min(920px,
100%)` dari aturan kartu panggung, tetapi pemusatannya bergantung pada
`margin-inline: auto` yang bisa gugur di konteks flex (jebakan yang sudah
tercatat di §6 — margin auto pada sumbu silang membatalkan peregangan).

**Strategi.**

1. Pusatkan dengan `justify-self`/`align-self: center` yang eksplisit, jangan
   mengandalkan `margin-inline: auto` saja.
2. Naikkan lebar maksimum kartu kuis di layar lebar dan skalakan ukuran huruf
   soal dengan `clamp()`.
3. Periksa **dua** jalur: kuis di dalam workspace (langkah 3 sub-topik, jalur
   Sidebar & Stage) dan sesi kuis mandiri `#/kuis/:mode/:bankId` (jalur
   non-split). Keduanya memakai `QuizEngine` tapi wadahnya berbeda.

**Berkas.** `css/phase10.css`, `css/phase9.css`.

**Cara membuktikan.** Ukur selisih jarak kiri-kanan kartu terhadap wadahnya di
1280, 1920, dan 2560 — harus ≤2px di ketiganya.

---

### 0.3 Berkas yang paling mungkin disentuh

| Berkas | Isu |
|---|---|
| `js/interactions/dragDrop.js` | 3a |
| `js/interactions/flyToAnimation.js` | 5 |
| `js/modules/belajar/simulations/simCore.js` | 5, 7 |
| `js/modules/belajar/simulations/simOperations.js` | 3a, 3b, 7, 8 |
| `js/app.js` | 4, 5 |
| `js/router.js` | 4 |
| `js/state/sessionState.js` | 3b |
| `data/chapters/02_operasi_aljabar.json` | 8 |
| `css/animations.css`, `css/matrix.css` | 2 |
| `css/phase9.css`, `css/phase10.css` (atau `phase11.css` baru) | 1, 4, 6, 9 |
| `tests/smoke.py` | semua — setiap perbaikan dapat pengujian regresi |

---

### 0.4 ⚠️ CATATAN PENGUJIAN — BACA SEBELUM MENGKLAIM SELESAI

> **For UI/UX and animation tests, rely on direct Web App Testing / UI rendering
> (HTML/CSS/JS) to visually confirm the fixes, rather than just relying on Python
> smoke tests which cannot see overlapping elements or scale issues.**

Kesembilan bug ini **lolos dari suite 300/300 yang hijau**. Itu bukan kebetulan:
`smoke.py` memeriksa keberadaan node, kelas, dan angka geometri yang sudah
diketahui — ia tidak bisa melihat elemen yang saling menimpa, animasi yang
masih berjalan, skala yang terasa salah, atau daftar yang tidak bisa digulir.

Karena itu, untuk Fase 11:

1. **Render aplikasinya dan LIHAT.** Ambil tangkapan layar di beberapa ukuran
   (1280×720, 1920×1080, 844×390 lanskap ponsel) dan periksa dengan mata.
2. **Jalankan interaksinya seperti siswa**, bukan hanya memeriksa DOM: klik,
   ketuk, pindah kasus, tekan Home di tengah animasi.
3. **Ukur di peramban** — `getBoundingClientRect()`, `scrollHeight` vs
   `clientHeight`, `elementFromPoint()` untuk membuktikan sebuah tombol
   benar-benar bisa ditekan dan tidak tertimpa.
4. **Baru setelah itu** tulis pengujian regresi di `smoke.py` supaya bug yang
   sama tidak kembali.

Pengujian Python tetap wajib sebagai jaring pengaman — ia hanya tidak boleh
jadi satu-satunya bukti bahwa sebuah perbaikan UI berhasil.

---

### 0.5 Status saat serah-terima

| Hal | Keadaan |
|---|---|
| `node tests/engine.test.mjs` | 21/21 lolos |
| `python tests/smoke.py` | 300/300 lolos |
| Git | repo lokal aktif, tidak ada remote |
| Fase 10 | tuntas dan sudah di-commit |
| Fase 11 | **belum disentuh sama sekali** — tidak ada kode yang ditulis untuk kesembilan isu di atas |

---

## 1. Ringkasan Proyek

**Ruang Matriks** — media belajar interaktif untuk **Matematika Tingkat Lanjut - Kelas 11, materi Matriks**, disusun mengikuti kisi-kisi **TKA**.

> Nama lama "Matriks Lab Interaktif" dicabut di Fase 10 bersamaan dengan hilangnya
> Lab Maya. Kalau menemukan sisa nama itu di mana pun, itu bug.

| Aspek | Keputusan |
|---|---|
| Stack | **Vanilla HTML5 + CSS3 + JavaScript ES Modules** |
| Orientasi | **Lanskap saja.** Potret menampilkan pengunci layar penuh, isi aplikasi disembunyikan |
| Tema | **Terang tunggal** ("TRANSFORMASI"). Mode gelap & pengalihnya dicabut di Fase 9 |
| Build step | **Tidak ada.** Tidak ada bundler, tidak ada npm install, tidak ada transpile |
| Backend | **Tidak ada.** 100% frontend, persistensi via `localStorage` |
| Bahasa UI | **Bahasa Indonesia**, nada guru-ke-siswa (hangat, "kamu", tidak formal-kaku) |
| Bahasa komentar kode | **Bahasa Indonesia**, menjelaskan *mengapa*, bukan *apa* |
| Rendering matematika | **KaTeX** |
| Direktori kerja | `F:\MATERI MATEMATIKA\MATEMATIKA TINGKAT LANJUT\KELAS 11\MATRIKS\matriks-lab-interaktif` |
| Version control | **Bukan repo git.** Tidak ada riwayat commit — perubahan langsung di disk |

**Pustaka eksternal (CDN, dimuat di `index.html`):** KaTeX 0.16.9, GSAP 3.12.5 + MotionPathPlugin, Google Fonts (**Montserrat / Roboto / Roboto Mono**). SortableJS dilepas di Fase 9 — ia tidak pernah dipakai.

> ⚠️ Aplikasi butuh koneksi internet untuk CDN tersebut. Belum ada fallback offline.

---

## 2. Cara Menjalankan & Menguji

Modul ES butuh HTTP — membuka `index.html` lewat `file://` **tidak akan jalan**.

Jalankan server statis:

```bash
python -m http.server 5173 --directory "F:/MATERI MATEMATIKA/MATEMATIKA TINGKAT LANJUT/KELAS 11/MATRIKS/matriks-lab-interaktif"
```

Lalu buka `http://localhost:5173/index.html`.

Pengujian unit engine (murni Node, tanpa server):

```bash
node tests/engine.test.mjs
```

Pengujian end-to-end (butuh server sudah hidup di port 5173):

```bash
python tests/smoke.py
```

`smoke.py --serve` bisa menyalakan servernya sendiri. Butuh Playwright:

```bash
pip install playwright && playwright install chromium
```

### Status pengujian per 27 Agustus 2026 — **terverifikasi, bukan klaim**

| Suite | Hasil |
|---|---|
| `node tests/engine.test.mjs` | **21/21 lolos** |
| `python tests/smoke.py` | **300/300 lolos** |

Fase 9 menambah bagian 63–69; Fase 10 menambah bagian 70–76: identitas aplikasi,
sapaan masuk & hak cipta, penempatan header, arsitektur Sidebar & Stage (diukur di
tiga viewport), ruang napas matriks 3×3, presisi ordo & operator, dan akurasi
koordinat animasi setelah tata letak berubah.

---

## 3. Peta File

Total **14.445 baris** kode aplikasi (JS + CSS + HTML), 44 berkas.

```
matriks-lab-interaktif/
├── index.html                    125  Kerangka, urutan muat CSS, CDN, header, footer
├── PRD.md                             Dokumen kebutuhan produk (sumber kebenaran keputusan desain)
├── README.md                          Dokumentasi teknis lengkap
├── HANDOFF.md                         ← berkas ini
│
├── content/                           Kurikulum terbaca-manusia, disinkronkan dengan JSON
│   ├── 01_Konsep_Dasar.md
│   ├── 02_Operasi_Aljabar.md
│   ├── 03_Determinan_Invers.md
│   └── 04_Pemodelan_TKA.md
│
├── data/
│   ├── lessons.json                   Manifes 4 bab + subtopicOrder
│   ├── quizzes.json                   Bank soal + tkaSimulation
│   └── chapters/*.json                Materi, konfigurasi simulasi, mini kuis per bab
│
├── css/                          (urutan muat WAJIB seperti di index.html)
│   ├── base.css                  323  Design token, font, kunci no-scroll global
│   ├── layout.css                750  Header, workspace, menu, progress ring
│   ├── components.css            939  Tombol, kartu, toast, modal, carousel
│   ├── matrix.css                746  Sel matriks, kurung, ordo, chip
│   ├── simulations.css           784  Panggung, workstrip, garis coret, legenda
│   ├── scrollbars.css            103  Scrollbar bertema
│   ├── animations.css            152  @keyframes denyut, rise, confetti
│   ├── phase7.css                650  Kunci tanpa-scroll, identitas gambar kerja
│   ├── phase8.css                     Densitas lanskap, komponen ketuk-ketuk
│   ├── phase9.css                     Sistem desain TRANSFORMASI, blob, pengunci
│   │                                    orientasi, login, papan huruf
│   └── phase10.css                    ← DIMUAT TERAKHIR: Sidebar & Stage, header,
│                                        ordo & operator, poles presisi
│
├── js/
│   ├── app.js                    793  Bootstrap, menu utama, wiring layar
│   ├── router.js                 104  Router hash + deep-link
│   ├── state/progressStore.js    306  localStorage berversi + migrasi
│   ├── state/sessionState.js          sessionStorage: POSISI terakhir siswa
│   │
│   ├── engine/                        MURNI — tanpa DOM, mudah diuji
│   │   ├── matrix.js             256  add/sub/multiply/transpose/det/inverse/adjoint
│   │   ├── rational.js           105  Aritmetika pecahan EKSAK (FPB)
│   │   ├── validator.js          119  Validasi input & ordo
│   │   └── katexRenderer.js       99  renderMixed(): markdown + LaTeX
│   │
│   ├── interactions/
│   │   ├── dragDrop.js           417  Pointer Events + fallback ketuk-ketuk
│   │   ├── flyToAnimation.js     434  Fly/Merge 4 fase, isyarat seret, confetti
│   │   └── mergeAnimation.js     510  morph, tracer diagonal, swapArc, flipSign
│   │
│   ├── ui/
│   │   ├── mathpad.js            490  SATU-SATUNYA jalur input angka
│   │   ├── toast.js              136  Toast singleton
│   │   ├── modal.js              165  Pengganti confirm()/prompt()
│   │   └── icons.js               73  Set ikon SVG inline
│   │
│   └── modules/
│       ├── belajar/
│       │   ├── lessonRenderer.js 584  Materi → Simulasi → Kuis, mode review
│       │   └── simulations/
│       │       ├── index.js      100  REGISTRY engine (kunci = field "engine" di JSON)
│       │       ├── simCore.js    471  Kelas dasar Simulation
│       │       ├── simBasics.js  694  Bab 1
│       │       ├── simOperations.js 1156  Bab 2
│       │       ├── simDetInv.js  1101  Bab 3
│       │       └── simModeling.js 498  Bab 4
│       └── kuis/
│           ├── quizEngine.js          Satu soal per layar + navigasi maju-mundur
│           └── quizResult.js     138
│
└── tests/
    ├── engine.test.mjs                21 pengujian matematika murni
    └── smoke.py                       216 pengujian Playwright, 60 bagian
```

---

## 4. Arsitektur

### Rute

```
#/                                  Menu utama
#/belajar                           Daftar bab
#/belajar/:chapterId                Daftar sub-topik
#/belajar/:chapterId/:subtopicId    Satu sub-topik (Materi → Simulasi → Mini Kuis)
#/login                             Layar masuk (nama & asal sekolah)
#/tka                               Simulasi TKA (placeholder Fase 10)
#/kuis                              Menu kuis
#/kuis/:mode/:bankId?               Sesi kuis
```

### Kurikulum — 4 bab, 22 sub-topik

| Bab | ID | Sub-topik |
|---|---|---|
| 1 | `01_konsep_dasar` | pengertian_letak, ordo_matriks, jenis_matriks, transpose, kesamaan_matriks |
| 2 | `02_operasi_aljabar` | penjumlahan_pengurangan, perkalian_skalar, kombinasi_operasi, ordo_perkalian, perkalian_matriks, sifat_operasi |
| 3 | `03_determinan_invers` | determinan_2x2, determinan_3x3, singular_nonsingular, sifat_determinan, invers_2x2, invers_3x3, persamaan_matriks |
| 4 | `04_pemodelan_tka` | translasi_data, spldv_matriks, spltv_matriks, analisis_multi_kondisi |

### Registry Simulasi

`js/modules/belajar/simulations/index.js` memetakan string ke kelas. **Kunci di registry HARUS sama persis dengan nilai `simulation.engine` di `data/chapters/*.json`.** Engine yang tidak terdaftar tidak melempar error — ia menampilkan empty-state dan tetap mengizinkan siswa lanjut ke Mini Kuis.

21 engine terdaftar:

```
identify_element · ordo_builder · label_matrix_types · transpose_morph · equality_link
elementwise_op · scalar_sweep · combo_op · ordo_check · matrix_multiply · property_cards
det2x2 · det3x3_sarrus · singular_check · property_calculator · inverse2x2 · adjoint_flow · matrix_equation
data_translation · spl_solver · multi_statement
```

### Menambah sub-topik baru — urutannya

1. Tambahkan ID ke `subtopicOrder` di `data/lessons.json`.
2. Tambahkan blok materi + `simulation` + `quiz` di `data/chapters/<bab>.json`.
3. Kalau butuh mekanik baru: buat kelas turunan `Simulation` di berkas `sim*.js` yang sesuai, lalu daftarkan di `index.js`.
4. Sinkronkan `content/<bab>.md` agar tetap cocok.
5. Jalankan kedua suite pengujian.

---

## 5. Kontrak yang Ditegakkan Pengujian

Ini **bukan preferensi gaya** — semuanya punya pengujian di `tests/smoke.py`. Melanggarnya = suite merah.

1. **Tidak ada UI native.** `alert()` / `confirm()` / `prompt()` dilarang total. Pakai `toast.js` dan `modal.js`.
2. **Semua input angka lewat Mathpad.** Field selalu `readOnly = true` + `inputmode="none"` supaya keyboard OS tidak pernah muncul dan merusak tata letak.
3. **Umpan balik konstruktif.** Setiap penolakan interaksi **wajib** disertai Toast yang menjelaskan *mengapa*. Indikator merah atau getaran tidak boleh berdiri sendiri.
4. **Viewport terkunci.** `html`/`body` `overflow:hidden; position:fixed`. Scroll hanya di `.scroll-area` / `.workspace__body` / `.menu`, dengan scrollbar bertema.
5. **Tidak ada luapan horizontal.** `#app` memakai `grid-template-columns: minmax(0,1fr)` + `#app > * { min-width: 0 }`.
6. **Tidak ada tautan teks telanjang.** Setiap yang bisa diklik punya kotak, batas, padding, dan status hover.
7. **Konten selalu di kartu opak.** Tidak pernah dirender langsung di atas latar grid blueprint.
8. **Bahasa warna, bukan jargon.** Tulis "yang **berwarna biru**", jangan "yang disorot".
9. **Kecepatan animasi konstan.** Pengatur 0.5x/1x/2x sudah dihapus permanen. Satu-satunya penyimpangan: `prefers-reduced-motion`.
10. **Toast error singleton.** Hanya satu toast error aktif; yang baru menggantikan yang lama.
11. **Opsi salah dikunci permanen** supaya siswa mengerucut, bukan menebak berulang.
12. **Setiap seret punya pasangan ketuk-ketuk.** Ketuk sumber → semua tujuan sah berdenyut hijau → ketuk tujuan. Keduanya memanggil callback yang sama.
13. **State slide tidak bocor.** Slide yang sudah selesai tetap terlihat selesai saat dikunjungi ulang.
14. **Nol pergeseran tata letak.** Detailnya di bagian 6.
15. **Footer wajib berbunyi persis:** `© Penta Putra Purnomo, S.Pd., Gr. | SMAS YPVDP Bontang.` (simbol, bukan kata "Copyright" — diubah di Fase 10)
16. **Streak sudah dicabut total** — UI, logika, CSS, dan skema PRD. Jangan dihidupkan lagi tanpa perintah eksplisit.
17. **Aplikasi HANYA berjalan di lanskap.** Potret memunculkan `.rotate-lock` (z-index 9999, latar diburamkan) dan `#app` disembunyikan. (Fase 9, bagian uji 42.)
18. **Layar masuk mendahului menu.** Tanpa identitas di `sessionStorage`, rute apa pun dialihkan ke `#/login`. (Fase 9, bagian uji 64.)
19. **Keyboard OS tidak pernah muncul — termasuk untuk TEKS.** Isian nama & sekolah memakai papan huruf QWERTY milik Mathpad (`mode: 'text'`). (Fase 9, bagian uji 64.)
20. **Teori TIDAK dipotong jadi kolom.** Satu kolom terpusat maksimum 1000px; teori panjang menggulir di dalam kartunya, halaman tetap 100vh. (Fase 9, bagian uji 50.)
21. **Layar belajar memakai Sidebar & Stage.** Kendali (kembali, judul, tab, petunjuk, aksi) di kolom kiri 25–30%; kanvas matriks di kolom kanan 69–76%. Panggung TIDAK boleh berisi tab, prompt, atau bilah aksi. (Fase 10, bagian uji 73.)
22. **Petunjuk simulasi lewat `addHint()`, bukan `root.appendChild()`.** Brief, legenda, prompt, checklist, dan slider langkah semuanya kendali — mereka milik panel kiri. Menempelkannya langsung ke root akan menaruhnya di atas kanvas. (Fase 10.)
23. **Scrollbar memeluk tepi kanan layar.** Yang menggulir adalah KOLOM PANGGUNG selebar penuh, bukan kartu ber-max-width di dalamnya. (Fase 10, bagian uji 50.)
24. **Ordo matriks di bawah-tengah, tanpa garis dimensi.** (Fase 10, bagian uji 75.)
25. **Operator sejajar sempurna** dengan pusat grid matriks — selisih ≤1px. (Fase 10, bagian uji 75.)
26. **Footer berbunyi `© Penta Putra Purnomo, S.Pd., Gr. | SMAS YPVDP Bontang.`** dan terpusat. Kata "Copyright" diganti simbol di Fase 10.
27. **Berpindah layar/kasus wajib membongkar tuntas.** Tidak boleh ada slider, panggung, atau drop-zone kembar. (Fase 9, bagian uji 67.)
28. **Posisi siswa diingat sepanjang sesi.** Keluar ke menu lalu masuk lagi harus mendarat di langkah/slide/soal yang sama. Reset hanya terjadi kalau siswa menekan "Ulangi", menyelesaikan modulnya, atau mereset progres. (Fase 8, bagian uji 53.)
29. **Interaksi presisi tinggi memakai KETUKAN, bukan seretan.** Diagonal determinan, tukar posisi, dan balik tanda semuanya ketuk-ketuk. Seret hanya untuk perpindahan yang targetnya besar. (Fase 8, bagian uji 55–57.)
30. **Lanskap tidak pernah menggulirkan halaman.** Menu, materi, simulasi, dan kuis semuanya muat satu layar; yang boleh menggulir hanya panggung simulasi di dalam dirinya sendiri. (Fase 8, bagian uji 50, 61, 62.)
31. **Potret kini dikunci** — lihat butir 17. Aturan lama tentang potret yang boleh menggulir hanya berlaku sebelum Fase 9: boleh menggulir, tapi marginnya harus lega — bukan dimampatkan sampai sesak. (Fase 8, bagian uji 51.)

---

## 6. Teknik Anti-Pergeseran Tata Letak

Pola yang dipakai. **Ikuti ini saat menambah UI baru.**

| Masalah | Pola yang benar |
|---|---|
| Banner sukses menyisip di aliran | `.sim__done-overlay` — `position:absolute`, tidak menempati ruang |
| Tombol selesai dipakai lalu `remove()` | Pakai `visibility:hidden` + `disabled`. `remove()` mengempiskan barisnya |
| Panggung mengembang-mengempis | `.stage { min-height: clamp(200px, 34vh, 320px) }` |
| Tombol muncul di tengah alur | `.workstrip-row { min-height: 62px }` — ruangnya dipesan sejak awal |
| Bilah aksi | Hidup di `.workspace__actions`, baris grid **di luar** `.workspace__body` yang menggulir |
| Teks nowrap melebarkan grid | `min-width: 0` + `text-overflow: ellipsis` |
| Wadah pesan berubah tinggi | `.reserved-slot` bertinggi tetap |

### Orientasi: dua strategi yang berbeda (Fase 8)

| Orientasi | Strategi |
|---|---|
| **Lanskap** | Yang berlimpah adalah LEBAR. Materi dipaginasi ke kolom setinggi layar (`.materi-track` → `.materi-page` → `.materi-col`), panggung simulasi mengalir menyamping (`.stage { flex-direction: row; flex-wrap: wrap }`), kerangka dirampingkan. **Nol gulir halaman.** |
| **Potret** | Yang sempit adalah LEBAR. Satu kolom mengalir, boleh digulir vertikal, padding justru DIPERBESAR. Memampatkan potret sampai muat satu layar hanya membuatnya sesak tanpa manfaat. |

Paginasi materi diukur di DOM sungguhan (`attachMateriPager` di `lessonRenderer.js`),
bukan ditaksir dari panjang teks — tinggi blok bergantung pada KaTeX dan
pembungkusan baris yang baru diketahui setelah dirender.

### Jebakan yang pernah menggigit

**Kolom grid melebar diam-diam.** `#app` tanpa `grid-template-columns` eksplisit membuat kolomnya mengikuti `min-content` anak terlebar. Di viewport 375px, header jadi 415px dan isinya **terpotong tanpa scrollbar**. `documentElement.scrollWidth` tetap 375, jadi pengujian "tanpa scroll" lolos padahal ada konten hilang. Sudah ditutup pengujian §45.

**`getBoundingClientRect()` pada `.katex-mathml`** melaporkan lebar besar walau elemennya diklip 1px — itu lapisan MathML untuk pembaca layar. Bukan bug; jangan dikejar.

**`margin-inline: auto` membatalkan peregangan di flex.** `.materi` memakai
`max-width: 74ch; margin-inline: auto`. Begitu ia jadi anak sebuah flex kolom,
margin auto pada sumbu silang membuatnya menyusut mengikuti isi — dan saat
dikosongkan untuk ditata ulang, `clientWidth`-nya **0**. Pengukur kolom lalu
menyimpulkan hanya muat satu kolom dan seluruh materi menumpuk. Di lanskap
`margin-inline` harus dinolkan dan lebarnya dikunci penuh.

**Ukur lebar SEBELUM mengosongkan wadah.** Konsekuensi langsung dari jebakan di
atas: `layout()` mengambil `host.clientWidth` di baris pertama, bukan setelah
`innerHTML = ''`.

**Kolom kosong jangan di-`display:none`.** Menyembunyikan kolom yang belum
terisi membuat kolom sebelahnya melebar, sehingga pengukuran saat penjejalan
jadi salah. Kolom kosong tetap menempati ruangnya; yang disembunyikan hanya
garis pemisahnya.

**`swapArc()` sudah menukar `textContent` DAN `dataset.value`.** Menukarnya
sekali lagi setelah `await` akan mengembalikan keduanya ke posisi semula —
tampak persis seperti tombol tukar yang tidak berfungsi. Hal yang sama berlaku
untuk `flipSign()`. Bug ini lolos dari pembacaan kode dan baru ketahuan setelah
`dataset.value` diukur sesudah animasi selesai.

**`renderMixed()` meng-escape SELURUH masukannya.** Melewatkan string yang
mengandung markup ke fungsi ini membuat tag-nya tampil mentah sebagai teks di
layar. Bangun node DOM, dan hanya lewatkan potongan teks bercampur LaTeX.

**`[data-theme="light"]` menang atas selektor kelas tunggal.** Tema terang
dipasang permanen di `<html>`, jadi aturan lama seperti
`[data-theme="light"] .btn--amber` (spesifisitas 0,2,0) mengalahkan `.btn--amber`
(0,1,0) yang ditulis belakangan. Untuk menimpanya, naikkan spesifisitas —
`[data-theme] .btn--amber` sudah cukup.

**Ukur rasio kolom, jangan percaya `grid-template-columns`.** Nilai `28%` di CSS
belum tentu jadi 28% di layar: `minmax()`, gap, dan padding induk ikut bicara.
Uji §73 mengukur lebar sungguhan di tiga viewport.

**Regex jangan dipakai untuk membedah CSS.** Saat mencabut Lab Maya, sebuah
regex `\.lab-card[^\n]*\{[^}]*\}` ikut menelan blok
`.content-card, .hero__panel, .quiz__card, .lab-card { position: relative; }` —
menyisakan daftar selektor yang menyambung ke aturan berikutnya, sehingga SEMUA
kartu jadi `position: absolute`. Jumlah kurung tetap seimbang, jadi pemeriksaan
kurung tidak menangkapnya, dan halaman masih "terlihat benar" sampai
tinggi kartunya diukur. Potong blok CSS dengan penanda awal-akhir yang eksplisit,
lalu pindai daftar selektor yang berakhir dengan koma:

```
grep -n ",$" css/*.css   # baris selektor yang koma-nya menggantung
```

**Elemen `display:none` melaporkan rect nol.** Footer disembunyikan di lanskap
pendek, jadi `footer.getBoundingClientRect().top` bernilai 0 — bukan tepi bawah
layar. Uji geometri harus memeriksa `height > 0` sebelum memakainya sebagai
patokan.

---

## 7. Subsistem yang Perlu Dipahami Sebelum Menyentuhnya

### Mathpad (`js/ui/mathpad.js`)

Satu-satunya jalur input angka. `attachMathpad(input, opts)`.

- Batas **2 digit**: maksimum `99`, minimum `-99`. Digit ketiga memicu `flashLimit()`, bukan diterima diam-diam.
- Mode desimal mengizinkan sampai 4 digit bila mengandung titik.
- Mode pecahan dirender **bertumpuk vertikal**: pembilang, garis, penyebut.
- Opsi `allowLetter` memunculkan papan huruf A–Z dengan pengalih huruf besar/kecil (untuk latihan kesamaan matriks).

### Aritmetika Pecahan (`js/engine/rational.js`)

Semua bilangan adalah pasangan pembilang/penyebut yang disederhanakan FPB, penyebut selalu positif. **Perkalian skalar pecahan wajib tetap pecahan eksak** — tidak ada pembulatan desimal. Terverifikasi: `1/2 × 3 = 3/2`, `2/4 × 2 = 1`, `1/3 × 1/3 = 1/9`.

### Sistem Seret (`js/interactions/dragDrop.js`)

`makeDraggable()` mendaftarkan **dua** mekanik sekaligus: seret pointer dan klik-untuk-pilih. `registerDropZone()` menerima keduanya.

- `suppressClickUntil` (320 ms) mencegah klik-ekor sesudah seret.
- `document.body.classList.add('is-tap-armed')` menyalakan semua tujuan yang sah.
- Memulai seret otomatis membatalkan pilihan ketuk, jadi keduanya tidak pernah bentrok.

### Perkalian Matriks Langkah demi Langkah (`simOperations.js` → `MatrixMultiplySim`)

Alur satu sel hasil:

1. Sel hasil berkedip mengundang (`.cell--invite`) → siswa mengkliknya.
2. Sel target berdenyut kuning; garis putus-putus beranimasi memperagakan lintasan.
3. Seret elemen **baris** → sel menampilkan `3`.
4. Seret elemen **kolom** pasangannya → jadi `(3×1)`.
5. Pasangan berikutnya → `(3×1) + (3×0)`.
6. Tombol hitung **baru muncul** setelah semua pasangan lengkap. Sebelum itu memang tidak ada — tidak ada jalan pintas.
7. Menekannya menjalankan animasi `cell--resolving`, lalu nilai akhir ditulis.

### Mesin Interaksi Fase 8

**`equality_link` (Kesamaan Matriks).** Dua ketukan per pasangan: ketuk elemen
kiri → pasangan seletaknya di kanan menyala → ketuk pasangan itu → keduanya
terbang menyatu jadi PERSAMAAN di bawah panggung. Nilai variabelnya **diisi
siswa lewat Mathpad**. Versi lama langsung mencetak `p = 7` begitu selnya
diklik — yang tersisa cuma membaca.

**`elementwise_op` (Jumlah/Kurang).** Mencerminkan alur perkalian matriks:
ketuk elemen di $A$ → pasangan seletaknya menyala dan semua sel lain diredupkan
(`.cell--muted`) → bawa pasangannya ke sel hasil → sel menampilkan `(6+1)` →
tombol hitung baru muncul → hasilnya `7`. Tidak ada jalan pintas.

**`det2x2` & `det3x3_sarrus`.** Tarik-garis diganti ketuk-ketuk. Elemen diagonal
diketuk dalam **urutan bebas**; ketukan ulang membatalkan pilihan. Garis coret
digambar **setelah** pilihannya tepat — ia konfirmasi, bukan panduan. Menyeret
melintasi sel kecil terlalu sering meleset, dan setiap meleset terasa seperti
kesalahan matematika padahal murni motorik.

**`inverse2x2`.** Tiga tahap, semuanya kerja siswa:
1. **Determinan manual** dengan mekanik ketuk-ketuk yang sama. Nilainya disimpan
   dan dipakai tahap 3. Kalau hasilnya 0, prosesnya berhenti di situ dengan
   penjelasan — jalan buntu yang jujur.
2. **Adjoin**: ketuk dua elemen diagonal utama untuk MENUKAR posisinya, lalu
   ketuk dua elemen diagonal sekunder untuk MEMBALIK tandanya. Tanpa seret.
3. **Skalar**: chip $\frac{1}{\det}$ dibawa ke **setiap elemen satu per satu**.
   Tiap sel adalah drop-zone tersendiri — satu drop-zone untuk seluruh matriks
   akan mengubahnya jadi satu sapuan, persis yang ingin dihindari.

**`adjoint_flow` (Invers 3×3).** Sengaja diganti kartu "sedang dibangun" —
lihat §11.

### Layar Masuk & Papan Huruf (Fase 9)

`renderLogin()` di `app.js` menampilkan dua isian yang keduanya `readOnly` +
`inputmode="none"`. Mengetuknya membuka Mathpad dalam **mode teks**
(`attachMathpad(input, { mode: 'text' })`): kerangka pad yang sama, tapi tombol
angkanya disembunyikan dan papan QWERTY-nya muncul.

Identitas disimpan di `sessionStorage` dengan kunci `matriksLab.identity.v1` —
sengaja BUKAN `localStorage`. Ini perkenalan satu sesi, bukan akun; tablet yang
dipakai bergantian di kelas tidak boleh menyapa siswa berikutnya dengan nama
siswa sebelumnya.

`init()` mengalihkan ke `#/login` bila identitas belum ada. **Uji otomatis harus
menyemai identitas** lewat `page.add_init_script` — kalau tidak, setiap rute
akan berakhir di layar masuk.

### Kunci Orientasi (Fase 9)

Murni CSS: `@media (orientation: portrait)` menyalakan `.rotate-lock` dan
menyembunyikan `#app` **beserta `.fs-btn`** — tombol layar penuh hidup di luar
`#app`, jadi ia harus disebut terpisah atau tetap mengambang di atas pesan.

## 8. Tema Visual — "TRANSFORMASI" & Sidebar-Stage

Kertas terang `#EFF4FF` dengan tiga blob warna yang mengambang pelan
(`.blob--1/2/3`) dan pola titik yang memudar ke tepi. Kartu putih murni,
sudut besar, bayangan lembut (`--sh-1/2/3`).

Aksen: royal `#1D4ED8` · biru `#2563EB` · cyan `#06B6D4` · kuning `#FFC800` ·
magenta `#EC0F8C`. Teks: tinta `#0A1B45`.

Tipografi: **Montserrat** 700/800/900 (judul) + **Roboto** (isi).

**Token lama dipertahankan namanya.** `base.css` memetakan `--bg-surface`,
`--ink-900`, `--brand-primary`, dan kawan-kawan ke palet baru, sehingga seluruh
CSS komponen yang sudah matang ikut berpindah tema tanpa ditulis ulang. Kalau
menambah warna, tambahkan di palet sumber lalu petakan — jangan menulis hex
langsung di berkas komponen.

Mode gelap dan pengalihnya dicabut. `data-theme="light"` dipasang permanen di
`<html>` karena sejumlah aturan komponen memakainya untuk menentukan warna teks
tombol.

### Sidebar & Stage (Fase 10)

Layar belajar dibelah dua lewat `.workspace--split`:

| Kolom | Lebar | Isi |
|---|---|---|
| `.ws-side` | 25–30% | Kembali · judul bab & sub-topik · tab Materi/Simulasi/Kuis · `.ws-side__hint` (brief, legenda, prompt, checklist, pemilih kasus, slider langkah) · bilah aksi |
| `.ws-stage` | 69–76% | HANYA kanvas: matriks, persamaan, atau teks teori |

Simulasi menaruh petunjuknya lewat `Simulation.addHint()`, yang mendarat di
`hintHost` bila diberikan. `mountSimulation(..., { hintHost })` yang
menyalurkannya dari `LessonView`.

Header dibagi tiga kolom simetris — identitas kiri, progres tengah, dan kolom
kanan yang sengaja **dikosongkan selebar tombol layar penuh** yang mengambang di
atasnya. Itulah yang mencegah keduanya bertabrakan.

## 9. Jebakan Lingkungan Kerja

Windows 11, PowerShell utama, Bash (Git Bash) tersedia.

| Jebakan | Penanganan |
|---|---|
| Heredoc bash + kutipan bersarang sering gagal | Tulis skrip patch Python lewat tool Write, jalankan, lalu hapus |
| Escape `\n` tercampur antara bash → Python → berkas | Jangan patch lewat `python -c "..."` berkutip ganda. Pakai berkas skrip |
| Konsol cp1252 jatuh pada karakter `→`, `×` | `sys.stdout.reconfigure(encoding="utf-8", errors="replace")` di awal skrip Python |
| Server statis kadang mati di tengah sesi | Nyalakan ulang sebelum `smoke.py` |
| Navigasi hash saja tidak memuat ulang cache `progressStore` | Pengujian harus `page.reload()`, bukan sekadar ganti hash |

### Kecelakaan bersejarah yang sudah diperbaiki — jangan diulang

**`\times` berubah jadi "imes".** Skrip generator Python lama memakai string non-raw, jadi `"\times"` menjadi TAB + `imes` sebelum masuk JSON. 26 string di 4 berkas sudah diperbaiki. **Selalu pakai raw string (`r"..."`) saat menulis LaTeX dari Python.**

**Markdown tebal yang melintasi math inline tidak ter-render.** `renderMixed()` dulu memecah `$…$` lebih dulu sehingga penanda `**` jadi yatim. Sekarang LaTeX di-mask jadi `@@KTX{n}@@` dulu, markdown diterapkan ke seluruh string, baru dipulihkan. Jangan dibalik urutannya.

---

## 10. Yang Sudah Selesai & Terverifikasi

Seluruh Fase 1–8 tuntas. Fase 7 mencakup: perbaikan pergeseran tata letak, `overflow:hidden` global 100vh termasuk portrait ponsel, penghapusan panah scroll liar, pencabutan streak, footer hak cipta, estetika premium bespoke, Lab Maya sebagai menu 8 kartu, perkalian skalar pecahan eksak, dan perkalian matriks langkah demi langkah.

**Fase 8** mencakup: pembersihan dokumentasi, subjudul menu utama, strategi
lanskap/potret yang terpisah (paginasi materi + panggung menyamping), perbaikan
bug HTML mentah pada simulasi singular, ruang pesan yang dipesan pada simulasi
ordo dan pembahasan kuis, layar penutup yang besar dan terpusat, hasil sifat
determinan yang dipusatkan, ingatan sesi lewat `sessionStorage`, serta empat
mesin interaksi yang ditulis ulang (kesamaan, jumlah/kurang, determinan,
invers 2×2) dan satu yang ditangguhkan (invers 3×3).

Tiga bug Fase 8 ditemukan lewat **pengukuran**, bukan pembacaan kode:

- `.materi` melaporkan lebar 0 saat dikosongkan, sehingga seluruh materi
  menumpuk di satu kolom padahal tiga kolom muat.
- `swapArc()` menukar nilai dua kali, sehingga tahap adjoin tampak tidak
  berfungsi sama sekali.
- Sisa jawaban salah tertinggal di isian Mathpad, sehingga ketukan berikutnya
  menyambung angka lama (`9` lalu `5` menjadi `95`).

Dua bug ditemukan lewat **pengukuran**, bukan pembacaan kode, di ujung Fase 7:

- Bilah aksi terpotong footer — dipindah ke luar area scroll (pengujian §43).
- Kolom grid `#app` melebar 415px di viewport 375px, memotong isi diam-diam (pengujian §45).

Footer kini membungkus dua baris di layar ≤560px alih-alih dielipsis, supaya teks hak cipta terbaca utuh (pengujian §46).

---

## 11. Utang Teknis yang Diketahui (belum diperintahkan diperbaiki)

**Satu-satunya yang sudah dijadwalkan: simulasi invers 3×3 (Fase 10).**
`AdjointFlowSim` kini menampilkan kartu "sedang dibangun". Versi lamanya meminta
siswa mengisi sembilan kofaktor lewat Mathpad sambil ditunjukkan sub-matriks
**dan** determinannya sekaligus — praktis menyalin angka, bukan menghitung.
Sub-topiknya tetap terbuka: materi dan Mini Kuis-nya utuh, dan `onComplete()`
tetap dipanggil supaya siswa tidak terjebak di layar buntu.

Sisanya murni catatan jujur, **bukan agenda** — kerjakan hanya bila diminta.

1. **Simulasi TKA masih placeholder.** Rute `#/tka` menampilkan kartu "segera
   hadir"; bank soalnya sudah ada di `data/quizzes.json` dan mesinnya sudah
   bekerja lewat `#/kuis/simulasi_tka/all`, tinggal dirangkai layarnya.
2. **Kartu simulasi menggulir di dalam dirinya** pada layar pendek. Ini
   keputusan Fase 9 yang disengaja: memaksa panggung menyusut membuat sel
   matriks turun di bawah ambang sentuh 44 px.
3. **Menu utama menggulir di lanskap ponsel.** Isinya (hero + tiga kartu mode)
   memang lebih tinggi dari 390 px.
4. **Penomoran bagian `smoke.py` tidak berurutan.** Bagian 16 tercetak di akhir, dan nomor 33 lompat. Kosmetik pada keluaran konsol; tidak memengaruhi hasil.
2. **SortableJS dimuat tapi tidak dipakai.** Sistem seret memakai Pointer Events sendiri. Bisa dilepas dari `index.html` untuk memangkas satu permintaan CDN.
3. **Tidak ada fallback offline.** KaTeX, GSAP, dan Google Fonts semuanya dari CDN. Bila jaringan sekolah memblokir jsdelivr, aplikasi tidak akan tampil benar.
4. **Ruang kosong di bawah kartu Lab Maya** pada layar desktop tinggi. Terlihat lega, bukan rusak.
5. **`js/engine/matrix.js` dan `js/engine/rational.js` sedikit tumpang tindih** — `matrix.js` punya `toFractionText()` sendiri, terpisah dari `toText()` milik `rational.js`.
6. **Bukan repo git.** Tidak ada jaring pengaman untuk membatalkan perubahan. Pertimbangkan `git init` sebelum pekerjaan besar berikutnya.

---

## 12. Aturan Kerja yang Diharapkan Pengguna

Dikumpulkan dari tujuh fase kerja sama. Ini penting untuk diikuti sesi berikutnya.

- **Kerjakan tuntas, jangan berhenti di tengah.** Bila diberi daftar 10 poin, kerjakan sepuluh-sepuluhnya lalu laporkan.
- **Laporkan apa adanya.** Kalau ada yang gagal, katakan gagal beserta keluarannya. Jangan mengklaim selesai tanpa menjalankan pengujian.
- **Verifikasi dengan pengukuran, bukan pembacaan kode.** Dua bug terakhir tidak terlihat dari kode — hanya ketahuan setelah geometri diukur di peramban. Ambil tangkapan layar, ukur `getBoundingClientRect()`, cek `scrollWidth`.
- **Setiap perbaikan bug UI dapat pengujian regresi.** Suite ini tumbuh dari 134 → 144 justru karena itu.
- **Komentar dalam Bahasa Indonesia**, menjelaskan alasan di balik keputusan.
- **Utamakan alasan pedagogis.** Aplikasi ini tidak boleh menghitung untuk siswa. Setiap perubahan mekanik dinilai dari apakah ia membuat siswa mengerjakan matematikanya sendiri.
- Pengguna memakai bahasa Indonesia. Balas dalam bahasa Indonesia.
