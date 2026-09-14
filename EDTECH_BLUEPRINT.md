# EDTECH_BLUEPRINT.md

> **Kerangka Aplikasi Belajar Interaktif — hasil ekstraksi arsitektur "Ruang Matriks".**
> Disusun **14 September 2026**, sesudah Fase 18.5 ditutup (33.900 baris, 56 berkas
> sumber, 21/21 pengujian engine, 632/632 pengujian Playwright).
> **Target penerapan pertama: "Vektor Kelas 11 (Kurikulum Merdeka)".**
>
> Dokumen ini **bukan ringkasan**. Ia ditulis untuk dieksekusi: setiap bagian
> menyebut berkas sumbernya, API-nya, alasan keputusannya, dan apa persisnya
> yang harus berubah saat domainnya berpindah dari Matriks ke Vektor.

---

## DAFTAR ISI

| § | Bagian |
|---|---|
| 0 | [Cara Memakai Dokumen Ini](#0-cara-memakai-dokumen-ini) |
| 1 | [Filosofi & Kontrak Pedagogis](#1-filosofi--kontrak-pedagogis) |
| 2 | [Keputusan Tumpukan Teknologi](#2-keputusan-tumpukan-teknologi) |
| 3 | [Struktur Direktori Kerangka Dasar](#3-struktur-direktori-kerangka-dasar) |
| 4 | [Lapisan Inti (Core) yang Bisa Dipakai Ulang Langsung](#4-lapisan-inti-core-yang-bisa-dipakai-ulang-langsung) |
| 5 | [Lapisan Domain Vektor](#5-lapisan-domain-vektor) |
| 6 | [Skema Data](#6-skema-data) |
| 7 | [Kontrak UI/UX & CSS](#7-kontrak-uiux--css) |
| 8 | [Strategi Pengujian](#8-strategi-pengujian) |
| 9 | [Peta Adaptasi Matriks → Vektor](#9-peta-adaptasi-matriks--vektor) |
| 10 | [Daftar Jebakan Maut](#10-daftar-jebakan-maut) |
| A | [Lampiran A — Urutan Fase yang Disarankan](#lampiran-a--urutan-fase-yang-disarankan) |
| B | [Lampiran B — Definition of Done per Sub-Topik](#lampiran-b--definition-of-done-per-sub-topik) |
| C | [Lampiran C — Perintah Harian](#lampiran-c--perintah-harian) |

---

## 0. CARA MEMAKAI DOKUMEN INI

### 0.1 Tiga status penyalinan

Setiap berkas di kerangka ini punya salah satu dari tiga status. Status inilah
yang menentukan berapa lama proyek Vektor akan dibangun.

| Lambang | Status | Artinya |
|---|---|---|
| 🟩 | **SALIN APA ADANYA** | Berkas tidak mengandung satu pun kata "matriks". Salin, jangan sentuh. |
| 🟨 | **SALIN + SESUAIKAN** | Kerangkanya benar, tapi ada 1–3 tempat yang menyebut domain (kunci `localStorage`, judul, satu opsi). |
| 🟥 | **TULIS DARI NOL** | Isinya matematika Matriks. Yang diwarisi cuma *pola*-nya, bukan kodenya. |

**Perkiraan pembagian:** dari ±33.900 baris, sekitar **11.500 baris (34%)**
berstatus 🟩/🟨 — itulah kerangka yang dihemat. Sisanya (engine simulasi, data,
konten, CSS domain) memang harus ditulis ulang, dan itu wajar: di aplikasi
seperti ini, **materi pelajaran adalah mayoritas kodenya**.

### 0.2 Urutan membaca

1. **§1** dulu, sampai selesai. Semua keputusan teknis di bawahnya adalah
   turunan dari sana; membacanya terbalik akan membuat §7 terasa seperti
   daftar aturan sewenang-wenang.
2. **§3 + §4** untuk menyalin kerangkanya dan membuat aplikasi kosong berjalan.
3. **§5 + §6** untuk membangun domain Vektor.
4. **§7 + §8** dibuka terus-menerus selama pengerjaan.
5. **§9 + §10** dibaca sebelum menulis setiap engine baru.

### 0.3 Yang TIDAK boleh dilakukan sesi ini

Repositori "Ruang Matriks" berstatus **READ-ONLY**. Aplikasinya sudah selesai
dan **sedang dipakai siswa**. Blueprint ini dibaca dari sana; tidak ada satu
baris pun di `js/`, `css/`, `data/`, `content/`, `tests/`, atau `index.html`
yang boleh berubah.

---

## 1. FILOSOFI & KONTRAK PEDAGOGIS

### 1.1 Aksioma tunggal

> ### **APLIKASI TIDAK PERNAH MENGHITUNG UNTUK SISWA.**

Ini bukan slogan. Ini **penyaring keputusan nomor satu**, dan ia yang mengubah
hampir setiap pilihan UI di aplikasi ini menjadi berbeda dari aplikasi
pendidikan pada umumnya.

Aplikasi belajar yang biasa akan menampilkan:

```
A = [3 1]      det(A) = 10
    [2 4]      A⁻¹ = 1/10 [ 4 -1]
                          [-2  3]
```

Siswa membacanya, mengangguk, lalu gagal di ujian — karena yang ia latih adalah
**membaca**, bukan **menghitung**. Di kerangka ini, layar yang sama berbunyi:

1. Siswa mengetuk dua elemen diagonal utama → aplikasi menggambar garis coret
   sebagai **konfirmasi**, bukan panduan.
2. Siswa mengetik hasil kali diagonalnya sendiri lewat papan angka.
3. Aplikasi memeriksa. Salah → toast yang menjelaskan **kenapa**, dan
   pilihan yang salah dimatikan permanen supaya siswa mengerucut, bukan menebak.
4. Determinan tidak pernah muncul sebelum siswa menuliskannya.

**Konsekuensi arsitektural yang harus dipahami sejak awal:** `engine/matrix.js`
(dan nanti `engine/vector.js`) memang punya fungsi `determinant()`,
`inverse()`, `dot()`, `angleBetween()` — tetapi **fungsi-fungsi itu hanya
dipakai untuk MEMERIKSA jawaban siswa dan untuk menghasilkan kunci soal**,
tidak pernah untuk menampilkan hasil yang belum dikerjakan siswa.

### 1.2 Sebelas kontrak turunan

Kesebelas butir ini disarikan dari 80 kontrak `HANDOFF.md §5` — dipilih yang
**sama sekali tidak bergantung pada topik Matriks**, jadi semuanya berlaku
langsung di proyek Vektor. Semua wajib punya pengujiannya sendiri (§8).

| # | Kontrak | Kenapa |
|---|---|---|
| 1 | **Aplikasi tidak pernah menghitung untuk siswa** | Aksioma. Setiap angka akhir harus keluar dari kepala siswa. |
| 2 | **`alert()` / `confirm()` / `prompt()` dilarang total** | UI native tidak bisa ditema, memblokir thread, dan di ponsel tampil seperti galat sistem. Pakai `toast.js` & `modal.js`. |
| 3 | **Seluruh input angka lewat papan angka kustom** | Keyboard OS di ponsel menutupi separuh layar (termasuk soalnya) dan mengizinkan karakter sampah. Field selalu `readOnly = true` + `inputmode="none"`. |
| 4 | **Setiap penolakan interaksi wajib disertai ALASAN** | Indikator merah dan getaran saja mengajarkan "coba lagi acak". Kalimatnya yang mengajar. |
| 5 | **Setiap drag WAJIB punya padanan tap-tap** | Mayoritas siswa memakai ponsel. Seret di layar 6 inci sering meleset, dan setiap meleset terasa seperti kesalahan matematika padahal murni motorik. |
| 6 | **Setiap pilihan wajib imun klik-beruntun** | Kunci diambil pada **klik pertama** secara sinkron (`claim()`), bukan setelah animasi. |
| 7 | **Viewport terkunci, nol gulir halaman** | `html`/`body` `overflow:hidden; position:fixed`. Scroll hanya di wadah yang ditandai eksplisit. |
| 8 | **Nol pergeseran tata letak** | Overlay absolut, tinggi dicadangkan, `visibility:hidden`. **`remove()` dilarang** untuk elemen yang menempati aliran. |
| 9 | **Setiap soal wajib menuliskan pertanyaannya, tepat di atas pilihan** | Soal yang berhenti di "Perhatikan gambar berikut!" memaksa siswa menebak apa yang diminta. |
| 10 | **Teks ber-markdown wajib lewat `renderMixed()`** | `el(tag, cls, html)` menaruh argumen ketiganya sebagai `innerHTML` mentah — `**tebal**` akan tampil beserta bintangnya. |
| 11 | **Jangan pernah menampilkan angka yang tidak bisa ditelusuri siswa** | Kartu "N Lencana terbuka" bertahan berfase-fase padahal sistem lencananya tidak pernah ada. Angka di dasbor harus bisa dilihat, dikejar, dan dinaikkan. |

### 1.3 Tes tiga pertanyaan

Sebelum menambahkan mekanik apa pun, jawab ketiganya. Satu "tidak" = rancang ulang.

1. **Apakah siswa mengerjakan matematikanya sendiri, atau hanya menyaksikan?**
2. **Kalau siswa salah, apakah ia tahu KENAPA — dari kalimat, bukan dari warna?**
3. **Apakah ini bisa diselesaikan dengan jempol di ponsel 6 inci, satu tangan?**

### 1.4 Penerapan aksioma di domain Vektor (contoh konkret)

Domain Vektor punya godaan yang lebih besar daripada Matriks, karena hasilnya
mudah digambar. Ini daftar godaan yang **harus ditolak**:

| Godaan | Kenapa melanggar | Yang benar |
|---|---|---|
| Siswa menyeret ujung vektor, panjangnya tampil hidup di sebelahnya (`‖v‖ = 5.39`) | Aplikasi menghitung akar kuadrat untuk siswa; yang dilatih cuma menyeret | Tampilkan **komponennya saja** ($v = (2,5)$). Panjang baru muncul setelah siswa mengisi $\sqrt{2^2+5^2}$ lewat papan angka |
| Sudut antar vektor tampil otomatis di busur | Menghapus seluruh pelajaran $\cos\theta = \frac{u \cdot v}{‖u‖‖v‖}$ | Busur digambar **tanpa angka**. Siswa mengisi $u \cdot v$, lalu ‖u‖, ‖v‖, baru sudutnya |
| Resultan otomatis tergambar saat dua vektor dijumlahkan | Aturan segitiga/jajargenjang adalah materinya, bukan hiasannya | Siswa menempatkan pangkal $v$ di ujung $u$ (tap-tap), baru resultannya boleh digambar |
| Proyeksi otomatis menjatuhkan garis tegak lurus | Sama | Siswa memilih dulu **vektor mana yang jadi alas**, lalu menghitung skalarnya |
| Hasil desimal: $‖v‖ = 5.385164807$ | Angka yang tidak bisa ditelusuri (kontrak 11), dan bukan bentuk yang dipakai di lembar jawaban | **Bentuk akar eksak**: $\sqrt{29}$. Lihat §5.2 |

> **Catatan pedagogis penting.** Di Matriks, "aplikasi menghitung" mudah
> terlihat (angka muncul di sel). Di Vektor, ia menyamar sebagai **gambar yang
> terlalu pintar**. Kanvas yang menggambar resultan sebelum siswa memutuskan
> aturan penjumlahannya adalah pelanggaran yang sama persis — hanya lebih cantik.

### 1.5 Fitur yang dihapus permanen dan jangan dihidupkan lagi

| Fitur | Status | Alasan |
|---|---|---|
| Mekanik **"titik temu"** | Dicabut di Fase 13 | Menyeragamkan paksa dua operasi berbeda ke satu mekanik justru menghapus pelajarannya |
| **Streak** harian | Dicabut di Fase 7 | Menghukum siswa yang libur, dan mengukur kehadiran, bukan penguasaan |
| **Pengatur kecepatan animasi** (0.5×/1×/2×) | Dicabut | Satu-satunya penyimpangan kecepatan yang sah adalah `prefers-reduced-motion` |
| **Mode gelap** & pengalihnya | Dicabut di Fase 9 | `data-theme="light"` dipasang permanen; sejumlah komponen memakainya untuk menentukan warna teks tombol |
| **Lencana** tanpa sistem lencana | Dicabut di Fase 18.5 | Kontrak 11 |

---

## 2. KEPUTUSAN TUMPUKAN TEKNOLOGI

### 2.1 Tumpukan

| Lapisan | Pilihan | Catatan |
|---|---|---|
| Bahasa | **HTML5 + CSS3 + JavaScript ES Modules** | Tanpa transpile, tanpa TypeScript, tanpa JSX |
| Build | **TIDAK ADA** | Tanpa npm, tanpa bundler, tanpa `node_modules` di repo |
| Backend | **TIDAK ADA** | Seluruh data statis (JSON) + `localStorage` |
| Cara jalan | `python -m http.server 5173` | Satu-satunya syarat: server statis apa pun. ES Modules butuh `http://`, bukan `file://` |
| Matematika | **KaTeX 0.16.9** (CDN, SRI) | Dibungkus `js/engine/katexRenderer.js`. **Tidak pernah dipanggil langsung** dari modul lain |
| Animasi | **GSAP 3.12.5 + MotionPathPlugin** (CDN) | Dipakai selektif; sebagian besar animasi justru CSS murni |
| Ikon | SVG inline, `js/ui/icons.js` | Tanpa font-icon, tanpa berkas gambar. Emoji **dilarang** sebagai ikon struktural (bergantung font OS, tidak bisa ditema) |
| Penyimpanan | `localStorage` (permanen) + `sessionStorage` (posisi sesi) | Lihat §4.3 |
| Pengujian | **Playwright (Python)** + **Node murni** | 632 + 21 pengujian, tanpa framework uji |

### 2.2 Kenapa nol-build — dan harganya

Keputusan ini diambil sadar, bukan karena keterbatasan. Ini neracanya:

| Keuntungan | Harga yang dibayar |
|---|---|
| **Umur simpan panjang.** Tidak ada dependensi yang membusuk. Repo ini akan tetap jalan lima tahun lagi tanpa `npm install` yang gagal | **Setiap komponen UI ditulis sendiri.** Mathpad 723 baris, papan coret 804 baris, modal 165 baris — semuanya "sudah ada" di ekosistem npm |
| **Performa tinggi.** Tanpa hidrasi framework, tanpa bundle 300 KB. Layar muat turun begitu modul tiba | **Tidak ada type-checking.** Salah ketik nama properti baru ketahuan saat runtime. Dikompensasi pengujian pengukuran (§8) |
| **Bisa dipasang di mana saja** — hosting statis, GitHub Pages, bahkan **flash disk di lab sekolah** yang tidak punya internet | **Tidak ada tree-shaking / minifikasi.** Berkas dilayani apa adanya; ±34.000 baris sumber terkirim mentah |
| **Debugging jujur.** Yang dilihat di DevTools persis berkas sumbernya. Tidak ada source-map yang berbohong | **Urutan `<link>` CSS bersifat mengikat.** Tidak ada bundler yang mengurutkan; manusia yang bertanggung jawab (§7.7) |
| **Sesi AI/kolaborator baru bisa langsung membaca kode** tanpa memahami konfigurasi build lebih dulu | **Refactor lintas-berkas manual.** Tidak ada "rename symbol" yang aman |

> **Verdict untuk proyek Vektor: PERTAHANKAN NOL-BUILD.** Alasan terkuatnya
> bukan teknis melainkan lapangan — aplikasi ini dipakai di lab sekolah dengan
> jaringan yang tidak bisa diandalkan, dan kemampuan menjalankannya dari flash
> disk pernah menyelamatkan lebih dari satu sesi pelajaran.

### 2.3 Kapan keputusan ini wajib ditinjau ulang

Nol-build berhenti masuk akal kalau salah satu terjadi:

- Kurikulum berkembang melewati **±60.000 baris** — pada titik itu waktu muat
  modul mentah mulai terasa di tablet kelas.
- Aplikasi butuh **backend** (skor terpusat, akun guru, bank soal daring).
- Butuh **berbagi kode** dengan aplikasi lain (mis. "Ruang Matriks" dan
  "Ruang Vektor" ingin memakai satu paket `edtech-core`). Saat itu tiba,
  jadikan `js/core/` sebuah paket tersendiri — **bukan** menyalinnya untuk
  ketiga kalinya.

### 2.4 Risiko CDN & mitigasinya

Ini **utang teknis yang diwarisi dan sebaiknya dilunasi sejak Fase 1** di
proyek Vektor:

> Bila jaringan sekolah memblokir `jsdelivr` atau `fonts.googleapis.com`,
> aplikasi tidak akan tampil benar: rumus tampil sebagai LaTeX mentah,
> animasi GSAP mati diam-diam, tipografi jatuh ke fallback sistem.

**Mitigasi yang direkomendasikan untuk Vektor:**

```
assets/vendor/
├── katex/            ← katex.min.css, katex.min.js, fonts/
├── gsap/             ← gsap.min.js, MotionPathPlugin.min.js
└── fonts/            ← Montserrat + Roboto (woff2, subset latin)
```

Muat dari lokal, **tanpa** `integrity` (SRI hanya bermakna untuk CDN). Ini
menambah ±1,2 MB ke repo dan menghapus satu kelas kegagalan lapangan
sepenuhnya. Salinan CDN boleh dipertahankan sebagai cadangan lewat pola
`onerror` loader.

> ⚠️ **Jangan memuat SortableJS.** "Ruang Matriks" memuatnya di `index.html`
> tetapi tidak pernah memakainya — sistem seretnya memakai Pointer Events
> sendiri. Jangan wariskan permintaan CDN yang sia-sia itu.

---

## 3. STRUKTUR DIREKTORI KERANGKA DASAR

### 3.1 Pohon direktori, dengan penanda status

```
vektor-lab-interaktif/
│
├── index.html                    🟨 satu-satunya halaman. Ganti judul, favicon,
│                                     daftar <link> CSS. STRUKTURNYA tetap.
├── README.md                     🟥 cara jalan & ringkasan
├── PRD.md                        🟥 spesifikasi produk & kurikulum Vektor
├── HANDOFF.md                    🟥 sumber kebenaran arsitektur proyek baru
├── EDTECH_BLUEPRINT.md           🟩 dokumen ini, disalin sebagai rujukan
│
├── js/
│   │
│   │  ══════════ INTI (CORE) — tidak tahu apa-apa soal Vektor ══════════
│   ├── core/
│   │   ├── router.js             🟩 135 baris — SPA router berbasis hash
│   │   ├── state/
│   │   │   ├── progressStore.js  🟨 277 — ganti STORAGE_KEY saja
│   │   │   └── sessionState.js   🟨 122 — ganti KEY saja
│   │   ├── ui/
│   │   │   ├── mathpad.js        🟨 723 — + mode akar (§5.2), sisanya utuh
│   │   │   ├── scratchpad.js     🟩 804 — papan coret vektor + penghapus goresan
│   │   │   ├── toast.js          🟩 211 — notifikasi
│   │   │   ├── modal.js          🟩 165 — dialog
│   │   │   └── icons.js          🟨  80 — registry SVG; tambah ikon domain
│   │   ├── interactions/
│   │   │   ├── dragDrop.js       🟩 463 — seret + padanan tap-tap
│   │   │   ├── flyToAnimation.js 🟩 434 — flyTo/landOn/makeFlyChip/celebrate
│   │   │   └── motion.js         🟩  69 — killAllMotion(), hormat reduced-motion
│   │   └── render/
│   │       └── katexRenderer.js  🟩  99 — renderMixed(): markdown + LaTeX
│   │
│   │  ══════════ MESIN SOAL — generik, dua kontrak berlawanan ══════════
│   ├── quiz/
│   │   ├── quizEngine.js         🟩 536 — mastery learning, umpan balik LANGSUNG
│   │   ├── examEngine.js         🟩 748 — CBT, umpan balik TERTUNDA
│   │   └── quizResult.js         🟩 138 — layar hasil
│   │
│   │  ══════════ DOMAIN — seluruhnya ditulis ulang ══════════
│   ├── domain/
│   │   ├── vector.js             🟥 matematika MURNI vektor (tanpa DOM)
│   │   ├── surd.js               🟥 aritmetika akar eksak (√29, bukan 5.385…)
│   │   ├── validator.js          🟥 aturan boleh/tidak + kalimat penjelasnya
│   │   └── plane/
│   │       ├── vectorPlane.js    🟥 kanvas kartesius SVG (§5.4)
│   │       └── arrow.js          🟥 primitif panah, kepala panah, busur sudut
│   │
│   ├── lesson/
│   │   ├── lessonRenderer.js     🟨 782 — pembaca materi; paginasi lanskap tetap
│   │   └── simulations/
│   │       ├── simCore.js        🟨 880 — kelas dasar `Simulation` 🟩 +
│   │       │                             helper render matriks 🟥
│   │       ├── index.js          🟥 REGISTRY: kunci string → kelas engine
│   │       ├── simBasics.js      🟥 engine bab 1
│   │       ├── simOperations.js  🟥 engine bab 2
│   │       ├── simProducts.js    🟥 engine bab 3 (dot/cross/proyeksi)
│   │       └── simModeling.js    🟥 engine bab 4 (pemodelan TKA)
│   │
│   └── app.js                    🟨 1227 — komposisi layar + pendaftaran rute
│
├── css/                          🟨 lihat §7.7 untuk struktur yang disarankan
│   ├── tokens.css                🟨 palet & token — ganti nilainya, PERTAHANKAN NAMANYA
│   ├── layout.css                🟩 shell 100vh, header, footer
│   ├── components.css            🟩 tombol, kartu, badge, opsi, tabel
│   ├── workspace.css             🟩 Sidebar & Stage
│   ├── quiz.css                  🟩 kuis + ujian CBT
│   ├── mathpad.css               🟩 papan angka
│   ├── scratchpad.css            🟩 papan coret
│   ├── animations.css            🟩 keyframes + prefers-reduced-motion
│   ├── scrollbars.css            🟩 scrollbar bertema
│   ├── plane.css                 🟥 kanvas kartesius, panah, busur, label sumbu
│   └── simulations.css           🟥 gaya khas engine Vektor
│
├── data/                         🟥 SELURUHNYA baru
│   ├── lessons.json                  manifest bab & sub-topik
│   ├── quizzes.json                  bank soal + bank TKA
│   └── chapters/*.json               konfigurasi simulasi per sub-topik
│
├── content/*.md                  🟥 materi bacaan + arsip soal ter-generate
│
└── tests/
    ├── smoke.py                  🟨 harness 🟩 + bagian uji domain 🟥
    ├── engine.test.mjs           🟥 pengujian matematika vektor murni
    └── archive_soal.py           🟨 generator arsip guru DARI quizzes.json
```

### 3.2 Perbedaan penting dari "Ruang Matriks"

"Ruang Matriks" tidak punya direktori `core/` — semuanya rata di `js/`. **Untuk
proyek Vektor, pisahkan sejak commit pertama.** Alasannya bukan kerapian:

1. **Batasnya jadi bisa ditegakkan.** Aturan sederhana yang bisa diuji:
   > Tidak satu pun berkas di `js/core/` dan `js/quiz/` boleh memuat kata
   > "vektor", "vector", "dot", "cross", atau nama domain lainnya.

   Satu perintah memeriksanya:
   ```bash
   grep -riE "vektor|vector|dot|cross|proyeksi" js/core js/quiz
   ```
   Keluaran kosong = batasnya masih utuh. Jadikan ini **bagian uji di
   `smoke.py`**, bukan sekadar konvensi.

2. **Proyek ketiga jadi murah.** "Ruang Transformasi Geometri" tinggal menyalin
   `js/core/` + `js/quiz/` dan menulis `js/domain/`.

### 3.3 Tiga titik sambung Core ↔ Domain

Hanya ada **tiga** tempat di mana inti bersentuhan dengan domain. Jaga
jumlahnya tetap tiga.

| # | Titik sambung | Bentuk |
|---|---|---|
| 1 | **Registry simulasi** | `simulations/index.js` memetakan `string → kelas`. Inti tidak pernah tahu kelas apa saja yang ada |
| 2 | **Data JSON** | `data/chapters/*.json` menyebut `simulation.engine` sebagai string. Kode tidak pernah menyebut nama sub-topik |
| 3 | **Kelas dasar `Simulation`** | Engine domain mewarisinya; inti hanya memanggil `build()` dan `destroy()` |

Segala sesuatu yang lain — router, penyimpanan, papan angka, papan coret,
toast, modal, mesin kuis — **tidak boleh tahu** bahwa aplikasi ini soal vektor.

---

## 4. LAPISAN INTI (CORE) YANG BISA DIPAKAI ULANG LANGSUNG

### 4.1 Ringkasan

| Modul | Baris | Status | Yang harus disentuh |
|---|---|---|---|
| `router.js` | 135 | 🟩 | Tidak ada |
| `progressStore.js` | 277 | 🟨 | `STORAGE_KEY` |
| `sessionState.js` | 122 | 🟨 | `KEY` |
| `toast.js` | 211 | 🟩 | Tidak ada |
| `modal.js` | 165 | 🟩 | Tidak ada |
| `icons.js` | 80 | 🟨 | Tambah ikon domain (`arrow-vector`, `angle`, `axis`) |
| `motion.js` | 69 | 🟩 | Tambah selektor node yatim baru bila ada |
| `katexRenderer.js` | 99 | 🟩 | Tidak ada |
| `mathpad.js` | 723 | 🟨 | Tambah mode akar; tinjau batas 2 digit |
| `scratchpad.js` | 804 | 🟩 | Tidak ada |
| `Simulation` (di `simCore.js`) | ±440 | 🟩 | Tidak ada |
| `dragDrop.js` | 463 | 🟩 | Tidak ada |
| `flyToAnimation.js` | 434 | 🟩 | Tidak ada |
| `mergeAnimation.js` | 510 | 🟥 | Isinya animasi khas matriks (`foldTranspose`, `swapArc`). Polanya diwarisi, kodenya tidak |
| `quizEngine.js` | 536 | 🟩 | Tidak ada |
| `examEngine.js` | 748 | 🟩 | Tidak ada |
| `quizResult.js` | 138 | 🟩 | Tidak ada |

**Total 🟩/🟨: ±5.500 baris kode aplikasi + ±6.000 baris CSS & pengujian.**

---

### 4.2 `router.js` — SPA router berbasis hash 🟩

135 baris, nol dependensi, deep-link penuh, tombol Back berperilaku wajar.

```js
import router from './core/router.js';

router.route('/belajar/:chapterId/:subtopicId', renderLesson);
router.setGuard(identityGuard);      // dijalankan di SETIAP perpindahan
router.setNotFound(render404);
router.start();

router.navigate('belajar/01_konsep_vektor');
router.navigate('login', { replace: true });   // tidak menumpuk di riwayat
router.back();
router.getCurrentPath();             // 'belajar/01_konsep_vektor'
```

**Tiga keputusan di dalamnya yang wajib dipertahankan:**

1. **Penjaga berjalan SEBELUM pengecekan "hash yang sama".** Rute terlarang
   tidak boleh lolos hanya karena kebetulan sama dengan yang sedang tampil.
2. **Pengalihan memakai `history.replaceState`, bukan `location.hash`.** Rute
   yang ditolak tidak boleh menumpuk di riwayat — tombol Back akan memantul
   bolak-balik ke sana selamanya.
3. **Penjaga dipasang sekali di router, bukan ditulis ulang di tiap handler.**
   Menyembunyikan tombolnya saja tidak pernah cukup: siswa bisa mengetik hash
   secara manual.

**Rute untuk proyek Vektor** (bentuknya identik, hanya isinya berubah):

```
#/login                            Layar masuk (nama & asal sekolah)
#/                                 Menu utama
#/belajar                          Daftar bab
#/belajar/:chapterId               Daftar sub-topik
#/belajar/:chapterId/:subtopicId   Satu sub-topik (Materi → Simulasi → Mini Kuis)
#/kuis                             Menu kuis
#/kuis/:mode/:bankId               Sesi kuis / ujian
#/tka                              Latihan Soal TKA
```

---

### 4.3 Dua penyimpanan dengan umur berbeda — JANGAN dicampur

Ini salah satu keputusan paling berharga di seluruh kerangka, dan paling
sering dilanggar oleh orang yang belum pernah membayar harganya.

| | `progressStore.js` | `sessionState.js` |
|---|---|---|
| **Media** | `localStorage` | `sessionStorage` |
| **Isi** | **PENCAPAIAN** — sub-topik tuntas, skor terbaik, riwayat kuis, identitas, pengaturan | **POSISI** — slide ke berapa, soal ke berapa, sel mana yang sudah diisi |
| **Umur** | Selamanya, sampai "Reset Progres" | Selama tab dibuka |
| **Pemilik** | **Perangkat**, bukan satu siswa | Sesi yang sedang berjalan |
| **Kunci** | `vektorLab.v1` | `vektorLab.session.v1` |

**`progressStore.js` — API:**

```js
getState()                                        // seluruh state (dibaca pengujian)
isStorageAvailable()                              // false di mode privat → app tetap jalan
touchSession()

getSubtopicProgress(chapterId, subtopicId)        // {status, bestQuizScore, attempts}
isSubtopicUnlocked(chapterId, subtopicOrder, id)  // DIHITUNG dari urutan, tidak disimpan
markSubtopicStarted(chapterId, subtopicId)
markSubtopicCompleted(chapterId, subtopicId, score)
recordAttempt(chapterId, subtopicId)

getChapterProgress(chapterId, subtopicOrder)      // {completed, total, percent}
getOverallProgress(manifest)                      // untuk progress ring di header
setChapterCompleteIfDone(chapterId, subtopicOrder)
getLastVisited()

saveQuizResult(result)                            // MAX_QUIZ_HISTORY = 50
getQuizHistory(limit = 10)

getSettings() / updateSettings(patch)
resetAll()                                        // SELALU lewat modal, bukan confirm()
```

> **Kunci sub-topik DIHITUNG, tidak DISIMPAN.** `isSubtopicUnlocked()`
> menyimpulkannya dari `subtopicOrder` + status sub-topik sebelumnya. Menyimpan
> `locked: true` sebagai keputusan mandiri menciptakan state yang bisa saling
> bertentangan dengan `status: 'completed'` — dan state yang bertentangan akan
> muncul sebagai bug yang tidak bisa direproduksi.

**`sessionState.js` — API:**

```js
lessonKey(chapterId, subtopicId)   // 'lesson:01_konsep/panjang_vektor'
quizKey(mode, bankId)              // 'kuis:latihan_bab/01_konsep'

getResume(key)                     // selalu objek, TIDAK PERNAH null
patchResume(key, { step, simSlide, simState, index, results })
clearResume(key)                   // dipanggil saat SELESAI atau "Ulangi"
clearAllResume()                   // saat reset progres / ganti akun
```

**Pola ketahanan yang wajib disalin** — mode privat peramban bisa menolak
menulis, dan aplikasi **harus tetap jalan**:

```js
let memoryFallback = {};
let storageWorks = null;

function storage() {
  if (storageWorks === false) return null;
  try {
    const s = window.sessionStorage;
    if (storageWorks === null) {
      const probe = `${KEY}.probe`;
      s.setItem(probe, '1'); s.removeItem(probe);   // uji tulis SUNGGUHAN
      storageWorks = true;
    }
    return s;
  } catch (err) {
    storageWorks = false;     // jatuh ke cache memori, jangan meledak
    return null;
  }
}
```

> Memeriksa `typeof localStorage !== 'undefined'` **tidak cukup**: di mode
> privat Safari objeknya ada, tetapi `setItem()` melempar. Uji tulisnya harus
> sungguhan.

**Identitas siswa** hidup di `localStorage` dengan kunci sendiri
(`vektorLab.identity.v1`), **bukan** di dalam `progressStore`. Dua aturan
berpasangan yang tidak boleh dipisah:

1. **Identitas menempel ⇒ WAJIB ada tombol "Ganti Akun".** Tanpa itu,
   perangkat kelas yang dipakai bergantian akan menyapa siswa pertama selamanya.
2. **Keluar akun membuang identitas + posisi, TIDAK membuang pencapaian.**
   Progres milik perangkat; menghapusnya diam-diam membuang pekerjaan seisi
   kelas. Menghapus progres punya pintunya sendiri.

---

### 4.4 `toast.js` & `modal.js` — pengganti UI native 🟩

```js
import toast, { anchorToasts, clearToasts } from './core/ui/toast.js';

toast.success('Tepat! Panjangnya memang $\\sqrt{29}$.');
toast.error('Belum tepat — kuadratkan dulu tiap komponennya.');
toast.warn('Masih ada komponen yang kosong.');
toast.info('Jawab dulu soal ini untuk membuka soal berikutnya.');

anchorToasts(stageElement);   // tambatkan ke kolom panggung
anchorToasts(null);           // kembalikan ke tengah jendela
clearToasts();                // dipanggil mountScreen()
```

```js
import { showModal, confirmAction, alertDialog } from './core/ui/modal.js';

const ok = await confirmAction({
  title: 'Kumpulkan ujian sekarang?',
  body: 'Masih ada **3 soal** yang belum kamu jawab. Soal kosong dihitung **salah**.',
  confirmLabel: 'Ya, Kumpulkan',
  cancelLabel: 'Batal, Periksa Lagi',
  variant: 'danger',
});
```

**Tiga aturan:**

1. **Toast error bersifat singleton.** Hanya satu yang aktif; yang baru
   menggantikan yang lama. Menumpuknya membuat siswa membaca pesan yang sudah
   basi.
2. **Toast ditambatkan ke kolom panggung**, bukan dipusatkan ke jendela —
   umpan balik harus muncul dekat penyebabnya.
3. **Placeholder toast memakai `{{kunci}}`, bukan `{kunci}`.** Kurung tunggal
   lolos tanpa galat dan tampil apa adanya di layar siswa.

---

### 4.5 `katexRenderer.js` — satu-satunya pintu ke KaTeX 🟩

```js
renderToString(tex, { display })   // satu ekspresi → string HTML
renderInto(el, tex, options)
renderMixed(text)                  // $inline$ + **tebal** + *miring* + <sub>
renderBlock(tex)                   // display mode, dibungkus .katex-block
escapeHtml(text)
hydrate(root)                      // render ulang [data-tex] / [data-mixed]
```

**Kenapa `renderMixed()` ditulis seperti itu — dan jangan dibalik urutannya:**

```js
// 1. LaTeX di-MASK dulu jadi token polos @@KTX0@@
const masked = text.replace(/\$([^$]+)\$/g, (_, tex) => { ... });
// 2. Markdown diterapkan ke SELURUH string
const rendered = applyLightMarkdown(masked);
// 3. Token dipulihkan
return rendered.replace(/@@KTX(\d+)@@/g, ...);
```

Kalau dibalik (pecah `$…$` dulu, markdown per segmen), penanda `**tebal**` yang
**mengapit** sebuah rumus terpisah ke dua segmen berbeda dan regex-nya tidak
pernah cocok. Bug ini pernah hidup berfase-fase.

**Dua jebakan yang menyertainya:**

- `renderMixed()` **meng-escape SELURUH masukannya.** Melewatkan string yang
  mengandung markup HTML akan menampilkan tag-nya mentah. Bangun node DOM,
  lalu lewatkan hanya potongan teks bercampur LaTeX.
- `renderMixed()` **hanya mengenali `$…$`.** `$$…$$` meninggalkan dolar mentah
  di layar. Untuk display mode, pakai `renderBlock()` atau bidang `tex` di JSON.

---

### 4.6 `mathpad.js` — papan angka pengganti keyboard OS 🟨

```js
import { attachMathpad, closeMathpad, isMathpadOpen } from './core/ui/mathpad.js';

attachMathpad(input, {
  mode: 'decimal' | 'fraction' | 'letter' | 'text',
  allowFraction: true,
  allowLetter: false,
  onInput: (value) => {},
  onCommit: (value, display, input) => {},   // dipanggil saat pad DITUTUP
  onClose: () => {},
});
```

`attachMathpad()` memasang tiga hal sekaligus — **inilah pintu gerbangnya**:

```js
input.readOnly = true;                    // keyboard virtual tidak muncul
input.setAttribute('inputmode', 'none');  // sinyal eksplisit ke browser mobile
input.setAttribute('autocomplete', 'off');
```

**Kontrak simpan/batal (Fase 18.5, mahal):**

| Kejadian | Perilaku |
|---|---|
| Klik di luar pad | **SIMPAN** |
| Pindah layar (`mountScreen()` memanggil `closeMathpad()`) | **SIMPAN** |
| Tekan **Escape** | **BATAL — dan isi kotak DIKEMBALIKAN seperti semula** |

> `sync()` menulis tiap ketukan langsung ke field sebagai pratinjau berjalan.
> Membatalkan tanpa memulihkan meninggalkan angka yang **terlihat** di kotak
> padahal tidak pernah tersimpan — layar mengatakan "99" sementara ujiannya
> mencatat soal itu masih kosong. **Kotak yang berbohong lebih berbahaya
> daripada kotak yang kosong.**

> Auto-simpan terjadi saat pad **DITUTUP**, bukan per ketukan. Sebagian pemakai
> menilai jawaban di `onCommit`, dan pengiriman per digit akan menyalahkan
> jawaban yang belum selesai diketik.

**Penyesuaian yang dibutuhkan proyek Vektor:**

| Kebutuhan | Perubahan |
|---|---|
| Jawaban berbentuk akar ($\sqrt{29}$, $3\sqrt{5}$) | Tambah `mode: 'surd'` — tombol √ dengan satu slot radikan dan satu koefisien di depan. Render bertumpuk sama seperti mode pecahan |
| Sudut dalam derajat ($60°$, $120°$) | Cukup `mode: 'decimal'`; tambahkan tombol ° sebagai hiasan satuan yang tidak masuk ke nilai |
| Nilai komponen bisa melebihi 99 | **Tinjau ulang batas 2 digit.** Batas `-99..99` adalah keputusan era Matriks (sel matriks memang kecil). Soal vektor pemodelan bisa menyebut gaya 250 N. Naikkan ke 4 digit, dan **pertahankan `flashLimit()`** — digit ke-5 ditolak dengan penjelasan, bukan diterima diam-diam |

---

### 4.7 `scratchpad.js` — papan coret berbasis vektor 🟩

**Salin apa adanya. Ini komponen paling padat sekaligus paling portabel.**

```js
import { createScratchpad } from './core/ui/scratchpad.js';

const pad = createScratchpad(stageElement);   // biasanya .ws-stage
pad.open(); pad.close();
pad.state;        // { open, peeking, tool, color, width, strokes, history, redo, committed }
pad.destroy();    // WAJIB
```

Memanggilnya dengan `host` kosong mengembalikan objek no-op — aman dipanggil
di mana saja.

**Enam keputusan desain yang wajib dipahami sebelum menyentuhnya:**

| # | Keputusan | Alasan yang sudah dibayar |
|---|---|---|
| 1 | **Vektor, bukan bitmap** | Panggung ±1000×600 CSS px di layar 2× = satu `getImageData` **9,6 MB**; dua puluh langkah **190 MB**. Satu goresan vektor **±2 KB** |
| 2 | **Titik ternormalisasi 0..1** | `ResizeObserver` bisa menggambar ulang **tajam** saat layar berubah. Bitmap hanya bisa diregangkan |
| 3 | **`drawTail()` dengan penanda `s.drawn`** | Satu peristiwa gerak membawa **banyak** titik (`getCoalescedEvents`). Menggambar hanya ruas terakhir menyisakan celah yang cuma muncul saat disapu cepat |
| 4 | **Penghapus per-GORESAN, bukan per-piksel** | Yang ingin dibuang siswa selalu satu simbol utuh. Penghapus piksel menyisakan puing separuh angka. Geometri: `segSegDist`, `segIntersect`, `distPointSeg`, `ERASER_REACH = 12` |
| 5 | **Riwayat berbasis TINDAKAN** (`{type:'draw'}` / `{type:'erase', removed:[{index, stroke}]}`) | Satu sapuan yang membuang tiga goresan tetap **satu** langkah undo, dan pengembaliannya harus **terbalik** dari urutan pembuangan agar posisi tumpuknya pulih persis |
| 6 | **Batas undo dihitung dari penanda yang hanya NAIK** (`committed`) | Menghitungnya ulang sebagai `panjang − 20` membuat batasnya ikut **turun** tiap undo — dan batas itu tidak pernah berlaku |

**Mekanik "Mengintip" (Peek).** Tahan ikon mata → kanvas `opacity: 0` dengan
`transition: opacity .2s ease-in-out`, supaya siswa bisa melihat soal di balik
coretannya. Menggambar dimatikan selama mengintip.

Pelepasannya didengarkan di **DUA** tempat, dan itu disengaja:

- **di tombolnya** — `pointerup` / `pointercancel` / `pointerleave`;
- **di `window`** — jaring pengaman. Bilah alat ikut lenyap saat mengintip, jadi
  kalau tombolnya kehilangan pointer (jari digeser ke luar panggung, jendela
  kehilangan fokus), papan bisa tersangkut tembus pandang **selamanya**. Satu
  papan yang macet di tengah ujian jauh lebih mahal daripada dua listener.

> ⚠️ **Kanvasnya PADAT (putih + kisi titik), dan kisi itu milik CSS — jangan
> pernah dilukis ke bitmap.** Mengecatnya ke bitmap membuat setiap piksel
> ber-alfa penuh, dan seluruh pengujian yang menghitung tinta lewat
> `getImageData` kehilangan maknanya **tanpa pernah gagal**.

> ⚠️ **`destroy()` WAJIB dipanggil.** Papan memegang `ResizeObserver` dan
> listener di `window` yang **tidak ikut mati** oleh `innerHTML = ''`.

**Di mana ia hidup:** mode Belajar **dan** mode Ujian. Ditambatkan ke
`.ws-stage`, dibuat **sekali per sesi** — coretan hitungan harus bertahan saat
siswa melompat antar soal.

> **Untuk Vektor, papan coret justru lebih penting daripada di Matriks.**
> Menghitung $\cos\theta = \frac{u\cdot v}{‖u‖‖v‖}$ menuntut tiga hitungan
> antara. Tanpa tempat mencoret, siswa mengambil kertas — dan begitu matanya
> turun ke kertas, konteks soalnya hilang.

---

### 4.8 Kelas dasar `Simulation` — kerangka paling bisa dipakai ulang 🟩

Ada di `simCore.js`. **Salin kelasnya; helper render matriks di berkas yang
sama ditulis ulang untuk vektor.**

#### Siklus hidup

```
mountSimulation(container, definition, onComplete, options)
        │
        ├─ new Engine(container, config, toasts, onComplete)
        ├─ sim.onSlideChange = …   ┐
        ├─ sim.savedState  = …     ├─ dipasang SEBELUM build()
        ├─ sim.onStateChange = …   │
        ├─ sim.hintHost = …        ┘  (scaffold() sudah memakainya saat itu juga)
        ├─ sim.build()                ← satu-satunya yang WAJIB di-override
        └─ sim.resumeToStep(n)
                  ⋮
        sim.destroy()   ← dipanggil mountScreen() lewat activeView
```

#### API yang diwarisi engine

```js
/* --- kerangka --- */
scaffold({ brief, promptText, promptStep, legend })   // brief → legenda → prompt → panggung
addHint(node)            // mendarat di panel KIRI bila ada, bukan di panggung
setPrompt(text, step)
resetStage()             // bersihkan panggung + timer + klaim + drop-zone
reserveSlot(minHeight)   // wadah tinggi TETAP; isinya boleh berganti

/* --- gerbang sekali-jalan (anti klik-beruntun) --- */
claim(name)              // true HANYA pada pemanggil PERTAMA
release(name)
releaseAllClaims()
lockChoices(container, { keep })   // matikan semua elemen interaktif
setBusy(state)

/* --- langkah & slide --- */
useSteps(labels, { allowJump, onJump })
useStepsSilent(count, onJump)      // tanpa slider, TAPI pemulihan posisi tetap hidup
setStep(i) / markStepDone(i) / disposeSlider() / resumeToStep(i)
markSlideSolved(i, payload) / isSlideSolved(i) / getSlideState(i) / solvedBanner(text)

/* --- pembongkaran --- */
track(cleanupFn)         // daftarkan pelepas; dipanggil saat destroy/resetStage
later(fn, ms)            // setTimeout BERJEJAK — tidak jalan bila sudah dibongkar
wait(ms)                 // Promise berjejak; bila dibongkar, SENGAJA tidak pernah selesai
clearTimers() / destroy()

/* --- umpan balik --- */
msg(key, values)                     // fillTemplate dari toasts JSON
reject(el, key, values)              // toast + guncang
rejectAndLock(el, key, values)       // + matikan opsi salah permanen
complete(message)                    // buka Mini Kuis + banner overlay
saveState(payload)
```

#### Empat mekanisme yang harus dipahami sebelum menulis engine pertama

**1. `claim()` — bukan `setBusy()`.**

```js
onPilih(cell) {
  if (!this.claim('langkah3')) return;   // SINKRON, di baris pertama
  this.lockChoices(this.stage, { keep: cell });
  // … animasi, await, tulis hasil …
  this.release('langkah3');              // saat langkah berikutnya digambar
}
```

`setBusy()` saja tidak cukup: ia baru menyala **sesudah** penanganan dimulai,
sementara klik beruntun tiba di frame yang sama — keduanya lolos pemeriksaan
sebelum salah satunya sempat menyalakan `busy`. Akibatnya evaluasi berjalan dua
kali: panel vonis tergandakan dan perpindahan slide dijadwalkan berkali-kali.

> **Nama kuncinya harus TETAP.** Kunci yang namanya mengandung indeks yang ikut
> berubah (`claim('sel-' + i)`) tidak menahan apa pun.

**2. `later()` / `wait()` — bukan `setTimeout` telanjang.**

`setTimeout` yang menyentuh DOM harus lewat `this.later()`, supaya ia ikut mati
saat siswa pindah layar di tengah animasi. Kalau tidak, ia menyala beberapa
detik kemudian dan menulis ke node yang sudah lenyap.

`wait()` punya sifat yang tampak aneh tapi sengaja: **kalau simulasinya
dibongkar selama jeda, promise-nya TIDAK PERNAH selesai.** Dengan begitu sisa
fungsi `async` (yang biasanya langsung menulis ke sel) tidak pernah berjalan,
tanpa perlu menaruh penjaga `if (this.destroyed)` di tiap baris sesudah `await`.

**3. `hintHost` — petunjuk milik panel kiri.**

Brief, legenda, prompt, checklist, pemilih kasus, dan slider langkah semuanya
**kendali** — mereka milik `.ws-side`. Menempelkannya langsung ke `root` akan
menaruhnya di atas panggung dan merusak arsitektur Sidebar & Stage.

**4. `locksOnComplete` — "selesai" berlaku per KASUS.**

`complete()` memasang kelas `sim--done` yang mematikan `pointer-events`
**seluruh** simulasi. Untuk simulasi satu-babak itu benar. Untuk simulasi
**multi-kasus** itu bencana: `complete()` dipanggil begitu kasus pertama tuntas
— supaya Mini Kuis terbuka — dan sejak detik itu kasus kedua dan ketiga ikut
mati padahal belum tersentuh. Engine seperti itu memasang
`this.locksOnComplete = false` dan mengurus penguncian sendiri per kasus.

#### Pola sub-engine (Fase 13.5 & 16) — **pakai ulang, jangan salin**

Satu mekanik = satu kelas. Kalau sebuah simulasi baru membutuhkan langkah yang
sudah matang di simulasi lain, **tanam engine itu sebagai sub-engine**:

```js
class ProyeksiVektorSim extends Simulation {
  build() {
    // Tahap 1: dot product — pakai ulang engine yang sudah lulus QA
    this.sub = new DotProductSim(this.stage, { ...cfg }, toasts, () => this.lanjutTahap2());
    this.sub.hintHost = this.hintHost;          // hintHost SENDIRI
    this.sub.complete = function (msg) {        // WAJIB di-override:
      this.finished = true;                     // jangan pasang banner
      this.onComplete();                        // "lanjut ke Mini Kuis" di tengah alur
    };
    this.sub.build();
  }
  destroy() {
    if (this.sub) this.sub.destroy();           // induk WAJIB membongkarnya
    super.destroy();
  }
}
```

---

### 4.9 Dua mesin soal — dua kontrak yang SALING BERLAWANAN 🟩

**Jangan pernah menyatukannya.** Menggabungkan keduanya membuat setiap cabang
`if` di dalamnya berarti dua hal sekaligus.

| | `QuizEngine` (Mini Kuis) | `ExamEngine` (Ujian CBT) |
|---|---|---|
| **Umpan balik** | **LANGSUNG**, per soal | **TERTUNDA**, seluruhnya saat "Kumpulkan" |
| **Tombol** | "Periksa Jawaban" | **TIDAK ADA** — hanya "Kumpulkan Ujian" |
| **Navigasi** | **Terkunci**: tidak boleh melewati soal yang belum dikuasai (`maxReached()`) | **Bebas**: kisi nomor 1..N, lompat ke mana saja |
| **Setelah menjawab** | Input dikunci, pembahasan langsung muncul | Jawaban tetap bisa diganti sampai dikumpulkan |
| **Lanjut sesi** | **YA** — `restoreSession()` / `saveSession()` lewat `sessionStorage` | **TIDAK** — sengaja. Ujian yang bisa ditinggal lalu dilanjutkan membuat siswa bebas mencari jawaban di antara dua sesi |
| **Keluar di tengah** | Posisi diingat | **Peringatan jujur**: "Jawaban pada sesi ini tidak akan tersimpan" |
| **Percobaan ulang** | "Coba Lagi" per soal | Ulangan **tak terbatas**, riwayat skor tersimpan |
| **Pelabelan opsi** | Titik/angka | **Huruf A–E gaya UTBK**, eksplisit |
| **Papan coret** | Opsional | **Wajib**, dibuat sekali per sesi |
| **Pedagogi** | *Mastery learning* — harus benar untuk membuka sub-topik berikutnya | *Manajemen waktu & keraguan di ruang ujian* |

**`QuizEngine` — API:**

```js
new QuizEngine(container, questions, {
  sessionKey,            // dari sessionState.quizKey(...)
  requireCorrect,        // true di Mini Kuis: wajib benar untuk lanjut
  showExplanation,
  backButton: { label, onClick },
  onFinish: ({ score, correct, totalQuestions, weakSubtopics }) => {},
}).start();
```

**`ExamEngine` — API:**

```js
new ExamEngine(container, questions, {
  eyebrow, title,
  getHistory: () => [{ attempt: 1, score: 60 }, …],   // FUNGSI, bukan array
  onFinish: (result) => {},
  onRetry: () => {},
  onExit: () => {},
}).start();

exam.destroy();   // WAJIB — ia memegang papan coret
```

> **`getHistory` harus berupa FUNGSI.** Riwayat dibaca ulang setiap kali panel
> digambar. Dengan daftar statis, nilai yang baru saja diperoleh siswa **tidak
> pernah muncul di riwayatnya sendiri** — terukur: panelnya kosong padahal
> skornya sudah tersimpan.

**Bentuk slot jawaban `ExamEngine`** (hafalkan; ia menentukan `gradeOne`):

| Tipe soal | Bentuk `answers[i]` | `null` berarti |
|---|---|---|
| `mathpad` | `string` | belum dijawab |
| `single_choice` | `number` (indeks opsi) | belum dijawab |
| `multi_select` | `number[]` terurut | belum dijawab |
| `matrix_input` | `string[][]` | belum dijawab |

> **Matriks punya DUA penyimpanan, dan itu disengaja.** `drafts` menampung
> isian setengah jadi supaya angka yang sudah diketik tidak hilang saat siswa
> melompat ke soal lain dan kembali. `answers` hanya terisi kalau **seluruh**
> selnya penuh — matriks separuh bukan jawaban, dan kisi navigasi tidak boleh
> menandainya "terisi". **Pola ini berlaku sama untuk isian vektor kolom.**

**Urutan bidang soal — kontrak yang tidak boleh dilanggar:**

```
prompt   → konteks         ("Perhatikan dua vektor berikut!")
table    → data tabel      (bila ada)
tex      → data rumus      ($u = (3,-1,2),\ v = (1,4,0)$)
after    → PERTANYAANNYA   ("**Tentukan besar sudut antara $u$ dan $v$.**")
options  → pilihan
```

`after` berdiri **sesudah** data dan **tepat di atas** pilihan. Soal yang
berhenti di "Perhatikan dua vektor berikut!" memaksa siswa menebak apa yang
diminta.

---

### 4.10 Kontrak siklus hidup — checklist pembongkaran

Ini penyebab kelas bug paling mahal di seluruh proyek: **state yang hidup di
luar pohon DOM layar, dan karena itu SELAMAT dari `innerHTML = ''`.**

`mountScreen()` wajib menjalankan urutan ini, **dalam urutan ini**:

```js
function mountScreen(builder, { isBack = false } = {}) {
  clearToasts();
  closeMathpad();          // pad hidup di document.body — akan mengambang di layar baru
  anchorToasts(null);

  if (state.activeView?.destroy) {   // LessonView / ExamEngine / scratchpad
    state.activeView.destroy();
    state.activeView = null;
  }

  killAllMotion();         // HARUS mendahului pembongkaran DOM
  screenHost.innerHTML = '';
  // … bangun layar baru …
}
```

**Daftar hal yang selamat dari `innerHTML = ''`:**

| Yang selamat | Dibunuh oleh |
|---|---|
| Timeline GSAP (objek global) | `killGsap()` — `globalTimeline.clear()` **dan** `killTweensOf('*')`; yang satu tidak menjamin yang lain |
| Chip terbang / hantu seret di `document.body` | `removeOrphanNodes()` |
| Peta `zones` di `dragDrop.js` (state tingkat MODUL) | `resetDragSystem()` |
| `setTimeout` tertunda | `this.later()` + `clearTimers()` |
| `ResizeObserver` papan coret | `pad.destroy()` |
| Listener `window` (`resize`, `pointerup`, `blur`) | `pad.destroy()` |
| Mathpad di `document.body` | `closeMathpad()` |
| Gaya global (`body.style.cursor`, `userSelect`) | `killAllMotion()` |

---

## 5. LAPISAN DOMAIN VEKTOR

Semua di bagian ini berstatus 🟥 — **ditulis dari nol**. Yang diwarisi adalah
bentuk API-nya, bukan isinya.

### 5.1 `domain/vector.js` — matematika MURNI, tanpa DOM

Cerminan dari `engine/matrix.js` (256 baris, 30+ fungsi). Aturan yang sama
berlaku: **tanpa satu pun rujukan `document`**, supaya bisa diuji di Node murni
lewat `tests/engine.test.mjs` tanpa peramban.

```js
/* ---------- konstruksi ---------- */
vec(x, y, z)                       // {x, y, z}; z default 0 → R² adalah R³ dengan z=0
fromArray([x, y, z])
toArray(v)
fromPoints(A, B)                   // vektor AB = B − A
zero(dim) / isZero(v)
dim(v)                             // 2 atau 3, dideteksi dari z

/* ---------- operasi dasar ---------- */
add(u, v) / subtract(u, v)
scale(k, v) / negate(v)
equals(u, v, tol = 1e-9)

/* ---------- besaran ---------- */
normSquared(v)                     // x²+y²+z²  ← BILANGAN BULAT, dipakai surd.js
norm(v)                            // desimal; HANYA untuk pemeriksaan internal
unit(v)                            // vektor satuan
distance(A, B) / midpoint(A, B)

/* ---------- perkalian ---------- */
dot(u, v)                          // skalar
cross(u, v)                        // hanya R³ — lihat validator
tripleScalar(u, v, w)              // u · (v × w); volume paralelepipedum

/* ---------- sudut & proyeksi ---------- */
cosAngle(u, v)                     // dot/(‖u‖‖v‖) — dijepit ke [-1, 1]
angleBetween(u, v, { degrees })    // radian (default) atau derajat
projScalar(u, onto)                // proyeksi SKALAR ortogonal u pada v
projVector(u, onto)                // proyeksi VEKTOR ortogonal
reject(u, onto)                    // komponen tegak lurus: u − proj

/* ---------- relasi ---------- */
isPerpendicular(u, v, tol)         // dot ≈ 0
isParallel(u, v, tol)              // cross ≈ 0 (R³) / determinan ≈ 0 (R²)
isCollinear(A, B, C)
isCoplanar(u, v, w)                // tripleScalar ≈ 0

/* ---------- pembagian ruas garis ---------- */
sectionPoint(A, B, m, n)           // titik P membagi AB dengan AP:PB = m:n (dalam)
sectionPointOuter(A, B, m, n)      // pembagian luar

/* ---------- kombinasi linear ---------- */
linearCombination(coeffs, vectors)
solveCombination2D(target, u, v)   // cari a,b sehingga a·u + b·v = target

/* ---------- penyajian ---------- */
formatNumber(value, maxDecimals)
toLatex(v, { style })              // 'column' → \begin{pmatrix}…\end{pmatrix}
                                   // 'ijk'    → 3\hat{i} - \hat{j} + 2\hat{k}
                                   // 'tuple'  → (3, -1, 2)
toComponentText(v)
```

**Keputusan penting: R² diperlakukan sebagai R³ dengan `z = 0`.**
Menulis dua himpunan fungsi terpisah (`dot2`, `dot3`, `add2`, `add3`) menggandakan
seluruh permukaan API dan seluruh pengujiannya. `dim(v)` hanya dipakai di
lapisan penyajian dan validator — bukan di aritmetikanya.

**Pengecualian:** `cross()` **hanya** bermakna di R³. Di R², kembalikan vektor
dengan hanya komponen $z$ (itu memang benar secara matematis: $u \times v =
(0, 0, u_xv_y - u_yv_x)$) dan biarkan **validator** yang memutuskan apakah
operasi itu boleh ditawarkan ke siswa kelas 11.

### 5.2 `domain/surd.js` — kenapa `rational.js` tidak cukup

Di "Ruang Matriks", `rational.js` ada karena perkalian skalar pecahan **wajib
tetap pecahan eksak**: $\frac{1}{2} \times 3 = \frac{3}{2}$, bukan `1.5`.

**Di Vektor, masalahnya berpindah ke akar kuadrat — dan lebih parah.**

```
‖(2, 5)‖  = √29       BUKAN  5.385164807134504
‖(3, 4)‖  = 5         (kebetulan bulat)
‖(2, 4)‖  = 2√5       BUKAN  4.47213595499958
cos θ = 7/(√29·√5)  =  7√145/145     ← ini bentuk lembar jawaban
```

Angka `5.385164807134504` melanggar **dua** kontrak sekaligus: ia tidak bisa
ditelusuri siswa (kontrak 11), dan ia bukan bentuk yang ditulis di lembar
jawaban TKA.

```js
/* domain/surd.js — bentuk k√r, k dan r bilangan bulat, r bebas kuadrat */
surd(coefficient, radicand)        // {k, r}; r selalu bebas kuadrat setelah disederhanakan
fromSquare(n)                      // √n → disederhanakan: fromSquare(20) = 2√5
simplify(k, r)                     // tarik keluar faktor kuadrat terbesar
mulS(a, b) / divS(a, b)
isRational(s)                      // r === 1
toNumber(s)                        // HANYA untuk pemeriksaan & perbandingan
toLatexS(s)                        // '2\\sqrt{5}' · '5' · '\\sqrt{29}'
toText(s)                          // '2√5'
parseSurd(input)                   // '2akar5' / '2√5' / '5' dari papan angka
equalsS(a, b)
```

**Aturan pemakaian:**

| Situasi | Yang dipakai |
|---|---|
| Menampilkan panjang vektor ke siswa | `toLatexS(fromSquare(normSquared(v)))` |
| Memeriksa jawaban siswa | `equalsS()` **atau** `numbersMatch(toNumber(...))` dengan toleransi |
| Menghitung sudut | Desimal boleh — sudut memang dibulatkan ke derajat |
| Perbandingan dua panjang | `normSquared` saja, tanpa akar sama sekali |

> **Trik yang menghemat separuh masalah:** untuk membandingkan panjang, jangan
> pernah mengambil akarnya. $‖u‖ > ‖v‖ \iff ‖u‖^2 > ‖v‖^2$, dan
> `normSquared()` selalu bilangan bulat kalau komponennya bulat. Tidak ada
> floating-point, tidak ada toleransi, tidak ada bug pembulatan.

### 5.3 `domain/validator.js` — aturan boleh/tidak **beserta kalimatnya**

Bentuk hasilnya seragam, persis seperti aslinya:

```js
function ok()            { return { valid: true,  reason: null }; }
function fail(reason)    { return { valid: false, reason }; }
```

Yang membuat modul ini berharga bukan pemeriksaannya, melainkan **kalimat
penjelasnya**. Kontrak 4: penolakan tanpa alasan tidak mengajar apa-apa.

```js
canAddSubtract(u, v)      // dimensi harus sama
canDot(u, v)              // dimensi harus sama
canCross(u, v)            // WAJIB R³ keduanya
canUnit(v)                // vektor nol tidak punya arah
canAngle(u, v)            // tidak boleh ada vektor nol
canProject(u, onto)       // tidak boleh memproyeksikan ke vektor nol
canSection(A, B, m, n)    // m+n ≠ 0

fillTemplate(template, values)          // {{kunci}} — kurung GANDA
validateNumberInput(raw, opts)
numbersMatch(actual, expected, tol)
```

Contoh kalimat yang harus ditulis dengan kualitas yang sama seperti aslinya:

```js
export function canCross(u, v) {
  if (dim(u) !== 3 || dim(v) !== 3) {
    return fail(
      'Perkalian silang hanya terdefinisi di ruang tiga dimensi. ' +
      `Vektor ini masih di bidang (${dim(u)} komponen) — tambahkan komponen ` +
      '$z$-nya lebih dulu, atau pakai perkalian titik yang berlaku di R² maupun R³.'
    );
  }
  return ok();
}

export function canUnit(v) {
  if (isZero(v)) {
    return fail(
      'Vektor nol tidak punya vektor satuan — ia tidak menunjuk ke arah mana pun. ' +
      'Rumus $\\hat{v} = \\frac{v}{‖v‖}$ akan membagi dengan nol, dan pembagian ' +
      'dengan nol tidak terdefinisi.'
    );
  }
  return ok();
}
```

> Bandingkan dengan kalimat aslinya untuk `canInverse()`: *"Matriks ini singular
> (determinannya 0), sehingga inversnya tidak ada — rumus invers akan membagi
> dengan nol, dan pembagian dengan nol tidak terdefinisi."*
> **Polanya:** sebut kondisinya → sebut akibatnya pada rumusnya → sebut alasan
> matematisnya. Tiga bagian, selalu.

### 5.4 `domain/plane/vectorPlane.js` — kanvas kartesius

Ini **komponen baru terbesar** di proyek Vektor, setara peran `renderMatrix()`
di proyek Matriks. Keputusan teknologinya menentukan banyak hal di belakangnya.

#### Keputusan: **SVG**, bukan `<canvas>`

| Kriteria | SVG | `<canvas>` |
|---|---|---|
| **Tap-tap & drag per elemen** | ✅ Tiap panah/titik adalah node DOM: `addEventListener` langsung, `makeTappable()` berlaku apa adanya | ❌ Harus menulis hit-testing sendiri untuk setiap bentuk |
| **Pengujian pengukuran (§8)** | ✅ `getBoundingClientRect()`, `getComputedStyle()`, `elementFromPoint()` semuanya bekerja | ❌ Hanya bisa menghitung piksel — rapuh dan lambat |
| **Aksesibilitas** | ✅ `role`, `aria-label` per panah | ❌ Tidak ada |
| **Tema lewat token CSS** | ✅ `stroke: var(--brand-primary)` | ❌ Warna di-hardcode di JS |
| **Ketajaman saat ubah ukuran** | ✅ Vektor sejati | ⚠️ Butuh `devicePixelRatio` + gambar ulang manual |
| **Animasi** | ✅ CSS transition + GSAP menarget node | ⚠️ Gambar ulang per frame |
| **Performa pada ribuan elemen** | ❌ | ✅ |

Simulasi vektor menampilkan **belasan** elemen, bukan ribuan. **SVG menang
telak.** `<canvas>` tetap dipakai untuk satu hal: papan coret (§4.7), di mana
goresan bebas memang cocok dengan raster.

> **Konsistensi arsitektural:** di Matriks, sel matriks adalah `<div>` yang bisa
> diketuk, disorot, dan diukur. Di Vektor, panah SVG mengambil peran itu persis.
> Seluruh kontrak interaksi (tap-tap, `claim()`, `lockChoices()`,
> `.is-locked`, `.cell--muted`) berlaku tanpa satu baris pun logika baru.

#### API yang disarankan

```js
const plane = createVectorPlane(host, {
  xRange: [-6, 6],
  yRange: [-4, 4],
  grid: 'unit' | 'none',
  axisLabels: ['x', 'y'],
  showOrigin: true,
  interactive: true,
});

/* --- menggambar --- */
const a = plane.drawVector({ from: [0,0], to: [3,2], name: 'u', tone: 'blue' });
const p = plane.drawPoint([3,2], { label: 'A' });
plane.drawSegment([0,0], [3,2], { dashed: true });
plane.drawAngleArc(u, v, { label: null });   // label null: kontrak §1.4
plane.drawComponentGuides(a);                // garis putus-putus ke sumbu
plane.drawParallelogram(u, v);
plane.drawProjection(u, onto, { showFoot: true });

/* --- interaksi --- */
a.setTappable(handler, ariaLabel);
a.setDraggableTip(onChange);   // WAJIB punya padanan tap-tap (kontrak 5)
a.setTone('blue' | 'amber' | 'muted' | 'ghost');
a.setValue([4, 1]);            // animasi ke posisi baru
a.highlight() / a.mute() / a.lock();

/* --- siklus hidup --- */
plane.toScreen([x, y])   // koordinat matematika → piksel SVG
plane.toMath([px, py])   // kebalikannya — perhatikan sumbu Y TERBALIK
plane.destroy();         // ResizeObserver + listener
```

#### Enam aturan yang wajib dipatuhi kanvas ini

1. **Sumbu Y terbalik.** Di layar, $y$ bertambah **ke bawah**. Semua konversi
   lewat `toScreen()` / `toMath()`, **tidak pernah** aritmetika langsung di
   tempat lain. Satu tanda minus yang terlewat menghasilkan simulasi yang
   "hampir benar" dan sangat sulit dilihat dari kode.
2. **`viewBox` tetap + `preserveAspectRatio="xMidYMid meet"`.** Skala 1 satuan
   di sumbu $x$ **harus** sama persis dengan 1 satuan di sumbu $y$ — kalau
   tidak, sudut $45°$ tampil bukan $45°$ dan vektor tegak lurus tampil miring.
   **Ini bukan estetika, ini kebenaran matematis.**
3. **Kisi dan sumbu digambar di lapisan terpisah**, di belakang, dengan
   `pointer-events: none`. Kalau tidak, `elementFromPoint()` akan mengembalikan
   garis kisi dan siswa tidak pernah berhasil mengetuk panahnya.
4. **Kepala panah pakai `<marker>` dengan `markerUnits="userSpaceOnUse"`.**
   Dengan `strokeWidth` (bawaan), kepala panah ikut membesar saat garisnya
   ditebalkan untuk sorotan — dan panah tersorot tampak seperti panah yang
   berbeda. Warnanya **harus** disetel eksplisit; `<marker>` tidak mewarisi
   `currentColor` dari elemen yang memakainya di semua peramban.
5. **Label ($u$, $A$, $\theta$) ditaruh sebagai `<foreignObject>` berisi HTML
   hasil `renderToString()`**, bukan `<text>`. `<text>` SVG tidak bisa merender
   KaTeX, tidak membungkus baris, dan tidak bisa ditata dengan token CSS.
   *Cadangan:* kalau `<foreignObject>` bermasalah, taruh label sebagai `<div>`
   berposisi absolut di atas SVG, diposisikan dari `toScreen()`.
6. **`ResizeObserver` + gambar ulang**, sama seperti papan coret. Dan `destroy()`
   yang melepasnya — ia selamat dari `innerHTML = ''`.

### 5.5 Kurikulum yang disarankan — 4 bab, 22 sub-topik

Dipetakan agar setiap bab punya beban setara dengan Matriks, dan agar bab 4
tetap menjadi "masterclass pemodelan TKA" seperti aslinya.

| Bab | ID | Sub-topik | Engine simulasi |
|---|---|---|---|
| **1. Konsep Dasar Vektor** | `01_konsep_dasar` | `pengertian_notasi` | `vector_anatomy` |
| | | `vektor_posisi` | `position_vector` |
| | | `komponen_r2_r3` | `component_builder` |
| | | `kesamaan_vektor` | `equality_link` |
| | | `panjang_vektor` | `magnitude_builder` |
| | | `vektor_satuan` | `unit_vector` |
| **2. Operasi Vektor** | `02_operasi_vektor` | `penjumlahan_segitiga` | `triangle_rule` |
| | | `penjumlahan_jajargenjang` | `parallelogram_rule` |
| | | `pengurangan_vektor` | `subtraction_arrow` |
| | | `perkalian_skalar` | `scalar_sweep` |
| | | `kombinasi_operasi` | `combo_vector_op` |
| | | `kombinasi_linear` | `linear_combination` |
| | | `pembagian_ruas_garis` | `section_point` |
| **3. Perkalian Vektor** | `03_perkalian_vektor` | `dot_product` | `dot_builder` |
| | | `sudut_antar_vektor` | `angle_solver` |
| | | `vektor_tegak_lurus` | `perpendicular_check` |
| | | `proyeksi_skalar` | `scalar_projection` |
| | | `proyeksi_vektor` | `vector_projection` |
| | | `cross_product` | `cross_sarrus` |
| **4. Pemodelan & Aplikasi TKA** | `04_pemodelan_tka` | `resultan_gaya` | `force_resultant` |
| | | `navigasi_arah` | `navigation_model` |
| | | `ekstraksi_komponen` | `sniper_component` |
| | | `analisis_multi_kondisi` | `multi_condition` |

> **Gunakan ID baru untuk sub-topik yang isinya berganti total.** Mempertahankan
> ID lama akan menandai siswa sudah menyelesaikan sesuatu yang tidak pernah ia
> kerjakan. Ini pelajaran Fase 17 (`spltv_matriks` → `ekstraksi_elemen`).

### 5.6 Anatomi satu engine baru — templat lengkap

```js
/**
 * simProducts.js → DotBuilderSim
 *
 * Melatih perkalian titik sebagai PENJUMLAHAN HASIL KALI KOMPONEN SELETAK,
 * bukan sebagai satu tombol. Alurnya mencerminkan MatrixMultiplySim:
 * pasangan demi pasangan, dan tombol hitung baru muncul setelah seluruh
 * pasangan lengkap — sebelum itu memang tidak ada, tidak ada jalan pintas.
 */
export class DotBuilderSim extends Simulation {
  build() {
    const { u, v, name = ['u', 'v'] } = this.config;

    this.scaffold({
      brief: this.config.brief,
      promptText: `Ketuk komponen **$x$** pada $${name[0]}$, lalu pasangannya pada $${name[1]}$.`,
      promptStep: 'Langkah 1 dari 2',
      legend: [
        { tone: 'blue',  label: 'Biru = pasangan yang sedang dikerjakan' },
        { tone: 'muted', label: 'Abu = belum giliran' },
      ],
    });

    this.uView = renderColumnVector(u, { name: name[0], showAddress: true });
    this.vView = renderColumnVector(v, { name: name[1], showAddress: true });

    // Ruang persamaan DIPESAN sejak awal — tingginya tidak boleh berubah
    // saat suku demi suku bertambah (kontrak 8).
    this.termHost = this.reserveSlot(96);

    this.stage.appendChild(equationRow(
      this.uView.root, operatorGlyph('·'), this.vView.root
    ));
    this.stage.appendChild(this.termHost);

    this.pairsDone = 0;
    this.terms = [];
    this.pending = null;

    this.uView.cells.forEach((cell, key) =>
      this.track(makeTappable(cell, () => this.pickFrom(key, cell), `Komponen ${key}`)));
    this.vView.cells.forEach((cell, key) =>
      this.track(makeTappable(cell, () => this.pickTo(key, cell), `Komponen ${key}`)));

    // Pulihkan kemajuan sesi sebelumnya (kontrak: posisi siswa diingat).
    if (this.savedState) this.restore(this.savedState);
  }

  pickTo(key, cell) {
    if (!this.pending) {
      return this.reject(cell, 'pilihSumberDulu');   // kalimat dari JSON
    }
    if (key !== this.pending.key) {
      // Penolakan WAJIB menjelaskan KENAPA, bukan sekadar mengguncang.
      return this.reject(cell, 'komponenTidakSeletak', {
        indeks: this.pending.key,
      });
    }
    if (!this.claim(`pasangan-${key}`)) return;      // SINKRON, klik pertama menang

    this.lockChoices(this.stage);
    this.tambahSuku(this.pending.cell, cell);
  }

  async tambahSuku(a, b) {
    await flyMergeLand([a, b], this.termHost, this.termHost, { operator: '×' });
    this.pairsDone += 1;
    this.saveState({ pairsDone: this.pairsDone, terms: this.terms });

    if (this.pairsDone < this.dimensi) {
      this.release(`pasangan-${this.pending.key}`);
      this.pending = null;
      this.setPrompt('Lanjut ke pasangan berikutnya.', `Langkah 1 dari 2`);
      return this.unlockSisanya();
    }

    // Semua pasangan lengkap → BARU tombol hitung muncul.
    this.tampilkanIsianHasil();
  }

  tampilkanIsianHasil() {
    // Siswa MENGETIK hasilnya sendiri. Aplikasi tidak pernah menghitung.
    const input = document.createElement('input');
    attachMathpad(input, {
      onCommit: (value) => {
        const benar = numbersMatch(Number(value), dot(this.config.u, this.config.v));
        if (!benar) return this.reject(input, 'hasilSalah');
        this.complete();
      },
    });
    this.termHost.appendChild(input);
  }

  destroy() {
    // Tidak ada yang khusus di sini: track() dan later() sudah mengurus
    // semuanya. Override HANYA kalau engine memegang sub-engine atau
    // observer sendiri.
    super.destroy();
  }
}
```

**Lalu daftarkan** — dan kunci registry **harus sama persis** dengan
`simulation.engine` di JSON:

```js
// simulations/index.js
export const SIMULATION_REGISTRY = {
  dot_builder: DotBuilderSim,
  // Alias untuk nama lama, supaya satu salah ketik di data tidak
  // menampilkan layar kosong:
  dot_product: DotBuilderSim,
};
```

> Engine yang tidak terdaftar **tidak melempar error** — ia menampilkan
> empty-state dan **tetap mengizinkan siswa lanjut ke Mini Kuis**. Siswa tidak
> boleh pernah terjebak di layar buntu karena kesalahan penulis data.

---

## 6. SKEMA DATA

Konten dan kode terpisah total. **Idealnya, untuk proyek Vektor hanya
berkas-berkas di bagian inilah — ditambah `js/domain/` dan `simulations/` —
yang benar-benar baru.**

### 6.1 `data/lessons.json` — manifest

```json
{
  "schemaVersion": 1,
  "title": "Ruang Vektor",
  "subtitle": "Matematika Tingkat Lanjut — Kelas 11",
  "chapters": [
    {
      "id": "01_konsep_dasar",
      "number": 1,
      "title": "Konsep Dasar Vektor",
      "tagline": "Kenali arah dan besar sebelum menghitung apa pun.",
      "accent": "primary",
      "src": "data/chapters/01_konsep_dasar.json",
      "subtopicOrder": [
        "pengertian_notasi",
        "vektor_posisi",
        "komponen_r2_r3",
        "kesamaan_vektor",
        "panjang_vektor",
        "vektor_satuan"
      ]
    }
  ]
}
```

> **`subtopicOrder` adalah sumber kebenaran urutan DAN kunci.**
> `isSubtopicUnlocked()` membacanya. Menambah sub-topik = menambah ID di sini
> **lebih dulu**.
>
> `accent` yang tersedia: `primary` · `coral` · `amber` · `success`.

### 6.2 `data/chapters/<bab>.json` — materi + simulasi + kuis

```json
{
  "id": "03_perkalian_vektor",
  "title": "Perkalian Vektor",
  "subtopics": [
    {
      "id": "dot_product",
      "title": "Perkalian Titik (Dot Product)",

      "materi": [
        { "t": "p",
          "x": "Dua vektor bisa dikalikan, tapi hasilnya **bukan vektor** — melainkan sebuah **bilangan**. Itulah sebabnya ia disebut perkalian *skalar*." },

        { "t": "def", "title": "Definisi Aljabar",
          "x": "Jika $u = (u_1, u_2, u_3)$ dan $v = (v_1, v_2, v_3)$, maka $u \\cdot v = u_1v_1 + u_2v_2 + u_3v_3$." },

        { "t": "tex",
          "x": "u \\cdot v = \\|u\\|\\,\\|v\\|\\cos\\theta" },

        { "t": "tip", "title": "Cara Mengingat",
          "x": "Kalikan komponen yang **seletak**, lalu jumlahkan semuanya. Persis seperti mengalikan baris dengan kolom pada matriks." },

        { "t": "warn", "title": "Jangan Tertukar",
          "x": "$u \\cdot v$ menghasilkan **bilangan**; $u \\times v$ menghasilkan **vektor**. Titik dan silang bukan sekadar notasi berbeda." },

        { "t": "steps",
          "items": [
            "Pasangkan komponen yang seletak.",
            "Kalikan tiap pasangan.",
            "Jumlahkan seluruh hasil kalinya."
          ] },

        { "t": "list",
          "items": [
            "**Komutatif:** $u \\cdot v = v \\cdot u$.",
            "**Distributif:** $u \\cdot (v + w) = u\\cdot v + u \\cdot w$.",
            "**Tegak lurus:** $u \\cdot v = 0$ bila $u \\perp v$ dan keduanya bukan vektor nol."
          ] },

        { "t": "typegroup", "n": "1", "title": "Berdasarkan Tanda Hasilnya",
          "lead": "Tanda $u \\cdot v$ langsung memberi tahu **jenis sudutnya**.",
          "items": [
            { "name": "Positif", "tex": "u \\cdot v > 0", "text": "Sudutnya **lancip**." },
            { "name": "Nol",     "tex": "u \\cdot v = 0", "text": "Sudutnya **siku-siku**." },
            { "name": "Negatif", "tex": "u \\cdot v < 0", "text": "Sudutnya **tumpul**." }
          ],
          "note": "Tidak perlu menghitung sudutnya untuk tahu jenisnya." }
      ],

      "simulation": {
        "engine": "dot_builder",
        "title": "Simulasi: Pasangkan, Kalikan, Jumlahkan",
        "brief": "Kerjakan pasangan demi pasangan. Tombol hitung baru muncul setelah seluruh pasangan lengkap.",
        "config": {
          "u": [3, -1, 2],
          "v": [1, 4, 0],
          "name": ["u", "v"]
        },
        "toasts": {
          "pilihSumberDulu": "Ketuk dulu komponen di $u$, baru pasangannya di $v$.",
          "komponenTidakSeletak": "Belum tepat — kamu memilih komponen ke-{{indeks}} pada $u$, jadi pasangannya harus komponen ke-{{indeks}} juga pada $v$. Perkalian titik hanya memasangkan komponen yang **seletak**.",
          "hasilSalah": "Belum tepat — jumlahkan **seluruh** hasil kalinya, termasuk suku yang bernilai nol.",
          "success": "Tepat! $u \\cdot v = 3(1) + (-1)(4) + 2(0) = -1$."
        }
      },

      "quiz": [ { "id": "q_03_01_a", "input_type": "single_choice", "…": "…" } ]
    }
  ]
}
```

**Jenis blok `materi` yang didukung `lessonRenderer.js`:**

| `t` | Bidang | Tampilan |
|---|---|---|
| `p` | `x` | Paragraf |
| `def` | `title`, `x` | Kartu definisi |
| `tip` | `title`, `x` | Kartu tips |
| `warn` | `title`, `x` | Kartu peringatan |
| `tex` | `x` | Rumus display mode |
| `steps` | `items[]` | Daftar bernomor |
| `list` | `items[]` | Daftar berpoin |
| `typegroup` | `n`, `title`, `lead`, `items[{name, tex, text}]`, `note` | Kelompok klasifikasi |

### 6.3 `data/quizzes.json` — bank soal

```json
{
  "schemaVersion": 1,
  "modes": [
    { "id": "latihan_bab",  "label": "Latihan per Bab",
      "description": "Soal terfokus dari satu bab untuk drilling." },
    { "id": "simulasi_tka", "label": "Latihan Soal TKA",
      "description": "10 soal bergaya ujian sesungguhnya." }
  ],
  "banks": {
    "01_konsep_dasar": [ /* … */ ],
    "tka_2025":        [ /* … */ ]
  },
  "tkaSimulation": {
    "title": "Latihan Soal TKA",
    "questionCount": 10,
    "questionOrder": ["tka25_01", "tka25_02", "b3_04", "…"],
    "note": "Urutan TETAP, dipilih tangan sebagai penutup bergaya HOTS."
  }
}
```

#### Empat tipe soal — templat kosong

```jsonc
// ── 1. ISIAN ANGKA (papan angka) ─────────────────────────────
{
  "id": "b3_01",
  "input_type": "mathpad",
  "subtopic": "dot_product",
  "prompt": "Diketahui $u = (3,-1,2)$ dan $v = (1,4,0)$.",
  "after":  "**Tentukan nilai $u \\cdot v$.**",
  "answer": -1,
  "tolerance": 1e-6,
  "explanation": "$u\\cdot v = 3(1) + (-1)(4) + 2(0) = 3 - 4 + 0 = -1$.",
  "toastWrong": "Belum tepat — jangan lupa suku ketiganya. $2 \\times 0 = 0$ tetap ikut dijumlahkan."
}

// ── 2. PILIHAN GANDA (A–E gaya UTBK) ─────────────────────────
{
  "id": "b3_02",
  "input_type": "single_choice",
  "subtopic": "sudut_antar_vektor",
  "source": "TKA 2025 · No. 7",          // opsional: badge amber
  "prompt": "Perhatikan dua vektor berikut!",
  "tex": "u = (1, 1, 0), \\quad v = (0, 1, 1)",
  "after": "**Tentukan besar sudut antara $u$ dan $v$.**",
  "options": [
    { "tex": "30^\\circ" },
    { "tex": "45^\\circ" },
    { "tex": "60^\\circ" },
    { "tex": "90^\\circ" },
    { "tex": "120^\\circ" }
  ],
  "answerIndex": 2,
  "explanation": "$u\\cdot v = 1$, $\\|u\\| = \\|v\\| = \\sqrt{2}$, jadi $\\cos\\theta = \\frac{1}{2}$ — **opsi C**.",
  "toastWrong": "Belum tepat — hitung dulu $u \\cdot v$, baru kedua panjangnya."
}

// ── 3. MULTI-SELECT (multi-kondisi) ──────────────────────────
{
  "id": "b3_03",
  "input_type": "multi_select",
  "subtopic": "vektor_tegak_lurus",
  "prompt": "Pilih **semua** pernyataan yang benar.",
  "options": [
    { "label": "Jika $u \\cdot v = 0$ maka $u \\perp v$." },
    { "label": "$u \\cdot v = v \\cdot u$ selalu berlaku." },
    { "label": "$u \\times v = v \\times u$ selalu berlaku." },
    { "label": "Vektor nol tegak lurus terhadap semua vektor." }
  ],
  "answerIndices": [1, 3],
  "perOptionFeedback": [
    "Hampir — pernyataan ini gugur bila salah satunya vektor nol.",
    "Benar — perkalian titik bersifat komutatif.",
    "Salah — $u \\times v = -(v \\times u)$. Perkalian silang ANTI-komutatif.",
    "Benar — hasil kali titiknya selalu nol."
  ],
  "explanation": "…",
  "toastWrong": "Ada pilihan yang belum tepat — perhatikan caption di bawah tiap pernyataan."
}

// ── 4. ISIAN VEKTOR (grid input) ─────────────────────────────
{
  "id": "b3_04",
  "input_type": "matrix_input",        // nama tipe DIPERTAHANKAN: mesinnya generik
  "subtopic": "cross_product",
  "prompt": "Diketahui $u = (1,2,3)$ dan $v = (0,1,4)$.",
  "after": "**Tentukan $u \\times v$ dalam bentuk vektor kolom.**",
  "rows": 3,
  "cols": 1,
  "answer": [[5], [-4], [1]],
  "explanation": "…",
  "toastWrong": "Belum tepat — periksa tanda komponen $y$-nya; suku kedua Sarrus selalu dikurangkan."
}

// ── Tabel data (dipakai soal pemodelan) ──────────────────────
{
  "prompt": "Tiga gaya bekerja pada satu titik.",
  "table": {
    "headers": ["Gaya", "Besar (N)", "Arah"],
    "rows": [["$F_1$", 10, "$0^\\circ$"], ["$F_2$", 8, "$90^\\circ$"]]
  },
  "after": "**Tentukan besar resultan ketiga gaya tersebut.**"
}
```

**Bidang soal — rujukan lengkap:**

| Bidang | Wajib | Berlaku untuk | Catatan |
|---|---|---|---|
| `id` | ✅ | semua | Unik di seluruh berkas |
| `input_type` | ✅ | semua | `mathpad` · `single_choice` · `multi_select` · `matrix_input` |
| `subtopic` | ✅ | semua | Dipakai `weakSubtopics` di layar hasil |
| `prompt` | ✅ | semua | **Konteks**, lewat `renderMixed()` |
| `after` | ✅ | semua | **Pertanyaannya**, berdiri sesudah data. Kontrak 9 |
| `tex` | — | semua | Data rumus, display mode |
| `table` | — | semua | `{headers, rows}` — **DATA, bukan markdown** |
| `source` | — | semua | Badge amber (`"TKA 2025 · No. 7"`) |
| `answer` | ✅ | `mathpad`, `matrix_input` | Angka / `number[][]` |
| `tolerance` | — | numerik | Default `1e-6` |
| `options` | ✅ | pilihan | `[{label}]` atau `[{tex}]` |
| `answerIndex` | ✅ | `single_choice` | Indeks, 0-based |
| `answerIndices` | ✅ | `multi_select` | `number[]` |
| `perOptionFeedback` | — | `multi_select` | Caption per opsi setelah dinilai |
| `rows` / `cols` | ✅ | `matrix_input` | Vektor kolom R³ = `rows:3, cols:1` |
| `explanation` | ✅ | semua | Pembahasan |
| `toastWrong` | ✅ | semua | Kalimat penjelas saat salah |

### 6.4 Aturan menulis LaTeX di dalam JSON

| Aturan | Contoh |
|---|---|
| Backslash di JSON **selalu ganda** | `"$\\sqrt{29}$"` bukan `"$\sqrt{29}$"` |
| Hanya `$…$` yang dikenali `renderMixed()` | `$$…$$` → dolar mentah di layar. Pakai bidang `tex` untuk display mode |
| **Skrip Python yang menulis LaTeX WAJIB memakai raw string** | `r"\times"`. Tanpa `r`, `"\times"` menjadi TAB + `imes` — 26 string di 4 berkas pernah rusak begini |
| Placeholder toast memakai kurung **ganda** | `{{indeks}}` bukan `{indeks}` |
| Tabel ditulis sebagai **data**, bukan markdown | `renderMixed()` tidak mengenal sintaks tabel; pipanya tampil mentah |
| Norma ditulis `\\|v\\|` atau `\\lVert v \\rVert` | Jangan `|v|` telanjang di dalam tabel markdown dokumen |

### 6.5 Validator data — tulis ini di Fase 1, bukan Fase 15

Skrip kecil yang mahal kalau ditunda. Jadikan bagian dari `smoke.py`:

```python
# tests/validate_data.py
# 1. Setiap ID di subtopicOrder punya blok di chapters/*.json  (dan sebaliknya)
# 2. Setiap simulation.engine terdaftar di SIMULATION_REGISTRY
# 3. Setiap soal punya: id unik, subtopic yang ada, after, explanation, toastWrong
# 4. answerIndex < len(options); answerIndices ⊆ indeks yang sah
# 5. matrix_input: len(answer) == rows, len(answer[0]) == cols
# 6. Setiap {{placeholder}} di toasts ada nilainya di pemanggilan engine
# 7. Setiap $…$ berjumlah GENAP (dolar ganjil = LaTeX bocor ke layar)
```

Poin 2 khususnya: kunci registry **harus sama persis** dengan
`simulation.engine`. Satu salah ketik menampilkan empty-state yang terlihat
"sengaja", dan bisa lolos berminggu-minggu.

---

## 7. KONTRAK UI/UX & CSS

### 7.1 Arsitektur "Sidebar & Stage" — jangan dirusak

Layar belajar dan layar ujian dibelah dua. **Ini arsitektur, bukan gaya.**

| Kolom | Lebar | Isi |
|---|---|---|
| `.ws-side` | **25–30%** | Tombol kembali · judul bab & sub-topik · tab Materi/Simulasi/Kuis · `.ws-side__hint` (brief, legenda, prompt, checklist, pemilih kasus, slider langkah) · bilah aksi |
| `.ws-stage` | **69–76%** | **HANYA kanvas**: bidang kartesius, vektor, persamaan, atau teks teori |

```css
.workspace--split {
  display: grid;
  grid-template-columns: minmax(240px, 28%) minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  gap: clamp(var(--sp-3), 1.4vw, var(--sp-5));
  align-items: stretch;
  height: 100%;
  min-height: 0;          /* tanpa ini, grid item menolak menyusut */
}

.ws-side {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  min-height: 0;          /* PASANGAN WAJIB dari overflow-y: auto */
  min-width: 0;
}

.ws-side__hint {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
```

**Aturan turunannya:**

- **Panggung TIDAK boleh berisi tab, prompt, atau bilah aksi.** Semuanya
  kendali; mereka milik panel kiri.
- Simulasi menaruh petunjuknya lewat `Simulation.addHint()`, **bukan**
  `root.appendChild()`.
- **Scrollbar memeluk tepi kanan layar.** Yang menggulir adalah kolom panggung
  selebar penuh, bukan kartu ber-`max-width` di dalamnya.
- Bilah aksi hidup di `.workspace__actions`, baris grid **di luar**
  `.workspace__body` yang menggulir — kalau tidak, ia terpotong footer.

### 7.2 Viewport terkunci

```css
html, body {
  height: 100%;
  max-height: 100%;
  overflow: hidden !important;
  overscroll-behavior: none;
  position: fixed;
  inset: 0;
  width: 100%;
  touch-action: manipulation;
}

#app {
  height: 100dvh;
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: minmax(0, 1fr);   /* WAJIB EKSPLISIT — lihat §10 */
  overflow: hidden;
}

#app > * { min-width: 0; }
```

Scroll **hanya** hidup di wadah yang ditandai eksplisit: `.scroll-area`,
`.workspace__body`, `.ws-side__hint`, `.menu`.

### 7.3 Anti-pergeseran tata letak — tabel pola

| Masalah | Pola yang benar |
|---|---|
| Banner sukses menyisip di aliran | `.sim__done-overlay` — `position: absolute`, tidak menempati ruang |
| Tombol selesai dipakai lalu dibuang | `visibility: hidden` + `disabled`. **`remove()` mengempiskan barisnya** |
| Panggung mengembang-mengempis | `min-height: clamp(200px, 34vh, 320px)` |
| Tombol muncul di tengah alur | `.workstrip-row { min-height: 62px }` — ruangnya dipesan sejak awal |
| Bilah aksi terpotong footer | Baris grid **di luar** area yang menggulir |
| Teks `nowrap` melebarkan grid | `min-width: 0` + `text-overflow: ellipsis` |
| Wadah pesan berubah tinggi | `.reserved-slot` bertinggi tetap (`Simulation.reserveSlot()`) |
| Nama yang berubah menggeser gambar | **Lebar TETAP** untuk label yang berganti (`u` → `proj_v u` menggeser 15px terukur) |

> ⚠️ **Memesan ruang berarti memesan ruang yang BENAR-BENAR akan dipakai.**
> Kotak **kosong** yang di-`visibility:hidden` hanya memesan ruang seukuran
> isinya — dan isi kosong tingginya **nol**. **Isi kotaknya lebih dulu, baru
> sembunyikan.**

### 7.4 Ukuran, sentuhan, orientasi

- **Ukuran isi panggung terikat viewport lewat `clamp()`**, dengan **44px**
  sebagai batas bawah sentuh. Piksel tetap membuat objek menyusut secara optis
  di monitor lebar.
- **Setiap wadah yang bisa meluap butuh `overflow-y: auto` DAN `min-height: 0`.**
  Tanpa yang kedua, flex item menolak menyusut dan gulirnya tidak pernah aktif.
- **Aplikasi hanya berjalan di lanskap.** Potret memunculkan `.rotate-lock`
  (z-index 9999, latar diburamkan) dan **menyembunyikan `#app` BESERTA
  `.fs-btn`** — tombol layar penuh hidup di luar `#app`, jadi ia harus disebut
  terpisah atau tetap mengambang di atas pesan.

```css
@media (orientation: portrait) {
  .rotate-lock { display: grid; }
  #app, .fs-btn { visibility: hidden; pointer-events: none; }
  .backdrop { filter: blur(6px); }
}
```

### 7.5 Seret & ketuk

> **Ketukan adalah jalur WAJIB; seret hanya pelengkap.**

Setiap interaksi harus bisa diselesaikan dengan: ketuk sumber → tujuan yang sah
**menyala** → ketuk tujuan. Kalau sebuah engine juga menyediakan seret, keduanya
**wajib memanggil callback yang sama**.

> **Menghapus seret sama sekali TIDAK melanggar kontrak ini** — yang dilarang
> adalah seret tanpa alternatif ketuk. Interaksi presisi tinggi (memilih ujung
> vektor, memilih komponen, membalik tanda) sebaiknya **ketuk saja**. Seret
> hanya untuk perpindahan yang targetnya besar.

`makeDraggable()` mendaftarkan **dua** mekanik sekaligus: seret pointer **dan**
klik-untuk-pilih. `registerDropZone()` menerima keduanya.
`document.body.classList.add('is-tap-armed')` menyalakan semua tujuan yang sah.
`suppressClickUntil` (320 ms) mencegah klik-ekor sesudah seret.

**Satu interaksi aktif pada satu waktu.** Saat sebuah pasangan sedang
dikerjakan, sumber lain dikunci, dan **harus selalu ada jalan membatalkannya**
(ketuk ulang). Tujuan yang salah **tetap boleh diketuk** supaya penolakannya
bisa dijelaskan.

### 7.6 Anti klik-beruntun — sistemik, bukan tambal per kasus

> **Setiap evaluasi yang benar WAJIB mengambil `claim()` lebih dulu, lalu
> memanggil `lockChoices()`.**

`setBusy()` tidak cukup (§4.8). **Dan: kalau satu modul diperbaiki, audit semua
modul sejenis** — bug ini selalu muncul berkelompok.

### 7.7 Struktur CSS: `phase*.css` vs Cascade Layers

**Apa yang diwarisi:** "Ruang Matriks" memakai 20 berkas CSS dengan urutan muat
mengikat, di mana perbaikan visual baru **selalu** masuk ke berkas fase
tertinggi (`phase18.css` = paling berkuasa).

| | `phase*.css` (warisan) | `@layer` (disarankan) |
|---|---|---|
| **Kelebihan** | Riwayat keputusan terbaca dari nomornya. Tidak pernah ada konflik kemenangan: yang belakangan menang | Urutan **dideklarasikan sekali** di atas, bukan disimpulkan dari urutan `<link>`. Perbaikan masuk ke lapisan yang **benar secara semantik** |
| **Kekurangan** | Setelah 18 fase, mencari "di mana `.ws-stage` didefinisikan" butuh `grep` seluruh direktori. Satu komponen tersebar di 6 berkas | Butuh Chrome 99+ / Safari 15.4+ / Firefox 97+ (Maret 2022). Tablet sekolah yang sangat tua bisa **mengabaikan seluruh blok `@layer`** |

**Rekomendasi untuk proyek Vektor: pakai `@layer`, dengan disiplin berbasis komponen.**

```css
/* Satu-satunya baris yang menentukan urutan. Ada di tokens.css, paling atas. */
@layer reset, tokens, layout, components, domain, utilities, overrides;
```

```css
/* components.css */
@layer components {
  .btn { … }
  .option { … }
}

/* plane.css — domain */
@layer domain {
  .plane__axis { … }
  .plane__arrow { … }
}

/* Perbaikan darurat yang benar-benar harus menang: */
@layer overrides {
  .plane__arrow--locked { pointer-events: none; }
}
```

**Aturan yang menyertainya — ini yang sebenarnya menyelamatkan proyek:**

1. **Satu komponen = satu berkas.** `.plane__*` hanya boleh ada di `plane.css`.
   Diuji dengan `grep`, bukan dengan niat baik.
2. **`overrides` harus tetap kosong atau nyaris kosong.** Kalau ia tumbuh,
   itu tanda lapisan di bawahnya salah rancang.
3. **Sebelum memutuskan, UKUR dukungan peramban di perangkat kelas yang
   sebenarnya.** Kalau ada tablet yang tidak mendukung `@layer`, jatuh kembali
   ke urutan `<link>` eksplisit — **dan tetap pertahankan aturan satu-komponen-
   satu-berkas.** Nomor fase adalah gejala masalah, bukan solusinya.

### 7.8 Token warna — ganti nilainya, PERTAHANKAN namanya

```css
:root {
  /* PALET SUMBER — angka inilah acuan desain */
  --ink: #0A1B45;  --royal: #1D4ED8;  --cyan: #06B6D4;
  --yellow: #FFC800;  --magenta: #EC0F8C;  --paper: #EFF4FF;

  /* PEMETAAN KE NAMA SEMANTIK — inilah yang dipakai komponen */
  --bg-canvas: var(--paper);
  --bg-surface: var(--white);
  --ink-900: var(--ink);
  --brand-primary: var(--royal);
  --accent-amber: #B98600;
  --success: #0E9F6E;
}
```

> Tema "TRANSFORMASI" mengganti tema gelap sebelumnya **tanpa menulis ulang
> satu berkas komponen pun**, karena nama token lama dipertahankan dan hanya
> nilainya yang dipetakan ulang. Wariskan disiplin itu: **kalau menambah warna,
> tambahkan di palet sumber lalu petakan — jangan pernah menulis hex langsung
> di berkas komponen.**

### 7.9 Aturan tampilan lain yang wajib diwarisi

| Aturan | Alasan |
|---|---|
| **Tidak ada tautan teks telanjang.** Setiap yang bisa diklik punya kotak, batas, padding, status hover | Sasaran sentuh di ponsel |
| **Konten selalu di kartu opak**, tidak pernah langsung di atas latar berpola | Keterbacaan |
| **Bahasa warna, bukan jargon.** Tulis "yang **berwarna biru**", jangan "yang disorot" | Siswa tidak tahu apa itu "disorot" |
| **Denyut mengubah LATAR, bukan hanya tepi** — dan teksnya tetap ≥4,5:1 pada latar terpekat, **diukur bukan dikira** | Kontras |
| **Kecepatan animasi konstan.** Satu-satunya penyimpangan: `prefers-reduced-motion` | Pengatur kecepatan dicabut permanen |
| **Opsi salah dikunci permanen** | Supaya siswa mengerucut, bukan menebak berulang |
| **Jawaban benar mengunci pilihannya seketika** | Tanpa itu, klik beruntun menjadwalkan beberapa perpindahan sekaligus |
| **Panel yang baru muncul harus dibawa ke pandangan** (`scrollIntoView`) | Alur bertahap yang tumbuh ke bawah bisa menaruh pertanyaan di luar layar |
| **State slide tidak bocor** — slide yang selesai tetap terlihat selesai saat dikunjungi ulang | `solvedSlides` di `Simulation` |
| **Footer berbunyi persis**, memakai simbol `©` bukan kata | Kontrak |

---

## 8. STRATEGI PENGUJIAN

### 8.1 Dua suite, dua tujuan

| Suite | Perkakas | Isi | Durasi | Target |
|---|---|---|---|---|
| `tests/engine.test.mjs` | **Node murni**, tanpa dependensi | Matematika vektor murni | **Instan** | 100% fungsi `vector.js` & `surd.js` |
| `tests/smoke.py` | **Playwright (Python)** | Perilaku, geometri, kontrak | ±12 menit | Setiap kontrak §7 + setiap bug UI yang pernah terjadi |

```bash
node tests/engine.test.mjs        # instan, jalankan setiap kali domain berubah
python -m http.server 5173        # WAJIB hidup lebih dulu
python tests/smoke.py             # ±12 menit — jalankan di latar belakang
```

> ⚠️ **Jangan pernah mengedit berkas sumber sementara suite berjalan.** Hasil
> versi campuran tidak membuktikan apa pun.

### 8.2 Doktrin: **UKUR, jangan baca kode**

Ini pelajaran termahal dari 18 fase. Bug berikut **lolos dari pembacaan kode
berkali-kali** dan hanya ketahuan setelah geometri diukur di peramban:

| Bug | Yang terlihat dari kode | Yang terukur |
|---|---|---|
| `.materi` melaporkan lebar **0** saat dikosongkan | "Kodenya benar" | Seluruh materi menumpuk di satu kolom padahal tiga kolom muat |
| `swapArc()` menukar nilai **dua kali** | "Tombol tukar sudah dipanggil" | `dataset.value` kembali ke posisi semula — tombolnya tampak mati total |
| Kolom grid `#app` melebar **415px** di viewport 375px | `scrollWidth` tetap 375 → uji "tanpa scroll" **LOLOS** | Isi terpotong diam-diam, tanpa scrollbar |
| Bilah aksi terpotong footer | Markup-nya benar | `getBoundingClientRect().bottom` melewati tepi footer |
| Kisi papan coret dilukis ke bitmap | Papan tampak normal | Seluruh uji tinta `getImageData` kehilangan makna **tanpa pernah gagal** |

> **Corollary: curigai pengujianmu sendiri, bukan hanya kodenya.** Uji yang
> lolos karena mengukur hal yang salah lebih berbahaya daripada tidak ada uji.

### 8.3 Teknik pengukuran → apa yang dibuktikan

| Teknik | Membuktikan | Contoh |
|---|---|---|
| `getBoundingClientRect()` | Geometri sungguhan | Rasio kolom Sidebar/Stage di **tiga** viewport (`28%` di CSS ≠ 28% di layar: `minmax()`, gap, padding ikut bicara) |
| `getComputedStyle()` | Nilai akhir setelah kaskade | `overflow`, `pointer-events`, `visibility`, warna latar denyut |
| `elementFromPoint(x, y)` | **Siapa yang benar-benar menerima klik** | Panah SVG tidak tertutup lapisan kisi |
| `getAnimations()` | Animasi benar-benar berjalan / berhenti | Denyut mati setelah `lockChoices()` |
| `canvas.getContext('2d').getImageData()` | Jumlah piksel bertinta | Goresan papan coret bertambah/berkurang |
| `document.documentElement.scrollWidth` | Luapan horizontal | **Tidak cukup sendirian** — pasangkan dengan lebar kolom grid |
| `page.reload()` | Cache `progressStore` benar-benar dibaca ulang | Navigasi hash **tidak** memuat ulang cache |
| Hitung node (`querySelectorAll().length`) | Pembongkaran tuntas | Tidak ada slider/panggung/drop-zone **kembar** |
| `window.__nativeDialogCalls` | `alert`/`confirm`/`prompt` tidak dipanggil | Ditanam lewat `add_init_script` |

### 8.4 Harness minimum — salin apa adanya

```python
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 860})

    # 1. Semai identitas: penjaga rute akan melempar SETIAP uji ke #/login
    #    kalau identitasnya tidak ada.
    page.add_init_script("""
        try {
          localStorage.setItem('vektorLab.identity.v1',
            JSON.stringify({ nama: 'Uji Otomatis', sekolah: 'SMAS YPVDP Bontang' }));
        } catch (e) {}
    """)

    # 2. Blokir dialog native: kalau terpanggil, uji HARUS gagal.
    page.add_init_script("""
        window.__nativeDialogCalls = [];
        ['alert','confirm','prompt'].forEach(function (fn) {
          window[fn] = function () {
            window.__nativeDialogCalls.push(fn);
            return fn === 'confirm' ? false : null;
          };
        });
    """)

    # 3. Setiap error konsol = kegagalan.
    page.on("console",   lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))

    run(page, errors)
```

```python
def open_fresh(page, route):
    """Buka rute dari kondisi bersih: tanpa ingatan POSISI."""
    page.evaluate("() => { try { sessionStorage.clear(); } catch (e) {} }")
    page.goto(f"{BASE}/{route}")
    page.reload()                    # navigasi hash saja TIDAK memuat ulang cache
    page.wait_for_timeout(800)
```

**Permukaan pengujian di aplikasi** — sediakan sejak Fase 1:

```js
window.__vektorLab = {
  state, router,
  navigate: (p) => router.navigate(p),
  getOverallProgress: () => getOverallProgress(state.manifest),
  getIdentity, setIdentity,
};
```

Dan penanda kesiapan yang bisa ditunggu: `document.documentElement.dataset.appReady = 'true'`,
dipasang di blok **`finally`** supaya galat jaringan tidak meninggalkan siswa
(atau pengujian) menatap animasi selamanya.

```python
page.wait_for_selector("[data-app-ready='true']", timeout=8000)
```

### 8.5 Bagian uji khas domain Vektor

Ini yang **tidak ada padanannya** di proyek Matriks — tulis sejak engine
pertama:

| Yang diuji | Cara mengukurnya |
|---|---|
| **Skala sumbu benar-benar sama** | Ukur jarak piksel 1 satuan di sumbu $x$ dan di sumbu $y$ lewat `toScreen()` dari dua titik; selisih harus ≤1px. **Ini uji kebenaran matematis, bukan estetika** |
| **Sumbu Y terbalik dengan benar** | Titik $(0, 3)$ harus punya `screenY` **lebih kecil** daripada titik $(0, -3)$ |
| **Panah bisa diketuk** | `elementFromPoint()` di titik tengah panah mengembalikan node panah, bukan `.plane__grid` |
| **Kepala panah tidak ikut membesar saat disorot** | `getBoundingClientRect()` `<marker>` sebelum dan sesudah `highlight()` — harus identik |
| **Sudut yang digambar = sudut yang dihitung** | Ambil atribut busur / `transform`, bandingkan dengan `angleBetween()` ± 0,5° |
| **Tidak ada angka yang bocor sebelum siswa mengisinya** | `textContent` panggung **tidak boleh** memuat hasil akhir sebelum `onCommit` pertama. Uji regresi untuk aksioma §1.1 — **ini uji terpenting di seluruh suite** |
| **Bentuk akar eksak, bukan desimal** | `textContent` mengandung `√` / node `.katex` dengan `\sqrt`, dan **tidak** mengandung regex `\d\.\d{4,}` |
| **Vektor kolom tidak menyentuh garis kurung** | Jarak `getBoundingClientRect()` isian ke `.matrix__bracket::before` > 0 di tiga viewport |
| **Kanvas dibongkar tuntas** | Setelah pindah layar, `document.querySelectorAll('svg.plane').length === 0` **dan** tidak ada `ResizeObserver` yang masih menembak (uji dengan mengubah ukuran lalu memeriksa tidak ada error konsol) |

### 8.6 Aturan proses

> **Setiap perbaikan bug UI mendapat pengujian regresi.**

Suite "Ruang Matriks" tumbuh 134 → **632** justru karena aturan ini
(300 → … → 513 → 569 → 611 → 632 di Fase 11–18.5). Itu bukan pertumbuhan yang
tidak terkendali — itu **arsip kelembagaan dari setiap kesalahan yang pernah
dibayar**, dalam bentuk yang tidak bisa dilupakan.

---

## 9. PETA ADAPTASI MATRIKS → VEKTOR

### 9.1 Berkas demi berkas

| Berkas asal | Nasib | Berkas tujuan |
|---|---|---|
| `js/router.js` | 🟩 salin | `js/core/router.js` |
| `js/state/progressStore.js` | 🟨 ganti `STORAGE_KEY` | `js/core/state/progressStore.js` |
| `js/state/sessionState.js` | 🟨 ganti `KEY` | `js/core/state/sessionState.js` |
| `js/ui/toast.js`, `modal.js` | 🟩 salin | `js/core/ui/` |
| `js/ui/icons.js` | 🟨 + ikon domain | `js/core/ui/icons.js` |
| `js/ui/mathpad.js` | 🟨 + mode akar, batas digit | `js/core/ui/mathpad.js` |
| `js/ui/scratchpad.js` | 🟩 salin | `js/core/ui/scratchpad.js` |
| `js/engine/katexRenderer.js` | 🟩 salin | `js/core/render/katexRenderer.js` |
| `js/interactions/dragDrop.js`, `flyToAnimation.js`, `motion.js` | 🟩 salin | `js/core/interactions/` |
| `js/interactions/mergeAnimation.js` | 🟥 tulis ulang | `js/domain/plane/arrowAnimation.js` |
| `js/modules/kuis/*.js` | 🟩 salin | `js/quiz/` |
| `js/modules/belajar/lessonRenderer.js` | 🟨 paginasi & tab tetap | `js/lesson/lessonRenderer.js` |
| `simCore.js` → kelas `Simulation` | 🟩 salin | `js/lesson/simulations/simCore.js` |
| `simCore.js` → `renderMatrix()` & kawan | 🟥 tulis ulang | `renderColumnVector()`, `renderVectorPlane()` |
| `js/engine/matrix.js` | 🟥 tulis ulang | `js/domain/vector.js` |
| `js/engine/rational.js` | 🟥 **ganti konsep** | `js/domain/surd.js` (§5.2) |
| `js/engine/validator.js` | 🟥 tulis ulang (pola sama) | `js/domain/validator.js` |
| `js/modules/.../sim*.js` | 🟥 seluruhnya | `simBasics/Operations/Products/Modeling.js` |
| `data/**`, `content/**` | 🟥 seluruhnya | idem |
| `css/base.css` | 🟨 ganti nilai token | `css/tokens.css` |
| `css/matrix.css` | 🟨 **sebagian dipakai ulang**: `.matrix__bracket`, `.matrix__grid`, `.cell` dipakai untuk **vektor kolom** | `css/vector.css` |
| `css/phase15.css` (papan coret) | 🟩 salin | `css/scratchpad.css` |
| `css/phase10.css` (Sidebar & Stage) | 🟩 salin | `css/workspace.css` |
| `css/phase18.css` (CBT) | 🟩 salin | `css/quiz.css` |
| `tests/smoke.py` harness | 🟨 salin, ganti bagian uji | `tests/smoke.py` |
| `tests/archive_soal.py` | 🟨 salin, sesuaikan tipe soal | `tests/archive_soal.py` |

> **Temuan berharga:** notasi vektor kolom $\begin{pmatrix}3\\-1\\2\end{pmatrix}$
> memakai **kurung yang sama persis** dengan matriks. Seluruh pekerjaan
> `matrix.css` untuk `.matrix__bracket` (kurung `::before`/`::after` selebar 9px,
> padding isian yang tidak pernah menyentuh kurung, grid dengan `gap`) **berlaku
> langsung** untuk vektor kolom $n \times 1$. Jangan menulis ulang itu.

### 9.2 Engine demi engine — analogi mekanik

Kolom "Mekanik yang diwarisi" adalah bagian terpenting: **polanya sudah lulus QA
632 pengujian; yang berubah hanya matematikanya.**

| Engine Matriks | Mekanik yang diwarisi | Engine Vektor | Apa yang berubah |
|---|---|---|---|
| `identify_element` | Ketuk sel → sebutkan alamatnya | `vector_anatomy` | Ketuk bagian panah → pangkal / ujung / arah / besar |
| `ordo_builder` | Bangun bentuk dari dua angka | `component_builder` | Bangun vektor dari komponen $x$, $y$, $z$ lewat papan angka |
| `label_matrix_types` | Kartu klasifikasi, satu label per kartu | `vector_classify` | Vektor nol / satuan / posisi / sejajar / tegak lurus |
| `transpose_morph` | Animasi morf baris ↔ kolom | `component_morph` | Morf notasi tupel $(3,-1)$ ↔ kolom ↔ bentuk $3\hat{i}-\hat{j}$ |
| `equality_link` | Ketuk kiri → pasangan seletak menyala → terbang menyatu jadi PERSAMAAN; nilainya diisi siswa | `equality_link` | **Nyaris identik.** $u = v \Rightarrow u_1 = v_1,\ u_2 = v_2$ |
| `elementwise_op` (`PairwiseTapSim`) | Ketuk elemen → pasangan menyala, sel lain diredupkan → sel hasil menampilkan `(6+1)` → tombol hitung baru muncul | `component_add` | Sama persis, komponen menggantikan elemen |
| `scalar_sweep` | Chip skalar dibawa ke **tiap** elemen satu per satu | `scalar_sweep` | **Salin polanya.** Satu drop-zone untuk seluruh vektor akan mengubahnya jadi satu sapuan — persis yang ingin dihindari |
| `combo_op` (hibrida) | Membongkar mekanik tahap sebelumnya **tuntas** sebelum memasang yang berikutnya | `combo_vector_op` | $2u - 3v$ |
| `ordo_check` | Periksa syarat operasi **sebelum** menghitung | `dim_check` | Dimensi harus sama untuk dot; harus R³ untuk cross |
| **`matrix_multiply`** | **Pasangan demi pasangan**; tombol hitung baru muncul setelah seluruh pasangan lengkap | **`dot_builder`** | **Analogi terkuat di seluruh peta.** $u\cdot v$ **adalah** satu sel hasil perkalian matriks $1{\times}n$ dengan $n{\times}1$ |
| `property_cards` | Kartu sifat, benar/salah dengan penjelasan | `product_property_cards` | Komutatif dot, anti-komutatif cross, distributif |
| `det2x2` | Ketuk diagonal urutan **bebas**; garis coret digambar **setelah** pilihannya tepat (konfirmasi, bukan panduan) | `cross_2d` | $u_xv_y - u_yv_x$ — struktur determinannya identik |
| `det3x3_sarrus` | Kolom salinan + tiga diagonal turun, tiga naik | **`cross_sarrus`** | Cross product **memang** determinan $3\times3$ dengan baris $\hat{i},\hat{j},\hat{k}$. Mekaniknya berlaku hampir tanpa perubahan |
| `singular_check` | Kasus batas yang menjelaskan **kenapa** operasinya buntu | `zero_vector_check` | Vektor nol tidak punya arah, tidak punya vektor satuan |
| `property_calculator` | Sifat dipakai sebagai **jalan pintas yang sah** | `norm_property` | $‖ku‖ = \|k\|\,‖u‖$ tanpa menghitung ulang akarnya |
| `inverse2x2` (3 tahap) | Tahap 1 menghitung sesuatu → nilainya **disimpan dan dipakai tahap 3** | **`angle_solver`** | Tahap 1: $u\cdot v$. Tahap 2: $‖u‖$, $‖v‖$. Tahap 3: $\cos\theta$, lalu $\theta$ |
| `inverse3x3` (4 langkah + pengisian otomatis bertanda) | Setelah siswa **membuktikan metodenya** pada 3 sel, 6 sisanya boleh diisi otomatis — **dengan penanda `auto` dan kalimat terus terang** | `projection_flow` | Terapkan pengecualian yang sama **hanya** kalau alurnya benar-benar panjang, dan **wajib** dengan kedua penandanya |
| `equation_solver` | Persamaan dua langkah: susun bentuknya, baru selesaikan | `vector_equation` | $a\,u + b\,v = w$ — cari $a$ dan $b$ |
| `data_translation` | Soal cerita → tabel → matriks | `force_table` | Tabel gaya → komponen vektor |
| `spldv_utbk` | SPLDV gaya UTBK yang diselesaikan dengan matriks | `navigation_model` | Kecepatan + arus → resultan |
| **`sniper_extraction`** | Ketuk sel yang memuat $k$ → **seluruh panggung diredupkan kecuali jalur yang benar-benar dipakai** → tarik keluar jadi persamaan linear biasa | **`sniper_component`** | **Analogi terkuat kedua.** "Diketahui $u\cdot v = 5$ dan $u = (2, k, 1)$, tentukan $k$" — jangan hitung seluruh dot product, cukup satu suku yang memuat $k$ |
| `multi_condition` | Beberapa pernyataan, dinilai **per pernyataan** | `multi_condition` | **Salin apa adanya**; hanya pernyataannya yang berganti |
| `domino_translation` | Rantai transformasi berurutan | `chain_displacement` | Perpindahan berantai $AB + BC + CD = AD$ |

### 9.3 Konsep matematis yang berpindah

| Matriks | Vektor | Catatan pedagogis |
|---|---|---|
| Ordo $m \times n$ | Dimensi (R² / R³) | Keduanya "syarat kelayakan operasi" |
| Elemen $a_{ij}$ | Komponen $u_1, u_2, u_3$ | Alamat → indeks |
| Kesamaan matriks | Kesamaan vektor | **Mekaniknya identik** |
| Penjumlahan elemen seletak | Penjumlahan komponen seletak | **Mekaniknya identik** |
| Perkalian skalar | Perkalian skalar | **Mekaniknya identik** |
| Perkalian baris × kolom | **Perkalian titik** | Dot adalah kasus khusus perkalian matriks |
| Determinan $3\times3$ (Sarrus) | **Perkalian silang** | Cross **adalah** determinan dengan baris $\hat{i},\hat{j},\hat{k}$ |
| Determinan $2\times2$ | Luas jajargenjang $\|u_xv_y - u_yv_x\|$ | Tafsiran geometris yang langsung terpakai |
| Singular / $\det = 0$ | **Sejajar / kolinear** | $\det = 0 \iff$ vektornya sejajar |
| Invers | *(tidak ada padanan)* | Jangan dipaksakan |
| Persamaan matriks $AX = B$ | Kombinasi linear $a\,u + b\,v = w$ | Struktur penyelesaiannya sama |
| Pecahan eksak (`rational.js`) | **Akar eksak (`surd.js`)** | Masalah yang sama, bentuk berbeda — lihat §5.2 |

---

## 10. DAFTAR JEBAKAN MAUT

### 10.1 Warisan — sudah dibayar mahal, jangan dibeli lagi

| # | Jebakan | Gejalanya | Penangkalnya |
|---|---|---|---|
| 1 | **`getCoalescedEvents()` bisa mengembalikan array KOSONG** (peristiwa sintetis, sebagian peramban, driver stylus) | Goresan tidak pernah bertambah titik; yang tergambar hanya satu noktah | `const raw = merged && merged.length ? merged : [event];` |
| 2 | **Menggambar hanya ruas TERAKHIR** | Garis putus-putus **hanya** saat disapu cepat | Penanda `s.drawn` — gambar semua ruas yang belum tergambar |
| 3 | **`visibility:hidden` pada kotak KOSONG tidak memesan ruang** | Layar tetap melompat padahal ruang "sudah dipesan" | Isi kotaknya lebih dulu, **baru** sembunyikan |
| 4 | **`classList.add('')` melempar `SyntaxError`** | Seluruh perulangan penilaian berhenti di tengah jalan | Periksa dulu kelas yang dihitung lewat ekspresi kondisional |
| 5 | **Argumen ketiga `el()` masuk sebagai `innerHTML` MENTAH** | `**tebal**` tampil beserta bintangnya | `el('p', 'cls', renderMixed(teks))` |
| 6 | **Kisi kanvas dilukis ke bitmap** | Setiap piksel ber-alfa penuh; seluruh uji tinta `getImageData` **kehilangan makna tanpa pernah gagal** | Kisi **milik CSS** |
| 7 | **`ResizeObserver` & listener `window` SELAMAT dari `innerHTML = ''`** | Memori bocor; galat "menulis ke node yang lenyap" beberapa detik kemudian | `destroy()` yang sungguhan, dipanggil `mountScreen()` |
| 8 | **Timeline GSAP & chip di `document.body` selamat juga** | Animasi terus berjalan di latar, membakar CPU | `killAllMotion()` **sebelum** membongkar DOM |
| 9 | **`setTimeout` tertunda menulis ke DOM yang sudah lenyap** | Galat acak beberapa detik setelah pindah layar | `this.later()` / `this.wait()` |
| 10 | **State tingkat-MODUL (`zones` di `dragDrop.js`) tidak ikut mati** | Drop-zone kasus lama menangkap drop dari kasus baru | `resetDragSystem()` |
| 11 | **`transform` hanya SATU properti** — nilai dari `@keyframes` **menggantikan** `translateX(-50%)`, bukan menambahinya | Elemen terpusat melompat ke kiri saat dianimasikan | `left:0; right:0; margin-inline:auto` |
| 12 | **`left: 50%` saja memangkas lebar TERSEDIA jadi separuh** | Pembungkusan baris palsu | Idem |
| 13 | **`margin-inline: auto` membatalkan peregangan di flex** | `clientWidth` = **0** saat wadah dikosongkan; pengukur kolom menyimpulkan hanya muat satu kolom | Nolkan `margin-inline` di lanskap; **ukur lebar SEBELUM mengosongkan wadah** |
| 14 | **`#app` tanpa `grid-template-columns` eksplisit** mengikuti `min-content` anak terlebar | Di viewport 375px header jadi 415px, isi terpotong **tanpa scrollbar**; `scrollWidth` tetap 375 sehingga uji **LOLOS** | `grid-template-columns: minmax(0,1fr)` + `#app > * { min-width: 0 }` |
| 15 | **`overflow-y: auto` tanpa `min-height: 0`** | Flex item menolak menyusut; gulirnya **tidak pernah aktif** | Selalu berpasangan |
| 16 | **`getBoundingClientRect()` pada `.katex-mathml`** melaporkan lebar besar walau diklip 1px | Uji geometri gagal tanpa sebab | Itu lapisan MathML untuk pembaca layar. **Bukan bug; jangan dikejar** |
| 17 | **Elemen `display:none` melaporkan rect NOL** | `footer.getBoundingClientRect().top === 0` dipakai sebagai "tepi bawah layar" | Periksa `height > 0` sebelum memakainya sebagai patokan |
| 18 | **`[data-theme="light"]` (spesifisitas 0,2,0) menang atas kelas tunggal (0,1,0)** | Aturan baru yang ditulis belakangan kalah | Naikkan spesifisitas: `[data-theme] .btn--amber` |
| 19 | **Regex untuk membedah CSS** | Satu regex pernah menelan blok tetangga, menyisakan daftar selektor yang menyambung ke aturan berikutnya — **SEMUA kartu jadi `position: absolute`**, jumlah kurung tetap seimbang, halaman masih "terlihat benar" | Potong blok dengan penanda awal-akhir eksplisit, lalu `grep -n ",$" css/*.css` untuk selektor berkoma menggantung |
| 20 | **Membaca `el.textContent` pada elemen yang punya anak** | Sel bernilai 10 terbaca **"10a11"** (label alamat adalah `<span>` anak) | `dataset.value` satu-satunya sumber yang bersih |
| 21 | **Animasi yang menulis `textContent` MENGHAPUS anak elemen** | Label alamat tersapu; sel terbaca "4a22" | Tulis ulang dari `dataset.value` **sesudah** animasi |
| 22 | **Menukar nilai dua kali** (`swapArc()` sudah menukar `textContent` DAN `dataset.value`) | Tombol tukar tampak **tidak berfungsi sama sekali** | Lolos dari pembacaan kode; ketahuan setelah `dataset.value` **diukur** sesudah animasi |
| 23 | **Label berlebar berubah menggeser gambar** | `A` → `adj(A)` menggeser matriksnya **15px terukur** | Lebar TETAP untuk label yang berganti |
| 24 | **Navigasi hash saja tidak memuat ulang cache `progressStore`** | Uji lolos/gagal secara acak | `page.reload()`, bukan sekadar ganti hash |
| 25 | **Kolom kosong di-`display:none`** | Kolom sebelahnya melebar → pengukuran penjejalan jadi salah | Kolom kosong tetap menempati ruangnya; yang disembunyikan hanya garis pemisahnya |
| 26 | **Sisa jawaban salah tertinggal di isian** | Ketukan berikutnya menyambung angka lama: `9` lalu `5` menjadi **`95`** | Kosongkan field saat merender ulang soal |

### 10.2 Baru — khas SVG, geometri, dan domain Vektor

| # | Jebakan | Penangkalnya |
|---|---|---|
| 27 | **Sumbu Y layar terbalik terhadap sumbu Y matematika** | Semua konversi **wajib** lewat `toScreen()` / `toMath()`. Satu minus terlewat = simulasi yang "hampir benar" dan hampir mustahil dilihat dari kode |
| 28 | **Skala $x$ ≠ skala $y$** | `preserveAspectRatio="xMidYMid meet"` + `viewBox` tetap. **Uji dengan mengukur**, bukan dengan melihat: sudut $45°$ yang tampil $38°$ adalah kebohongan matematis |
| 29 | **`getBoundingClientRect()` pada elemen SVG yang DIROTASI mengembalikan kotak pembatas sejajar-sumbu**, bukan geometri aslinya | Untuk panah miring, ukur dari atribut (`x1,y1,x2,y2`) atau `getBBox()` dalam sistem koordinat lokal, lalu konversi sendiri |
| 30 | **`<marker>` tidak mewarisi `currentColor`** di semua peramban | Setel `fill` kepala panah **eksplisit** setiap kali warna garisnya berubah |
| 31 | **`markerUnits` bawaan adalah `strokeWidth`** | Kepala panah ikut membesar saat garis ditebalkan untuk sorotan. Pakai `markerUnits="userSpaceOnUse"` |
| 32 | **Lapisan kisi menangkap pointer** | `elementFromPoint()` mengembalikan garis kisi, siswa tidak pernah berhasil mengetuk panahnya. `pointer-events: none` pada lapisan kisi & sumbu |
| 33 | **`<text>` SVG tidak bisa merender KaTeX, tidak membungkus baris, tidak bisa ditata token CSS** | `<foreignObject>` berisi `renderToString()`, atau `<div>` absolut di atas SVG |
| 34 | **Sudut floating: $90.00000001°$ atau $\cos\theta = 1.0000000002$** | **Jepit** `cosAngle()` ke $[-1, 1]$ **sebelum** `Math.acos()` — di luar rentang itu hasilnya `NaN`. Bandingkan sudut dengan toleransi |
| 35 | **Membandingkan panjang lewat akar** | Jangan. $‖u‖ > ‖v‖ \iff ‖u‖^2 > ‖v‖^2$, dan `normSquared()` bilangan bulat. Nol floating-point, nol toleransi |
| 36 | **Menampilkan $5.385164807$ alih-alih $\sqrt{29}$** | Melanggar kontrak 11 **dan** bukan bentuk lembar jawaban. Lihat §5.2 |
| 37 | **Cross product di R²** | Secara matematis ia menghasilkan vektor berkomponen $z$ saja. Biarkan `vector.js` menghitungnya; biarkan **validator** yang memutuskan apakah boleh ditawarkan ke siswa kelas 11 |
| 38 | **Vektor nol sebagai kasus batas** | Tidak punya arah, tidak punya vektor satuan, sudutnya tak terdefinisi, proyeksi ke arahnya tak terdefinisi. **Setiap** fungsi domain harus menanganinya — dan menanganinya berarti **menjelaskannya**, bukan mengembalikan `NaN` |
| 39 | **Kanvas yang "terlalu pintar"** | Menggambar resultan/sudut/proyeksi sebelum siswa memutuskan aturannya adalah pelanggaran aksioma §1.1 — hanya lebih cantik. Lihat §1.4 |
| 40 | **`viewBox` diukur sebelum panggung punya ukuran** | Sama seperti kanvas papan coret yang tersangkut di 300×150: periksa `getBoundingClientRect()` **dan** ukuran buffer **secara terpisah**, dan abaikan pengukuran nol |

### 10.3 Jebakan lingkungan kerja (Windows 11 + PowerShell + Git Bash)

| Jebakan | Penanganan |
|---|---|
| Heredoc bash + kutipan bersarang sering gagal | Tulis skrip patch Python lewat tool Write, jalankan, lalu hapus |
| Escape `\n` tercampur antara bash → Python → berkas | **Jangan** patch lewat `python -c "..."` berkutip ganda. Pakai berkas skrip tertulis |
| Konsol cp1252 jatuh pada `→`, `×`, `√` | `sys.stdout.reconfigure(encoding="utf-8", errors="replace")` di **awal** setiap skrip Python |
| Python menulis LaTeX tanpa raw string | `"\times"` menjadi TAB + `imes`. **Selalu `r"..."`** |
| Server statis kadang mati di tengah sesi | Nyalakan ulang **sebelum** `smoke.py` |
| `smoke.py` memakan ±12 menit | Jalankan di latar belakang; **jangan dianggap menggantung** |

### 10.4 Jebakan proses & git

| Aturan | Alasan |
|---|---|
| 🚫 **JANGAN PERNAH `git push` tanpa permintaan eksplisit pengguna di sesi yang sedang berjalan** | Siswa memakai versi yang ada di remote. Izin push di sesi atau fase **sebelumnya tidak berlaku** untuk sesi berikutnya |
| 🚫 **Jangan menambahkan trailer `Co-Authored-By`, `Generated with`, atau tanda tangan AI apa pun** | Riwayat repo ini pernah ditulis ulang sekali demi ini. **Pertahankan** |
| **Jangan memercayai angka "N commit di depan" dari dokumen** | Ukur ulang: `git rev-list --left-right --count origin/main...main` |
| **Sub-topik yang isinya berganti total mendapat ID BARU** | Mempertahankan ID lama menandai siswa sudah menyelesaikan sesuatu yang tidak pernah ia kerjakan |
| **Arsip soal DIBANGKITKAN dari JSON, tidak pernah ditulis tangan** | Arsip cetak yang disunting manual akan menyimpang dari soal yang dilihat siswa — dan **arsip yang menyimpang lebih berbahaya daripada tidak ada arsip** |
| **Komentar kode dalam Bahasa Indonesia, menjelaskan *kenapa*, bukan *apa*** | Sebagian besar nilai dokumen ini berasal dari komentar-komentar itu |

---

## LAMPIRAN A — URUTAN FASE YANG DISARANKAN

Diturunkan dari 18 fase "Ruang Matriks", disusun ulang agar kesalahan urutannya
tidak diulang. **Perubahan terpenting: papan coret, mesin ujian, dan Sidebar &
Stage dinaikkan jauh ke depan** — ketiganya diwarisi matang, dan membangunnya
belakangan (seperti yang terjadi di Matriks, Fase 10/15/18) berarti membongkar
ulang engine yang sudah jadi.

| Fase | Isi | Bukti selesai |
|---|---|---|
| **0** | Salin `js/core/` + `js/quiz/` + CSS 🟩. Aplikasi kosong berjalan: login → menu → 404 | `smoke.py` bagian 1 (rute) hijau |
| **1** | Vendor lokal KaTeX/GSAP/font (§2.4). `tests/validate_data.py` | Aplikasi tampil benar dengan jaringan **dimatikan** |
| **2** | `domain/vector.js` + `domain/surd.js` + `domain/validator.js` | `engine.test.mjs` ≥ 30 pengujian hijau |
| **3** | **Sidebar & Stage sejak awal.** `lessonRenderer.js` + manifest + satu bab dummy | Rasio kolom terukur benar di **tiga** viewport |
| **4** | `vectorPlane.js` + `arrow.js` + `plane.css` | Uji skala sumbu, sumbu-Y, `elementFromPoint` hijau |
| **5** | Bab 1 — 6 sub-topik, engine + materi + kuis | Semua engine mount tanpa galat konsol |
| **6** | **Papan coret dipasang sekarang**, bukan nanti | Uji tinta `getImageData` + `destroy()` hijau |
| **7** | Bab 2 — operasi vektor (7 sub-topik) | idem |
| **8** | Bab 3 — perkalian vektor (6 sub-topik) | idem |
| **9** | Bab 4 — pemodelan TKA (4 sub-topik) | idem |
| **10** | **Mesin ujian CBT** + bank TKA + arsip ter-generate | Uji umpan-balik-tertunda + riwayat percobaan |
| **11** | Layar muat, identitas, "Ganti Akun", penjaga rute | Uji deep-link yang diketik manual |
| **12** | Audit sistemik: klik-spam, pembongkaran, layout shift, kontras | Audit **seluruh** engine sejenis, bukan yang dilaporkan saja |
| **13** | QA kunci jawaban seluruh bank soal — **diverifikasi matematis** | Setiap kunci dihitung ulang tangan atau lewat `vector.js` |
| **14** | Poles akhir & UAT | `smoke.py` + `engine.test.mjs` hijau seluruhnya |

---

## LAMPIRAN B — DEFINITION OF DONE PER SUB-TOPIK

Sebuah sub-topik **belum selesai** sebelum keempat belas butir ini terpenuhi.

**Konten**
- [ ] ID terdaftar di `subtopicOrder` **dan** ada bloknya di `chapters/*.json`
- [ ] `materi[]` lengkap: minimal satu `def`, satu `tip` atau `warn`
- [ ] `content/<bab>.md` sinkron dengan JSON-nya

**Simulasi**
- [ ] `simulation.engine` **terdaftar** di `SIMULATION_REGISTRY`
- [ ] Siswa **menghitung sendiri** setiap angka akhir (tes tiga pertanyaan §1.3)
- [ ] Setiap penolakan punya kalimat `toasts` yang menjelaskan **kenapa**
- [ ] Setiap drag punya padanan tap-tap — **atau** tidak ada drag sama sekali
- [ ] Setiap evaluasi memanggil `claim()` **lalu** `lockChoices()`
- [ ] Petunjuk lewat `addHint()`, panggung hanya berisi kanvas
- [ ] `destroy()` membongkar sub-engine, observer, dan listener `window`
- [ ] Posisi siswa dipulihkan (`useSteps` / `useStepsSilent` + `saveState`)

**Kuis**
- [ ] Setiap soal punya `after`, `explanation`, `toastWrong`
- [ ] Kunci jawaban **diverifikasi matematis**, bukan disalin dari niat penulis

**Pengujian**
- [ ] Bagian uji baru di `smoke.py` yang **mengukur**, bukan membaca kode
- [ ] Nol galat konsol saat sub-topik dibuka, dikerjakan, dan ditinggalkan

---

## LAMPIRAN C — PERINTAH HARIAN

Nyalakan server statis (ES Modules butuh `http://`, bukan `file://`):

```bash
python -m http.server 5173
```

Uji matematika murni — instan, jalankan setiap kali `domain/` berubah:

```bash
node tests/engine.test.mjs
```

Uji perilaku & geometri — ±12 menit, jalankan di latar belakang:

```bash
python tests/smoke.py
```

Bangkitkan arsip soal guru dari `quizzes.json` (jangan pernah menyuntingnya langsung):

```bash
python tests/archive_soal.py
```

Periksa batas Core ↔ Domain masih utuh:

```bash
grep -riE "vektor|vector|dot|cross|proyeksi" js/core js/quiz
```

Periksa selektor CSS berkoma menggantung:

```bash
grep -n ",$" css/*.css
```

Ukur ulang posisi terhadap remote — jangan percaya angka di dokumen:

```bash
git rev-list --left-right --count origin/main...main
```

---

## PENUTUP

Yang paling berharga di "Ruang Matriks" bukan kodenya, melainkan **daftar
kesalahan yang sudah dibayar**: 632 pengujian yang masing-masing lahir dari satu
bug nyata, 80 kontrak yang masing-masing lahir dari satu keputusan yang pernah
salah, dan satu aksioma yang menyaring semuanya.

Proyek "Vektor Kelas 11" akan menulis ulang hampir seluruh matematikanya. Yang
tidak boleh ditulis ulang adalah **pelajaran-pelajarannya**.

> **Aplikasi tidak pernah menghitung untuk siswa.**
> Nilai setiap keputusan dari pertanyaan itu, dan sisanya akan mengikuti.

---

*Disusun dari basis kode "Ruang Matriks" (Fase 1–18.5) — 56 berkas sumber,
±33.900 baris, 21/21 pengujian engine, 632/632 pengujian Playwright.
Bahasa dokumen: Indonesia. Seluruh contoh kode diambil atau diturunkan langsung
dari berkas sumber yang disebut.*
