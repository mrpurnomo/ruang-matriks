/**
 * ui/scratchpad.js — Papan Coret (Fase 15, dipoles di Fase 15.5, ditata ulang di Fase 19)
 *
 * Kanvas coret-coret yang menempel di PANGGUNG, untuk siswa yang perlu
 * menghitung determinan/invers 3×3 di samping soalnya. Sebelum ini, satu-satunya
 * cara adalah mengambil kertas — dan begitu mata siswa turun ke kertas, konteks
 * matriksnya hilang.
 *
 * ============================================================
 * FASE 19 — KERTAS DI SAMPING SOAL, BUKAN DI ATASNYA
 * ============================================================
 *
 * Umpan balik siswa: "untuk melihat lagi angka matriksnya, aku harus menutup
 * papan lalu membukanya lagi, atau menahan tombol mata sambil menghitung."
 * Akar masalahnya sudah dicatat di HANDOFF §000A: sejak kanvasnya PADAT,
 * soal dan coretan tidak pernah bisa terlihat BERSAMAAN. Mengintip hanya
 * meringankan gejalanya — setiap angka yang dibaca tetap butuh satu tahanan.
 *
 * Jawabannya meniru cara orang menghitung di dunia nyata: kertas buram
 * ditaruh DI SEBELAH buku soal, bukan di atasnya. Tata letak bawaannya kini
 * **Berdampingan** — panggung dibelah dua, soal mengalir ulang di kiri dan
 * tetap HIDUP (pilihan jawaban, sel matriks, Mathpad semuanya bisa diketuk
 * tanpa menutup papan), kertas di kanan. Nol tahanan, nol bolak-balik.
 *
 * Dua tata letak lain tetap tersedia lewat menu "Tata letak":
 *
 *   · **Kertas penuh** — perilaku lama: kertas selebar panggung untuk hitungan
 *     yang benar-benar panjang, dengan mekanik Mengintip.
 *   · **Kalkir** — kertas tembus pandang di atas soal, untuk MENANDAI soalnya
 *     sendiri: melingkari elemen, menarik diagonal Sarrus di matriks aslinya.
 *     Ini pilihan sadar, bukan bawaan: UAT Fase 15.5 menyebut lapisan tembus
 *     sebagai beban kognitif bila ia satu-satunya pilihan.
 *
 * Pilihan tata letak dan lebar kertas diingat per perangkat (`localStorage`):
 * siswa yang lebih suka kertas penuh tidak perlu memilihnya ulang di setiap
 * sub-topik.
 *
 * ============================================================
 * KENAPA GORESAN DISIMPAN SEBAGAI VEKTOR, BUKAN toDataURL()
 * ============================================================
 *
 * Cara yang biasa dipakai adalah menyimpan cuplikan bitmap tiap goresan. Di
 * aplikasi INI ia mahal: panggung berukuran ±1000×600 CSS px, dan pada layar
 * 2× kanvasnya menjadi 2000×1200 piksel. Satu cuplikan `getImageData` =
 * 2000 × 1200 × 4 byte ≈ **9,6 MB**. Dua puluh cuplikan ≈ **190 MB**.
 *
 * Satu goresan sebagai vektor berisi beberapa puluh titik: **±2 KB**. Seribu
 * kali lebih ringan, dan TIGA keuntungan mengikuti:
 *
 *   1. `ResizeObserver` bisa MENGGAMBAR ULANG dengan tajam pada ukuran baru.
 *   2. Undo/redo cuma memindahkan elemen antar-array — tidak ada dekode PNG.
 *   3. **Penghapus bisa bekerja per-GORESAN** (Fase 15.5).
 *
 * ⚠️ Titiknya disimpan dalam **piksel CSS relatif terhadap sudut kiri-atas
 * kertas** — BUKAN lagi ternormalisasi 0..1 seperti Fase 15. Selama kertas
 * hanya punya satu ukuran, normalisasi tidak terasa. Begitu lebarnya bisa
 * berganti (berdampingan ↔ penuh, pembatas yang diseret), koordinat 0..1
 * MEREGANGKAN tulisan siswa: angka "8" yang ditulis di kertas selebar 420px
 * menjadi gepeng dua kali lipat di kertas 860px. Dengan piksel, kertas yang
 * menyempit hanya MENYEMBUNYIKAN bagian kanannya — tulisannya utuh dan muncul
 * lagi begitu kertasnya dilebarkan, persis kertas sungguhan yang dilipat.
 */

import { icon } from './icons.js';

/** Undo dibatasi 20 TINDAKAN terakhir, sesuai kontrak Fase 15. */
const HISTORY_LIMIT = 20;

/**
 * Jangkauan penghapus goresan, dalam CSS px.
 *
 * Dipakai sebagai radius di sekitar lintasan pointer: goresan yang salah satu
 * ruasnya berada dalam jarak ini akan dibuang UTUH. Angkanya sengaja di tengah
 * rentang 10–15px — cukup longgar supaya satu ketukan jari (yang tidak pernah
 * presisi) mengenai coretan tipis, tapi masih cukup rapat supaya dua angka yang
 * ditulis berdekatan tidak ikut terhapus sekaligus.
 */
const ERASER_REACH = 12;

const COLORS = [
  { id: 'ink', label: 'Hitam', value: '#0A1B45' },
  { id: 'red', label: 'Merah', value: '#E5484D' },
  { id: 'blue', label: 'Biru', value: '#1D4ED8' },
  { id: 'yellow', label: 'Kuning', value: '#FFC800' },
];

const WIDTHS = [
  { id: 'thin', label: 'Tipis', value: 2 },
  { id: 'medium', label: 'Sedang', value: 4 },
  { id: 'thick', label: 'Tebal', value: 8 },
];

