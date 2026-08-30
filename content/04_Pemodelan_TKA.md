# Bab 4: Pemodelan Matematika dan Aplikasi TKA

Ini dia bab yang menjawab pertanyaan yang mungkin sering muncul di kepalamu: **"Buat apa sih belajar matriks?"** Di bab ini, semua yang sudah kamu kuasai — operasi aljabar (Bab 2), determinan, dan invers (Bab 3) — akan dipakai untuk membedah soal cerita sungguhan, gaya soal yang sering muncul di TKA. Kabar baiknya, begitu kamu terbiasa "menerjemahkan" cerita menjadi matriks, sisanya tinggal mengulang teknik yang sudah kamu kuasai dari bab-bab sebelumnya.

---

## 1. Translasi Data ke Matriks (Literasi Numerasi)

### A. Materi

Kelemahan terbesar siswa di soal cerita matriks **bukan** pada hitungannya — melainkan pada langkah paling awal: **mengubah tabel/narasi menjadi bentuk matriks yang benar**. Begitu bentuk matriksnya tepat, sisanya hanya operasi yang sudah kamu kuasai.

**Tips pemodelan yang wajib kamu pegang:**
1. **Identifikasi dua "sumbu" data.** Biasanya ada sumbu "jenis barang/produk" dan sumbu "jenis kebutuhan/sumber daya". Salah satu jadi baris, satunya jadi kolom — konsisten sepanjang soal.
2. **Jaga kesesuaian urutan.** Jika kolom pertama matriks kebutuhan berarti "bahan A", maka baris/kolom yang bersesuaian di matriks lain **harus** tetap merujuk "bahan A" di posisi yang sama. Tertukar urutan adalah kesalahan paling umum.
3. **Kenali pola "matriks koefisien × matriks kuantitas = matriks total".** Ini pola paling sering muncul: jika diketahui kebutuhan per unit dan kuantitas yang diproduksi/dibeli, kalikan keduanya (dengan urutan matriks yang sesuai syarat ordo dari Bab 2) untuk mendapatkan total kebutuhan.

**Contoh kasus (masalah kapasitas):** Bu Rina memproduksi dua jenis kue: **Brownies** dan **Cookies**. Setiap loyang Brownies memerlukan $200$ gram tepung dan $150$ gram mentega. Setiap loyang Cookies memerlukan $120$ gram tepung dan $100$ gram mentega. Data ini paling wajar diterjemahkan sebagai matriks kebutuhan berordo $2\times2$ (baris = jenis kue, kolom = jenis bahan):

$$ K = \begin{array}{c} \\ \text{Brownies} \\ \text{Cookies} \end{array}\begin{pmatrix} \text{Tepung} & \text{Mentega} \\ 200 & 150 \\ 120 & 100 \end{pmatrix} $$

Jika suatu hari Bu Rina membuat $5$ loyang Brownies dan $8$ loyang Cookies, kuantitas ini menjadi matriks kolom $Q = \begin{pmatrix} 5 \\ 8 \end{pmatrix}$. Tapi hati-hati — perkalian $K \times Q$ baru valid secara ordo ($2\times2$ kali $2\times1$) **jika baris $K$ mewakili jenis kue** seperti disusun di atas. Total kebutuhan bahan pun didapat lewat perkalian matriks yang sudah kamu kuasai dari Bab 2.

### B. Kegiatan Interaktif / Simulasi Terpandu

Kamu akan melihat sebuah **narasi soal cerita** ditampilkan sebagai kartu teks pendek (mirip contoh Bu Rina di atas, dengan angka acak setiap kali dimuat ulang), disertai sebuah **kanvas matriks kosong** dengan label sumbu yang belum terisi (`???` di posisi header baris dan kolom).

1. Kamu terlebih dahulu men-drag **label kategori** (mis. "Brownies", "Cookies", "Tepung", "Mentega") dari kumpulan kartu label ke posisi header baris/kolom yang menurutmu tepat.
2. Setelah header terisi, sistem baru menampilkan slot-slot angka kosong di dalam grid — kamu men-drag angka yang disebutkan di narasi (disajikan sebagai chip lepas, urutan diacak) ke sel yang sesuai dengan perpotongan baris-kolomnya.
3. Jika kombinasi header dan posisi angka benar, seluruh matriks memendar hijau dan sebuah animasi kecil "buku ditutup lalu dibuka sebagai matriks" muncul — menegaskan transformasi dari narasi teks menjadi objek matematis.
4. Jika salah (baik salah label sumbu maupun salah posisi angka), sel yang keliru bergetar halus, dan sebuah **Toast** muncul berisi **petunjuk arah** (bukan jawaban langsung, agar kamu tetap membaca ulang narasi alih-alih menebak-nebak) — misalnya *"Coba cek lagi bagian bahannya: label yang kamu taruh di kolom ini menyebut jenis kue, padahal header kolom seharusnya jenis bahan"* untuk kesalahan label, atau *"Angka ini benar ada di narasi, tapi sepertinya tertukar tempat dengan sel lain yang seletak — cek lagi baris mana yang dimaksud"* untuk kesalahan posisi angka.

