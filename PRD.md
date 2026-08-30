# PRD — Matriks Lab Interaktif
**Product Requirement Document**
Versi 0.1 · Fase Perencanaan · 23 Agustus 2026

---

## 1. Ringkasan Produk

**Matriks Lab Interaktif** adalah aplikasi web edukasi *single-page*, 100% frontend (vanilla HTML/CSS/JS), yang mengajarkan materi Matriks untuk Matematika Tingkat Lanjut Kelas 11 (Kurikulum Merdeka, selaras dengan kisi-kisi TKA). Alih-alih siswa hanya membaca dan menghitung di kertas, aplikasi ini membiarkan siswa **memanipulasi elemen matriks secara langsung** — men-drag, menjatuhkan, dan menyaksikan animasi "peleburan" (merge) ala Manim yang memvisualisasikan proses aritmatika yang biasanya tersembunyi di kepala guru saat mengajar di papan tulis.

Tiga pilar desain:
1. **Visual-first, bukan rumus-first.** Setiap operasi (jumlah, kali, determinan, invers) punya representasi gerak sebelum siswa melihat rumus abstrak.
2. **Belajar dengan tangan (hands-on).** Drag-and-drop bukan hiasan — ia *adalah* mekanisme utama siswa membuktikan pemahaman, terinspirasi dari filosofi manipulasi ekspresi langsung di Graspable Math.
3. **Tanpa gesekan (frictionless).** Tidak ada login, tidak ada server, tidak ada instalasi. Buka `index.html`, progres otomatis tersimpan di `localStorage` browser.

---

## 2. Referensi & Selarasan Kurikulum

Dokumen ini disusun berdasarkan:
- `docs/Rencana_Materi_Matriks_TKA_Kelas_11.md` — struktur materi Bab 1–5 (Konsep Dasar → Operasi → Determinan/Invers → Pemodelan).
- `docs/TKA Matriks kemendikdasmen.png` — kisi-kisi resmi: elemen matriks berupa bilangan real, determinan & invers **dibatasi ordo 2×2 dan 3×3**, mencakup sub-elemen *Determinan*, *Invers*, dan *Operasi matriks*.
- `docs/TKA Matriks 2025.pdf` — contoh soal asli TKA yang mengungkap **pola soal nyata** yang harus disiapkan aplikasi ini: soal invers matriks diagonal, soal cerita pemodelan (pakan ternak → sistem persamaan linear via matriks), soal cerita produksi pabrik (perkalian matriks bahan baku), dan soal **multi-jawaban benar** (pilih semua yang benar — bukan hanya pilihan tunggal) tentang perbandingan pendapatan dari perkalian matriks.

**Implikasi desain penting** dari soal asli TKA:
- Kuis di aplikasi tidak boleh melulu pilihan ganda tunggal — perlu tipe soal **"pilih semua yang benar"** (checkbox multi-select) karena format ini sudah muncul di TKA asli.
- Soal cerita/pemodelan harus melatih siswa **menerjemahkan tabel/narasi ke bentuk matriks** sebelum menghitung — ini kelemahan umum siswa, bukan hitungannya.
- Butir determinan & invers **tidak perlu** mendukung ordo di atas 3×3 — batasan ini mengurangi kompleksitas engine simulasi secara signifikan.

---

## 3. Target Pengguna

- Siswa Kelas 11 SMA/MA jurusan yang mengambil Matematika Tingkat Lanjut.
- Konteks pemakaian: belajar mandiri di rumah/sekolah, kemungkinan sambil mempersiapkan TKA.
- Asumsi perangkat: laptop/desktop sebagai prioritas utama (drag-and-drop presisi), namun tetap harus *usable* di tablet/HP (touch-friendly, breakpoint responsif) karena banyak siswa Indonesia hanya punya HP.

---

## 4. Arsitektur Aplikasi & Struktur Folder

Filosofi: **vanilla, modular per-fitur, tanpa build step.** Semua library pihak ketiga di-load lewat CDN atau disalin ke `vendor/` agar aplikasi tetap bisa jalan offline (penting karena banyak sekolah dengan koneksi internet tidak stabil).

