# HANDOFF — Ruang Matriks

> Dokumen serah-terima antar sesi. Diperbarui **31 Agustus 2026**, menutup Fase 13.5.
> Status: **fase 1–13.5 selesai, seluruh pengujian otomatis hijau (21/21 + 409/409).**
>
> ✅ **FASE 13.5 SELESAI.** `ComboOpSim` kini engine **HIBRIDA**: tahap 1
> memakai mekanik `scalar_sweep` (chip skalar diseret/diketuk), tahap 2
> memakai `PairwiseTapSim`. Rinciannya di **§0A**.
>
> ✅ **FASE 13 SELESAI.** Kunci anti klik-beruntun dipasang SISTEMIK di seluruh
> engine, mekanik "titik temu" dicabut total, dan pemusatan banner/toast
> diperbaiki. Rinciannya di **§0**.
>
> **Fase 12** mengurut ulang kurikulum (Transpose sebelum Jenis-Jenis Matriks),
> menulis ulang materi Jenis-Jenis Matriks jadi 5 kategori/19 jenis, dan
> memperbaiki 11 temuan UAT. Ringkasannya di **§0B**.
>
> **Fase 11** menutup sembilan bug QA: kebocoran GSAP/timer, slider kembar,
> kemajuan multi-kasus, ketuk-ketuk, penjaga masuk, denyut, dan skala.
>
> **Fase 10** menetapkan arsitektur **Sidebar & Stage** — tidak berubah sejak itu.

---

## 0A. FASE 13.5 — ENGINE HIBRIDA COMBO (SELESAI)

Fase 13 menyeragamkan `combo_op` sepenuhnya ke `PairwiseTapSim`. Itu benar
untuk tahap 2, tetapi **salah untuk tahap 1**: perkalian skalar kehilangan
chipnya dan berubah jadi "klik sel sampai selesai".

Sebabnya pedagogis, bukan teknis. Kedua tahap mengajarkan gerakan yang
berbeda:

| Tahap | Yang diajarkan | Mekanik yang cocok |
|---|---|---|
| 1 · Perkalian skalar | SATU operand menyapu SEMUA elemen | Bawa satu chip ke tiap sel (`scalar_sweep`) |
| 2 · Penjumlahan | PASANGAN elemen seletak bertemu | Ketuk kiri, ketuk pasangannya (`PairwiseTapSim`) |

`ComboOpSim` karena itu jadi **hibrida** — dua mekanik, satu simulasi:

- **Tahap 1** — `createScalarChip()` + `makeDraggable(chip, { reusable: true })`,
  dan tiap sel $A$ jadi `registerDropZone`. Satu pendaftaran memberi DUA jalur
  sekaligus (seret ATAU ketuk chip lalu ketuk sel), keduanya bermuara ke
  `scaleCell()` yang sama — kontrak §5 butir 12 terpenuhi.
- **Tahap 2** — `attachPairEngine()`, kelas yang sama persis dengan
  `elementwise_op`.

**Pembongkaran antar-tahap** (yang paling mudah salah): sel $A$ yang SAMA
berganti peran dari drop-zone menjadi sumber ketukan. `startSumPhase()` karena
itu wajib melakukan empat hal sebelum memasang tahap 2:

1. Lepas seluruh drop-zone tahap 1 (`scalarCleanups`) — kalau tidak, zona lama
   tetap hidup di peta modul `dragDrop` dan menangkap ketukan tahap 2.
2. Panggil `chip._dragCleanup()` dan kunci chipnya.
3. `resetDragSystem()` — pilihan ketuk yang menggantung tidak boleh terbawa.
4. Buang indikator progres tahap 1; tahap 2 punya hitungannya sendiri.

Terukur setelah peralihan: **0 drop-zone tersisa, 0 sel `cell--awaiting`,
chip `pointer-events: none`.**

