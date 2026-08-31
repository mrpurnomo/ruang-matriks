# HANDOFF — Ruang Matriks

> Dokumen serah-terima antar sesi. Diperbarui **1 September 2026**, menutup Fase 16.
> Status: **fase 1–16 selesai, seluruh pengujian otomatis hijau (21/21 + 513/513).**
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

Keadaan per **1 September 2026**, sesaat setelah Fase 16 ditutup:

| | |
|---|---|
| Pekerjaan terakhir | **Fase 16 — Invers & Persamaan Matriks** (§0000). Selesai, teruji, sudah di-commit lokal |
| Pengujian | `node tests/engine.test.mjs` → **21/21** · `python tests/smoke.py` → **513/513** |
| Git | **1 commit di depan `origin/main`**: hanya Fase 16. Fase 15 s/d 15.5 sudah ada di remote (di-push pengguna sendiri). Fase 16 sengaja belum di-push (§1A) |
| Pekerjaan tertunda | **Tidak ada.** Fase 16 tuntas; seluruh 22 sub-topik kini punya simulasi sungguhan |

### Tiga hal yang paling mudah dilanggar sesi baru

1. **Jangan `git push`.** Aplikasi ini dipakai siswa secara langsung dan remote
   tersambung ke hosting. Push selalu butuh izin baru — lihat **§1A**.
2. **Perbaikan CSS masuk ke berkas fase tertinggi** (`css/phase16.css`), karena
   `index.html` memuatnya paling akhir dan yang belakangan menimpa yang duluan.
3. **Ukur di peramban, jangan menyimpulkan dari kode.** Daftar panjang jebakan
   yang sudah menggigit ada di §6 dan §000 — hampir semuanya tak terlihat dari
   pembacaan kode.

`smoke.py` berjalan ±12 menit. Jalankan di latar belakang, jangan dikira
menggantung.

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
| `main` lokal | **1 commit di depan remote**: `4706b7a` (Fase 16 · invers & persamaan) |
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

### Status pengujian per 31 Agustus 2026 — **terverifikasi, bukan klaim**

| Suite | Hasil |
|---|---|
| `node tests/engine.test.mjs` | **21/21 lolos** |
| `python tests/smoke.py` | **513/513 lolos** |

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
│   └── phase16.css                    ← DIMUAT TERAKHIR: invers & persamaan
│                                        (slot skalar, cap air kofaktor,
│                                        panel minor, balok persamaan)
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
│   │   ├── scratchpad.js              ← FASE 15/15.5: papan coret (vektor, penghapus
│   │   │                                goresan, bilah alat, Mengintip)
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
│       │       └── simModeling.js 498  Bab 4
│       └── kuis/
│           ├── quizEngine.js          Satu soal per layar + navigasi maju-mundur
│           └── quizResult.js     138
│
└── tests/
    ├── engine.test.mjs                21 pengujian matematika murni
    └── smoke.py                       513 pengujian Playwright, 105 bagian
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

24 engine terdaftar (Fase 16 menambah `inverse3x3` & `equation_solver`):

```
identify_element · ordo_builder · label_matrix_types · transpose_morph · equality_link
elementwise_op · scalar_sweep · combo_op · ordo_check · matrix_multiply · property_cards
det2x2 · det3x3_sarrus · singular_check · property_calculator
inverse2x2 · inverse3x3 · equation_solver          (Fase 16)
adjoint_flow · matrix_equation                     (alias nama lama)
data_translation · spl_solver · multi_statement
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
6. **Commit Fase 16 belum di-push.** `origin/main` ada di `ccfc7d7` (Fase 15.5 — versi yang dipakai siswa sekarang); `4706b7a` (Fase 16) hanya ada di mesin ini. Lihat **§1A** sebelum memutuskan push.

---

## 12. Aturan Kerja yang Diharapkan Pengguna

Dikumpulkan dari lima belas fase kerja sama. Ini penting untuk diikuti sesi berikutnya.

- **Kerjakan tuntas, jangan berhenti di tengah.** Bila diberi daftar 10 poin, kerjakan sepuluh-sepuluhnya lalu laporkan.
- **Laporkan apa adanya.** Kalau ada yang gagal, katakan gagal beserta keluarannya. Jangan mengklaim selesai tanpa menjalankan pengujian.
- **Verifikasi dengan pengukuran, bukan pembacaan kode.** Dua bug terakhir tidak terlihat dari kode — hanya ketahuan setelah geometri diukur di peramban. Ambil tangkapan layar, ukur `getBoundingClientRect()`, cek `scrollWidth`.
- **Setiap perbaikan bug UI dapat pengujian regresi.** Suite ini tumbuh dari 134 → **513** justru karena itu (300 → 346 → 383 → 403 → 409 → 425 → 451 → 469 → 513 di fase 11–16).
- **Komentar dalam Bahasa Indonesia**, menjelaskan alasan di balik keputusan.
- **Utamakan alasan pedagogis.** Aplikasi ini tidak boleh menghitung untuk siswa. Setiap perubahan mekanik dinilai dari apakah ia membuat siswa mengerjakan matematikanya sendiri.
- Pengguna memakai bahasa Indonesia. Balas dalam bahasa Indonesia.
