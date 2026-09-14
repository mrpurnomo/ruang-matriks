# HANDOFF_SESSION.md

> **Serah-terima antar sesi Claude Code.**
> Dibuat **14 September 2026**, sesaat setelah **Fase 18.5** ditutup.
> Pembaca dokumen ini: **sesi Claude berikutnya**, yang tugasnya **bukan menulis
> kode aplikasi**, melainkan **mengekstrak arsitektur "Ruang Matriks" menjadi
> `EDTECH_BLUEPRINT.md`** untuk proyek baru **"Vektor Kelas 11 (Kurikulum Merdeka)"**.

---

## 0. TL;DR UNTUK SESI BERIKUTNYA

| Pertanyaan | Jawaban singkat |
|---|---|
| Apakah "Ruang Matriks" masih dikerjakan? | **Tidak.** Aplikasi **100% selesai** (Fase 1-18.5), lulus QA, dipakai siswa. |
| Apakah saya boleh mengubah kodenya? | **Tidak.** Repo ini sekarang berstatus **READ-ONLY / sumber referensi**. |
| Lalu apa tugas saya? | Membaca seluruh basis kode, lalu **menulis satu berkas baru: `EDTECH_BLUEPRINT.md`**. |
| Untuk apa blueprint itu? | Kerangka yang bisa **disalin-tempel dan diadaptasi** untuk aplikasi "Vektor Kelas 11". |
| Di mana aturan mainnya yang lengkap? | `HANDOFF.md` — khususnya **§4 Arsitektur**, **§5 Kontrak**, **§6 Anti-Pergeseran Tata Letak**, **§7 Subsistem**, **§1A Git**. |

---

## 1. STATUS PROYEK — "RUANG MATRIKS"

**Selesai seluruhnya. Tidak ada pekerjaan tertunda.**

| Aspek | Keadaan |
|---|---|
| Fase terakhir | **Fase 18.5 — Poles Akhir & Bug Squashing** (lima temuan UAT ditutup) |
| Commit terakhir | `085230c` — `fix: final polish, mathpad autosave, markdown bold fix, and scratchpad in exams` |
| Pengujian engine | `node tests/engine.test.mjs` → **21/21 lolos** |
| Pengujian UI | `python tests/smoke.py` → **632/632 lolos** (116 bagian) |
| QA | Tuntas. Kunci jawaban seluruh bank soal diverifikasi secara matematis |
| Pohon kerja | Bersih (`git status` kosong) |
| Remote | `refs/remotes/origin/main` = `085230c` = `main` lokal → **sinkron, tidak ada commit menggantung** |
| Cakupan kurikulum | 4 bab, 22 sub-topik, alur **Materi → Simulasi → Mini Kuis** per sub-topik |
| Ukuran | ±33.900 baris, 56 berkas sumber (JS/CSS/HTML/JSON/PY) |

> ⚠️ **Catatan kejujuran data.** Sesi sebelumnya mencatat "4 commit di depan
> `origin/main`" karena aturan *jangan pernah push tanpa permintaan eksplisit*.
> Saat dokumen ini dibuat, `origin/main` sudah berada di `085230c` — artinya
> **pengguna sendiri yang melakukan push**, bukan Claude. Sesi berikutnya
> **jangan memercayai angka ini secara buta**; ukur ulang dengan
> `git rev-list --left-right --count origin/main...main`.

### 1.1 Fase-fase yang membentuk aplikasi (untuk konteks blueprint)

| Fase | Sumbangan arsitektural yang layak diwarisi |
|---|---|
| 1-9 | SPA router, layar, tema visual "TRANSFORMASI", engine matriks murni, KaTeX |
| 10 | **Arsitektur "Sidebar & Stage"** (`.ws-side` 25-30% + `.ws-stage` 69-76%) |
| 11 | Bug squashing + doktrin **"setiap perbaikan UI dapat pengujian regresi"** |
| 12 | Interaksi lanjutan; **setiap drag WAJIB punya padanan tap-tap** |
| 13 | **Kunci anti-klik-spam sistemik** (kunci diambil pada klik pertama) |
| 13.5 | Pola **sub-engine** (menanam engine matang di dalam engine lain) |
| 14 | Layar muat + identitas siswa di `localStorage` (lintas-tab) |
| 15 / 15.5 | **Smart Scratchpad** berbasis vektor + penghapus per-goresan + mekanik Peek |
| 16 | Invers & persamaan matriks; penegasan **"aplikasi tidak pernah menghitung untuk siswa"** |
| 17 | Masterclass pemodelan TKA (engine visual: domino, sniper, multi-kondisi) |
| 18 | **Mesin ujian CBT** (umpan balik tertunda) + tata letak 2 kolom + arsip soal |
| 18.5 | Auto-simpan Mathpad, markdown yang benar-benar ter-render, papan coret di ujian |

