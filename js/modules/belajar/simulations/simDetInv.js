/**
 * simDetInv.js — Simulasi Bab 3 (Determinan & Invers)
 * det2x2 · det3x3_sarrus · singular_check · property_calculator ·
 * inverse2x2 · inverse3x3 · equation_solver
 */

import {
  Simulation, el, renderMatrix, stageRow, equationRow, operatorGlyph,
  createScalarResult, createFlowArrow, createChecklist,
  createScalarChip, clearHighlights, lockWrongOption,
  makeTappable, setCellsMuted, createStrikeLayer,
  rowCells, colCells, createColorLegend, createProgressText,
} from './simCore.js';
import {
  determinant, sarrusTerms, inverse, adjoint, cofactorMatrix, cofactor,
  minorMatrix, transpose, multiply, formatNumber, toLatex, toFractionText,
  scalarMultiply, identity,
} from '../../../engine/matrix.js';
import { MatrixMultiplySim } from './simOperations.js';
import { renderMixed } from '../../../engine/katexRenderer.js';
import { icon } from '../../../ui/icons.js';
import { makeDraggable, registerDropZone } from '../../../interactions/dragDrop.js';
import { flyMergeLand, highlight, makeFlyChip, flyTo, merge, landOn, staggerCells } from '../../../interactions/flyToAnimation.js';
import { swapArc, flipSign, sweepScalar, slideCloneColumns, mergeToIdentity, foldTranspose } from '../../../interactions/mergeAnimation.js';
import { attachMathpad } from '../../../ui/mathpad.js';
import toast from '../../../ui/toast.js';

/* ============================================================
   Perkakas bersama Fase 16

   Ketiga engine invers berakhir dengan bentuk yang SAMA:
   sebuah skalar pecahan berdiri di depan kurung matriks. Bentuk
   itu bukan hiasan — begitulah jawaban invers ditulis di lembar
   TKA, dan mempertahankannya berarti siswa melihat notasi yang
   akan ia tulis sendiri nanti.
   ============================================================ */

/**
 * Slot skalar yang duduk TEPAT DI DEPAN kurung matriks.
 *
 * Ruangnya dipesan sejak awal (`visibility: hidden`, bukan `display:none`)
 * supaya kemunculannya di tahap terakhir tidak menggeser matriks yang sedang
 * dilihat siswa — kontrak §5 butir 14.
 */
function createScalarSlot() {
  const slot = el('div', 'inv-scalar');
  slot.style.visibility = 'hidden';
  slot.innerHTML = renderMixed('$\\frac{1}{\\det}$');

  slot.reveal = () => { slot.style.visibility = 'visible'; };
  slot.fill = (det) => {
    slot.innerHTML = renderMixed(`$\\dfrac{1}{${formatNumber(det)}}$`);
    slot.classList.add('inv-scalar--placed', 'anim-land');
    slot.style.visibility = 'visible';
  };
  return slot;
}

/**
 * Chip pecahan $\frac{1}{\det}$ yang dibawa siswa ke slot di atas.
 *
 * `makeDraggable` sekaligus mendaftarkan jalur KETUK (kontrak §5 butir 12),
 * jadi satu pemanggilan memberi dua cara: seret, atau ketuk chip lalu ketuk
 * slotnya.
 */
function createInverseChip(det) {
  const chip = createScalarChip(1 / det, null);
  chip.classList.add('scalar-chip--fraction');
  chip.innerHTML = renderMixed(`$\\dfrac{1}{${formatNumber(det)}}$`);
  makeDraggable(chip, { data: { scalar: 1 / det } });
  return chip;
}

/**
 * Ikat slot skalar dan matriksnya jadi SATU unit yang tidak boleh terpisah.
 *
 * Baris panggung boleh membungkus (`flex-wrap`) supaya matriks lebar tetap
 * muat di lanskap pendek — tetapi pembungkusan itu tidak boleh memisahkan
 * pecahan dari kurung yang ia kalikan, karena begitu terpisah, notasinya
 * berhenti berarti.
 */
function scalarPair(slot, matrixRoot) {
  const pair = el('div', 'inv-scalar-pair');
  pair.append(slot, matrixRoot);
  return pair;
}

/**
 * Tulis ulang isi sel dari `dataset.value`, lengkap dengan label alamatnya.
 *
 * ⚠️ `swapArc()` dan `flipSign()` menutup animasinya dengan menulis
 * `textContent` — dan `textContent` MENGHAPUS seluruh anak elemen. Label
 * alamat (`a11`, `a22`) yang dipasang `renderMatrix({ showAddress: true })`
 * adalah `<span>` anak, jadi ia ikut lenyap; yang tersisa cuma teks
 * gabungannya, dan sel yang tadinya "3" dengan label "a11" berubah menjadi
 * satu teks berbunyi **"4a22"**.
 *
 * Bug ini tidak terlihat dari membaca kode animasinya (ia benar: ia memang
 * hanya menukar nilai) dan tidak pernah muncul di engine lain, karena
 * hanya invers 2×2 yang memakai alamat sel BERSAMA animasi tukar/balik.
 * Ia baru terlihat setelah simulasinya dirender dan dibaca dengan mata.
 */
function rewriteCell(cell, prefix = 'a') {
  const i = Number(cell.dataset.row);
  const j = Number(cell.dataset.col);
  const marks = [...cell.querySelectorAll('.cell__check')];
  cell.textContent = formatNumber(Number(cell.dataset.value));
  cell.appendChild(el('span', 'cell__addr', `${prefix}${i + 1}${j + 1}`));
  marks.forEach((m) => cell.appendChild(m));
}

/* ============================================================
   1. det2x2 — tarik garis pada tiap diagonal, warna dibedakan tegas
   ============================================================ */
export class Det2x2Sim extends Simulation {
  build() {
    const { matrix, name = 'A' } = this.config;
    this.phase = 0;          // 0 = diagonal utama (ad), 1 = diagonal sekunder (bc)
    this.products = [];
    this.picked = new Set();

    this.scaffold({
      brief: this.config.brief,
      promptText: 'Ketuk **kedua elemen** diagonal utama — yang **berwarna biru**. Urutannya bebas.',
      promptStep: 'Diagonal 1 dari 2',
      legend: [
        { tone: 'blue', label: 'Biru = diagonal utama ($ad$), bertanda **+**' },
        { tone: 'coral', label: 'Oranye = diagonal sekunder ($bc$), bertanda **−**' },
      ],
    });

    const m = renderMatrix(matrix, { name, showAddress: true });
    this.cells = m.cells;
    this.matrixView = m;

    this.paintDiagonals();

    // Ekspresi berjalan: (ad) − (bc) = …
    this.expr = el('div', 'det-expr');
    this.updateExpr();

    this.resultCard = createScalarResult(`$\\det(${name})$`, null);

    this.stage.appendChild(stageRow(m.root));
    this.stage.appendChild(this.expr);
    this.stage.appendChild(createFlowArrow());
    this.stage.appendChild(stageRow(this.resultCard));

    // Garis coret digambar SETELAH kedua elemen benar diketuk — ia konfirmasi,
    // bukan panduan. Menyeret garis di sini dulu terlalu sering meleset,
    // terutama di layar sentuh kecil.
    this.strike = createStrikeLayer(m.grid);
    this.track(() => this.strike.destroy());

    this.cells.forEach((cell, key) => {
      const [i, j] = key.split(',').map(Number);
      this.track(makeTappable(cell, () => this.handleTap(cell, i, j),
        `Elemen baris ${i + 1} kolom ${j + 1}`));
    });
  }

  /** Sel-sel yang membentuk diagonal yang sedang dikerjakan. */
  wantedCells() {
    return this.phase === 0
      ? [this.cells.get('0,0'), this.cells.get('1,1')]
      : [this.cells.get('0,1'), this.cells.get('1,0')];
  }

  paintDiagonals() {
    clearHighlights(this.cells);
    if (this.phase === 0) {
      this.cells.get('0,0').classList.add('cell--diag-main');
      this.cells.get('1,1').classList.add('cell--diag-main');
    } else if (this.phase === 1) {
      this.cells.get('0,1').classList.add('cell--diag-anti');
      this.cells.get('1,0').classList.add('cell--diag-anti');
    }
  }

  updateExpr() {
    const p0 = this.products[0];
    const p1 = this.products[1];
    this.expr.innerHTML = `
      <span class="det-expr__term det-expr__term--blue">${p0 != null ? formatNumber(p0) : 'ad'}</span>
      <span class="det-expr__op">−</span>
      <span class="det-expr__term det-expr__term--coral">${p1 != null ? formatNumber(p1) : 'bc'}</span>
      <span class="det-expr__op">=</span>
      <span class="det-expr__result">${p0 != null && p1 != null ? formatNumber(p0 - p1) : '?'}</span>`;
  }

  handleTap(cell, i, j) {
    if (this.busy || this.phase > 1) return;

    const wanted = this.wantedCells();

    if (!wanted.includes(cell)) {
      const warna = this.phase === 0 ? 'biru' : 'oranye';
      this.reject(cell, 'wrongDiagonal', { warna });
      return;
    }

    const key = `${i},${j}`;
    if (this.picked.has(key)) {
      // Ketukan kedua pada sel yang sama = batalkan pilihan, bukan kesalahan.
      this.picked.delete(key);
      cell.classList.remove('cell--picked');
      return;
    }

    this.picked.add(key);
    cell.classList.add('cell--picked');

    if (this.picked.size === wanted.length) this.resolveDiagonal(wanted);
  }