### C. Mini Kuis

1. Sebuah warung jus memproduksi Jus Alpukat dan Jus Mangga. Satu gelas Jus Alpukat memerlukan $2$ buah alpukat dan $50$ gram gula. Satu gelas Jus Mangga memerlukan $1$ buah mangga dan $30$ gram gula. Susunlah data ini sebagai matriks berordo $2\times2$ dengan baris mewakili jenis jus.
2. Mengapa urutan kolom pada matriks kebutuhan bahan **harus konsisten** dengan urutan baris pada matriks kuantitas saat keduanya nanti akan dikalikan? Jelaskan kaitannya dengan syarat perkalian matriks di Bab 2.

---

## 2. Menyelesaikan SPLDV dengan Matriks

### A. Materi

**SPLDV** (Sistem Persamaan Linear Dua Variabel) adalah salah satu aplikasi paling langsung dari invers matriks $2\times2$ yang baru kamu kuasai di Bab 3. Alih-alih menyelesaikan dengan eliminasi/substitusi seperti di kelas sebelumnya, sekarang kamu punya alat yang jauh lebih sistematis.

Diberikan sistem:
$$ ax + by = e $$
$$ cx + dy = f $$

Bentuk ini bisa ditulis ulang sebagai **satu persamaan matriks**:
$$ \begin{pmatrix} a & b \\ c & d \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} e \\ f \end{pmatrix} $$

Perhatikan bentuk ini **sama persis** dengan bentuk $AX = B$ yang sudah kamu selesaikan di Bab 3 sub-topik 7! Solusinya pun memakai rumus yang sama:
$$ \begin{pmatrix} x \\ y \end{pmatrix} = A^{-1}B $$

**Contoh:** Sebuah toko alat tulis menjual pensil seharga $x$ rupiah dan penghapus seharga $y$ rupiah. Andi membeli $3$ pensil dan $2$ penghapus seharga total Rp$13.000$. Budi membeli $2$ pensil dan $1$ penghapus seharga total Rp$8.000$. Sistemnya:
$$ 3x + 2y = 13000 $$
$$ 2x + y = 8000 $$

Diubah menjadi $\begin{pmatrix} 3 & 2 \\ 2 & 1 \end{pmatrix}\begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} 13000 \\ 8000 \end{pmatrix}$, lalu diselesaikan dengan invers — persis teknik Bab 3.

### B. Kegiatan Interaktif / Simulasi Terpandu

Soal cerita ditampilkan (seperti contoh Andi-Budi di atas). Alurnya menggabungkan dua keahlian yang sudah kamu punya:

1. **Tahap Translasi:** identik dengan simulasi sub-topik 1 — kamu men-drag koefisien dan konstanta dari narasi ke posisi yang tepat pada kerangka $\begin{pmatrix} \Box & \Box \\ \Box & \Box \end{pmatrix}\begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} \Box \\ \Box \end{pmatrix}$ yang sudah disediakan sebagai kanvas kosong.
2. **Tahap Penyelesaian:** begitu translasi benar, sistem otomatis membuka simulasi Persamaan Matriks dari Bab 3 sub-topik 7 (drag chip $A^{-1}$ ke kedua ruas, dst.) menggunakan matriks yang **baru saja kamu susun sendiri** — bukan matriks contoh generik, sehingga terasa seperti "soalmu sendiri yang sedang diselesaikan".
3. Hasil akhir $\begin{pmatrix} x \\ y \end{pmatrix}$ ditampilkan kembali berdampingan dengan narasi asal, dengan kalimat penutup otomatis mis. *"Jadi, harga satu pensil adalah Rp... dan harga satu penghapus adalah Rp..."* — menutup lingkaran dari abstraksi matematis kembali ke konteks nyata.

### C. Mini Kuis