---

## 2. RINGKASAN TUMPUKAN TEKNOLOGI

**Pure Vanilla. Nol proses build.**

| Lapisan | Pilihan | Catatan penting untuk blueprint |
|---|---|---|
| Bahasa | **HTML5 + CSS3 + JavaScript ES Modules** | Tanpa transpile, tanpa TypeScript |
| Build | **TIDAK ADA** | Tanpa npm, tanpa bundler, tanpa `node_modules`. Berkas dilayani apa adanya |
| Backend | **TIDAK ADA** | Seluruh data statis (JSON) + `localStorage` |
| Cara jalan | `python -m http.server 5173` lalu buka `http://localhost:5173` | Satu-satunya syarat: server statis apa pun (ES Modules butuh `http://`, bukan `file://`) |
| Matematika | **KaTeX 0.16.9** via CDN | Dibungkus `js/engine/katexRenderer.js`, **tidak dipanggil langsung** dari mana-mana |
| Animasi | **GSAP 3.12.5** via CDN | Dipakai selektif; banyak animasi justru CSS murni |
| Ikon | SVG inline, `js/ui/icons.js` | Tanpa font-icon, tanpa berkas gambar |
| Penyimpanan | `localStorage` (progres permanen) + `sessionStorage` (resume sesi soal) | Lihat §4.1 |
| Pengujian | **Playwright (Python)** `tests/smoke.py` + **Node murni** `tests/engine.test.mjs` | 632 + 21 pengujian |

**Mengapa ini layak diwarisi:** performa tinggi (tanpa hidrasi framework),
umur simpan panjang (tidak ada dependensi yang membusuk), dan bisa dipasang di
hosting statis mana pun — termasuk dijalankan dari flash disk di lab sekolah.
Konsekuensinya: **setiap komponen UI ditulis sendiri**, dan karena itulah
komponen-komponen itu berharga untuk dijadikan blueprint.

---

## 3. PETA BASIS KODE (untuk dibaca sesi berikutnya)

