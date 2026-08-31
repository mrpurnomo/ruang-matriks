# Bab 3: Determinan dan Invers Matriks

Kalau di Bab 2 kamu belajar "menggabungkan" matriks lewat operasi aljabar, di bab ini kita akan belajar "membongkar" satu matriks untuk menemukan nilai-nilai istimewa yang tersembunyi di dalamnya: **determinan** dan **invers**. Sesuai kisi-kisi TKA, kita akan fokus penuh pada matriks berordo $2\times2$ dan $3\times3$ — dua ukuran yang paling sering muncul di ujian dan paling penting kamu kuasai luar kepala.

---

## 1. Determinan Matriks 2×2

### A. Materi

**Determinan** adalah sebuah nilai skalar tunggal yang "mewakili" karakteristik sebuah matriks persegi — semacam sidik jari numerik yang menyimpan informasi penting tentang matriks tersebut (nanti akan kamu lihat gunanya di sub-topik Invers dan Bab 4). Determinan hanya bisa dihitung dari **matriks persegi**, dilambangkan $\det(A)$ atau $|A|$ (dua garis tegak mengapit nama matriks, mirip notasi nilai mutlak).

> **Rumus determinan $2\times2$:** Jika $A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$, maka
> $$ \det(A) = ad - bc $$

Cara mengingat: kalikan **diagonal utama** (dari kiri-atas ke kanan-bawah: $a \times d$), lalu kurangi dengan hasil kali **diagonal sekunder** (dari kiri-bawah ke kanan-atas: $b \times c$). "Diagonal utama dulu (positif), diagonal silang kemudian (negatif)."

**Contoh:** $A = \begin{pmatrix} 4 & 3 \\ 2 & 5 \end{pmatrix}$, maka $\det(A) = (4)(5) - (3)(2) = 20 - 6 = 14$.

### B. Kegiatan Interaktif / Simulasi Terpandu

Matriks $2\times2$ ditampilkan dengan kedua diagonalnya diberi warna berbeda: diagonal utama **biru**, diagonal sekunder **oranye**.

Alih-alih menyeret chip satu per satu, kamu **menggambar garis**.

1. Diagonal utama menyala **berwarna biru**. Kamu **menekan, menahan, lalu menyapu** melewati kedua elemennya — persis seperti menarik garis di buku. Garisnya mengikuti jarimu secara langsung.
2. Begitu garis selesai, kedua angka terbang dan melebur menjadi satu hasil kali, lalu mendarat di kotak **biru** pada ekspresi $(ad) - (bc) = ?$ di bawah matriks.
3. Giliran diagonal sekunder yang menyala **berwarna oranye**, dengan cara yang sama; hasilnya mendarat di kotak **oranye**.
4. Ekspresi terisi penuh dan nilai determinannya muncul di kartu hasil.

Warna kotak pada ekspresi sengaja dicocokkan dengan warna diagonalnya, sehingga jelas suku mana yang bertanda $+$ dan mana yang bertanda $-$.

### C. Mini Kuis

1. Diketahui $F = \begin{pmatrix} 6 & 2 \\ 4 & 5 \end{pmatrix}$. Tentukan $\det(F)$.
2. Diketahui $G = \begin{pmatrix} 3 & k \\ 2 & 4 \end{pmatrix}$. Jika $\det(G) = 6$, tentukan nilai $k$.

---

## 2. Determinan Matriks 3×3 (Metode Sarrus)

### A. Materi

Untuk matriks $3\times3$, kita memakai **Metode Sarrus** — trik visual yang mengubah perhitungan rumit menjadi pola diagonal yang mudah diingat.

> Jika $A = \begin{pmatrix} a & b & c \\ d & e & f \\ g & h & i \end{pmatrix}$, langkah-langkah Metode Sarrus:
> 1. Tuliskan ulang **kolom pertama dan kedua** di sebelah kanan matriks, membentuk tampilan $3 \times 5$.
> 2. Jumlahkan hasil kali **tiga diagonal turun** (dari kiri-atas ke kanan-bawah).
> 3. Kurangkan dengan hasil kali **tiga diagonal naik** (dari kiri-bawah ke kanan-atas).
>
> $$ \det(A) = (aei + bfg + cdh) - (gec + hfa + idb) $$

**Peringatan penting:** Metode Sarrus **hanya berlaku untuk matriks $3\times3$** — jangan pernah mencoba menerapkannya pada matriks $4\times4$ atau lebih besar (untungnya, sesuai kisi-kisi TKA, kamu tidak akan diminta menghitung determinan di atas ordo $3\times3$).

