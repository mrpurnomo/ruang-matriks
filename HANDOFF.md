# HANDOFF — Ruang Matriks

> Dokumen serah-terima antar sesi. Diperbarui **7 Oktober 2026**, menutup Fase 19.5.
> Status: **fase 1–19.5 selesai, seluruh pengujian otomatis hijau (21/21 + 656/656).**
>
> 🟢 **FASE 19.5 SELESAI — Rich Cards & Widescreen Optimization.** Dua masalah
> ruang kosong (60–70% layar kosong di bawah daftar bab/sub-topik) diperbaiki:
> layar Pilih Bab jadi kisi 2×2 kartu kaya mengisi layar; layar Sub-topik jadi
> papan dua-panel (ikhtisar bab + kisi kartu modul). Commit lokal menunggu.
> Rinciannya di **§000000000**.
>
> ✅ **FASE 19 SELESAI — PAPAN CORET BERDAMPINGAN & "PRESISI TENANG".** Soal
> dan kertas terlihat bersamaan, soal tetap bisa dijawab tanpa tahan-tombol atau
> buka-tutup. Rinciannya di **§00000000**.
>
> ✅ **FASE 18.5 SELESAI.** Lima temuan UAT: kalimat pertanyaan TKA yang belum
> ada, markdown mentah di layar, Mathpad yang membuang angka, kartu "Lencana"
> yang menipu, dan **papan coret yang hilang di mode ujian**. Rinciannya di
> **§0000000**.
>
> ✅ **FASE 18 SELESAI.** Mode Kuis jadi **simulator CBT**: tata letak dua kolom,
> navigasi bebas, umpan balik **tertunda**, riwayat percobaan tak terbatas, dan
> **Latihan Soal TKA** berisi 10 soal tetap — empat di antaranya soal asli TKA
> 2025. Arsip cetak soal ikut dibangkitkan. Rinciannya di **§000000**.
>
> ✅ **FASE 17 SELESAI.** Bab 4 ditulis ulang jadi masterclass TKA: **Translasi &
> Aturan Domino**, **Model Invers SPLDV gaya UTBK**, **Ekstraksi Elemen (Sniper)**,
> dan **Analisis Multi-Kondisi**. Rinciannya di **§00000**.
>
> ✅ **FASE 16 SELESAI.** Tiga sub-topik terakhir Bab 3 dibuka: **Invers 2×2**,
> **Invers 3×3 (Adjoin)**, dan **Penyelesaian Persamaan Matriks** — tiga di antara
> enam langkahnya memakai ULANG engine yang sudah ada sebagai sub-engine.
> Rinciannya di **§0000**.
>
> ✅ **FASE 15.5 SELESAI.** Poles papan coret dari temuan UAT: garis bersambung
> saat disapu cepat, **penghapus per-GORESAN** (bukan per-piksel), dan kanvas
> **PADAT** dengan mekanik Mengintip yang memudar halus. Rinciannya di **§000A**.
>
> ✅ **FASE 15 SELESAI.** Papan Coret: kanvas gambar di atas panggung dengan
> bilah alat mengambang dan mekanik **"Mengintip"** (tahan untuk melihat soal
> di bawahnya). Rinciannya di **§000**.
>
> ⚠️ **Catatan penomoran:** permintaannya menyebut ini "Fase 14", padahal nomor
> itu sudah dipakai layar muat + `localStorage`. Di dokumen ini ia dicatat
> sebagai **Fase 15** agar riwayatnya tetap runut.
>
> ✅ **FASE 14 SELESAI.** Layar muat bermerek (matriks 2×2 berdenyut warna
> royal → cyan → yellow), `#app` baru tampil setelah semuanya siap, identitas
> pindah ke `localStorage`, dan ada tombol **"Ganti Akun"**. Rinciannya di **§00**.
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

## MULAI DARI SINI (sesi baru)

Keadaan per **7 Oktober 2026**, sesaat setelah Fase 19.5 ditutup:

| | |
|---|---|
| Pekerjaan terakhir | **Fase 19.5 — Rich Cards & Widescreen Optimization** (§000000000). Selesai, teruji, menunggu commit lokal |
| Pengujian | `node tests/engine.test.mjs` → **21/21** · `python tests/smoke.py` → **656/656** |
| Git | Fase 19.5 = **perubahan belum di-commit** (3 berkas: `css/phase18.css`, `js/app.js`, `index.html`). 3 commit lokal di depan `origin/main`. Belum di-push (§1A) |
| Pekerjaan tertunda | Commit lokal Fase 19.5, lalu tunjukkan ke user untuk review visual |

### Tiga hal yang paling mudah dilanggar sesi baru

1. **Jangan `git push`.** Aplikasi ini dipakai siswa secara langsung dan remote
   tersambung ke hosting. Push selalu butuh izin baru — lihat **§1A**.
2. **Perbaikan CSS masuk ke berkas fase tertinggi** (`css/phase18.css`), karena
   `index.html` memuatnya paling akhir dan yang belakangan menimpa yang duluan.
3. **Ukur di peramban, jangan menyimpulkan dari kode.** Daftar panjang jebakan
   yang sudah menggigit ada di §6 dan §000 — hampir semuanya tak terlihat dari
   pembacaan kode.

`smoke.py` berjalan ±12 menit. Jalankan di latar belakang, jangan dikira
menggantung.

---


## 000000000. FASE 19.5 — RICH CARDS & WIDESCREEN OPTIMIZATION (SELESAI)

### 1. Masalah: 60–70% layar kosong di bawah daftar bab/sub-topik

UAT di layar penuh (≥1366×768, 1920×1080): daftar bab tampil sebagai 4 baris
tipis ±90px menempel di atas, sisanya putih polos. Daftar sub-topik serupa:
5–7 baris ±48px, lalu kosong. Tiga penyebab berlapis:

1. `.container { max-width: 1180px }` (layout.css) — terlalu sempit di widescreen.
2. `.workspace__body > * { width: min(1000px, 100%) }` (phase9.css) — konten
   dikunci 1000px, tidak ikut melebar.
3. `chapter-list` dan `subtopic-list` memakai `align-content: start` — baris
   hanya setinggi isinya, tidak ada alasan untuk tumbuh.

### 2. Solusi: tiga komponen baru yang mengisi layar

**A. Layar Pilih Bab** — Kisi 2×2 **Kartu Bab Kaya** (`chapter-list--rich`):
- `grid-auto-rows: minmax(min-content, 1fr)` — kartu tumbuh mengisi tinggi,
  bukan menempel di atas.
- Tiap kartu: nomor besar berwarna aksen bab, rumus matematis khas bab di panel
  kanan (kotak bertekstur titik-titik), silabus sub-topik mini dengan indikator
  ✓/→/🔒, bilah progres, tombol CTA kontekstual.
- Header bar punya statistik kanan: "x/22 sub-topik selesai" & "x% kurikulum".

**B. Layar Sub-topik** — Layout dua-panel **Papan Modul** (`module-board`):
- Kiri: **Panel Ikhtisar Bab** — nomor, judul, tagline, rumus, progres, tombol
  ajakan tunggal yang selalu tepat ("Lanjutkan: [sub-topik berikutnya]").
- Kanan: **Kisi Kartu Modul** — 2–4 kolom adaptif. Tiap kartu: nomor, chip
  status (Selesai/Berikutnya/Terbuka/Terkunci), judul, cuplikan kalimat pertama
  materi, 3 langkah (Materi · Simulasi · Mini Kuis), skor terbaik.
- Kartu terakhir: **Kartu Latihan Soal Bab** (gelap, membentang mengisi sel
  kosong di baris terakhir via `--span-*` CSS custom property).
- Kolom otomatis: 4 kolom ≥1500px, 3 kolom menengah, 2 kolom <1100px.

**C. Penyebab void diatasi di CSS phase18.css §19.C:**
```
.container { max-width: min(1440px, 94vw) } @media ≥1200px
.container { max-width: min(1720px, 92vw) } @media ≥1700px
.workspace--board > .workspace__body > .chapter-list--rich,
.workspace--board > .workspace__body > .module-board { width: 100%; }
```

### 3. Bug QA: kartu terakhir tidak bisa diklik di 844×390 (Fase 19.5-fix)

Smoke.py Bagian 84 menguji bahwa item terakhir daftar sub-topik terlihat DAN
bisa diklik di viewport 844×390 (landscape sempit). Kegagalan: `lastClickable: false`.

**Akar masalah:** Kartu modul (±160px tinggi) terlalu tinggi di landscape sempit,
sehingga saat `workspace__body` di-scroll habis, `getBoundingClientRect().top`
kartu terakhir bisa negatif atau sangat kecil. Titik tes `elementFromPoint`
jatuh di `lr.top + 15px` yang bisa berada di luar area workspace__body.

**Fix:** Di media query `(orientation: landscape) and (max-height: 560px)`,
tambahkan:
- `module-card__steps { display: none }` — hilangkan chip 3 langkah.
- `module-card { padding: 10px 12px; gap: 6px }` — kartu lebih ringkas.
- `module-card__foot { padding-top: 6px }` — kurangi jarak kaki.
- `workspace--board > .workspace__body { padding-bottom: 16px }` — scroll ekstra
  sehingga kartu terakhir bisa sepenuhnya masuk area klik.

### 4. Berkas yang diubah

| Berkas | Perubahan |
|---|---|
| `js/app.js` | Tulis ulang `renderChapterList` (→ kartu kaya), `renderSubtopicList` (→ papan modul), `renderQuizMenu` (→ kartu bank kaya). +351 baris, -77 baris. |
| `css/phase18.css` | Tambah §19.C (~900 baris): sistem aksen per bab, kerangka `workspace--board`, kartu bab kaya, papan modul, kisi kartu modul, papan kuis, responsif 3 breakpoint. |
| `index.html` | Cache-busting: semua `<link>` CSS naik dari `?v=19` ke `?v=19.6`. |

### 5. Selektor yang dipantau smoke.py (tetap terpenuhi)

- `.chapter-item`, `.chapter-item--completed`, `.chapter-item .progressbar` — ada
  di `chapter-item--rich` via class ganda.
- `.subtopic-item[data-state]`, `.subtopic-item:disabled` — ada di
  `subtopic-item.module-card`.
- `.workspace__body` bisa di-scroll, item terakhir terlihat dan bisa diklik —
  diverifikasi Bagian 84.

### 6. Hasil pengujian

- `engine.test.mjs`: **21/21** ✅
- `smoke.py` (setelah fix §19.5-bug): **656/656** ✅

---

## 00000000. FASE 19 — PAPAN CORET BERDAMPINGAN & "PRESISI TENANG" (SELESAI)


### 1. Masalah: papan coret menutupi soal

Umpan balik siswa: *untuk melihat lagi angka matriks atau teks soal, mereka
harus menutup papan lalu membukanya lagi, atau menahan tombol mata sambil
menghitung.* Akar masalahnya sudah diramalkan di §000A ("Catatan pedagogis"):
sejak kanvasnya PADAT, soal dan coretan tidak pernah bisa terlihat
bersamaan, dan Mengintip berubah dari kemewahan menjadi jalur wajib.
Memperbaiki mekanik Mengintip hanya meringankan gejala — setiap angka yang
dibaca tetap butuh satu tahanan.

### 2. Solusi: kertas DI SAMPING soal, bukan di atasnya

Cara orang menghitung di dunia nyata: kertas buram ditaruh di sebelah buku
soal. Papan coret kini punya tiga tata letak, dipilih lewat menu berlabel
"Tata letak" di bilah alat:

| Tata letak | Perilaku | Untuk |
|---|---|---|
| **Berdampingan** (BAWAAN) | Kertas di kanan panggung; `.workspace__body` diberi margin kanan selebar kertas sehingga soal **mengalir ulang** di kiri | Hampir semua hitungan |
| **Kertas penuh** | Perilaku Fase 15.5: kertas selebar panggung + Mengintip | Hitungan yang sangat panjang |
| **Kalkir** | Kertas tembus pandang di atas soal | Menandai soalnya sendiri: melingkari elemen, menarik diagonal Sarrus di matriks aslinya |

Yang membuat berdampingan benar-benar *frictionless*: soal di kiri **tetap
hidup**. Siswa bisa memilih jawaban, mengisi Mathpad, dan menjalankan simulasi
tanpa menutup papan. Terukur di bagian uji 117: memilih opsi B saat papan
terbuka → `aria-checked`, kisi navigasi "terisi", papan tetap terbuka.

> Kalkir sengaja BUKAN bawaan. UAT Fase 15.5 menyebut lapisan tembus sebagai
> beban kognitif bila ia satu-satunya pilihan; sebagai pilihan sadar untuk
> menandai soal, ia justru berguna.

**Pembatas soal | kertas** (`.pad__grip`, kontrak §5 butir 12): **seret**
untuk lebar presisi, **ketuk** untuk berputar di antara 40% → 50% → 60%,
panah kiri/kanan dari papan ketik. Lebarnya dijaga dua lapis: rasio
36–64% (keinginan siswa) DAN piksel (kertas ≥ 400px, soal ≥ 300px).