```
matriks-lab-interaktif/
│
├── index.html                  # Shell aplikasi: memuat Main Menu & routing antar-mode
├── PRD.md
│
├── content/                    # Sumber materi (Markdown) — dipakai untuk draft/review manusia
│   ├── 01_Konsep_Dasar.md
│   ├── 02_Operasi_Aljabar.md
│   ├── 03_Determinan_Invers.md
│   └── 04_Pemodelan_TKA.md
│
├── data/                       # (Fase coding) Konten di atas dikompilasi/ditranskrip ke JSON
│   ├── lessons.json             #   supaya bisa di-render dinamis oleh JS tanpa parser Markdown
│   └── quizzes.json             #   di runtime (menghindari dependency parser MD ekstra).
│
├── css/
│   ├── base.css                # Reset, variabel warna/tipografi (design tokens)
│   ├── layout.css              # Grid halaman, main menu, navigasi
│   ├── components.css          # Kartu, tombol, badge, progress bar, modal, toast, mathpad
│   ├── matrix.css              # Styling sel matriks, drop-zone, drag-ghost, highlight baris/kolom
│   ├── scrollbars.css          # Styling `::-webkit-scrollbar` & `scrollbar-color` bertema, lihat §7.3
│   └── animations.css          # Keyframes fallback & kelas util animasi
│
├── js/
│   ├── app.js                   # Entry point: init router, load progress, render Main Menu
│   ├── router.js                # Hash-based router (#/belajar, #/whiteboard, #/kuis)
│   ├── state/
│   │   ├── progressStore.js     # Wrapper localStorage (get/set/migrate schema)
│   │   └── sessionState.js      # State sementara (matriks aktif di whiteboard, dsb — in-memory)
│   ├── engine/
│   │   ├── matrix.js            # Struktur data Matrix + operasi murni (add, mul, det, inv, transpose)
│   │   ├── validator.js         # Validasi ordo/kompatibilitas sebelum operasi dijalankan
│   │   └── katexRenderer.js     # Helper render matriks JS → string LaTeX → KaTeX
│   ├── interactions/
│   │   ├── dragDrop.js          # Wrapper di atas SortableJS/Drag API: drag chip elemen
│   │   ├── flyToAnimation.js    # Animasi "fly-to" (GSAP timeline generator, lihat §7)
│   │   └── mergeAnimation.js    # Animasi "merge" (peleburan dua elemen → hasil)
│   ├── ui/                      # Komponen UI kustom — WAJIB dipakai, lihat §7.4
│   │   ├── mathpad.js            # Numpad on-screen kustom untuk semua input angka/pecahan
│   │   ├── toast.js              # Notifikasi sekilas non-blocking (pengganti alert())
│   │   └── modal.js              # Dialog kustom untuk konfirmasi/keputusan (pengganti confirm()/prompt())
│   ├── modules/
│   │   ├── belajar/
│   │   │   ├── lessonRenderer.js    # Render Materi + Kegiatan Interaktif dari data/lessons.json
│   │   │   └── simulations/         # 1 file per jenis simulasi (mis. simulasiPerkalian.js)
│   │   ├── whiteboard/
│   │   │   └── whiteboardEngine.js  # Kanvas bebas: siswa buat matriks sendiri, jalankan operasi apa saja
│   │   └── kuis/
│   │       ├── quizEngine.js        # Loop tanya-jawab, skoring, tipe soal (single/multi-select/isian)
│   │       └── quizResult.js        # Layar hasil + rekomendasi remedial
│   └── vendor/                  # (opsional) salinan lokal KaTeX/GSAP/SortableJS untuk mode offline
│
├── assets/
│   ├── fonts/                   # Font lokal (jika tidak pakai Google Fonts CDN)
│   ├── icons/                   # SVG icon set (menu, badge, mascot)
│   └── sfx/                     # (opsional) efek suara pendek untuk feedback benar/salah (mutable)
│
└── content/                     # (folder ini sudah dibuat di Fase 1 — lihat atas)
```

**Keputusan arsitektur kunci:**
- **Data-driven rendering.** Materi ditulis di Markdown (`content/`) untuk kenyamanan penulisan/review, lalu (di fase coding) ditranskrip manual ke `data/lessons.json` dengan skema tetap (lihat §8.1). Ini menghindari kebutuhan library parser Markdown di client demi menjaga stack tetap vanilla & ringan.
- **Engine matriks terpisah dari animasi.** `engine/matrix.js` murni logika matematika (bisa di-unit-test tanpa DOM). `interactions/` murni visual. Ini memungkinkan simulasi baru ditambahkan tanpa menyentuh logika inti.
- **Tidak ada framework, tidak ada bundler.** Semua file JS pakai ES6 module native (`<script type="module">`) yang langsung dijalankan browser modern — nol langkah build, selaras dengan syarat "vanilla" dan "seamless local operation".
- **Nol dialog/keyboard bawaan browser.** Seluruh permukaan input dan notifikasi (numpad, alert, konfirmasi) dibangun sendiri sebagai komponen `js/ui/`, bukan memanggil API native browser. Alasan detail dan aturan wajibnya ada di §7.4.

---

## 5. Tech Stack & Justifikasi

