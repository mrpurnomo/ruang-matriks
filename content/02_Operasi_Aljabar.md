# Bab 2: Operasi Aljabar Matriks

Sekarang kamu sudah kenal "anatomi" matriks dari Bab 1 — saatnya kita membuatnya bekerja. Di bab ini kita akan menjumlah, mengurangkan, mengalikan dengan skalar, dan (bagian paling seru sekaligus paling sering salah) mengalikan dua matriks. Siapkan mata dan tangan, karena hampir semua kegiatan interaktif di bab ini akan meminta kamu benar-benar men-drag angka, bukan cuma membaca teori.

---

## 1. Penjumlahan dan Pengurangan Matriks

### A. Materi

Ini operasi matriks paling ramah — tidak ada aturan rumit, hanya satu syarat mutlak yang harus kamu cek **sebelum** menghitung apa pun.

> **Syarat:** Dua matriks hanya bisa dijumlahkan atau dikurangkan jika keduanya memiliki **ordo yang sama persis**.

Kalau syarat itu terpenuhi, caranya sangat sederhana: **jumlahkan (atau kurangkan) elemen yang seletak**, lalu hasilnya diletakkan di posisi seletak juga pada matriks hasil.

$$ \begin{pmatrix} a & b \\ c & d \end{pmatrix} + \begin{pmatrix} e & f \\ g & h \end{pmatrix} = \begin{pmatrix} a+e & b+f \\ c+g & d+h \end{pmatrix} $$

Kenapa syarat ordo sama itu wajib? Karena penjumlahan matriks pada dasarnya hanyalah "menjumlah berpasangan" — kalau ordo berbeda, ada elemen yang tidak punya pasangan seletak untuk dijumlahkan. Bayangkan mencoba menjumlahkan absen kelas berisi 30 murid dengan absen kelas lain berisi 25 murid, baris demi baris — begitu sampai baris ke-26, kamu kehabisan pasangan.

Pengurangan matriks $A - B$ sebenarnya adalah bentuk lain dari $A + (-B)$, di mana $-B$ berarti setiap elemen $B$ dikalikan $-1$ terlebih dahulu (kaitannya dengan sub-topik berikutnya: perkalian skalar).

### B. Kegiatan Interaktif / Simulasi Terpandu

Simulasi berjalan dalam **dua slide** yang state-nya terpisah bersih.

**Slide 1 — kenapa ordo berbeda ditolak.** Kamu melihat $P_{2\times3} + Q_{2\times2}$ tersusun horizontal dengan tanda $=$ dan sebuah slot hasil. Kamu menekan "Coba Jumlahkan": slot berubah merah dengan ikon silang, kedua matriks bergetar, dan penjelasan muncul — elemen $p_{13}$ tidak punya pasangan seletak di $Q$.

**Slide 2 — hitung yang ordonya sama.** Sekarang $A$, $B$, dan matriks hasil $C$ tersusun **horizontal dengan tanda operasi dan tanda $=$**, dengan titik temu di bawahnya.

1. Kamu men-drag chip elemen $a_{11}$ dan chip elemen $b_{11}$ — **hanya pasangan seletak yang bisa saling menempel**; jika kamu coba drop $a_{11}$ berdekatan dengan $b_{12}$ (posisi tidak seletak), drop-zone menyala merah, chip memantul kembali ke posisi asal, dan sebuah **Toast** muncul menjelaskan sebabnya secara spesifik, misalnya *"Posisi tidak seletak — $a_{11}$ ada di baris 1 kolom 1, sedangkan $b_{12}$ ada di baris 1 kolom 2. Pasangkan elemen yang alamat baris-kolomnya identik."*
2. Begitu pasangan seletak yang benar didekatkan, animasi *merge* berjalan: keduanya melebur menampilkan ekspresi kecil seperti "$3 + 5$" sesaat, lalu menyatu jadi satu chip angka hasil (misal "$8$") disertai flash hijau.
3. Chip hasil otomatis terbang (fase *Land*) ke sel $c_{11}$ di matriks C — pada posisi identik dengan posisi asalnya, menegaskan sekali lagi konsep "seletak" secara spasial.
4. Ulangi untuk seluruh pasangan elemen hingga matriks C terisi penuh. Untuk versi pengurangan, drop-zone bertanda "$-$" ditampilkan di antara kedua chip, dan urutan chip yang di-drag lebih dulu (dari matriks yang mana) **menentukan urutan pengurangan** — jika kamu membalik urutan, sebuah **Toast** muncul menegaskan *"Urutan terbalik! Kamu meletakkan $b_{11}$ lebih dulu, jadi ini akan dihitung sebagai $B - A$, bukan $A - B$ yang diminta soal — hasilnya akan berbeda tanda."*