**Contoh:** $A = \begin{pmatrix} 1 & 2 & 3 \\ 0 & 1 & 4 \\ 5 & 6 & 0 \end{pmatrix}$

Diagonal turun: $(1)(1)(0) + (2)(4)(5) + (3)(0)(6) = 0 + 40 + 0 = 40$
Diagonal naik: $(5)(1)(3) + (6)(4)(1) + (0)(0)(2) = 15 + 24 + 0 = 39$
$\det(A) = 40 - 39 = 1$

### B. Kegiatan Interaktif / Simulasi Terpandu

Kamu menekan **"Salin Dua Kolom"**; kolom 1 dan 2 meluncur ke kanan membentuk tampilan $3\times5$. Sebuah **garis pemisah kuning yang tegas** langsung tergambar antara matriks asli dan salinannya, supaya batas keduanya tidak kabur.

1. Satu diagonal turun menyala **berwarna biru**. Kamu **menekan, menahan, dan menarik garis** melewati ketiga elemennya.
2. Ketiga angka melebur menjadi satu hasil kali, lalu mendarat di kelompok **biru** pada ekspresi besar di bawah matriks, yang berbentuk $(\dots + \dots + \dots) - (\dots + \dots + \dots) = ?$
3. Prosesnya diulang untuk tiga diagonal turun (biru), lalu tiga diagonal naik (**oranye**).
4. Kalau garismu belum melewati tiga elemen penuh, sistem memberi tahu berapa elemen yang baru tersentuh.

Setiap kali selesai, seluruh garis dan penanda sementara **dihapus tuntas** — tidak ada elemen hantu yang tertinggal di layar.

### C. Mini Kuis

1. Diketahui $H = \begin{pmatrix} 2 & 0 & 1 \\ 1 & 3 & 2 \\ 0 & 1 & 1 \end{pmatrix}$. Gunakan Metode Sarrus untuk menentukan $\det(H)$.
2. Jelaskan mengapa Metode Sarrus **tidak bisa** langsung diterapkan pada matriks berordo $4\times4$ (petunjuk: perhatikan berapa banyak diagonal turun/naik penuh yang bisa terbentuk pada matriks $4\times4$).

---

## 3. Matriks Singular dan Non-Singular

### A. Materi

Nilai determinan yang baru saja kamu hitung ternyata menentukan "nasib" sebuah matriks — apakah ia punya invers atau tidak (invers akan kita bahas penuh di sub-topik 5).

> - **Matriks Singular:** matriks persegi dengan $\det(A) = 0$. Matriks ini **tidak memiliki invers**.
> - **Matriks Non-Singular:** matriks persegi dengan $\det(A) \ne 0$. Matriks ini **memiliki invers**.

Kenapa determinan nol membuat invers "hilang"? Ingat kembali rumus invers $2\times2$ di sub-topik 5 nanti — determinan akan berada di posisi **penyebut pecahan**. Dalam matematika, pembagian dengan nol tidak terdefinisi — jadi begitu $\det(A) = 0$, rumus invers otomatis "rusak" secara struktural, bukan sekadar kebetulan aturan.

Mengecek singular/non-singular sebelum mencoba mencari invers adalah kebiasaan penting — banyak soal ujian sengaja menyisipkan matriks singular sebagai jebakan agar siswa sadar harus berhenti sebelum menghitung invers yang sebenarnya mustahil.

### B. Kegiatan Interaktif / Simulasi Terpandu

Sebuah "mesin diagnosa" ditampilkan: kamu memasukkan matriks (bisa mengetik langsung atau memakai matriks hasil dari sub-topik sebelumnya), lalu menekan tombol **"Cek Status"**. Sistem menjalankan mini-animasi determinan (versi cepat dari simulasi sub-topik 1/2), lalu menampilkan hasil sebagai indikator gaya lampu lalu lintas:

- **Hijau (Non-Singular):** ikon gembok terbuka muncul, teks "Matriks ini punya invers!"
- **Merah (Singular):** ikon gembok terkunci dengan animasi sedikit bergetar, teks "Determinan = 0, matriks ini TIDAK punya invers."

Kamu akan diberi 4–5 matriks contoh untuk didiagnosa berturut-turut, melatih kecepatan mengenali status matriks tanpa harus menghitung penuh (untuk beberapa contoh mudah, mis. matriks dengan satu baris nol seluruhnya, kamu didorong menebak duluan sebelum menjalankan animasi).

