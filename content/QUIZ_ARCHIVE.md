# Arsip Soal — Ruang Matriks

Salinan cetak seluruh bank soal beserta **kunci jawabannya**, untuk pegangan guru.

> ⚠️ **Berkas ini DIBANGKITKAN dari `data/quizzes.json`.** Jangan disunting
> langsung — suntinganmu akan hilang saat dibangkitkan ulang. Ubah JSON-nya,
> lalu jalankan `python tests/archive_soal.py`.

Seluruh kunci di bawah sudah diverifikasi ulang secara matematis (Fase 18, bagian QA).

---

## Bab 1: Konsep Dasar Matriks

*5 soal.*

### Soal 1

- **ID:** `b1_01`
- **Tipe:** Isian angka (papan angka)
- **Sub-topik:** `pengertian_letak`

Diketahui $M = \begin{pmatrix} 3 & -1 & 5 \\ 2 & 0 & 4 \\ -6 & 7 & 1 \end{pmatrix}$. Tentukan nilai $m_{31} + m_{13}$.

> **KUNCI JAWABAN:** **-1**

**Pembahasan.** $m_{31} = -6$ (baris 3, kolom 1) dan $m_{13} = 5$ (baris 1, kolom 3). Jadi $-6 + 5 = -1$.

---

### Soal 2

- **ID:** `b1_02`
- **Tipe:** Pilihan ganda (satu jawaban benar)
- **Sub-topik:** `ordo_matriks`

Matriks $\begin{pmatrix} 1 & 0 & 4 \\ 2 & 5 & -1 \end{pmatrix}$ berordo ....

A. $3 \times 2$
B. $2 \times 3$
C. $6 \times 1$

> **KUNCI JAWABAN:** **B** — $2 \times 3$

**Pembahasan.** Ada 2 baris dan 3 kolom, jadi ordonya $2 \times 3$ (baris dulu, baru kolom).

---

### Soal 3

- **ID:** `b1_03`
- **Tipe:** Pilih semua jawaban benar
- **Sub-topik:** `jenis_matriks`

Pilih **semua** pernyataan yang benar tentang matriks identitas $I$.

A. $I$ selalu berbentuk matriks persegi.
B. $I$ juga termasuk matriks diagonal.
C. Semua elemen $I$ bernilai 1.
D. $A \times I = A$ untuk matriks persegi $A$ berordo sama.

> **KUNCI JAWABAN:** **A, B, D**

**Pembahasan.** Pernyataan 1, 2, dan 4 benar. Pernyataan 3 keliru karena elemen di luar diagonal utama bernilai nol, bukan satu.

**Penjelasan per opsi:**

- **A.** Benar — identitas selalu persegi.
- **B.** Benar — identitas adalah bentuk khusus matriks diagonal.
- **C.** Salah — hanya elemen DIAGONAL UTAMA yang bernilai 1; sisanya bernilai 0.
- **D.** Benar — inilah sifat identitas perkalian.

---

### Soal 4

- **ID:** `b1_04`
- **Tipe:** Isian matriks
- **Sub-topik:** `transpose`

Tentukan $P^T$ jika $P = \begin{pmatrix} 2 & -5 \\ 0 & 3 \\ 1 & 4 \end{pmatrix}$.

> **KUNCI JAWABAN:** $\begin{pmatrix} 2 & 0 & 1 \\ -5 & 3 & 4 \end{pmatrix}$

**Pembahasan.** $P$ berordo $3\times2$, jadi $P^T$ berordo $2\times3$. Kolom pertama $P$ (2, 0, 1) menjadi baris pertama $P^T$.

---

### Soal 5

- **ID:** `b1_05`
- **Tipe:** Isian angka (papan angka)
- **Sub-topik:** `kesamaan_matriks`

Tentukan nilai $a$ jika $\begin{pmatrix} 3a & 1 \\ 4 & 2 \end{pmatrix} = \begin{pmatrix} 12 & 1 \\ 4 & 2 \end{pmatrix}$.

> **KUNCI JAWABAN:** **4**

