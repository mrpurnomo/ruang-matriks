/**
 * modules/belajar/simulations/simCore.js
 * Perkakas bersama seluruh simulasi: render matriks, chip, drop-zone,
 * pengendali langkah (slider), dan jalur penolakan yang selalu disertai Toast.
 */

import { formatNumber, ordoText } from '../../../engine/matrix.js';
import { renderMixed } from '../../../engine/katexRenderer.js';
import { fillTemplate } from '../../../engine/validator.js';
import { icon } from '../../../ui/icons.js';
import toast from '../../../ui/toast.js';
import { rejectShake } from '../../../interactions/flyToAnimation.js';

export function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

/* ============================================================
   Matriks
   ============================================================ */
export function renderMatrix(matrix, options = {}) {
  const {
    name = null,
    draggable = false,
    showAddress = false,
    showOrdo = false,
    empty = false,
    cellClass = '',
    addressPrefix = 'a',
  } = options;

  const root = el('div', 'matrix');
  if (name) root.appendChild(el('span', 'matrix__name', name));

  const bracket = el('div', 'matrix__bracket');
  const grid = el('div', 'matrix__grid');
  grid.style.gridTemplateColumns = `repeat(${matrix[0].length}, auto)`;

  const cells = new Map();

  matrix.forEach((row, i) => {
    row.forEach((value, j) => {
      const cell = el('div', `cell ${draggable ? 'cell--draggable' : ''} ${cellClass}`.trim());
      cell.textContent = empty ? '' : formatNumber(value);
      cell.dataset.row = String(i);
      cell.dataset.col = String(j);
      cell.dataset.value = empty ? '' : String(value);

      if (showAddress) {
        cell.appendChild(el('span', 'cell__addr', `${addressPrefix}${i + 1}${j + 1}`));
      }

      grid.appendChild(cell);
      cells.set(`${i},${j}`, cell);
    });
  });

  bracket.appendChild(grid);
  if (showOrdo) bracket.appendChild(el('span', 'matrix__ordo', ordoText(matrix)));
  root.appendChild(bracket);

  return { root, cells, grid, bracket };
}

export function rowCells(cells, rowIndex, colCount) {
  return Array.from({ length: colCount }, (_, j) => cells.get(`${rowIndex},${j}`));
}

export function colCells(cells, colIndex, rowCount) {
  return Array.from({ length: rowCount }, (_, i) => cells.get(`${i},${colIndex}`));
}

export function clearHighlights(cells) {
  cells.forEach((cell) => {
    cell.classList.remove(
      'cell--row-hl', 'cell--col-hl', 'cell--cross', 'cell--pulse',
      'cell--diag-main', 'cell--diag-anti', 'cell--target'
    );
  });
}

/* ============================================================
   Elemen panggung
   ============================================================ */
export function createStage() {
  return el('div', 'stage');
}

export function stageRow(...children) {
  const row = el('div', 'stage__row');
  children.filter(Boolean).forEach((c) => row.appendChild(c));
  return row;
}

/** Baris persamaan horizontal: A [op] B = C */
export function equationRow(...children) {
  const row = el('div', 'stage__row stage__row--equation');
  children.filter(Boolean).forEach((c) => row.appendChild(c));
  return row;
}

export function operatorGlyph(symbol) {
  return el('div', 'op-glyph', symbol);
}

export function createPrompt(text, step) {
  const node = el('div', 'sim__prompt');
  if (step) node.appendChild(el('span', 'sim__prompt-step', step));
  const body = el('span', null, renderMixed(text));
  node.appendChild(body);

  node.update = (newText, newStep) => {
    body.innerHTML = renderMixed(newText);
    const chip = node.querySelector('.sim__prompt-step');
    if (chip && newStep) chip.textContent = newStep;
  };

  return node;
}

export function createBrief(text) {
  const node = el('div', 'sim__brief');
  node.innerHTML = `${icon('lightbulb', { size: 18 })}<span>${renderMixed(text)}</span>`;
  return node;
}

export function createMeetPoint({ operator, hint } = {}) {
  const node = el('div', 'meetpoint');
  if (hint) node.appendChild(el('div', 'meetpoint__hint', renderMixed(hint)));
  if (operator) node.appendChild(el('div', 'meetpoint__op', operator));
  return node;
}