  async resolveDiagonal(wanted) {
    this.setBusy(true);

    const values = wanted.map((c) => Number(c.dataset.value));
    const product = values[0] * values[1];

    // Garis coret muncul lebih dulu: siswa melihat "inilah pasangan yang tadi
    // kamu tunjuk" sebelum angkanya melebur.
    this.strike.draw(wanted, this.phase === 0 ? 'blue' : 'coral');
    await this.wait(440);

    const chips = wanted.map((c) => makeFlyChip(c, { text: c.dataset.value }));
    const slot = this.expr.querySelector(
      this.phase === 0 ? '.det-expr__term--blue' : '.det-expr__term--coral'
    );

    await Promise.all(chips.map((chip) => flyTo(chip, slot)));
    const merged = await merge(chips, formatNumber(product), { operator: '×' });
    await landOn(merged, slot, { text: formatNumber(product) });

    this.products[this.phase] = product;
    this.updateExpr();

    wanted.forEach((c) => {
      c.classList.remove('cell--picked');
      c.classList.add('cell--struck');
    });

    this.picked.clear();
    this.phase += 1;
    this.setBusy(false);

    if (this.phase === 1) {
      this.paintDiagonals();
      this.setPrompt(
        'Sekarang ketuk **kedua elemen** diagonal sekunder — yang **berwarna oranye**.',
        'Diagonal 2 dari 2'
      );
      return;
    }

    clearHighlights(this.cells);
    const det = this.products[0] - this.products[1];
    this.resultCard.setValue(det);
    this.setPrompt(
      `$\\det = ${formatNumber(this.products[0])} - ${formatNumber(this.products[1])} = ${formatNumber(det)}$`,
      'Selesai'
    );
    this.later(() => this.complete(), 500);
  }
}

/* ============================================================
   2. det3x3_sarrus — salin 2 kolom + garis pemisah, lalu tarik 6 garis
   ============================================================ */
export class Det3x3SarrusSim extends Simulation {
  build() {
    const { matrix, name = 'A' } = this.config;
    this.copied = false;
    this.collected = { down: [], up: [] };

    this.scaffold({
      brief: this.config.brief,
      promptText: 'Tekan **Salin Dua Kolom** dulu — Sarrus butuh kolom 1 dan 2 disalin ke kanan.',
      promptStep: 'Persiapan',
      legend: [
        { tone: 'blue', label: 'Biru = diagonal turun, masuk **jumlah positif**' },
        { tone: 'coral', label: 'Oranye = diagonal naik, masuk **jumlah negatif**' },
      ],
    });

    // Grid 3×5 dengan garis pemisah tegas setelah kolom ke-3.
    this.gridHost = el('div', 'matrix');
    const bracket = el('div', 'matrix__bracket');
    this.grid = el('div', 'matrix__grid matrix__grid--sarrus');
    this.grid.style.gridTemplateColumns = 'repeat(5, auto)';
    bracket.appendChild(this.grid);
    this.gridHost.appendChild(el('span', 'matrix__name', name));
    this.gridHost.appendChild(bracket);

    this.cells = new Map();
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        const sourceCol = j % 3;
        const isGhost = j >= 3;
        const cell = el('div', `cell${isGhost ? ' cell--ghost' : ''}`);
        cell.textContent = isGhost ? '' : formatNumber(matrix[i][sourceCol]);
        cell.dataset.row = String(i);
        cell.dataset.col = String(sourceCol);
        cell.dataset.display = String(j);
        cell.dataset.value = String(matrix[i][sourceCol]);
        if (isGhost) cell.style.visibility = 'hidden';
        if (j === 3) cell.classList.add('cell--after-divider');
        this.grid.appendChild(cell);
        this.cells.set(`${i},${j}`, cell);
      }
    }

    const copyBtn = el('button', 'btn btn--primary btn--pulse');
    copyBtn.type = 'button';
    copyBtn.innerHTML = `${icon('layers', { size: 17 })}<span>Salin Dua Kolom</span>`;
    copyBtn.addEventListener('click', () => this.doCopy(copyBtn));
    this.copyBtn = copyBtn;

    this.expr = el('div', 'det-expr det-expr--sarrus');
    this.updateExpr();

    this.resultCard = createScalarResult(`$\\det(${name})$`, null);

    this.stage.appendChild(stageRow(this.gridHost));
    this.stage.appendChild(stageRow(copyBtn));
    this.stage.appendChild(this.expr);
    this.stage.appendChild(createFlowArrow());
    this.stage.appendChild(stageRow(this.resultCard));
  }

  /**
   * Ekspresi Sarrus SELALU memuat tiga slot per kelompok, terisi atau belum.
   *
   * ⚠️ Fase 20: versi lama hanya menggambar slot yang SUDAH terisi (plus satu
   * "…" saat kosong). Akibatnya diagonal ke-2 dan ke-3 tidak punya kotak
   * tujuan sama sekali: `querySelector` mengembalikan kotak PERTAMA, dan
   * angka hasil kalinya terbang kembali ke slot diagonal ke-1 — tepat saat
   * siswa sedang belajar bahwa tiap diagonal menyumbang suku sendiri.
   * Tiga slot bernomor (`data-slot`) sejak awal juga mengajarkan bentuknya:
   * "(□ + □ + □) − (□ + □ + □)" — enam hasil kali, tiga di tiap kelompok.
   */
  updateExpr() {
    const fmt = (arr, cls) => [0, 1, 2].map((k) => (k < arr.length
      ? `<span class="det-expr__term det-expr__term--${cls}" data-slot="${k}">${formatNumber(arr[k])}</span>`
      : `<span class="det-expr__term det-expr__term--${cls} is-empty" data-slot="${k}">…</span>`))
      .join('<span class="det-expr__op">+</span>');

    const down = this.collected.down;
    const up = this.collected.up;
    const ready = down.length === 3 && up.length === 3;
    const total = ready
      ? down.reduce((a, b) => a + b, 0) - up.reduce((a, b) => a + b, 0)
      : null;

    this.expr.innerHTML = `
      <span class="det-expr__paren">(</span>${fmt(down, 'blue')}<span class="det-expr__paren">)</span>
      <span class="det-expr__op det-expr__op--minus">−</span>
      <span class="det-expr__paren">(</span>${fmt(up, 'coral')}<span class="det-expr__paren">)</span>
      <span class="det-expr__op">=</span>
      <span class="det-expr__result">${total != null ? formatNumber(total) : '?'}</span>`;
  }

  async doCopy(btn) {
    if (this.copied) return;
    this.copied = true;
    btn.disabled = true;
    btn.classList.remove('btn--pulse');

    const ghosts = [];
    const sources = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 3; j < 5; j++) {
        const ghost = this.cells.get(`${i},${j}`);
        const source = this.cells.get(`${i},${j - 3}`);
        ghost.textContent = source.textContent;
        ghost.style.visibility = 'visible';

        /**
         * Begitu salinannya TAMPIL, ia berhenti jadi bayangan dan mulai jadi
         * bagian sah dari perhitungan — diagonal Sarrus melintasinya persis
         * seperti melintasi matriks aslinya.
         *
         * Kelas `cell--ghost` memasang `animation: none`, jadi selama ia masih
         * menempel, kedua kolom salinan TIDAK ikut berdenyut saat diagonalnya
         * disorot (Fase 12, isu 10). Penandanya diganti `cell--copy`: tepinya
         * tetap putus-putus supaya siswa tahu itu salinan, tetapi seluruh
         * logika sorot dan denyutnya sama dengan sel biasa.
         */
        ghost.classList.remove('cell--ghost');
        ghost.classList.add('cell--copy');

        ghosts.push(ghost);
        sources.push(source);
      }
    }

    await slideCloneColumns(sources, ghosts);

    /**
     * `slideCloneColumns` menutup animasinya dengan `opacity: 0.55` INLINE.
     * Gaya inline mengalahkan kelas, jadi selama ia menempel, kolom salinan
     * tetap pucat betapapun pekat denyut yang dipasang CSS — dan sorot
     * diagonalnya nyaris tak terlihat (Fase 12, isu 10). Setelah salinannya
     * mendarat, kendali warna dikembalikan sepenuhnya ke CSS.
     */
    ghosts.forEach((ghost) => { ghost.style.opacity = ''; });

    // Garis pemisah tegas antara matriks asli dan salinannya.
    this.grid.classList.add('has-divider');

    // Lapisan tempat garis coret PERMANEN digambar.
    this.strike = createStrikeLayer(this.grid);
    this.track(() => this.strike.destroy());

    // Ketuk-ketuk menggantikan tarik-garis: menyeret melintasi tiga sel kecil
    // terlalu sering meleset, dan setiap meleset terasa seperti kesalahan
    // matematika padahal murni kesalahan motorik.
    this.picked = new Set();
    this.cells.forEach((cell, key) => {
      const [i, j] = key.split(',').map(Number);
      this.track(makeTappable(cell, () => this.handleTap(cell, key),
        `Elemen baris ${i + 1} kolom ${j + 1}`));
    });

    this.highlightNextDiagonal();
  }

  /** Kunci sel-sel yang membentuk diagonal yang sedang dikerjakan. */
  wantedKeys() {
    const current = this.currentDiagonal();
    if (!current) return [];
    return this.diagonalCoords(current.group, current.index).map(([i, j]) => `${i},${j}`);
  }

  handleTap(cell, key) {
    if (this.busy) return;

    const current = this.currentDiagonal();
    if (!current) return;

    // Sel salinan yang belum tampil tidak boleh diketuk.
    if (cell.style.visibility === 'hidden') return;

    const wanted = this.wantedKeys();
    const warna = current.group === 'down' ? 'biru' : 'oranye';

    if (!wanted.includes(key)) {
      this.reject(cell, 'wrongGroup', { warna });
      return;
    }

    if (this.picked.has(key)) {
      // Ketukan ulang membatalkan pilihan — bukan kesalahan.
      this.picked.delete(key);
      cell.classList.remove('cell--picked');
      this.updateTapPrompt();
      return;
    }

    this.picked.add(key);
    cell.classList.add('cell--picked');

    if (this.picked.size === wanted.length) {
      this.resolveDiagonal(wanted.map((k) => this.cells.get(k)), current);
    } else {
      this.updateTapPrompt();
    }
  }

  updateTapPrompt() {
    const current = this.currentDiagonal();
    if (!current) return;
    const warna = current.group === 'down' ? 'biru' : 'oranye';
    const wanted = this.wantedKeys().length;
    this.setPrompt(
      `Ketuk ketiga elemen yang **berwarna ${warna}** — urutannya bebas.`,
      `${current.group === 'down' ? 'Positif' : 'Negatif'} ${current.index + 1}/3 · ${this.picked.size}/${wanted} diketuk`
    );
  }

  currentDiagonal() {
    if (this.collected.down.length < 3) return { group: 'down', index: this.collected.down.length };
    if (this.collected.up.length < 3) return { group: 'up', index: this.collected.up.length };
    return null;
  }

  diagonalCoords(group, index) {
    return group === 'down'
      ? [[0, index], [1, index + 1], [2, index + 2]]
      : [[2, index], [1, index + 1], [0, index + 2]];
  }

  highlightNextDiagonal() {
    this.cells.forEach((c) => c.classList.remove('cell--diag-main', 'cell--diag-anti'));

    const current = this.currentDiagonal();
    if (!current) return;

    const cls = current.group === 'down' ? 'cell--diag-main' : 'cell--diag-anti';
    this.diagonalCoords(current.group, current.index).forEach(([i, j]) => {
      const cell = this.cells.get(`${i},${j}`);
      if (cell) cell.classList.add(cls);
    });

    this.picked.clear();
    this.updateTapPrompt();
  }

  async resolveDiagonal(wanted, current) {
    this.setBusy(true);

    const product = wanted.reduce((acc, c) => acc * Number(c.dataset.value), 1);
    const slotCls = current.group === 'down' ? 'blue' : 'coral';

    // Garis coret digambar LEBIH DULU sebagai konfirmasi pilihan, lalu angkanya
    // melebur. Garis ini permanen — jejak visual jalur perkalian, supaya di
    // akhir siswa bisa melihat keenam diagonal sekaligus.
    this.strike.draw(wanted, current.group === 'down' ? 'blue' : 'coral');
    await this.wait(440);

    // Tiga angka melebur menjadi satu hasil kali, lalu mendarat di ekspresi.
    // Slot tujuan = slot ke-`current.index` di kelompoknya (lihat `updateExpr`).
    const chips = wanted.map((c) => makeFlyChip(c, { text: c.dataset.value }));
    const anchor = this.expr.querySelector(
      `.det-expr__term--${slotCls}[data-slot="${current.index}"]`)
      || this.expr.querySelector(`.det-expr__term--${slotCls}.is-empty`);

    await Promise.all(chips.map((chip) => flyTo(chip, anchor)));
    const merged = await merge(chips, formatNumber(product), { operator: '×' });
    // Angkanya ditulis LANGSUNG ke slotnya saat mendarat (bukan menunggu
    // `updateExpr`), supaya tidak ada satu frame pun slot kosong "…" di
    // bawah chip yang baru saja mendarat.
    await landOn(merged, anchor, { text: formatNumber(product) });
    anchor.classList.remove('is-empty');

    this.collected[current.group].push(product);
    this.updateExpr();

    wanted.forEach((c) => {
      c.classList.remove('cell--diag-main', 'cell--diag-anti', 'cell--picked');
      c.classList.add('cell--struck');
    });
    this.picked.clear();
    this.setBusy(false);

    if (!this.currentDiagonal()) {
      const down = this.collected.down.reduce((a, b) => a + b, 0);
      const up = this.collected.up.reduce((a, b) => a + b, 0);
      const det = down - up;

      // Garis coret permanen SENGAJA dipertahankan sebagai rangkuman visual
      // keenam diagonal.
      this.cells.forEach((c) => c.classList.remove('cell--tracing', 'cell--picked'));

      this.resultCard.setValue(det);
      this.setPrompt(
        `$\\det = ${formatNumber(down)} - ${formatNumber(up)} = ${formatNumber(det)}$`,
        'Selesai'
      );
      this.later(() => this.complete(), 500);
      return;
    }

    this.highlightNextDiagonal();
  }
}

