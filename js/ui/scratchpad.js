/**
 * ui/scratchpad.js — Papan Coret (Fase 15, dipoles di Fase 15.5)
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
 * kali lebih ringan, dan TIGA keuntungan mengikuti:
 *
 *   1. `ResizeObserver` bisa MENGGAMBAR ULANG dengan tajam pada ukuran baru.
 *      Cuplikan bitmap hanya bisa diregangkan, dan hasilnya buram.
 *   2. Undo/redo cuma memindahkan elemen antar-array — tidak ada dekode PNG.
 *   3. **Penghapus bisa bekerja per-GORESAN** (Fase 15.5): karena tiap goresan
 *      masih berupa daftar titik, jarak pointer ke ruas-ruasnya bisa dihitung,
 *      dan satu sapuan cukup untuk membuang satu simbol matematika utuh.
 *      Penghapus piksel tidak akan pernah bisa melakukan itu — bagi bitmap,
 *      "angka 7" hanyalah kumpulan piksel tanpa identitas.
 *
 * Titiknya disimpan dalam koordinat TERNORMALISASI (0..1 terhadap kotak
 * kanvas), sehingga memutar perangkat tidak menggeser gambarnya.
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

/**
 * Pasang papan coret pada sebuah kolom panggung.
 *
 * @param {HTMLElement} host  biasanya `.ws-stage`
 * @returns {{ destroy: Function, open: Function, close: Function }}
 */
export function createScratchpad(host) {
  if (!host) return { destroy() {}, open() {}, close() {} };

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
     coretan meredup jadi tembus pandang supaya soal di bawahnya
     terbaca; begitu dilepas, coretannya kembali utuh.

     Sejak kanvasnya PADAT (Fase 15.5), mekanik ini bukan lagi
     kemewahan — ia satu-satunya cara siswa melihat soalnya tanpa
     menutup papan dan kehilangan coretannya dari pandangan.

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
  const pos = (event) => {
    const r = canvas.getBoundingClientRect();
    // Ternormalisasi: gambar ikut menyesuaikan kalau panggungnya berubah ukuran.
    return {
      x: (event.clientX - r.left) / (r.width || 1),
      y: (event.clientY - r.top) / (r.height || 1),
    };
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

  /**
   * Buang setiap goresan yang tersentuh ruas pointer `a → b`.
   * Keduanya dalam koordinat ternormalisasi.
   */
  function eraseAlong(a, b) {
    if (!strokes.length || !cssW || !cssH) return;

    const ax = a.x * cssW, ay = a.y * cssH;
    const bx = b.x * cssW, by = b.y * cssH;
    let hit = false;

    // Dari yang TERATAS ke bawah: goresan yang terakhir digambar adalah yang
    // paling terlihat, jadi ia yang paling masuk akal dibuang lebih dulu.
    // Menyusur mundur juga membuat `splice` tidak merusak indeks yang belum
    // diperiksa.
    for (let i = strokes.length - 1; i >= 0; i--) {
      const s = strokes[i];
      // Goresan tebal menutup area lebih luas, jadi jangkauannya ikut melebar.
      if (!strokeTouched(s, ax, ay, bx, by, ERASER_REACH + s.width / 2)) continue;
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
      return distPointSeg(pts[0].x * cssW, pts[0].y * cssH, ax, ay, bx, by) <= reach;
    }

    for (let i = 1; i < pts.length; i++) {
      const x1 = pts[i - 1].x * cssW, y1 = pts[i - 1].y * cssH;
      const x2 = pts[i].x * cssW, y2 = pts[i].y * cssH;
      if (segSegDist(x1, y1, x2, y2, ax, ay, bx, by) <= reach) return true;
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
    ctx.arc(p.x * cssW, p.y * cssH, (ctx.lineWidth / 2) || 1, 0, Math.PI * 2);
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
    ctx.moveTo(pts[s.drawn].x * cssW, pts[s.drawn].y * cssH);
    for (let i = s.drawn + 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x * cssW, pts[i].y * cssH);
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
    ctx.moveTo(pts[0].x * cssW, pts[0].y * cssH);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x * cssW, pts[i].y * cssH);
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
        strokes: strokes.length, history: history.length,
        redo: redo.length, committed };
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
      history = [];
      redo = [];
      live = null;
      erasing = null;
      fab.remove();
      root.remove();
    },
  };
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