### C. Mini Kuis

1. Tanpa menghitung determinan penuh, tentukan apakah $\begin{pmatrix} 2 & 4 \\ 1 & 2 \end{pmatrix}$ singular atau non-singular (petunjuk: perhatikan hubungan antar baris).
2. Diketahui $\begin{pmatrix} 3 & k \\ 6 & 8 \end{pmatrix}$ adalah matriks singular. Tentukan nilai $k$.

---

## 4. Sifat-Sifat Determinan (Level HOTS TKA)

### A. Materi

Ini bagian yang paling sering diuji dalam bentuk soal HOTS di TKA — bukan meminta kamu menghitung determinan dari awal, melainkan **memanipulasi sifat-sifatnya** langsung. Hafalkan lima sifat ini baik-baik:

1. $\det(A^T) = \det(A)$ — transpose tidak mengubah nilai determinan.
2. $\det(A \times B) = \det(A) \times \det(B)$ — determinan dari hasil kali matriks sama dengan hasil kali determinan masing-masing.
3. $\det(A^n) = (\det(A))^n$ — konsekuensi langsung dari sifat nomor 2, diterapkan berulang.
4. $\det(A^{-1}) = \dfrac{1}{\det(A)}$ — determinan invers adalah kebalikan dari determinan asli.
5. $\det(k \cdot A_{n \times n}) = k^n \cdot \det(A)$ — **ini yang paling sering jadi jebakan!** Perhatikan pangkat $n$ mengikuti **ordo** matriks, bukan otomatis pangkat 1.
   > *Contoh jebakan:* jika matriks $A$ berordo $3\times3$ dikalikan skalar $2$, maka determinannya dikalikan $2^3 = 8$, **bukan** dikalikan $2$ saja!

### B. Kegiatan Interaktif / Simulasi Terpandu

Kamu masuk ke **"Kalkulator Sifat"** — sebuah antarmuka mirip kalkulator aljabar simbolik. Alih-alih memasukkan angka mentah, kamu diberi soal dalam bentuk simbolik, misalnya *"Diketahui $\det(A) = 5$ dan $A$ berordo $3\times3$. Tentukan $\det(2A)$"*.

Di layar tersedia "kartu sifat" (lima sifat di atas, masing-masing sebagai kartu draggable berisi rumus). Kamu men-drag kartu sifat yang relevan (di contoh ini, kartu nomor 5) ke area kerja, lalu sistem otomatis men-substitusi nilai yang diketahui ke dalam rumus tersebut secara animatif (angka "5" dan "3" terbang masuk ke slot $\det(A)$ dan $n$ pada rumus), menghasilkan jawaban akhir. Ini melatih kamu **mengenali sifat mana yang harus dipakai** — keahlian inti soal HOTS — bukan sekadar menghitung ulang dari definisi.

### C. Mini Kuis

1. Diketahui $\det(A) = 4$ dan $\det(B) = 3$, dengan $A$ dan $B$ berordo $2\times2$. Tentukan $\det(A \times B)$.
2. Diketahui matriks $A$ berordo $2\times2$ dengan $\det(A) = 6$. Tentukan $\det(3A)$ (ingat sifat nomor 5, perhatikan ordonya!).

---

## 5. Invers Matriks 2×2

### A. Materi

Di Bab 2 kamu belajar bahwa pada matriks, **tidak ada operasi pembagian**. Sebagai gantinya, kita menggunakan **invers**. Analoginya di bilangan real: $5 \times 5^{-1} = 1$. Pada matriks: $A \times A^{-1} = A^{-1} \times A = I$ (matriks identitas).

> **Rumus invers $2\times2$:** Jika $A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$ dan $\det(A) \ne 0$, maka
> $$ A^{-1} = \frac{1}{ad-bc}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix} $$

Cara mengingat pola perubahan matriksnya: **"tukar posisi diagonal utama, balik tanda diagonal sekunder"** — elemen $a$ dan $d$ saling bertukar tempat, sedangkan $b$ dan $c$ tetap di tempatnya tapi tandanya dibalik. Baru setelah itu, seluruh matriks baru ini dikalikan skalar $\dfrac{1}{\det(A)}$ (ingat, $\det(A) = ad-bc$ dari sub-topik 1 — inilah alasan kita harus mengecek matriks non-singular lebih dulu sebelum melangkah ke sini).