const LAYOUTS = [
  {
    id: 'split',
    icon: 'layout-split',
    label: 'Berdampingan',
    note: 'Soal di kiri, kertas di kanan',
    status: 'Soal tetap terlihat di kiri',
  },
  {
    id: 'full',
    icon: 'layout-full',
    label: 'Kertas penuh',
    note: 'Selebar panggung, untuk hitungan panjang',
    status: 'Tahan ikon mata untuk melihat soal',
  },
  {
    id: 'trace',
    icon: 'layout-trace',
    label: 'Kalkir',
    note: 'Tembus pandang — coret langsung di atas soal',
    status: 'Tembus pandang di atas soal',
  },
];

/**
 * Lebar kertas pada tata letak berdampingan, sebagai porsi panggung.
 *
 * Batasnya menjaga KEDUA sisi tetap berguna: di bawah ±36% kertasnya tidak
 * cukup untuk satu baris hitungan determinan 3×3, di atas ±64% soalnya
 * terlipat sampai matriks 3×3 harus menggulir. Ketukan pada pembatas
 * berpindah di antara tiga lebar yang paling sering dibutuhkan.
 */
const RATIO_MIN = 0.36;
const RATIO_MAX = 0.64;
const RATIO_DEFAULT = 0.5;
const RATIO_PRESETS = [0.4, 0.5, 0.6];

/**
 * Di bawah lebar panggung ini, berdampingan tidak lagi masuk akal: kedua
 * separuhnya sama-sama terlalu sempit untuk dipakai. Papannya lalu tampil
 * sebagai kertas penuh — pilihan siswa TIDAK diubah, sehingga begitu layarnya
 * cukup lebar lagi (mis. keluar dari layar terpisah), ia kembali berdampingan.
 */
const SPLIT_MIN_STAGE = 700;

/**
 * Batas lebar dalam PIKSEL, di samping batas rasio di atas.
 *
 * Rasio saja tidak cukup: 36% dari panggung 840px hanya 302px, dan di lebar
 * itu bilah alat yang paling ringkas pun terpaksa membungkus jadi dua baris.
 * Sebaliknya di monitor lebar, 64% bisa menyisakan soal yang masih lega.
 * Jadi rasio menyatakan KEINGINAN siswa, dan piksel menjamin kedua sisi
 * tetap bisa dipakai (400px = lebar bilah alat ringkas ±367px + tepinya).
 * `SPLIT_MIN_STAGE` (700) = 400 + 300, sehingga kedua
 * batas ini tidak pernah saling bertabrakan.
 */
const MIN_PAPER_PX = 400;
const MIN_QUESTION_PX = 300;

/**
 * Di bawah lebar kertas ini bilah alat masuk mode RINGKAS: deret warna dan
 * ketebalan dilipat ke balik satu tombol masing-masing. Angkanya diukur dari
 * lebar bilah alat lengkap (±560px) ditambah tepi kiri-kanannya.
 */
const COMPACT_BELOW = 620;

const PREFS_KEY = 'matriksLab.scratchpad.v1';

/**
 * Pasang papan coret pada sebuah kolom panggung.
 *
 * @param {HTMLElement} host  biasanya `.ws-stage`
 * @returns {{ destroy: Function, open: Function, close: Function, setLayout: Function }}
 */