> "Titik temu" TETAP dicabut. Yang kembali hanyalah chip skalar di tahap 1 —
> bukan kotak putus-putus di tahap 2.

---

## 0. FASE 13 — KUNCI SISTEMIK & KONSISTENSI ENGINE (SELESAI)

### 0.1 Anti klik-beruntun, dipasang SISTEMIK

Dua primitif baru di `Simulation` (`simCore.js`) dipakai seluruh engine:

| Primitif | Guna |
|---|---|
| `claim(nama)` / `release(nama)` | Gerbang sekali-jalan yang menutup secara **sinkron**. Panggilan pertama `true`, sisanya `false` |
| `lockChoices(wadah, { keep })` | Mematikan SEMUA elemen terpilih di sebuah wadah — termasuk `div` yang tidak punya atribut `disabled` |

> **Mengapa `setBusy()` saja tidak cukup.** `busy` baru menyala SESUDAH
> penanganan dimulai — biasanya setelah sebuah `await`. Klik beruntun tiba di
> frame yang sama dan semuanya lolos pemeriksaan sebelum ada yang sempat
> menyalakan `busy`. `claim()` menutup celah itu tanpa menunggu apa pun.

> ⚠️ **JEBAKAN yang sempat menggigit di fase ini.** Percobaan pertama memakai
> `claim(\`case-${this.index}\`)` — dan **gagal total**, karena penangannya
> menaikkan `this.index` sendiri. Ketukan kedua meminta kunci dengan nama
> BERBEDA lalu lolos begitu saja; panel vonis tetap tergandakan tiga kali.
> Kunci WAJIB bernama tetap (`'advance'`), dilepas saat langkah berikutnya
> digambar. Bug ini tidak terlihat dari membaca kode — yang menangkapnya
> adalah audit klik-beruntun otomatis.

**Engine yang diperbaiki:**

| Engine | Sub-topik | Gejala sebelumnya |
|---|---|---|
| `SingularCheckSim` | singular_nonsingular | Kartu vonis menggandakan diri (terukur 3 panel), kasus melompat 0→3 |
| `PropertyCardsSim` | sifat_operasi | Pembuktian menumpuk, slide berikutnya dijadwalkan berulang |
| `IdentifyElementSim` | pengertian_letak | `if (this.busy)` ada tapi `busy` **tidak pernah dinyalakan** di jalur ini — langkah melompat 0→3 |
| `LabelMatrixTypesSim` | jenis_matriks | Label terakhir bisa menjadwalkan dua perpindahan kartu |
| `SplSolverSim` | spldv/spltv | "Kerjakan Penuh" menumpuk kotak penyelesaian |
| `PairwiseTapSim` | penjumlahan, kombinasi | Tombol "Hitung Sel Ini" bisa ditekan beruntun |
| `ComboOpSim` | kombinasi_operasi | Ketukan beruntun pada satu sel menjalankan dua animasi skalar |

**Sudah aman sejak sebelumnya** (diperiksa ulang, tidak diubah):
`OrdoBuilderSim` (`this.solved`), `OrdoCheckSim` (`this.answered`, Fase 12),
`PropertyCalculatorSim` (`this.resolved`, Fase 12), `MultiStatementSim`
(`this.checked`), `DataTranslationSim` (`this.computed`), `QuizEngine`
(`this.answered` + tombol dikunci di klik pertama).

### 0.2 "Titik temu" DICABUT TOTAL

`combo_op` adalah satu-satunya engine yang masih meminta siswa menyeret dua
elemen ke kotak putus-putus di tengah panggung, padahal
`elementwise_op` — yang secara matematis mengerjakan hal yang **sama** —
sudah memakai ketuk-ketuk sejak Fase 11. Dua mekanik untuk satu operasi
memaksa siswa mempelajari aplikasinya, bukan matriksnya.

Alih-alih menyalin kodenya, mekaniknya **diangkat menjadi kelas dasar
bersama** `PairwiseTapSim` (`simOperations.js`). Keduanya kini menjalankan
KODE YANG SAMA PERSIS:

```
ElementwiseOpSim extends PairwiseTapSim   ← penjumlahan_pengurangan
ComboOpSim       extends PairwiseTapSim   ← kombinasi_operasi
```

Kaitnya dua: `pairsEnabled()` (kapan ketukan diterima) dan `onPairsComplete()`.

Alur `combo_op` sekarang:
1. **Tahap 1** — ketuk tiap elemen $A$ → dikalikan skalar (tanpa seret).
2. **Tahap 2** — ketuk elemen di $kA$ → pasangan seletaknya di $B$ menyala →
   ketuk pasangan → bentuk $(8+1)$ muncul → "Hitung Sel Ini" → $9$ mendarat.

`createMeetPoint()` **dihapus dari `simCore.js`**; tidak ada lagi pemanggilnya.
Jangan hidupkan kembali — tambahkan mekanik baru sebagai turunan
`PairwiseTapSim`.

### 0.3 Pemusatan: dua bug, dua akar berbeda

| Elemen | Meleset | Akar masalah |
|---|---|---|
| Banner "Simulasi selesai" | **147px** | `.anim-rise` memakai `animation-fill-mode: both` dan keyframe-nya menulis `transform: translateY(...)`. Properti `transform` hanya satu — nilai animasi **MENGGANTIKAN** `translateX(-50%)`, bukan menambahinya. Tepi KIRI banner berhenti tepat di titik tengah panggung |
| Toast | **12px** | Ditambatkan ke `.ws-stage`, padahal kolom itu memakai `margin-right` negatif agar scrollbar memeluk tepi layar (kontrak §5 butir 23). Kotak KOLOM karena itu lebih lebar daripada kotak ISI |

Perbaikannya:
- Banner berhenti memakai `transform` untuk memusatkan; ia memakai
  `left:0; right:0; margin-inline:auto; width:fit-content` — kebal terhadap
  animasi apa pun.
- `toast.js` mengukur **kotak isi** (lebar dikurangi padding) dari
  `.workspace__body`, bukan kotak kolom.

Keduanya kini terukur **0px** dari sumbu tengah panggung.

> Pelajaran umum: jangan pernah memusatkan dengan `transform` pada elemen yang
> juga dianimasikan. Animasi menang, dan pemusatannya hilang tanpa jejak di
> CSS yang bisa dibaca.

### 0.4 Berkas yang berubah

| Berkas | Peran |
|---|---|
| `css/phase13.css` | **BARU** — `.is-locked`, pemusatan banner, tambatan toast |
| `js/modules/belajar/simulations/simCore.js` | `claim()`/`release()`/`lockChoices()`; `createMeetPoint()` dicabut |
| `js/modules/belajar/simulations/simOperations.js` | Kelas dasar `PairwiseTapSim`; `ComboOpSim` direfaktor; `PropertyCardsSim` dikunci |
| `js/modules/belajar/simulations/simDetInv.js` | `SingularCheckSim` dikunci |
| `js/modules/belajar/simulations/simBasics.js` | `IdentifyElementSim` & `LabelMatrixTypesSim` dikunci |
| `js/modules/belajar/simulations/simModeling.js` | `SplSolverSim` dikunci |
| `js/ui/toast.js` | Tambatan memakai kotak ISI |
| `js/modules/belajar/lessonRenderer.js` | Menambatkan ke `.workspace__body` |
| `index.html` | Memuat `css/phase13.css` |
| `tests/smoke.py` | Bagian 94–97 baru; bagian 18 & 89 diselaraskan |

### 0.5 Bukti

Audit klik-beruntun otomatis: **setiap** elemen yang bisa ditekan di panggung
diklik **enam kali beruntun dalam frame yang sama**, di 22 sub-topik × langkah
Simulasi & Mini Kuis. Hasil: tidak ada node hasil yang tergandakan, tidak ada
penunjuk langkah yang melompat.