### B. Kegiatan Interaktif / Simulasi Terpandu

Simulasi ini berjalan dalam **3 tahap berurutan**, seluruhnya lewat ketuk-ketuk (bukan drag) karena elemen matriks terlalu kecil untuk diseret dengan presisi di layar sentuh. Matriks yang dipakai: $A = \begin{pmatrix} 3 & 1 \\ 2 & 4 \end{pmatrix}$.

1. **Hitung determinan sendiri:** kamu mengetuk kedua elemen diagonal utama (biru), lalu kedua elemen diagonal sekunder (oranye) — mekanik yang sama persis dengan sub-topik 1. Hasilnya $\det(A) = 12 - 2 = 10$, dan angka itulah yang dipakai tahap 3. Kalau hasilnya nol, prosesnya berhenti di situ dengan penjelasan: matriks singular tidak punya invers.
2. **Susun adjoin:** ketuk kedua elemen **diagonal utama** untuk **menukar posisinya** (animasi dua lintasan melengkung yang saling menyilang), lalu ketuk kedua elemen **diagonal sekunder** untuk **membalik tandanya** (chip berputar $180°$ pada porosnya, efek *flip* kartu). Label matriksnya berubah menjadi $\text{adj}(A)$ begitu keduanya selesai.
3. **Pasang skalar di depan kurung:** chip pecahan $\frac{1}{10}$ muncul, dan kamu membawanya ke sebuah slot **tepat di depan kurung** matriks adjoin. Skalarnya **tidak** dikalikan masuk ke tiap sel — hasil akhirnya berbentuk $A^{-1} = \frac{1}{10}\begin{pmatrix} 4 & -1 \\ -2 & 3 \end{pmatrix}$, persis bentuk yang ditulis di papan tulis dan di lembar jawaban TKA. Perkalian skalar ke tiap elemen sudah punya sub-topiknya sendiri di Bab 2; mengulangnya di sini hanya menambah ketukan tanpa menambah konsep.

### C. Mini Kuis

1. Diketahui $F = \begin{pmatrix} 2 & 0 \\ 0 & \frac{1}{2} \end{pmatrix}$. Tentukan $F^{-1}$.
2. Diketahui $K = \begin{pmatrix} 3 & 5 \\ 1 & 2 \end{pmatrix}$. Tentukan $K^{-1}$, lalu buktikan hasilnya benar dengan mengecek $K \times K^{-1} = I$.

---

## 6. Invers Matriks 3×3 (Metode Adjoin)

### A. Materi

Untuk matriks $3\times3$, mencari invers sedikit lebih panjang karena melibatkan konsep **matriks kofaktor** dan **adjoin**. Untuk kebutuhan TKA, metode Adjoin dipilih karena lebih sistematis dan menghindari kesalahan pecahan yang sering muncul jika memakai Operasi Baris Elementer.

> $$ A^{-1} = \frac{1}{\det(A)} \cdot \text{Adj}(A) $$
> di mana $\text{Adj}(A)$ (adjoin) adalah **transpose dari matriks kofaktor** $A$.

Alur besarnya (secara konsep, tanpa memperdalam ke turunan rumus penuh minor-kofaktor):
1. Hitung $\det(A)$ terlebih dahulu (jika nol, berhenti — matriks singular, tidak punya invers).
2. Bentuk **matriks kofaktor**: setiap elemen diganti dengan kofaktornya (nilai minor yang tandanya diatur pola papan catur $+/-$).
3. **Transpose** matriks kofaktor tersebut untuk mendapatkan Adjoin.
4. Kalikan Adjoin dengan skalar $\dfrac{1}{\det(A)}$ — persis seperti tahap terakhir invers $2\times2$.

Perhatikan bagaimana bab ini "menagih" semua yang sudah kamu pelajari sebelumnya: transpose (Bab 1), perkalian skalar (Bab 2), dan determinan (sub-topik 2) — semuanya bertemu di sini.

### B. Kegiatan Interaktif / Simulasi Terpandu

Simulasi ini berjalan dalam **4 langkah berurutan** pada matriks $A = \begin{pmatrix} 1 & 2 & 1 \\ 0 & 1 & 3 \\ 2 & 1 & 1 \end{pmatrix}$. Tiga dari empat langkahnya memakai ulang mesin simulasi yang sudah kamu kenal — memang itu maksudnya: bab ini menagih semua yang sudah dipelajari.