| Kebutuhan | Pilihan | Alasan |
|---|---|---|
| Struktur & Style | HTML5, CSS3 (custom properties untuk design token) | Wajib sesuai brief; tanpa build step. |
| Logika | Vanilla JS ES6+ (modules) | Wajib sesuai brief. |
| Render Notasi Matematika | **KaTeX** | Lebih cepat render daripada MathJax (penting untuk animasi real-time saat elemen berubah nilai), footprint lebih kecil, cukup untuk notasi matriks TKA. |
| Animasi | **GSAP** (GreenSock) | `timeline()` dan easing kurva Bezier GSAP jauh lebih presisi untuk animasi "fly-to" multi-tahap (lihat §7) dibanding CSS keyframes murni atau Anime.js. GSAP juga native mendukung `MotionPathPlugin` untuk lintasan lengkung ala Manim. Anime.js jadi *fallback* jika ukuran bundle GSAP jadi masalah nanti. |
| Drag & Drop | **SortableJS** untuk daftar/urutan (mis. menyusun elemen jadi baris) + **native HTML5 Drag & Drop API** untuk drag bebas satu-ke-satu (chip elemen ke drop-zone spesifik) | Kombinasi: SortableJS unggul untuk *reordering* list, tapi untuk "tarik chip A ke sel target B" yang presisi posisi, native Drag API + custom ghost element lebih fleksibel dan ringan. |
| Persistensi | `localStorage` (native Web Storage API) | Wajib sesuai brief; tidak perlu backend. |

---

## 6. Fitur Inti

### 6.1 Main Menu
Halaman pertama yang dilihat siswa setelah splash singkat. Tiga kartu besar setara tinggi menu utama, sesuai brief:

1. **📘 Belajar** — jalur materi terstruktur Bab 1–4 (mengikuti `content/01`–`04`). Setiap bab dipecah per sub-topik dengan progres individual. Sub-topik terkunci berurutan (siswa harus lulus Mini Kuis sebelumnya) tapi *seluruh Bab* boleh diakses non-linear (siswa boleh mulai dari Bab 3 kalau mau review Determinan langsung).
2. **✏️ Whiteboard** — kanvas bebas. Siswa membuat matriks berordo bebas (hingga 3×3, sesuai batas kurikulum), lalu menjalankan operasi apa pun (tambah, kurang, kali, transpose, determinan, invers) di luar konteks kuis — ruang eksplorasi/latihan mandiri atau untuk cek PR.
3. **🧩 Kuis** — bank soal terpisah dari Mini Kuis di jalur Belajar; mode "Latihan TKA" yang mencampur soal dari semua bab dengan format sesuai kisi-kisi asli (termasuk tipe **pilih-semua-yang-benar** dan soal cerita pemodelan).

Elemen menu tambahan (terinspirasi Learnara.ai):
- **Progress ring** di avatar/header: persentase keseluruhan kurikulum yang sudah dikuasai.
- **Kartu "Lanjutkan Belajar"** di atas menu utama yang muncul jika siswa punya progres tersimpan — langsung lompat ke sub-topik terakhir.

> **Keputusan Fase 7 — streak dihapus.** Penghitung hari berturut-turut menghukum siswa yang bolos sehari dan mengubah motivasi belajar jadi kecemasan menjaga angka. Progress ring sudah cukup memberi umpan balik kemajuan tanpa efek samping itu. Fitur ini dicabut sepenuhnya, dari UI maupun dari logika penyimpanan.

### 6.2 Mode Belajar
- Struktur render: **Materi → Kegiatan Interaktif/Simulasi → Mini Kuis**, identik dengan struktur `content/*.md` (lihat §9). Ini bukan kebetulan — struktur konten dan struktur UI harus 1:1 agar penulisan materi baru otomatis "siap pakai" oleh renderer.
- Setiap sub-topik adalah satu "kartu pelajaran" full-screen dengan indikator langkah (mis. "Langkah 2 dari 3: Simulasi").
- Mini Kuis di akhir sub-topik **memblokir progres** (harus benar untuk lanjut) tapi mengizinkan percobaan ulang tanpa penalti — filosofi *mastery learning*, bukan *high-stakes testing* (itu peran mode Kuis).

### 6.3 Mode Whiteboard
- Siswa mendefinisikan ordo matriks (dropdown 1×1 s.d. 3×3) untuk hingga 2 matriks aktif (A dan B) plus 1 area hasil (C).
- Toolbar operasi kontekstual: tombol operasi yang tidak valid untuk ordo saat ini otomatis *disabled* dengan tooltip alasan (mis. "A + B butuh ordo sama — A saat ini 2×3, B 3×2").
- Semua animasi fly-to/merge dari mode Belajar tersedia di sini, tapi tanpa "kunci jawaban" — murni eksploratif.
- Tombol **"Simpan ke Progres"** opsional: snapshot state whiteboard tersimpan di localStorage supaya siswa bisa lanjut sesi lain. Konfirmasi penimpaan slot yang sudah terisi memakai **Modal kustom** (§7.4), bukan `confirm()` bawaan browser — modal menampilkan preview singkat state lama vs baru sebelum siswa menekan "Ya, Timpa".

### 6.4 Mode Kuis
- Dua sub-mode: **Latihan per Bab** (soal dari satu bab saja, untuk drilling) dan **Simulasi TKA** (10 soal acak lintas-bab, timer opsional, mencerminkan variasi tipe soal di `docs/TKA Matriks 2025.pdf`).
- Tipe soal yang didukung engine (lihat §8.2 untuk skema data):
  - Pilihan ganda tunggal (radio).
  - **Pilih semua yang benar** (checkbox, skor hanya penuh jika kombinasi tepat).
  - Isian numerik singkat (mis. "nilai determinan = ..."), **selalu** dijawab lewat Mathpad kustom (§7.4) — field isian bersifat `readonly` terhadap keyboard OS, hanya menerima input lewat tap tombol Mathpad.
  - Isian elemen matriks (siswa mengisi sel-sel matriks hasil langsung di grid interaktif — bukan hanya angka lepas), tiap sel memicu Mathpad yang sama saat di-tap.