```
matriks-lab-interaktif/
├── index.html              198 baris — satu-satunya halaman; URUTAN <link> CSS BERSIFAT MENGIKAT
├── HANDOFF.md            1.900+ baris — SUMBER KEBENARAN arsitektur & kontrak (baca ini lebih dulu)
├── PRD.md                          — spesifikasi produk & kurikulum
├── README.md                       — cara jalan & ringkasan
├── SESSION_PROMPT.md               — prompt pembuka sesi yang dipakai pengguna
│
├── js/
│   ├── app.js                1227  — komposisi layar + pendaftaran rute + kartu dasbor
│   ├── router.js              135  — SPA router berbasis hash (route/guard/navigate/start)
│   ├── state/
│   │   ├── progressStore.js   277  — localStorage: progres, kunci sub-topik, riwayat skor
│   │   └── sessionState.js    122  — sessionStorage: resume sesi soal (lessonKey/quizKey)
│   ├── engine/
│   │   ├── matrix.js          256  — matematika MURNI (tanpa DOM), 30+ fungsi
│   │   ├── rational.js        105  — aritmetika pecahan eksak (menghindari 0.333...)
│   │   ├── validator.js       119  — aturan boleh/tidak + fillTemplate dengan placeholder kurung ganda
│   │   └── katexRenderer.js    99  — renderMixed(): markdown ringan + LaTeX dalam satu teks
│   ├── ui/
│   │   ├── mathpad.js         723  — PAPAN ANGKA KUSTOM (pengganti keyboard OS)
│   │   ├── scratchpad.js      804  — PAPAN CORET VEKTOR (+ penghapus goresan, Peek)
│   │   ├── toast.js           211  — notifikasi (pengganti alert() yang DILARANG)
│   │   ├── modal.js           165  — dialog (pengganti confirm()/prompt() yang DILARANG)
│   │   └── icons.js            80  — registry SVG
│   ├── interactions/
│   │   ├── dragDrop.js        463  — drag pointer-events + padanan tap-tap
│   │   ├── flyToAnimation.js  434  — flyTo/landOn/makeFlyChip/staggerCells
│   │   ├── mergeAnimation.js  510  — merge/fold transpose/animasi gabung
│   │   └── motion.js           69  — hormat prefers-reduced-motion
│   └── modules/
│       ├── belajar/
│       │   ├── lessonRenderer.js  782 — pembaca materi Markdown → layar
│       │   └── simulations/
│       │       ├── index.js       138 — REGISTRY: kunci string → kelas engine
│       │       ├── simCore.js     880 — kelas dasar `Simulation` + 25 helper UI
│       │       ├── simBasics.js   932 — engine bab 1
│       │       ├── simOperations.js 1814 — engine bab 2
│       │       ├── simDetInv.js  1973 — engine bab 3
│       │       └── simModeling.js 1357 — engine bab 4 (pemodelan TKA)
│       └── kuis/
│           ├── quizEngine.js    536 — MASTERY LEARNING (umpan balik langsung)
│           ├── examEngine.js     748 — CBT (umpan balik TERTUNDA)
│           └── quizResult.js     138 — layar hasil
│
├── css/                            — 20 berkas, BERLAPIS, urutan muat mengikat:
│   base → layout → components → matrix → simulations → scrollbars → animations
│   → phase7 → phase8 → ... → phase18 (TERAKHIR = paling berkuasa)
│
├── data/
│   ├── lessons.json                — manifest bab & sub-topik
│   ├── quizzes.json                — seluruh bank soal + bank `tka_2025`
│   └── chapters/*.json             — 4 berkas: konfigurasi simulasi per sub-topik
│
├── content/*.md                    — materi bacaan + QUIZ_ARCHIVE.md & TKA_ARCHIVE.md (hardcopy guru)
│
└── tests/
    ├── smoke.py             6087  — 632 pengujian Playwright, 116 bagian (±12 menit)
    ├── engine.test.mjs        36  — 21 pengujian matematika murni (instan)
    └── archive_soal.py       224  — membangkitkan arsip soal DARI quizzes.json (anti-drift)
```

---

## 4. EMPAT FITUR INTI YANG AKAN DIEKSTRAK

Ini daftar yang pengguna sebut eksplisit. Sesi berikutnya wajib membedah
keempatnya sampai **bisa ditulis ulang untuk domain Vektor**, bukan sekadar
dirangkum.

### 4.1 SPA Routing & State Management (`localStorage`)

**Berkas:** `js/router.js`, `js/app.js`, `js/state/progressStore.js`, `js/state/sessionState.js`

- Router berbasis **hash**, ±135 baris, tanpa dependensi. API publik:
  `route(pattern, handler)`, `setGuard(handler)`, `setNotFound(handler)`,
  `navigate(path, {replace})`, `back()`, `start()`, `resolve()`, `getCurrentPath()`.
- Pola rute memakai parameter titik dua: `/belajar/:chapterId/:subtopicId`,
  `/kuis/:mode/:bankId`.
- **Delapan rute** aplikasi ini: `/login`, `/tka`, `/`, `/belajar`,
  `/belajar/:chapterId`, `/belajar/:chapterId/:subtopicId`, `/kuis`,
  `/kuis/:mode/:bankId`.
- `setGuard` dipakai untuk memaksa identitas siswa sebelum masuk materi —
  contoh pola **gating** yang akan dibutuhkan lagi.
- **Dua penyimpanan dengan peran berbeda dan JANGAN dicampur:**
  - `progressStore.js` → **`localStorage`**: progres permanen, kunci sub-topik
    (`isSubtopicUnlocked`), riwayat skor (`saveQuizResult` / `getQuizHistory`,
    `MAX_QUIZ_HISTORY = 50`), pengaturan, identitas siswa (sejak Fase 14).
  - `sessionState.js` → **`sessionStorage`**: melanjutkan sesi soal yang
    tertinggal (`lessonKey`, `quizKey`, `getResume`, `patchResume`, `clearResume`).