### C. Mini Kuis

1. Diketahui $A = \begin{pmatrix} 6 & -2 \\ 3 & 5 \end{pmatrix}$ dan $B = \begin{pmatrix} 1 & 4 \\ -3 & 2 \end{pmatrix}$. Tentukan $A - B$.
2. Matriks $P$ berordo $2 \times 3$ dan matriks $Q$ berordo $3 \times 2$. Bisakah $P + Q$ dihitung? Jelaskan alasannya dalam satu kalimat.

---

## 2. Perkalian Skalar

### A. Materi

**Skalar** adalah istilah untuk sebuah bilangan real biasa (bukan matriks) — dinamakan begitu untuk membedakannya dari matriks saat keduanya muncul bersamaan dalam satu ekspresi.

> **Definisi:** Jika $k$ adalah sebuah skalar dan $A$ adalah matriks, maka $kA$ diperoleh dengan mengalikan **setiap elemen** matriks $A$ dengan $k$.

$$ k \begin{pmatrix} a & b \\ c & d \end{pmatrix} = \begin{pmatrix} ka & kb \\ kc & kd \end{pmatrix} $$

Ini adalah satu-satunya jenis "perkalian" di materi matriks yang tidak punya syarat ordo apa pun — skalar bisa mengalikan matriks berordo berapa saja, karena setiap elemen diperlakukan sendiri-sendiri, tidak saling berinteraksi seperti pada perkalian dua matriks (sub-topik 4 nanti).

**Peringatan penting** yang akan sangat berguna di Bab 3: perkalian skalar **bukan** hal yang sama dengan mengalikan seluruh matriks dengan angka biasa dalam artian determinan. Simpan dulu catatan ini di kepala — nanti di Bab 3 kamu akan sadar kenapa $\det(kA) \ne k \cdot \det(A)$ untuk matriks berordo lebih dari $1 \times 1$.

### B. Kegiatan Interaktif / Simulasi Terpandu

Susunannya horizontal: chip skalar $\times$ matriks asal $=$ matriks hasil (masih kosong).

Kamu **menyeret chip skalar ke SATU elemen**, dan hanya elemen itu yang terkalikan — hasilnya terbang ke posisi seletak di matriks hasil. Elemen yang sudah dikali langsung **diredupkan dan dikunci**, lalu kamu mengulang untuk elemen berikutnya.

Chip skalarnya **tidak habis**; ia bisa dipakai berulang kali. Tidak ada bagian yang diotomatiskan — tujuannya membangun ingatan otot bahwa *setiap* elemen memang dikalikan satu per satu.

### C. Mini Kuis

1. Diketahui $M = \begin{pmatrix} -3 & 4 \\ 5 & 0 \\ 2 & -1 \end{pmatrix}$. Tentukan hasil dari $-2M$.
2. Jika $3A = \begin{pmatrix} 9 & -6 \\ 12 & 3 \end{pmatrix}$, tentukan matriks $A$ (petunjuk: kerjakan kebalikan dari perkalian skalar).

---

## 3. Kombinasi Operasi Skalar dan Penjumlahan

### A. Materi

Soal-soal level lanjut sering menggabungkan perkalian skalar dengan penjumlahan/pengurangan dalam satu ekspresi, misalnya menghitung $2A - 3B$. Kabar baiknya: **tidak ada aturan baru** di sini — kamu hanya perlu menerapkan dua sub-topik sebelumnya secara berurutan.

**Urutan pengerjaan yang tepat (mengikuti prinsip aljabar biasa):**
1. Selesaikan dulu semua perkalian skalar ($2A$ dan $3B$ dihitung masing-masing secara terpisah).
2. Baru jumlahkan/kurangkan hasil-hasil tersebut (yang otomatis berordo sama, karena berasal dari matriks asal yang sudah pasti berordo sama untuk bisa dijumlahkan).