### 0.6 Yang SENGAJA ditinggalkan

| Hal | Alasan |
|---|---|
| CSS `.meetpoint` di `simulations.css` | Tidak ada lagi yang memakainya, tetapi membuangnya menyentuh berkas lama tanpa manfaat perilaku. Aman dihapus kapan saja |
| Chip simbol `=` / `≠` di `sifat_operasi` masih memakai `makeDraggable` | `makeDraggable` sudah menyediakan jalur ketuk sekaligus (kontrak §5 butir 12), dan kedua jalurnya kini melewati kunci yang sama. Mengubahnya ke ketuk-murni di luar lingkup Fase 13 |

---

## 0B. FASE 12 — INTERAKSI LANJUTAN & PEMBARUAN KURIKULUM (SELESAI)

### 0.1 Kurikulum & isi

| # | Perubahan | Catatan |
|---|---|---|
| 1 | **Transpose kini mendahului Jenis-Jenis Matriks** di `data/lessons.json` | Tiga dari lima kategori jenis (simetris, simetris miring, ortogonal) DIDEFINISIKAN lewat transpose. Mengajarkan jenis lebih dulu memaksa siswa menghafal nama yang belum ada dasarnya |
| 2 | **Materi "Jenis-Jenis Matriks" ditulis ulang total** — 5 kategori, **19 jenis, 19 contoh matriks** | Menggantikan carousel 6-jenis. Blok materi baru: `typegroup` |
| 3 | **Tata letak simulasi label diperbaiki** | `.label-target` / `.label-shelf` / `.label-pool` / `.label-chip` sebelumnya **tidak punya CSS sama sekali** — itulah sebabnya teks rak menimpa label ordo |
| 4 | **Invers 2×2 & 3×3 → placeholder "Segera Hadir"** | Engine baru `coming_soon`. Mini Kuis tetap terbuka |

**Isi lima kategori** (semuanya diverifikasi dengan `js/engine/matrix.js`, bukan dikira-kira):

1. **Berdasarkan Ukuran** — baris, kolom, persegi panjang, persegi
2. **Berdasarkan Elemen Penyusun** — nol, diagonal, skalar, identitas, segitiga atas, segitiga bawah
3. **Berdasarkan Karakteristik Transpose** — simetris ($A^T = A$), simetris miring ($A^T = -A$, diagonal wajib nol), ortogonal ($A^T = A^{-1}$)
4. **Berdasarkan Sifat Operasi Aljabar** — idempoten, involutori, nilpoten, periodik · *ditandai "Catatan: Pengayaan materi"*
5. **Berdasarkan Eksistensi Invers** — singular, non-singular · *ditandai "Akan dipelajari lebih detail di Bab Determinan & Invers"*

> ⚠️ **Carousel materi ternyata rusak sejak Fase 7.** `phase7.css` §8 memasang
> `overflow: hidden` pada `.materi-carousel__track` **dan** `__slide` untuk
> membungkam scrollbar liar. Efeknya: slide ke-2 dan seterusnya diletakkan di
> luar kotak track lalu ikut terpotong — carousel **hanya pernah menampilkan
> slide pertama**. Itulah gejala "isi hilang dari nomor 2 ke atas". Kliping itu
> sudah diperbaiki di `phase12.css`, meski sekarang tidak ada lagi materi yang
> memakai carousel.

### 0.2 Tata letak & UI