**Pembahasan.** Dari elemen seletak $a_{11}$: $3a = 12 \implies a = 4$.

---

## Bab 2: Operasi Aljabar Matriks

*5 soal.*

### Soal 1

- **ID:** `b2_01`
- **Tipe:** Isian matriks
- **Sub-topik:** `penjumlahan_pengurangan`

Tentukan $A + B$ jika $A = \begin{pmatrix} 2 & -1 \\ 0 & 4 \end{pmatrix}$ dan $B = \begin{pmatrix} 3 & 5 \\ -2 & 1 \end{pmatrix}$.

> **KUNCI JAWABAN:** $\begin{pmatrix} 5 & 4 \\ -2 & 5 \end{pmatrix}$

**Pembahasan.** Jumlahkan elemen seletak: $2+3=5$, $-1+5=4$, $0+(-2)=-2$, $4+1=5$.

---

### Soal 2

- **ID:** `b2_02`
- **Tipe:** Isian matriks
- **Sub-topik:** `perkalian_skalar`

Tentukan $3A$ jika $A = \begin{pmatrix} 1 & -2 \\ 4 & 0 \end{pmatrix}$.

> **KUNCI JAWABAN:** $\begin{pmatrix} 3 & -6 \\ 12 & 0 \end{pmatrix}$

**Pembahasan.** Kalikan setiap elemen dengan 3: $3, -6, 12, 0$.

---

### Soal 3

- **ID:** `b2_03`
- **Tipe:** Isian matriks
- **Sub-topik:** `perkalian_matriks`

Tentukan $A \times B$ jika $A = \begin{pmatrix} 1 & 2 \\ 3 & 0 \end{pmatrix}$ dan $B = \begin{pmatrix} 2 & 1 \\ 1 & 4 \end{pmatrix}$.

> **KUNCI JAWABAN:** $\begin{pmatrix} 4 & 9 \\ 6 & 3 \end{pmatrix}$

**Pembahasan.** $c_{11}=1(2)+2(1)=4$; $c_{12}=1(1)+2(4)=9$; $c_{21}=3(2)+0(1)=6$; $c_{22}=3(1)+0(4)=3$.

---

### Soal 4

- **ID:** `b2_04`
- **Tipe:** Pilihan ganda (satu jawaban benar)
- **Sub-topik:** `perkalian_matriks`

Matriks $A$ berordo $2 \times 5$ dan $B$ berordo $5 \times 3$. Ordo dari $A \times B$ adalah ....

A. $5 \times 5$
B. $2 \times 3$
C. $3 \times 2$

> **KUNCI JAWABAN:** **B** — $2 \times 3$

**Pembahasan.** Angka tengah (5 dan 5) cocok, sehingga perkalian valid. Ordo hasil mengambil angka luar: $2 \times 3$.

---

### Soal 5

- **ID:** `b2_05`
- **Tipe:** Pilih semua jawaban benar
- **Sub-topik:** `sifat_operasi`

Pilih **semua** sifat operasi matriks yang berlaku secara umum.

A. $(A+B)+C = A+(B+C)$
B. $A \times B = B \times A$
C. $(A \times B) \times C = A \times (B \times C)$
D. $(A \times B)^T = B^T \times A^T$

> **KUNCI JAWABAN:** **A, C, D**

**Pembahasan.** Hanya pernyataan 2 yang salah. Perkalian matriks asosiatif dan punya sifat transpose terbalik, tapi tidak komutatif.

**Penjelasan per opsi:**

- **A.** Benar — penjumlahan matriks bersifat asosiatif.
- **B.** Salah — perkalian matriks TIDAK komutatif secara umum.
- **C.** Benar — perkalian matriks bersifat asosiatif (pengelompokan boleh digeser).
- **D.** Benar — dan perhatikan urutannya memang harus dibalik.

---

## Bab 3: Determinan dan Invers

*6 soal.*

### Soal 1

- **ID:** `b3_01`
- **Tipe:** Isian angka (papan angka)
- **Sub-topik:** `determinan_2x2`

Tentukan determinan dari $\begin{pmatrix} 7 & 3 \\ 2 & 4 \end{pmatrix}$.