$$ 2\begin{pmatrix} 1 & 2 \\ 0 & 3 \end{pmatrix} - 3\begin{pmatrix} 2 & 1 \\ 1 & 0 \end{pmatrix} = \begin{pmatrix} 2 & 4 \\ 0 & 6 \end{pmatrix} - \begin{pmatrix} 6 & 3 \\ 3 & 0 \end{pmatrix} = \begin{pmatrix} -4 & 1 \\ -3 & 6 \end{pmatrix} $$

### B. Kegiatan Interaktif / Simulasi Terpandu

Checklist dua langkah tampil di atas panggung, dan **tidak ada satu pun yang diotomatiskan**.

**Tahap 1 (manual).** Kamu menyeret chip skalar ke setiap elemen $A$, satu per satu — sama seperti sub-topik sebelumnya.

**Tahap 2 (manual juga).** Setelah semua elemen $A$ terkalikan, chip skalar dimatikan dan titik temu muncul. Kamu **tetap harus menyeret sendiri** setiap pasangan elemen seletak dari $A$ dan $B$ ke titik temu. Sistem tidak menjumlahkan apa pun untukmu.

### C. Mini Kuis

1. Diketahui $A = \begin{pmatrix} 4 & 0 \\ -1 & 2 \end{pmatrix}$ dan $B = \begin{pmatrix} 1 & 3 \\ 2 & -2 \end{pmatrix}$. Tentukan hasil dari $2A + B$.
2. Mengapa urutan "kalikan skalar dulu, baru jumlahkan" penting? Apa yang salah jika kita coba menjumlahkan $A + B$ terlebih dahulu sebelum dikalikan skalar masing-masing yang berbeda?

---

## 4. Menentukan Ordo Hasil Perkalian

### A. Materi

Sebelum menghitung isi matriksnya, ada satu hal yang harus dipastikan lebih dulu: **apakah perkaliannya boleh dilakukan**, dan kalau boleh, **berapa ordo hasilnya**.

> **Aturan angka dalam & luar.** Tulis kedua ordo berdampingan: $A_{m \times n} \cdot B_{n \times p}$.
> Dua angka **di dalam** harus KEMBAR agar bisa dikalikan.
> Dua angka **di luar** menjadi ordo hasilnya.

$$ A_{m \times n} \times B_{n \times p} = C_{m \times p} $$

Cara cepatnya: angka dalam kembar → boleh. Angka dalam beda → berhenti, tidak bisa dikalikan. Kalau boleh, salin angka luar kiri dan angka luar kanan sebagai ordo hasil.

> **Ingat urutan.** Karena aturannya bergantung posisi, $A \times B$ bisa boleh sementara $B \times A$ tidak — inilah akar sifat **tidak komutatif**.

### B. Kegiatan Interaktif / Simulasi Terpandu

Sebuah mini-simulasi khusus melatih mata membaca ordo, **tanpa menghitung isi matriksnya sama sekali**.

Dua ordo ditampilkan besar-besar berdampingan, misalnya $2\times3 \cdot 3\times4$. Angka **di dalam** diberi warna **biru dan berdenyut**; angka **di luar** diberi warna **kuning**.

Kamu memilih satu dari empat jawaban: "Tidak bisa dikalikan", atau salah satu kemungkinan ordo hasil. Pilihan yang salah **dimatikan permanen**, disertai penjelasan mengapa. Setelah benar, muncul kartu penjelasan yang menegaskan alasannya, lalu lanjut ke kasus berikutnya lewat slider.

Empat kasus disiapkan, termasuk kasus jebakan $1\times3 \cdot 3\times1$ yang hasilnya hanya **satu angka** ($1\times1$).

### C. Mini Kuis

1. Matriks $A$ berordo $4 \times 2$ dan $B$ berordo $2 \times 5$. Tentukan ordo dari $A \times B$.
2. Matriks $P$ berordo $3 \times 2$ dan $Q$ berordo $3 \times 2$. Bisakah $P \times Q$ dihitung?

---

## 5. Perkalian Matriks dengan Matriks

### A. Materi

Sampai juga di operasi yang paling sering bikin siswa keliru — tapi begitu kamu paham "logika gerakannya", perkalian matriks justru jadi salah satu bagian paling memuaskan untuk dikuasai.

