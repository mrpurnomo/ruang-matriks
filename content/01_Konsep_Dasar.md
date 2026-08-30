# Bab 1: Konsep Dasar Matriks

Halo! Sebelum kita menghitung apa pun, kenalan dulu dengan matriks. Tenang — kita mulai dari sesuatu yang kamu lihat setiap hari: **denah tempat duduk di kelasmu sendiri**.

---

## 1. Pengertian Matriks serta Letak Baris dan Kolom

### A. Materi

Coba bayangkan kelasmu. Meja-meja tersusun rapi: ada yang berjajar **ke samping**, ada yang berjajar **ke belakang**.

> **Baris** = deretan meja yang berjajar ke samping (kiri–kanan).
> **Kolom** = deretan meja yang berjajar ke belakang (depan–belakang).

Sekarang ganti setiap murid dengan sebuah angka. Susunan angka yang rapi dalam baris dan kolom itulah yang disebut **matriks**.

$$ A = \begin{pmatrix} 5 & -2 & 8 \\ 0 & 7 & 1 \end{pmatrix} $$

Matriks di atas seperti kelas dengan **2 baris** dan **3 kolom** — total 6 meja, 6 angka.

> **Alamat tempat duduk.** Setiap angka disebut **elemen**, dan punya alamat $a_{ij}$: $i$ = baris ke berapa, $j$ = kolom ke berapa. Selalu **baris dulu, baru kolom**.

Kalau gurumu memanggil "murid di baris 2, kolom 3", kamu langsung tahu siapa yang dimaksud. Begitu juga $a_{23}$ — turun ke baris ke-2, lalu geser ke kolom ke-3.

### B. Kegiatan Interaktif / Simulasi Terpandu

Simulasi berjalan dalam **tiga langkah**, masing-masing punya titik navigasi sendiri sehingga kamu bisa mengulang satu langkah tanpa memulai dari awal.

1. Satu deret meja menyala **berwarna biru**. Kamu memilih: baris ke berapa itu? Kalau salah, tombol jawaban itu **dimatikan** supaya kamu memilih dari sisa pilihan yang benar.
2. Satu deret meja menyala **berwarna oranye**. Kamu memilih kolom ke berapa.
3. Satu meja berkedip. Kamu **menyeret label alamat** ($a_{12}$, $a_{21}$, $a_{22}$) ke meja itu.

Legenda warna selalu tampil di atas panggung: biru = baris, oranye = kolom.

### C. Mini Kuis

1. Diketahui $B = \begin{pmatrix} 5 & -2 & 8 \\ 0 & 7 & 1 \end{pmatrix}$. Tentukan $b_{13} + b_{22}$.
2. Benar atau salah: pada notasi $a_{ij}$, angka $i$ menunjukkan letak kolom.

---

## 2. Ordo Matriks

### A. Materi

Kalau ada yang bertanya "kelasmu ukurannya berapa?", kamu akan menjawab misalnya "5 baris, 6 kolom". Itulah **ordo**.

> **Ordo** ditulis $m \times n$: $m$ = banyak baris, $n$ = banyak kolom. Dibaca "$m$ kali $n$", tapi ini **bukan** perkalian — hanya cara menyebut ukuran.

Matriks $A$ tadi punya 2 baris dan 3 kolom, jadi ordonya $2 \times 3$.

> **Jangan tertukar.** Kelas dengan **2 baris 3 kolom** berbeda dengan kelas **3 baris 2 kolom** — sama-sama 6 meja, tapi bentuk ruangannya lain.

### B. Kegiatan Interaktif / Simulasi Terpandu

Kamu mendapat dua slider (Baris dan Kolom) dan sebuah grid yang membesar/mengecil secara langsung.

Setiap tantangan berdiri sendiri: kamu mengatur ordo, lalu menekan tombol **Cek Ordo**. Barulah sistem memvalidasi dan memberi kartu hasil hijau. Setelah itu tantangan berikutnya dimulai dari **kondisi bersih 1×1** — tidak ada sisa pengaturan dari tantangan sebelumnya.

### C. Mini Kuis

1. Sebuah matriks memiliki 4 baris dan 2 kolom. Berapa total elemennya?
2. Matriks $P$ berordo $3 \times 3$ dan $Q$ berordo $3 \times 1$. Apakah ordonya sama?

---

## 3. Jenis-Jenis Matriks

### A. Materi

Beberapa susunan kelas punya nama khusus karena bentuknya sering muncul. Materi ini disajikan sebagai **carousel** — satu jenis per kartu, lengkap dengan bentuk visualnya:

1. **Matriks Baris** — hanya satu baris, ordo $1 \times n$.
2. **Matriks Kolom** — hanya satu kolom, ordo $m \times 1$.
3. **Matriks Persegi** — baris = kolom. Hanya jenis ini yang punya determinan dan invers.
4. **Matriks Nol** — semua elemennya nol.
5. **Matriks Diagonal** — matriks persegi yang hanya diagonal utamanya berisi.
6. **Matriks Identitas** — matriks diagonal yang diagonal utamanya bernilai 1 semua.