/* ============================================================
   3. singular_check — mesin diagnosa
   ============================================================ */
export class SingularCheckSim extends Simulation {
  build() {
    this.index = 0;
    this.scaffold({
      brief: this.config.brief,
      promptText: 'Tebak dulu statusnya, lalu jalankan mesin untuk memverifikasi.',
      promptStep: `1 / ${this.config.cases.length}`,
    });

    this.caseHost = el('div', 'stage__row');
    this.stage.appendChild(this.caseHost);
    // Tinggi vonis dipesan sejak awal — panel hasil tidak boleh mendorong
    // matriks di atasnya saat ia muncul.
    this.verdictHost = this.reserveSlot(96);
    this.verdictHost.classList.add('reserved-slot--verdict');
    this.stage.appendChild(this.verdictHost);

    this.renderCase();
  }

  renderCase() {
    const item = this.config.cases[this.index];
    if (!item) return this.complete();

    this.release('advance');
    this.caseHost.innerHTML = '';
    this.verdictHost.innerHTML = '';
    this.setPrompt('Matriks ini singular atau non-singular?', `${this.index + 1} / ${this.config.cases.length}`);

    const m = renderMatrix(item.matrix, { name: 'M', showOrdo: true });
    this.caseHost.appendChild(m.root);

    const buttons = el('div', 'stage__row');
    this.choiceHost = buttons;
    [
      { label: 'Singular', value: true, style: 'ghost' },
      { label: 'Non-Singular', value: false, style: 'ghost' },
    ].forEach((opt) => {
      const btn = el('button', `btn btn--${opt.style}`, opt.label);
      btn.type = 'button';
      btn.addEventListener('click', () => this.judge(item, opt.value, btn));
      buttons.appendChild(btn);
    });

    this.caseHost.appendChild(buttons);
  }

  judge(item, guess, btn) {
    const det = determinant(item.matrix);
    const actuallySingular = Math.abs(det) < 1e-10;

    if (guess !== actuallySingular) {
      this.reject(btn, 'wrongGuess', {
        det: formatNumber(det),
        status: actuallySingular ? 'singular' : 'non-singular',
      });
      lockWrongOption(btn);
      return;
    }

    /**
     * Kunci diambil SEBELUM apa pun dibangun.
     *
     * Tanpa ini, klik beruntun pada tombol yang benar menambahkan satu
     * panel vonis BARU setiap kali — kartunya seolah menggandakan diri
     * memenuhi layar — sekaligus menjadwalkan beberapa perpindahan kasus
     * sehingga panggung melompat jauh (Fase 13, isu 2).
     */
    /**
     * Kunci memakai nama TETAP, bukan nomor langkah.
     *
     * Versi pertama memakai `claim(`x-${this.index}`)` — dan gagal, karena
     * `this.index` dinaikkan di dalam penangan yang sama. Ketukan kedua
     * karena itu meminta kunci dengan nama BERBEDA dan lolos begitu saja.
     * Nama tetap + pelepasan saat langkah berikutnya digambar adalah satu-
     * satunya bentuk yang benar-benar menahan klik beruntun.
     */
    if (!this.claim('advance')) return;
    this.lockChoices(this.caseHost, { keep: btn });
    btn.classList.add('btn--success');

    // Panel vonis dibangun sebagai NODE DOM, bukan string yang dilewatkan ke
    // renderMixed(). renderMixed() meng-escape seluruh masukannya, jadi markup
    // apa pun yang ikut masuk akan tampil mentah sebagai teks di layar.
    // Hanya potongan teks bercampur LaTeX yang boleh lewat renderMixed().
    const tone = actuallySingular ? 'danger' : 'success';
    const verdict = el('div', `panel verdict-panel verdict-panel--${tone} anim-pop-in`);

    const mark = el('span', 'verdict-panel__icon',
      icon(actuallySingular ? 'lock' : 'unlock', { size: 26 }));

    const body = el('div', 'verdict-panel__body');
    body.appendChild(el('div', 'verdict-panel__head', renderMixed(
      `**${actuallySingular ? 'Singular' : 'Non-Singular'}** — $\\det = ${formatNumber(det)}$`
    )));
    body.appendChild(el('div', 'text-sm', actuallySingular
      ? 'Matriks ini TIDAK punya invers.'
      : 'Matriks ini punya invers.'));
    body.appendChild(el('div', 'text-sm text-muted', renderMixed(item.note || '')));

    verdict.append(mark, body);
    this.verdictHost.appendChild(verdict);

    this.index += 1;
    this.later(() => this.renderCase(), 2200);
  }
}

/* ============================================================
   4. property_calculator — kalkulator sifat determinan
   ============================================================ */
export class PropertyCalculatorSim extends Simulation {
  build() {
    this.index = 0;
    this.scaffold({
      brief: this.config.brief,
      promptText: 'Ketuk kartu sifat yang tepat untuk soal di panggung.',
      promptStep: `1 / ${this.config.problems.length}`,
    });

    this.problemHost = el('div', 'hots');
    this.stage.appendChild(this.problemHost);

    this.rulesHost = el('div', 'hots__rules');
    this.stage.appendChild(this.rulesHost);

    this.renderProblem();
  }

  renderProblem() {
    const problem = this.config.problems[this.index];
    if (!problem) return this.complete();

    this.problemHost.innerHTML = '';
    this.rulesHost.innerHTML = '';
    this.setPrompt(problem.prompt, `${this.index + 1} / ${this.config.problems.length}`);

    /**
     * SOALNYA DITULIS DI PANGGUNG (Fase 12, isu 11).
     *
     * Sebelumnya soal hanya hidup di panel kendali lewat `setPrompt()`,
     * sementara kartu-kartu sifat yang harus dipilih ada di panggung. Siswa
     * jadi harus mengingat soal sambil melihat pilihannya — beban memori yang
     * tidak ada hubungannya dengan matematika yang sedang diuji. Sekarang
     * soalnya berdiri tepat di atas pilihannya.
     */
    const ask = el('div', 'hots__question');
    ask.appendChild(el('span', 'hots__badge', `Soal ${this.index + 1} dari ${this.config.problems.length}`));
    ask.appendChild(el('div', 'hots__text', renderMixed(problem.prompt)));
    this.problemHost.appendChild(ask);

    const work = el('div', 'dropzone hots__work');
    work.innerHTML = '<span>Ketuk salah satu kartu sifat di bawah</span>';
    this.problemHost.appendChild(work);
    this.work = work;

    // KETUK-KETUK, bukan seret: kartunya besar dan tujuannya cuma satu, jadi
    // menyeret hanya menambah gerakan tanpa menambah pemahaman.
    this.config.rules.forEach((rule) => {
      const card = el('div', 'drag-card hots__card');
      card.innerHTML = renderMixed(`$${rule.tex}$`);
      this.track(makeTappable(card, () => this.applyRule(problem, { rule }, card, work),
        `Sifat determinan: ${rule.key}`));
      this.rulesHost.appendChild(card);
    });
  }