1. **Langkah "Determinan"**: simulasi Metode Sarrus (sub-topik 2) muncul apa adanya di sini. Kamu menyalin dua kolom, lalu mengetuk keenam diagonalnya seperti biasa. Hasilnya $\det(A) = 13 - 5 = 8$, dan angka itulah yang dipakai langkah terakhir. Kalau hasilnya nol, prosesnya berhenti dengan penjelasan.
2. **Langkah "Kofaktor"**: matriks kofaktor kosong ditampilkan di samping $A$, dengan pola papan catur $+/-$ sebagai **cap air** yang sangat pucat di sudut tiap sel — pengingat pola $(-1)^{i+j}$, bukan nilai yang bisa disalahartikan sebagai jawaban.
   Kamu **menghitung sendiri tiga kofaktor**: $c_{11}$, $c_{12}$, dan $c_{23}$. Mengetuk salah satunya menggambar **garis coret** pada baris dan kolom yang bersangkutan di matriks $A$, menyisakan sub-matriks $2\times2$ yang determinannya kamu isi lewat papan angka. Tandanya baru diterapkan sesudah itu, dan diucapkan terus terang di layar (mis. *"minornya $-3$, tapi sel ini bertanda −, jadi kofaktornya menjadi $3$"*).
   Ketiga sel itu sengaja dipilih agar mencakup **kedua** tanda papan catur: $c_{11}$ positif, $c_{12}$ dan $c_{23}$ negatif — jadi aturan tandanya benar-benar teruji, bukan kebetulan lolos.
   Enam sel sisanya kemudian **diisi otomatis** dengan animasi berurutan cepat, dan sel-sel itu **ditandai `auto`** supaya jelas mana yang kerjamu dan mana yang bukan. Alasannya jujur: setelah kofaktor ketiga, sel keempat sampai kesembilan tidak lagi mengajarkan apa pun — mekaniknya sudah persis sama, yang bertambah hanya kelelahan.
3. **Langkah "Transpose"**: tombol **"Ubah ke Adjoin"** menjalankan animasi **lipat diagonal** (fungsi yang sama dengan sub-topik Transpose di Bab 1) — segitiga atas dan bawah bertukar tempat, dan label matriksnya berubah menjadi $\text{adj}(A)$.
4. **Langkah "Perakitan"**: chip $\frac{1}{8}$ kamu bawa ke slot **di depan kurung** Adjoin, menghasilkan $A^{-1} = \frac{1}{8}\begin{pmatrix} -2 & -1 & 5 \\ 6 & -1 & -3 \\ -2 & 3 & 1 \end{pmatrix}$ — bentuk yang sama dengan invers $2\times2$, hanya ukurannya berbeda.

### C. Mini Kuis

1. Diberikan matriks $A = \begin{pmatrix} 1 & 2 & 1 \\ 0 & 1 & 3 \\ 2 & 1 & 1 \end{pmatrix}$. Tentukan **kofaktor baris ke-2 kolom ke-3**, yaitu $c_{23}$.
   *(Coret baris 2 dan kolom 3, hitung determinan minor $2\times2$ yang tersisa, lalu terapkan tanda $(-1)^{2+3}$.)*
2. Jika diketahui $\det(P) = 4$ dan $\text{Adj}(P) = \begin{pmatrix} 4 & 0 & -8 \\ -2 & 4 & 2 \\ 2 & 0 & -2 \end{pmatrix}$, tuliskan bentuk akhir $P^{-1}$.
   *(Perhatikan: Adjoin dipakai apa adanya — ia sudah hasil transpose matriks kofaktor, jadi tidak perlu ditranspose lagi.)*

---

## 7. Penyelesaian Persamaan Matriks

### A. Materi

Sekarang saatnya menggunakan invers untuk hal yang sangat praktis: mencari matriks $X$ yang belum diketahui dalam sebuah persamaan. Karena **tidak ada pembagian pada matriks**, dan **perkalian matriks tidak komutatif**, posisi invers saat "memindahkan" matriks ke ruas lain **sangat menentukan**:

> - Bentuk $AX = B \implies X = A^{-1}B$ (invers $A$ dikalikan dari **depan/kiri** pada kedua ruas)
> - Bentuk $XA = B \implies X = BA^{-1}$ (invers $A$ dikalikan dari **belakang/kanan** pada kedua ruas)