1. Sebuah kantin menjual bakso seharga $x$ rupiah dan es teh seharga $y$ rupiah. Seorang pembeli membayar Rp$15.000$ untuk $1$ bakso dan $2$ es teh. Pembeli lain membayar Rp$23.000$ untuk $2$ bakso dan $1$ es teh. Susun SPLDV ini dalam bentuk matriks $AX = B$, lalu tentukan harga satu bakso.
2. Setelah mendapatkan matriks $A$ dari sebuah SPLDV, ternyata $\det(A) = 0$. Apa arti hal ini terhadap sistem persamaan linear tersebut (kaitkan dengan konsep matriks singular di Bab 3)?

---

## 3. Menyelesaikan SPLTV dengan Matriks

### A. Materi

Logika yang sama persis berlaku untuk **SPLTV** (Sistem Persamaan Linear Tiga Variabel) — bedanya, sekarang kamu memakai invers matriks $3\times3$ (Metode Adjoin dari Bab 3 sub-topik 6), yang jauh lebih efisien dibanding eliminasi bertingkat yang panjang.

Diberikan sistem tiga persamaan tiga variabel:
$$ a_1x + b_1y + c_1z = d_1 $$
$$ a_2x + b_2y + c_2z = d_2 $$
$$ a_3x + b_3y + c_3z = d_3 $$

Diubah menjadi:
$$ \begin{pmatrix} a_1 & b_1 & c_1 \\ a_2 & b_2 & c_2 \\ a_3 & b_3 & c_3 \end{pmatrix}\begin{pmatrix} x \\ y \\ z \end{pmatrix} = \begin{pmatrix} d_1 \\ d_2 \\ d_3 \end{pmatrix} $$

dan diselesaikan dengan $\begin{pmatrix} x \\ y \\ z \end{pmatrix} = A^{-1}D$, di mana $A^{-1}$ dicari lewat Metode Adjoin.

**Mengapa metode ini "layak" meski invers $3\times3$ terasa panjang?** Karena begitu kamu punya $A^{-1}$, kamu bisa memakainya lagi untuk sistem lain yang koefisiennya sama tapi konstantanya beda — sesuatu yang tidak bisa dilakukan seefisien itu dengan eliminasi manual berulang.

### B. Kegiatan Interaktif / Simulasi Terpandu

Karena kompleksitas invers $3\times3$, mode ini memakai **jalur santai (guided path)** dengan opsi kecepatan:

1. **Tahap Translasi** — sama seperti SPLDV, kamu men-drag koefisien dari narasi tiga persamaan ke kerangka matriks $3\times3$ dan matriks konstanta $3\times1$.
2. **Pilihan alur:** setelah translasi benar, kamu memilih salah satu — **"Kerjakan Penuh"** (menjalankan seluruh simulasi Metode Adjoin dari Bab 3 sub-topik 6, kartu demi kartu) atau **"Percepat"** (animasi ringkas: matriks kofaktor dan adjoin muncul otomatis dengan highlight singkat per tahap, cocok untuk siswa yang sudah lulus Bab 3 dan ingin fokus ke konteks pemodelan, bukan mekanisme hitung yang berulang).
3. Hasil $x, y, z$ ditampilkan kembali ke konteks narasi asal, sama seperti SPLDV.

### C. Mini Kuis

1. Tiga orang berbelanja di toko buah yang sama. Nadia membeli $2$ kg apel, $1$ kg jeruk, $1$ kg anggur seharga Rp$140.000$. Dinda membeli $1$ kg apel, $2$ kg jeruk, $1$ kg anggur seharga Rp$110.000$. Fajar membeli $1$ kg apel, $1$ kg jeruk, $2$ kg anggur seharga Rp$130.000$. Susun SPLTV ini dalam bentuk matriks $AX=B$ (tidak perlu diselesaikan penuh, cukup bentuk matriksnya).
2. Jika soal nomor 1 di atas hanya meminta nilai $z$ (harga anggur per kg) saja, apakah kamu tetap wajib mencari $A^{-1}$ penuh terlebih dahulu? Diskusikan strategi apa yang menurutmu paling efisien.

---

## 4. Analisis Multi-Kondisi ala TKA (Perkalian Matriks pada Data Bisnis)

### A. Materi

Salah satu pola soal TKA yang cukup unik: soal dengan instruksi **"Pilih semua jawaban yang benar!"** — kamu harus mengevaluasi beberapa pernyataan sekaligus terhadap satu situasi matriks, dan **lebih dari satu** pernyataan bisa benar. Ini menguji bukan hanya kemampuan hitung, tapi juga ketelitian membaca hasil perkalian matriks dan membandingkannya.

