# Bab 4: Pemodelan Matematika dan Aplikasi TKA

Ini dia bab yang menjawab pertanyaan yang mungkin sering muncul di kepalamu: **"Buat apa sih belajar matriks?"** Di bab ini, semua yang sudah kamu kuasai — operasi aljabar (Bab 2), determinan, dan invers (Bab 3) — akan dipakai untuk membedah soal cerita sungguhan, gaya soal yang sering muncul di TKA.

Bedanya dengan tiga bab sebelumnya: di sini yang dilatih **bukan lagi kemampuan menghitung**, melainkan kemampuan **membaca**. Menerjemahkan cerita jadi matriks, mengenali bentuk jawaban tanpa menghitungnya habis, dan tahu bagian mana dari matriks besar yang sebenarnya perlu disentuh. Ketiganya menghemat menit-menit yang menentukan di ruang ujian.

---

## 1. Translasi Data & Aturan Domino (Literasi Numerasi)

### A. Materi

Kelemahan terbesar siswa di soal cerita matriks **bukan** pada hitungannya — melainkan pada langkah paling awal: **mengubah narasi menjadi bentuk matriks yang benar**. Salah menaruh satu angka, seluruh jawaban ikut salah, dan kesalahan itu tidak akan pernah ketahuan dari hasil hitungnya.

Langkah pertama selalu sama: tentukan dulu **apa yang menjadi baris** dan **apa yang menjadi kolom**, lalu konsisten sampai akhir. Untuk data produksi, konvensi yang paling aman adalah *baris = pelaku (cabang/toko/orang)* dan *kolom = objek (jenis barang)*.

> **Aturan Domino.** Sebelum mengalikan dua matriks, tempelkan ordonya berdampingan:
> $$ (m \times \mathbf{n})(\mathbf{p} \times q) $$
> Angka **dalam** ($n$ dan $p$) harus **sama** agar perkaliannya terdefinisi. Angka **luar** ($m$ dan $q$) menjadi ordo hasilnya.

Namanya "domino" karena persis seperti kartu domino: dua matriks hanya bisa disambung kalau angka yang **bersentuhan** cocok. Kalau tidak cocok, jawaban soalnya adalah *"tidak dapat ditentukan"* — dan opsi itu sering jadi jawaban benar yang dilewatkan siswa di TKA.

Memeriksa Aturan Domino butuh tiga detik dan bisa langsung menggugurkan beberapa opsi sekaligus. Menghitung dulu lalu baru sadar ordonya tidak cocok akan membuang satu menit penuh.

### B. Kegiatan Interaktif / Simulasi Terpandu

Simulasi berjalan dua tahap pada satu cerita tentang produksi toko roti.

1. **Parsing visual.** Cerita ditampilkan utuh, dan **setiap angka di dalamnya bisa diketuk**. Kamu mengetuk sebuah angka (ia terangkat dan menguning), lalu mengetuk **sel** tempat angka itu seharusnya duduk; angkanya kemudian terbang ke sel tersebut. Semua sel kosong ikut menyala saat kamu memegang sebuah angka — **bukan hanya sel yang benar**, karena kalau begitu aplikasinya yang menjawab, bukan kamu. Salah tempat akan ditolak dengan menyebut alamat yang kamu ketuk, mis. *"Angka 12 tidak duduk di $A_{21}$."*
2. **Aturan Domino.** Setelah kedua matriks penuh, ordonya muncul di bawah masing-masing: $2 \times 3$ dan $3 \times 1$. Tekan **Cek Aturan Domino**, dan kedua angka **dalam** akan berdenyut hijau, saling menghampiri, lalu menyatu — bukti visual bahwa syaratnya terpenuhi. Angka **luar** kemudian menguning dan membentuk ordo hasil $2 \times 1$.

### C. Mini Kuis

1. Matriks $P$ berordo $4 \times 2$ dan matriks $Q$ berordo $2 \times 5$. Apakah $PQ$ terdefinisi, dan jika ya, berapa ordonya?
2. Data penjualan 3 toko untuk 4 jenis barang disusun dengan **baris = toko**. Berapa ordo matriksnya?

---

## 2. Membaca Model Invers SPLDV (Gaya Opsi UTBK)

### A. Materi

Sistem persamaan linear dua variabel bisa ditulis sebagai $AX = B$:

$$ \begin{cases} ax + by = p \\ cx + dy = q \end{cases} \iff \begin{pmatrix} a & b \\ c & d \end{pmatrix}\begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} p \\ q \end{pmatrix} $$