  applyRule(problem, data, sourceEl, work) {
    if (this.busy || this.resolved) return;

    if (data.rule.key !== problem.rule) {
      const hintMap = {
        scalar: 'perkalian matriks dengan sebuah skalar',
        product: 'determinan dari hasil kali dua matriks',
        transpose: 'determinan dari matriks transpose',
        power: 'determinan matriks berpangkat',
        inverse: 'determinan matriks invers',
      };
      this.reject(sourceEl, 'wrongRule', { hint: hintMap[problem.rule] || 'sifat lain' });

      /**
       * Kartu yang keliru DISINGKIRKAN, bukan sekadar ditolak.
       *
       * Pilihannya jadi mengerucut: siswa yang salah sekali tidak bisa
       * menekan kartu yang sama lagi, dan sisa pilihannya makin sedikit
       * sehingga ia terdorong menimbang, bukan menebak berulang
       * (kontrak §5 butir 11).
       */
      sourceEl.classList.add('hots__card--out');
      sourceEl.setAttribute('aria-hidden', 'true');
      this.later(() => sourceEl.remove(), 320);
      return;
    }

    this.resolved = true;
    work.dataset.filled = 'true';
    // Hasil dirapikan lewat kelas .rule-result: seluruh isinya dipusatkan
    // horizontal maupun vertikal, dan ukuran hurufnya dinaikkan supaya
    // angka hasil terbaca dari jarak pandang biasa di kelas.
    work.innerHTML = `
      <div class="rule-result">
        <div class="rule-result__tex">${renderMixed(`$${data.rule.tex}$`)}</div>
        <div class="rule-result__work anim-rise">${renderMixed(problem.work)}</div>
        <div class="badge badge--success rule-result__answer">Hasil: ${formatNumber(problem.answer)}</div>
      </div>
    `;
    work.classList.add('anim-flash-success');

    // Sisa kartu ikut dimatikan supaya tidak ada ketukan susulan yang
    // menumpuk di atas jawaban yang sudah benar.
    this.rulesHost.querySelectorAll('.hots__card').forEach((c) => {
      if (c !== sourceEl) c.classList.add('hots__card--spent');
    });

    toast.success(this.msg('success'));
    this.index += 1;
    this.later(() => { this.resolved = false; this.renderProblem(); }, 2600);
  }
}

/* ============================================================
   5. inverse2x2 — empat tahap
   ============================================================ */
export class Inverse2x2Sim extends Simulation {
  /**
   * Tiga tahap, dikerjakan siswa sendiri dari awal sampai akhir:
   *
   *   1. DETERMINAN MANUAL — ketuk kedua elemen tiap diagonal, persis mekanik
   *      `det2x2`. Nilainya disimpan dan dipakai tahap 3.
   *   2. ADJOIN — ketuk dua elemen diagonal utama untuk MENUKAR posisinya,
   *      lalu ketuk dua elemen diagonal sekunder untuk MEMBALIK tandanya.
   *      Tanpa seret sama sekali; keduanya gerakan presisi tinggi yang di
   *      layar sentuh lebih sering meleset daripada berhasil.
   *   3. SKALAR — chip $\frac{1}{\det}$ muncul di luar matriks dan harus
   *      dibawa ke SETIAP elemen satu per satu, bukan disapukan sekali ke
   *      seluruh matriks. Mengalikan tiap elemen adalah inti definisinya.
   */
  build() {
    const { matrix, name = 'A' } = this.config;

    this.det = determinant(matrix);
    this.singular = Math.abs(this.det) < 1e-10;

    this.phase = 0;              // 0 determinan · 1 tukar · 2 balik tanda · 3 skalar
    this.detPhase = 0;           // 0 diagonal utama · 1 diagonal sekunder
    this.products = [];
    this.picked = new Set();
    this.swapPicked = [];
    this.flipped = new Set();
    this.assembled = false;   // gerbang perakitan akhir, sekali jalan

    this.scaffold({
      brief: this.config.brief,
      promptText: 'Tahap 1 — hitung determinannya sendiri. Ketuk **kedua elemen** diagonal utama (**berwarna biru**).',
      promptStep: 'Tahap 1 dari 3',
      legend: [
        { tone: 'blue', label: 'Biru = diagonal utama ($ad$)' },
        { tone: 'coral', label: 'Oranye = diagonal sekunder ($bc$)' },
      ],
    });

    this.checklist = createChecklist([
      'Hitung determinan sendiri',
      'Susun adjoin: tukar & balik tanda',
      'Pasang $\\frac{1}{\\det}$ di depan adjoin',
    ]);
    // Checklist adalah PETUNJUK, bukan kanvas — ia ikut ke panel kendali.
    this.addHint(this.checklist);

    const m = renderMatrix(matrix, { name, showAddress: true });
    this.cells = m.cells;
    this.matrixView = m;
    this.nameLabel = m.root.querySelector('.matrix__name');
    // Label berubah 'A' -> 'adj(A)' di tahap 2. Tanpa lebar yang dipesan
    // sejak awal, matriksnya bergeser 15px tepat saat siswa melihat hasil
    // tukar-tanda — terukur, dan melanggar kontrak §5 butir 14.
    if (this.nameLabel) this.nameLabel.classList.add('matrix__name--reserved');

    this.strike = createStrikeLayer(m.grid);
    this.track(() => this.strike.destroy());

    // Ekspresi determinan yang tumbuh: (ad) − (bc) = …
    this.expr = el('div', 'det-expr');
    this.updateExpr();

    this.detCard = createScalarResult(`$\\det(${name})$`, null);

    // Slot skalar berdiri di DEPAN kurung, ruangnya dipesan sejak awal.
    //
    // ⚠️ Keduanya dibungkus SATU wadah `nowrap`. Kalau slot dan matriks jadi
    // dua anak langsung dari baris panggung yang boleh membungkus, panggung
    // yang sempit akan melemparkan matriksnya ke baris berikutnya — dan
    // skalarnya berdiri sendirian di depan ruang kosong, bukan di depan
    // kurung. Terukur persis begitu pada invers 3×3 sebelum diperbaiki.
    this.scalarSlot = createScalarSlot();
    this.stage.appendChild(stageRow(scalarPair(this.scalarSlot, m.root)));
    this.stage.appendChild(this.expr);
    this.stage.appendChild(stageRow(this.detCard));

    // Ruang chip skalar dipesan sejak awal agar kemunculannya di tahap 3
    // tidak mendorong matriks di atasnya.
    this.scalarHost = this.reserveSlot(64);
    this.scalarHost.classList.add('reserved-slot--verdict');
    this.stage.appendChild(this.scalarHost);

    this.paintDiagonals();

    this.cells.forEach((cell, key) => {
      const [i, j] = key.split(',').map(Number);
      this.track(makeTappable(cell, () => this.handleTap(cell, key, i, j),
        `Elemen baris ${i + 1} kolom ${j + 1}`));
    });

    if (this.singular) toast.error(this.msg('singular'));
  }

  /* ---------------- tampilan ---------------- */

  paintDiagonals() {
    clearHighlights(this.cells);

    // Tahap 0 menyorot satu diagonal per giliran; tahap 1 & 2 menyorot
    // diagonal yang sedang jadi sasaran ketukan.
    const showMain = (this.phase === 0 && this.detPhase === 0) || this.phase === 1;
    const showAnti = (this.phase === 0 && this.detPhase === 1) || this.phase === 2;

    if (showMain) {
      this.cells.get('0,0').classList.add('cell--diag-main');
      this.cells.get('1,1').classList.add('cell--diag-main');
    }
    if (showAnti) {
      this.cells.get('0,1').classList.add('cell--diag-anti');
      this.cells.get('1,0').classList.add('cell--diag-anti');
    }
  }

  updateExpr() {
    const p0 = this.products[0];
    const p1 = this.products[1];
    this.expr.innerHTML = `
      <span class="det-expr__term det-expr__term--blue">${p0 != null ? formatNumber(p0) : 'ad'}</span>
      <span class="det-expr__op">−</span>
      <span class="det-expr__term det-expr__term--coral">${p1 != null ? formatNumber(p1) : 'bc'}</span>
      <span class="det-expr__op">=</span>
      <span class="det-expr__result">${p0 != null && p1 != null ? formatNumber(p0 - p1) : '?'}</span>`;
  }

  /* ---------------- gerbang ketukan ---------------- */

  handleTap(cell, key, i, j) {
    if (this.busy) return;
    if (this.phase === 0) return this.tapForDet(cell, key);
    if (this.phase === 1) return this.tapForSwap(cell, key);
    if (this.phase === 2) return this.tapForFlip(cell, key, i, j);
    // Tahap 3 tidak memakai ketukan sel — skalar dibawa ke selnya.
    this.reject(cell, 'wrongTarget');
  }

  /* ---------------- TAHAP 1: determinan manual ---------------- */

  tapForDet(cell, key) {
    const wanted = this.detPhase === 0 ? ['0,0', '1,1'] : ['0,1', '1,0'];

    if (!wanted.includes(key)) {
      this.reject(cell, 'wrongDiagonal', { warna: this.detPhase === 0 ? 'biru' : 'oranye' });
      return;
    }

    if (this.picked.has(key)) {
      this.picked.delete(key);
      cell.classList.remove('cell--picked');
      return;
    }

    this.picked.add(key);
    cell.classList.add('cell--picked');

    if (this.picked.size === 2) this.resolveDetDiagonal(wanted.map((k) => this.cells.get(k)));
  }

