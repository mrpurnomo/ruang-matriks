/**
 * ui/scratchpad.js — Papan Coret (Fase 15)
 *
 * Kanvas coret-coret yang menempel di atas PANGGUNG, untuk siswa yang perlu
 * menghitung determinan/invers 3×3 di samping soalnya. Sebelum ini, satu-satunya
 * cara adalah mengambil kertas — dan begitu mata siswa turun ke kertas, konteks
 * matriksnya hilang.
 *
 * ============================================================
 * KENAPA GORESAN DISIMPAN SEBAGAI VEKTOR, BUKAN toDataURL()
 * ============================================================
 *
 * Cara yang biasa dipakai (dan yang disebut di permintaan sebagai contoh)
 * adalah menyimpan cuplikan bitmap tiap goresan. Di aplikasi INI ia mahal:
 * panggung berukuran ±1000×600 CSS px, dan pada layar 2× kanvasnya menjadi
 * 2000×1200 piksel. Satu cuplikan `getImageData` = 2000 × 1200 × 4 byte
 * ≈ **9,6 MB**. Dua puluh cuplikan ≈ **190 MB** — di tablet kelas itu bukan
 * "mencegah pembengkakan memori", itu penyebabnya.
 *
 * Satu goresan sebagai vektor berisi beberapa puluh titik: **±2 KB**. Seribu
 * kali lebih ringan, dan dua keuntungan lain mengikuti:
 *
 *   1. `ResizeObserver` bisa MENGGAMBAR ULANG dengan tajam pada ukuran baru.
 *      Cuplikan bitmap hanya bisa diregangkan, dan hasilnya buram.
 *   2. Undo/redo cuma memindahkan elemen antar-array — tidak ada dekode PNG.
 *
 * Titiknya disimpan dalam koordinat TERNORMALISASI (0..1 terhadap kotak
 * kanvas), sehingga memutar perangkat tidak menggeser gambarnya.
 */

import { icon } from './icons.js';

/** Undo dibatasi 20 goresan terakhir, sesuai kontrak Fase 15. */
const HISTORY_LIMIT = 20;

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

/**
 * Pasang papan coret pada sebuah kolom panggung.
 *
 * @param {HTMLElement} host  biasanya `.ws-stage`
 * @returns {{ destroy: Function, open: Function, close: Function }}
 */