- `isStorageAvailable()` ada karena mode privat peramban bisa menolak menulis —
  aplikasi harus tetap jalan tanpa penyimpanan.

### 4.2 CBT Exam Engine — umpan balik **TERTUNDA**

**Berkas:** `js/modules/kuis/examEngine.js` (748 baris) + `css/phase18.css`

- Kelas `ExamEngine(container, questions, options)`. Metode kunci:
  `start`, `buildLayout`, `renderSide`, `syncNav`, `goTo`, `renderQuestion`,
  `buildTable`, `renderMathpad`, `renderChoices`, `renderMatrixInput`,
  `freezeInput`, `renderActions`, `gradeOne`, `submit`, `renderSummary`,
  `renderReview`, **`destroy`**.
- **Kontrak inti:** TIDAK ADA tombol "Periksa Jawaban". Jawaban ditahan di
  `answers[]` (bentuk slot: `string` / `index` / `index[]` / `string[][]`),
  matriks setengah terisi ditahan di `drafts`, lalu **seluruhnya dinilai sekali**
  saat "Kumpulkan Ujian".
- **Navigasi bebas:** grid nomor soal 1..N di sidebar, boleh melompat ke mana
  saja, penanda terisi/kosong disinkronkan `syncNav()`.
- **Riwayat percobaan** dibaca dinamis via `options.getHistory()` → "Percobaan 1:
  60, Percobaan 2: 100". Ulangan tak terbatas.
- **Tipe soal yang didukung:** pilihan ganda **A-E gaya UTBK**, **multi-select
  (checkbox multi-kondisi)** dengan penilaian per pernyataan, isian angka via
  Mathpad, dan **isian matriks** (grid input).
- Bidang soal: `prompt` (konteks) → `tex` / `table` (data) → **`after` (kalimat
  pertanyaannya, tepat di atas pilihan)**. Kontrak Fase 18.5 §78.
- **Bandingkan dengan `quizEngine.js` — dua kontrak yang SALING BERLAWANAN.**
  Blueprint harus menjelaskan kapan memakai yang mana, bukan menyatukannya.

### 4.3 Smart Scratchpad — gambar berbasis **vektor** + mekanik **Peek**

**Berkas:** `js/ui/scratchpad.js` (804 baris) + `css/phase15.css`

- Fungsi pabrik tunggal: `createScratchpad(host)` → `{ open, close, destroy, get state }`.
  Mengembalikan objek no-op kalau `host` kosong (aman dipanggil di mana saja).
- **Menyimpan vektor, BUKAN bitmap.** Titik dinormalisasi `0..1` terhadap kotak
  kanvas, sehingga `ResizeObserver` bisa menggambar ulang saat layar berubah
  tanpa coretan melenceng atau pecah.
- **Gambar jalur kontinu** (`drawTail` dengan penanda `s.drawn`) —
  memakai `getCoalescedEvents()` agar garis stylus halus, dengan penjaga karena
  fungsi itu bisa mengembalikan **array kosong** pada peristiwa sintetis
  (jebakan pengujian yang nyata).
- **Penghapus per-GORESAN, bukan per-piksel:** geometri jarak ruas-ke-ruas
  (`segSegDist`, `segIntersect`, `distPointSeg`), radius jangkauan
  `ERASER_REACH = 12`, satu sapuan bisa membuang beberapa goresan sekaligus.
- **Riwayat berbasis TINDAKAN** (`{type:'draw'}` / `{type:'erase'}`), bukan
  berbasis goresan — karena satu penghapusan harus dibatalkan dengan menyisipkan
  kembali semua goresan yang terbuang **pada posisi semula, dalam urutan
  terbalik**.
- **Mekanik Peek:** tahan ikon mata → kanvas `opacity: 0` dengan
  `transition: opacity .2s ease-in-out` supaya siswa bisa mengintip soal di
  belakang coretannya; menggambar dimatikan selama mengintip.