- Layar hasil menunjukkan breakdown per sub-topik yang masih lemah, dengan tombol "Ulangi Materi Ini" yang melompat balik ke Mode Belajar.

---

## 7. UI/UX Proposal

### 7.1 Arah Gaya Visual: **"Studio Belajar Cerah"**
Bukan galaxy/space theme. Alih-alih itu, mengambil suasana **"meja kerja kreatif yang cerah dan rapi"** — dekat dengan estetika Learnara.ai/Duolingo/Notion: banyak white-space, kartu dengan bayangan lembut, ilustrasi flat playful, tipografi tebal-membulat yang ramah tapi tetap terlihat "matematis-presisi" lewat elemen grid/garis halus di background dan monospace aksen pada notasi.

**Prinsip:**
- **Precision meets playfulness.** Grid matriks digambar dengan garis tegas & rapi (mencerminkan presisi matematika), tapi dibalut kartu bulat, warna hangat, dan micro-animasi menyenangkan (confetti kecil saat kuis lulus, elemen "memantul" saat mendarat).
- **Fokus pada satu aksi per layar.** Tidak ada clutter — saat simulasi berjalan, elemen non-esensial di-dim agar mata siswa terpandu ke gerakan elemen matriks (mirip framing kamera di video Manim).
- **Feedback instan & jelas.** Warna sukses/gagal konsisten di seluruh app, bukan hanya di kuis (dropzone salah = getar halus + border merah; dropzone benar = pulse hijau + snap-in).

### 7.2 Palet Warna

| Token | Hex | Peran |
|---|---|---|
| `--bg-canvas` | `#FBF9F4` | Latar utama — krem hangat, bukan putih steril, mengurangi kelelahan mata. |
| `--bg-surface` | `#FFFFFF` | Kartu, panel, modal. |
| `--ink-900` | `#20232B` | Teks utama (hampir hitam, bukan hitam pekat). |
| `--ink-500` | `#6B7080` | Teks sekunder/caption. |
| `--brand-primary` | `#4F46E5` (indigo) | Aksi utama, navigasi aktif, elemen matriks "baris". Melambangkan fokus & kepercayaan. |
| `--brand-primary-dark` | `#3730A3` | Hover/pressed state. |
| `--accent-coral` | `#FF6B57` | CTA sekunder, highlight elemen "kolom" (kontras dengan indigo agar baris vs kolom mudah dibedakan mata saat animasi perkalian). |
| `--accent-amber` | `#FFB020` | Badge, bintang pencapaian, progress ring. |
| `--success` | `#16A34A` | Jawaban benar, operasi valid, dropzone diterima. |
| `--danger` | `#E23D44` | Jawaban salah, operasi tidak valid (ordo tidak cocok). |
| `--grid-line` | `#E4E1D8` | Garis dekoratif bertema "buku catatan" di background halaman (sangat subtle, opacity rendah). |

Tipografi:
- **Heading/UI:** `Plus Jakarta Sans` (Google Fonts) — geometris, ramah, tegas tanpa kaku.
- **Body:** `Inter` — keterbacaan tinggi di ukuran kecil, netral.
- **Notasi Matematika:** default KaTeX font (Computer Modern/KaTeX Main) — dibiarkan apa adanya agar notasi tetap terasa "matematis serius" sebagai kontras sengaja terhadap UI di sekitarnya yang playful.

### 7.3 Tata Letak Kunci
- **Header tetap (sticky)**: logo kecil, progress ring, tombol kembali ke Main Menu — selalu terlihat agar siswa tak pernah merasa "tersesat" di simulasi.
- **Main Menu**: 3 kartu horizontal (stack vertikal di mobile) dengan ilustrasi flat berbeda tone warna per kartu (Belajar = indigo, Whiteboard = coral, Kuis = amber), plus kartu "Lanjutkan Belajar" full-width di atasnya jika ada progres.
- **Kanvas Simulasi**: dua panel matriks sumber (A, B) berdampingan di atas, panel hasil (C) di bawah dengan garis pemisah putus-putus bertanda panah — memberi arah baca "dari sini ke sini" yang jelas secara spasial.
- **Mobile/touch**: drop-zone diperbesar (min 44×44px sesuai standar target sentuh), drag memakai `touchmove` listener paralel dengan native Drag API (yang tidak konsisten di sebagian browser mobile).
- **Viewport tetap `100vh`, bebas scroll halaman.** Setiap layar (Main Menu, satu kartu sub-topik Belajar, Whiteboard, satu soal Kuis) dirancang untuk pas dalam satu `100vh` (`height: 100vh; overflow: hidden` pada `<body>`/shell utama) tanpa scroll vertikal — konsisten dengan prinsip §7.1 "fokus pada satu aksi per layar" dan mencegah siswa kehilangan konteks animasi karena harus scroll di tengah simulasi. Navigasi antar sub-topik/soal terjadi lewat transisi ganti-layar (slide/fade), bukan scroll panjang satu halaman.
- **Scroll internal jika benar-benar tak terhindarkan.** Untuk konten yang secara alami bisa lebih panjang dari layar (mis. teks Materi yang panjang pada perangkat kecil, atau daftar riwayat kuis), scroll **dibatasi ke dalam container spesifik** (`overflow-y: auto` pada panel tersebut saja, bukan pada `<body>`), dan container itu **wajib** memakai scrollbar kustom bertema lewat `css/scrollbars.css` — `::-webkit-scrollbar` (track = `--bg-canvas`, thumb = `--brand-primary` dengan radius penuh, thumb hover = `--brand-primary-dark`) serta fallback `scrollbar-width: thin` + `scrollbar-color` untuk Firefox. Scrollbar bawaan OS (abu-abu default) tidak boleh terlihat di mana pun dalam aplikasi.