**Contoh kasus:** Sebuah usaha percetakan mengelola $3$ cabang (Cabang X, Y, Z) yang menjual $3$ jenis produk cetak dengan kapasitas produksi harian dan harga berikut:

| Produk | Cabang X | Cabang Y | Cabang Z | Harga/unit |
|---|---|---|---|---|
| Kartu Nama (box) | 8 | 5 | 6 | Rp50.000 |
| Banner | 4 | 6 | 3 | Rp120.000 |
| Undangan (box) | 3 | 2 | 5 | Rp200.000 |

Pendapatan tiap cabang dalam satu hari (jika seluruh kapasitas terjual) dihitung lewat perkalian matriks: matriks **Harga** (sebagai matriks baris $1\times3$) dikalikan matriks **Kapasitas** (matriks $3\times3$, kolom = cabang), menghasilkan matriks pendapatan $1\times3$ (satu nilai pendapatan per cabang).

Untuk soal semacam ini, setelah hasil perkalian matriks didapat, kamu diminta mengevaluasi beberapa pernyataan pembanding, misalnya:
- "Pendapatan Cabang X lebih besar daripada Cabang Z."
- "Selisih pendapatan Cabang Y dan Cabang Z lebih dari Rp500.000."
- "Total pendapatan ketiga cabang lebih dari Rp3.000.000."

Setiap pernyataan **dicek independen** satu sama lain terhadap hasil perkalian matriks yang sama — inilah mengapa lebih dari satu jawaban bisa benar sekaligus.

### B. Kegiatan Interaktif / Simulasi Terpandu

1. Soal kasus bisnis ditampilkan (mengikuti pola tabel kapasitas × harga seperti contoh di atas, dengan angka yang berubah setiap sesi). Kamu terlebih dahulu menyusun matriks Kapasitas dan matriks Harga lewat simulasi translasi (sub-topik 1).
2. Kamu menjalankan simulasi perkalian matriks penuh (Bab 2 sub-topik 4) untuk mendapatkan matriks pendapatan per cabang.
3. Setelah hasil didapat dan "terkunci" di layar (tetap terlihat, tidak hilang), muncul **5 kartu pernyataan** di bawahnya, masing-masing dengan sebuah kotak centang (checkbox) — bukan tombol radio, menegaskan visual bahwa ini soal multi-jawaban.
4. Kamu mencentang kartu pernyataan mana saja yang menurutmu benar berdasarkan matriks pendapatan yang sudah kamu hitung sendiri, lalu menekan "Periksa Jawaban". Sistem menandai tiap kartu individual dengan ✓ hijau atau ✗ merah (bukan hanya skor total), **disertai satu baris caption penjelas di bawah tiap kartu yang keliru** — misalnya *"Salah — selisih pendapatan Cabang Z dan Y sebenarnya Rp180.000, bukan lebih dari Rp500.000 seperti pernyataan ini"* — sehingga kamu tahu persis pernyataan mana yang keliru kamu nilai **dan mengapa**, bukan cuma diberi tahu ada yang salah.

### C. Mini Kuis

1. Diketahui hasil perkalian matriks menghasilkan pendapatan Cabang X = Rp1.480.000, Cabang Y = Rp1.360.000, dan Cabang Z = Rp1.540.000. Pilih semua pernyataan yang **benar**:
   - [ ] Pendapatan Cabang Z adalah yang tertinggi di antara ketiganya.
   - [ ] Pendapatan Cabang X lebih besar daripada Cabang Y.
   - [ ] Total pendapatan ketiga cabang kurang dari Rp4.000.000.
   - [ ] Selisih pendapatan Cabang Z dan Cabang Y adalah Rp180.000.
2. Mengapa pada soal bergaya "pilih semua jawaban benar", strategi menghitung **hasil perkalian matriks terlebih dahulu secara utuh** (baru mengecek tiap pernyataan satu-satu) lebih efisien dibanding mencoba mengecek tiap pernyataan sambil menghitung ulang dari awal setiap kali?

---

Selamat, kamu telah menyelesaikan seluruh perjalanan materi Matriks — dari mengenal elemen paling dasar hingga memodelkan masalah bisnis dunia nyata gaya TKA! Sekarang saatnya menguji seluruh pemahamanmu secara menyeluruh lewat mode **Kuis: Simulasi TKA**, yang mencampur semua tipe soal dari Bab 1 sampai Bab 4 secara acak — persis seperti yang akan kamu hadapi di ujian sesungguhnya.