| # | Keluhan | Akar masalah | Perbaikan |
|---|---|---|---|
| 5 | Toast terpusat ke seluruh jendela | `.toast-host` memakai `left: 50%` terhadap viewport | `anchorToasts(el)` baru di `toast.js` menyalurkan kotak `.ws-stage` ke `--toast-anchor-x/w`. Terukur **selisih 0px** dari pusat panggung |
| 6 | Bilah progres kartu bab gepeng jadi 2px | `.progressbar` ditulis sebagai `<span>` → **inline**, jadi `height` diabaikan dan lebarnya menyusut ke isi 0% | `display: block; width: 100%`. Terukur **338×8px** (sebelumnya 2×21px) |
| 7 | Scrollbar mendatar di bawah matriks | `.katex-display { overflow-x: auto }` memunculkan batang scrollbar begitu rumus lebih lebar sedikit saja | Batangnya disembunyikan (`scrollbar-width: none`), kemampuan gulir dipertahankan. `.ws-side__hint` diberi `overflow-x: hidden` + slider membungkus |

### 0.3 Mekanika simulasi

| # | Keluhan | Akar masalah | Perbaikan |
|---|---|---|---|
| 8 | Slider langkah tidak berguna di simulasi urutan-bebas | — | Slider dicabut dari Jumlah/Kurang; diganti `createProgressText()` → "**2 dari 4** sel selesai". `useStepsSilent()` baru menjaga pemulihan posisi tetap jalan. **Kesamaan ternyata memang belum pernah punya slider** — di sana hanya indikatornya yang ditambahkan |
| 9 | Interaksi mati setelah satu kasus tuntas | `complete()` memasang `sim--done` di **root simulasi**, dan `.sim--done .cell--draggable { pointer-events: none }` mematikan SELURUH kasus. `complete()` dipanggil begitu kasus PERTAMA selesai agar Mini Kuis terbuka | `locksOnComplete = false` untuk engine multi-kasus + `syncDoneLock()` yang baru mengunci kalau semua kasus tuntas |
| 10 | Kolom salinan Sarrus tidak berdenyut | `.cell--ghost { animation: none }`, **dan** `slideCloneColumns()` meninggalkan `opacity: 0.55` INLINE yang mengalahkan kelas | Salinan yang sudah tampil berganti kelas ke `.cell--copy`; opacity inline dibersihkan setelah animasi. Terukur: animasi & latar **identik** dengan sel asli |
| 11a | Kesamaan: sel sumber lain tidak terkunci | — | `lockOtherSources()`. Sisi KANAN sengaja tetap hidup agar salah-pasang tetap dijelaskan (kontrak §5 butir 3). Ketuk ulang sel yang sama = batal |
| 11b | Pilihan ganda bisa di-spam | Tidak ada penjaga; tiap klik menjadwalkan satu perpindahan kasus | `answered` + `freezeOptions()` mematikan semua tombol seketika |
| 11c | HOTS: soal tak terlihat, memakai seret | Soal hanya hidup di panel kiri lewat `setPrompt()` | Soal ditulis di panggung (`.hots__question`), seret → ketuk, kartu keliru **disingkirkan** |

### 0.4 Berkas yang berubah

| Berkas | Peran |
|---|---|
| `css/phase12.css` | **BARU** — dimuat PALING AKHIR, sesudah `phase11.css` |
| `data/lessons.json` | Urutan sub-topik Bab 1 |
| `data/chapters/01_konsep_dasar.json` | Materi Jenis-Jenis Matriks ditulis ulang |
| `data/chapters/03_determinan_invers.json` | Kedua invers → engine `coming_soon` |
| `js/modules/belajar/lessonRenderer.js` | `renderTypeGroup()`, tambatan toast |
| `js/modules/belajar/simulations/simBasics.js` | `ComingSoonSim`, kunci sumber Kesamaan, progres teks |
| `js/modules/belajar/simulations/simCore.js` | `createProgressText()`, `useStepsSilent()`, gerbang `locksOnComplete` |
| `js/modules/belajar/simulations/simOperations.js` | Isu 8, 9, 11b |
| `js/modules/belajar/simulations/simDetInv.js` | Isu 10, 11c |
| `js/modules/belajar/simulations/index.js` | Registry `coming_soon` |
| `js/ui/toast.js` | `anchorToasts()` |
| `js/app.js` | Lepas tambatan toast saat layar berganti |
| `index.html` | Memuat `css/phase12.css` |
| `tests/smoke.py` | Bagian 87–93 baru; bagian 19, 41, 49, 57, 58, 60, 77 diselaraskan |