export function createScalarChip(value, label) {
  const chip = el('div', 'scalar-chip', label != null ? label : formatNumber(value));
  chip.dataset.value = String(value);
  chip.setAttribute('role', 'button');
  chip.tabIndex = 0;
  chip.setAttribute('aria-label', `Chip skalar ${label != null ? label : value}`);
  return chip;
}

export function createScalarResult(label, value) {
  const node = el('div', 'scalar-result');
  node.appendChild(el('div', 'scalar-result__label', renderMixed(label)));
  node.appendChild(el('div', 'scalar-result__value', value != null ? formatNumber(value) : '?'));
  node.setValue = (v) => {
    node.querySelector('.scalar-result__value').textContent = formatNumber(v);
    node.classList.add('anim-land');
  };
  return node;
}

export function createFlowArrow(direction = 'arrow-down') {
  return el('div', 'flow-arrow', icon(direction, { size: 26 }));
}

/** Legenda warna — menggantikan istilah abstrak seperti "disorot". */
export function createColorLegend(items) {
  const legend = el('div', 'color-legend');
  items.forEach(({ tone, label }) => {
    const item = el('span', `color-legend__item color-legend__item--${tone}`);
    item.appendChild(el('span', 'color-legend__swatch'));
    item.appendChild(el('span', null, renderMixed(label)));
    legend.appendChild(item);
  });
  return legend;
}

/* ============================================================
   Ketuk-ketuk & garis coret
   ============================================================ */

/**
 * Jadikan sebuah sel bisa "diketuk" — dengan tetikus, sentuhan, maupun papan
 * ketik. Dipakai menggantikan seret pada interaksi yang presisinya tinggi
 * (diagonal determinan, tukar posisi, balik tanda), karena menyeret elemen
 * kecil di ponsel jauh lebih sering meleset daripada mengetuknya.
 */
export function makeTappable(cell, handler, label) {
  if (!cell) return () => {};

  cell.classList.add('cell--tappable');
  cell.setAttribute('role', 'button');
  cell.tabIndex = 0;
  if (label) cell.setAttribute('aria-label', label);

  const onClick = (event) => {
    event.preventDefault();
    handler(cell);
  };

  const onKey = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handler(cell);
  };

  cell.addEventListener('click', onClick);
  cell.addEventListener('keydown', onKey);

  return () => {
    cell.removeEventListener('click', onClick);
    cell.removeEventListener('keydown', onKey);
    cell.classList.remove('cell--tappable');
    cell.removeAttribute('role');
    cell.removeAttribute('tabindex');
  };
}

/** Matikan interaksi sebuah sel sementara (mis. selama satu urutan berjalan). */
export function setCellsMuted(cells, muted) {
  cells.forEach((cell) => {
    if (!cell) return;
    cell.classList.toggle('cell--muted', Boolean(muted));
    if (muted) cell.dataset.dragDisabled = 'true';
    else delete cell.dataset.dragDisabled;
  });
}

/**
 * Lapisan SVG untuk garis coret PERMANEN di atas sebuah grid matriks.
 *
 * Garisnya digambar setelah siswa memilih elemen yang benar, bukan sebelumnya:
 * ia adalah KONFIRMASI bahwa pilihannya tepat, sekaligus jejak visual agar
 * seluruh diagonal yang sudah dikerjakan terlihat sekaligus di akhir.
 */
export function createStrikeLayer(grid) {
  const layer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  layer.setAttribute('class', 'strike-layer');
  grid.style.position = 'relative';
  grid.appendChild(layer);

  return {
    layer,

    draw(cells, tone = 'blue') {
      if (!cells || !cells.length) return;

      // Koordinat dihitung relatif terhadap grid, bukan terhadap layar, agar
      // garisnya tetap menempel pada selnya saat tata letak berubah.
      const base = grid.getBoundingClientRect();
      const points = cells.map((c) => {
        const r = c.getBoundingClientRect();
        return `${r.left - base.left + r.width / 2},${r.top - base.top + r.height / 2}`;
      });

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      line.setAttribute('class', `strike-line strike-line--${tone}`);
      line.setAttribute('points', points.join(' '));
      layer.appendChild(line);

      // Garisnya "tertulis" dari ujung ke ujung, bukan muncul begitu saja.
      const len = line.getTotalLength ? line.getTotalLength() : 0;
      if (len) {
        line.style.strokeDasharray = String(len);
        line.style.strokeDashoffset = String(len);
        line.style.transition = 'stroke-dashoffset 420ms cubic-bezier(.22,.8,.36,1)';
        requestAnimationFrame(() => { line.style.strokeDashoffset = '0'; });
      }

      return line;
    },

    clear() { layer.innerHTML = ''; },
    destroy() { layer.remove(); },
  };
}

