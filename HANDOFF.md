# HANDOFF — Ruang Matriks

> Dokumen serah-terima antar sesi. Diperbarui **30 Agustus 2026**, menutup Fase 11.
> Status: **fase 1–11 selesai, seluruh pengujian otomatis hijau (21/21 + 346/346).**
>
> ✅ **FASE 11 SELESAI.** Kesembilan temuan QA manual sudah diperbaiki,
> diverifikasi dengan pengukuran di peramban, lalu dikunci dengan 46 pengujian
> regresi baru (bagian 77–86 di `smoke.py`). Rinciannya di **§0**.
>
> **Fase 10 mengubah nama dan tata letak.** Aplikasi bernama **Ruang Matriks**,
> dan layar belajar memakai arsitektur **Sidebar & Stage**: kendali di kolom kiri,
> kanvas matriks di kolom kanan. Arsitektur itu **tidak berubah di Fase 11**.
>
> **Fase 9 adalah pivot besar.** Aplikasi bukan lagi sandbox: **Lab Maya dicabut
> total**, tampilannya berganti ke sistem desain terang "TRANSFORMASI", dan media
> ini **dikunci ke orientasi lanskap**. Ada layar masuk sendiri dengan papan huruf
> kustom. Simulasi invers 3×3 **masih** ditangguhkan (lihat §11).

---

## 0. FASE 11 — BUG SQUASHING (SELESAI)