- **Kanvas SOLID** (putih + kisi titik) — dan **kisi itu wajib tetap di CSS,
  jangan pernah dilukis ke bitmap**, kalau tidak seluruh pengujian tinta
  berbasis `getImageData` kehilangan makna.
- **Hidup di mode Belajar DAN mode ujian.** Ditambatkan ke `.ws-stage`, dibuat
  **sekali per sesi** (coretan bertahan saat melompat antar soal), dan
  `destroy()` **wajib** dipanggil — papan memegang `ResizeObserver` dan listener
  di `window` yang tidak ikut mati oleh pengosongan `innerHTML`.

### 4.4 Mastery Learning Quiz System — umpan balik **LANGSUNG**, tata letak 2 kolom

**Berkas:** `js/modules/kuis/quizEngine.js` (536 baris), `quizResult.js`, `css/phase10.css`, `css/phase18.css`

- Kelas `QuizEngine(container, questions, options)`. Metode kunci:
  `restoreSession`, `saveSession`, `buildShell`, `buildNav`, `goTo`,
  `maxReached`, `syncNav`, `render`, `renderMathpad`, `renderChoices`,
  `renderMatrixInput`, `addSubmitButton`, `lockInputs`, **`judge`**,
  `renderNextAction`, `finish`.
- **Kontrak inti (berlawanan dengan CBT):** dinilai **seketika** per soal,
  input dikunci setelah dijawab, penjelasan langsung muncul, dan siswa
  **tidak boleh melompat melewati soal yang belum dikuasai** (`maxReached`).
- **Sesi bisa dilanjutkan** (`restoreSession`/`saveSession` lewat
  `sessionStorage`) — berbeda dari mode ujian yang sengaja tidak melanjutkan.
- **Tata letak 2 kolom "Sidebar & Stage"** (Fase 10, dipakai ulang Fase 18):
  `.workspace--split` > `.ws-side` (25-30%: info, riwayat, navigasi) +
  `.ws-stage` (69-76%: panggung soal). **Arsitektur ini tidak boleh dirusak.**
- Isian matriks memakai **CSS Grid** dengan `gap` dan padding kurung yang
  dilebarkan (`.matrix-input-host`, `.numfield--cell`) supaya kotak isian
  **tidak pernah** menyentuh atau menimpa garis kurung di ukuran layar mana pun.

### 4.5 Bonus yang sama berharganya (jangan dilewatkan)

| Subsistem | Berkas | Kenapa layak masuk blueprint |
|---|---|---|
| **Mathpad** | `js/ui/mathpad.js` | Keyboard OS di ponsel menutupi soal dan mengizinkan karakter sampah. Seluruh input angka lewat pad kustom: field `readOnly` + `inputmode="none"`. Auto-simpan saat pad ditutup dari luar; Escape membatalkan **dan memulihkan isi kotak**. |
| **Toast & Modal** | `js/ui/toast.js`, `js/ui/modal.js` | `alert()`/`confirm()`/`prompt()` **dilarang total**. Setiap interaksi yang ditolak WAJIB menjelaskan **kenapa** lewat toast. |
| **Kelas dasar `Simulation`** | `js/modules/belajar/simulations/simCore.js` | Siklus hidup lengkap: `claim`/`release` (kunci anti-klik-spam), `lockChoices`, `setBusy`, `useSteps`, `track(cleanupFn)`, `later`, `wait`, `saveState`, `complete`. **Ini kerangka paling bisa dipakai ulang di seluruh proyek.** |
| **Registry engine** | `simulations/index.js` | Peta `string → kelas`, dicocokkan dengan `simulation.engine` di JSON bab. Nama lama sengaja dipertahankan sebagai alias supaya satu salah ketik di data tidak menampilkan layar kosong. |
| **Data-driven kurikulum** | `data/lessons.json`, `data/chapters/*.json`, `data/quizzes.json` | Konten dan kode terpisah. **Untuk proyek Vektor, idealnya hanya berkas-berkas inilah yang benar-benar baru.** |
| **Arsip soal ter-generate** | `tests/archive_soal.py` | Hardcopy guru dibangkitkan DARI `quizzes.json`, jadi tidak mungkin melenceng dari yang dilihat siswa. |
| **Anti-pergeseran tata letak** | `HANDOFF.md §6` | Overlay absolut, tinggi dicadangkan, `visibility:hidden` — **`remove()` dilarang**. Nol layout shift adalah kontrak, bukan preferensi. |