> **KUNCI JAWABAN:** **22**

**Pembahasan.** $\det = (7)(4) - (3)(2) = 28 - 6 = 22$.

---

### Soal 2

- **ID:** `b3_02`
- **Tipe:** Isian angka (papan angka)
- **Sub-topik:** `determinan_3x3`

Dengan Metode Sarrus, tentukan determinan dari $\begin{pmatrix} 1 & 2 & 3 \\ 0 & 1 & 4 \\ 5 & 6 & 0 \end{pmatrix}$.

> **KUNCI JAWABAN:** **1**

**Pembahasan.** Diagonal turun: $(1)(1)(0)+(2)(4)(5)+(3)(0)(6) = 0+40+0 = 40$. Diagonal naik: $(5)(1)(3)+(6)(4)(1)+(0)(0)(2) = 15+24+0 = 39$. Jadi $\det = 40-39 = 1$.

---

### Soal 3

- **ID:** `b3_03`
- **Tipe:** Isian angka (papan angka)
- **Sub-topik:** `sifat_determinan`

Matriks $A$ berordo $3 \times 3$ dengan $\det(A) = 2$. Tentukan $\det(2A)$.

> **KUNCI JAWABAN:** **16**

**Pembahasan.** Gunakan $\det(kA) = k^n \det(A)$ dengan $n=3$: $\det(2A) = 2^3 \times 2 = 8 \times 2 = 16$.

---

### Soal 4 · Soal asli TKA Matematika Lanjut 2025

- **ID:** `b3_04`
- **Tipe:** Pilihan ganda (satu jawaban benar)
- **Sub-topik:** `invers_2x2`

Perhatikan matriks $F = \begin{pmatrix} 2 & 0 \\ 0 & \frac{1}{2} \end{pmatrix}$. Invers dari matriks $F$ adalah ....

A. $\begin{pmatrix} 1 & 0 \\ 0 & 2 \end{pmatrix}$
B. $\begin{pmatrix} \frac{1}{2} & 0 \\ 0 & 2 \end{pmatrix}$
C. $\begin{pmatrix} 2 & 0 \\ 0 & 1 \end{pmatrix}$
D. $\begin{pmatrix} -\frac{1}{2} & 0 \\ 0 & -2 \end{pmatrix}$

> **KUNCI JAWABAN:** **B** — $\begin{pmatrix} \frac{1}{2} & 0 \\ 0 & 2 \end{pmatrix}$

**Pembahasan.** $\det(F) = (2)(\frac{1}{2}) - 0 = 1$. Tukar diagonal utama: $\begin{pmatrix} \frac{1}{2} & 0 \\ 0 & 2 \end{pmatrix}$, lalu kalikan $\frac{1}{1}$ sehingga tidak berubah.

---

### Soal 5

- **ID:** `b3_05`
- **Tipe:** Isian matriks
- **Sub-topik:** `invers_2x2`

Tentukan invers dari $A = \begin{pmatrix} 4 & 3 \\ 1 & 1 \end{pmatrix}$.

> **KUNCI JAWABAN:** $\begin{pmatrix} 1 & -3 \\ -1 & 4 \end{pmatrix}$

**Pembahasan.** $\det(A) = 4-3 = 1$. Tukar diagonal utama dan balik tanda diagonal sekunder: $\begin{pmatrix} 1 & -3 \\ -1 & 4 \end{pmatrix}$.

---

### Soal 6

- **ID:** `b3_06`
- **Tipe:** Isian angka (papan angka)
- **Sub-topik:** `singular_nonsingular`

Tentukan nilai $x$ agar $\begin{pmatrix} x & 2 \\ 8 & 4 \end{pmatrix}$ menjadi matriks singular.

> **KUNCI JAWABAN:** **4**

**Pembahasan.** Singular berarti $\det = 0$: $4x - 16 = 0 \implies x = 4$.

---

## Bab 4: Pemodelan dan Aplikasi TKA

*4 soal.*

### Soal 1