### 7.4 Kontrol Input Kustom: Mathpad, Toast, dan Modal

Prinsip pemandu: **aplikasi tidak pernah menyerahkan kendali visual ke browser/OS.** Setiap kali OS menyisipkan elemen native (keyboard on-screen, dialog `alert`), tata letak `100vh` yang sudah dirancang presisi (lihat §7.3) berisiko rusak/terdorong, dan gaya visualnya pasti keluar dari tema "Studio Belajar Cerah". Karena itu tiga komponen berikut **wajib** dipakai di seluruh aplikasi, bukan opsi:

1. **Mathpad (Numpad On-Screen Kustom)** — `js/ui/mathpad.js`. Setiap kali siswa perlu memasukkan angka (isian kuis numerik, isian elemen matriks, isian variabel di Whiteboard), field terkait diberi atribut `readonly`/`inputmode="none"` agar **keyboard OS native tidak pernah muncul**. Sebagai gantinya, tap pada field memunculkan Mathpad: panel kustom (bottom-sheet di mobile, popover mengambang di desktop) berisi tombol digit `0`–`9`, titik desimal, tombol ganti-tanda `±`, tombol hapus `⌫`, dan tombol konfirmasi `✓` — semua bergaya kartu bulat sesuai tema (§7.2). Untuk konteks yang memerlukan pecahan (mis. hasil invers), Mathpad punya mode toggle "Pecahan" yang menampilkan dua sub-field kecil (pembilang/penyebut) alih-alih satu field desimal.
2. **Toast** — `js/ui/toast.js`. Pengganti **satu-satunya** untuk `alert()`. Notifikasi singkat non-blocking yang muncul dari tepi bawah layar, auto-dismiss (±3–4 detik) atau bisa di-tap untuk ditutup lebih cepat, dipakai untuk semua feedback sekilas: konfirmasi aksi berhasil, progres tersimpan, dan (paling penting, lihat §8.4) penjelasan kesalahan interaksi.
3. **Modal** — `js/ui/modal.js`. Pengganti **satu-satunya** untuk `confirm()` dan `prompt()`. Dialog kustom bergaya kartu (`bg-surface`, radius besar, backdrop blur lembut di atas `bg-canvas`) untuk setiap keputusan yang butuh konfirmasi eksplisit siswa (mis. menimpa slot whiteboard, mereset progres, keluar dari kuis di tengah jalan). Selalu punya dua aksi jelas berlabel deskriptif (bukan generik "OK"/"Cancel" — mis. "Ya, Timpa Slot Ini" / "Batal, Simpan sebagai Slot Baru").

**Larangan eksplisit:** `alert()`, `confirm()`, dan `prompt()` bawaan JavaScript **tidak boleh dipanggil di mana pun** dalam kode aplikasi (termasuk untuk kebutuhan debug yang tersisa di kode produksi) — review kode di fase implementasi harus menolak PR/commit yang memakai ketiganya.

---

## 8. Interaction Design — Animasi "Fly-to" & "Merge"

Filosofi inti: **jadikan aritmatika yang biasanya terjadi "di kepala" menjadi gerakan yang bisa dilihat mata.** Terinspirasi dari cara video Manim menyorot dua angka, menerbangkannya ke satu titik temu, lalu menyatukannya jadi satu hasil.

### 8.1 Anatomi Umum Animasi (berlaku untuk semua operasi)
Setiap animasi adalah GSAP `timeline()` dengan 4 fase tetap:

1. **Highlight (± 300ms).** Elemen sumber yang akan dioperasikan mendapat outline berwarna + sedikit `scale(1.08)`. Untuk perkalian matriks, ini berupa **sapuan highlight satu baris penuh** (warna indigo) dan **satu kolom penuh** (warna coral) secara bersamaan, mempertegas aturan "baris kali kolom".
2. **Fly (± 500–700ms, easing `power2.inOut`).** Elemen sumber (kloning visual, bukan elemen asli — elemen asli tetap di posisi agar konteks tidak hilang) bergerak sepanjang **lintasan lengkung** (GSAP `MotionPathPlugin`, kurva quadratic bezier, bukan garis lurus — meniru gerak kamera Manim yang jarang linear) menuju satu **titik temu** (meeting point) di ruang kosong antara matriks sumber dan hasil.
3. **Merge (± 400ms).** Di titik temu, dua/lebih elemen klon saling tumpang tindih dengan efek: scale turun bersamaan → operator (`+`, `×`, `−`) muncul sekilas di antaranya (fade in/out cepat) → elemen melebur jadi satu chip baru berisi hasil parsial, disertai flash warna singkat (sukses = hijau) dan easing `back.out` (efek "pop" kecil, bukan berhenti kaku).
4. **Land (± 400ms, easing `back.out(1.7)`).** Chip hasil terbang ke sel target di matriks C dan "mendarat" dengan efek memantul halus (overshoot lalu settle) — memberi rasa fisik/tactile bahwa perhitungan "selesai dan menempel".

Total durasi per elemen hasil: **±1.6–2 detik**, dengan opsi kontrol siswa: tombol ⏸ pause, 🔁 ulangi animasi ini saja, dan ⏩ percepat 2× (untuk siswa yang sudah paham dan ingin cepat lanjut) — kontrol kecepatan penting agar animasi edukatif tidak terasa lambat setelah dilihat berkali-kali.

### 8.2 Skenario per Operasi

**Penjumlahan/Pengurangan (elemen-seletak):**
- Siswa men-drag chip `a_ij` dari matriks A dan chip `b_ij` dari matriks B (posisi seletak, ditandai dengan drop-zone yang menyala hijau *hanya* pada pasangan indeks yang sama saat salah satu chip mulai di-drag — mencegah siswa salah pasang) ke satu **drop-zone gabungan** di antara A dan B.
- Fase Merge menampilkan `a_ij` `+`/`−` `b_ij` sebagai teks kecil sebelum melebur jadi angka hasil.
- Chip hasil terbang ke sel `c_ij` yang **posisinya identik** di matriks C — memperkuat konsep "seletak" secara spasial (tidak ada perpindahan diagonal/silang).

**Perkalian Skalar:**
- Skalar `k` muncul sebagai chip bulat terpisah (warna beda, mis. amber) di luar matriks. Siswa men-drag skalar `k` **menyapu seluruh matriks A** (satu gerakan drag menutupi semua sel) → memicu animasi *staggered* (setiap sel berkedip dan terkalikan berurutan cepat, delay 80ms antar sel) daripada semua sel berubah instan — memberi jeda visual bahwa "setiap elemen kena kali, satu per satu".

**Perkalian Matriks (fokus utama — paling kompleks secara visual):**
- Ini skenario paling penting karena riwayat menunjukkan siswa paling sering keliru di sini.
- Siswa memilih (klik) sel target `c_ij` di matriks hasil kosong terlebih dahulu → aplikasi otomatis men-sorot **baris ke-i matriks A** dan **kolom ke-j matriks B** (highlight otomatis, bukan drag manual, karena pasangan elemen dalam satu perkalian matriks lebih dari 2 pasang dan drag manual untuk semuanya justru membebani kerja motorik tanpa nilai tambah kognitif).
- Siswa kemudian men-drag **pasangan sejajar pertama** (`a_i1`, `b_1j`) ke titik temu → merge menjadi hasil kali pertama, chip hasil ini **tidak langsung ke C**, melainkan ke **"akumulator"** sementara (lingkaran kecil bertuliskan Σ di bawah titik temu).
- Siswa mengulang untuk pasangan kedua (`a_i2`, `b_2j`), lalu ketiga jika 3×3 — tiap hasil kali baru terbang ke akumulator dan **melebur dengan nilai akumulator sebelumnya** (animasi merge "+").
- Setelah semua pasangan diproses, akumulator final terbang (fase Land) ke sel `c_ij`.
- Progres ditandai visual: sel-sel `c_ij` yang sudah selesai mendapat checkmark kecil; siswa mengulang proses untuk sel berikutnya sampai matriks C penuh.
- **Mode bantu (scaffold) yang bisa dimatikan**: di percobaan pertama sebuah sub-topik, urutan pasangan elemen yang harus di-drag ditandai angka kecil (①②③) di atas chip; setelah siswa naik level/mengulang topik, penanda ini hilang (tantangan penuh).

**Transpose:**
- Bukan drag manual per elemen (tidak edukatif jika mekanis begitu saja) — siswa men-drag **satu handle di sudut matriks** dan memutar/"melipat" secara diagonal; animasi menunjukkan seluruh grid berotasi 90°-lipat sepanjang diagonal utama sambil setiap chip elemen meluncur ke posisi barunya secara simultan (lintasan lurus, bukan lengkung — untuk membedakan visual dari operasi aritmatika).