export function createScratchpad(host) {
  if (!host) return { destroy() {}, open() {}, close() {}, setLayout() {} };

  /* ---------------- State ---------------- */
  let strokes = [];          // goresan yang tampil, urut dari yang terlama
  let live = null;           // goresan pena yang sedang digambar
  let erasing = null;        // gestur penghapus yang sedang berjalan

  /**
   * Riwayat TINDAKAN, bukan riwayat goresan.
   *
   * Sejak penghapus bekerja per-goresan (Fase 15.5), "satu langkah mundur"
   * tidak lagi selalu berarti "buang goresan terakhir": sekali sapuan penghapus
   * bisa membuang tiga goresan sekaligus, dan undo harus mengembalikan
   * ketiganya ke POSISI semula di dalam tumpukan. Karena itu yang ditumpuk di
   * sini adalah tindakannya:
   *
   *   { type: 'draw',  stroke }
   *   { type: 'erase', removed: [{ index, stroke }, ...] }  ← urut waktu buang
   *
   * `strokes` tinggal jadi daftar-gambar murni.
   */
  let history = [];
  let redo = [];             // tindakan yang baru saja diurungkan

  /**
   * Banyak tindakan paling awal yang sudah TIDAK bisa diurungkan lagi.
   *
   * Ia hanya boleh NAIK, dan dihitung dari puncak tertinggi jumlah tindakan —
   * bukan dari jumlah saat ini. Versi pertama menghitungnya ulang sebagai
   * `panjang - 20` setiap kali, sehingga batasnya ikut turun setiap kali satu
   * tindakan di-undo: hasilnya undo tetap bisa menyapu seluruh papan, dan
   * batas 20 tidak pernah berlaku.
   */
  let committed = 0;
  let tool = 'pen';
  let color = COLORS[0].value;
  let width = WIDTHS[1].value;
  let open = false;
  let peeking = false;
  let cssW = 0;
  let cssH = 0;

  const prefs = readPrefs();
  let layout = prefs.layout;   // pilihan SISWA
  let ratio = prefs.ratio;

  /* ---------------- DOM ---------------- */
  const fab = el('button', 'pad-fab');
  fab.type = 'button';
  fab.innerHTML = `${icon('pencil', { size: 19 })}<span class="pad-fab__label">Coret</span>`;
  fab.setAttribute('aria-label', 'Buka papan coret');
  fab.setAttribute('aria-expanded', 'false');
  fab.title = 'Papan coret — hitung manual di samping soal';

  const root = el('div', 'pad');
  root.hidden = true;
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', 'Papan coret');

  // --- Kepala kertas: identitas, keterangan tata letak, tombol tutup ---
  const head = el('div', 'pad__head');
  const headMark = el('span', 'pad__head-mark');
  headMark.innerHTML = icon('pencil', { size: 14 });
  const headText = el('div', 'pad__head-text');
  const headTitle = el('span', 'pad__head-title');
  headTitle.textContent = 'Kertas Coretan';
  const headNote = el('span', 'pad__head-note');
  headText.append(headTitle, headNote);
  const closeBtn = iconButton('x', 'Tutup papan coret');
  closeBtn.classList.add('pad__close');
  head.append(headMark, headText, closeBtn);
  root.appendChild(head);

  const canvas = document.createElement('canvas');
  canvas.className = 'pad__canvas';
  canvas.setAttribute('aria-label', 'Kanvas coretan');
  root.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  /**
   * Pembatas antara soal dan kertas (hanya pada tata letak berdampingan).
   *
   * Dua jalur, sesuai kontrak §5 butir 12: SERET untuk lebar yang presisi,
   * KETUK untuk berpindah di antara tiga lebar siap pakai. Panah kiri/kanan
   * menggesernya dari papan ketik.
   */
  const grip = el('button', 'pad__grip');
  grip.type = 'button';
  grip.innerHTML = `<span class="pad__grip-knob">${icon('grip', { size: 14, stroke: 2.6 })}</span>`;
  grip.setAttribute('role', 'separator');
  grip.setAttribute('aria-orientation', 'vertical');
  grip.setAttribute('aria-valuemin', String(Math.round(RATIO_MIN * 100)));
  grip.setAttribute('aria-valuemax', String(Math.round(RATIO_MAX * 100)));
  grip.setAttribute('aria-label', 'Atur lebar kertas — seret, atau ketuk untuk berganti lebar');
  grip.title = 'Seret untuk mengatur lebar · ketuk untuk berganti lebar';
  root.appendChild(grip);

  const bar = el('div', 'pad__bar');
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Alat papan coret');
  root.appendChild(bar);

  host.appendChild(fab);
  host.appendChild(root);

  /* ---------------- Toolbar ---------------- */
  const toolBtns = {};
  const colorBtns = {};
  const widthBtns = {};
  const layoutBtns = {};
  const trays = [];

  const group = (label) => {
    const g = el('div', 'pad__group');
    g.setAttribute('role', 'group');
    g.setAttribute('aria-label', label);
    bar.appendChild(g);
    return g;
  };

  /**
   * Sebuah grup yang isinya bisa DILIPAT ke balik satu tombol.
   *
   * Di kertas yang lebar, deret pilihannya tampil langsung (satu ketukan
   * untuk berganti warna). Di kertas yang sempit — terutama tata letak
   * berdampingan — deret itu dilipat: tombol pemicunya menampilkan pilihan
   * yang sedang aktif, dan ketukan membuka baki kecil di atas bilah.
   * Elemen pilihannya SAMA di kedua bentuk; yang berubah hanya CSS-nya.
   */
  const foldable = (g, label, extraClass) => {
    const trigger = el('button', 'pad__pick');
    trigger.type = 'button';
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', label);
    trigger.title = label;
    const tray = el('div', `pad__tray${extraClass ? ` ${extraClass}` : ''}`);
    g.append(trigger, tray);
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTray(g);
    });
    trays.push({ g, trigger });
    return { trigger, tray };
  };

  // --- Alat ---
  const gTool = group('Alat');
  [['pen', 'pencil', 'Pena'], ['eraser', 'eraser', 'Penghapus']].forEach(([id, ic, label]) => {
    const b = iconButton(ic, label);
    b.addEventListener('click', () => setTool(id));
    toolBtns[id] = b;
    gTool.appendChild(b);
  });

  // --- Warna ---
  const gColor = group('Warna');
  const colorFold = foldable(gColor, 'Pilih warna tinta');
  colorFold.trigger.innerHTML = '<span class="pad__pick-dot"></span>';
  COLORS.forEach((c) => {
    const b = el('button', 'pad__swatch');
    b.type = 'button';
    b.style.setProperty('--swatch', c.value);
    b.setAttribute('aria-label', `Warna ${c.label}`);
    b.title = c.label;
    b.addEventListener('click', () => { setColor(c.value); closeTrays(); });
    colorBtns[c.value] = b;
    colorFold.tray.appendChild(b);
  });

  // --- Ketebalan ---
  const gWidth = group('Ketebalan');
  const widthFold = foldable(gWidth, 'Pilih ketebalan garis');
  widthFold.trigger.innerHTML = '<span class="pad__pick-line"></span>';
  WIDTHS.forEach((w) => {
    const b = el('button', 'pad__width');
    b.type = 'button';
    b.setAttribute('aria-label', `Ketebalan ${w.label}`);
    b.title = w.label;
    b.innerHTML = `<span style="height:${w.value}px"></span>`;
    b.addEventListener('click', () => { setWidth(w.value); closeTrays(); });
    widthBtns[w.value] = b;
    widthFold.tray.appendChild(b);
  });

  // --- Aksi ---
  const gAction = group('Tindakan');
  const undoBtn = iconButton('undo', 'Urungkan');
  undoBtn.addEventListener('click', undo);
  const redoBtn = iconButton('redo', 'Ulangi');
  redoBtn.addEventListener('click', redoStroke);
  const clearBtn = iconButton('trash', 'Hapus semua');
  clearBtn.addEventListener('click', clearAll);
  gAction.append(undoBtn, redoBtn, clearBtn);

  // --- Mengintip & tata letak ---
  const gView = group('Tampilan');
  const peekBtn = iconButton('eye', 'Tahan untuk mengintip soal');
  peekBtn.classList.add('pad__peek');
  gView.appendChild(peekBtn);

  const layoutFold = foldable(gView, 'Tata letak papan', 'pad__tray--menu');
  layoutFold.trigger.classList.add('pad__pick--layout');
  const menuTitle = el('span', 'pad__menu-title');
  menuTitle.textContent = 'Tata letak';
  layoutFold.tray.appendChild(menuTitle);
  LAYOUTS.forEach((L) => {
    const b = el('button', 'pad__layout');
    b.type = 'button';
    b.dataset.layout = L.id;
    b.innerHTML = `<span class="pad__layout-icon">${icon(L.icon, { size: 18 })}</span>`
      + `<span class="pad__layout-text"><b>${L.label}</b><small>${L.note}</small></span>`;
    b.addEventListener('click', () => { setLayout(L.id); closeTrays(); });
    layoutBtns[L.id] = b;
    layoutFold.tray.appendChild(b);
  });

  closeBtn.addEventListener('click', close);

  /* ============================================================
     BAKI LIPAT (warna, ketebalan, tata letak)
     ============================================================ */
  function toggleTray(g) {
    const willOpen = g.dataset.open !== 'true';
    closeTrays();
    if (!willOpen) return;
    g.dataset.open = 'true';
    const t = trays.find((x) => x.g === g);
    if (t) t.trigger.setAttribute('aria-expanded', 'true');
  }

  function closeTrays() {
    trays.forEach(({ g, trigger }) => {
      if (g.dataset.open) delete g.dataset.open;
      trigger.setAttribute('aria-expanded', 'false');
    });
  }

  const anyTrayOpen = () => trays.some(({ g }) => g.dataset.open === 'true');

  // Ketukan di luar baki menutupnya — termasuk ketukan di kanvas, yang
  // sekaligus tetap menggambar (baki tidak boleh "memakan" satu goresan).
  const onOutside = (e) => {
    if (!anyTrayOpen()) return;
    if (trays.some(({ g }) => g.contains(e.target))) return;
    closeTrays();
  };
  document.addEventListener('pointerdown', onOutside, true);

  /* ============================================================
     MENGINTIP (peek)

     Ditahan, bukan diklik. Selama jarinya menekan, seluruh lapisan
     coretan meredup jadi tembus pandang supaya soal di bawahnya
     terbaca; begitu dilepas, coretannya kembali utuh.

     Sejak Fase 19 mekanik ini hanya TAMPIL pada tata letak yang
     menutupi soal (kertas penuh & kalkir). Pada tata letak
     berdampingan tidak ada yang perlu diintip — soalnya memang sudah
     terlihat di sebelah kiri — jadi tombolnya disembunyikan CSS.
     Mesinnya sendiri tidak bergantung pada tata letak.

     Pelepasannya didengarkan di DUA tempat sekaligus, dan itu
     disengaja:

       · di TOMBOLNYA  — `pointerup` / `pointercancel` / `pointerleave`,
         supaya perilakunya persis seperti tombol tahan pada umumnya;
       · di `window`   — jaring pengaman. Bilah alat ikut lenyap saat
         mengintip, jadi kalau tombolnya sampai kehilangan pointer
         (jari digeser ke luar panggung, jendela kehilangan fokus),
         papan bisa tersangkut tembus pandang SELAMANYA. CSS menjaga
         `.pad__peek` tetap bisa menerima pointer selama mengintip,
         tetapi jaring ini tetap dipertahankan: satu papan yang macet
         di tengah ujian jauh lebih mahal daripada dua listener.
     ============================================================ */
  const startPeek = (event) => {
    if (!open || peeking) return;
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    peeking = true;
    closeTrays();
    // Goresan yang sedang berjalan dibatalkan — menggambar sambil
    // mengintip akan menaruh garis di tempat yang tidak terlihat.
    abortLive();
    root.dataset.peek = 'true';
  };

  const endPeek = () => {
    if (!peeking) return;
    peeking = false;
    delete root.dataset.peek;
  };

  peekBtn.addEventListener('pointerdown', startPeek);
  peekBtn.addEventListener('pointerup', endPeek);
  peekBtn.addEventListener('pointercancel', endPeek);
  peekBtn.addEventListener('pointerleave', endPeek);
  window.addEventListener('pointerup', endPeek);
  window.addEventListener('pointercancel', endPeek);
  // Menahan lalu menggeser keluar jendela juga harus melepas.
  window.addEventListener('blur', endPeek);
  // Papan ketik: Enter/Space menahan selama tombolnya ditekan.
  peekBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startPeek(e); }
  });
  peekBtn.addEventListener('keyup', endPeek);

  /* ============================================================
     Menggambar
     ============================================================ */

  /**
   * Posisi pointer dalam piksel CSS, relatif terhadap sudut kiri-atas
   * kertas. Lihat catatan di kepala berkas: koordinat TIDAK lagi
   * dinormalisasi, supaya tulisan tidak meregang saat kertas berubah lebar.
   */
  const pos = (event) => {
    const r = canvas.getBoundingClientRect();
    return { x: event.clientX - r.left, y: event.clientY - r.top };
  };

  /**
   * Titik-titik yang dibawa satu peristiwa gerak.
   *
   * `getCoalescedEvents()` mengembalikan titik-titik yang digabung peramban
   * dalam satu frame — memakainya membuat garis stylus jauh lebih halus tanpa
   * menambah beban gambar.
   *
   * TETAPI ia bisa mengembalikan array KOSONG (peristiwa sintetis, sebagian
   * peramban, beberapa driver stylus). Kalau hasilnya dipakai mentah-mentah,
   * goresannya tidak pernah bertambah titik dan yang tergambar hanya satu
   * noktah di tempat jari pertama mendarat. Karena itu selalu ada cadangan
   * ke peristiwanya sendiri.
   */
  const sampled = (event) => {
    const merged = event.getCoalescedEvents ? event.getCoalescedEvents() : null;
    const raw = merged && merged.length ? merged : [event];
    return raw.map(pos);
  };

  function onDown(event) {
    if (!open || peeking) return;
    if (event.button != null && event.button > 0) return;   // abaikan klik kanan
    event.preventDefault();

    canvas.setPointerCapture?.(event.pointerId);

    if (tool === 'eraser') {
      // Penghapus tidak meninggalkan goresan apa pun — ia hanya membuang.
      const p = pos(event);
      erasing = { last: p, removed: [] };
      // Satu KETUKAN di atas sebuah coretan sudah harus menghapusnya; siswa
      // tidak perlu menyapu. Ruas berjarak nol tetap punya jangkauan radius.
      eraseAlong(p, p);
      return;
    }

    live = {
      tool: 'pen',
      color,
      width,
      points: [pos(event)],
      /** Indeks titik terakhir yang sudah tergambar — lihat `drawTail()`. */
      drawn: 0,
    };
    // Satu ketukan tanpa geser tetap meninggalkan titik — itu yang
    // diharapkan siswa saat memberi tanda kecil.
    drawDot(live);
  }

  function onMove(event) {
    if (peeking) return;

    if (erasing) {
      event.preventDefault();
      // Tiap titik antara ikut diperiksa: sapuan cepat tidak boleh
      // "melompati" coretan tipis di antara dua sampel pointer.
      sampled(event).forEach((p) => {
        eraseAlong(erasing.last, p);
        erasing.last = p;
      });
      return;
    }

    if (!live) return;
    event.preventDefault();

    sampled(event).forEach((p) => live.points.push(p));
    // Hanya menyambung ruas yang BELUM tergambar — menggambar ulang seluruh
    // papan pada tiap gerakan akan tersendat begitu goresannya banyak.
    drawTail(live);
  }

  function onUp() {
    if (erasing) {
      // Satu sapuan penghapus = SATU langkah undo, berapa pun goresan yang
      // terbawa. Sapuan yang tidak mengenai apa pun tidak menyampahi riwayat.
      if (erasing.removed.length) pushOp({ type: 'erase', removed: erasing.removed });
      erasing = null;
      syncActions();
      return;
    }

    if (!live) return;
    strokes.push(live);
    pushOp({ type: 'draw', stroke: live });
    live = null;
    syncActions();
  }

  /** Buang goresan/gestur yang sedang berjalan tanpa menyimpannya. */
  function abortLive() {
    if (!live && !erasing) return;
    // Penghapus yang dibatalkan di tengah jalan TIDAK mengembalikan goresan
    // yang sudah telanjur dibuang — itu akan terasa seperti coretan yang
    // hidup kembali sendiri. Yang hilang hanya kesempatan meng-undo-nya
    // sebagai satu kesatuan; sisanya sudah tercatat saat `onUp()`.
    if (erasing && erasing.removed.length) {
      pushOp({ type: 'erase', removed: erasing.removed });
    }
    live = null;
    erasing = null;
    redrawAll();
    syncActions();
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  /* ============================================================
     PENGHAPUS GORESAN (Fase 15.5)

     Bukan penghapus piksel. Yang dicari adalah goresan MANA yang
     tersentuh lintasan pointer, lalu goresan itu dibuang seluruhnya.

     Alasannya pedagogis: yang ingin dibuang siswa hampir selalu satu
     simbol — satu angka, satu tanda kurung, satu garis coret Sarrus —
     bukan sepotong piksel di tengahnya. Penghapus piksel menyisakan
     puing separuh angka yang justru bikin papannya lebih kotor.
     ============================================================ */

  /** Buang setiap goresan yang tersentuh ruas pointer `a → b` (piksel CSS). */
  function eraseAlong(a, b) {
    if (!strokes.length || !cssW || !cssH) return;

    let hit = false;

    // Dari yang TERATAS ke bawah: goresan yang terakhir digambar adalah yang
    // paling terlihat, jadi ia yang paling masuk akal dibuang lebih dulu.
    // Menyusur mundur juga membuat `splice` tidak merusak indeks yang belum
    // diperiksa.
    for (let i = strokes.length - 1; i >= 0; i--) {
      const s = strokes[i];
      // Goresan tebal menutup area lebih luas, jadi jangkauannya ikut melebar.
      if (!strokeTouched(s, a.x, a.y, b.x, b.y, ERASER_REACH + s.width / 2)) continue;
      // Indeksnya dicatat SAAT dibuang; undo mengembalikannya dengan urutan
      // terbalik, sehingga posisi tumpuknya pulih persis.
      erasing.removed.push({ index: i, stroke: s });
      strokes.splice(i, 1);
      hit = true;
    }

    if (hit) redrawAll();
  }

  /** Apakah salah satu ruas goresan `s` berada dalam `reach` dari ruas pointer? */
  function strokeTouched(s, ax, ay, bx, by, reach) {
    const pts = s.points;
    if (!pts.length) return false;

    if (pts.length === 1) {
      return distPointSeg(pts[0].x, pts[0].y, ax, ay, bx, by) <= reach;
    }

    for (let i = 1; i < pts.length; i++) {
      if (segSegDist(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y,
        ax, ay, bx, by) <= reach) return true;
    }
    return false;
  }

  /* ============================================================
     Render
     ============================================================ */
  function applyStyle(s) {
    ctx.lineCap = 'round';     // tanpa ini, ujung garis kotak dan patah-patah
    ctx.lineJoin = 'round';
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    // Sejak penghapus bekerja per-goresan, tidak ada lagi yang perlu
    // "melubangi" lapisan: goresan yang dihapus benar-benar hilang dari
    // datanya, lalu papan digambar ulang tanpa dia.
    ctx.globalCompositeOperation = 'source-over';
  }

  /** Titik tunggal: lingkaran kecil, bukan garis sepanjang nol. */
  function drawDot(s) {
    const p = s.points[0];
    if (!p) return;
    applyStyle(s);
    ctx.beginPath();
    ctx.arc(p.x, p.y, (ctx.lineWidth / 2) || 1, 0, Math.PI * 2);
    ctx.fillStyle = s.color;
    ctx.fill();
  }

  /**
   * Sambung SEMUA ruas goresan hidup yang belum tergambar.
   *
   * ⚠️ Di sinilah bug "garis putus-putus saat menyapu cepat" bersarang.
   * Versi sebelumnya selalu menggambar dari `points.length - 2`, yaitu ruas
   * TERAKHIR saja. Selama satu peristiwa gerak hanya membawa satu titik, itu
   * kebetulan benar. Tapi begitu jari disapu cepat, `getCoalescedEvents()`
   * menyerahkan 5–10 titik sekaligus dalam SATU peristiwa: semuanya masuk ke
   * `points`, sementara yang tergambar cuma ruas paling akhir — sisanya
   * dilewati, dan itulah celah-celah kosong yang terlihat siswa.
   *
   * Penanda `drawn` menutup celah itu: ia mengingat sampai titik ke berapa
   * kanvas sudah menyusul, jadi setiap ruas digambar tepat satu kali dan
   * garisnya selalu bersambung ke titik sebelumnya.
   */
  function drawTail(s) {
    const pts = s.points;
    if (pts.length < 2) return;
    if (s.drawn >= pts.length - 1) return;

    applyStyle(s);
    ctx.beginPath();
    ctx.moveTo(pts[s.drawn].x, pts[s.drawn].y);
    for (let i = s.drawn + 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    s.drawn = pts.length - 1;
  }

  /** Gambar satu goresan utuh dari titik pertama (dipakai `redrawAll`). */
  function drawWhole(s) {
    const pts = s.points;
    if (!pts.length) return;
    if (pts.length === 1) { drawDot(s); return; }

    applyStyle(s);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
  }

  function redrawAll() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    strokes.forEach(drawWhole);
    // Goresan yang sedang berjalan ikut digambar ulang supaya ia tidak
    // berkedip hilang saat penghapus/ubah ukuran memicu gambar ulang.
    if (live) { drawWhole(live); live.drawn = live.points.length - 1; }
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ============================================================
     Ukuran, tata letak & rotasi perangkat

     Kanvas punya DUA ukuran: kotak CSS-nya, dan jumlah piksel
     sebenarnya (dikali `devicePixelRatio` supaya garisnya tidak
     buram di layar retina). Keduanya harus dihitung ulang setiap
     panggung berubah — dan karena goresannya vektor, isinya
     digambar ulang TAJAM, bukan diregangkan.
     ============================================================ */
  function resize() {
    // Lebar kertas berdampingan dihitung dulu: ia yang menentukan kotak
    // kanvas yang akan diukur di bawah.
    syncLayout();

    const r = canvas.getBoundingClientRect();
    const w = Math.round(r.width);
    const h = Math.round(r.height);
    if (!w || !h) return;             // masih tersembunyi: tidak ada yang bisa diukur

    root.dataset.compact = String(root.getBoundingClientRect().width < COMPACT_BELOW);

    const dpr = window.devicePixelRatio || 1;
    const needW = Math.round(w * dpr);
    const needH = Math.round(h * dpr);

    // Buffer diperiksa TERPISAH dari kotak CSS-nya. Kalau hanya kotak CSS
    // yang dibandingkan, kanvas yang sempat dibuat saat panggung belum
    // terukur akan tersangkut di ukuran bawaan 300x150 — dan seluruh
    // goresan mendarat di koordinat yang salah.
    if (w === cssW && h === cssH
        && canvas.width === needW && canvas.height === needH) return;

    cssW = w;
    cssH = h;
    canvas.width = needW;
    canvas.height = needH;
    redrawAll();
  }

  /** Lebar isi panggung yang bisa dibagi antara soal dan kertas. */
  function stageRoom() {
    // `.pad` berhenti di talang scrollbar (`right: var(--sp-5)`), jadi ruang
    // yang benar-benar bisa dipakai adalah lebar kolom DIKURANGI talang itu.
    const gutter = parseFloat(getComputedStyle(root).right) || 0;
    return Math.max(0, host.clientWidth - gutter);
  }

  /** Tata letak yang BENAR-BENAR tampil — berdampingan butuh panggung lebar. */
  function effectiveLayout() {
    if (layout === 'split' && stageRoom() < SPLIT_MIN_STAGE) return 'full';
    return layout;
  }

  /** Lebar kertas berdampingan dalam piksel — rasio siswa, dijaga batas piksel. */
  function paperWidth() {
    const room = stageRoom();
    const wish = Math.round(room * ratio);
    return Math.max(MIN_PAPER_PX, Math.min(room - MIN_QUESTION_PX, wish));
  }

  let shownLayout = null;

  function syncLayout() {
    const eff = effectiveLayout();
    root.dataset.layout = eff;
    host.style.setProperty('--pad-w', `${paperWidth()}px`);
    if (open) host.dataset.padLayout = eff;

    // Fungsi ini dipanggil di SETIAP ubah ukuran — termasuk tiap frame saat
    // pembatas diseret — jadi label & ikon hanya ditulis ulang bila tata
    // letaknya memang berganti.
    if (eff !== shownLayout) {
      shownLayout = eff;
      const L = LAYOUTS.find((x) => x.id === eff) || LAYOUTS[0];
      headNote.textContent = L.status;
      layoutFold.trigger.innerHTML = icon(L.icon, { size: 17 });
      Object.entries(layoutBtns).forEach(([id, b]) => press(b, id === eff));
    }
    const narrow = stageRoom() < SPLIT_MIN_STAGE;
    layoutBtns.split.disabled = narrow;
    layoutBtns.split.title = narrow ? 'Layar ini terlalu sempit untuk berdampingan' : '';
    grip.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
  }

  const observer = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => resize())
    : null;
  if (observer) observer.observe(host);
  window.addEventListener('resize', resize);

  /**
   * Ganti tata letak. Kertasnya berganti ukuran, bukan isinya: goresan
   * berkoordinat piksel, jadi tidak ada yang meregang (lihat kepala berkas).
   */
  function setLayout(id) {
    if (!LAYOUTS.some((L) => L.id === id)) return;
    layout = id;
    endPeek();
    savePrefs();
    resize();
    // Panggung baru mengendap setelah isinya mengalir ulang.
    requestAnimationFrame(resize);
  }

  function setRatio(value, persist) {
    ratio = Math.min(RATIO_MAX, Math.max(RATIO_MIN, value));
    resize();
    if (persist) savePrefs();
  }

  /* ---------------- Pembatas: seret ATAU ketuk ---------------- */
  let gripDrag = null;

  grip.addEventListener('pointerdown', (e) => {
    if (e.button != null && e.button > 0) return;
    e.preventDefault();
    // Penangkapan pointer supaya seretan tidak putus saat jari keluar dari
    // pembatas yang sempit. Ia MELEMPAR bila pointer-nya sudah tidak aktif
    // (mis. sentuhan yang dibatalkan sistem) — dan seretan tetap harus jalan.
    try { grip.setPointerCapture?.(e.pointerId); } catch (err) { /* lanjut tanpa tangkapan */ }
    gripDrag = { startX: e.clientX, moved: false };
    root.dataset.resizing = 'true';
  });

  grip.addEventListener('pointermove', (e) => {
    if (!gripDrag) return;
    if (Math.abs(e.clientX - gripDrag.startX) > 4) gripDrag.moved = true;
    if (!gripDrag.moved) return;
    // Tepi KANAN kertas diam; lebarnya = jarak jari ke tepi itu.
    const right = root.getBoundingClientRect().right;
    const room = stageRoom();
    if (room) setRatio((right - e.clientX) / room, false);
  });

  const endGrip = () => {
    if (!gripDrag) return;
    const tapped = !gripDrag.moved;
    gripDrag = null;
    delete root.dataset.resizing;
    if (tapped) {
      // Ketukan: maju ke lebar siap pakai berikutnya (berputar).
      const next = RATIO_PRESETS.find((p) => p > ratio + 0.01) ?? RATIO_PRESETS[0];
      setRatio(next, true);
    } else {
      savePrefs();
    }
  };
  grip.addEventListener('pointerup', endGrip);
  grip.addEventListener('pointercancel', endGrip);

  grip.addEventListener('keydown', (e) => {
    // Panah KIRI memperlebar kertas (pembatasnya bergeser ke kiri).
    if (e.key === 'ArrowLeft') { e.preventDefault(); setRatio(ratio + 0.04, true); }
    if (e.key === 'ArrowRight') { e.preventDefault(); setRatio(ratio - 0.04, true); }
  });
  // Ketukan sudah ditangani `pointerup`; `click` hanya datang dari papan
  // ketik (Enter/Space), dan detail-nya 0 di jalur itu.
  grip.addEventListener('click', (e) => {
    if (e.detail !== 0) return;
    const next = RATIO_PRESETS.find((p) => p > ratio + 0.01) ?? RATIO_PRESETS[0];
    setRatio(next, true);
  });

  /* ============================================================
     Riwayat tindakan
     ============================================================ */
  function pushOp(op) {
    history.push(op);
    // Tindakan baru membatalkan jalur "maju" yang lama.
    redo = [];
    capCommitted();
  }

  /** Begitu tumpukan melebihi batas, tindakan tertua dibekukan jadi permanen. */
  function capCommitted() {
    if (history.length - committed > HISTORY_LIMIT) {
      committed = history.length - HISTORY_LIMIT;
    }
  }

  /** Jalankan sebuah tindakan (dipakai "Ulangi"). */
  function applyOp(op) {
    if (op.type === 'draw') { strokes.push(op.stroke); return; }
    op.removed.forEach(({ stroke }) => {
      const i = strokes.lastIndexOf(stroke);
      if (i >= 0) strokes.splice(i, 1);
    });
  }

  /** Kebalikan sebuah tindakan (dipakai "Urungkan"). */
  function revertOp(op) {
    if (op.type === 'draw') {
      const i = strokes.lastIndexOf(op.stroke);
      if (i >= 0) strokes.splice(i, 1);
      return;
    }
    // Dikembalikan dengan urutan TERBALIK dari urutan pembuangan: itulah
    // kebalikan persis dari serangkaian `splice`, jadi posisi tumpuk tiap
    // goresan pulih tepat seperti semula.
    for (let i = op.removed.length - 1; i >= 0; i--) {
      const { index, stroke } = op.removed[i];
      strokes.splice(index, 0, stroke);
    }
  }

  function undo() {
    if (history.length <= committed) return;   // sudah menyentuh batas 20
    const op = history.pop();
    revertOp(op);
    redo.push(op);
    // Jalur "maju" ikut dibatasi supaya tidak tumbuh tanpa akhir.
    if (redo.length > HISTORY_LIMIT) redo.shift();
    redrawAll();
    syncActions();
  }

  function redoStroke() {
    if (!redo.length) return;
    const op = redo.pop();
    applyOp(op);
    history.push(op);
    capCommitted();
    redrawAll();
    syncActions();
  }

  function clearAll() {
    if (!strokes.length) return;
    strokes = [];
    history = [];
    redo = [];
    committed = 0;
    redrawAll();
    syncActions();
  }

  /**
   * Undo hanya boleh menjangkau 20 tindakan terakhir.
   *
   * Goresan yang lebih tua TIDAK dibuang dari gambar — ia hanya berhenti bisa
   * diurungkan. Membuangnya berarti coretan siswa lenyap sendiri di tengah
   * pengerjaan, dan itu jauh lebih buruk daripada sekadar batas undo.
   * "Hapus semua" tetap membersihkan semuanya, karena di situ siswa memang
   * memintanya.
   */
  function syncActions() {
    setDisabled(undoBtn, history.length <= committed);
    setDisabled(redoBtn, redo.length === 0);
    setDisabled(clearBtn, strokes.length === 0);
  }

  /* ============================================================
     Buka / tutup
     ============================================================ */
  function openPad() {
    if (open) return;
    open = true;
    root.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    fab.setAttribute('aria-label', 'Tutup papan coret');
    host.dataset.padOpen = 'true';
    // Diukur SEKARANG (kotaknya sudah tampil, `getBoundingClientRect` memaksa
    // layout) dan sekali lagi di frame berikutnya, untuk berjaga kalau tata
    // letak panggung baru mengendap setelah isinya mengalir ulang.
    resize();
    requestAnimationFrame(resize);
  }

  function close() {
    if (!open) return;
    open = false;
    endPeek();
    abortLive();
    closeTrays();
    root.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-label', 'Buka papan coret');
    delete host.dataset.padOpen;
    delete host.dataset.padLayout;
    fab.focus();
  }

  fab.addEventListener('click', () => (open ? close() : openPad()));

  // Escape menutup baki lebih dulu, baru papannya — jalan keluar yang sama
  // dengan modal, selangkah demi selangkah.
  //
  // ⚠️ Sejak papan BERDAMPINGAN, soal tetap hidup di sebelahnya: siswa bisa
  // membuka Mathpad (atau modal "Kumpulkan Ujian") sementara papan terbuka.
  // Escape di saat itu milik lapisan yang PALING ATAS. Tanpa penjagaan ini,
  // satu tekanan Escape membatalkan isian Mathpad SEKALIGUS menutup papan —
  // dan karena pendengar Mathpad baru dipasang saat pad angka dibuka,
  // pendengar papan inilah yang menyala lebih dulu.
  const onKey = (e) => {
    if (e.key !== 'Escape' || !open || e.defaultPrevented) return;
    if (document.querySelector('.mathpad[data-open="true"], .modal-scrim[data-open="true"]')) return;
    e.preventDefault();
    if (anyTrayOpen()) closeTrays(); else close();
  };
  document.addEventListener('keydown', onKey);

  /* ---------------- Pengaturan alat ---------------- */
  function setTool(id) {
    tool = id;
    Object.entries(toolBtns).forEach(([k, b]) => press(b, k === id));
    root.dataset.tool = id;
  }

  function setColor(value) {
    color = value;
    Object.entries(colorBtns).forEach(([k, b]) => press(b, k === value));
    colorFold.trigger.style.setProperty('--swatch', value);
  }

  function setWidth(value) {
    width = value;
    Object.entries(widthBtns).forEach(([k, b]) => press(b, Number(k) === value));
    widthFold.trigger.style.setProperty('--line', `${value}px`);
  }

  /* ---------------- Preferensi per perangkat ---------------- */
  function savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ layout, ratio }));
    } catch (e) { /* mode privat / penyimpanan diblokir: tetap jalan tanpa ingatan */ }
  }

  setTool('pen');
  setColor(COLORS[0].value);
  setWidth(WIDTHS[1].value);
  syncLayout();
  syncActions();

  /* ---------------- Pembongkaran ---------------- */
  return {
    open: openPad,
    close,
    setLayout,
    /** Dipakai pengujian & pemeriksaan internal. */
    get state() {
      return { open, peeking, tool, color, width,
        strokes: strokes.length, history: history.length,
        redo: redo.length, committed,
        layout, effectiveLayout: effectiveLayout(), ratio };
    },
    destroy() {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerup', endPeek);
      window.removeEventListener('pointercancel', endPeek);
      window.removeEventListener('blur', endPeek);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onOutside, true);
      // Isolasi rute: pindah sub-topik = papan bersih, memori dilepas.
      strokes = [];
      history = [];
      redo = [];
      live = null;
      erasing = null;
      delete host.dataset.padOpen;
      delete host.dataset.padLayout;
      host.style.removeProperty('--pad-w');
      fab.remove();
      root.remove();
    },
  };
}