/* ============================================================
   Umpan balik
   ============================================================ */
export function rejectWith(element, message, values = {}) {
  rejectShake(element);
  toast.error(fillTemplate(message, values));
}

/**
 * Tandai sebuah opsi sebagai SALAH dan matikan ia untuk seterusnya,
 * sehingga siswa terdorong mencoba pilihan yang tersisa (bukan menebak
 * opsi yang sama berulang kali).
 */
export function lockWrongOption(element) {
  if (!element) return;
  element.classList.add('is-failed');
  element.dataset.dragDisabled = 'true';
  element.setAttribute('aria-disabled', 'true');
  if ('disabled' in element) element.disabled = true;
  element.style.pointerEvents = 'none';
}

export function succeedWith(message, values = {}) {
  if (!message) return;
  toast.success(fillTemplate(message, values));
}

/* ============================================================
   Slider langkah
   ============================================================ */
export function createStepSlider({ count, labels = [], onJump = null, allowJump = false }) {
  const nav = el('div', 'slider__nav');

  const prev = el('button', 'btn btn--ghost btn--icon btn--sm');
  prev.type = 'button';
  prev.setAttribute('aria-label', 'Langkah sebelumnya');
  prev.innerHTML = icon('arrow-left', { size: 16 });

  const next = el('button', 'btn btn--ghost btn--icon btn--sm');
  next.type = 'button';
  next.setAttribute('aria-label', 'Langkah berikutnya');
  next.innerHTML = icon('arrow-right', { size: 16 });

  const dots = el('div', 'slider-dots');
  dots.setAttribute('role', 'tablist');
  dots.setAttribute('aria-label', 'Langkah simulasi');

  const counter = el('div', 'slider__counter', `1 / ${count}`);
  const dotNodes = [];

  for (let i = 0; i < count; i++) {
    const dot = el('button', 'slider-dot');
    dot.type = 'button';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', labels[i] || `Langkah ${i + 1}`);
    dot.title = labels[i] || `Langkah ${i + 1}`;
    dot.setAttribute('aria-current', String(i === 0));
    if (!allowJump) dot.disabled = true;
    dot.addEventListener('click', () => { if (allowJump && onJump) onJump(i); });
    dots.appendChild(dot);
    dotNodes.push(dot);
  }

  nav.append(prev, dots, counter, next);

  let current = 0;

  nav.setIndex = (index) => {
    current = Math.max(0, Math.min(count - 1, index));
    dotNodes.forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
    counter.textContent = `${current + 1} / ${count}`;
    prev.disabled = !allowJump || current === 0;
    next.disabled = !allowJump || current >= count - 1;
  };

  nav.markDone = (index) => {
    if (dotNodes[index]) dotNodes[index].dataset.done = 'true';
  };

  nav.enableJump = () => {
    dotNodes.forEach((d) => { d.disabled = false; });
    allowJump = true;
    nav.setIndex(current);
  };

  prev.addEventListener('click', () => { if (onJump) onJump(current - 1); });
  next.addEventListener('click', () => { if (onJump) onJump(current + 1); });

  nav.setIndex(0);
  nav.dots = dotNodes;
  return nav;
}

/* ============================================================
   Checklist
   ============================================================ */