> **Boleh lebih dari satu.** Satu matriks bisa masuk **beberapa jenis sekaligus**. Matriks identitas, misalnya, sekaligus matriks diagonal DAN matriks persegi.

### B. Kegiatan Interaktif / Simulasi Terpandu

Sebuah matriks ditampilkan di tengah. Di bawahnya ada **kumpulan label** ("Matriks Baris", "Matriks Persegi", "Identitas", dst.).

Kamu **menyeret label ke matriks** — bukan sebaliknya. Karena satu matriks bisa punya beberapa jenis, kamu harus menemukan **semua** label yang cocok; label yang benar menempel di rak di bawah matriks, dan sistem memberi tahu berapa label lagi yang masih kurang.

Label yang keliru dimatikan permanen, disertai penjelasan spesifik (misalnya: *"Bukan Matriks Diagonal — ada elemen di luar diagonal utama yang nilainya bukan nol."*).

### C. Mini Kuis

1. Manakah yang **bukan** matriks diagonal?
2. Matriks $\begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix}$ termasuk jenis apa saja? (Pilih semua yang benar.)

---

## 4. Transpose Matriks

### A. Materi

Bayangkan gurumu mengubah denah kelas: murid yang tadinya duduk berjajar **ke samping** disuruh berdiri berjajar **ke belakang**. Itulah **transpose**.

> Transpose matriks $A$, ditulis $A^T$, mengubah setiap **baris menjadi kolom**. Baris ke-1 berdiri menjadi kolom ke-1, baris ke-2 menjadi kolom ke-2, dan seterusnya.

$$ A = \begin{pmatrix} 1 & 4 & 7 \\ 2 & 5 & 8 \end{pmatrix} \implies A^T = \begin{pmatrix} 1 & 2 \\ 4 & 5 \\ 7 & 8 \end{pmatrix} $$

Kalau $A$ berordo $m \times n$, maka $A^T$ berordo $n \times m$.

> **Bukan dibalik!** Transpose **bukan** mencerminkan atau melipat matriks. Urutan angka dalam satu baris tetap sama; baris itu hanya berpindah posisi menjadi kolom.

### B. Kegiatan Interaktif / Simulasi Terpandu

Matriks asal dan matriks hasil (masih kosong) ditampilkan berdampingan.

Kamu menekan tombol **"Pindahkan Baris 1 → Kolom 1"**. Baris ke-1 menyala biru, kolom ke-1 pada matriks hasil menyala oranye, lalu setiap elemen **berputar 90° sambil terbang** ke slotnya di kolom — satu per satu dengan jeda, sehingga terlihat jelas bahwa baris itu *berdiri*, bukan dicerminkan.

Prosesnya diulang untuk setiap baris. Metafora "melipat" sengaja dihilangkan karena memicu miskonsepsi.

### C. Mini Kuis

1. Diketahui $D = \begin{pmatrix} 3 & 0 & -2 \end{pmatrix}$. Manakah $D^T$ yang benar?
2. Jika matriks $E$ berordo $4 \times 2$, berapa ordo dari $(E^T)^T$?

---

## 5. Kesamaan Dua Matriks

### A. Materi

Dua kelas dikatakan "identik" kalau ukurannya sama DAN setiap meja diisi murid yang sama. Begitu juga dua matriks.

> $A = B$ jika: (1) **ordonya sama**, DAN (2) **setiap elemen seletak bernilai sama**. Kalau salah satu gagal, keduanya tidak sama.

Konsep ini dipakai untuk **mencari nilai variabel** yang tersembunyi:

$$ \begin{pmatrix} x+1 & 5 \\ 2 & y \end{pmatrix} = \begin{pmatrix} 4 & 5 \\ 2 & 9 \end{pmatrix} \implies x = 3,\ y = 9 $$

### B. Kegiatan Interaktif / Simulasi Terpandu

Dua matriks ditampilkan berdampingan dengan tanda $=$ di antaranya.

Kamu cukup **mengklik satu elemen di matriks kiri** — sistem otomatis menyalakan **pasangan seletaknya di matriks kanan**, lalu menampilkan panel kecil yang menjelaskan hubungan keduanya. Kalau elemen itu mengandung variabel, panel menunjukkan persamaan yang harus dipenuhi (misalnya $2q = 10$) beserta nilai variabelnya.

Tidak ada drag rumit — satu klik, langsung terlihat pasangannya.

### C. Mini Kuis

1. Tentukan nilai $p + q$ agar $\begin{pmatrix} p & 6 \\ -3 & 2q \end{pmatrix} = \begin{pmatrix} 7 & 6 \\ -3 & 10 \end{pmatrix}$.
2. Apakah $\begin{pmatrix} 1 & 2 \end{pmatrix}$ dan $\begin{pmatrix} 1 \\ 2 \end{pmatrix}$ sama?

---

Fondasimu sudah kokoh. Semua istilah di bab ini — baris, kolom, ordo, diagonal, transpose — akan terus dipakai di bab-bab berikutnya. Lanjut ke **Bab 2: Operasi Aljabar Matriks**.