**Panggung sempit** (< 700px, mis. lanskap ponsel 844×390): berdampingan
tidak masuk akal — kedua separuhnya terlalu sempit. Papan tampil sebagai
kertas penuh, opsi "Berdampingan" di menu dinonaktifkan, tetapi **pilihan
siswa tidak diubah**: begitu layarnya cukup lebar lagi, ia kembali
berdampingan.

**Ingatan per perangkat.** Tata letak dan rasio disimpan di `localStorage`
(`matriksLab.scratchpad.v1`), dibungkus `try/catch` — mode privat tetap
jalan tanpa ingatan. Siswa yang lebih suka kertas penuh tidak perlu
memilihnya ulang di setiap sub-topik.

**Bilah alat ringkas.** Di kertas < 620px, deret warna dan ketebalan dilipat
ke balik satu tombol pemicu (menampilkan warna/tebal yang aktif); ketukan
membuka baki kecil di atas bilah. Elemen `.pad__swatch` / `.pad__width` SAMA
di kedua bentuk — yang berubah hanya CSS-nya, sehingga seluruh selektor dan
pengujian Fase 15 tetap berlaku.

**Detail lain:** kepala kertas ("Kertas Coretan" + keterangan tata letak +
tombol tutup); tombol pembuka menjadi pil bertinta berlabel **"Coret"** dan
menyingkir saat papan terbuka; tombol mata disembunyikan pada tata letak
berdampingan (tidak ada yang perlu diintip — mesinnya tetap utuh).

### 3. "Presisi Tenang" — sistem visual

Prinsipnya ditulis lengkap di kepala §19.B `css/phase18.css`. Ringkasnya:

1. **Warna adalah sinyal, bukan dekorasi.** Latar, kartu, panel netral dan
   bersuhu rendah; saturasi merek hanya untuk aksi utama, posisi aktif, status.
   Blob latar tetap tiga, tetapi kini cahaya ambien (alfa .07–.13, 60–72 detik).
2. **Kedalaman dari cahaya, bukan garis tebal.** Garis rambut 1px + bayangan
   berlapis (ambien + kunci) menggantikan bayangan biru tebal.
3. **Tipografi berjenjang.** Judul Montserrat 800 (bukan 900); teks bacaan
   panjang memakai `--ink-read` (#21325C, ±12:1 — tetap jauh di atas AA, tidak
   menyilaukan); angka selalu `tabular-nums`.
4. **Presisi geometris.** Tombol bersudut 14px (bukan pil), satu skala radius.

Perubahan yang paling terasa:

| Area | Sebelum | Sesudah |
|---|---|---|
| Soal ujian berkonteks | Seluruh paragraf Montserrat tebal | Konteks = teks bacaan Roboto; hanya **kalimat pertanyaan** (`after`) yang tegas, bergaris biru di kiri |
| Kotak keterangan (`.callout`) | Bidang merah muda/biru pekat selebar kartu | Warna hanya di garis & ikon; bidangnya nyaris putih |
| Tombol utama | Gradien royal→cyan yang bergeser saat disorot | Royal padat dengan kilau atas tipis |
| Layar Penuh | Pil gradien yang bersaing dengan aksi utama | Kaca bertinta (aksi sekunder) |
| Tab langkah | Pil biru pekat | Kontrol segmen: tab aktif = kartu putih |
| Panggung simulasi | Kartu-dalam-kartu, dua bayangan | Pelat tanpa bayangan di dalam kartu |
| Kartu statistik menu | 3 kartu di kisi 2 kolom → satu lubang | Skor TKA membentang penuh |
| Menu kuis | Label "Latihan per Bab" menempel ke kartu TKA | Jarak kelompok yang benar |
| Sapaan menu | — | Matriks identitas $I_2$ samar sebagai tanda tangan |

> ⚠️ **Token SUMBER tidak diubah** (`--paper`, `--royal`, `--cyan`,
> `--yellow`, `--magenta`, `--ink`, Montserrat/Roboto, tiga blob): itu
> identitas merek dan dipatok pengujian §6/§16/§98. Yang dimurnikan adalah
> token TURUNAN (`--sh-*`, `--border-*`, `--shadow-*`) dan cara komponen
> memakainya. Kalau ingin mengganti merek, ubah pengujiannya dengan sadar.

### Jebakan yang sudah digigit (jangan diulang)

1. **Koordinat 0..1 MEREGANGKAN tulisan begitu lebar kertas bisa berganti.**
   Selama kertas hanya satu ukuran, normalisasi Fase 15 tidak terasa. Dengan
   tiga tata letak dan pembatas yang diseret, angka "8" yang ditulis di kertas
   435px menjadi gepeng dua kali lipat di kertas 869px. Goresan kini disimpan
   dalam **piksel CSS relatif sudut kiri-atas kertas**: kertas yang menyempit
   hanya menyembunyikan bagian kanannya, dan tulisannya muncul lagi utuh saat
   dilebarkan. Bagian uji 117 mengukur **bentang** tinta (±2px), bukan jumlah
   pikselnya — lihat butir 6.
2. **Spesifisitas baki ringkas menimpa menu tata letak.** Aturan
   `.pad[data-compact] .pad__tray` (0-3-0) memusatkan ulang menu yang
   seharusnya ditambatkan ke tepi kanan, dan menu meluap keluar layar.
   Selektor menunya diperberat (`.pad .pad__tray.pad__tray--menu`).
3. **Escape milik lapisan paling atas.** Sejak soal hidup di sebelah papan,
   Mathpad bisa terbuka bersamaan. Pendengar Mathpad baru dipasang saat pad
   angka dibuka, jadi pendengar papan coret menyala LEBIH DULU — tanpa
   penjagaan, satu Escape membatalkan isian sekaligus menutup papan. Papan
   kini mengalah bila `.mathpad[data-open="true"]` atau modal terbuka.
4. **`setPointerCapture` MELEMPAR untuk pointer yang tidak aktif.** Di
   pembatas ia dibungkus `try/catch`; seretan tetap jalan tanpa tangkapan.
   (Pengujian sintetis memakai `pointerId: 1` — id tetikus Chrome yang selalu
   aktif — karena itulah kanvas Fase 15 tidak pernah tersandung.)
5. **Batas rasio saja tidak cukup.** 36% dari panggung 843px = 303px, dan
   bilah ringkas (±367px) terpaksa membungkus dua baris. Rasio menyatakan
   keinginan siswa; batas PIKSEL menjamin kedua sisi tetap bisa dipakai.
6. **Jumlah piksel tinta bukan bukti "tidak meregang".** Goresan hidup
   digambar per ruas, gambar ulang satu path — anti-aliasing berbeda ±4%
   (kerabat catatan bagian 102). Yang membedakan koordinat piksel dari 0..1
   adalah BENTANG mendatarnya.
7. **Pane peramban yang tersembunyi memperlambat GSAP** (penegasan §000
   butir 4). Kolom salinan Sarrus sempat tampak bertumpuk — padahal animasinya
   hanya tersendat. Verifikasi visual Fase 19 memakai Playwright headless.

### Kontrak yang TETAP dipenuhi

Selektor `.pad`, `.pad-fab`, `.pad__canvas`, `.pad__bar`, `.pad__peek`,
`.pad__group` (5 grup: Alat · Warna · Ketebalan · Tindakan · Tampilan),
4 `.pad__swatch`, 3 `.pad__width`, label tombol, latar kanvas putih PADAT +
petak, transisi Mengintip 0.2s ease-in-out, batas undo 20, penghapus
per-goresan — semuanya utuh; bagian uji 101–104 dan 116 lolos tanpa diubah.

### Berkas yang berubah

| Berkas | Peran |
|---|---|
| `js/ui/scratchpad.js` | Tiga tata letak, pembatas seret/ketuk, baki lipat, kepala kertas, ingatan per perangkat, koordinat piksel, Escape berlapis |
| `js/ui/icons.js` | Ikon `layout-split`, `layout-full`, `layout-trace`, `grip` |
| `css/phase18.css` | **§19.A** papan coret berdampingan · **§19.B** sistem visual "Presisi Tenang" |
| `tests/smoke.py` | Bagian **117–118** baru (24 pengujian) |

---

## 0000000. FASE 18.5 — POLES AKHIR (SELESAI)

Lima temuan UAT ditutup. Tidak ada arsitektur yang berubah; semuanya
perbaikan yang membuat aplikasi berhenti membohongi siswa.

### 1. Soal TKA berhenti sebelum bertanya

Soal 1 berbunyi *"Perhatikan matriks berikut!"*, menampilkan matriks $F$,
lalu langsung menyodorkan lima pilihan — **pertanyaannya tidak pernah
ditulis.** Siswa harus menebak apa yang diminta.

Keempat soal TKA kini berbentuk seragam:

| Bagian | Isi |
|---|---|
| `prompt` | konteks / cerita |
| `tex` atau `table` | data (matriks atau tabel) |
| `after` | **kalimat pertanyaannya**, berdiri tepat di atas pilihan |

Soal 2 dan 3 pertanyaannya sebelumnya terkubur di ekor cerita; keduanya
dipindah ke `after`. Soal 2 juga mendapat tabel kebutuhan pakan (sebelumnya
prosa) supaya datanya bisa dibaca sekilas. `TKA_ARCHIVE.md` dibangkitkan ulang.

### 2. Markdown mentah — dan `renderMixed()` TIDAK bersalah

Layar menampilkan `**lebih dari satu**` beserta bintangnya. Sempat terbaca
seperti kelemahan `renderMixed()`, padahal fungsi itu sudah lama menangani
`**tebal**` dengan benar (`applyLightMarkdown` di `katexRenderer.js`).

> ⚠️ Yang keliru: `examEngine.js` menaruh teks ber-markdown langsung ke
> `el(tag, cls, html)`, dan argumen ketiga itu masuk sebagai **`innerHTML`
> mentah**. Teks apa pun yang memuat markdown WAJIB melewati `renderMixed()`
> lebih dulu. Memperbaiki `renderMixed` untuk kasus ini akan menambal
> fungsi yang sehat dan meninggalkan penyebabnya utuh.

### 3. Mathpad membuang angka yang sudah diketik

Mengetuk di luar pad memanggil `close(true)` — jalur pembatalan yang sama
dengan Escape — sehingga angka yang sudah diketik lenyap. Di isian matriks
berisi empat sampai sembilan sel, satu jari yang meleset berarti mengulang
seluruh pengetikan.

`close()` kini menerima opsi, dan ketiga jalurnya punya arti berbeda:

| Gestur | Perilaku |
|---|---|
| Centang / Enter | commit, lalu tutup |
| **Ketuk di luar pad** | **commit otomatis**, lalu tutup |
| **Escape** | batal — dan **kotaknya dikembalikan** ke nilai semula |
| Pindah layar (`closeMathpad()`) | commit otomatis |

> ⚠️ **Auto-simpan TIDAK boleh dipasang di tiap ketukan tombol.** Sebagian
> pemakai menilai jawaban tepat saat `onCommit` (mis. berburu kofaktor di
> Fase 16); mengirim per digit akan menyalahkan "1" sebelum siswa sempat
> mengetik "16". Karena itu penyimpanannya terjadi saat pad DITUTUP, dengan
> dua penjagaan: isian kosong tidak pernah dikirim (ia akan menimpa nilai
> lama dengan kekosongan), dan isian yang **tidak berubah** juga tidak —
> membuka lalu menutup pad tanpa mengetik apa pun bukan sebuah jawaban.

> ⚠️ **Escape wajib mengembalikan isi kotaknya.** `sync()` menulis tiap
> ketukan langsung ke field sebagai pratinjau berjalan, jadi membatalkan
> tanpa memulihkan meninggalkan angka yang TERLIHAT di kotak padahal tidak
> pernah tersimpan — layar mengatakan "99" sementara ujian mencatat soal itu
> masih kosong. Kotak yang berbohong lebih berbahaya daripada kotak kosong.

`mountScreen()` kini juga memanggil `closeMathpad()`. Pad hidup di
`document.body`, jadi tanpa itu ia tetap mengambang di atas layar berikutnya
— cacat yang sudah ada sejak lama dan baru ketahuan sekarang.

### 4. Kartu "Lencana" menipu

Dasbor menampilkan "N Lencana terbuka", padahal **sistem lencananya tidak
pernah ada**: `unlockBadge()` memang menyimpan penanda, tetapi tidak ada satu
layar pun yang menampilkan lencana, menjelaskan artinya, atau bisa dibuka
siswa dengan sengaja. Angka yang tidak bisa ditelusuri lebih buruk daripada
tidak ada angka.

Diganti **"Skor TKA tertinggi"**, dibaca dari riwayat percobaan di
`localStorage`. Belum pernah mencoba berarti **"Belum ada"** — bukan "0",
yang akan terbaca seperti nilai nol.