export function createChecklist(items) {
  const list = el('div', 'checklist');
  const nodes = [];

  items.forEach((label, index) => {
    const item = el('div', 'checklist__item');
    item.dataset.state = index === 0 ? 'active' : 'locked';
    item.appendChild(el('span', 'checklist__mark', icon(index === 0 ? 'chevron-right' : 'lock', { size: 13 })));
    item.appendChild(el('span', null, renderMixed(label)));
    list.appendChild(item);
    nodes.push(item);
  });

  list.setState = (index, state) => {
    const node = nodes[index];
    if (!node) return;
    node.dataset.state = state;
    node.querySelector('.checklist__mark').innerHTML =
      icon(state === 'done' ? 'check' : state === 'active' ? 'chevron-right' : 'lock', { size: 13 });
  };

  list.advance = (index) => {
    list.setState(index, 'done');
    if (nodes[index + 1]) list.setState(index + 1, 'active');
  };

  list.nodes = nodes;
  return list;
}

/* ============================================================
   Kelas dasar simulasi
   ============================================================ */
export class Simulation {
  constructor(container, config, toasts, onComplete) {
    this.container = container;
    this.config = config || {};
    this.toasts = toasts || {};
    this.onComplete = onComplete || (() => {});
    this.cleanups = [];
    this.finished = false;
    this.busy = false;    // true selama animasi berjalan → kunci semua klik

    /**
     * Ke mana petunjuk (brief, legenda, prompt, checklist) harus ditempatkan.
     * Sejak Fase 10, mode Belajar mengisinya dengan panel kiri sehingga
     * panggung di kanan benar-benar hanya berisi matriks. Bila null, petunjuk
     * kembali menempel di atas panggung seperti sebelumnya.
     */
    this.hintHost = null;

    /**
     * Ingatan per-slide. Sebuah slide yang sudah diselesaikan HARUS tetap
     * terlihat selesai saat siswa menavigasi bolak-balik — bukan direset dan
     * dijalankan ulang. Kunci = indeks slide, nilai = ringkasan hasilnya.
     */
    this.solvedSlides = new Map();
  }

  markSlideSolved(index, payload = true) {
    this.solvedSlides.set(index, payload);
    this.markStepDone(index);
  }

  isSlideSolved(index) {
    return this.solvedSlides.has(index);
  }

  getSlideState(index) {
    return this.solvedSlides.get(index);
  }

  /** Panel ringkas "slide ini sudah selesai" untuk tampilan kunjungan ulang. */
  solvedBanner(text) {
    const box = el('div', 'slide-solved');
    box.innerHTML = `${icon('check-circle', { size: 20 })}<span>${renderMixed(text)}</span>`;
    return box;
  }

  msg(key, values = {}) {
    return fillTemplate(this.toasts[key] || '', values);
  }

  reject(element, key, values = {}) {
    const message = this.msg(key, values);
    rejectWith(element, message || 'Belum tepat — coba periksa kembali langkahmu.', values);
  }

  /** Tolak DAN matikan opsi yang salah, agar siswa mencoba sisanya. */
  rejectAndLock(element, key, values = {}) {
    this.reject(element, key, values);
    lockWrongOption(element);
  }

  /**
   * Kunci seluruh panggung selama animasi berjalan, supaya siswa tidak
   * bisa memicu aksi kedua yang menumpuk di atas animasi pertama.
   */
  setBusy(state) {
    this.busy = state;
    if (this.root) this.root.classList.toggle('sim--busy', state);
  }

  complete(message) {
    if (this.finished) return;
    this.finished = true;

    if (this.root) {
      this.root.classList.add('sim--done');
      this.root.classList.remove('sim--busy');

      // Banner sukses dipasang sebagai OVERLAY di dalam panggung, bukan
      // disisipkan ke aliran dokumen. Menyisipkan node baru akan mendorong
      // seluruh layout ke bawah dan membuat layar "melompat" tepat pada
      // momen siswa sedang memperhatikan hasilnya.
      const stage = this.root.querySelector('.stage');
      if (stage) {
        const banner = el('div', 'sim__done-overlay anim-rise');
        banner.innerHTML =
          `${icon('check-circle', { size: 18 })}<span>Simulasi selesai — lanjut ke Mini Kuis.</span>`;
        stage.appendChild(banner);
      }
    }

    if (this.slider) this.slider.enableJump();

    const text = message || this.msg('success');
    if (text) toast.success(text);
    this.onComplete();
  }