- **ID:** `b4_01`
- **Tipe:** Isian angka (papan angka)
- **Sub-topik:** `spldv_matriks`

Diketahui sistem $2x + y = 11$ dan $x + y = 7$. Dengan metode matriks, tentukan nilai $x$.

$$ \begin{pmatrix} 2 & 1 \\ 1 & 1 \end{pmatrix}\begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} 11 \\ 7 \end{pmatrix} $$

> **KUNCI JAWABAN:** **4**

**Pembahasan.** $\det(A) = 2-1 = 1$, $A^{-1} = \begin{pmatrix} 1 & -1 \\ -1 & 2 \end{pmatrix}$. Maka $x = 1(11) - 1(7) = 4$.

---

### Soal 2 · Diadaptasi dari pola soal TKA Matematika Lanjut 2025

- **ID:** `b4_02`
- **Tipe:** Isian angka (papan angka)
- **Sub-topik:** `translasi_data`

Sebuah pabrik memerlukan bahan per botol: wedang jahe 20 g jahe, beras kencur 10 g jahe, kunir asem 12 g jahe. Jika pesanan berturut-turut 100, 120, dan 80 botol, berapa gram jahe yang dibutuhkan seluruhnya?

> **KUNCI JAWABAN:** **4160**

**Pembahasan.** Kalikan kebutuhan per botol dengan jumlah pesanan lalu jumlahkan: $20(100) + 10(120) + 12(80) = 2000 + 1200 + 960 = 4160$ gram.

---

### Soal 3

- **ID:** `b4_03`
- **Tipe:** Pilih semua jawaban benar
- **Sub-topik:** `analisis_multi_kondisi`

Pendapatan tiga cabang toko dalam sehari: Cabang A = Rp2.400.000, Cabang B = Rp2.400.000, Cabang C = Rp3.100.000. Pilih **semua** pernyataan yang benar.

A. Pendapatan Cabang A dan Cabang B sama besar.
B. Pendapatan paling besar diperoleh dari Cabang C.
C. Total pendapatan ketiga cabang lebih dari Rp8.000.000.
D. Selisih pendapatan Cabang C dan Cabang A adalah Rp700.000.

> **KUNCI JAWABAN:** **A, B, D**

**Pembahasan.** Pernyataan 1, 2, dan 4 benar. Hanya pernyataan 3 yang salah karena totalnya Rp7.900.000.

**Penjelasan per opsi:**

- **A.** Benar — keduanya sama-sama Rp2.400.000.
- **B.** Benar — Rp3.100.000 adalah nilai tertinggi.
- **C.** Salah — totalnya Rp7.900.000, yang justru KURANG dari Rp8.000.000.
- **D.** Benar — Rp3.100.000 − Rp2.400.000 = Rp700.000.

---

### Soal 4

- **ID:** `b4_04`
- **Tipe:** Pilihan ganda (satu jawaban benar)
- **Sub-topik:** `ekstraksi_elemen`

Sistem $\begin{cases} x + y + z = 6 \\ 2x + y = 5 \\ y + 3z = 11 \end{cases}$ ditulis sebagai $AX = B$. Matriks koefisien $A$ yang benar adalah ....

A. $\begin{pmatrix} 1 & 1 & 1 \\ 2 & 1 & 0 \\ 0 & 1 & 3 \end{pmatrix}$
B. $\begin{pmatrix} 1 & 1 & 1 \\ 2 & 1 & 1 \\ 1 & 1 & 3 \end{pmatrix}$
C. $\begin{pmatrix} 6 & 5 & 11 \\ 1 & 1 & 1 \\ 2 & 1 & 3 \end{pmatrix}$

> **KUNCI JAWABAN:** **A** — $\begin{pmatrix} 1 & 1 & 1 \\ 2 & 1 & 0 \\ 0 & 1 & 3 \end{pmatrix}$

**Pembahasan.** Variabel yang tidak muncul diberi koefisien **0**, bukan 1. Persamaan kedua tidak memuat $z$ (koefisien 0), dan persamaan ketiga tidak memuat $x$ (koefisien 0).

---

*Total 20 soal latihan per bab.*