### 5. Papan coret di mode ujian (KRITIS)

Soal TKA menuntut hitungan panjang, dan mode ujian sama sekali tidak punya
tempat mencoret — siswa harus mengambil kertas, dan begitu matanya turun ke
kertas, konteks soalnya hilang. Itu persis alasan papan ini dibuat di Fase 15.

`ExamEngine.buildLayout()` menambatkannya ke `.ws-stage`, sama seperti mode
Belajar, sehingga **seluruh CSS papan berlaku apa adanya** — tidak satu baris
gaya baru pun ditambahkan.

> ⚠️ Papan dibuat **sekali per sesi ujian**, bukan per soal: coretan hitungan
> harus bertahan saat siswa melompat antar soal, dan di ujian melompat lalu
> kembali adalah hal yang biasa. Terukur: goresan dan tintanya utuh setelah
> berpindah soal, dan tetap satu papan / satu tombol.
>
> `ExamEngine` karena itu mendapat `destroy()`, didaftarkan sebagai
> `state.activeView`, dan **dibongkar juga sebelum "Ulangi Ujian"** —
> papan memegang `ResizeObserver` dan listener di `window` yang tidak ikut
> mati oleh `innerHTML = ''` (kontrak §5 butir 31).

### Berkas yang berubah

| Berkas | Peran |
|---|---|
| `js/ui/mathpad.js` | `close()` berbasis opsi; auto-simpan saat ditutup dari luar; pemulihan kotak saat dibatalkan |
| `js/modules/kuis/examEngine.js` | Papan coret + `destroy()`; petunjuk ber-markdown lewat `renderMixed()` |
| `js/app.js` | `closeMathpad()` di `mountScreen()`; kartu Skor TKA tertinggi + `skorTkaTertinggi()`; pembongkaran sesi sebelum mengulang |
| `data/quizzes.json` | Kalimat pertanyaan keempat soal TKA; tabel pakan soal 2 |
| `content/TKA_ARCHIVE.md`, `content/QUIZ_ARCHIVE.md` | Dibangkitkan ulang |
| `tests/smoke.py` | Bagian **114–116** baru |

---

## 000000. FASE 18 — MESIN UJIAN CBT & ARSIP SOAL (SELESAI)

Mode Kuis mandiri berubah dari "slider soal dengan umpan balik langsung"
menjadi **simulator CBT** bergaya UTBK/SNBT: tata letak dua kolom, navigasi
bebas, jawaban tertunda, dan penilaian serentak saat dikumpulkan.

### Dua kelas, dua kontrak — `QuizEngine` TIDAK disentuh

| | `QuizEngine` (lama) | `ExamEngine` (baru) |
|---|---|---|
| Dipakai | Mini Kuis di dalam sub-topik | Mode Kuis mandiri `#/kuis/:mode/:bank` |
| Umpan balik | **Langsung** — "Periksa Jawaban" | **Tertunda** — sampai dikumpulkan |
| Navigasi | Terkunci berurutan | **Bebas**, semua soal selalu terbuka |
| Filosofi | *Mastery learning* | Simulasi ruang ujian |

Menyatukan keduanya akan membuat setiap cabang `if` di dalamnya berarti dua
hal sekaligus. Mini Kuis memang HARUS memberi umpan balik langsung — siswa
perlu menjawab benar untuk membuka sub-topik berikutnya.

### 1. Tata letak CBT dua kolom

Arsitektur Sidebar & Stage yang sama dengan mode Belajar (kontrak §5 butir 21),
terukur **27,9% / 72,1%**. Kolom kiri memegang info ujian, riwayat percobaan,
dan **kisi navigasi soal** (tombol 1..N, masing-masing 48×44px). Panggung
kanan hanya berisi soalnya.

### 2. Umpan balik tertunda

`this.answers` menyimpan satu slot per soal (`null` = belum dijawab), dan
bentuknya mengikuti tipe soal: string · indeks · array indeks · matriks string.
Kisi navigasi membaca slot itu untuk menandai *terisi/kosong*.

> **Isian matriks punya DUA penyimpanan.** `drafts` menampung isian setengah
> jadi supaya angka yang sudah diketik tidak hilang saat siswa melompat ke soal
> lain; `answers` hanya terisi kalau SELURUH selnya penuh. Matriks separuh
> bukan jawaban, dan kisi navigasi tidak boleh menandainya "terisi".

Pengumpulan dikonfirmasi lewat **Modal** (kontrak §5 butir 1) yang menyebut
berapa soal masih kosong dan menyatakan terus terang bahwa kosong dihitung
salah.

### 3. Riwayat percobaan tak terbatas

Skor disimpan lewat `saveQuizResult()` yang sudah ada (`localStorage`,
`quizHistory`, kapasitas 50). `attemptsFor(mode, bankId)` menyaring dan
**menomori ulang** hasilnya — tanpa itu, "Percobaan 1" pada Bab 3 bisa berarti
percobaan ke-9 secara keseluruhan.

> ⚠️ Riwayat DIBACA ULANG tiap kali panel digambar (`options.getHistory`),
> bukan disalin sekali saat konstruksi. Percobaan yang baru dikumpulkan
> disimpan lewat `onFinish` dan panelnya digambar ulang tepat sesudahnya —
> dengan daftar statis, nilai yang baru diperoleh siswa tidak pernah muncul
> di riwayatnya sendiri (terukur: panelnya kosong padahal skornya tersimpan).

### 4. Latihan Soal TKA — 10 soal, urutan TETAP

"Simulasi TKA" berganti nama jadi **"Latihan Soal TKA"** (id rute
`simulasi_tka` sengaja dipertahankan supaya tautan lama tidak mati).

Setnya **tidak lagi diundi**. `tkaSimulation.questionOrder` memuat sepuluh id
soal berurutan; `buildTkaSet()` merangkainya dari seluruh bank. Alasannya:
empat soal pertama adalah **soal asli TKA 2025** dan harus selalu muncul —
mengundinya berarti sebagian siswa tidak pernah menemuinya. Jalur undian lama
tetap didukung untuk konfigurasi tanpa `questionOrder`.

| No | Soal | Tipe | Kunci |
|---|---|---|---|
| 1 | Invers matriks $F$ (TKA 2025 no. 1) | A–E | **E** |
| 2 | Sapi & kambing, SPLDV (no. 2) | A–E | **E** |
| 3 | Pabrik minuman WJ/BK/KA (no. 3) | A–E | **C** |
| 4 | Kapasitas hotel (no. 4) | pilih semua | **C, E** |
| 5–10 | Enam HOTS pilihan dari bank bab | campuran | lihat `TKA_ARCHIVE.md` |

> ⚠️ **Naskah asli soal no. 3 tidak konsisten, dan itu dibiarkan apa adanya.**
> Total $J$ dan $GM$ pada naskahnya tidak cocok dengan matriksnya
> ($20(100)+10(120)+12(80) = 4160$, bukan 4360; $15(100)+25(120)+8(80) = 5140$,
> bukan 4960). Baris **air** konsisten dan memberi $k = 40$ — jawaban C.
> Soal ditranskrip verbatim karena memang begitulah yang dihadapi siswa di
> ujian, dan pembahasannya menyebut ketidakcocokan itu terus terang. Justru di
> sinilah teknik Sniper (Fase 17) menyelamatkan: baris yang tidak konsisten
> tidak pernah disentuh.

### 5. Arsip soal — DIBANGKITKAN, bukan ditulis tangan

`content/QUIZ_ARCHIVE.md` (20 soal per bab) dan `content/TKA_ARCHIVE.md`
(10 soal + tabel ringkasan kunci) dibangun oleh
**`python tests/archive_soal.py`** dari `data/quizzes.json`.

Jangan menyuntingnya langsung — suntingannya hilang pada pembangkitan
berikutnya. Ubah JSON-nya lalu jalankan ulang skripnya. Dengan begitu arsip
guru tidak akan pernah menyimpang dari soal yang benar-benar dilihat siswa,
dan itulah satu-satunya cara arsip cetak tetap bisa dipercaya.

### Hasil QA seluruh bank soal

Kedua puluh soal lama diverifikasi ulang secara matematis dengan
`js/engine/matrix.js` (bukan dicocokkan dengan kunci yang sudah ada):
**semuanya valid**. Satu temuan nyata:

- **`b4_04` menunjuk sub-topik `spltv_matriks`** yang dicabut di Fase 17.
  Tautan remedial dari layar hasil kuis akan mendarat di rute mati. Dialihkan
  ke `ekstraksi_elemen`, dan `SUBTOPIC_LABELS` di `quizResult.js` ikut
  diselaraskan dengan judul Bab 4 yang baru.

### Jebakan yang sudah digigit (jangan diulang)

1. **`renderMixed()` tidak mengenal tabel markdown.** Soal hotel sempat
   menampilkan pipa mentah `| Tipe Kamar | Hotel A | …` di layar. Tabel
   ditulis sebagai DATA (`q.table = {headers, rows}`) dan dibangun sebagai
   node DOM, memakai `.data-table` yang sama dengan Bab 4. Field `q.after`
   menampung kalimat pertanyaan yang harus berdiri SESUDAH tabel — kalau ia
   ikut di `prompt`, siswa membaca pertanyaannya sebelum melihat datanya.
2. **Kurung matriks nyaris menyentuh kotak isian.** Kurung digambar sebagai
   `::before`/`::after` selebar 9px di tepi `.matrix__bracket`, dan padding
   bawaan menyisakan jarak yang terlalu tipis untuk kotak `.numfield` yang
   besar. Sekarang: padding kurung diperlebar khusus mode isian, grid pakai
   gap sendiri, dan wadahnya menggulir mendatar bila layarnya benar-benar
   sempit. Terukur jarak **20px** di 1280×860 maupun 844×390.
3. **`multi_select` menyala-mati.** Skrip pengujian yang mengetuk opsi yang
   SUDAH tercentang justru mematikannya — terukur membuat skor terbaca 60
   alih-alih 70, dan menuduh aplikasinya keliru padahal yang salah
   pengujiannya. Helper `pilih(i)` di bagian 110–113 memastikan idempoten.

### Kontrak §5 butir 28 diberi pengecualian