Penyelesaiannya $X = A^{-1}B$ — invers dikalikan dari **depan**, karena hanya dengan begitu $A^{-1}A$ bisa bertemu dan lenyap menjadi $I$ (Bab 3 sub-topik 7).

> **Trik UTBK: berhenti di bentuk, jangan dihitung habis.**
> Sebagian besar soal SNBT/UTBK **tidak** menanyakan nilai $x$ dan $y$, melainkan menanyakan **bentuk mana yang benar**. Menghitung sampai angka terakhir hanya membuang menit.

Untuk memilih opsi yang benar, cukup periksa **tiga hal** ini:

1. Skalarnya $\dfrac{1}{\det}$ — bukan $\det$. Determinan adalah **penyebut**.
2. Diagonal **utama** sudah **bertukar tempat**.
3. Diagonal **sekunder** sudah **berganti tanda**.

Dan satu jebakan yang paling sering dipasang: **urutannya tidak boleh dibalik.** $A^{-1}B \ne BA^{-1}$. Pada bentuk $XA = B$, barulah inversnya di belakang. Opsi yang membalik urutan pada $AX = B$ sering bahkan tidak terdefinisi ordonya — dan itu bisa langsung kamu coret tanpa menghitung apa pun.

### B. Kegiatan Interaktif / Simulasi Terpandu

Tiga tahap, dengan cerita jual-beli ternak.

1. **Susun modelnya.** Seret (atau ketuk) angka dari narasi ke matriks koefisien $A$ dan matriks konstanta $B$, hingga terbentuk $AX = B$. Kolam angkanya sengaja memuat **pengecoh** yang tidak dipakai sama sekali.
2. **Cari $A^{-1}$.** Simulasi invers $2\times2$ dari Bab 3 muncul di sini **apa adanya** — mesin yang sama, bukan versi lain: hitung determinan, tukar diagonal utama, balik tanda diagonal sekunder, lalu pasang $\frac{1}{\det}$ di depan kurung.
3. **Baca opsinya.** Lima opsi bergaya UTBK (A–E) ditampilkan, dan kamu memilih bentuk $X = A^{-1}B$ yang **tepat** — tanpa pernah mengalikannya. Setiap opsi keliru punya penjelasannya sendiri: mana yang tandanya belum dibalik, mana yang skalarnya terbalik, mana yang diagonalnya belum ditukar, mana yang urutannya terbalik. Opsi yang sudah kamu coba salah akan **dikunci**, sehingga pilihanmu mengerucut.

### C. Mini Kuis

1. Diketahui $\begin{pmatrix} 2 & 1 \\ 5 & 3 \end{pmatrix}\begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} 8 \\ 21 \end{pmatrix}$. Manakah bentuk penyelesaian yang benar?
2. Dari sistem $\begin{pmatrix} 3 & 2 \\ 1 & 4 \end{pmatrix}\begin{pmatrix} s \\ k \end{pmatrix} = \begin{pmatrix} 47 \\ 29 \end{pmatrix}$, tentukan $\det(A)$.

---

## 3. Ekstraksi Elemen Tersembunyi (Sniper TKA)

### A. Materi

Soal TKA sering menyembunyikan satu variabel di dalam matriks besar, lalu menanyakan nilainya. Refleks kebanyakan siswa: mengalikan **seluruh** matriks — sembilan perkalian demi satu angka yang dicari.

> **Aturan Sniper.** Satu sel hasil $c_{ij}$ hanya dibentuk oleh **baris ke-$i$** matriks kiri dan **kolom ke-$j$** matriks kanan. Elemen lain sama sekali tidak ikut menentukannya.

Langkahnya cuma tiga:

1. Temukan sel hasil yang **angkanya sudah diketahui** dan yang barisnya memuat variabel yang dicari.
2. Ambil **hanya** baris itu dari matriks kiri dan kolom pasangannya dari matriks kanan.
3. Tulis sebagai persamaan linear biasa, lalu selesaikan seperti aljabar kelas 8.

Delapan perkalian yang tidak kamu kerjakan adalah delapan kesempatan salah hitung yang tidak kamu ambil. Di ujian berdurasi ketat, ini bukan sekadar lebih cepat — ini lebih **aman**.

### B. Kegiatan Interaktif / Simulasi Terpandu

Sebuah persamaan $A \times B = C$ berukuran $3\times3$ ditampilkan, dengan variabel $k$ tersembunyi di salah satu sel matriks $A$.

