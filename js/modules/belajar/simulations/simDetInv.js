/**
 * simDetInv.js — Simulasi Bab 3 (Determinan & Invers)
 * det2x2 · det3x3_sarrus · singular_check · property_calculator ·
 * inverse2x2 · adjoint_flow · matrix_equation
 */

import {
  Simulation, el, renderMatrix, stageRow, equationRow, operatorGlyph,
  createMeetPoint, createScalarResult, createFlowArrow, createChecklist,
  createScalarChip, clearHighlights, lockWrongOption,
  makeTappable, setCellsMuted, createStrikeLayer,
} from './simCore.js';
import {
  determinant, sarrusTerms, inverse, adjoint, cofactorMatrix, cofactor,
  minorMatrix, transpose, multiply, formatNumber, toLatex, toFractionText,
  scalarMultiply, identity,
} from '../../../engine/matrix.js';
import { renderMixed } from '../../../engine/katexRenderer.js';
import { icon } from '../../../ui/icons.js';
import { makeDraggable, registerDropZone } from '../../../interactions/dragDrop.js';
import { flyMergeLand, highlight, makeFlyChip, flyTo, merge, landOn } from '../../../interactions/flyToAnimation.js';
import { swapArc, flipSign, sweepScalar, slideCloneColumns, mergeToIdentity } from '../../../interactions/mergeAnimation.js';
import { attachMathpad } from '../../../ui/mathpad.js';
import toast from '../../../ui/toast.js';

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
    await new Promise((r) => setTimeout(r, 440));

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
    setTimeout(() => this.complete(), 500);
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

  updateExpr() {
    const fmt = (arr, cls) => arr.length
      ? arr.map((v) => `<span class="det-expr__term det-expr__term--${cls}">${formatNumber(v)}</span>`).join('<span class="det-expr__op">+</span>')
      : `<span class="det-expr__term det-expr__term--${cls} is-empty">…</span>`;

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
        ghosts.push(ghost);
        sources.push(source);
      }
    }

    await slideCloneColumns(sources, ghosts);

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
    await new Promise((r) => setTimeout(r, 440));

    // Tiga angka melebur menjadi satu hasil kali, lalu mendarat di ekspresi.
    const chips = wanted.map((c) => makeFlyChip(c, { text: c.dataset.value }));
    const anchor = this.expr.querySelector(`.det-expr__term--${slotCls}`);

    await Promise.all(chips.map((chip) => flyTo(chip, anchor)));
    const merged = await merge(chips, formatNumber(product), { operator: '×' });
    await landOn(merged, anchor, { text: null });

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
      setTimeout(() => this.complete(), 500);
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

    this.caseHost.innerHTML = '';
    this.verdictHost.innerHTML = '';
    this.setPrompt('Matriks ini singular atau non-singular?', `${this.index + 1} / ${this.config.cases.length}`);

    const m = renderMatrix(item.matrix, { name: 'M', showOrdo: true });
    this.caseHost.appendChild(m.root);

    const buttons = el('div', 'stage__row');
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
      return;
    }

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
    setTimeout(() => this.renderCase(), 2200);
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
      promptText: 'Seret kartu sifat yang tepat ke area kerja.',
      promptStep: `1 / ${this.config.problems.length}`,
    });

    this.problemHost = el('div');
    this.problemHost.style.cssText = 'width:100%;display:grid;gap:var(--sp-3)';
    this.stage.appendChild(this.problemHost);

    this.rulesHost = el('div');
    this.rulesHost.style.cssText = 'display:flex;flex-wrap:wrap;gap:var(--sp-2);justify-content:center';
    this.stage.appendChild(this.rulesHost);

    this.renderProblem();
  }

  renderProblem() {
    const problem = this.config.problems[this.index];
    if (!problem) return this.complete();

    this.problemHost.innerHTML = '';
    this.rulesHost.innerHTML = '';
    this.setPrompt(problem.prompt, `${this.index + 1} / ${this.config.problems.length}`);

    const work = el('div', 'dropzone');
    work.style.cssText = 'min-height:96px;width:100%;max-width:520px;margin-inline:auto';
    work.innerHTML = '<span>Jatuhkan kartu sifat di sini</span>';
    this.problemHost.appendChild(work);

    this.track(registerDropZone(work, {
      padding: 10,
      onDrop: (data, sourceEl) => this.applyRule(problem, data, sourceEl, work),
    }));

    this.config.rules.forEach((rule) => {
      const card = el('div', 'drag-card');
      card.innerHTML = renderMixed(`$${rule.tex}$`);
      makeDraggable(card, { data: { rule } });
      this.rulesHost.appendChild(card);
    });
  }

  applyRule(problem, data, sourceEl, work) {
    if (data.rule.key !== problem.rule) {
      const hintMap = {
        scalar: 'perkalian matriks dengan sebuah skalar',
        product: 'determinan dari hasil kali dua matriks',
        transpose: 'determinan dari matriks transpose',
        power: 'determinan matriks berpangkat',
        inverse: 'determinan matriks invers',
      };
      this.reject(sourceEl, 'wrongRule', { hint: hintMap[problem.rule] || 'sifat lain' });
      return;
    }

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

    toast.success(this.msg('success'));
    this.index += 1;
    setTimeout(() => this.renderProblem(), 2600);
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
    this.scaled = new Set();

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
      'Kalikan $\\frac{1}{\\det}$ ke tiap elemen',
    ]);
    // Checklist adalah PETUNJUK, bukan kanvas — ia ikut ke panel kendali.
    this.addHint(this.checklist);

    const m = renderMatrix(matrix, { name, showAddress: true });
    this.cells = m.cells;
    this.matrixView = m;

    this.strike = createStrikeLayer(m.grid);
    this.track(() => this.strike.destroy());

    // Ekspresi determinan yang tumbuh: (ad) − (bc) = …
    this.expr = el('div', 'det-expr');
    this.updateExpr();

    this.detCard = createScalarResult(`$\\det(${name})$`, null);

    this.stage.appendChild(stageRow(m.root));
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
    await new Promise((r) => setTimeout(r, 440));

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
      setTimeout(() => this.complete(), 400);
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

    // flipSign() juga menulis textContent dan dataset.value-nya sendiri.
    const flippedValue = -Number(cell.dataset.value);
    await flipSign(cell, formatNumber(flippedValue));
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

  /* ---------------- TAHAP 3: skalar 1/det ke SETIAP elemen ---------------- */

  startScalarStep() {
    this.setPrompt(
      `Tahap 3 — bawa chip $\\frac{1}{${formatNumber(this.det)}}$ ke **setiap elemen, satu per satu**. Seret, atau ketuk chipnya lalu ketuk selnya.`,
      `Tahap 3 dari 3 · 0/4 elemen`
    );

    const chip = createScalarChip(1 / this.det, `1/${formatNumber(this.det)}`);
    chip.classList.add('scalar-chip--fraction');
    makeDraggable(chip, { data: { scalar: 1 / this.det } });
    this.scalarChip = chip;

    this.scalarHost.innerHTML = '';
    this.scalarHost.appendChild(chip);

    // Setiap sel jadi drop-zone TERSENDIRI. Satu drop-zone untuk seluruh
    // matriks akan mengubah langkah ini jadi satu sapuan — persis yang
    // ingin dihindari: siswa harus menyentuh keempat elemen.
    this.cells.forEach((cell, key) => {
      this.track(registerDropZone(cell, {
        padding: 8,
        onDrop: () => this.applyScalar(cell, key),
      }));
      cell.classList.add('cell--invite');
    });
  }

  async applyScalar(cell, key) {
    if (this.busy) return;
    if (this.scaled.has(key)) {
      this.reject(cell, 'wrongTarget');
      return;
    }

    this.setBusy(true);
    this.scaled.add(key);
    cell.classList.remove('cell--invite');

    const [i, j] = key.split(',').map(Number);
    const value = Number(cell.dataset.value) / this.det;

    const chipClone = makeFlyChip(this.scalarChip, { text: this.scalarChip.textContent });
    await landOn(chipClone, cell, { text: null });

    cell.classList.add('cell--resolving');
    await new Promise((r) => setTimeout(r, 420));

    cell.innerHTML = '';
    cell.textContent = toFractionText(value);
    cell.dataset.value = String(value);
    cell.classList.remove('cell--resolving');
    cell.classList.add('cell--done', 'cell--fraction', 'anim-land');
    cell.appendChild(el('span', 'cell__addr', `a${i + 1}${j + 1}`));
    cell.appendChild(el('span', 'cell__check', icon('check', { size: 11 })));

    this.setBusy(false);

    if (this.scaled.size < 4) {
      this.setPrompt(
        `Bagus. Lanjut ke elemen berikutnya — setiap elemen harus dikalikan $\\frac{1}{${formatNumber(this.det)}}$.`,
        `Tahap 3 dari 3 · ${this.scaled.size}/4 elemen`
      );
      return;
    }

    this.finishInverse();
  }

  finishInverse() {
    this.scalarChip.dataset.dragDisabled = 'true';
    this.scalarChip.classList.add('is-spent');

    this.checklist.advance(2);

    const result = inverse(this.config.matrix);
    this.setPrompt(
      `$${this.config.name}^{-1} = ${toLatex(result, { fraction: true })}$ — coba buktikan $${this.config.name} \\times ${this.config.name}^{-1} = I$.`,
      'Selesai'
    );
    this.complete();
  }
}