**Mode ujian sengaja TIDAK melanjutkan sesi.** Butir 28 ("posisi siswa
diingat") berlaku untuk mode Belajar dan Mini Kuis. Di ujian ia justru salah:
ujian yang bisa ditinggal lalu dilanjutkan membuat siswa bebas mencari jawaban
di antara dua sesi, dan itu meniadakan seluruh gunanya. Yang WAJIB ada sebagai
gantinya, dan diuji: peringatan jujur sebelum keluar, plus percobaan baru yang
bersih. Riwayat skor tetap tersimpan permanen.

### Berkas yang berubah

| Berkas | Peran |
|---|---|
| `js/modules/kuis/examEngine.js` | **BARU** — mesin ujian CBT: dua kolom, kisi navigasi, jawaban tertunda, penilaian serentak, pembahasan |
| `css/phase18.css` | **BARU — DIMUAT PALING AKHIR**: tata letak ujian, kisi navigasi, riwayat, perbaikan isian matriks |
| `js/app.js` | Sesi kuis memakai `ExamEngine`; `buildTkaSet()` urutan tetap; helper `attemptsFor()`/`attemptChips()`; penamaan "Latihan Soal TKA" |
| `js/modules/kuis/quizResult.js` | Label sub-topik Bab 4 diselaraskan dengan Fase 17 |
| `data/quizzes.json` | Bank `tka_2025` (4 soal asli); `questionOrder` 10 soal; QA sub-topik |
| `tests/archive_soal.py` | **BARU** — pembangkit arsip soal |
| `content/QUIZ_ARCHIVE.md`, `content/TKA_ARCHIVE.md` | **BARU** — arsip cetak (dibangkitkan) |
| `index.html` | Memuat `css/phase18.css` |
| `tests/smoke.py` | Bagian **110–113** baru; bagian 11, 53, dan 68 ditulis ulang mengikuti UI ujian |

---

## 00000. FASE 17 — MASTERCLASS PEMODELAN TKA (SELESAI)

Bab 4 ditulis ulang menjadi empat sub-topik yang menggeser latihan dari
**menghitung** ke **membaca**: mengurai soal cerita, mengenali bentuk jawaban
tanpa menghitungnya habis, dan tahu bagian mana dari matriks besar yang
sebenarnya perlu disentuh.

| # | Sub-topik | Engine | Yang dilatih |
|---|---|---|---|
| 1 | Translasi Data & Aturan Domino | `domino_translation` | Parsing narasi + syarat kali |
| 2 | Membaca Model Invers SPLDV | `spldv_utbk` | Memilih BENTUK, bukan menghitung |
| 3 | Ekstraksi Elemen Tersembunyi | `sniper_extraction` | Satu baris, bukan sembilan perkalian |
| 4 | Analisis Multi-Kondisi | `multi_condition` | "Pilih semua yang benar" |

### Pemakaian ulang, lagi

Pola sub-engine Fase 16 dipakai lagi, dan kali ini lintas-BAB:

| Langkah | Engine yang dipakai ulang |
|---|---|
| SPLDV · susun $AX=B$ | `SplSolverSim` — `SPLDVUtbkSim` **turunannya**, hanya `startSolvePhase()` yang diganti |
| SPLDV · cari $A^{-1}$ | `Inverse2x2Sim` (Bab 3) dipasang sebagai sub-engine |
| Multi-kondisi · hitung pendapatan | `MatrixMultiplySim` (Bab 2) dipasang sebagai sub-engine |
| Multi-kondisi · penilaian | `MultiStatementSim.renderStatements()`/`check()` diwarisi UTUH |

`MultiConditionSim` adalah contoh paling bersihnya: ia turunan
`MultiStatementSim` yang **hanya** mengganti cara matriks pendapatannya lahir.
Seluruh logika penilaian per-pernyataan tidak disentuh sama sekali.

### 1. Translasi & Domino

Angka di dalam narasi adalah **tombol**. Siswa mengetuk sebuah angka (ia
terangkat dan menguning), lalu mengetuk sel tujuannya.

> ⚠️ **Permintaan Fase 17 menyebut "sekali klik, angkanya terbang ke slot yang
> benar".** Di sini ia sengaja dipecah jadi ketuk-angka lalu ketuk-slot.
> Alasannya pedagogis: kalau satu klik sudah menerbangkan angka ke tempat yang
> benar, yang memutuskan penempatan adalah APLIKASI — dan justru keputusan itu
> satu-satunya hal yang sedang diajarkan sub-topik ini. Bentuk ketuk-ketuk juga
> yang dipakai seluruh aplikasi (kontrak §5 butir 12).
>
> Konsekuensinya: **semua** sel kosong menyala saat siswa memegang angka, bukan
> hanya sel yang benar. Menyalakan hanya yang benar sama saja dengan menjawab.

Aturan Domino diperagakan pada ordo yang ditulis **per-bagian**: angka DALAM
berdenyut hijau, saling menghampiri lewat `flyTo()` (targetnya elemen sungguhan
— "titik temu" tetap dicabut sejak Fase 13), lalu menyatu; angka LUAR kemudian
menguning dan membentuk ordo hasil.

### 2. SPLDV gaya UTBK

Berhenti di **bentuk** $X = A^{-1}B$, bukan di angkanya. Lima opsi (A–E) berbeda
hanya pada tanda, skalar, posisi diagonal, atau urutan — dan **tiap pengecoh
punya penjelasannya sendiri**, karena kesalahan yang dikenali siswa berbeda-beda.
Opsi yang sudah dicoba salah dikunci permanen (kontrak §5 butir 11).

Kolam angkanya memuat **pengecoh** (5 dan 30) yang memang tidak terpakai.

### 3. Sniper

Ketukan pada sel berisi $k$ meredupkan seluruh panggung ke **opacity 0.16**
(terukur) dan menyisakan tepat tujuh sel menyala: tiga di baris $A$, tiga di
kolom $B$, satu sel hasil di $C$. Angkanya lalu ditarik keluar menjadi
`10(120) + 25(40) + k(60) = 2680`, dan nilai $k$ diisi siswa lewat Mathpad.

Peredupannya sengaja tegas dan transisinya 400ms: yang diajarkan adalah bahwa
delapan angka lain **tidak dipakai sama sekali**, dan itu hanya terlihat kalau
padamnya benar-benar terasa.

### 4. Analisis Multi-Kondisi

Versi lama punya tombol "Hitung Matriks Pendapatan" yang mengisi hasilnya
sendiri — **aplikasi yang menghitung untuk siswa**, tepat di langkah yang paling
menentukan jawabannya. Sekarang siswa mengalikannya sendiri lewat mesin
perkalian Bab 2, lalu matriks hasilnya **dikunci di layar** (`position: sticky`)
karena keempat pernyataan semuanya merujuk angka itu.

### Jebakan yang sudah digigit (jangan diulang)

1. **Kotak yang di-`visibility:hidden` hanya memesan ruang SEUKURAN ISINYA.**
   Kotak ordo dibiarkan kosong sampai tahap 2, dan barisnya melonjak **24px**
   terukur tepat saat ordonya muncul. Isi kotaknya SEKARANG, sembunyikan dengan
   `visibility` — jangan biarkan kosong. Ini melengkapi pola §6: "pesan
   ruangnya" berarti pesan ruang yang **benar-benar akan dipakai**.
2. **`cell.textContent` ikut membawa label alamat.** Persamaan hasil ekstraksi
   sniper sempat berbunyi `10a11(120) + 25a12(40) + k(60) = 2680`, karena
   `.cell__addr` adalah `<span>` ANAK dan `textContent` menggabungkannya.
   Helper `cellText()` membaca `dataset.value`. Kerabat persis dari
   `rewriteCell()` di Fase 16 — dan ia menggigit lagi di fase berikutnya,
   di engine yang sama sekali berbeda.
3. **`classList.add('')` MELEMPAR `SyntaxError`.** `MultiStatementSim.check()`
   memanggilnya lewat
   `add('option--locked', st.correct ? … : (picked ? … : ''))`, dan argumen
   ketiga menjadi string kosong pada SATU kasus: pernyataan **salah** yang
   dibiarkan **tidak dicentang** — yaitu ketika siswa menjawab butir itu dengan
   **benar**. `check()` lalu berhenti di tengah jalan: caption butir sesudahnya
   tidak pernah muncul, panggung tidak terkunci, dan simulasinya tidak pernah
   selesai. Bug ini **sudah ada sejak engine `multi_statement` dibuat** dan baru
   terlihat ketika alurnya dijalankan sampai akhir dengan jawaban campuran.
4. **Panel yang baru muncul bisa mendarat di luar layar.** Panel opsi UTBK
   berhenti di y=806 sementara panggungnya berakhir di y=816 — hanya mengintip
   10px, dan siswa harus menggulir untuk menemukan soal yang sedang ditanyakan
   kepadanya. Helper `revealInStage()` membawanya ke pandangan. Alur bertahap
   yang tumbuh ke bawah **selalu** perlu ini.
5. **Mencuplik animasi di SATU titik waktu itu rapuh.** Pengujian "Mengintip
   memudar" (Fase 15.5) membaca opacity sekali di milidetik ke-90 dan gagal
   sekitar sekali dalam tiga kali jalan — bukan karena perilakunya salah,
   melainkan karena transisinya baru benar-benar mulai di ~60–80ms. Terukur:
   empat cuplikan pertama masih bernilai 1. Yang ingin dibuktikan sebenarnya
   bukan "nilainya sekian di titik sekian", melainkan **"ia melewati nilai
   antara"** — dan itu hanya bisa dijawab dengan MENYAPU (`setInterval` tiap
   20ms), bukan mengintip sekali. Sapuan itu sekaligus memperlihatkan bentuk
   kurvanya: 1 → 0,87 → 0,64 → 0,50 → 0,36 → 0,23 → 0,13 → 0,06.

### Catatan kurikulum yang perlu diketahui

**Sub-topik `spltv_matriks` (SPLTV) DIGANTI oleh `ekstraksi_elemen`.** Idnya
sengaja baru: mempertahankan id lama untuk isi yang sama sekali berbeda akan
menandai siswa sudah menyelesaikan sesuatu yang tidak pernah ia kerjakan.
Konsekuensinya, progres lama pada `spltv_matriks` menjadi yatim di
`progressStore` (tidak merusak apa pun — ia hanya tidak lagi dirujuk).

SPLTV sebagai teknik tidak hilang: pemodelan $3\times3$ tetap dilatih di
sub-topik Sniper, hanya dengan pertanyaan yang lebih dekat ke pola TKA asli.

### Berkas yang berubah

| Berkas | Peran |
|---|---|
| `js/modules/belajar/simulations/simModeling.js` | Empat engine baru; helper `buildOrdoBadge()`, `cellText()`, `revealInStage()`; perbaikan `classList.add('')` di `MultiStatementSim` |
| `js/modules/belajar/simulations/index.js` | Registry `domino_translation`, `spldv_utbk`, `sniper_extraction`, `multi_condition` |
| `css/phase17.css` | **BARU — DIMUAT PALING AKHIR**: narasi ber-angka, rangka domino, ordo per-bagian, opsi UTBK, peredupan sniper, panel terkunci |
| `data/chapters/04_pemodelan_tka.json` | Empat sub-topik ditulis ulang beserta Mini Kuisnya |
| `data/lessons.json` | `subtopicOrder` Bab 4 |
| `content/04_Pemodelan_TKA.md` | Ditulis ulang total, disinkronkan dengan engine |
| `index.html` | Memuat `css/phase17.css` |
| `tests/smoke.py` | Bagian **106–109** baru; dua daftar sub-topik diselaraskan |

---

## 0000. FASE 16 — INVERS & PERSAMAAN MATRIKS (SELESAI)

Tiga sub-topik terakhir Bab 3 dibuka. Dua di antaranya (`invers_2x2`,
`invers_3x3`) sejak Fase 12 hanya berisi kartu "Segera Hadir"; yang ketiga
(`persamaan_matriks`) punya engine, tapi engine itu berhenti tepat sebelum
bagian yang paling penting.

### Prinsipnya: PAKAI ULANG, jangan salin

Tiga dari enam langkah baru tidak menulis mekanik sendiri — mereka memasang
engine yang sudah matang sebagai **sub-engine**:

| Langkah | Engine yang dipakai ulang |
|---|---|
| Invers 3×3 · determinan | `Det3x3SarrusSim` — kelas yang SAMA, bukan salinan |
| Invers 3×3 · adjoin | `foldTranspose()` — animasi lipat diagonal milik Transpose (Bab 1) |
| Persamaan · hitung $X$ | `MatrixMultiplySim` — mesin perkalian baris × kolom (Bab 2) |

Menyalin kodenya akan membuat dua mekanik yang WAJIB berperilaku identik; begitu
salah satunya diperbaiki, siswa menemui dua Sarrus yang berbeda di dua halaman.

> **Pola sub-engine.** Sebuah engine dipasang di dalam engine lain dengan
> `new Engine(host, config, toasts, onDone)`, `sub.hintHost = <panel milik
> sendiri>`, lalu `sub.build()`. Yang WAJIB di-override cuma `complete()`:
>
> ```js
> class SarrusStep extends Det3x3SarrusSim {
>   complete() { if (this.finished) return; this.finished = true; this.onComplete(); }
> }
> ```
>
> Tanpa override itu, sub-engine memasang banner **"Simulasi selesai — lanjut
> ke Mini Kuis"** dan menembakkan toast sukses padahal yang selesai baru
> langkah 1 dari 4. Terukur: dua banner di satu panggung.
>
> Pembongkarannya juga wajib: `destroy()` induk memanggil `sub.destroy()`,
> lalu mengosongkan host DAN panel petunjuk sub-engine.

### 1. Invers 2×2 — yang berubah cuma tahap 3

Tahap 1 (determinan manual) dan 2 (tukar + balik tanda) dipertahankan apa
adanya. Tahap 3 diganti: chip $\frac{1}{\det}$ tidak lagi dibawa ke **setiap
sel**, melainkan ke satu **slot di depan kurung**.

Alasannya bukan menghemat ketukan, melainkan bentuk yang benar. Di buku, di
papan tulis, dan di lembar jawaban TKA, invers ditulis
$\frac{1}{10}\begin{pmatrix}4 & -1\\-2 & 3\end{pmatrix}$ — satu pecahan di
depan kurung, bukan empat pecahan terpisah di dalamnya. Perkalian skalar ke
tiap elemen sudah punya sub-topiknya sendiri di Bab 2; mengulangnya di sini
menambah delapan ketukan tanpa satu pun konsep baru.

Matriksnya diganti ke $\begin{pmatrix}3&1\\2&4\end{pmatrix}$ ($\det = 10$).
Determinan **1** akan membuat tahap 3 tidak mengubah apa pun.

### 2. Invers 3×3 — empat langkah

Matriks $A = \begin{pmatrix}1&2&1\\0&1&3\\2&1&1\end{pmatrix}$: $\det = 8$,
seluruh kofaktornya bilangan bulat kecil. Diverifikasi dengan
`js/engine/matrix.js`, bukan dikira-kira.

**Berburu kofaktor** adalah satu-satunya mekanik yang benar-benar baru.
Ketukan pada sel kofaktor menggambar garis coret pada **baris dan kolom** yang
bersangkutan di matriks $A$, menyisakan minor $2\times2$ yang determinannya
diisi siswa lewat Mathpad. Tanda papan catur diterapkan **sesudah** itu, dan
diucapkan terus terang di prompt.