Kenapa posisinya harus konsisten di kedua ruas? Karena mengalikan kedua ruas persamaan dengan $A^{-1}$ **dari sisi yang sama** adalah satu-satunya cara memastikan $A^{-1}A = I$ (atau $AA^{-1}=I$) bisa "terbentuk" berdampingan dan lenyap, menyisakan $X$ sendirian. Jika kamu keliru menaruh $A^{-1}$ di sisi yang salah, $A$ dan $A^{-1}$ tidak akan bertemu bersebelahan, dan $X$ tidak akan pernah bisa berdiri sendiri.

### B. Kegiatan Interaktif / Simulasi Terpandu

Persamaan matriks ditampilkan sebagai balok-balok simbol yang bisa di-drag, misalnya $\boxed{A} \boxed{X} = \boxed{B}$. Di samping, tersedia chip $\boxed{A^{-1}}$ yang siap di-drag.

Simulasi ini punya **dua langkah**, dan keduanya mengajarkan hal yang berbeda: yang pertama menguji **letak** invers, yang kedua menagih **hitungannya**.

**Langkah 1 — letak invers.** Persamaan ditampilkan sebagai balok simbol $\boxed{A}\,\boxed{X} = \boxed{B}$ dengan slot kosong di kiri dan kanan tiap ruas. Chip $\boxed{A^{-1}}$ bisa kamu seret — atau ketuk chipnya lalu ketuk slotnya, karena setiap seretan di aplikasi ini selalu punya pasangan ketuk-ketuk.

1. Jika kamu menaruhnya di sisi **yang salah** (mis. di kanan $A$ padahal bentuknya $AX=B$, sehingga susunannya menjadi $A\,X\,A^{-1}$), chip **memantul kembali** dan sebuah **Toast** menjelaskan sebabnya: *"Salah posisi! Karena bentuknya $AX = B$, $A^{-1}$ harus ditaruh di sisi kiri pada kedua ruas agar bertemu dengan $A$."* Pantulan tanpa penjelasan hanya memberi tahu "salah", bukan "kenapa".
2. Jika kamu menaruhnya di sisi **kiri**, persamaan menjadi $A^{-1}A\,X = A^{-1}B$. Kedua ruas harus dikalikan — persamaan harus tetap seimbang, jadi menaruh di satu ruas saja belum cukup dan sistem mengingatkannya.
3. Begitu keduanya terisi, $A^{-1}$ dan $A$ yang kini bersebelahan **melebur menjadi $I$** lalu **menghilang** (karena $I$ tidak mengubah apa pun — sifat identitas dari Bab 2), menyisakan $X = A^{-1}B$.

**Langkah 2 — hitung sendiri.** Matriks angka sungguhannya muncul, dan simulasi **perkalian matriks** dari Bab 2 dipakai apa adanya: pilih sel hasil, bawa pasangan elemen **baris × kolom**, lalu tekan tombol hitung. Bentuk $X = A^{-1}B$ tidak pernah dicetak lengkap sebagai rumus jadi — kamu yang mengalikannya.

> **Catatan mekanik.** Yang dipakai di langkah 2 adalah mesin **perkalian matriks**, bukan mesin pasangan seletak yang dipakai penjumlahan. Keduanya sama-sama "ketuk pasangan" sehingga mudah tertukar, tetapi matematikanya berbeda: pasangan seletak memasangkan $a_{ij}$ dengan $b_{ij}$ (itu penjumlahan), sedangkan $A^{-1}B$ menuntut baris dikali kolom.

### C. Mini Kuis

1. Diketahui $AX = B$ dengan $A = \begin{pmatrix} 2 & 1 \\ 1 & 1 \end{pmatrix}$ dan $B = \begin{pmatrix} 5 \\ 3 \end{pmatrix}$. Tentukan matriks $X$.
2. Diberikan bentuk persamaan $XA = B$. Jika kamu salah menuliskan penyelesaiannya sebagai $X = A^{-1}B$ (bukan $X = BA^{-1}$), jelaskan mengapa ini berpotensi salah, dikaitkan dengan sifat non-komutatif perkalian matriks.

---

Selamat, kamu baru saja menaklukkan bab paling teknis dari seluruh materi Matriks! Determinan dan invers yang baru kamu kuasai ini bukan sekadar latihan berhitung — di **Bab 4: Pemodelan Matematika**, kamu akan melihat langsung bagaimana kedua alat ini dipakai untuk memecahkan masalah dunia nyata, persis seperti pola soal yang muncul di TKA.