/* ============================================================
   6. adjoint_flow — invers 3×3: SENGAJA DITANGGUHKAN (Fase 9)
   ============================================================ */

/**
 * Penampung sementara untuk invers 3×3.
 *
 * Versi sebelumnya meminta siswa mengisi sembilan kofaktor lewat Mathpad
 * sambil ditunjukkan sub-matriks DAN determinannya sekaligus — praktis
 * menyalin angka, bukan menghitung. Mekanik penggantinya (minor → kofaktor →
 * adjoin → skalar, seluruhnya dikerjakan siswa) dibangun di Fase 9.
 *
 * Sampai saat itu, sub-topiknya tetap terbuka: materi dan Mini Kuis-nya utuh,
 * dan `onComplete()` dipanggil agar siswa tidak terjebak di layar buntu.
 * Menampilkan simulasi setengah jadi lebih merugikan daripada mengatakan
 * terus terang bahwa bagian ini sedang dikerjakan.
 */
export class AdjointFlowSim extends Simulation {
  build() {
    const { matrix, name = 'A' } = this.config;

    // Tetap memakai kerangka .sim/.stage yang standar, supaya struktur DOM
    // sub-topik ini tidak menyimpang dari yang lain hanya karena isinya beda.
    this.scaffold({
      brief: this.config.brief,
      promptText: 'Bagian ini sedang dibangun — silakan lanjut ke Mini Kuis.',
      promptStep: 'Menunggu Fase 9',
    });

    const card = el('div', 'wip-card anim-rise');

    const mark = el('div', 'wip-card__mark', icon('clock', { size: 28 }));
    card.appendChild(mark);

    card.appendChild(el('div', 'wip-card__title', 'Simulasi sedang dibangun'));
    card.appendChild(el('p', 'wip-card__text', renderMixed(
      `Simulasi langkah-demi-langkah untuk **invers matriks $3\\times3$** sedang disiapkan. ` +
      `Materi dan Mini Kuis di sub-topik ini tetap bisa kamu kerjakan seperti biasa.`
    )));

    // Matriks soalnya tetap ditampilkan supaya halaman ini tidak terasa kosong
    // dan siswa tahu kasus mana yang nanti akan dikerjakan.
    const m = renderMatrix(matrix, { name, showOrdo: true });
    card.appendChild(stageRow(m.root));

    card.appendChild(el('p', 'wip-card__hint', renderMixed(
      `Untuk sekarang, latih dulu **invers $2\\times2$** — polanya sama, hanya ukurannya berbeda.`
    )));

    this.stage.appendChild(card);

    // Sub-topik tidak boleh terkunci gara-gara simulasinya belum ada.
    // `finished` disetel agar complete() tidak memasang banner "selesai"
    // yang menyesatkan — tidak ada yang dikerjakan di sini.
    this.finished = true;
    this.onComplete();
  }
}