> **Syarat mutlak:** Dua matriks $A$ dan $B$ hanya bisa dikalikan ($A \times B$) jika **banyak kolom matriks pertama** ($A$) sama dengan **banyak baris matriks kedua** ($B$).

$$ A_{m \times n} \times B_{n \times p} = C_{m \times p} $$

Perhatikan pola ordo ini baik-baik: angka $n$ di tengah harus "kembar", dan ordo hasil $C$ mengambil **angka luar** ($m$ dari $A$, $p$ dari $B$). Ini alasan matematis kenapa **perkalian matriks umumnya tidak komutatif** — $A \times B$ bisa jadi valid secara ordo, tapi $B \times A$ bisa jadi ordo-nya tidak cocok sama sekali (kolom $B$ belum tentu sama dengan baris $A$).

**Cara kerja (aturan "baris kali kolom"):** setiap elemen hasil $c_{ij}$ diperoleh dari **baris ke-$i$ matriks $A$** dikalikan sejajar dengan **kolom ke-$j$ matriks $B$**, lalu semua hasil kali tersebut **dijumlahkan**.

Contoh untuk matriks $2\times2$:
$$ \begin{pmatrix} a & b \\ c & d \end{pmatrix} \times \begin{pmatrix} e & f \\ g & h \end{pmatrix} = \begin{pmatrix} ae+bg & af+bh \\ ce+dg & cf+dh \end{pmatrix} $$

Lihat elemen $c_{11}$ (pojok kiri-atas hasil): ia berasal dari **baris ke-1** $A$ (yaitu $a, b$) dikalikan sejajar dengan **kolom ke-1** $B$ (yaitu $e, g$), lalu dijumlahkan: $ae + bg$. Elemen $c_{12}$ masih dari baris yang sama ($a, b$) tapi dikalikan dengan kolom ke-2 $B$ ($f, h$): $af + bh$. Pola inilah yang akan kamu praktikkan langsung di simulasi berikut.

### B. Kegiatan Interaktif / Simulasi Terpandu

Ini simulasi paling penting di seluruh aplikasi. Tata letaknya **horizontal**: $A \times B = C$, dengan $C$ masih kosong. **Tidak ada akumulator terpisah** — perhitungan terjadi langsung di dalam sel tujuan.

1. Kamu **mengklik satu sel kosong** di matriks hasil. Sel itu menyala kuning dan berdenyut, dan **semua sel hasil lain dikunci** sampai sel ini selesai.
2. Baris terkait di $A$ menyala **berwarna biru**, kolom terkait di $B$ menyala **berwarna oranye**; keduanya berdenyut terus-menerus.
3. Kamu menyeret pasangan elemen sejajar **langsung ke sel kuning itu**. Keduanya melebur di sana, dan hasil kalinya langsung tertulis di sel.
4. Papan kerja tepat di bawah matriks hasil menampilkan ekspresi berjalan, misalnya $c_{12} = (2\cdot-1) + (1\cdot5) = 3$.
5. Selama animasi berlangsung, **seluruh klik dikunci** sehingga tidak ada aksi yang menumpuk.
6. Setelah semua pasangan diproses, sel ditandai selesai dan sel-sel lain terbuka kembali.

**Bantuan (scaffold) di percobaan pertama:** pasangan elemen yang harus di-drag lebih dulu ditandai angka kecil ①②③ di atas tiap chip supaya kamu tidak bingung urutan. Setelah kamu mengulang sub-topik ini (percobaan kedua dst.), penanda ini otomatis disembunyikan sebagai tantangan penuh.

### C. Mini Kuis

1. Diketahui $A = \begin{pmatrix} 2 & 1 \\ 0 & 3 \end{pmatrix}$ berordo $2\times2$ dan $B = \begin{pmatrix} 4 \\ -1 \end{pmatrix}$ berordo $2\times1$. Apakah $A \times B$ bisa dihitung? Jika bisa, berapa ordo hasilnya, dan hitung hasilnya.
2. Diketahui $P$ berordo $3 \times 4$ dan $Q$ berordo $4 \times 2$. Tentukan ordo dari $P \times Q$, lalu jelaskan mengapa $Q \times P$ **tidak bisa dihitung** dengan ordo tersebut.

---

## 6. Sifat-Sifat Operasi Matriks