  async resolveDetDiagonal(wanted) {
    this.setBusy(true);

    const product = Number(wanted[0].dataset.value) * Number(wanted[1].dataset.value);
    const tone = this.detPhase === 0 ? 'blue' : 'coral';

    this.strike.draw(wanted, tone);
    await this.wait(440);

    const chips = wanted.map((c) => makeFlyChip(c, { text: c.dataset.value }));
    const slot = this.expr.querySelector(`.det-expr__term--${tone}`);

    await Promise.all(chips.map((chip) => flyTo(chip, slot)));
    const merged = await merge(chips, formatNumber(product), { operator: '×' });
    await landOn(merged, slot, { text: formatNumber(product) });

    this.products[this.detPhase] = product;
    this.updateExpr();

    wanted.forEach((c) => c.classList.remove('cell--picked'));
    this.picked.clear();
    this.detPhase += 1;
    this.setBusy(false);

    if (this.detPhase === 1) {
      this.paintDiagonals();
      this.setPrompt(
        'Sekarang ketuk **kedua elemen** diagonal sekunder — yang **berwarna oranye**.',
        'Tahap 1 dari 3'
      );
      return;
    }

    // Determinan dari kerja siswa sendiri, bukan dari engine.
    this.det = this.products[0] - this.products[1];
    this.singular = Math.abs(this.det) < 1e-10;
    this.detCard.setValue(this.det);
    this.strike.clear();
    this.cells.forEach((c) => c.classList.remove('cell--struck'));

    this.checklist.advance(0);

    if (this.singular) {
      // Jalan buntu yang JUJUR: prosesnya memang berhenti di sini, dan
      // siswa harus tahu persis mengapa.
      toast.error(this.msg('singular'));
      this.setPrompt(
        `$\\det = 0$ — matriks ini singular, jadi inversnya tidak ada. Proses berhenti di sini.`,
        'Selesai'
      );
      this.later(() => this.complete(), 400);
      return;
    }

    this.phase = 1;
    this.paintDiagonals();
    this.setPrompt(
      'Tahap 2 — ketuk **kedua elemen biru** (diagonal utama) untuk **menukar posisinya**.',
      'Tahap 2 dari 3'
    );
  }

  /* ---------------- TAHAP 2a: tukar diagonal utama ---------------- */

  tapForSwap(cell, key) {
    if (key !== '0,0' && key !== '1,1') {
      this.reject(cell, 'wrongSwap');
      return;
    }

    const at = this.swapPicked.findIndex((x) => x.key === key);
    if (at >= 0) {
      this.swapPicked.splice(at, 1);
      cell.classList.remove('cell--picked');
      return;
    }

    this.swapPicked.push({ key, cell });
    cell.classList.add('cell--picked');

    if (this.swapPicked.length === 2) this.runSwap();
  }

  async runSwap() {
    this.setBusy(true);

    const [first, second] = this.swapPicked;
    this.swapPicked = [];

    // swapArc() SUDAH menukar textContent sekaligus dataset.value di akhir
    // animasinya. Menukarnya sekali lagi di sini akan mengembalikan keduanya
    // ke posisi semula — tampak seolah tombol tukarnya tidak berfungsi.
    await swapArc(first.cell, second.cell);

    // …tetapi ia menulis lewat `textContent`, jadi label alamatnya tersapu
    // dan ikut jadi teks. Lihat catatan di `rewriteCell()`.
    [first.cell, second.cell].forEach((c) => rewriteCell(c));

    [first.cell, second.cell].forEach((c) => c.classList.remove('cell--picked'));

    this.phase = 2;
    this.paintDiagonals();
    this.setBusy(false);

    this.setPrompt(
      'Tahap 2 lanjut — sekarang ketuk **kedua elemen oranye** (diagonal sekunder) untuk **membalik tandanya**.',
      'Tahap 2 dari 3'
    );
  }

  /* ---------------- TAHAP 2b: balik tanda diagonal sekunder ---------------- */

  async tapForFlip(cell, key) {
    if (key !== '0,1' && key !== '1,0') {
      this.reject(cell, 'wrongFlip');
      return;
    }
    if (this.flipped.has(key)) return;

    this.flipped.add(key);
    this.setBusy(true);

    // flipSign() juga menulis textContent dan dataset.value-nya sendiri —
    // dan karenanya ikut menyapu label alamat, sama seperti swapArc().
    const flippedValue = -Number(cell.dataset.value);
    await flipSign(cell, formatNumber(flippedValue));
    rewriteCell(cell);
    cell.classList.add('cell--done');

    this.setBusy(false);

    if (this.flipped.size < 2) {
      this.setPrompt('Satu lagi — ketuk elemen **oranye** yang tersisa.', 'Tahap 2 dari 3');
      return;
    }

    this.checklist.advance(1);
    this.phase = 3;
    clearHighlights(this.cells);
    this.cells.forEach((c) => c.classList.remove('cell--done'));
    this.startScalarStep();
  }

  /* ============================================================
     TAHAP 3: PERAKITAN AKHIR — skalar berdiri DI DEPAN kurung

     Versi sebelumnya meminta siswa membawa chip $\frac{1}{\det}$ ke
     setiap elemen satu per satu sampai keempat sel berubah jadi
     pecahan. Itu benar secara aritmetika, tetapi menghasilkan bentuk
     yang TIDAK dipakai siapa pun: di buku, di papan tulis, dan di
     lembar jawaban TKA, invers ditulis sebagai satu pecahan di depan
     kurung — $\frac{1}{10}\begin{pmatrix}4 & -1\\-2 & 3\end{pmatrix}$,
     bukan empat pecahan terpisah di dalam kurung.

     Perkalian skalar ke tiap elemen sudah punya sub-topiknya sendiri
     di Bab 2; mengulangnya di sini menambah delapan ketukan tanpa
     menambah satu pun konsep baru. Yang tersisa untuk siswa adalah
     keputusan yang justru sering keliru: skalar itu ditaruh di MANA.
     ============================================================ */

  startScalarStep() {
    // Matriksnya sudah bukan A lagi — ia adjoinnya. Namanya ikut berubah,
    // supaya siswa membaca bentuk yang benar, bukan label yang tertinggal.
    if (this.nameLabel) this.nameLabel.textContent = `adj(${this.config.name})`;

    this.setPrompt(
      `Tahap 3 — bawa chip $\\frac{1}{${formatNumber(this.det)}}$ ke **slot di depan kurung**. Seret, atau ketuk chipnya lalu ketuk slotnya.`,
      'Tahap 3 dari 3'
    );

    const chip = createInverseChip(this.det);
    this.scalarChip = chip;

    this.scalarHost.innerHTML = '';
    this.scalarHost.appendChild(chip);

    // Slot tujuan baru MENYALA sekarang — ruangnya memang sudah dipesan
    // sejak awal, jadi memunculkannya tidak menggeser apa pun.
    this.scalarSlot.reveal();
    this.scalarSlot.classList.add('inv-scalar--open');
    this.track(registerDropZone(this.scalarSlot, {
      padding: 10,
      onDrop: () => this.placeScalar(),
    }));

    // Sel matriks TIDAK jadi drop-zone: menjatuhkan skalar ke dalam sel
    // adalah kesalahan yang harus dijelaskan, bukan jalan pintas yang
    // diam-diam diterima.
    this.cells.forEach((cell) => {
      this.track(registerDropZone(cell, {
        padding: 6,
        onDrop: (data, sourceEl) => this.reject(sourceEl || cell, 'scalarInCell'),
      }));
    });
  }

  async placeScalar() {
    if (this.busy || this.assembled) return;
    if (!this.claim('assemble')) return;   // kebal ketukan beruntun

    this.assembled = true;
    this.setBusy(true);

    const chipClone = makeFlyChip(this.scalarChip, { text: null });
    chipClone.innerHTML = this.scalarChip.innerHTML;
    await landOn(chipClone, this.scalarSlot, { text: null });

    this.scalarSlot.fill(this.det);
    this.scalarSlot.classList.remove('inv-scalar--open');

    this.scalarChip.dataset.dragDisabled = 'true';
    this.scalarChip.classList.add('is-spent');

    this.setBusy(false);
    this.finishInverse();
  }

  finishInverse() {
    this.checklist.advance(2);

    const adj = adjoint(this.config.matrix);
    this.setPrompt(
      `$${this.config.name}^{-1} = \\dfrac{1}{${formatNumber(this.det)}}${toLatex(adj)}$ — bentuk inilah yang kamu tulis di lembar jawaban.`,
      'Selesai'
    );
    this.complete();
  }
}

/* ============================================================
   6. inverse3x3 — invers 3×3 dengan Metode Adjoin (Fase 16)

   Empat langkah, dan tiga di antaranya MEMAKAI ULANG mesin yang
   sudah matang:

     1. Determinan  → `Det3x3SarrusSim` apa adanya, dipasang sebagai
                      sub-engine. Bukan disalin — kelasnya yang sama.
     2. Kofaktor    → mekanik baru (satu-satunya yang memang baru).
     3. Adjoin      → `foldTranspose()`, animasi lipat diagonal yang
                      sama dengan sub-topik Transpose di Bab 1.
     4. Perakitan   → slot skalar yang sama dengan invers 2×2.

   Menyalin kode Sarrus ke sini akan membuat dua salinan mekanik yang
   HARUS berperilaku identik — dan begitu salah satunya diperbaiki,
   siswa akan menemui dua Sarrus yang berbeda di dua halaman.
   ============================================================ */

/**
 * Sarrus sebagai SUB-LANGKAH.
 *
 * Satu-satunya yang diubah: `complete()`. Versi aslinya memasang banner
 * "Simulasi selesai — lanjut ke Mini Kuis" dan menembakkan toast sukses.
 * Di sini keduanya berbohong — yang selesai baru langkah pertama dari
 * empat, dan Mini Kuis masih jauh.
 */
class SarrusStep extends Det3x3SarrusSim {
  complete() {
    if (this.finished) return;
    this.finished = true;
    this.onComplete();
  }
}

/**
 * Perkalian matriks sebagai SUB-LANGKAH — alasan yang sama seperti
 * `SarrusStep`.
 */
class MultiplyStep extends MatrixMultiplySim {
  complete() {
    if (this.finished) return;
    this.finished = true;
    this.onComplete();
  }
}