### 0.5 ⚠️ CATATAN PENGUJIAN — TETAP BERLAKU

Peringatan Fase 11 **tidak dicabut**, dan Fase 12 menambah satu bukti lagi:
tiga dari sebelas bug ternyata berakar pada **gaya inline atau kaskade CSS**
(`opacity` inline dari GSAP, `<span>` yang inline, `overflow:hidden` yang
diwarisi) — semuanya tidak terlihat dari membaca JS, dan hanya ketahuan lewat
`getComputedStyle()` di peramban sungguhan.

Jadi tetap: **render, lihat, ukur di peramban, baru tulis pengujiannya.**

### 0.6 Yang SENGAJA ditinggalkan

| Hal | Alasan |
|---|---|
| Simulasi invers 2×2 & 3×3 | Diminta eksplisit jadi placeholder di Fase 12. Engine `inverse2x2` dan `adjoint_flow` **masih ada di kode** dan masih terdaftar; tinggal menukar kembali nilai `engine` di JSON kalau mau dihidupkan |
| Simulasi label masih 6 label | Materi kini mencakup 19 jenis, tetapi permintaan Fase 12 untuk simulasi ini hanya **tata letak**. Menambah label = mengubah kurikulum simulasi, di luar lingkup |
| Navigasi mundur ke slide "Syarat ordo" di Jumlah/Kurang | Konsekuensi mencabut slider sesuai permintaan. Siswa masih bisa mengulang lewat "Ulangi Simulasi" |

---

## 0C. FASE 11 — BUG SQUASHING (SELESAI)

Sembilan temuan QA manual, semuanya tertutup.

| Isu | Akar masalah | Perbaikan |
|---|---|---|
| **5** Animasi GSAP jalan terus | Timeline GSAP hidup di objek global; chip terbang menempel di `document.body` — keduanya selamat dari `innerHTML = ''` | `js/interactions/motion.js` → `killAllMotion()`, dipanggil di `mountScreen()` sebelum pembongkaran. Plus `this.later()` / `this.wait()` berjejak |
| **7** Slider dobel | `useSteps()` dipanggil ulang tiap render, sementara slider mendarat di panel kendali lewat `addHint()` — di luar jangkauan `resetStage()` | `useSteps()` idempoten lewat `disposeSlider()` |
| **3a** Seret mati usai pindah kasus | `zones` & `tapSource` adalah state tingkat-MODUL di `dragDrop.js` | `resetDragSystem()`; pelepas drop-zone dibuat idempoten |
| **3b** Progres kasus hilang | `buildCase()` selalu membangun ulang dari nol | `caseProgress: Map` + `repaintSolvedCells()`, dititipkan ke `sessionState` |
| **8** Jumlah/Kurang masih menyeret | — | `makeDraggable`/`registerDropZone` dicabut; alurnya mencerminkan `Det2x2Sim` |
| **4** Login bisa dilewati | Penjaga identitas hanya jalan sekali di `init()` | `router.setGuard()` berjalan tiap perpindahan; tombol rumah & cincin progres disembunyikan di `/login` |
| **2** Denyut cuma di garis tepi | — | Keyframe `hlPulse*Fill` menganimasikan `background-color`; kontras ≥4,5:1 diukur pada latar TERPEKAT |
| **1** Panggung mungil di layar besar | Ukuran dipaku piksel tetap | `clamp()` terikat viewport; sel 52→77→88px, panggung 331→497→560px di 1280/1920/2560 |
| **9** Kartu kuis melenceng | `.workspace__body` punya `padding-right: 4px` tanpa pasangan di kiri | Talang dicerminkan; melenceng **0px** |

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
| `python tests/smoke.py` | **409/409 lolos** |

