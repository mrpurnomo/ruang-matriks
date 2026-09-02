# Arsip Latihan Soal TKA — Ruang Matriks

Set **10 soal** yang dipakai mode *Latihan Soal TKA*, urut sesuai
yang dilihat siswa. Empat soal pertama adalah **soal asli TKA Matematika
Lanjut 2025**; enam sisanya dipilih tangan sebagai penutup bergaya HOTS.

> ⚠️ **Berkas ini DIBANGKITKAN dari `data/quizzes.json`.** Jangan disunting
> langsung — jalankan `python tests/archive_soal.py` setelah mengubah JSON-nya.

**Sumber soal 1–4:** `docs/TKA Matriks 2025.pdf` (Soal Asli TKA Matematika
Lanjut Tahun 2025). Ditranskrip apa adanya; kuncinya dihitung ulang dan
diverifikasi dengan `js/engine/matrix.js`.

---

### Soal 1 · TKA 2025 · No. 1

- **ID:** `tka25_01`
- **Tipe:** Pilihan ganda (satu jawaban benar)
- **Sub-topik:** `invers_2x2`

Perhatikan matriks berikut!

$$ F = \begin{pmatrix} 2 & 0 \\ 0 & \frac{1}{2} \end{pmatrix} $$

**Tentukan invers dari matriks $F$.**

A. $\begin{pmatrix} 1 & 0 \\ 0 & 2 \end{pmatrix}$
B. $\begin{pmatrix} -1 & 0 \\ 0 & -2 \end{pmatrix}$
C. $\begin{pmatrix} 2 & 0 \\ 0 & 1 \end{pmatrix}$
D. $\begin{pmatrix} -\frac{1}{2} & 0 \\ 0 & -2 \end{pmatrix}$
E. $\begin{pmatrix} \frac{1}{2} & 0 \\ 0 & 2 \end{pmatrix}$

> **KUNCI JAWABAN:** **E** — $\begin{pmatrix} \frac{1}{2} & 0 \\ 0 & 2 \end{pmatrix}$

**Pembahasan.** $\det(F) = (2)\left(\frac{1}{2}\right) - (0)(0) = 1$. Adjoinnya: tukar diagonal utama menjadi $\begin{pmatrix} \frac{1}{2} & 0 \\ 0 & 2 \end{pmatrix}$, diagonal sekundernya nol sehingga tandanya tidak berubah. Karena $\frac{1}{\det} = 1$, hasilnya tetap: $F^{-1} = \begin{pmatrix} \frac{1}{2} & 0 \\ 0 & 2 \end{pmatrix}$ — **opsi E**.

---

### Soal 2 · TKA 2025 · No. 2

- **ID:** `tka25_02`
- **Tipe:** Pilihan ganda (satu jawaban benar)
- **Sub-topik:** `spldv_matriks`

Pak Andi memiliki beberapa sapi dan kambing. Semua hewan ternaknya selalu diberikan pakan berupa campuran rumput gajah dan rumput gamal. Setiap hari ia menyediakan **38 kg rumput gajah** dan **34 kg rumput gamal** untuk seluruh kambing dan sapi miliknya tanpa sisa.

| Hewan | Rumput Gajah | Rumput Gamal |
|---|---|---|
| Sapi | 10 kg | 10 kg |
| Kambing | 2 kg | 1 kg |

Jika banyaknya **sapi** dan **kambing** yang dipelihara Pak Andi berturut-turut adalah $x$ dan $y$, **tentukan bentuk $\begin{pmatrix} x \\ y \end{pmatrix}$ yang benar.**

A. $\begin{pmatrix} -1 & 1 \\ 10 & -5 \end{pmatrix}\begin{pmatrix} 19 \\ 34 \end{pmatrix} = \begin{pmatrix} 15 \\ 20 \end{pmatrix}$
B. $\begin{pmatrix} 10 & -10 \\ -1 & 2 \end{pmatrix}\begin{pmatrix} 38 \\ 34 \end{pmatrix} = \begin{pmatrix} 4 \\ 3 \end{pmatrix}$
C. $\begin{pmatrix} -\frac{1}{10} & \frac{2}{10} \\ 1 & -1 \end{pmatrix}\begin{pmatrix} 34 \\ 38 \end{pmatrix} = \begin{pmatrix} 4 \\ 3 \end{pmatrix}$
D. $\begin{pmatrix} -1 & 2 \\ 10 & -10 \end{pmatrix}\begin{pmatrix} 38 \\ 34 \end{pmatrix} = \begin{pmatrix} 3 \\ 4 \end{pmatrix}$
E. $\begin{pmatrix} -\frac{1}{5} & \frac{1}{5} \\ 2 & -1 \end{pmatrix}\begin{pmatrix} 19 \\ 34 \end{pmatrix} = \begin{pmatrix} 3 \\ 4 \end{pmatrix}$