---

## 5. KONTRAK PRODUK YANG WAJIB MASUK BLUEPRINT

Diambil dari `HANDOFF.md §5` (80 butir, ditegakkan pengujian). Ini yang paling
tidak bergantung pada topik Matriks — artinya **berlaku langsung untuk Vektor**:

1. **Aplikasi TIDAK PERNAH menghitung untuk siswa.** Setiap angka akhir harus
   keluar dari kepala siswa. Ini penyaring keputusan desain nomor satu.
2. **`alert()` / `confirm()` / `prompt()` dilarang total.** Pakai toast & modal.
3. **Seluruh input angka lewat Mathpad**, field `readOnly` + `inputmode="none"`.
4. **Setiap penolakan interaksi wajib disertai alasan.** Indikator merah saja
   tidak cukup — siswa harus tahu **kenapa**.
5. **Setiap drag WAJIB punya padanan tap-tap** (mayoritas siswa memakai ponsel).
6. **Setiap simulasi pilihan wajib imun klik-spam.** Kunci diambil pada **klik
   pertama**, bukan setelah animasi. Kalau satu modul diperbaiki, audit semua
   modul sejenis.
7. **Viewport terkunci:** `body` tidak pernah menggulir, tanpa overflow horizontal.
8. **Nol layout shift.** Overlay absolut, tinggi dicadangkan, `visibility:hidden`
   — jangan `remove()`. Catatan: kotak `visibility:hidden` yang **kosong** hanya
   mencadangkan ruang sebesar isinya — bangun isinya lebih dulu, baru sembunyikan.
9. **Setiap soal wajib menuliskan pertanyaannya, tepat di atas pilihan.**
10. **Teks ber-markdown wajib lewat `renderMixed()`** — argumen HTML mentah akan
    menampilkan bintang-bintangnya.
11. **Jangan pernah menampilkan angka yang tidak bisa ditelusuri siswa.**
12. **Komentar kode dalam Bahasa Indonesia, menjelaskan *kenapa*, bukan *apa*.**
13. **CSS berlapis, urutan muat mengikat.** Perbaikan visual baru masuk ke
    berkas fase **tertinggi**. (Untuk proyek baru: pertimbangkan apakah pola
    "berkas per fase" ini benar-benar mau diwarisi, atau diganti struktur
    berbasis komponen sejak awal — **bahas trade-off ini di blueprint**.)

**Fitur yang dihapus permanen dan JANGAN dihidupkan lagi:** mekanik "titik
temu" (dihapus Fase 13), fitur "streak".

---

## 6. CARA MENJALANKAN & MENGUJI (jika perlu memverifikasi klaim di atas)

```bash
python -m http.server 5173
```

```bash
node tests/engine.test.mjs
```

```bash
python tests/smoke.py
```

Harapan: `engine.test.mjs` → **21/21**, `smoke.py` → **632/632**.
Server statis wajib jalan lebih dulu (ES Modules butuh `http://`, bukan `file://`).

> ⚠️ `smoke.py` memakan ±12 menit. **Jalankan di latar belakang dan jangan
> dianggap menggantung.** Jangan pernah mengedit berkas sumber sementara suite
> berjalan — hasil versi campuran tidak membuktikan apa pun.

**Jebakan lingkungan kerja** (rinci di `HANDOFF.md §9`): heredoc Python inline
berulang kali merusak escape seperti backslash-s; pakai berkas skrip tertulis
dan setel ulang encoding stdout ke UTF-8 dengan `errors="replace"`.

---

## 7. GIT

| Hal | Nilai |
|---|---|
| Branch | `main` |
| Remote | `origin` = `https://github.com/mrpurnomo/ruang-matriks.git` |
| HEAD | `085230c` |
| Penulis semua commit | `Penta Putra Purnomo <penta.putra73@guru.sma.belajar.id>` |
| Tanda tangan AI | **NOL.** Riwayat pernah ditulis ulang sekali demi ini — **pertahankan** |