export class Inverse3x3Sim extends Simulation {
  build() {
    const { matrix, name = 'A' } = this.config;

    this.matrix = matrix;
    this.name = name;

    /**
     * Kunci jawaban kofaktor. Ia HANYA dipakai untuk menilai jawaban siswa
     * dan untuk enam sel yang diisi otomatis di akhir — tidak pernah untuk
     * tiga sel yang wajib dikerjakan sendiri.
     */
    this.cof = cofactorMatrix(matrix);
    this.adj = transpose(this.cof);

    /**
     * Tiga sel yang WAJIB dikerjakan sendiri.
     *
     * Sembilan kofaktor berarti sembilan kali determinan 2×2 — dan setelah
     * yang ketiga, siswa tidak lagi belajar apa pun, ia hanya lelah. Tiga
     * sel sengaja dipilih agar mencakup KEDUA tanda papan catur: `c11`
     * bertanda plus, `c12` dan `c23` bertanda minus, sehingga aturan tanda
     * benar-benar teruji, bukan kebetulan lolos.
     */
    this.manualKeys = (this.config.manualCells || [[0, 0], [0, 1], [1, 2]])
      .map(([i, j]) => `${i},${j}`);
    this.doneKeys = new Set();
    this.activeKey = null;

    this.scaffold({
      brief: this.config.brief,
      promptText: 'Langkah 1 — hitung $\\det(A)$ dulu dengan Metode Sarrus. Kalau nol, prosesnya berhenti di situ.',
      promptStep: 'Langkah 1 dari 4',
    });

    this.checklist = createChecklist([
      'Hitung $\\det(A)$ (Sarrus)',
      'Buru tiga kofaktor sendiri',
      'Transpose kofaktor $\\to$ Adjoin',
      'Pasang $\\frac{1}{\\det}$ di depan Adjoin',
    ]);
    this.addHint(this.checklist);

    /** Panel petunjuk MILIK sub-engine, terpisah dari prompt langkah kami. */
    this.subHint = el('div', 'inv3-subhint');
    this.addHint(this.subHint);

    this.stepHost = el('div', 'inv3-host');
    this.stage.appendChild(this.stepHost);

    this.startDetStep();
  }

  /** Bongkar sub-engine langkah sebelumnya sampai bersih. */
  teardownStep() {
    if (this.sub) {
      this.sub.destroy();
      this.sub = null;
    }
    this.stepHost.innerHTML = '';
    this.subHint.innerHTML = '';
  }

  /* ---------------- LANGKAH 1: determinan lewat Sarrus ---------------- */

  startDetStep() {
    const host = el('div');
    this.stepHost.appendChild(host);

    const sub = new SarrusStep(host, {
      matrix: this.matrix,
      name: this.name,
    }, this.toasts, () => this.onDetDone(sub));

    sub.hintHost = this.subHint;
    this.sub = sub;
    sub.build();
  }

  onDetDone(sub) {
    // Determinannya diambil dari hasil kerja SISWA di panggung Sarrus,
    // bukan dihitung ulang lewat engine. Kalau keduanya berbeda, yang
    // salah adalah kodenya — dan lebih baik itu terlihat.
    const down = sub.collected.down.reduce((a, b) => a + b, 0);
    const up = sub.collected.up.reduce((a, b) => a + b, 0);
    this.det = down - up;

    this.checklist.advance(0);

    if (Math.abs(this.det) < 1e-10) {
      // Jalan buntu yang JUJUR. Adjoinnya masih bisa dihitung, tetapi untuk
      // mencari invers ia sia-sia — dan itu justru pelajarannya.
      toast.error(this.msg('singular') || 'Determinannya nol — matriks ini singular, jadi inversnya tidak ada.');
      this.setPrompt(
        '$\\det(A) = 0$ — matriks ini **singular**. Adjoinnya masih bisa disusun, tapi $\\frac{1}{0}$ tidak terdefinisi, jadi $A^{-1}$ tidak ada. Prosesnya berhenti di sini.',
        'Selesai'
      );
      this.later(() => this.complete(), 500);
      return;
    }

    this.later(() => {
      this.teardownStep();
      this.startCofactorStep();
    }, 700);
  }

  /* ---------------- LANGKAH 2: berburu kofaktor ---------------- */

  startCofactorStep() {
    this.setPrompt(
      `Langkah 2 — ketuk sel kofaktor yang **berdenyut**. Hanya **tiga** yang kamu hitung sendiri; sisanya menyusul otomatis setelah kamu menguasai polanya.`,
      `Langkah 2 dari 4 · 0/3 kofaktor`
    );

    this.addHint(createColorLegend([
      { tone: 'blue', label: 'Biru = baris & kolom yang **dicoret**' },
      { tone: 'amber', label: 'Kuning = sel kofaktor yang sedang dikerjakan' },
    ]));

    const a = renderMatrix(this.matrix, { name: this.name, showAddress: true });
    this.aCells = a.cells;
    this.aView = a;

    this.aStrike = createStrikeLayer(a.grid);
    this.track(() => this.aStrike.destroy());

    // Matriks kofaktor: kosong, dengan pola papan catur sebagai CAP AIR.
    const c = renderMatrix(this.cof, { name: 'C (kofaktor)', empty: true });
    this.cofCells = c.cells;
    this.cofView = c;
    c.grid.classList.add('cof-grid');
    // Label menyusut 'C (kofaktor)' -> 'adj(A)' di langkah 3; lebarnya
    // dipesan supaya matriksnya tidak melompat saat itu terjadi.
    const cofName = c.root.querySelector('.matrix__name');
    if (cofName) cofName.classList.add('matrix__name--reserved');

    this.cofCells.forEach((cell, key) => {
      const [i, j] = key.split(',').map(Number);
      const plus = (i + j) % 2 === 0;
      cell.classList.add('cof-cell', plus ? 'cof-cell--plus' : 'cof-cell--minus');
      // Tandanya cap air, bukan isi: ia mengingatkan pola $(-1)^{i+j}$ tanpa
      // pernah bisa disalahartikan sebagai nilai kofaktornya.
      cell.appendChild(el('span', 'cof-cell__sign', plus ? '+' : '−'));
    });

    // Slot skalar dibuat SEKARANG, bukan di langkah 4: ruangnya ikut
    // terpesan sejak awal, dan ia dijamin selalu bersebelahan dengan kurung.
    this.scalarSlot = createScalarSlot();

    this.stepHost.appendChild(equationRow(
      a.root, createFlowArrow('arrow-right'), scalarPair(this.scalarSlot, c.root)
    ));

    // Panel minor + isian. Tingginya dipesan sejak awal supaya munculnya
    // sub-matriks tidak mendorong matriks di atasnya (kontrak §5 butir 14).
    this.minorHost = this.reserveSlot(132);
    this.minorHost.classList.add('minor-panel-host');
    this.stepHost.appendChild(this.minorHost);

    this.progress = createProgressText(3, 'kofaktor');
    this.addHint(this.progress);

    this.manualKeys.forEach((key) => {
      const cell = this.cofCells.get(key);
      if (!cell) return;
      cell.classList.add('cell--invite');
      this.track(makeTappable(cell, () => this.pickCofactor(key), `Kofaktor ${this.labelFor(key)}`));
    });

    // Sel yang TIDAK diburu manual tetap bisa diketuk — supaya penolakannya
    // bisa dijelaskan, bukan sekadar tidak terjadi apa-apa (kontrak §5 butir 3).
    this.cofCells.forEach((cell, key) => {
      if (this.manualKeys.includes(key)) return;
      this.track(makeTappable(cell, () => {
        this.reject(cell, 'notHunted', { list: this.manualKeys.map((k) => this.labelFor(k)).join(', ') });
      }, `Kofaktor ${this.labelFor(key)} — diisi otomatis nanti`));
    });
  }

  labelFor(key) {
    const [i, j] = key.split(',').map(Number);
    return `c${i + 1}${j + 1}`;
  }

  /** Ketukan pada salah satu dari tiga sel yang diburu manual. */
  pickCofactor(key) {
    if (this.busy) return;
    if (this.doneKeys.has(key)) return;

    // Berpindah sel di tengah pengerjaan diperbolehkan — yang tidak boleh
    // adalah DUA panel minor hidup bersamaan.
    if (this.activeKey === key) {
      this.closeMinorPanel();
      return;
    }

    this.activeKey = key;
    const [i, j] = key.split(',').map(Number);

    clearHighlights(this.cofCells);
    this.cofCells.get(key).classList.add('cell--target');

    this.showMinorFor(i, j);
  }

  /**
   * Coret baris ke-i dan kolom ke-j pada matriks A, lalu sodorkan minornya.
   *
   * Coretannya digambar DI ATAS matriks aslinya, bukan hanya menampilkan
   * sub-matriks yang sudah jadi. Yang sering keliru dipahami siswa bukan
   * "bagaimana menghitung determinan 2×2", melainkan "sub-matriks yang mana"
   * — dan itu hanya terlihat kalau pencoretannya sendiri yang diperagakan.
   */
  showMinorFor(i, j) {
    this.aStrike.clear();
    clearHighlights(this.aCells);

    const cols = this.matrix[0].length;
    const rows = this.matrix.length;
    const row = rowCells(this.aCells, i, cols);
    const col = colCells(this.aCells, j, rows);

    row.forEach((c) => c.classList.add('cell--muted'));
    col.forEach((c) => c.classList.add('cell--muted'));

    this.aStrike.draw(row, 'blue');
    this.aStrike.draw(col, 'blue');

    const minor = minorMatrix(this.matrix, i, j);
    const plus = (i + j) % 2 === 0;
    const label = this.labelFor(`${i},${j}`);

    const panel = el('div', 'minor-panel anim-rise');

    const head = el('div', 'minor-panel__head');
    head.innerHTML = renderMixed(
      `Sisa setelah baris ${i + 1} dan kolom ${j + 1} dicoret — hitung determinannya:`
    );
    panel.appendChild(head);

    const body = el('div', 'minor-panel__body');
    const mv = renderMatrix(minor, { name: null });
    mv.root.classList.add('matrix--mini');
    body.appendChild(mv.root);

    const ask = el('div', 'minor-panel__ask');
    ask.appendChild(el('span', 'minor-panel__label', renderMixed('$\\det = $')));

    const input = document.createElement('input');
    input.className = 'numfield';
    input.placeholder = '?';
    input.setAttribute('aria-label', `Determinan minor untuk ${label}`);
    attachMathpad(input, {
      onCommit: (value) => this.judgeMinor(i, j, value, input),
    });
    ask.appendChild(input);
    body.appendChild(ask);

    panel.appendChild(body);

    const foot = el('div', 'minor-panel__foot');
    foot.innerHTML = renderMixed(
      `Tandanya nanti **${plus ? 'positif' : 'negatif'}** — ikuti cap air $${plus ? '+' : '-'}$ pada sel $${label}$.`
    );
    panel.appendChild(foot);

    this.minorHost.innerHTML = '';
    this.minorHost.appendChild(panel);
    this.minorInput = input;

    this.setPrompt(
      `Baris ${i + 1} dan kolom ${j + 1} dicoret. Hitung determinan sisa $2\\times2$-nya, lalu isikan lewat papan angka.`,
      `Langkah 2 dari 4 · ${this.doneKeys.size}/3 kofaktor`
    );
  }