Pola $+/-$ dipasang sebagai **cap air** di sudut sel, bukan sebagai isi. Kalau
ia teks biasa, sel kosong bertanda "−" terbaca sebagai sel yang sudah berisi
nilai negatif, dan siswa mengira delapan sel lain sudah terjawab.

> ⚠️ **Enam sel diisi OTOMATIS, dan itu satu-satunya di seluruh aplikasi.**
> Kontrak "aplikasi tidak pernah menghitung untuk siswa" (§5) di sini diberi
> pengecualian yang diminta eksplisit oleh pengguna sebagai *anti-fatigue*.
> Pembenarannya: setelah kofaktor ketiga, sel keempat sampai kesembilan tidak
> mengajarkan apa pun — mekaniknya identik, yang bertambah hanya kelelahan.
>
> Supaya tetap jujur, sel otomatis **ditandai `auto`** di badannya dan
> dikatakan terus terang di prompt. Jangan hapus penandanya; tanpa itu,
> pengecualian ini berubah jadi kebohongan. Tiga sel yang wajib manual
> (`c11`, `c12`, `c23`) sengaja mencakup KEDUA tanda papan catur, sehingga
> aturan tandanya benar-benar teruji, bukan kebetulan lolos.

### 3. Persamaan matriks — dua pelajaran, dua langkah

Versi lama berhenti setelah $A^{-1}$ mendarat di sisi yang benar: jawabannya
langsung tercetak lengkap sebagai rumus. Siswa yang paham LETAK-nya tetap tidak
pernah mengalikan apa pun.

Sekarang langkah 2 memunculkan matriks angkanya dan menjalankan mesin
perkalian matriks; $X$ dihitung siswa, sel per sel.

> ⚠️ **`PairwiseTapSim` BUKAN mesin perkalian matriks.** Permintaan Fase 16
> menyebut nama itu, tetapi engine tersebut memasangkan elemen **seletak**
> ($a_{ij}$ dengan $b_{ij}$) — itu penjumlahan. $A^{-1}B$ menuntut **baris
> dikali kolom**, dan itu `MatrixMultiplySim`. Keduanya sama-sama "ketuk
> pasangan" sehingga sangat mudah tertukar; memakai yang salah akan
> mengajarkan operasi yang keliru dengan sangat meyakinkan.

### Jebakan yang sudah digigit (jangan diulang)

1. **`swapArc()` dan `flipSign()` MENGHAPUS anak elemen sel.** Keduanya menutup
   animasinya dengan menulis `textContent`, dan `textContent` menyapu seluruh
   child node — termasuk `<span class="cell__addr">` yang dipasang
   `renderMatrix({ showAddress: true })`. Yang tersisa cuma teks gabungannya:
   sel bernilai 4 dengan label `a22` **terbaca "4a22"**. Helper `rewriteCell()`
   menulis ulang isinya dari `dataset.value` sesudah tiap animasi. Bug ini
   tidak terlihat dari kode animasinya (ia benar — memang hanya menukar nilai)
   dan hanya muncul di engine yang memakai alamat sel BERSAMA tukar/balik.
2. **Nama matriks yang berubah menggeser matriksnya.** Label duduk di atas
   kurung, jadi lebarnya ikut menentukan lebar `.matrix`. Pergantian
   `A` → `adj(A)` menggeser matriks **15px** terukur, tepat saat siswa
   memperhatikan hasil tukar-tanda. `.matrix__name--reserved` memesan
   lebarnya sejak awal.
3. **Skalar dan kurung bisa terpisah baris.** Baris panggung boleh membungkus
   supaya matriks lebar tetap muat di lanskap pendek — dan pembungkusan itu
   melemparkan matriks ke baris berikutnya, meninggalkan pecahan berdiri
   sendirian di depan ruang kosong. Terukur pada invers 3×3. Keduanya
   dibungkus `.inv-scalar-pair` yang `flex-wrap: nowrap`.
4. **`renderMixed()` hanya mengenali `$…$`, tidak `$$…$$`.** Regexnya
   `\$([^$]+)\$` melewatkan dolar pertama dan terakhir sebagai teks mentah,
   sehingga di layar terbaca `$X = A^{-1}B$`. Bug ini sudah ada di
   `MatrixEquationSim` lama dan ikut terbawa sampai ketahuan di layar. Pakai
   satu dolar; ukurannya diatur CSS, bukan mode display KaTeX.
5. **Placeholder toast memakai `{{kunci}}`, bukan `{kunci}`.**
   `fillTemplate()` (`js/engine/validator.js`) hanya cocok dengan kurung
   ganda. Kurung tunggal lolos tanpa galat dan tampil mentah di layar sebagai
   `{baris}`.
6. **Tombol Mathpad mendengarkan `pointerdown`, bukan `click`.** Pengujian
   yang memakai `.click()` membuat seluruh penekanan diam-diam tidak berefek —
   preview tetap "—", dan pengujiannya gagal di tempat yang salah.
7. **Toast MENUMPUK, dan yang dibuang tinggal ~400ms.**
   `querySelector('.toast')` karena itu kerap mengembalikan toast
   SEBELUMNYA. Terukur: penolakan "Salah posisi!" terbaca sebagai "Elemen
   terpilih." Pengujian harus membaca SEMUA `.toast` lalu menggabungkannya.
8. **Ekspresi determinan menggeser matriks di sebelahnya.** `.stage` di
   lanskap adalah baris yang MEMBUNGKUS (`flex-direction: row; flex-wrap:
   wrap`), jadi seluruh anggotanya berbagi satu jalur dan lebar salah satunya
   menentukan posisi yang lain. Begitu ekspresi berubah dari "ad − bc = ?"
   menjadi "12 − 2 = 10", matriksnya bergeser — terukur **8px**.
   Ini **bukan** bug Fase 16: perilakunya sudah ada sejak `det2x2` memakai
   ekspresi ini, hanya belum pernah diukur karena tidak ada yang mengukurnya.
   Lebar tiap sukunya kini dipesan `4ch`; `2.6ch` masih menyisakan 6px —
   angka itu diukur, bukan ditaksir.

### Registry & data

Kunci baru: `inverse3x3`, `equation_solver`. Nama lama `adjoint_flow` dan
`matrix_equation` **tetap dikenali** sebagai alias ke engine baru — satu salah
ketik di JSON akan menampilkan empty-state alih-alih simulasinya.
`AdjointFlowSim` dan `MatrixEquationSim` dicabut; `ComingSoonSim` tetap
terdaftar meski tidak ada lagi yang memakainya.

**Mini Kuis `invers_3x3` ditulis ulang jadi PRAKTIS** (permintaan eksplisit):
soal 1 menghitung kofaktor $c_{23}$ lewat Mathpad, soal 2 merakit $P^{-1}$ dari
$\det(P)$ dan $\text{Adj}(P)$ yang diketahui. Versi lama hanya menanyakan
urutan tahap dan satu penalaran — keduanya bisa dijawab tanpa menghitung apa
pun. `content/03_Determinan_Invers.md` disinkronkan (§5B, §6B, §6C, §7B).

### Berkas yang berubah

| Berkas | Peran |
|---|---|
| `js/modules/belajar/simulations/simDetInv.js` | `Inverse2x2Sim` tahap 3 ditulis ulang; `Inverse3x3Sim` & `EquationSolverSim` baru; `AdjointFlowSim` & `MatrixEquationSim` dicabut; helper `createScalarSlot()`, `createInverseChip()`, `scalarPair()`, `rewriteCell()` |
| `js/modules/belajar/simulations/index.js` | Registry `inverse3x3` & `equation_solver` + alias lama |
| `css/phase16.css` | **BARU — DIMUAT PALING AKHIR**: slot skalar, cap air papan catur, panel minor, kerangka langkah, persamaan, lebar tetap label matriks & ekspresi determinan |
| `data/chapters/03_determinan_invers.json` | Tiga engine diaktifkan; Mini Kuis invers 3×3 ditulis ulang |
| `content/03_Determinan_Invers.md` | §5B, §6B, §6C, §7B disinkronkan |
| `index.html` | Memuat `css/phase16.css` |
| `tests/smoke.py` | Bagian 57 & 58 **ditulis ulang** (dulu menguji "Segera Hadir"); bagian **105** baru |

---

## 000A. FASE 15.5 — POLES PAPAN CORET (SELESAI)

Tiga temuan UAT ditutup. Semuanya hanya menyentuh `js/ui/scratchpad.js` dan
`css/phase15.css`; tidak ada berkas fase lain yang diubah.

### 1. Garis putus-putus saat disapu cepat — akarnya BUKAN yang terlihat

Gejalanya "titik-titik yang tidak tersambung", dan tebakan pertama yang wajar
adalah "kodenya cuma memplot titik, bukan menggambar garis". **Itu keliru** —
kodenya memang sudah `moveTo`/`lineTo`/`stroke` sejak Fase 15.

Akar masalahnya satu baris:

```js
const from = tailOnly ? Math.max(0, pts.length - 2) : 0;   // ← lama
```

Setiap gerak hanya menggambar ruas **terakhir**. Selama satu peristiwa membawa
satu titik, itu kebetulan benar. Tapi `getCoalescedEvents()` menyerahkan 5–10
titik sekaligus dalam SATU peristiwa saat jari disapu cepat: semuanya masuk ke
`points`, dan yang tergambar cuma ruas paling akhir. Sisanya dilewati — itulah
celah kosongnya.

Perbaikannya penanda `drawn` pada goresan hidup: ia mengingat sampai titik ke
berapa kanvas sudah menyusul, jadi tiap ruas digambar tepat sekali dan selalu
bersambung ke titik sebelumnya.

**Terukur langsung, dua algoritma berdampingan pada masukan yang sama**
(7 titik, rentang 350px): algoritma lama menyisakan celah **288px** dan hanya
62 piksel bertinta; yang baru **0px celah**, 438 dari 438 piksel bertinta.

> ⚠️ **Pengujian sintetis biasa TIDAK bisa menangkap bug ini.** Untuk
> `PointerEvent` buatan, `getCoalescedEvents()` selalu mengembalikan array
> kosong, jadi kode lama pun akan tampak benar. Bagian 104 menimpa fungsi itu
> lewat `Object.defineProperty` supaya satu peristiwa benar-benar membawa
> enam titik. Tanpa penimpaan itu, pengujiannya akan lolos pada kode yang rusak.

### 2. Penghapus GORESAN, bukan penghapus piksel

Penghapus lama mengecat `destination-out` — melubangi lapisan. Ia meninggalkan
puing separuh angka, dan justru membuat papan lebih kotor.

Sekarang penghapus tidak menggambar apa pun. Ia menghitung jarak lintasan
pointer ke tiap ruas goresan tersimpan, dan goresan yang tersentuh dibuang
**utuh** dari `strokes` lalu papan digambar ulang. Inilah keuntungan keempat
dari keputusan vektor Fase 15: bagi bitmap, "angka 7" hanyalah kumpulan piksel
tanpa identitas.

- Jangkauan `ERASER_REACH = 12px`, ditambah `width / 2` goresannya.
- Jaraknya **ruas-ke-ruas**, bukan titik-ke-titik. Dua garis panjang yang
  menyilang seperti huruf X punya keempat ujung yang berjauhan padahal jelas
  bersentuhan; `segSegDist()` karena itu memeriksa perpotongan lebih dulu.
- Sapuan diperiksa per ruas antara dua sampel pointer, jadi sapuan cepat tidak
  "melompati" coretan tipis.

> ⚠️ **Konsekuensi arsitektural: riwayat berpindah dari GORESAN ke TINDAKAN.**
> Dulu `strokes` merangkap tumpukan undo, dan itu cukup selama satu langkah =
> satu goresan. Satu sapuan penghapus bisa membuang tiga goresan sekaligus, dan
> undo harus mengembalikan ketiganya ke POSISI tumpuk semula. Karena itu ada
> `history` berisi `{type:'draw'|'erase'}`; `strokes` tinggal daftar-gambar.
> Batas 20 dan penanda `committed` yang hanya-naik ikut pindah ke `history` —
> logikanya sama persis, satuannya yang berubah.
>
> Pembalikan `erase` mengembalikan goresan dengan urutan **terbalik dari urutan
> pembuangan**. Itu bukan detail gaya: hanya urutan terbalik yang merupakan
> kebalikan persis dari serangkaian `splice`, dan hanya itu yang memulihkan
> posisi tumpuknya.

Terukur: tiga garis tegak disapu sekali → 3 goresan hilang, **satu** ketukan
Urungkan mengembalikan ketiganya (tinta pulih ke angka yang identik, 4812).

### 3. Kanvas PADAT & Mengintip yang memudar

Latar lama `rgba(255,255,255,.72)` dibuat supaya matriks tetap terbaca sambil
menghitung. Di lapangan justru itu masalahnya: coretan hitungan menumpuk tepat
di atas matriks 3×3 yang juga penuh angka, dan mata siswa harus memisahkan dua
lapisan angka sekaligus. Kertas asli tidak pernah tembus pandang.