export function createScratchpad(host) {
  if (!host) return { destroy() {}, open() {}, close() {} };

  /* ---------------- State ---------------- */
  let strokes = [];          // goresan yang tampil
  let redo = [];             // goresan yang baru saja di-undo
  let live = null;           // goresan yang sedang digambar
  /**
   * Banyak goresan paling awal yang sudah TIDAK bisa diurungkan lagi.
   *
   * Ia hanya boleh NAIK, dan dihitung dari puncak tertinggi jumlah goresan —
   * bukan dari jumlah saat ini. Versi pertama menghitungnya ulang sebagai
   * `strokes.length - 20` setiap kali, sehingga batasnya ikut turun setiap
   * kali satu goresan di-undo: hasilnya undo tetap bisa menyapu seluruh
   * papan, dan batas 20 tidak pernah berlaku.
   */
  let committed = 0;
  let tool = 'pen';
  let color = COLORS[0].value;
  let width = WIDTHS[1].value;
  let open = false;
  let peeking = false;
  let cssW = 0;
  let cssH = 0;

  /* ---------------- DOM ---------------- */
  const fab = el('button', 'pad-fab');
  fab.type = 'button';
  fab.innerHTML = icon('pencil', { size: 20 });
  fab.setAttribute('aria-label', 'Buka papan coret');
  fab.title = 'Papan coret — hitung manual di atas panggung';

  const root = el('div', 'pad');
  root.hidden = true;

  const canvas = document.createElement('canvas');
  canvas.className = 'pad__canvas';
  canvas.setAttribute('aria-label', 'Papan coret');
  root.appendChild(canvas);

  const ctx = canvas.getContext('2d');

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

  const group = (label) => {
    const g = el('div', 'pad__group');
    g.setAttribute('role', 'group');
    g.setAttribute('aria-label', label);
    bar.appendChild(g);
    return g;
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
  COLORS.forEach((c) => {
    const b = el('button', 'pad__swatch');
    b.type = 'button';
    b.style.setProperty('--swatch', c.value);
    b.setAttribute('aria-label', `Warna ${c.label}`);
    b.title = c.label;
    b.addEventListener('click', () => setColor(c.value));
    colorBtns[c.value] = b;
    gColor.appendChild(b);
  });

  // --- Ketebalan ---
  const gWidth = group('Ketebalan');
  WIDTHS.forEach((w) => {
    const b = el('button', 'pad__width');
    b.type = 'button';
    b.setAttribute('aria-label', `Ketebalan ${w.label}`);
    b.title = w.label;
    b.innerHTML = `<span style="height:${w.value}px"></span>`;
    b.addEventListener('click', () => setWidth(w.value));
    widthBtns[w.value] = b;
    gWidth.appendChild(b);
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

  // --- Mengintip & tutup ---
  const gPeek = group('Tampilan');
  const peekBtn = iconButton('eye', 'Tahan untuk mengintip soal');
  peekBtn.classList.add('pad__peek');
  const closeBtn = iconButton('minimize', 'Tutup papan coret');
  gPeek.append(peekBtn, closeBtn);

  closeBtn.addEventListener('click', close);

  /* ============================================================
     MENGINTIP (peek)

     Ditahan, bukan diklik. Selama jarinya menekan, seluruh lapisan
     coretan menghilang supaya soal di bawahnya terbaca; begitu
     dilepas, coretannya kembali utuh.

     Pelepasannya didengarkan di `window`, BUKAN di tombolnya:
     saat mengintip, tombol itu sendiri ikut `pointer-events: none`,
     jadi `pointerup` di atasnya tidak akan pernah sampai. Tanpa ini,
     papan bisa tersangkut tembus pandang selamanya.
     ============================================================ */
  const startPeek = (event) => {
    if (!open || peeking) return;
    event.preventDefault();
    peeking = true;
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
  const pos = (event) => {
    const r = canvas.getBoundingClientRect();
    // Ternormalisasi: gambar ikut menyesuaikan kalau panggungnya berubah ukuran.
    return {
      x: (event.clientX - r.left) / (r.width || 1),
      y: (event.clientY - r.top) / (r.height || 1),
    };
  };

  function onDown(event) {
    if (!open || peeking) return;
    if (event.button != null && event.button > 0) return;   // abaikan klik kanan
    event.preventDefault();

    canvas.setPointerCapture?.(event.pointerId);
    live = {
      tool,
      color,
      width,
      points: [pos(event)],
    };
    // Satu ketukan tanpa geser tetap meninggalkan titik — itu yang
    // diharapkan siswa saat memberi tanda kecil.
    drawStroke(live, true);
  }

  function onMove(event) {
    if (!live || peeking) return;
    event.preventDefault();

    /**
     * `getCoalescedEvents()` mengembalikan titik-titik yang digabung peramban
     * dalam satu frame — memakainya membuat garis stylus jauh lebih halus
     * tanpa menambah beban gambar.
     *
     * TETAPI ia bisa mengembalikan array KOSONG (peristiwa sintetis, sebagian
     * peramban, beberapa driver stylus). Kalau hasilnya dipakai mentah-mentah,
     * goresannya tidak pernah bertambah titik dan yang tergambar hanya satu
     * noktah di tempat jari pertama mendarat. Karena itu selalu ada cadangan
     * ke peristiwanya sendiri.
     */
    const merged = event.getCoalescedEvents ? event.getCoalescedEvents() : null;
    const raw = merged && merged.length ? merged : [event];
    raw.forEach((e) => live.points.push(pos(e)));

    // Hanya menyambung ruas terbaru — menggambar ulang seluruh papan pada
    // tiap gerakan akan tersendat begitu goresannya banyak.
    drawStroke(live, true);
  }

  function onUp() {
    if (!live) return;
    strokes.push(live);
    // Goresan baru membatalkan jalur "maju" yang lama.
    redo = [];
    live = null;
    // Begitu tumpukan melebihi batas, goresan tertua dibekukan jadi permanen.
    if (strokes.length - committed > HISTORY_LIMIT) {
      committed = strokes.length - HISTORY_LIMIT;
    }
    syncActions();
  }

  /** Buang goresan yang sedang berjalan tanpa menyimpannya. */
  function abortLive() {
    if (!live) return;
    live = null;
    redrawAll();
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  /* ============================================================
     Render
     ============================================================ */
  function applyStyle(s) {
    ctx.lineCap = 'round';     // tanpa ini, ujung garis kotak dan patah-patah
    ctx.lineJoin = 'round';
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.tool === 'eraser' ? s.width * 3.5 : s.width;
    // Penghapus tidak "mengecat putih" — ia benar-benar melubangi lapisan,
    // supaya panggung di bawahnya kembali terlihat.
    ctx.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : 'source-over';
  }

  /**
   * @param {object} s        goresan
   * @param {boolean} tailOnly hanya gambar ruas terakhir (jalur cepat)
   */
  function drawStroke(s, tailOnly = false) {
    const pts = s.points;
    if (!pts.length) return;
    applyStyle(s);

    if (pts.length === 1) {
      // Titik tunggal: lingkaran kecil, bukan garis sepanjang nol.
      ctx.beginPath();
      ctx.arc(pts[0].x * cssW, pts[0].y * cssH,
        (ctx.lineWidth / 2) || 1, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      const prevOp = ctx.globalCompositeOperation;
      ctx.fill();
      ctx.globalCompositeOperation = prevOp;
      return;
    }

    const from = tailOnly ? Math.max(0, pts.length - 2) : 0;
    ctx.beginPath();
    ctx.moveTo(pts[from].x * cssW, pts[from].y * cssH);
    for (let i = from + 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x * cssW, pts[i].y * cssH);
    }
    ctx.stroke();
  }

  function redrawAll() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    strokes.forEach((s) => drawStroke(s, false));
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ============================================================
     Ukuran & rotasi perangkat

     Kanvas punya DUA ukuran: kotak CSS-nya, dan jumlah piksel
     sebenarnya (dikali `devicePixelRatio` supaya garisnya tidak
     buram di layar retina). Keduanya harus dihitung ulang setiap
     panggung berubah — dan karena goresannya vektor, isinya
     digambar ulang TAJAM, bukan diregangkan.
     ============================================================ */
  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.round(r.width);
    const h = Math.round(r.height);
    if (!w || !h) return;             // masih tersembunyi: tidak ada yang bisa diukur

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

  const observer = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => resize())
    : null;
  if (observer) observer.observe(host);
  window.addEventListener('resize', resize);

  /* ============================================================
     Tindakan
     ============================================================ */
  function undo() {
    if (strokes.length <= committed) return;   // sudah menyentuh batas 20
    redo.push(strokes.pop());
    // Jalur "maju" ikut dibatasi supaya tidak tumbuh tanpa akhir.
    if (redo.length > HISTORY_LIMIT) redo.shift();
    redrawAll();
    syncActions();
  }

  function redoStroke() {
    if (!redo.length) return;
    strokes.push(redo.pop());
    redrawAll();
    syncActions();
  }

  function clearAll() {
    if (!strokes.length) return;
    strokes = [];
    redo = [];
    committed = 0;
    redrawAll();
    syncActions();
  }

  /**
   * Undo hanya boleh menjangkau 20 goresan terakhir.
   *
   * Goresan yang lebih tua TIDAK dibuang dari gambar — ia hanya berhenti bisa
   * diurungkan. Membuangnya berarti coretan siswa lenyap sendiri di tengah
   * pengerjaan, dan itu jauh lebih buruk daripada sekadar batas undo.
   * "Hapus semua" tetap membersihkan semuanya, karena di situ siswa memang
   * memintanya.
   */
  function syncActions() {
    setDisabled(undoBtn, strokes.length <= committed);
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
    host.dataset.padOpen = 'true';
    // Diukur SEKARANG (kotaknya sudah tampil, `getBoundingClientRect` memaksa
    // layout) dan sekali lagi di frame berikutnya, untuk berjaga kalau tata
    // letak panggung baru mengendap setelah transisi.
    resize();
    requestAnimationFrame(resize);
  }

  function close() {
    if (!open) return;
    open = false;
    endPeek();
    abortLive();
    root.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    delete host.dataset.padOpen;
    fab.focus();
  }

  fab.addEventListener('click', () => (open ? close() : openPad()));

  // Escape menutup papan — jalan keluar yang sama dengan modal.
  const onKey = (e) => {
    if (e.key === 'Escape' && open) { e.preventDefault(); close(); }
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
  }

  function setWidth(value) {
    width = value;
    Object.entries(widthBtns).forEach(([k, b]) => press(b, Number(k) === value));
  }

  setTool('pen');
  setColor(COLORS[0].value);
  setWidth(WIDTHS[1].value);
  syncActions();

  /* ---------------- Pembongkaran ---------------- */
  return {
    open: openPad,
    close,
    /** Dipakai pengujian & pemeriksaan internal. */
    get state() {
      return { open, peeking, tool, color, width,
        strokes: strokes.length, redo: redo.length, committed };
    },
    destroy() {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerup', endPeek);
      window.removeEventListener('pointercancel', endPeek);
      window.removeEventListener('blur', endPeek);
      document.removeEventListener('keydown', onKey);
      // Isolasi rute: pindah sub-topik = papan bersih, memori dilepas.
      strokes = [];
      redo = [];
      live = null;
      fab.remove();
      root.remove();
    },
  };
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