> **KUNCI JAWABAN:** **E** — $\begin{pmatrix} -\frac{1}{5} & \frac{1}{5} \\ 2 & -1 \end{pmatrix}\begin{pmatrix} 19 \\ 34 \end{pmatrix} = \begin{pmatrix} 3 \\ 4 \end{pmatrix}$

**Pembahasan.** Modelnya: $10x + 2y = 38$ dan $10x + y = 34$. Persamaan pertama boleh disederhanakan (bagi 2) menjadi $5x + y = 19$, sehingga $A = \begin{pmatrix} 5 & 1 \\ 10 & 1 \end{pmatrix}$ dan $B = \begin{pmatrix} 19 \\ 34 \end{pmatrix}$. $\det(A) = (5)(1) - (1)(10) = -5$, sehingga $A^{-1} = \frac{1}{-5}\begin{pmatrix} 1 & -1 \\ -10 & 5 \end{pmatrix} = \begin{pmatrix} -\frac{1}{5} & \frac{1}{5} \\ 2 & -1 \end{pmatrix}$. Hasilnya $\begin{pmatrix} 3 \\ 4 \end{pmatrix}$: **3 sapi dan 4 kambing** — cocokkan: $10(3) + 2(4) = 38$ dan $10(3) + 1(4) = 34$. Jadi **opsi E**.

---

### Soal 3 · TKA 2025 · No. 3

- **ID:** `tka25_03`
- **Tipe:** Pilihan ganda (satu jawaban benar)
- **Sub-topik:** `ekstraksi_elemen`

Sebuah pabrik minuman tradisional memproduksi tiga jenis minuman: wedang jahe (WJ), beras kencur (BK), dan kunir asem (KA). Dalam proses produksinya digunakan tiga bahan utama, yaitu jahe (J) dalam gram, gula merah (GM) dalam gram, dan air (A) dalam mililiter. Kebutuhan bahan **setiap botol** adalah sebagai berikut (baris berturut-turut: WJ, BK, KA).

$$ \begin{matrix} & \ \ J & GM & \ A \ \end{matrix} \\[-2pt] \begin{pmatrix} 20 & 15 & 50 \\ 10 & 25 & 40 \\ 12 & 8 & k \end{pmatrix} $$

Pada suatu hari pabrik menerima pesanan $\begin{matrix} WJ \\ BK \\ KA \end{matrix}\begin{pmatrix} 100 \\ 120 \\ 80 \end{pmatrix}$ botol, dan jumlah bahan baku yang terpakai adalah $\begin{matrix} J \\ GM \\ A \end{matrix}\begin{pmatrix} 4360 \\ 4960 \\ 13000 \end{pmatrix}$.

**Banyak air yang dibutuhkan untuk memproduksi satu botol kunir asem adalah ....**

A. 30 ml
B. 35 ml
C. 40 ml
D. 45 ml
E. 50 ml

> **KUNCI JAWABAN:** **C** — 40 ml

**Pembahasan.** Pakai **Aturan Sniper**: nilai $k$ hanya ditentukan oleh kolom air, jadi cukup satu persamaan. $50(100) + 40(120) + k(80) = 13000$ $5000 + 4800 + 80k = 13000 \Rightarrow 80k = 3200 \Rightarrow k = 40$. Jadi **opsi C**. **Catatan jujur:** pada naskah aslinya, total $J$ dan $GM$ tidak konsisten dengan matriksnya ($20(100)+10(120)+12(80) = 4160$, bukan 4360; $15(100)+25(120)+8(80) = 5140$, bukan 4960). Justru di sinilah teknik sniper menyelamatkanmu: kamu tidak pernah menyentuh kedua baris itu.

---

### Soal 4 · TKA 2025 · No. 4

- **ID:** `tka25_04`
- **Tipe:** Pilih semua jawaban benar
- **Sub-topik:** `analisis_multi_kondisi`

Seorang pemilik hotel mengelola 3 hotel di kota yang berbeda. Ketiganya memiliki konsep dan tipe kamar yang sama: Standard Room, Deluxe Room, dan Suite Room, dengan kapasitas dan harga per malam sebagai berikut.

| Tipe Kamar | Hotel A | Hotel B | Hotel C | Harga/malam |
|---|---|---|---|---|
| Standard Room | 9 | 6 | 7 | Rp150.000 |
| Deluxe Room | 6 | 7 | 5 | Rp500.000 |
| Suite Room | 3 | 2 | 4 | Rp1.000.000 |