> 🚫 **JANGAN PERNAH `git push` tanpa permintaan eksplisit pengguna di sesi
> yang sedang berjalan.** Izin push di sesi atau fase sebelumnya **tidak
> berlaku** untuk sesi berikutnya. Siswa memakai versi yang ada di remote.

> 🚫 **Jangan menambahkan trailer `Co-Authored-By`, `Generated with`, atau
> tanda tangan AI apa pun** pada commit di repo ini.

---

## 8. ARAHAN UNTUK SESI BERIKUTNYA (EKSPLISIT)

### 8.1 Satu-satunya tugas

> **Baca seluruh basis kode "Ruang Matriks", lalu hasilkan SATU berkas baru:
> `EDTECH_BLUEPRINT.md` — kerangka EdTech yang dirancang untuk DISALIN-TEMPEL
> dan diadaptasi menjadi aplikasi baru "Vektor Kelas 11 (Kurikulum Merdeka)".**

Tidak ada tugas lain. Tidak ada kode aplikasi yang ditulis. Tidak ada perbaikan
bug. Tidak ada fase baru.

### 8.2 Yang TIDAK boleh dilakukan

| Larangan | Alasan |
|---|---|
| Mengubah berkas apa pun di `js/`, `css/`, `data/`, `content/`, `index.html` | Aplikasi ini **sedang dipakai siswa** dan sudah selesai. Repo = sumber referensi. |
| Mengubah `tests/` | Sama. 632/632 adalah garis dasar yang harus tetap berarti. |
| Menjalankan `git push` | Butuh izin eksplisit pengguna di sesi berjalan. |
| Memulai proyek "Vektor" sendiri | Sesi ini hanya menghasilkan **blueprint**, bukan aplikasinya. |
| Merangkum dangkal ("ada router, ada quiz engine") | Blueprint harus **bisa dieksekusi**, bukan katalog. |

### 8.3 Yang harus ada di `EDTECH_BLUEPRINT.md`

Usulan kerangka (sesi berikutnya boleh menyempurnakan, tapi jangan mengurangi
kedalamannya):

1. **Filosofi & kontrak pedagogis** — termasuk "aplikasi tidak pernah menghitung
   untuk siswa" dan kenapa itu mengubah setiap keputusan UI.
2. **Keputusan tumpukan teknologi** beserta trade-off-nya (kenapa nol-build,
   apa harganya).
3. **Struktur direktori kerangka** — siap disalin, dengan penanda mana yang
   generik dan mana yang khas Matriks.
4. **Lapisan inti yang dapat dipakai ulang langsung** (hampir tanpa perubahan):
   `router.js`, `progressStore.js`, `sessionState.js`, `toast.js`, `modal.js`,
   `icons.js`, `motion.js`, `mathpad.js`, `scratchpad.js`, `katexRenderer.js`,
   kelas dasar `Simulation`, `quizEngine.js`, `examEngine.js`, `quizResult.js`.
5. **Lapisan khas domain yang harus ditulis ulang untuk Vektor:**
   `engine/matrix.js` → `engine/vector.js` (dot product, cross product, norma,
   proyeksi, sudut antar vektor, vektor satuan, kombinasi linear); seluruh
   `simulations/sim*.js`; seluruh `data/` dan `content/`.
6. **Skema data** — bentuk JSON `lessons.json`, `chapters/*.json`, `quizzes.json`
   (termasuk bentuk soal `prompt`/`tex`/`table`/`after`, tipe `mathpad`,
   `choice`, `multi_select`, `matrix_input`) sebagai templat kosong yang bisa
   diisi.
7. **Kontrak UI/UX & aturan CSS** — Sidebar & Stage, anti-pergeseran tata letak,
   viewport terkunci, drag + tap-tap, kunci anti-klik-spam.
8. **Strategi pengujian** — pola `smoke.py` (ukur, jangan baca kode:
   `getBoundingClientRect`, `getComputedStyle`, `elementFromPoint`,
   `getAnimations`, hitung piksel kanvas) dan `engine.test.mjs`.
9. **Peta adaptasi Matriks → Vektor** — tabel konkret: apa yang disalin
   apa adanya, apa yang diganti namanya, apa yang ditulis dari nol, dan
   simulasi vektor apa yang analog dengan simulasi matriks yang sudah ada
   (mis. `transpose_morph` → morf komponen vektor; `matrix_multiply` →
   pembangun dot product langkah-demi-langkah; `SniperExtractionSim` →
   ekstraksi komponen tersembunyi dari soal cerita).