Fase 9 menambah bagian 63–69; Fase 10 menambah bagian 70–76: identitas aplikasi,
sapaan masuk & hak cipta, penempatan header, arsitektur Sidebar & Stage (diukur di
tiga viewport), ruang napas matriks 3×3, presisi ordo & operator, dan akurasi
koordinat animasi setelah tata letak berubah.

Fase 11 menambah bagian 77–86 (46 pengujian): slider tidak kembar, Jumlah/Kurang
murni ketuk, gerak & timer benar-benar mati saat pindah layar, kemajuan
multi-kasus, penjaga layar masuk, gulir daftar bab, skala di tiga viewport, dan
kontras warna pada puncak denyut.

Fase 13 menambah bagian 94–97 (20 pengujian): audit klik-beruntun menyapu
seluruh sub-topik, kunci pilihan pada modul yang dilaporkan, Kombinasi Skalar
memakai mesin ketuk-ketuk yang sama, dan pemusatan banner/toast.

Fase 12 menambah bagian 87–93 (37 pengujian): urutan kurikulum, tata letak
simulasi label, tambatan toast, bilah progres, teks progres pengganti slider,
kunci multi-kasus, denyut salinan Sarrus, kunci Kesamaan, anti-spam pilihan
ganda, dan HOTS ketuk-ketuk.

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
│   ├── phase11.css                    Perbaikan sembilan isu QA (skala clamp,
│   │                                    gulir daftar, denyut berlatar, penjaga
│   │                                    layar masuk)
│   ├── phase12.css                    Kategori jenis matriks, tambatan toast,
│   │                                    panel Segera Hadir, HOTS ketuk
│   └── phase13.css                    ← DIMUAT TERAKHIR: kunci .is-locked,
│                                        pemusatan banner & toast
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
| 1 | `01_konsep_dasar` | pengertian_letak, ordo_matriks, **transpose, jenis_matriks** (ditukar di Fase 12), kesamaan_matriks |
| 2 | `02_operasi_aljabar` | penjumlahan_pengurangan, perkalian_skalar, kombinasi_operasi, ordo_perkalian, perkalian_matriks, sifat_operasi |
| 3 | `03_determinan_invers` | determinan_2x2, determinan_3x3, singular_nonsingular, sifat_determinan, invers_2x2, invers_3x3, persamaan_matriks |
| 4 | `04_pemodelan_tka` | translasi_data, spldv_matriks, spltv_matriks, analisis_multi_kondisi |

### Registry Simulasi

`js/modules/belajar/simulations/index.js` memetakan string ke kelas. **Kunci di registry HARUS sama persis dengan nilai `simulation.engine` di `data/chapters/*.json`.** Engine yang tidak terdaftar tidak melempar error — ia menampilkan empty-state dan tetap mengizinkan siswa lanjut ke Mini Kuis.

22 engine terdaftar (Fase 12 menambah `coming_soon`):

```
identify_element · ordo_builder · label_matrix_types · transpose_morph · equality_link
elementwise_op · scalar_sweep · combo_op · ordo_check · matrix_multiply · property_cards
det2x2 · det3x3_sarrus · singular_check · property_calculator · inverse2x2 · adjoint_flow · matrix_equation
data_translation · spl_solver · multi_statement
coming_soon
```

> `inverse2x2` dan `adjoint_flow` **masih terdaftar** meski kedua sub-topik
> invers untuk sementara memakai `coming_soon`. Menghidupkannya kembali cukup
> dengan menukar nilai `simulation.engine` di `data/chapters/03_*.json`.

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

37. **Slider langkah hanya untuk urutan yang BENAR-BENAR berurutan.** Simulasi yang selnya boleh dikerjakan dalam urutan bebas memakai `createProgressText()`, bukan navigasi maju-mundur yang menjanjikan urutan yang tidak ada. Kalau slider dicabut, `useStepsSilent()` tetap wajib dipanggil supaya pemulihan posisi (butir 28) tidak ikut hilang. (Fase 12, bagian uji 91.)