Sekarang `#ffffff` padat + pola titik kertas berpetak (`radial-gradient`,
alfa .10, jarak 22px).

> ⚠️ **Latar itu WAJIB tetap di CSS, jangan pernah dicat ke bitmap kanvas.**
> Pengujian menghitung piksel TINTA lewat `getImageData`. Mengecat latarnya ke
> bitmap membuat SELURUH piksel ber-alfa penuh, dan "papan kosong" tidak bisa
> lagi dibedakan dari papan penuh — separuh bagian 102 langsung kehilangan
> maknanya tanpa gagal sekalipun.

Transisi Mengintip dinaikkan **90ms → 200ms `ease-in-out`**. Alasannya berubah
bersama latarnya: yang berpindah bukan lagi selapis coretan tipis melainkan
seluruh bidang putih sebesar panggung, dan 90ms pada bidang sebesar itu terbaca
sebagai KEDIP, bukan sebagai kertas yang diangkat.

**Pelepasan kini didengarkan di DUA tempat, dan keduanya perlu:**

| Tempat | Guna |
|---|---|
| `peekBtn` — `pointerup`/`pointercancel`/`pointerleave` | Perilaku tombol-tahan yang wajar, sesuai permintaan UAT |
| `window` — `pointerup`/`pointercancel`/`blur` | Jaring pengaman: jari yang digeser ke luar panggung, jendela yang kehilangan fokus |

> ⚠️ Listener di tombolnya **tidak akan pernah menyala** kalau tombol itu ikut
> `pointer-events: none` bersama bilahnya — jebakan yang sudah dicatat di §000.
> Yang membuatnya bekerja adalah satu baris CSS:
> `.pad[data-peek="true"] .pad__peek { pointer-events: auto; }`
> Tombolnya tetap memudar, tapi tetap bisa menerima pointer. Jaring `window`
> **tetap dipertahankan**: satu papan yang macet tembus pandang di tengah
> ujian jauh lebih mahal daripada dua listener.

Terukur: opacity di 90ms = **0,64** (benar-benar memudar, bukan berpindah
seketika); saat ditahan kanvas & bilah **0**, sementara `pointer-events` tombol
mata tetap **`auto`**.

### Catatan pedagogis yang perlu diketahui sesi berikutnya

Kanvas padat memindahkan biaya: siswa tidak lagi bisa melihat soal dan
coretannya **bersamaan**. Mengintip berubah dari kemewahan menjadi jalur
wajib. Itu keputusan sadar pengguna (UAT menyebut lapisan tembus sebagai
beban kognitif), tetapi kalau nanti ada keluhan "harus bolak-balik menahan
mata", akar masalahnya ada di sini — bukan di mekanik Mengintipnya.

### Berkas yang berubah

| Berkas | Peran |
|---|---|
| `js/ui/scratchpad.js` | `drawTail()` berpenanda `drawn`; penghapus goresan + geometri ruas; riwayat tindakan; listener peek di tombol |
| `css/phase15.css` | Latar padat + petak; transisi 200ms `ease-in-out`; `pointer-events:auto` untuk tombol mata; kursor lingkaran penghapus |
| `tests/smoke.py` | Bagian **104** baru (18 pengujian); jeda `PAPAN_INTIP` 250 → 400ms mengikuti transisi yang lebih panjang |

---

## 000. FASE 15 — PAPAN CORET (SELESAI)

Kanvas coret-coret di atas KOLOM PANGGUNG, untuk siswa yang menghitung
determinan/invers 3×3. Modulnya berdiri sendiri: `js/ui/scratchpad.js` +
`css/phase15.css`, dipasang `lessonRenderer` tepat setelah `.ws-stage` dibuat.

### Keputusan teknis yang perlu diketahui

**Goresan disimpan sebagai VEKTOR, bukan cuplikan `toDataURL()`/`getImageData`.**
Permintaannya menyebut bitmap sebagai contoh; di aplikasi ini ia justru
membengkakkan memori yang ingin dihemat:

| Cara | Memori per langkah | 20 langkah | Setelah ubah ukuran |
|---|---|---|---|
| Cuplikan bitmap | ±9,6 MB (2000×1200×4 byte) | **±190 MB** | buram (diregangkan) |
| Vektor goresan | **±2 KB** | ±40 KB | **tajam** (digambar ulang) |

Titiknya ternormalisasi (0..1), jadi `ResizeObserver` bisa menggambar ulang
tajam pada ukuran baru — memenuhi syarat "ubah ukuran tanpa merusak gambar"
yang tidak bisa dipenuhi bitmap.

**Batas 20 goresan ditegakkan lewat penanda `committed` yang hanya NAIK.**
Versi pertama menghitungnya sebagai `strokes.length - 20` setiap saat — dan
gagal total, karena batasnya ikut turun setiap satu goresan di-undo sehingga
undo tetap menyapu seluruh papan. Goresan di luar batas **tidak dihapus dari
gambar**, hanya berhenti bisa diurungkan; menghapusnya berarti coretan siswa
lenyap sendiri di tengah pengerjaan.

### Mekanik "Mengintip"

Ikon mata **ditahan**, bukan diklik: `pointerdown` menyembunyikan kanvas dan
bilah alat (`opacity: 0`, transisi 90ms) dan mematikan menggambar; melepas
mengembalikannya.

> ⚠️ Pelepasannya didengarkan di **`window`**, bukan di tombolnya. Saat
> mengintip, tombol itu sendiri ikut `pointer-events: none`, jadi `pointerup`
> di atasnya tidak akan pernah sampai — dan papan akan tersangkut tembus
> pandang selamanya. `blur` jendela juga ikut melepas.
>
> **Diperbarui di Fase 15.5:** listener DI TOMBOLNYA ditambahkan (permintaan
> UAT), dan supaya benar-benar menyala, tombolnya dikecualikan dari
> `pointer-events: none` bilahnya lewat satu baris CSS. Jaring `window` tetap
> ada. Lihat **§000A butir 3** — jangan cabut salah satunya.

### Jebakan yang sudah digigit (jangan diulang)

1. **`left: 50%` pada elemen absolut memangkas lebar yang TERSEDIA jadi
   separuh.** Bilah alat menghitung dirinya muat di 435px padahal panggungnya
   869px, lalu membungkus jadi tiga baris. `transform: translateX(-50%)` hanya
   menggeser tampilannya SETELAH lebar itu terlanjur dihitung. Pakai
   `left:0; right:0; margin-inline:auto; width:fit-content` — sepupu persis
   dari jebakan banner di Fase 13.
2. **`getCoalescedEvents()` bisa mengembalikan array KOSONG.** Kalau hasilnya
   dipakai mentah, goresan tidak pernah bertambah titik dan yang tergambar
   cuma satu noktah. Selalu sediakan cadangan ke peristiwanya sendiri.
3. **Buffer kanvas harus diperiksa TERPISAH dari kotak CSS-nya.** Kanvas yang
   sempat dibuat saat panggung belum terukur tersangkut di ukuran bawaan
   300×150, dan seluruh goresan mendarat di koordinat yang salah.
4. **Menguji transisi CSS di pane peramban yang TERSEMBUNYI akan menyesatkan.**
   Halaman tersembunyi menghentikan transisi, jadi `opacity` beku di nilai
   awalnya sementara properti non-animasi (`pointer-events`) tetap berubah —
   terbaca seolah mekanik "Mengintip" rusak, padahal ia benar. Ukur di halaman
   yang benar-benar dirender (Playwright).

### Isolasi rute

Papan dibuat sekali per SUB-TOPIK dan dibongkar di `LessonView.destroy()`.
Karena `mountScreen()` membongkar view lama di setiap perpindahan rute,
berpindah sub-topik otomatis memberi papan bersih. Berpindah LANGKAH
(Materi → Simulasi → Kuis) di dalam satu sub-topik **mempertahankan** coretan
— siswa sering menyiapkan hitungan saat membaca materi lalu memakainya di
simulasi.

---

## 00. FASE 14 — LAYAR MUAT & SESI LINTAS-TAB (SELESAI)

### Layar muat

Markupnya **statis di `index.html`**, bukan dibuat JavaScript: di jaringan
sekolah yang lambat, modul ES bisa perlu beberapa detik untuk tiba, dan
sepanjang itu layar tidak boleh kosong-putih.

Bentuknya **matriks 2×2 di dalam kurung siku** — sama dengan favicon dan logo
header. Yang dilihat siswa selama menunggu adalah mereknya, bukan roda berputar
yang bisa milik aplikasi mana pun. Selnya berdenyut bergiliran menempuh tiga
warna merek: `--royal` → `--cyan` → `--yellow` (terukur persis
`rgb(29,78,216)` / `rgb(6,182,212)` / `rgb(255,200,0)`).

`#app` mulai dari `opacity: 0` dan baru tampil saat
`html[data-app-ready="true"]`. `revealApp()` dipanggil dari blok **`finally`**
di `boot()`, jadi layar muat SELALU turun — termasuk kalau manifesnya gagal
diambil. Tanpa itu, satu galat jaringan akan meninggalkan siswa menatap
animasi yang berdenyut selamanya.

> `.fs-btn` hidup di luar `#app`, jadi ia disembunyikan terpisah — kalau tidak,
> tombol layar penuh melayang sendirian di atas layar muat.

### Identitas & "Ganti Akun"

Lihat §9 untuk rinciannya. Ringkasnya: identitas pindah ke `localStorage`
supaya bertahan lintas tab & muat-ulang, dan tombol "Ganti Akun" di menu utama
adalah **syarat** yang membuat keputusan itu aman di perangkat bersama.

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
| Version control | **Repo git aktif**, cabang `main`, remote `origin` = `https://github.com/mrpurnomo/ruang-matriks.git`. Rincian di **§1A** |

**Pustaka eksternal (CDN, dimuat di `index.html`):** KaTeX 0.16.9, GSAP 3.12.5 + MotionPathPlugin, Google Fonts (**Montserrat / Roboto / Roboto Mono**). SortableJS dilepas di Fase 9 — ia tidak pernah dipakai.

> ⚠️ Aplikasi butuh koneksi internet untuk CDN tersebut. Belum ada fallback offline.

---

## 1A. Git, Remote, dan Aturan Push

| | |
|---|---|
| Cabang | `main` (satu-satunya cabang lokal) |
| Remote | `origin` → `https://github.com/mrpurnomo/ruang-matriks.git` |
| `origin/main` | `ccfc7d7` — Fase 15.5 (poles papan coret). **Inilah versi yang dipakai siswa sekarang** |
| `main` lokal | **4 commit di depan remote**: Fase 16 (invers & persamaan), Fase 17 (masterclass TKA), Fase 18 (mesin ujian CBT), dan Fase 18.5 (poles akhir) |
| Identitas commit | `Penta Putra Purnomo <penta.putra73@guru.sma.belajar.id>` — **seluruh commit**, terverifikasi |
| Tanda tangan AI | **nol.** `git log --format=%B | grep -i claude` tidak menemukan apa pun |

### Yang WAJIB diketahui sebelum menyentuh git di sini

**Riwayatnya sudah pernah ditulis ulang** (Fase 13.5→14) untuk menormalkan
author dan mencabut trailer `Co-Authored-By`. Yang ada di remote sekarang
adalah riwayat hasil tulis-ulang itu — jadi remote dan lokal sudah sinkron
akarnya, dan **`push` biasa sudah cukup**; tidak perlu `--force` lagi.
Cabang `backup/pre-rewrite` sudah dihapus setelah isinya diverifikasi
byte-identik (`git diff` kosong, keenam hash pohon sama).

> ⚠️ **Riwayat push, supaya tidak salah baca lagi.** Selama Fase 15–15.5, dokumen
> ini mencatat `origin/main` masih di `ae9f90e`. Di antara sesi Fase 15.5 dan
> Fase 16, **pengguna sendiri** yang mendorong Fase 15, docs-nya, dan Fase 15.5 ke
> remote. Sesi tidak pernah menjalankan `git push`. Jadi: **periksa `git rev-list
> --left-right --count origin/main...main` di awal sesi**, jangan percaya angka
> yang tertulis di dokumen ini — remote bisa bergerak tanpa melibatkan sesi.

**Jangan pernah push tanpa diminta.** Aplikasi ini **dipakai siswa secara
langsung**, dan remote-nya tersambung ke hosting. Sejak Fase 14 pengguna
selalu menyebut eksplisit "commit lokal saja, jangan push". Perlakukan push
sebagai tindakan yang selalu butuh izin baru — izin di satu fase tidak
berlaku untuk fase berikutnya.

**Push otomatis pernah gagal 403** (`Permission to mrpurnomo/ruang-matriks.git
denied to pentaputra98`): kredensial tersimpan di Windows Credential Manager
milik akun lain. Push yang berhasil ke `ae9f90e` dilakukan pengguna sendiri.
Bila push diminta lalu gagal 403 lagi, itu bukan masalah kode — laporkan dan
serahkan ke pengguna, jangan mencoba memasukkan kredensial.

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