10. **Daftar jebakan yang sudah dibayar mahal** — supaya proyek baru tidak
    mengulanginya (`getCoalescedEvents()` bisa mengembalikan array kosong;
    `visibility:hidden` pada kotak kosong tidak mencadangkan ruang;
    `classList.add('')` melempar `SyntaxError`; argumen ketiga `el()` masuk
    sebagai HTML mentah; kisi kanvas wajib di CSS bukan di bitmap;
    `ResizeObserver` dan listener `window` selamat dari pengosongan `innerHTML`).

### 8.4 Urutan membaca yang disarankan

1. `HANDOFF.md` — **§4 Arsitektur**, **§5 Kontrak (80 butir)**, **§6
   Anti-Pergeseran**, **§7 Subsistem**, **§3 Peta File**, **§12 Aturan Kerja**.
2. `PRD.md` — bentuk kurikulum & alur belajar.
3. `index.html` — urutan muat CSS & titik masuk.
4. `js/router.js` → `js/app.js` → `js/state/*` — tulang belakang SPA.
5. `js/modules/belajar/simulations/simCore.js` — kelas dasar `Simulation`.
6. `js/modules/kuis/quizEngine.js` **berpasangan dengan** `examEngine.js` —
   dua kontrak yang berlawanan.
7. `js/ui/scratchpad.js`, `js/ui/mathpad.js` — dua komponen paling padat.
8. `data/chapters/03_determinan_invers.json` + `simDetInv.js` — contoh terbaik
   hubungan data ↔ engine.
9. `tests/smoke.py` — cukup beberapa bagian, untuk menyerap **gaya pengujian
   berbasis pengukuran**.

### 8.5 Cara kerja yang diharapkan pengguna (berlaku juga di sesi blueprint)

- **Verifikasi dengan pengukuran, bukan pembacaan kode.** Kalau blueprint
  mengklaim sesuatu tentang perilaku aplikasi, buktikan di peramban.
- **Curigai pengujianmu sendiri, bukan hanya kodenya.**
- **Kerjakan seluruh tugas.** Kalau satu bagian terhambat, selesaikan sisanya
  dan **katakan** bagian mana yang ditinggalkan dan kenapa.
- **Laporkan dengan jujur.** Jangan mengaku selesai kalau belum.
- **Nilai setiap keputusan secara pedagogis:** apakah ini membuat siswa
  mengerjakan matematikanya sendiri?
- Seluruh komunikasi **Bahasa Indonesia**.

---

## 9. RINGKASAN SATU PARAGRAF (kalau hanya ini yang terbaca)

"Ruang Matriks" adalah aplikasi pembelajaran interaktif Matematika Tingkat
Lanjut Kelas 11 (materi Matriks, selaras TKA) yang ditulis **seluruhnya dengan
Vanilla HTML/CSS/JS ES Modules tanpa proses build, tanpa backend**, terdiri dari
4 bab / 22 sub-topik dengan alur Materi → Simulasi → Mini Kuis, ±33.900 baris
dalam 56 berkas sumber, **selesai 100% pada Fase 18.5** dengan **21/21 pengujian
engine dan 632/632 pengujian Playwright lolos**. Komponen yang paling berharga
untuk diwarisi: **SPA router + manajemen state `localStorage`**, **mesin ujian
CBT berumpan-balik-tertunda** yang berpasangan dengan **mesin kuis mastery
learning berumpan-balik-langsung** dalam tata letak 2 kolom "Sidebar & Stage",
**papan coret berbasis vektor dengan penghapus per-goresan dan mekanik Peek**,
serta **Mathpad** pengganti keyboard OS — semuanya diikat oleh kontrak pedagogis
tunggal: **aplikasi tidak pernah menghitung untuk siswa.** Tugas sesi
berikutnya **hanya satu**: membedah basis kode ini dan menghasilkan
`EDTECH_BLUEPRINT.md` sebagai kerangka siap-adaptasi untuk **"Vektor Kelas 11
(Kurikulum Merdeka)"**.