1. Kamu diminta mencari nilai $k$ **tanpa** mengalikan seluruh matriks. Ketuk sel yang memuat $k$. (Mengetuk sel lain akan ditolak beserta alasannya: yang menentukan hanyalah baris tempat $k$ berada.)
2. Seluruh panggung langsung **diredupkan**, dan hanya tiga hal yang tetap menyala: **baris** tempat $k$ berada di $A$, **kolom** pasangannya di $B$, dan **satu sel hasil** di $C$. Sisanya — delapan angka lain — memudar sampai nyaris hilang, dan di situlah pelajarannya terlihat.
3. Angka-angka yang menyala kemudian **ditarik keluar** satu per satu menjadi persamaan linear biasa, mis. $10(120) + 25(40) + k(60) = 2680$.
4. Nilai $k$ kamu hitung dan isi sendiri lewat papan angka.

### C. Mini Kuis

1. Diketahui $\begin{pmatrix} 4 & p \\ 2 & 3 \end{pmatrix}\begin{pmatrix} 5 \\ 6 \end{pmatrix} = \begin{pmatrix} 38 \\ 28 \end{pmatrix}$. Tentukan nilai $p$.
2. Untuk mencari satu variabel yang tersembunyi di baris ke-2 sebuah perkalian matriks $3\times3$, berapa banyak perkalian yang sebenarnya diperlukan?

---

## 4. Analisis Multi-Kondisi (Pilih Semua Jawaban Benar)

### A. Materi

Format **"pilih semua jawaban yang benar"** sudah muncul di TKA asli, dan ia menuntut strategi yang berbeda dari pilihan ganda biasa: setiap pernyataan dinilai **sendiri-sendiri**, jadi menebak satu pernyataan tidak membantu yang lain.

Strategi yang efisien selalu sama: **hitung dulu hasil perkaliannya secara utuh**, kunci angkanya, baru periksa pernyataan satu per satu dengan membandingkan. Kebalikannya — mengecek tiap pernyataan sambil menghitung ulang dari awal setiap kali — berarti mengulang perkalian yang sama tiga sampai empat kali, dan setiap pengulangan adalah kesempatan salah hitung yang baru.

Pada data bisnis, pola yang paling sering muncul adalah *harga per unit* dikali *kapasitas per cabang*:

$$ \underbrace{\begin{pmatrix} h_1 & h_2 & h_3 \end{pmatrix}}_{1 \times 3} \underbrace{\begin{pmatrix} k_{11} & k_{12} & k_{13} \\ k_{21} & k_{22} & k_{23} \\ k_{31} & k_{32} & k_{33} \end{pmatrix}}_{3 \times 3} = \underbrace{\begin{pmatrix} P_1 & P_2 & P_3 \end{pmatrix}}_{1 \times 3} $$

Hasilnya satu baris berisi **pendapatan tiap cabang** — dan seluruh pernyataan di soal akan merujuk ke tiga angka itu.

### B. Kegiatan Interaktif / Simulasi Terpandu

Dua tahap, dengan data sebuah percetakan tiga cabang.

1. **Hitung sendiri.** Matriks pendapatan **tidak** dihitungkan untukmu. Mesin perkalian matriks dari Bab 2 dipakai apa adanya: pilih sel hasil, bawa pasangan **baris × kolom**, lalu tekan tombol hitung — tiga sel, masing-masing dari tiga pasang angka.
2. **Nilai pernyataannya.** Matriks hasil kerjamu kemudian **dikunci di layar** (ia ikut menempel saat kamu menggulir), dan empat pernyataan bergaya "pilih semua yang benar" muncul di bawahnya. Setelah kamu menekan **Periksa Jawaban**, setiap pernyataan dinilai **satu per satu**, dan di bawah masing-masing muncul caption yang menyebutkan **angka pembandingnya** — bukan sekadar benar/salah, tapi *mengapa*.

### C. Mini Kuis

1. Berdasarkan matriks pendapatan yang kamu hitung, tentukan **semua** pernyataan yang benar.
2. Mengapa strategi menghitung hasil perkalian matriks lebih dulu secara utuh lebih efisien dibanding mengecek tiap pernyataan sambil menghitung ulang dari awal?

---

Selamat, kamu telah menyelesaikan seluruh perjalanan materi Matriks — dari mengenal elemen paling dasar hingga membedah soal TKA dengan strategi, bukan sekadar hitungan. Sekarang saatnya menguji seluruh pemahamanmu secara menyeluruh lewat mode **Kuis: Simulasi TKA**, yang mencampur semua tipe soal dari Bab 1 sampai Bab 4 secara acak — persis seperti yang akan kamu hadapi di ujian sesungguhnya.