38. **"Selesai" pada engine multi-kasus berlaku per KASUS.** `complete()` membuka Mini Kuis, tetapi TIDAK boleh memasang `sim--done` selama masih ada kasus yang belum dikerjakan — kelas itu mematikan pointer-events seluruh simulasi. (Fase 12, bagian uji 92.)

39. **Umpan balik muncul dekat penyebabnya.** Toast ditambatkan ke kolom panggung lewat `anchorToasts()`, bukan dipusatkan ke jendela. (Fase 12, bagian uji 89.)

40. **Satu interaksi aktif pada satu waktu.** Saat sebuah pasangan sedang dikerjakan, sumber lain dikunci, dan harus selalu ada jalan membatalkannya (ketuk ulang). Tujuan yang salah tetap boleh diketuk supaya penolakannya bisa dijelaskan. (Fase 12, bagian uji 93.)

41. **Jawaban benar mengunci pilihannya seketika.** Tombol pilihan ganda dimatikan serempak begitu jawaban benar masuk; tanpa itu klik beruntun menjadwalkan beberapa perpindahan sekaligus. (Fase 12, bagian uji 93.)

42. **Soal ditulis di tempat siswa menjawabnya.** Pertanyaan tidak boleh hanya hidup di panel kendali sementara pilihannya ada di panggung. (Fase 12, bagian uji 93.)

43. **Salinan yang sudah tampil bukan lagi bayangan.** Kolom salinan Sarrus mewarisi seluruh logika sorot & denyut sel biasa. Awas gaya INLINE dari GSAP yang mengalahkan kelas. (Fase 12, bagian uji 93.)

44. **Setiap evaluasi yang benar WAJIB mengambil `claim()` lebih dulu, lalu memanggil `lockChoices()`.** `setBusy()` tidak cukup — ia menyala setelah penanganan dimulai, sementara klik beruntun tiba di frame yang sama. Nama kunci harus TETAP dan dilepas saat langkah berikutnya digambar; kunci yang namanya mengandung indeks yang ikut berubah TIDAK menahan apa pun. (Fase 13, bagian uji 94–95.)

45. **Satu operasi matematika = satu mekanik — tetapi operasi yang BERBEDA boleh punya mekanik berbeda.** Penjumlahan di mana pun memakai `PairwiseTapSim`; perkalian skalar di mana pun memakai chip yang dibawa ke tiap elemen. Simulasi yang memuat keduanya (`combo_op`) menjadi HIBRIDA, dan wajib membongkar mekanik tahap sebelumnya secara tuntas sebelum memasang yang berikutnya. Menyeragamkan paksa dua operasi berbeda ke satu mekanik justru menghapus pelajarannya. "Titik temu" tetap dicabut permanen. (Fase 13.5, bagian uji 96.)

46. **Jangan pernah memusatkan dengan `transform` pada elemen yang juga dianimasikan.** `transform` hanya satu properti: nilai dari `@keyframes` MENGGANTIKAN `translateX(-50%)`, bukan menambahinya. Pakai `left:0; right:0; margin-inline:auto`. (Fase 13, bagian uji 97.)

47. **Pemusatan diukur terhadap kotak ISI, bukan kotak kolom.** `.ws-stage` memakai margin negatif untuk talang scrollbar, jadi titik tengah kotaknya ~12px meleset dari sumbu matriks. (Fase 13, bagian uji 97.)

48. **Potret kini dikunci** — lihat butir 17. Aturan lama tentang potret yang boleh menggulir hanya berlaku sebelum Fase 9: boleh menggulir, tapi marginnya harus lega — bukan dimampatkan sampai sesak. (Fase 8, bagian uji 51.)

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