**Determinan 2×2:**
- Dua diagonal (utama & sekunder) di-highlight warna beda (indigo vs coral). Siswa men-drag pasangan diagonal utama ke titik temu → merge jadi hasil kali pertama (`ad`). Ulangi untuk diagonal sekunder (`bc`) dengan hasil kali kedua. Kedua hasil kali ini di-drag ke **drop-zone "kurang"** → merge final menghasilkan skalar determinan yang "jatuh" ke sebuah kartu hasil bundar (bukan sel matriks, karena determinan bukan matriks).

**Determinan 3×3 (Sarrus):**
- Visual replikasi metode Sarrus: dua kolom pertama disalin otomatis (animasi *slide-clone* ke kanan matriks) membentuk tampilan 3×5. Tiga diagonal-turun (positif) di-highlight indigo, tiga diagonal-naik (negatif) di-highlight coral. Siswa men-drag tiap diagonal ke titik temu untuk membentuk 6 hasil kali, lalu 6 chip ini di-drag ke dua kelompok drop-zone ("jumlah positif" dan "jumlah negatif"), yang akhirnya di-merge dengan operator kurang menjadi hasil akhir.

**Invers 2×2:**
- Simulasi bertahap: (1) elemen `a` dan `d` di-drag saling **bertukar posisi** dengan animasi *swap arc* (dua lintasan lengkung saling menyilang), (2) elemen `b` dan `c` masing-masing di-drag ke sebuah "gerbang tanda" (⊖) yang mengubah tandanya (chip berputar 180° di sumbu Y, meniru efek "flip"), (3) determinan dihitung memakai simulasi di atas, (4) hasil matriks kofaktor "dibungkus" chip pecahan `1/det(A)` yang disapukan ke seluruh matriks (animasi staggered sama seperti perkalian skalar).

### 8.3 Aksesibilitas Interaksi
- Semua target drag punya alternatif klik-klik (klik sumber → klik tujuan) untuk siswa yang kesulitan drag presisi (motorik halus/perangkat sentuh kecil) — drag bukan satu-satunya jalur, hanya jalur "utama yang direkomendasikan".
- `prefers-reduced-motion` dihormati: animasi fase Fly & Merge dipercepat jadi crossfade sederhana (durasi <150ms) tanpa mengubah *urutan* pedagogis (highlight → hasil tetap muncul berurutan, hanya tanpa gerak lintasan panjang).

### 8.4 Standar Umpan Balik Kesalahan (Immediate Constructive Feedback)

Ini aturan wajib yang berlaku di **setiap** titik interaksi di seluruh aplikasi (simulasi Belajar, Whiteboard, maupun Kuis) — bukan hanya saran, tapi kriteria lulus/gagal untuk setiap fitur yang dibangun di fase coding.

> **Aturan:** indikator warna/getar/animasi "gagal" (border merah, chip memantul kembali, dsb.) **tidak boleh pernah berdiri sendiri**. Setiap kali interaksi siswa ditolak sistem, sebuah **Toast** (§7.4) wajib muncul bersamaan, berisi kalimat yang menjelaskan **kenapa** tindakan itu salah — merujuk konsep matematis yang relevan, bukan sekadar "Salah, coba lagi".

**Pola kalimat Toast yang wajib diikuti** (bukan generik, selalu spesifik ke konteks kesalahan):
- **Kesalahan ordo/syarat operasi:** sebut ordo aktual dan syarat yang dilanggar. *Contoh: "Belum bisa dijumlahkan — ordo A adalah $2\times3$ sedangkan B adalah $3\times2$. Penjumlahan matriks butuh ordo yang sama persis."*
- **Kesalahan posisi/pasangan elemen:** sebut alamat baris-kolom kedua elemen yang salah dipasangkan. *Contoh: "Posisi tidak seletak — $a_{11}$ ada di baris 1 kolom 1, sedangkan $b_{12}$ ada di baris 1 kolom 2."*
- **Kesalahan urutan langkah (mis. invers dikalikan dari sisi yang salah):** sebut bentuk persamaan yang sedang dikerjakan dan aturan urutannya. *Contoh: "Belum bertemu — karena bentuknya $AX=B$, $A^{-1}$ harus dikalikan dari sisi kiri pada kedua ruas."*
- **Kesalahan konseptual pada kuis (termasuk soal pilih-semua-benar):** untuk setiap pernyataan yang keliru dinilai siswa, tampilkan satu baris caption penjelas di bawah kartu tersebut (bukan cuma ikon ✗) yang menyebutkan nilai/fakta pembanding yang sebenarnya.
- **Kasus di mana jawaban tidak boleh dibocorkan langsung** (mis. tahap translasi narasi→matriks di Bab 4, yang sengaja dirancang agar siswa membaca ulang, bukan menebak — lihat `content/04_Pemodelan_TKA.md` §1): Toast tetap wajib memberi **petunjuk arah** yang konstruktif (mis. menunjuk jenis kesalahan: "sepertinya label ini tertukar dengan sel lain yang seletak") tanpa menuliskan nilai/label jawaban benarnya secara eksplisit.