/* ------------------------------------------------------------
   Preferensi — dibaca sekali per papan
   ------------------------------------------------------------ */
function readPrefs() {
  const fallback = { layout: 'split', ratio: RATIO_DEFAULT };
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return fallback;
    const layout = LAYOUTS.some((L) => L.id === raw.layout) ? raw.layout : fallback.layout;
    const ratio = Number.isFinite(raw.ratio)
      ? Math.min(RATIO_MAX, Math.max(RATIO_MIN, raw.ratio))
      : fallback.ratio;
    return { layout, ratio };
  } catch (e) {
    return fallback;
  }
}

/* ------------------------------------------------------------
   Geometri penghapus — murni, tanpa DOM
   ------------------------------------------------------------ */

/** Jarak titik ke sebuah ruas garis. */
function distPointSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = dx * dx + dy * dy;
  // Ruas sepanjang nol (ketukan diam) tetap sah: jaraknya ke titik itu sendiri.
  let t = len ? ((px - x1) * dx + (py - y1) * dy) / len : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/**
 * Jarak terdekat antara dua ruas garis.
 *
 * Kalau keduanya BERSILANGAN, jaraknya nol — dan itu harus diperiksa
 * tersendiri. Mengandalkan jarak keempat ujung saja akan salah besar pada
 * dua garis panjang yang menyilang seperti huruf X: keempat ujungnya bisa
 * berjauhan padahal garisnya jelas-jelas bersentuhan.
 */
function segSegDist(x1, y1, x2, y2, x3, y3, x4, y4) {
  if (segIntersect(x1, y1, x2, y2, x3, y3, x4, y4)) return 0;
  return Math.min(
    distPointSeg(x1, y1, x3, y3, x4, y4),
    distPointSeg(x2, y2, x3, y3, x4, y4),
    distPointSeg(x3, y3, x1, y1, x2, y2),
    distPointSeg(x4, y4, x1, y1, x2, y2),
  );
}

function segIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
  if (!d) return false;      // sejajar: jarak ujung-ke-ruas sudah menjawabnya
  const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
  const u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

/* ------------------------------------------------------------
   Perkakas kecil
   ------------------------------------------------------------ */
function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function iconButton(name, label) {
  const b = el('button', 'pad__btn');
  b.type = 'button';
  b.innerHTML = icon(name, { size: 17 });
  b.setAttribute('aria-label', label);
  b.title = label;
  return b;
}

function press(btn, on) {
  btn.setAttribute('aria-pressed', String(on));
  btn.classList.toggle('is-on', on);
}

function setDisabled(btn, off) {
  btn.disabled = off;
  btn.setAttribute('aria-disabled', String(off));
}

export default createScratchpad;