  closeMinorPanel() {
    this.activeKey = null;
    this.minorInput = null;
    this.minorHost.clear();
    this.aStrike.clear();
    clearHighlights(this.aCells);
    this.aCells.forEach((c) => c.classList.remove('cell--muted'));
    clearHighlights(this.cofCells);
  }

  async judgeMinor(i, j, value, input) {
    const key = `${i},${j}`;
    if (this.busy || this.doneKeys.has(key)) return;

    const minorDet = determinant(minorMatrix(this.matrix, i, j));

    if (Math.abs(Number(value) - minorDet) > 1e-9) {
      input.classList.add('numfield--no');
      this.later(() => input.classList.remove('numfield--no'), 600);
      // Isian DIKOSONGKAN setelah jawaban keliru — kalau tidak, ketukan
      // berikutnya menyambung angka lama ("9" lalu "5" jadi "95").
      input.value = '';
      this.reject(input, 'wrongMinor', { baris: i + 1, kolom: j + 1 });
      return;
    }

    if (!this.claim(`cof-${key}`)) return;

    this.setBusy(true);
    input.classList.add('numfield--ok');
    input.dataset.locked = 'true';
    input.style.pointerEvents = 'none';

    const plus = (i + j) % 2 === 0;
    const cofValue = plus ? minorDet : -minorDet;

    // Tanda papan catur diterapkan di depan mata, bukan diam-diam.
    this.setPrompt(
      plus
        ? `Minornya $${formatNumber(minorDet)}$, dan sel ini bertanda **+**, jadi kofaktornya tetap $${formatNumber(cofValue)}$.`
        : `Minornya $${formatNumber(minorDet)}$, tapi sel ini bertanda **−**, jadi kofaktornya menjadi $${formatNumber(cofValue)}$.`,
      `Langkah 2 dari 4 · ${this.doneKeys.size + 1}/3 kofaktor`
    );

    await this.wait(620);

    const cell = this.cofCells.get(key);
    cell.classList.remove('cell--invite', 'cell--target');
    cell.classList.add('cell--resolving');
    await this.wait(280);

    this.writeCofactor(cell, cofValue);
    cell.classList.remove('cell--resolving');
    cell.classList.add('cell--done', 'anim-land');

    this.doneKeys.add(key);
    this.progress.set(this.doneKeys.size);
    this.closeMinorPanel();
    this.setBusy(false);

    if (this.doneKeys.size >= this.manualKeys.length) {
      this.later(() => this.autoFillRest(), 520);
    }
  }

  /** Tulis nilai kofaktor tanpa menghapus cap air tandanya. */
  writeCofactor(cell, value) {
    const sign = cell.querySelector('.cof-cell__sign');
    cell.textContent = formatNumber(value);
    cell.dataset.value = String(value);
    if (sign) cell.appendChild(sign);
  }

  /**
   * Enam sel sisanya diisi otomatis.
   *
   * ⚠️ Ini SATU-SATUNYA tempat di seluruh aplikasi yang mengisi jawaban
   * untuk siswa, dan itu keputusan sadar: setelah tiga kofaktor, sel
   * keempat sampai kesembilan tidak lagi mengajarkan apa pun — mekaniknya
   * sudah persis sama, yang bertambah hanya kelelahan. Supaya tetap jujur,
   * sel-sel ini DITANDAI sebagai terisi otomatis dan dikatakan terus terang
   * di prompt; siswa tidak boleh mengira ia yang mengerjakannya.
   */
  async autoFillRest() {
    this.setBusy(true);
    this.checklist.advance(1);

    const rest = [];
    const restKeys = [];
    const values = [];
    this.cofCells.forEach((cell, key) => {
      if (this.doneKeys.has(key)) return;
      const [i, j] = key.split(',').map(Number);
      rest.push(cell);
      restKeys.push(key);
      values.push(formatNumber(this.cof[i][j]));
    });

    this.setPrompt(
      `Polanya sudah kamu kuasai. Enam sel sisanya **diisi otomatis** dengan cara yang persis sama — perhatikan tandanya berselang-seling.`,
      'Langkah 2 dari 4 · otomatis'
    );

    rest.forEach((cell) => cell.classList.add('cof-cell--auto'));

    // `staggerCells` menulis textContent, jadi cap air tandanya ikut
    // tersapu — ia dipasang ulang sesudahnya.
    await staggerCells(rest, values, { delay: 90 });

    rest.forEach((cell, index) => {
      const [i, j] = restKeys[index].split(',').map(Number);
      const plus = (i + j) % 2 === 0;
      cell.dataset.value = values[index];
      cell.appendChild(el('span', 'cof-cell__sign', plus ? '+' : '−'));
      cell.appendChild(el('span', 'cof-cell__auto', 'auto'));
    });

    /**
     * Sel kofaktor dikunci begitu matriksnya lengkap.
     *
     * Kalau tidak, mengetuk sel mana pun sesudah ini masih memunculkan
     * penolakan "sel itu akan diisi otomatis nanti" — kalimat yang sudah
     * tidak benar lagi, karena semuanya SUDAH terisi. Umpan balik yang
     * ketinggalan zaman lebih membingungkan daripada tidak ada umpan balik.
     */
    this.lockChoices(this.cofView.root);

    this.setBusy(false);
    this.later(() => this.startTransposeStep(), 500);
  }

  /* ---------------- LANGKAH 3: transpose → adjoin ---------------- */

  startTransposeStep() {
    this.setPrompt(
      'Langkah 3 — Adjoin adalah **transpose** matriks kofaktor. Tekan tombolnya dan perhatikan segitiga atas & bawah bertukar tempat.',
      'Langkah 3 dari 4'
    );

    // Matriks A sudah selesai tugasnya; ia diredupkan supaya perhatian
    // pindah sepenuhnya ke matriks kofaktor yang akan dilipat.
    this.aView.root.classList.add('is-retired');

    const btn = el('button', 'btn btn--primary btn--pulse');
    btn.type = 'button';
    btn.innerHTML = `${icon('swap', { size: 17 })}<span>Ubah ke Adjoin</span>`;
    btn.addEventListener('click', () => this.runFold(btn));
    this.foldBtn = btn;

    this.minorHost.innerHTML = '';
    this.minorHost.appendChild(stageRow(btn));
  }

  async runFold(btn) {
    if (this.busy) return;
    if (!this.claim('fold')) return;

    this.setBusy(true);
    btn.disabled = true;
    btn.classList.remove('btn--pulse');

    await foldTranspose(this.cofCells, this.cof);

    /**
     * `foldTranspose` hanya MENERBANGKAN selnya; ia tidak menukar isinya.
     * Sel $(i,j)$ mendarat di slot $(j,i)$ sambil membawa nilai
     * `cof[i][j]`, jadi begitu animasinya selesai tiap slot $(k,l)$ harus
     * berisi `adj[k][l]` — lalu transformnya dinolkan. Urutannya penting:
     * menulis nilai lebih dulu, baru melepas transform, membuat pertukaran
     * posisinya tidak pernah terlihat "membatal".
     */
    this.cofCells.forEach((cell, key) => {
      const [i, j] = key.split(',').map(Number);
      const sign = cell.querySelector('.cof-cell__sign');
      const auto = cell.querySelector('.cof-cell__auto');
      cell.textContent = formatNumber(this.adj[i][j]);
      cell.dataset.value = String(this.adj[i][j]);
      // Cap air tanda TIDAK ikut ditranspose — ia milik posisi kofaktor,
      // dan setelah jadi adjoin ia sudah tidak berlaku lagi.
      if (sign) sign.remove();
      if (auto) auto.remove();
      cell.style.transform = '';
      if (window.gsap) window.gsap.set(cell, { x: 0, y: 0 });
      cell.classList.add('anim-flash-success');
      this.later(() => cell.classList.remove('anim-flash-success'), 620);
    });

    const nameEl = this.cofView.root.querySelector('.matrix__name');
    if (nameEl) nameEl.textContent = `adj(${this.name})`;
    this.cofView.grid.classList.remove('cof-grid');

    this.checklist.advance(2);
    this.setBusy(false);
    this.later(() => this.startAssembleStep(), 420);
  }

  /* ---------------- LANGKAH 4: perakitan akhir ---------------- */

  startAssembleStep() {
    this.setPrompt(
      `Langkah 4 — bawa chip $\\frac{1}{${formatNumber(this.det)}}$ ke **slot di depan kurung Adjoin**. Seret, atau ketuk chipnya lalu ketuk slotnya.`,
      'Langkah 4 dari 4'
    );

    // Slotnya sudah berdiri di depan kurung sejak langkah 2; sekarang ia
    // tinggal dinyalakan.
    this.scalarSlot.reveal();
    this.scalarSlot.classList.add('inv-scalar--open');

    this.track(registerDropZone(this.scalarSlot, {
      padding: 10,
      onDrop: () => this.placeScalar(),
    }));

    const chip = createInverseChip(this.det);
    this.scalarChip = chip;

    this.minorHost.innerHTML = '';
    this.minorHost.appendChild(stageRow(chip));
  }