Toast error memakai `--danger` sebagai aksen border/ikon (bukan latar penuh merah, agar tetap selaras palet §7.2), dan durasi tampil sedikit lebih lama dari Toast sukses (±5 detik) karena berisi teks yang perlu benar-benar dibaca, bukan sekadar dilirik.

---

## 9. Skema `localStorage`

Namespace tunggal untuk menghindari bentrok dengan data lain di origin yang sama:

```json
// key: "matriksLab.v1"
{
  "schemaVersion": 1,
  "profile": {
    "displayName": "Siswa",
    "createdAt": "2026-08-23T00:00:00.000Z",
    "lastActiveAt": "2026-08-23T00:00:00.000Z"
  },
  "progress": {
    "chapters": {
      "01_konsep_dasar": {
        "status": "in_progress",           // "locked" | "in_progress" | "completed"
        "subtopics": {
          "pengertian_letak": { "status": "completed", "bestQuizScore": 100, "attempts": 1 },
          "ordo_matriks":     { "status": "in_progress", "bestQuizScore": 0,   "attempts": 0 },
          "jenis_matriks":    { "status": "locked" },
          "transpose":        { "status": "locked" },
          "kesamaan_matriks": { "status": "locked" }
        }
      },
      "02_operasi_aljabar": { "status": "locked", "subtopics": { } },
      "03_determinan_invers": { "status": "locked", "subtopics": { } },
      "04_pemodelan_tka": { "status": "locked", "subtopics": { } }
    },
    "lastVisited": { "chapter": "01_konsep_dasar", "subtopic": "ordo_matriks" }
  },
  "quizHistory": [
    {
      "id": "q_1735.....",
      "mode": "latihan_bab" ,           // "latihan_bab" | "simulasi_tka"
      "chapter": "01_konsep_dasar",
      "startedAt": "2026-08-23T10:00:00.000Z",
      "finishedAt": "2026-08-23T10:04:12.000Z",
      "score": 80,
      "totalQuestions": 5,
      "correct": 4,
      "weakSubtopics": ["ordo_matriks"]
    }
  ],
  "achievements": {
    "badges": ["first_lesson_complete"],
    "unlockedAt": { "first_lesson_complete": "2026-08-20T09:00:00.000Z" }
  },
  "whiteboard": {
    "savedStates": [
      {
        "id": "wb_1735.....",
        "name": "Latihan PR halaman 42",
        "savedAt": "2026-08-22T19:00:00.000Z",
        "matrixA": { "rows": 2, "cols": 2, "values": [[1,2],[3,4]] },
        "matrixB": { "rows": 2, "cols": 2, "values": [[0,1],[1,0]] },
        "lastOperation": "multiply"
      }
    ]
  },
  "settings": {
    "reducedMotion": false,
    "animationSpeed": 1,              // 0.5 | 1 | 2
    "scaffoldHints": true,
    "soundEnabled": true
  }
}
```

**Catatan implementasi:**
- `schemaVersion` memungkinkan migrasi non-destruktif jika struktur berubah di rilis mendatang (`progressStore.js` menjalankan fungsi migrasi berurutan berdasarkan versi tersimpan).
- Status `locked` sub-topik dihitung dari urutan tetap yang didefinisikan di `data/lessons.json`, bukan disimpan sebagai keputusan independen, guna menghindari state yang saling bertentangan.
- Data whiteboard dibatasi (mis. maksimal 10 `savedStates` tersimpan, FIFO) supaya `localStorage` (kuota umum ~5–10MB) tidak membengkak.

---

## 10. Struktur Konten (aturan wajib untuk semua materi)

Setiap sub-topik di `content/*.md` — dan nantinya setiap objek sub-topik di `data/lessons.json` — **selalu** mengikuti urutan 3 bagian:

1. **Materi** — penjelasan teori dengan nada "Guru ke Siswa", termasuk analogi/konteks agar tidak terasa seperti buku teks kering.
2. **Kegiatan Interaktif / Simulasi Terpandu** — deskripsi presisi tentang apa yang akan dilakukan siswa di UI (drag elemen mana ke mana, animasi apa yang akan mereka lihat), ditulis cukup detail untuk langsung jadi spesifikasi teknis simulasi di fase coding.
3. **Mini Kuis** — 1–2 soal (konseptual dan/atau hitungan) yang harus dijawab benar untuk membuka sub-topik berikutnya.

Urutan ini identik dengan urutan render UI di Mode Belajar (§6.2), sehingga konten baru bisa "langsung pasang" ke renderer tanpa perubahan struktur kode.

---

## 11. Ruang Lingkup Fase Ini (Fase 1)

✅ Dibuat pada fase ini: `PRD.md`, folder `content/`, 4 file materi Markdown.
🚫 Belum dibuat (menunggu approval): `index.html`, seluruh `css/`, `js/`, `data/`, `assets/` — semua **kode** aplikasi.

Struktur folder di §4 adalah **proposal desain**, bukan cetak biru final — terbuka untuk direvisi berdasarkan review sebelum implementasi dimulai.