  useSteps(labels, { allowJump = false, onJump = null } = {}) {
    // Disimpan agar pemulihan sesi bisa memanggil jalur lompat MILIK engine
    // sendiri, bukan menebak-nebak cara tiap engine menggambar slide-nya.
    this.stepJump = typeof onJump === 'function' ? onJump : null;
    this.stepCount = labels.length;

    this.slider = createStepSlider({
      count: labels.length,
      labels,
      allowJump,
      onJump: (index) => {
        if (index < 0 || index >= labels.length) return;
        if (typeof onJump === 'function') onJump(index);
      },
    });
    // Navigasi langkah adalah KENDALI, jadi ia ikut ke panel samping.
    this.addHint(this.slider);
    return this.slider;
  }

  setStep(index) {
    if (this.slider) this.slider.setIndex(index);
    // Setiap perpindahan slide dilaporkan supaya posisinya bisa dipulihkan
    // kalau siswa keluar sejenak ke menu lalu masuk lagi.
    if (typeof this.onSlideChange === 'function') this.onSlideChange(index);
  }

  /**
   * Kembalikan simulasi ke slide tempat siswa terakhir berada.
   * `maxReached` sengaja dinaikkan lebih dulu: hampir semua engine menolak
   * lompatan melewatinya, padahal slide itu memang PERNAH dicapai siswa di
   * sesi sebelumnya.
   */
  resumeToStep(index) {
    if (!index || index <= 0 || !this.stepJump) return false;
    if (this.stepCount && index >= this.stepCount) return false;

    this.maxReached = Math.max(this.maxReached || 0, index);
    try {
      this.stepJump(index);
      return true;
    } catch (err) {
      console.warn('[sim] gagal memulihkan slide:', err);
      return false;
    }
  }
  markStepDone(index) { if (this.slider) this.slider.markDone(index); }

  track(cleanupFn) {
    if (typeof cleanupFn === 'function') this.cleanups.push(cleanupFn);
  }

  destroy() {
    this.cleanups.forEach((fn) => {
      try { fn(); } catch (err) { console.warn('[sim] cleanup gagal:', err); }
    });
    this.cleanups = [];
  }

  /**
   * Sisipkan sebuah node petunjuk. Ia mendarat di panel samping bila ada;
   * kalau tidak, di atas panggung seperti perilaku lama.
   */
  addHint(node) {
    if (!node) return node;
    if (this.hintHost) this.hintHost.appendChild(node);
    else if (this.root) this.root.appendChild(node);
    return node;
  }

  /** Kerangka standar: brief → legenda → prompt → panggung. */
  scaffold({ brief, promptText, promptStep, legend }) {
    const root = el('div', 'sim');
    this.container.appendChild(root);
    this.root = root;

    if (brief) this.addHint(createBrief(brief));
    if (legend && legend.length) this.addHint(createColorLegend(legend));

    this.promptEl = this.addHint(createPrompt(promptText || '', promptStep || 'Langkah 1'));

    this.stage = createStage();
    root.appendChild(this.stage);

    return root;
  }

  setPrompt(text, step) {
    if (this.promptEl) this.promptEl.update(text, step);
  }

  /**
   * Wadah pesan berukuran TETAP. Isinya boleh berganti-ganti, tapi
   * tingginya sudah dipesan sejak awal sehingga elemen di bawahnya tidak
   * pernah bergeser saat pesan muncul atau hilang.
   */
  reserveSlot(minHeight = 64) {
    const slot = el('div', 'reserved-slot');
    slot.style.minHeight = `${minHeight}px`;
    slot.setValue = (html) => { slot.innerHTML = html || ''; };
    slot.clear = () => { slot.innerHTML = ''; };
    return slot;
  }

  /**
   * Bersihkan panggung sepenuhnya sebelum menggambar slide berikutnya.
   * Penting agar state antar-slide tidak "bocor" dan tidak ada elemen hantu
   * yang tertinggal dari langkah sebelumnya.
   */
  resetStage() {
    // Buang drop-zone lama supaya tidak menangkap drop dari slide baru.
    this.cleanups.forEach((fn) => {
      try { fn(); } catch (err) { /* diabaikan */ }
    });
    this.cleanups = [];

    if (this.stage) this.stage.innerHTML = '';

    // Buang sisa chip terbang / hantu dari animasi yang sempat berjalan.
    document.querySelectorAll('.fly-chip, .drag-ghost, .diag-trace').forEach((n) => n.remove());
  }
}