### A. Materi

Setelah menguasai mekanisme hitungnya, TKA dan ujian sekolah sering menguji pemahaman **konseptual** lewat sifat-sifat berikut — kamu diharapkan bisa menjawab tanpa perlu menghitung penuh dari nol.

1. **Tidak Komutatif (secara umum):**
   $$ A \times B \ne B \times A $$
   Ini sifat yang paling sering "menjebak" siswa yang terbiasa dengan aljabar bilangan biasa (di mana $3 \times 5 = 5 \times 3$). Pada matriks, urutan perkalian **sangat menentukan** — bahkan salah satu sisi bisa jadi tidak terdefinisi sama sekali secara ordo (lihat Mini Kuis sub-topik 4 di atas).

2. **Asosiatif:**
   $$ (A \times B) \times C = A \times (B \times C) $$
   Pengelompokan tanda kurung boleh digeser tanpa mengubah hasil — tapi **urutan matriks dari kiri ke kanan tidak boleh ditukar**.

3. **Identitas Perkalian:**
   $$ A \times I = I \times A = A $$
   Matriks identitas $I$ (dari Bab 1) berperan sama seperti angka $1$ pada perkalian bilangan biasa — mengalikan apa pun dengannya tidak mengubah apa-apa. Ini salah satu sifat langka di mana urutan perkalian **boleh** ditukar.

4. **Sifat Transpose pada Perkalian:**
   $$ (A \times B)^T = B^T \times A^T $$
   Perhatikan baik-baik: **urutannya terbalik** setelah ditranspose! Ini sifat yang sangat sering muncul di soal HOTS berbentuk "manipulasi ekspresi" tanpa perlu tahu nilai elemen aslinya sama sekali.

### B. Kegiatan Interaktif / Simulasi Terpandu

Kamu akan bermain **"Benar atau Jebakan?"** — sebuah papan berisi kartu ekspresi (mis. $A \times B$ berdampingan dengan $B \times A$, atau $(AB)^T$ berdampingan dengan $A^TB^T$ dan $B^TA^T$). Untuk tiap pasangan, kamu men-drag simbol "$=$" atau "$\ne$" ke antara dua ekspresi tersebut.

Jika simbol yang kamu jatuhkan keliru, ia tidak langsung memberi tahu simbol yang benar (agar kamu tidak sekadar menebak simbol satunya) — sebagai gantinya muncul **Toast** berisi pertanyaan pemandu yang mengarah ke sifat terkait, misalnya *"Coba cek lagi: apakah urutan matriks di kedua sisi ekspresi ini sama? Perkalian matriks punya aturan urutan yang ketat."* Setelah itu, sistem menjalankan **simulasi angka nyata secara otomatis** (mengisi $A$ dan $B$ dengan angka contoh, lalu menjalankan animasi perkalian singkat di kedua sisi secara berdampingan/split-screen) sebagai pembuktian visual — supaya sifat non-komutatif ini bukan cuma dihafal, tapi benar-benar **terlihat** bahwa hasilnya berbeda, dan kamu bisa mencoba ulang simbolnya dengan pemahaman baru.

### C. Mini Kuis

1. Diketahui $A \times B = \begin{pmatrix} 5 & 2 \\ -1 & 3 \end{pmatrix}$. Tentukan $(A \times B)^T$ tanpa perlu mengetahui matriks $A$ dan $B$ aslinya.
2. Manakah pernyataan berikut yang **benar**? (Bisa lebih dari satu jawaban benar)
   - [ ] $A + B = B + A$ untuk semua matriks $A, B$ berordo sama.
   - [ ] $A \times B = B \times A$ untuk semua matriks persegi $A, B$.
   - [ ] $A \times I = A$ untuk matriks persegi $A$ dan matriks identitas $I$ berordo sama.
   - [ ] $(A \times B)^T = A^T \times B^T$.

---

Kamu baru saja menguasai seluruh dasar aritmatika matriks — dari penjumlahan sederhana sampai perkalian matriks yang penuh gerakan. Bab ini adalah "otot" yang akan terus kamu pakai. Selanjutnya, di **Bab 3: Determinan dan Invers**, kita akan menggunakan operasi-operasi ini untuk menemukan satu nilai istimewa yang menyimpan banyak rahasia tentang sebuah matriks persegi.