### Status pengujian per 7 Oktober 2026 — **terverifikasi, bukan klaim**

| Suite | Hasil |
|---|---|
| `node tests/engine.test.mjs` | **21/21 lolos** |
| `python tests/smoke.py` | **656/656 lolos** |

Fase 19 menambah bagian 117–118 (24 pengujian): papan berdampingan tanpa
tumpang-tindih, soal yang tetap bisa dijawab saat papan terbuka, coretan yang
tidak meregang saat berganti tata letak, pembatas seret/ketuk beserta batasnya,
bilah ringkas & baki warna, Escape berlapis (termasuk Mathpad), ingatan tata
letak per perangkat, dan jatuhnya berdampingan ke kertas penuh di lanskap
sempit.

Fase 18.5 menambah bagian 114–116: kelengkapan kalimat soal TKA, markdown
yang benar-benar ter-render, auto-simpan Mathpad beserta pembatalannya yang
jujur, papan coret di mode ujian, dan kartu skor TKA di dasbor.

Fase 18 menambah bagian 110–113: tata letak CBT dua kolom, umpan balik
tertunda beserta navigasi bebasnya, isian matriks yang tidak berhimpit di dua
viewport, pengumpulan & penilaian serentak, riwayat percobaan, dan keberadaan
arsip soal. Bagian 11, 53, dan 68 ditulis ulang mengikuti UI ujian yang baru.

Fase 17 menambah bagian 106–109: translasi cerita & Aturan Domino, SPLDV
gaya UTBK beserta pengecoh-pengecohnya, ekstraksi sniper (peredupan, jalur
yang menyala, persamaan hasil ekstraksi), dan analisis multi-kondisi dari
perkalian yang dihitung siswa sampai penilaian per-pernyataan.

Fase 16 menulis ULANG bagian 57 & 58 (yang dulu menguji placeholder
"Segera Hadir") dan menambah bagian 105: alur invers 2×2 & 3×3 lengkap,
pemakaian ulang Sarrus sebagai sub-engine, berburu kofaktor beserta
pencoretannya, lipat transpose, perakitan skalar, serta letak invers dan
perkalian pada persamaan matriks.

Fase 15.5 menambah bagian 104 (18 pengujian): sapuan cepat tanpa celah,
penghapus per-goresan beserta undo-nya, kanvas padat, dan mekanik Mengintip
yang memudar (termasuk pelepasan di tombol, `pointerleave`, dan
`pointercancel`).

Fase 9 menambah bagian 63–69; Fase 10 menambah bagian 70–76: identitas aplikasi,
sapaan masuk & hak cipta, penempatan header, arsitektur Sidebar & Stage (diukur di
tiga viewport), ruang napas matriks 3×3, presisi ordo & operator, dan akurasi
koordinat animasi setelah tata letak berubah.

Fase 11 menambah bagian 77–86 (46 pengujian): slider tidak kembar, Jumlah/Kurang
murni ketuk, gerak & timer benar-benar mati saat pindah layar, kemajuan
multi-kasus, penjaga layar masuk, gulir daftar bab, skala di tiga viewport, dan
kontras warna pada puncak denyut.

Fase 15 menambah bagian 101–103 (23 pengujian): tombol & bilah alat papan
coret, mesin gambar, undo/redo/penghapus/batas 20, mekanik Mengintip, ubah
ukuran, dan isolasi rute.

Fase 14 menambah bagian 98–100 (16 pengujian): layar muat & munculnya
aplikasi, identitas bertahan lintas muat-ulang/tab, dan alur "Ganti Akun".

Fase 13 menambah bagian 94–97 (20 pengujian): audit klik-beruntun menyapu
seluruh sub-topik, kunci pilihan pada modul yang dilaporkan, Kombinasi Skalar
memakai mesin ketuk-ketuk yang sama, dan pemusatan banner/toast.

Fase 12 menambah bagian 87–93 (37 pengujian): urutan kurikulum, tata letak
simulasi label, tambatan toast, bilah progres, teks progres pengganti slider,
kunci multi-kasus, denyut salinan Sarrus, kunci Kesamaan, anti-spam pilihan
ganda, dan HOTS ketuk-ketuk.

> ⚠️ `clear_session()` di `smoke.py` sengaja **mempertahankan** kunci identitas.
> Sejak Fase 14 identitas pindah ke `localStorage`, jadi `sessionStorage.clear()`
> tidak lagi menyentuhnya dan `clear_session()` kembali sesederhana namanya.
> (Di Fase 11–13 ia harus menyelamatkan identitas lebih dulu.)

---

## 3. Peta File

Total **±19.980 baris** kode aplikasi (JS + CSS + HTML), 43 berkas.

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
│   ├── phase13.css                    Kunci .is-locked, pemusatan banner & toast
│   ├── phase14.css                    Layar muat bermerek, #app fade-in,
│   │                                    tombol Ganti Akun
│   ├── phase15.css                    Papan coret (FAB,
│   │                                    kanvas, bilah alat, Mengintip)
│   ├── phase16.css                    Invers & persamaan
│   │                                    (slot skalar, cap air kofaktor,
│   │                                    panel minor, balok persamaan)
│   ├── phase17.css                    Masterclass TKA
│   │                                    (narasi ber-angka, Aturan Domino,
│   │                                    opsi UTBK, peredupan sniper)
│   └── phase18.css                    ← DIMUAT TERAKHIR: mesin ujian CBT
│                                        (kisi navigasi, riwayat percobaan,
│                                        isian matriks yang tidak berhimpit)
│                                        + FASE 19: §19.A papan coret
│                                        berdampingan, §19.B sistem visual
│                                        "Presisi Tenang"
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
│   │   ├── scratchpad.js              ← FASE 15/15.5/19: papan coret (vektor berkoordinat
│   │   │                                piksel, penghapus goresan, tiga tata letak,
│   │   │                                pembatas seret/ketuk, baki lipat, Mengintip)
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
│       │       ├── simDetInv.js  1897  Bab 3 (+ invers 3×3 & persamaan, Fase 16)
│       │       └── simModeling.js 1290  Bab 4 (+ 4 engine TKA, Fase 17)
│       └── kuis/
│           ├── quizEngine.js          Satu soal per layar + navigasi maju-mundur
│           └── quizResult.js     138
│
└── tests/
    ├── engine.test.mjs                21 pengujian matematika murni
    ├── smoke.py                       656 pengujian Playwright, 118 bagian
    └── archive_soal.py                Pembangkit arsip soal (Fase 18)
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
| 4 | `04_pemodelan_tka` | translasi_data, spldv_matriks, **ekstraksi_elemen** (dulu spltv, Fase 17), analisis_multi_kondisi |

### Registry Simulasi

`js/modules/belajar/simulations/index.js` memetakan string ke kelas. **Kunci di registry HARUS sama persis dengan nilai `simulation.engine` di `data/chapters/*.json`.** Engine yang tidak terdaftar tidak melempar error — ia menampilkan empty-state dan tetap mengizinkan siswa lanjut ke Mini Kuis.

28 engine terdaftar (Fase 17 menambah empat engine TKA):

```
identify_element · ordo_builder · label_matrix_types · transpose_morph · equality_link
elementwise_op · scalar_sweep · combo_op · ordo_check · matrix_multiply · property_cards
det2x2 · det3x3_sarrus · singular_check · property_calculator
inverse2x2 · inverse3x3 · equation_solver          (Fase 16)
adjoint_flow · matrix_equation                     (alias nama lama)
data_translation · spl_solver · multi_statement
domino_translation · spldv_utbk · sniper_extraction · multi_condition   (Fase 17)
coming_soon                                        (tidak dipakai data mana pun)
```

> **Fase 16:** ketiga sub-topik terakhir Bab 3 kini memakai engine sungguhan
> (`inverse2x2`, `inverse3x3`, `equation_solver`). Nama lama `adjoint_flow`
> dan `matrix_equation` tetap dikenali sebagai ALIAS ke engine baru.
> `coming_soon` masih terdaftar tetapi sudah tidak dipakai data mana pun.

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
18. **Layar masuk mendahului menu.** Tanpa identitas di `localStorage` (pindah dari `sessionStorage` di Fase 14), rute apa pun dialihkan ke `#/login`. (Fase 9, bagian uji 64.)
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

48. **Aplikasi tidak pernah tampil setengah jadi.** `#app` mulai `opacity: 0`; layar muat baru turun saat `data-app-ready="true"`. Pemanggilnya WAJIB ada di blok `finally` supaya galat jaringan tidak meninggalkan siswa menatap animasi selamanya. (Fase 14, bagian uji 98.)

49. **Identitas di `localStorage` HARUS berpasangan dengan jalan keluarnya.** Identitas yang menempel di perangkat bersama tanpa tombol "Ganti Akun" adalah cacat, bukan fitur. Keduanya satu paket. (Fase 14, bagian uji 99–100.)

50. **Keluar akun membuang identitas + posisi, TIDAK membuang pencapaian.** Progres milik perangkat, bukan milik satu siswa; menghapusnya diam-diam membuang pekerjaan seisi kelas. (Fase 14, bagian uji 100.)

51. **Papan coret memakai VEKTOR, bukan cuplikan bitmap.** Cuplikan `getImageData` di panggung sebesar ini ±9,6 MB per langkah; dua puluh langkah ±190 MB. Vektor ±2 KB per goresan, dan hanya vektor yang bisa digambar ulang tajam setelah ubah ukuran. (Fase 15, bagian uji 101–103.)

52. **Batas undo dihitung dari penanda yang hanya NAIK.** Menghitungnya ulang sebagai `panjang - batas` membuat batasnya ikut turun tiap undo, dan batas itu tidak pernah berlaku. Goresan di luar batas berhenti bisa diurungkan, TIDAK dihapus dari gambar. (Fase 15, bagian uji 102.)

53. **Interaksi "tahan" melepas lewat `window`, bukan lewat tombolnya.** Elemen yang menyembunyikan dirinya sendiri tidak bisa lagi menerima `pointerup`. (Fase 15, bagian uji 103.)

54. **Jangan memusatkan elemen absolut dengan `left: 50%` saja.** Itu memangkas lebar yang TERSEDIA jadi separuh dan memicu pembungkusan palsu. Pakai `left:0; right:0; margin-inline:auto`. (Fase 13 butir 46 & Fase 15, bagian uji 101.)

55. **Potret kini dikunci** — lihat butir 17. Aturan lama tentang potret yang boleh menggulir hanya berlaku sebelum Fase 9: boleh menggulir, tapi marginnya harus lega — bukan dimampatkan sampai sesak. (Fase 8, bagian uji 51.)

56. **Menggambar bebas WAJIB menyambung ke titik yang belum tergambar, bukan ke titik terakhir.** Satu peristiwa gerak bisa membawa banyak titik (`getCoalescedEvents`); menggambar hanya ruas terakhir menyisakan celah yang hanya muncul saat disapu cepat. Goresan hidup menyimpan penanda "sudah tergambar sampai titik ke berapa". (Fase 15.5, bagian uji 104.)

57. **Penghapus papan coret bekerja per-GORESAN, bukan per-piksel.** Yang ingin dibuang siswa selalu satu simbol utuh; penghapus piksel menyisakan puing separuh angka. Konsekuensinya riwayat undo menyimpan TINDAKAN, bukan goresan — satu sapuan yang membuang tiga goresan tetap satu langkah undo, dan pengembaliannya harus terbalik dari urutan pembuangan. (Fase 15.5, bagian uji 104.)

58. **Latar papan coret PADAT, dan latar itu milik CSS — bukan bitmap kanvas.** Mengecatnya ke bitmap membuat setiap piksel ber-alfa penuh, dan seluruh pengujian yang menghitung tinta lewat `getImageData` kehilangan maknanya tanpa pernah gagal. (Fase 15.5, bagian uji 104.)

59. **Elemen yang menyembunyikan dirinya sendiri harus dikecualikan dari `pointer-events: none`-nya sendiri kalau ia masih perlu menerima pelepasan.** Ini pelengkap butir 53, bukan penggantinya: listener di tombol menangani kasus normal, jaring di `window` menangani jari yang lepas di luar tombol. Keduanya wajib ada. (Fase 15.5, bagian uji 104.)

60. **Pakai ulang engine sebagai SUB-ENGINE, jangan disalin.** Satu mekanik = satu kelas. Sub-engine dipasang dengan `hintHost` sendiri dan WAJIB meng-override `complete()` supaya tidak memasang banner "lanjut ke Mini Kuis" di tengah alur; `destroy()` induk wajib membongkarnya. (Fase 16, bagian uji 58 & 105.)