Sembilan temuan QA manual, semuanya tertutup. Urutan pengerjaannya mengikuti
cetak biru: fondasi pembongkaran dulu (#5, #7, #3), lalu interaksi (#8, #4),
lalu murni tampilan (#2, #1, #9, #6).

### 0.1 Ringkasan perbaikan

| Isu | Keluhan | Akar masalah sebenarnya | Perbaikan |
|---|---|---|---|
| **5** | Animasi GSAP jalan terus setelah pindah layar | `mountScreen()` membuang HTML, tapi timeline GSAP hidup di objek global dan chip terbang menempel di `document.body` — keduanya selamat dari `innerHTML = ''` | Modul baru `js/interactions/motion.js` dengan `killAllMotion()`, dipanggil di `mountScreen()` **sebelum** pembongkaran. Plus `this.later()` / `this.wait()` berjejak di `Simulation`; seluruh `setTimeout` di `sim*.js` sudah dimigrasikan |
| **7** | Slider paginasi dobel/tripel | `useSteps()` dipanggil ulang tiap render, sementara slider mendarat di **panel kendali** lewat `addHint()` — bukan di `.stage`, jadi `resetStage()` tidak pernah menyapunya | `useSteps()` dibuat idempoten lewat `disposeSlider()` yang mencabut node lamanya lebih dulu |
| **3a** | Seret mati total setelah pindah kasus | Peta `zones` dan `tapSource` adalah state tingkat-**modul** di `dragDrop.js`; mengosongkan `caseHost` tidak menyentuhnya, dan pelepas drop-zone terpanggil dua kali | `resetDragSystem()` baru di `dragDrop.js`, dipanggil dari `teardownCase()`, `resetStage()`, dan `Simulation.destroy()`. Pelepas drop-zone kini **idempoten** |
| **3b** | Progres kasus hilang saat bolak-balik | `buildCase()` selalu membangun ulang dari nol; hanya kasus TUNTAS yang diingat | `caseProgress: Map<indeks, Set<"i,j">>` + `repaintSolvedCells()`. Dititipkan ke `sessionState` lewat `simState`, jadi bertahan saat siswa keluar ke menu. **Hanya "Ulangi Simulasi" yang menghapusnya** |
| **8** | Jumlah/Kurang masih menuntut seret | — | `makeDraggable` dan `registerDropZone` **dicabut total** dari `ElementwiseOpSim`; alurnya kini persis `Det2x2Sim`: ketuk di $A$ → pasangan di $B$ menyala → ketuk pasangan → langsung terbang ke sel hasil. Teks di `02_operasi_aljabar.json` ikut diperbarui |
| **4** | Login bisa dilewati lewat ikon rumah | Penjaga identitas hanya jalan **sekali** di `init()` | Dua lapis: `router.setGuard()` baru yang berjalan di **setiap** perpindahan rute (menutup deep-link manual juga), dan tombol rumah + cincin progres disembunyikan & dimatikan di `/login` |
| **2** | Denyut cuma menggerakkan garis tepi | — | Keyframe `hlPulse*Fill` baru menganimasikan `background-color` penuh per peran (biru/magenta/kuning). Warna teks ikut dipekatkan supaya kontras tetap **≥4,5:1 pada latar TERPEKAT** — diukur, bukan dikira |
| **1** | Isi panggung mungil di layar besar | Ukuran sel dipaku piksel tetap | Sel, huruf, panggung, nama matriks, dan operator memakai `clamp()` terikat viewport. Lebar baca naik bertingkat 920 → 1040 → 1120 → 1220px |
| **9** | Kartu Mini Kuis kecil & melenceng | `layout.css` memberi `.workspace__body` sebuah `padding-right: 4px` **tanpa pasangan di kiri** | Talang scrollbar dicerminkan; pemusatan dinyatakan eksplisit lewat `align-self`/`justify-self`, tidak lagi bergantung pada `margin-inline: auto` sendirian |
| **6** | Menu bab tidak bisa digulir | Aturan gulir Fase 10 hanya diberikan ke jalur Sidebar & Stage; jalur `.workspace` biasa tidak punya `overflow-y` | `overflow-y: auto` + **`min-height: 0`** untuk `.workspace:not(.workspace--split) > .workspace__body`. Kartu bab juga memakai `clamp()` dan grid dua kolom di ≥1280px |

### 0.2 Berkas yang berubah

| Berkas | Peran |
|---|---|
| `js/interactions/motion.js` | **BARU** — `killAllMotion()`, satu titik pembersihan gerak |
| `css/phase11.css` | **BARU** — dimuat PALING AKHIR, hanya berisi perbaikan sembilan isu |
| `js/interactions/dragDrop.js` | `resetDragSystem()`, pelepas zona idempoten |
| `js/modules/belajar/simulations/simCore.js` | `later()` / `wait()` / `clearTimers()`, `disposeSlider()`, `saveState()`, `destroy()` & `resetStage()` diperkuat |
| `js/modules/belajar/simulations/simOperations.js` | Isu 3a, 3b, 8 |
| `js/modules/belajar/simulations/sim{Basics,DetInv,Modeling}.js` | Migrasi `setTimeout` → `this.later()` / `this.wait()` |
| `js/router.js` | `setGuard()` + penjaga dijalankan di `resolve()` |
| `js/app.js` | `identityGuard()`, `killAllMotion()` di `mountScreen()`, header di layar masuk |
| `js/modules/belajar/{lessonRenderer,simulations/index}.js` | Menyalurkan `resumeState` / `onStateChange` |
| `data/chapters/02_operasi_aljabar.json` | Teks Jumlah/Kurang: seret → ketuk |
| `index.html` | Memuat `css/phase11.css` |
| `tests/smoke.py` | Bagian 77–86 (46 pengujian baru) + `clear_session()` diperbaiki |

### 0.3 Angka hasil pengukuran (bukan klaim)

Diukur di peramban sungguhan, bukan disimpulkan dari kode:

| Ukuran | 1280×720 | 1920×1080 | 2560×1440 | 844×390 |
|---|---|---|---|---|
| Lebar sel matriks | 52 px | **76,8 px** | **88 px** | 44 px (ambang sentuh) |
| Huruf sel | 18,6 px | **27,8 px** | **32 px** | 16 px |
| Tinggi panggung | 331 px | **497 px** | **560 px** | 206 px |
| Lebar kartu materi | 869 px | **1120 px** | **1220 px** | 589 px |
| Melencengnya kartu kuis | 0 px | 0 px | 0 px | 0 px |
| Luapan horizontal | tidak ada | tidak ada | tidak ada | tidak ada |

Sebelum Fase 11, tiga baris pertama **datar 52 px / 18 px / 300 px** di ketiga
layar besar — itulah isu 1.

Kontras teks pada puncak denyut (latar terpekat): biru **7,10:1**,
kuning **5,65:1**, magenta **5,59:1**. Ketiganya lulus ambang 4,5:1.

### 0.4 ⚠️ CATATAN PENGUJIAN — MASIH BERLAKU UNTUK SESI BERIKUTNYA

> **For UI/UX and animation tests, rely on direct Web App Testing / UI rendering
> (HTML/CSS/JS) to visually confirm the fixes, rather than just relying on Python
> smoke tests which cannot see overlapping elements or scale issues.**

Peringatan ini **tidak dicabut**, karena Fase 11 justru membuktikannya dua kali:

1. Kesembilan bug lolos dari suite 300/300 yang hijau.
2. Saat menulis pengujian regresinya, deteksi tumpang-tindih berbasis
   `getBoundingClientRect()` melaporkan slider "menimpa" bilah aksi — padahal
   ia hanya **terpotong** oleh wadah gulirnya dan tidak tergambar di mana pun.
   Yang membuktikannya bukan geometri, melainkan `elementFromPoint()`.

Jadi untuk perubahan UI: **render, lihat, ukur di peramban, baru tulis
pengujiannya.** Pengujian Python tetap wajib sebagai jaring pengaman.

### 0.5 Yang SENGAJA ditinggalkan

| Hal | Alasan |
|---|---|
| Bilah progres di kartu bab gepeng jadi 2×21 px | **Pra-Fase 11** — diukur 2×21 px juga sebelum perubahan, jadi bukan regresi. Di luar sembilan isu, sengaja tidak disentuh. Perbaikannya kemungkinan `width: 100%` pada `.chapter-item__body .progressbar` |
| Panggung terasa lapang di 1920+ | Persamaan berada di atas, menyisakan ruang kosong di bawah. Bukan bug — konsekuensi panggung yang memang sengaja ditinggikan agar matriks 3×3 muat |
| Slider langkah harus digulir di sidebar pendek | Perilaku yang diinginkan: sidebar memang menggulir. Bilah aksi tetap terjangkau (diuji dengan `elementFromPoint`) |

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
| Version control | **Repo git lokal aktif** (sejak Fase 10). Belum ada remote |

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

### Status pengujian per 30 Agustus 2026 — **terverifikasi, bukan klaim**

| Suite | Hasil |
|---|---|
| `node tests/engine.test.mjs` | **21/21 lolos** |
| `python tests/smoke.py` | **346/346 lolos** |

Fase 9 menambah bagian 63–69; Fase 10 menambah bagian 70–76: identitas aplikasi,
sapaan masuk & hak cipta, penempatan header, arsitektur Sidebar & Stage (diukur di
tiga viewport), ruang napas matriks 3×3, presisi ordo & operator, dan akurasi
koordinat animasi setelah tata letak berubah.

Fase 11 menambah bagian 77–86 (46 pengujian): slider tidak kembar, Jumlah/Kurang
murni ketuk, gerak & timer benar-benar mati saat pindah layar, kemajuan
multi-kasus, penjaga layar masuk, gulir daftar bab, skala di tiga viewport, dan
kontras warna pada puncak denyut.

> ⚠️ `clear_session()` di `smoke.py` sengaja **mempertahankan** kunci identitas.
> Sejak penjaga rute Fase 11 berjalan di setiap perpindahan, `sessionStorage.clear()`
> polos akan melempar pengujian ke `#/login` di tengah jalan.

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
│   ├── phase10.css                    Sidebar & Stage, header, ordo & operator
│   └── phase11.css                    ← DIMUAT TERAKHIR: perbaikan sembilan isu
│                                        QA (skala clamp, gulir daftar, denyut
│                                        berlatar, penjaga layar masuk)
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
│   │   ├── dragDrop.js                Pointer Events + ketuk-ketuk + resetDragSystem()
│   │   ├── flyToAnimation.js     434  Fly/Merge 4 fase, isyarat seret, confetti
│   │   ├── mergeAnimation.js     510  morph, tracer diagonal, swapArc, flipSign
│   │   └── motion.js                  ← FASE 11: killAllMotion(), satu titik
│   │                                     pembersihan gerak lintas-layar
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
12. **Ketukan adalah jalur wajib; seret hanya pelengkap.** Setiap interaksi HARUS bisa diselesaikan dengan ketuk-ketuk: ketuk sumber → tujuan yang sah menyala → ketuk tujuan. Kalau sebuah engine juga menyediakan seret, keduanya wajib memanggil callback yang sama. **Menghapus seret sama sekali tidak melanggar butir ini** — yang dilarang adalah seret tanpa alternatif ketuk. (Diperjelas di Fase 11 saat Jumlah/Kurang dipindah sepenuhnya ke ketukan; lihat butir 29.)
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
29. **Interaksi presisi tinggi memakai KETUKAN, bukan seretan.** Diagonal determinan, tukar posisi, balik tanda, **dan sejak Fase 11 seluruh Penjumlahan/Pengurangan** semuanya ketuk-ketuk — `ElementwiseOpSim` tidak lagi memanggil `makeDraggable` maupun `registerDropZone`. Seret hanya untuk perpindahan yang targetnya besar. (Fase 8, bagian uji 55–57; Fase 11, bagian uji 78.)
30. **Lanskap tidak pernah menggulirkan halaman.** Menu, materi, simulasi, dan kuis semuanya muat satu layar; yang boleh menggulir hanya panggung simulasi di dalam dirinya sendiri. (Fase 8, bagian uji 50, 61, 62.)
31. **Pembongkaran harus menyentuh state tingkat-MODUL, bukan hanya DOM.** Timeline GSAP, chip di `document.body`, peta `zones` di `dragDrop.js`, dan `setTimeout` yang tertunda semuanya SELAMAT dari `innerHTML = ''`. Pindah layar wajib memanggil `killAllMotion()`; pindah kasus wajib memanggil `resetDragSystem()`. `setTimeout` yang menyentuh DOM di dalam simulasi harus lewat `this.later()` / `this.wait()`. (Fase 11, bagian uji 79–80.)

32. **Rute dijaga di SETIAP perpindahan, bukan sekali saat boot.** Tanpa identitas, rute apa pun dialihkan ke `#/login` lewat `router.setGuard()` — termasuk deep-link yang diketik manual. Menyembunyikan tombolnya saja tidak pernah cukup. (Fase 11, bagian uji 83.)

33. **Kemajuan sebagian juga kemajuan.** Berpindah kasus/slide TIDAK boleh menghapus sel yang sudah dikerjakan; hanya "Ulangi Simulasi" yang berhak. (Fase 11, bagian uji 81–82.)

34. **Denyut mengubah latar, bukan hanya tepi** — dan teksnya tetap ≥4,5:1 pada latar TERPEKAT, diukur bukan dikira. (Fase 11, bagian uji 86.)

35. **Ukuran isi panggung terikat viewport lewat `clamp()`**, dengan 44px sebagai batas bawah sentuh. Piksel tetap membuat matriks menyusut secara optis di monitor lebar. (Fase 11, bagian uji 85.)

36. **Setiap wadah yang bisa meluap butuh `overflow-y: auto` DAN `min-height: 0`.** Tanpa yang kedua, flex item menolak menyusut dan gulirnya tidak pernah aktif. (Fase 11, bagian uji 84.)

37. **Potret kini dikunci** — lihat butir 17. Aturan lama tentang potret yang boleh menggulir hanya berlaku sebelum Fase 9: boleh menggulir, tapi marginnya harus lega — bukan dimampatkan sampai sesak. (Fase 8, bagian uji 51.)

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
6. **Repo git lokal sudah ada** (sejak Fase 10), tetapi **belum punya remote** — jadi belum ada cadangan di luar mesin ini.

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