/* ============================================================
   7. matrix_equation — pertemukan invers
   ============================================================ */
export class MatrixEquationSim extends Simulation {
  build() {
    const { form, matrixA, matrixB, nameA = 'A', nameB = 'B' } = this.config;
    this.isLeftForm = form === 'AX=B';

    this.scaffold({
      brief: this.config.brief,
      promptText: `Bentuk soal: $${form.replace('=', ' = ')}$. Seret chip $${nameA}^{-1}$ ke sisi yang tepat pada **kedua ruas**.`,
      promptStep: 'Langkah 1',
    });

    this.eqHost = el('div', 'equation');
    this.eqHost.style.cssText += 'width:100%;gap:var(--sp-3)';

    // Slot kiri & kanan pada masing-masing ruas.
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
    this.stage.appendChild(this.eqHost);

    const chip = el('div', 'symbol-chip');
    chip.innerHTML = renderMixed(`$${nameA}^{-1}$`);
    chip.style.minWidth = '72px';
    makeDraggable(chip, { data: { inv: true } });
    this.chip = chip;

    this.stage.appendChild(stageRow(chip, el('span', 'text-sm text-muted', 'Seret ke slot yang tepat')));
    this.resultHost = el('div', 'stage__row');
    this.stage.appendChild(this.resultHost);

    // Empat slot: hanya satu SISI yang benar, dan harus di kedua ruas.
    [
      { node: this.slotLeftA, side: 'left', ruas: 'lhs' },
      { node: this.slotRightA, side: 'right', ruas: 'lhs' },
      { node: this.slotLeftB, side: 'left', ruas: 'rhs' },
      { node: this.slotRightB, side: 'right', ruas: 'rhs' },
    ].forEach(({ node, side }) => {
      this.track(registerDropZone(node, {
        padding: 8,
        onDrop: (data, sourceEl) => this.handleDrop(side, node, sourceEl),
      }));
    });

    this.placed = new Set();
  }