61. **Bentuk akhir invers ditulis sebagai satu pecahan DI DEPAN kurung**, bukan dikalikan masuk ke tiap elemen. Itulah bentuk yang dipakai di papan tulis dan lembar jawaban TKA; perkalian skalar per elemen sudah punya sub-topiknya sendiri di Bab 2. Pecahan dan kurungnya wajib satu unit `nowrap` — pembungkusan baris memisahkan keduanya dan notasinya berhenti berarti. (Fase 16, bagian uji 57 & 58.)

62. **Pengisian otomatis hanya boleh setelah siswa membuktikan metodenya, dan WAJIB ditandai.** Satu-satunya tempat yang memakainya adalah enam sel kofaktor terakhir pada invers 3×3, sesudah tiga sel dikerjakan manual. Penanda `auto` di sel dan kalimat terus terang di prompt adalah SYARAT pengecualian ini — tanpa keduanya, ia melanggar "aplikasi tidak pernah menghitung untuk siswa". (Fase 16, bagian uji 58.)

63. **Animasi yang menulis `textContent` MENGHAPUS anak elemen sel.** `swapArc()` dan `flipSign()` menyapu label alamat, dan selnya terbaca "4a22". Sel yang punya anak elemen wajib ditulis ulang dari `dataset.value` sesudah animasi. (Fase 16, bagian uji 57.)

64. **Label yang berubah di tengah simulasi harus berlebar TETAP.** Nama matriks duduk di atas kurung, jadi `A` → `adj(A)` menggeser matriksnya 15px terukur. (Fase 16, bagian uji 57 & 58.)

65. **`renderMixed()` hanya mengenali `$…$`.** `$$…$$` meninggalkan dolar mentah di layar. Placeholder toast memakai `{{kunci}}`, bukan `{kunci}` — kurung tunggal lolos tanpa galat dan tampil apa adanya. (Fase 16, bagian uji 105.)

66. **Memesan ruang berarti memesan ruang yang BENAR-BENAR akan dipakai.** Kotak kosong yang di-`visibility:hidden` hanya memesan ruang seukuran isinya — dan isi kosong tingginya nol. Isi kotaknya lebih dulu, baru sembunyikan. (Fase 17, bagian uji 106.)

67. **Jangan pernah membaca `cell.textContent` pada sel yang punya anak elemen.** Label alamat dan tanda centang adalah `<span>` anak, dan `textContent` menggabungkan semuanya: sel bernilai 10 terbaca "10a11". `dataset.value` satu-satunya sumber yang bersih. (Fase 16 butir 63 & Fase 17, bagian uji 108.)

68. **`classList.add('')` melempar `SyntaxError`.** Kelas yang dihitung lewat ekspresi kondisional WAJIB diperiksa dulu; satu string kosong menghentikan seluruh perulangan penilaian di tengah jalan. (Fase 17, bagian uji 109.)

69. **Panel yang baru muncul harus dibawa ke pandangan.** Alur bertahap yang tumbuh ke bawah bisa menaruh pertanyaan di luar layar; panggung boleh menggulir, tetapi siswa tidak boleh harus mencarinya. (Fase 17, bagian uji 107 & 109.)

70. **Sub-topik yang isinya berganti total mendapat ID BARU.** Mempertahankan id lama akan menandai siswa sudah menyelesaikan sesuatu yang tidak pernah ia kerjakan. (Fase 17: `spltv_matriks` → `ekstraksi_elemen`.)

71. **Mode ujian TIDAK memberi umpan balik langsung, dan TIDAK melanjutkan sesi.** Butir 28 ("posisi siswa diingat") berlaku untuk Belajar dan Mini Kuis; di ujian ia justru salah — ujian yang bisa ditinggal lalu dilanjutkan membuat siswa bebas mencari jawaban di antara dua sesi. Gantinya WAJIB ada: peringatan jujur sebelum keluar, percobaan baru yang bersih, dan riwayat skor yang tetap tersimpan. (Fase 18, bagian uji 53 & 110.)

72. **Mini Kuis dan Ujian adalah DUA mesin, bukan dua mode dari satu mesin.** `QuizEngine` (umpan balik langsung, navigasi terkunci, mastery learning) dan `ExamEngine` (tertunda, navigasi bebas, penilaian serentak) punya kontrak yang berlawanan; menyatukannya membuat tiap cabang `if` berarti dua hal. (Fase 18.)

73. **Arsip soal DIBANGKITKAN dari JSON, tidak pernah ditulis tangan.** `python tests/archive_soal.py` membangun `QUIZ_ARCHIVE.md` dan `TKA_ARCHIVE.md`. Arsip cetak yang disunting manual akan menyimpang dari soal yang benar-benar dilihat siswa, dan arsip yang menyimpang lebih berbahaya daripada tidak ada arsip. (Fase 18, bagian uji 113.)

74. **Data tabel ditulis sebagai DATA, bukan markdown di dalam prompt.** `renderMixed()` tidak mengenal sintaks tabel — pipanya tampil mentah di layar. Pakai `q.table = {headers, rows}`, dan `q.after` untuk kalimat pertanyaan yang harus berdiri sesudah tabelnya. (Fase 18, bagian uji 110.)

75. **Kotak isian tidak boleh menyentuh garis kurung matriks.** Kurung digambar `::before`/`::after` selebar 9px di tepi `.matrix__bracket`; isian kuis jauh lebih besar daripada sel biasa dan butuh padding sendiri. Kalau layarnya benar-benar sempit, WADAHNYA yang menggulir — bukan isinya yang dimampatkan sampai berhimpit. (Fase 18, bagian uji 111.)

76. **Menutup Mathpad dari luar MENYIMPAN; hanya Escape yang membatalkan — dan pembatalan wajib mengembalikan isi kotaknya.** `sync()` menulis tiap ketukan langsung ke field sebagai pratinjau, jadi membatalkan tanpa memulihkan meninggalkan angka yang terlihat padahal tidak tersimpan. Auto-simpan terjadi saat pad DITUTUP, bukan per ketukan: sebagian pemakai menilai jawaban di `onCommit`, dan pengiriman per digit akan menyalahkan jawaban yang belum selesai diketik. (Fase 18.5, bagian uji 115.)

77. **Teks ber-markdown WAJIB lewat `renderMixed()`.** `el(tag, cls, html)` menaruh argumen ketiganya sebagai `innerHTML` mentah; `**tebal**` akan tampil beserta bintangnya. `renderMixed()` sendiri sudah lama benar — yang keliru adalah tidak memanggilnya. (Fase 18.5, bagian uji 114.)

78. **Setiap soal WAJIB menuliskan pertanyaannya, tepat di atas pilihan.** Konteks di `prompt`, data di `tex`/`table`, dan kalimat pertanyaannya di `after`. Soal yang berhenti di "Perhatikan matriks berikut!" memaksa siswa menebak apa yang diminta. (Fase 18.5, bagian uji 114.)

79. **Papan coret hidup di mode ujian, dibuat SEKALI per sesi.** Soal TKA menuntut hitungan panjang; tanpa tempat mencoret siswa kehilangan konteks soalnya ke kertas. Coretan wajib bertahan saat berpindah soal, dan `destroy()` wajib dipanggil sebelum sesi diulang — papan memegang `ResizeObserver` dan listener `window` yang selamat dari `innerHTML = ''` (butir 31). (Fase 18.5, bagian uji 116.)

80. **Jangan pernah menampilkan angka yang tidak bisa ditelusuri siswa.** Kartu "N Lencana terbuka" bertahan berfase-fase padahal sistem lencananya tidak pernah ada. Angka di dasbor harus merujuk sesuatu yang bisa dilihat, dikejar, dan dinaikkan. (Fase 18.5, bagian uji 116.)

81. **Papan coret bawaannya BERDAMPINGAN: soal dan kertas terlihat bersamaan, dan soal tetap bisa dijawab.** Kertas yang menutupi soal memaksa siswa bolak-balik; Mengintip hanya meringankan gejalanya. Kertas penuh dan kalkir tetap tersedia sebagai pilihan sadar. (Fase 19, bagian uji 117.)

82. **Goresan papan coret berkoordinat PIKSEL relatif sudut kiri-atas kertas, bukan 0..1.** Begitu lebar kertas bisa berganti, koordinat ternormalisasi meregangkan tulisan siswa. Kertas yang menyempit cukup menyembunyikan bagian kanannya. (Fase 19, bagian uji 117.)

83. **Lebar yang bisa diatur siswa dijaga dua lapis: rasio DAN piksel.** Rasio menyatakan keinginan; piksel menjamin kedua sisi tetap bisa dipakai (kertas ≥ 400px, soal ≥ 300px). Di panggung < 700px berdampingan jatuh ke kertas penuh TANPA mengubah pilihan siswa. (Fase 19, bagian uji 117–118.)

84. **Escape milik lapisan yang paling atas.** Mathpad dan modal didahulukan; papan coret menutup bakinya dulu, baru dirinya. Satu tekanan tidak boleh menutup dua lapisan. (Fase 19, bagian uji 118.)

85. **Elemen yang dilipat ke baki tetap elemen yang SAMA.** Bilah ringkas hanya mengubah CSS; selektor, label, dan pendengar `.pad__swatch`/`.pad__width` tidak diduplikasi. (Fase 19, bagian uji 101 & 118.)

86. **Token merek SUMBER tidak disentuh perombakan visual.** `--paper`, `--royal`, `--cyan`, `--yellow`, `--magenta`, `--ink`, Montserrat/Roboto, dan tiga blob adalah identitas yang dipatok pengujian. Penyegaran tampilan bekerja di token TURUNAN dan di cara komponen memakainya. Teks konteks soal yang panjang tidak boleh berupa paragraf tebal — hanya kalimat pertanyaannya yang tegas. (Fase 19, bagian uji 6, 16, 98.)

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

Identitas disimpan di **`localStorage`** dengan kunci `matriksLab.identity.v1`
(pindah dari `sessionStorage` di Fase 14). Alasannya lapangan: `sessionStorage`
hanya hidup di SATU tab, jadi menyegarkan halaman atau membuka tab baru melempar
siswa kembali ke layar masuk dan memaksanya mengetik nama lagi lewat papan huruf.

> ⚠️ **Keputusan ini berpasangan dengan tombol "Ganti Akun".** Karena identitas
> kini menempel, perangkat kelas yang dipakai bergantian akan terus menyapa
> siswa PERTAMA sampai ada yang menggantinya. Tombol di menu utama itulah jalan
> keluarnya — **jangan hapus salah satunya tanpa yang lain.**

`clearIdentity()` membuang identitas + posisi belajar (`clearAllResume()`),
tetapi **TIDAK** menyentuh pencapaian di `progressStore`: itu milik perangkat,
bukan milik satu siswa, dan menghapusnya diam-diam akan membuang pekerjaan
seisi kelas. Menghapus progres punya pintunya sendiri ("Reset Progres").

Penjaga rute (`router.setGuard`, Fase 11) mengalihkan ke `#/login` bila identitas
belum ada. **Uji otomatis harus menyemai identitas** lewat `page.add_init_script`
ke `localStorage` — kalau tidak, setiap rute akan berakhir di layar masuk.

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

**Utang invers 3×3 sudah LUNAS di Fase 16 (§0000).**
Catatan lama di bawah dipertahankan sebagai riwayat keputusannya.

~~Satu-satunya yang sudah dijadwalkan: simulasi invers 3×3 (Fase 10).~~
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
6. **Commit Fase 16 s/d 18.5 belum di-push.** `origin/main` ada di `ccfc7d7` (Fase 15.5 — versi yang dipakai siswa sekarang); keempatnya hanya ada di mesin ini. Lihat **§1A** sebelum memutuskan push.

---

## 12. Aturan Kerja yang Diharapkan Pengguna

Dikumpulkan dari lima belas fase kerja sama. Ini penting untuk diikuti sesi berikutnya.

- **Kerjakan tuntas, jangan berhenti di tengah.** Bila diberi daftar 10 poin, kerjakan sepuluh-sepuluhnya lalu laporkan.
- **Laporkan apa adanya.** Kalau ada yang gagal, katakan gagal beserta keluarannya. Jangan mengklaim selesai tanpa menjalankan pengujian.
- **Verifikasi dengan pengukuran, bukan pembacaan kode.** Dua bug terakhir tidak terlihat dari kode — hanya ketahuan setelah geometri diukur di peramban. Ambil tangkapan layar, ukur `getBoundingClientRect()`, cek `scrollWidth`.
- **Setiap perbaikan bug UI dapat pengujian regresi.** Suite ini tumbuh dari 134 → **656** justru karena itu (300 → … → 513 → 569 → 611 → 632 → 656 di fase 11–19).
- **Komentar dalam Bahasa Indonesia**, menjelaskan alasan di balik keputusan.
- **Utamakan alasan pedagogis.** Aplikasi ini tidak boleh menghitung untuk siswa. Setiap perubahan mekanik dinilai dari apakah ia membuat siswa mengerjakan matematikanya sendiri.
- Pengguna memakai bahasa Indonesia. Balas dalam bahasa Indonesia.