  async placeScalar() {
    if (this.busy || this.assembled) return;
    if (!this.claim('assemble')) return;

    this.assembled = true;
    this.setBusy(true);

    const chipClone = makeFlyChip(this.scalarChip, { text: null });
    chipClone.innerHTML = this.scalarChip.innerHTML;
    await landOn(chipClone, this.scalarSlot, { text: null });

    this.scalarSlot.fill(this.det);
    this.scalarSlot.classList.remove('inv-scalar--open');
    this.scalarChip.dataset.dragDisabled = 'true';
    this.scalarChip.classList.add('is-spent');

    this.checklist.advance(3);
    this.setBusy(false);

    this.setPrompt(
      `$${this.name}^{-1} = \\dfrac{1}{${formatNumber(this.det)}}${toLatex(this.adj)}$ — inilah bentuk akhir yang kamu tulis di lembar jawaban.`,
      'Selesai'
    );
    this.complete();
  }

  destroy() {
    this.teardownStep();
    super.destroy();
  }
}

/* ============================================================
   7. equation_solver — persamaan matriks, dua langkah (Fase 16)

   Langkah 1 menguji LETAK invers; langkah 2 menagih hitungannya.
   Keduanya dua pelajaran yang berbeda, dan versi lama hanya
   mengajarkan yang pertama: begitu $A^{-1}$ mendarat di sisi yang
   benar, jawabannya langsung tercetak lengkap sebagai rumus. Siswa
   yang paham LETAK-nya tetap tidak pernah mengalikan apa pun.
   ============================================================ */
export class EquationSolverSim extends Simulation {
  build() {
    const { form, matrixA, matrixB, nameA = 'A', nameB = 'B' } = this.config;
    this.isLeftForm = form === 'AX=B';

    this.scaffold({
      brief: this.config.brief,
      promptText: `Bentuk soal: $${form.replace('=', ' = ')}$. Seret chip $${nameA}^{-1}$ ke sisi yang tepat pada **kedua ruas**.`,
      promptStep: 'Langkah 1 dari 2',
    });

    this.checklist = createChecklist([
      'Taruh $A^{-1}$ di sisi yang benar',
      'Hitung hasil perkaliannya',
    ]);
    this.addHint(this.checklist);

    this.subHint = el('div', 'inv3-subhint');
    this.addHint(this.subHint);

    this.logicHost = el('div', 'eqsolve-logic');
    this.stage.appendChild(this.logicHost);

    this.execHost = el('div', 'eqsolve-exec');
    this.stage.appendChild(this.execHost);

    this.buildLogicStep();
  }

  /* ---------------- LANGKAH 1: letak invers ---------------- */

  buildLogicStep() {
    const { nameA = 'A', nameB = 'B' } = this.config;

    this.eqHost = el('div', 'equation equation--solve');

    this.slotLeftA = el('div', 'equation__slot', '?');
    this.blockA = el('div', 'equation__block', nameA);
    this.blockX = el('div', 'equation__block', 'X');
    this.blockX.dataset.role = 'unknown';
    this.slotRightA = el('div', 'equation__slot', '?');

    const lhs = el('div', 'equation');
    if (this.isLeftForm) {
      lhs.append(this.slotLeftA, this.blockA, this.blockX, this.slotRightA);
    } else {
      lhs.append(this.slotLeftA, this.blockX, this.blockA, this.slotRightA);
    }

    this.slotLeftB = el('div', 'equation__slot', '?');
    this.blockB = el('div', 'equation__block', nameB);
    this.slotRightB = el('div', 'equation__slot', '?');

    const rhs = el('div', 'equation');
    rhs.append(this.slotLeftB, this.blockB, this.slotRightB);

    this.eqHost.append(lhs, el('div', 'matrix__name', '='), rhs);
    this.logicHost.appendChild(this.eqHost);

    const chip = el('div', 'symbol-chip symbol-chip--inv');
    chip.innerHTML = renderMixed(`$${nameA}^{-1}$`);
    makeDraggable(chip, { data: { inv: true } });
    this.chip = chip;

    this.logicHost.appendChild(stageRow(
      chip, el('span', 'text-sm text-muted', 'Seret ke slot yang tepat — atau ketuk chip lalu ketuk slotnya')
    ));

    // Empat slot: hanya satu SISI yang benar, dan harus di kedua ruas.
    [
      { node: this.slotLeftA, side: 'left' },
      { node: this.slotRightA, side: 'right' },
      { node: this.slotLeftB, side: 'left' },
      { node: this.slotRightB, side: 'right' },
    ].forEach(({ node, side }) => {
      this.track(registerDropZone(node, {
        padding: 8,
        onDrop: (data, sourceEl) => this.handleDrop(side, node, sourceEl),
      }));
    });

    this.placed = new Set();
  }

  handleDrop(side, node, sourceEl) {
    if (this.busy) return;

    const correctSide = this.isLeftForm ? 'left' : 'right';

    if (side !== correctSide) {
      // Chip memantul kembali DAN alasannya dijelaskan. Pantulan sendirian
      // hanya memberi tahu "salah", bukan "kenapa" (kontrak §5 butir 3).
      this.reject(sourceEl || this.chip, 'wrongSide');
      return;
    }

    const ruas = (node === this.slotLeftA || node === this.slotRightA) ? 'lhs' : 'rhs';
    if (this.placed.has(ruas)) return;

    node.innerHTML = renderMixed(`$${this.config.nameA}^{-1}$`);
    node.classList.add('equation__slot--filled', 'anim-flash-success');
    this.placed.add(ruas);

    if (this.placed.size < 2) {
      toast.warn(this.msg('oneSideOnly'));
      this.setPrompt(
        'Bagus — sekarang lakukan hal yang sama pada ruas satunya agar persamaan tetap seimbang.',
        'Langkah 1 dari 2'
      );
      return;
    }

    if (!this.claim('merge')) return;

    this.chip.dataset.dragDisabled = 'true';
    this.chip.classList.add('is-spent');
    this.runMerge();
  }

  async runMerge() {
    this.setBusy(true);
    this.setPrompt('$A^{-1}A$ melebur menjadi $I$, lalu lenyap — karena $I$ tidak mengubah apa pun.', 'Melebur…');

    const invBlock = this.isLeftForm ? this.slotLeftA : this.slotRightA;
    await mergeToIdentity(this.blockA, invBlock);

    /**
     * Slot yang TIDAK terpakai disembunyikan setelah peleburan.
     *
     * Kalau dibiarkan, persamaannya terbaca `X ? = A⁻¹ B ?` — dua tanda
     * tanya yang tidak lagi menunggu apa pun, tapi masih terlihat seperti
     * isian yang belum dikerjakan. `visibility: hidden`, bukan `remove()`:
     * ruangnya tetap dipesan supaya baris persamaan tidak mengempis tepat
     * saat siswa membaca hasilnya (kontrak §5 butir 14).
     */
    const sisa = this.isLeftForm
      ? [this.slotRightA, this.slotRightB]
      : [this.slotLeftA, this.slotLeftB];
    sisa.forEach((slot) => { slot.style.visibility = 'hidden'; });

    const { nameA = 'A', nameB = 'B' } = this.config;
    const solved = el('div', 'eqsolve-solved anim-rise');
    // ⚠️ SATU tanda dolar, bukan dua. `renderMixed()` hanya mengenali
    // `$…$`; regexnya (`\$([^$]+)\$`) tidak pernah cocok dengan `$$…$$`,
    // sehingga dolar pertama dan terakhir tertinggal sebagai teks mentah di
    // layar. Ukurannya diatur CSS, bukan oleh mode display KaTeX.
    solved.innerHTML = renderMixed(
      this.isLeftForm ? `$X = ${nameA}^{-1}${nameB}$` : `$X = ${nameB}${nameA}^{-1}$`
    );
    this.logicHost.appendChild(solved);

    this.checklist.advance(0);
    this.setBusy(false);
    this.later(() => this.startExecStep(), 700);
  }

  /* ---------------- LANGKAH 2: hitung hasilnya ---------------- */

  /**
   * ⚠️ Yang dipakai di sini adalah mesin PERKALIAN MATRIKS
   * (`MatrixMultiplySim`), bukan `PairwiseTapSim`.
   *
   * Keduanya mudah tertukar karena sama-sama "ketuk pasangan", tetapi
   * matematikanya berbeda: `PairwiseTapSim` memasangkan elemen SELETAK
   * ($a_{ij}$ dengan $b_{ij}$) — itu penjumlahan. $A^{-1}B$ menuntut
   * BARIS dikali KOLOM. Memakai mesin pasangan seletak di sini akan
   * mengajarkan operasi yang salah dengan sangat meyakinkan.
   */
  startExecStep() {
    const { matrixA, matrixB, nameA = 'A', nameB = 'B' } = this.config;

    const inv = inverse(matrixA);
    const first = this.isLeftForm ? inv : matrixB;
    const second = this.isLeftForm ? matrixB : inv;
    const firstName = this.isLeftForm ? `${nameA}⁻¹` : nameB;
    const secondName = this.isLeftForm ? nameB : `${nameA}⁻¹`;

    this.setPrompt(
      `Langkah 2 — sekarang hitung hasilnya sendiri. Ingat: **baris dikali kolom**, bukan elemen seletak.`,
      'Langkah 2 dari 2'
    );

    // Panggung langkah 1 diredupkan, tidak dihapus: siswa masih perlu
    // melihat bentuk yang baru ia turunkan sambil mengerjakannya.
    this.logicHost.classList.add('is-retired');

    const host = el('div');
    this.execHost.appendChild(host);

    const sub = new MultiplyStep(host, {
      cases: [{
        id: 'solve',
        label: 'Hitung X',
        nameA: firstName,
        nameB: secondName,
        matrixA: first,
        matrixB: second,
      }],
    }, this.config.multiplyToasts || this.toasts, () => this.onProductDone());

    sub.hintHost = this.subHint;
    this.sub = sub;
    sub.build();
  }

  onProductDone() {
    this.checklist.advance(1);

    const X = this.isLeftForm
      ? multiply(inverse(this.config.matrixA), this.config.matrixB)
      : multiply(this.config.matrixB, inverse(this.config.matrixA));

    this.setPrompt(
      `$X = ${toLatex(X)}$ — dan itu kamu hitung sendiri, bukan dibacakan rumus.`,
      'Selesai'
    );
    this.complete();
  }

  destroy() {
    if (this.sub) {
      this.sub.destroy();
      this.sub = null;
    }
    super.destroy();
  }
}