**Bagaimana kondisi pendapatan ketiga hotel tersebut dalam 1 hari jika semua tipe kamar terisi penuh?** Pilih **semua** jawaban yang benar.

A. Pendapatan Hotel A dan Hotel C sama besar.
B. Pendapatan Hotel B lebih besar daripada Hotel A.
C. Pendapatan paling besar diperoleh dari Hotel C.
D. Masing-masing hotel memiliki selisih pendapatan yang sama besar.
E. Pendapatan yang diperoleh dari ketiga hotel tersebut lebih dari Rp20.000.000.

> **KUNCI JAWABAN:** **C, E**

**Pembahasan.** Pendapatan = (baris harga) × (matriks kapasitas): $\begin{pmatrix} 150000 & 500000 & 1000000 \end{pmatrix}\begin{pmatrix} 9 & 6 & 7 \\ 6 & 7 & 5 \\ 3 & 2 & 4 \end{pmatrix} = \begin{pmatrix} 7350000 & 6400000 & 7550000 \end{pmatrix}$ Hotel A = Rp7.350.000 · Hotel B = Rp6.400.000 · Hotel C = Rp7.550.000, total Rp21.300.000. Yang benar: pernyataan **C** dan **E**.

**Penjelasan per opsi:**

- **A.** Salah — Hotel A = Rp7.350.000 dan Hotel C = Rp7.550.000, berbeda Rp200.000.
- **B.** Salah — Hotel B = Rp6.400.000, justru **lebih kecil** daripada Hotel A (Rp7.350.000).
- **C.** Benar — Hotel C = Rp7.550.000, tertinggi di antara ketiganya.
- **D.** Salah — selisih A−B = Rp950.000 sedangkan C−A = Rp200.000, jadi tidak sama besar.
- **E.** Benar — totalnya Rp7.350.000 + Rp6.400.000 + Rp7.550.000 = **Rp21.300.000**, lebih dari Rp20.000.000.

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

### Soal 6

- **ID:** `b3_03`
- **Tipe:** Isian angka (papan angka)
- **Sub-topik:** `sifat_determinan`

Matriks $A$ berordo $3 \times 3$ dengan $\det(A) = 2$. Tentukan $\det(2A)$.

> **KUNCI JAWABAN:** **16**

**Pembahasan.** Gunakan $\det(kA) = k^n \det(A)$ dengan $n=3$: $\det(2A) = 2^3 \times 2 = 8 \times 2 = 16$.

---

### Soal 7

- **ID:** `b3_06`
- **Tipe:** Isian angka (papan angka)
- **Sub-topik:** `singular_nonsingular`

Tentukan nilai $x$ agar $\begin{pmatrix} x & 2 \\ 8 & 4 \end{pmatrix}$ menjadi matriks singular.

> **KUNCI JAWABAN:** **4**

**Pembahasan.** Singular berarti $\det = 0$: $4x - 16 = 0 \implies x = 4$.

---

### Soal 8

- **ID:** `b3_05`
- **Tipe:** Isian matriks
- **Sub-topik:** `invers_2x2`

Tentukan invers dari $A = \begin{pmatrix} 4 & 3 \\ 1 & 1 \end{pmatrix}$.

> **KUNCI JAWABAN:** $\begin{pmatrix} 1 & -3 \\ -1 & 4 \end{pmatrix}$

**Pembahasan.** $\det(A) = 4-3 = 1$. Tukar diagonal utama dan balik tanda diagonal sekunder: $\begin{pmatrix} 1 & -3 \\ -1 & 4 \end{pmatrix}$.

---

### Soal 9

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

### Soal 10

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

## Ringkasan Kunci Jawaban

| No | ID | Tipe | Kunci |
|---|---|---|---|
| 1 | `tka25_01` | Pilihan ganda (satu jawaban benar) | **E** |
| 2 | `tka25_02` | Pilihan ganda (satu jawaban benar) | **E** |
| 3 | `tka25_03` | Pilihan ganda (satu jawaban benar) | **C** |
| 4 | `tka25_04` | Pilih semua jawaban benar | **C, E** |
| 5 | `b2_05` | Pilih semua jawaban benar | **A, C, D** |
| 6 | `b3_03` | Isian angka (papan angka) | **16** |
| 7 | `b3_06` | Isian angka (papan angka) | **4** |
| 8 | `b3_05` | Isian matriks | **[[1, -3], [-1, 4]]** |
| 9 | `b4_04` | Pilihan ganda (satu jawaban benar) | **A** |
| 10 | `b1_03` | Pilih semua jawaban benar | **A, B, D** |