  handleDrop(side, node, sourceEl) {
    const correctSide = this.isLeftForm ? 'left' : 'right';

    if (side !== correctSide) {
      this.reject(sourceEl, 'wrongSide');
      return;
    }

    node.innerHTML = renderMixed(`$${this.config.nameA}^{-1}$`);
    node.style.borderStyle = 'solid';
    node.style.borderColor = 'var(--success)';
    node.classList.add('anim-flash-success');
    this.placed.add(node === this.slotLeftA || node === this.slotRightA ? 'lhs' : 'rhs');

    if (this.placed.size < 2) {
      toast.warn(this.msg('oneSideOnly'));
      this.setPrompt('Bagus — sekarang lakukan hal yang sama pada ruas satunya agar persamaan tetap seimbang.', 'Langkah 2');
      return;
    }

    this.chip.dataset.dragDisabled = 'true';
    this.chip.style.opacity = '.4';
    this.runMerge();
  }

  async runMerge() {
    this.setPrompt('$A^{-1}A$ melebur menjadi $I$, lalu lenyap karena $I$ tidak mengubah apa pun.', 'Melebur…');

    const invBlock = this.isLeftForm ? this.slotLeftA : this.slotRightA;
    await mergeToIdentity(this.blockA, invBlock);

    this.showSolution();
  }

  showSolution() {
    const { matrixA, matrixB, nameA, nameB } = this.config;
    const inv = inverse(matrixA);
    const X = this.isLeftForm ? multiply(inv, matrixB) : multiply(matrixB, inv);

    const expr = this.isLeftForm
      ? `X = ${nameA}^{-1}${nameB} = ${toLatex(inv, { fraction: true })} ${toLatex(matrixB)} = ${toLatex(X)}`
      : `X = ${nameB}${nameA}^{-1} = ${toLatex(matrixB)} ${toLatex(inv, { fraction: true })} = ${toLatex(X)}`;

    const box = el('div', 'explain anim-rise');
    box.innerHTML = `<div class="explain__title">Penyelesaian</div>${renderMixed(`$$${expr}$$`)}`;
    this.resultHost.appendChild(box);

    this.setPrompt('$X$ berhasil berdiri sendiri dan nilainya ditemukan.', 'Selesai');
    this.complete();
  }
}
