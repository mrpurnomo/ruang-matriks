/**
 * simOperations.js — Simulasi Bab 2 (Operasi Aljabar)
 * elementwise_op · scalar_sweep · combo_op · ordo_check · matrix_multiply · property_cards
 */

import {
  Simulation, el, renderMatrix, rowCells, colCells, clearHighlights,
  stageRow, equationRow, operatorGlyph, createMeetPoint, createScalarChip,
  createFlowArrow, createChecklist, lockWrongOption, makeTappable, setCellsMuted,
  createBrief, createPrompt, createStage, createColorLegend,
} from './simCore.js';
import {
  add, subtract, multiply, multiplyTerms, scalarMultiply,
  transpose, formatNumber, ordoText, ordo, toLatex,
} from '../../../engine/matrix.js';
import { canAddSubtract, canMultiply } from '../../../engine/validator.js';
import { renderMixed } from '../../../engine/katexRenderer.js';
import { icon } from '../../../ui/icons.js';
import { makeDraggable, registerDropZone, getTapSource, clearTapSelection } from '../../../interactions/dragDrop.js';
import { flyMergeLand, highlight, makeFlyChip, landOn, showDragCue, hideDragCue } from '../../../interactions/flyToAnimation.js';
import toast from '../../../ui/toast.js';
import { parseRational, mulR, toText, toLatexR } from '../../../engine/rational.js';

/* ============================================================
   1. elementwise_op — horizontal A [op] B = C, + demo ordo ditolak
   ============================================================ */
export class ElementwiseOpSim extends Simulation {
  build() {
    // Di sandbox Whiteboard, siswa sudah memilih ordonya sendiri, jadi slide
    // demo "ordo berbeda ditolak" dilewati dan langsung ke tahap hitung.
    this.skipOrdo = this.config.skipOrdoSlide === true;
    this.slide = this.skipOrdo ? 1 : 0;
    if (this.skipOrdo) this.ordoUnderstood = true;

    this.scaffold({
      brief: this.config.brief,
      promptText: '',
      promptStep: 'Langkah 1',
    });

    if (this.skipOrdo) {
      this.renderSlide();
      return;
    }

    this.useSteps(['Syarat ordo', 'Hitung elemen seletak'], {
      allowJump: true,
      onJump: (index) => {
        if (index > this.maxSlide()) return;
        this.slide = index;
        this.renderSlide();
      },
    });

    this.renderSlide();
  }

  maxSlide() {
    return this.ordoUnderstood ? 1 : 0;
  }

  renderSlide() {
    this.setStep(this.slide);
    this.resetStage();
    if (this.slide === 0) this.renderOrdoSlide();
    else this.renderComputeSlide();
  }

  /* --- Slide 1: mengapa ordo berbeda DITOLAK --- */
  renderOrdoSlide() {
    const bad = this.config.mismatchExample;
    this.setPrompt(
      'Sebelum menghitung, cek syaratnya. Coba jumlahkan dua matriks berikut — apa yang terjadi?',
      'Langkah 1 dari 2'
    );

    const A = renderMatrix(bad.matrixA, { name: 'P', showOrdo: true });
    const B = renderMatrix(bad.matrixB, { name: 'Q', showOrdo: true });
    const slot = el('div', 'result-slot', '?');

    this.stage.appendChild(equationRow(
      A.root, operatorGlyph('+'), B.root, operatorGlyph('='), slot
    ));

    const btn = el('button', 'btn btn--primary');
    btn.type = 'button';
    btn.innerHTML = `${icon('zap', { size: 17 })}<span>Coba Jumlahkan</span>`;

    const verdict = el('div', 'stage__row');

    btn.addEventListener('click', () => {
      btn.disabled = true;
      slot.classList.add('result-slot--rejected');
      slot.innerHTML = icon('x-circle', { size: 26 });
      [A.bracket, B.bracket].forEach((n) => {
        n.classList.add('shake');
        setTimeout(() => n.classList.remove('shake'), 420);
      });

      const check = canAddSubtract(bad.matrixA, bad.matrixB, 'dijumlahkan');
      toast.error(check.reason);

      const box = el('div', 'callout callout--warn anim-rise');
      box.style.maxWidth = '620px';
      box.innerHTML = `
        <span class="callout__icon">${icon('alert-triangle')}</span>
        <div class="callout__body">
          <div class="callout__title">Tidak bisa dijumlahkan</div>
          <div class="callout__text">
            ${renderMixed(`Ordo $P$ adalah **${ordoText(bad.matrixA)}**, sedangkan ordo $Q$ adalah **${ordoText(bad.matrixB)}**. Elemen $p_{13}$ tidak punya pasangan seletak di $Q$ — jadi operasinya berhenti di sini.`)}
          </div>
        </div>`;
      verdict.appendChild(box);

      const next = el('button', 'btn btn--success btn--pulse');
      next.type = 'button';
      next.innerHTML = `<span>Paham — lanjut ke matriks yang ordonya sama</span>${icon('arrow-right', { size: 17 })}`;
      next.addEventListener('click', () => {
        this.ordoUnderstood = true;
        this.markStepDone(0);
        this.slide = 1;
        this.renderSlide();
      });
      verdict.appendChild(next);
    });

    this.stage.appendChild(stageRow(btn));
    this.stage.appendChild(verdict);
  }

  /* --- Slide 2: satu sel hasil dikerjakan tuntas, satu per satu --- */
  /**
   * Alurnya sengaja MENCERMINKAN perkalian matriks, supaya siswa mengenali
   * satu pola kerja yang sama di kedua operasi:
   *
   *   1. Ketuk/seret elemen di $A$ → pasangan seletaknya di $B$ menyala,
   *      dan SEMUA sel lain diredupkan supaya tidak ada tebakan liar.
   *   2. Bawa pasangan dari $B$ ke sel hasil → sel itu menampilkan $(6+1)$.
   *   3. Tombol hitung baru muncul setelah pasangannya lengkap; menekannya
   *      barulah memunculkan angka hasilnya.
   *
   * Versi sebelumnya menerima dua elemen dalam urutan bebas ke satu titik
   * temu dan langsung menulis hasilnya — cepat, tapi melompati momen di mana
   * siswa melihat bentuk $(6+1)$ sebelum ia menjadi $7$.
   */
  renderComputeSlide() {
    const { matrixA, matrixB, operator = '+', nameA = 'A', nameB = 'B' } = this.config;

    this.pending = null;        // elemen A yang sedang menunggu pasangannya
    this.activeCell = null;     // sel hasil yang sedang dibangun
    this.doneCount = 0;
    this.result = operator === '+' ? add(matrixA, matrixB) : subtract(matrixA, matrixB);
    this.total = matrixA.length * matrixA[0].length;
    this.completed = new Set();

    this.setPrompt(
      'Ordo keduanya sama, jadi boleh. Ketuk satu elemen di **$A$** untuk memulai.',
      `0 / ${this.total} sel`
    );

    const a = renderMatrix(matrixA, { name: nameA, draggable: true, showAddress: true, showOrdo: true });
    const b = renderMatrix(matrixB, { name: nameB, draggable: true, showAddress: true, addressPrefix: 'b', showOrdo: true });
    const c = renderMatrix(this.result, { name: 'C', empty: true, showAddress: true, addressPrefix: 'c', showOrdo: true });

    this.cellsA = a.cells;
    this.cellsB = b.cells;
    this.cellsC = c.cells;

    this.stage.appendChild(equationRow(
      a.root, operatorGlyph(operator), b.root, operatorGlyph('='), c.root
    ));

    // Papan kerja bertinggi TETAP: munculnya tombol hitung tidak boleh
    // menggeser matriks di atasnya.
    this.work = el('div', 'workstrip');
    this.work.innerHTML = '<span class="workstrip__idle">Ketuk elemen di A untuk mulai</span>';

    this.confirmBtn = el('button', 'btn btn--success btn--pulse workstrip__confirm');
    this.confirmBtn.type = 'button';
    this.confirmBtn.innerHTML = `${icon('check', { size: 17 })}<span>Hitung Sel Ini</span>`;
    this.confirmBtn.hidden = true;
    this.confirmBtn.addEventListener('click', () => this.finishCell());

    const workRow = el('div', 'workstrip-row');
    workRow.append(this.work, this.confirmBtn);
    this.stage.appendChild(workRow);

    // Dua jalur yang setara: seret ATAU ketuk. Keduanya bermuara ke fungsi
    // yang sama, jadi animasinya identik.
    this.wireDrag(this.cellsA, 'A');
    this.wireDrag(this.cellsB, 'B');

    this.cellsA.forEach((cell, key) => {
      const [row, col] = key.split(',').map(Number);
      this.track(makeTappable(cell, () => this.pickFromA({ row, col, value: Number(cell.dataset.value) }, cell),
        `Elemen A baris ${row + 1} kolom ${col + 1}`));
    });

    this.cellsB.forEach((cell, key) => {
      const [row, col] = key.split(',').map(Number);
      this.track(makeTappable(cell, () => this.pickFromB({ row, col, value: Number(cell.dataset.value) }, cell),
        `Elemen B baris ${row + 1} kolom ${col + 1}`));
    });

    // Semua sel A mengundang sampai salah satunya dipilih.
    this.cellsA.forEach((cell) => cell.classList.add('cell--invite'));

    const labels = [];
    this.cellOrder = [];
    this.result.forEach((row, i) => row.forEach((_, j) => {
      labels.push(`Sel c${i + 1}${j + 1}`);
      this.cellOrder.push([i, j]);
    }));

    this.useSteps(labels, {
      allowJump: true,
      onJump: (index) => {
        const t = this.cellOrder[index];
        if (!t) return;
        if (this.completed.has(`${t[0]},${t[1]}`)) {
          toast.info(`Sel $c_{${t[0] + 1}${t[1] + 1}}$ sudah selesai.`);
        }
      },
    });
  }

  wireDrag(cells, which) {
    cells.forEach((cell, key) => {
      const [row, col] = key.split(',').map(Number);
      makeDraggable(cell, { data: { which, row, col, value: Number(cell.dataset.value) } });
    });
  }

  /* ---------------- Langkah 1: pilih elemen di A ---------------- */
  pickFromA(data, sourceEl) {
    if (this.busy) return;
    if (this.slide !== 1) return;

    const operator = this.config.operator || '+';
    const key = `${data.row},${data.col}`;

    if (this.completed.has(key)) {
      toast.info(`Sel $c_{${data.row + 1}${data.col + 1}}$ sudah selesai.`);
      return;
    }

    if (this.pending) {
      // Sudah ada elemen A terpilih: ketukan ini memindahkan pilihan, bukan
      // menumpuknya — selama selnya belum dibangun.
      if (this.pending.data.row === data.row && this.pending.data.col === data.col) return;
      this.clearSelection();
    }

    this.pending = { data, el: sourceEl };
    this.activeCell = { i: data.row, j: data.col };

    // Redupkan semuanya, lalu nyalakan HANYA pasangan seletaknya. Ini yang
    // membuat aturan "seletak" terlihat, bukan sekadar dibaca.
    setCellsMuted([...this.cellsA.values()], true);
    setCellsMuted([...this.cellsB.values()], true);
    this.cellsA.forEach((c) => c.classList.remove('cell--invite'));

    sourceEl.classList.remove('cell--muted');
    sourceEl.classList.add('cell--pulse');

    const partner = this.cellsB.get(key);
    partner.classList.remove('cell--muted');
    partner.classList.add('cell--pulse', 'cell--invite');
    delete partner.dataset.dragDisabled;

    const target = this.cellsC.get(key);
    target.classList.add('cell--target');

    // Sel hasil menerima jatuhan langsung — pasangan dibawa ke tempat
    // hasilnya lahir, bukan ke titik temu terpisah.
    if (this.releaseTargetZone) this.releaseTargetZone();
    this.releaseTargetZone = registerDropZone(target, {
      padding: 14,
      onDrop: (dropData, el2) => this.handleDrop(dropData, el2),
    });
    this.track(this.releaseTargetZone);

    const stepIndex = this.cellOrder.findIndex(([r, cc]) => r === data.row && cc === data.col);
    if (stepIndex >= 0) this.setStep(stepIndex);

    this.updateWorkstrip();

    this.setPrompt(
      `Menghitung $c_{${data.row + 1}${data.col + 1}}$ — sekarang bawa pasangan **seletaknya dari $${this.config.nameB || 'B'}$** ` +
      `(yang sedang berkedip) ke sel hasil yang **berwarna kuning**.`,
      `${this.completed.size} / ${this.total} sel`
    );

    if (operator === '-') {
      toast.info('Ingat urutannya: elemen $A$ dulu, baru dikurangi elemen $B$.');
    }
  }

  /* ---------------- Langkah 2: pasangan dari B ---------------- */
  pickFromB(data, sourceEl) {
    if (this.busy) return;

    if (!this.pending) {
      this.reject(sourceEl, 'startFromA');
      return;
    }

    this.handleDrop({ which: 'B', ...data }, sourceEl);
  }

  handleDrop(data, sourceEl) {
    if (this.busy) return;

    if (!this.pending) {
      this.reject(sourceEl, 'startFromA');
      return;
    }

    if (data.which === 'A') {
      this.reject(sourceEl, 'needPartner', {
        ai: this.pending.data.row + 1, aj: this.pending.data.col + 1,
      });
      return;
    }

    const first = this.pending.data;
    if (first.row !== data.row || first.col !== data.col) {
      this.reject(sourceEl, 'notAligned', {
        ai: first.row + 1, aj: first.col + 1, bi: data.row + 1, bj: data.col + 1,
        ordoA: ordoText(this.config.matrixA), ordoB: ordoText(this.config.matrixB),
      });
      return;
    }

    this.acceptPartner(data, sourceEl);
  }

  async acceptPartner(data, sourceEl) {
    this.setBusy(true);
    clearTapSelection();

    const { i, j } = this.activeCell;
    const target = this.cellsC.get(`${i},${j}`);
    const operator = this.config.operator || '+';

    // Salinan elemen terbang ke sel hasil — gerakan yang sama untuk seret
    // maupun ketuk.
    const chip = makeFlyChip(sourceEl, { text: sourceEl.dataset.value });
    await landOn(chip, target, { text: null });

    this.partner = { data, el: sourceEl };

    // Sel hasil menampilkan BENTUKNYA dulu: (6+1), belum 7.
    const expr = `(${formatNumber(this.pending.data.value)}${operator}${formatNumber(data.value)})`;
    target.textContent = '';
    target.appendChild(el('span', 'cell__expr', expr));
    target.classList.add('cell--building');

    sourceEl.classList.remove('cell--invite');
    sourceEl.classList.add('cell--spent');
    this.pending.el.classList.add('cell--spent');

    this.updateWorkstrip(expr);
    this.setBusy(false);

    this.setPrompt(
      `Bentuknya sudah lengkap: $${expr.replace('(', '').replace(')', '')}$. ` +
      `Tekan **Hitung Sel Ini** untuk menyelesaikannya.`,
      `${this.completed.size} / ${this.total} sel`
    );
  }

  updateWorkstrip(expr) {
    if (!this.activeCell) {
      this.work.innerHTML = '<span class="workstrip__idle">Ketuk elemen di A untuk mulai</span>';
      this.confirmBtn.hidden = true;
      return;
    }

    const { i, j } = this.activeCell;
    const shown = expr || (this.pending ? `${formatNumber(this.pending.data.value)} …` : '…');
    this.work.innerHTML = `
      <span class="workstrip__label">${renderMixed(`$c_{${i + 1}${j + 1}}$`)} =</span>
      <span class="workstrip__expr">${shown}</span>`;

    // Tombol hitung HANYA muncul setelah pasangannya lengkap.
    this.confirmBtn.hidden = !this.partner;
  }

  /* ---------------- Langkah 3: hitung & terbangkan hasilnya ---------------- */
  async finishCell() {
    if (this.busy || !this.activeCell || !this.partner) return;

    this.setBusy(true);
    this.confirmBtn.hidden = true;

    const { i, j } = this.activeCell;
    const target = this.cellsC.get(`${i},${j}`);
    const value = this.result[i][j];

    target.classList.add('cell--resolving');
    await new Promise((r) => setTimeout(r, 420));

    target.innerHTML = '';
    target.textContent = formatNumber(value);
    target.classList.remove('cell--resolving', 'cell--building', 'cell--target');
    target.classList.add('cell--done', 'anim-land');
    target.appendChild(el('span', 'cell__addr', `c${i + 1}${j + 1}`));
    target.appendChild(el('span', 'cell__check', icon('check', { size: 11 })));

    this.completed.add(`${i},${j}`);
    this.doneCount = this.completed.size;

    const stepIndex = this.cellOrder.findIndex(([r, cc]) => r === i && cc === j);
    if (stepIndex >= 0) this.markStepDone(stepIndex);

    const done = this.msg('cellDone', { row: i + 1, col: j + 1 });
    if (done) toast.success(done);

    this.clearSelection();
    this.setBusy(false);

    if (this.completed.size >= this.total) {
      this.markStepDone(1);
      this.setPrompt('Seluruh sel matriks hasil terisi.', 'Selesai');
      this.complete();
      return;
    }

    this.setPrompt(
      'Ketuk elemen berikutnya di **$A$** untuk menghitung sel hasil yang lain.',
      `${this.completed.size} / ${this.total} sel`
    );
  }

  /** Lepaskan seluruh sorotan & kuncian, kembalikan panggung ke keadaan siaga. */
  clearSelection() {
    this.pending = null;
    this.partner = null;
    this.activeCell = null;

    if (this.releaseTargetZone) {
      this.releaseTargetZone();
      this.releaseTargetZone = null;
    }

    setCellsMuted([...this.cellsA.values()], false);
    setCellsMuted([...this.cellsB.values()], false);

    [this.cellsA, this.cellsB].forEach((map) => map.forEach((c) => {
      c.classList.remove('cell--pulse', 'cell--invite', 'cell--spent');
    }));

    this.cellsC.forEach((c, key) => {
      if (!this.completed.has(key)) c.classList.remove('cell--target');
    });

    // Sel A yang selnya sudah selesai tidak mengundang lagi.
    this.cellsA.forEach((c, key) => {
      if (!this.completed.has(key)) c.classList.add('cell--invite');
    });

    this.updateWorkstrip();
  }
}

/* ============================================================
   2. scalar_sweep — skalar diseret ke SETIAP elemen, satu per satu
   ============================================================ */
export class ScalarSweepSim extends Simulation {
  build() {
    const { scalar, matrix, name = 'M' } = this.config;

    // Aritmetika EKSAK: kalau skalar atau elemennya pecahan, hasilnya tetap
    // pecahan yang sudah disederhanakan — bukan desimal berekor panjang.
    this.scalarR = parseRational(this.config.scalarText != null ? this.config.scalarText : scalar);
    const sourceText = this.config.matrixText || matrix.map((r) => r.map(String));
    this.cellR = sourceText.map((row) => row.map((v) => parseRational(v)));
    this.resultR = this.cellR.map((row) => row.map((r) => mulR(this.scalarR, r)));

    this.result = this.resultR.map((row) => row.map((r) => r.n / r.d));
    this.done = new Set();
    this.total = matrix.length * matrix[0].length;

    this.scaffold({
      brief: this.config.brief,
      promptText: `Seret chip $${scalar}$ ke **satu elemen** matriks. Ulangi untuk setiap elemen.`,
      promptStep: `0 / ${this.total} elemen`,
      legend: [
        { tone: 'amber', label: 'Kuning = chip skalar' },
        { tone: 'blue', label: 'Biru = elemen yang belum dikali' },
      ],
    });

    const source = renderMatrix(matrix, { name, showAddress: true });
    const target = renderMatrix(this.result, { name: `${toText(this.scalarR)}${name}`, empty: true, showAddress: true });
    this.sourceCells = source.cells;
    this.targetCells = target.cells;

    // Tampilkan nilai asli sebagai teks (agar 1/2 tidak jadi 0.5).
    this.cellR.forEach((row, i) => row.forEach((r, j) => {
      const cell = source.cells.get(`${i},${j}`);
      cell.textContent = toText(r);
      cell.dataset.value = toText(r);
    }));

    // Chip skalar bisa dipakai berkali-kali — ia tidak habis setelah sekali seret.
    this.chip = createScalarChip(scalar, toText(this.scalarR));
    makeDraggable(this.chip, { data: { scalar }, reusable: true });

    this.stage.appendChild(equationRow(
      this.chip, operatorGlyph('×'), source.root, operatorGlyph('='), target.root
    ));

    this.stage.appendChild(el('p', 'text-sm text-muted',
      'Chip skalar tidak habis — seret ulang untuk elemen berikutnya.'));

    // Setiap sel adalah drop-zone tersendiri.
    matrix.forEach((row, i) => {
      row.forEach((_, j) => {
        const cell = this.sourceCells.get(`${i},${j}`);
        cell.classList.add('cell--awaiting');
        this.track(registerDropZone(cell, {
          padding: 4,
          onDrop: () => this.multiplyCell(i, j),
        }));
      });
    });
  }

  async multiplyCell(i, j) {
    if (this.busy) return;
    const key = `${i},${j}`;
    if (this.done.has(key)) {
      toast.info(`Elemen baris ${i + 1} kolom ${j + 1} sudah dikalikan.`);
      return;
    }

    this.setBusy(true);

    const source = this.sourceCells.get(key);
    const target = this.targetCells.get(key);
    const exact = this.resultR[i][j];
    const shown = toText(exact);

    source.classList.add('cell--pulse');

    const chip = makeFlyChip(source, { text: source.dataset.value });
    await landOn(chip, target, { text: shown });
    target.dataset.value = shown;
    if (!Number.isInteger(exact.n / exact.d)) target.classList.add('cell--fraction');

    source.classList.remove('cell--pulse', 'cell--awaiting');
    source.classList.add('cell--spent');
    source.dataset.dropDisabled = 'true';

    target.classList.add('cell--done');
    target.appendChild(el('span', 'cell__check', icon('check', { size: 11 })));

    this.done.add(key);
    this.setBusy(false);

    this.setPrompt(
      `Bagus. $${toLatexR(this.scalarR)} \\times ${toLatexR(this.cellR[i][j])} = ${toLatexR(exact)}$. Lanjut ke elemen berikutnya.`,
      `${this.done.size} / ${this.total} elemen`
    );

    if (this.done.size >= this.total) {
      this.chip.dataset.dragDisabled = 'true';
      this.setPrompt('Setiap elemen sudah dikalikan satu per satu — itulah arti perkalian skalar.', 'Selesai');
      this.complete();
    }
  }
}

/* ============================================================
   3. combo_op — skalar manual, LALU penjumlahan manual (tanpa otomatis)
   ============================================================ */
export class ComboOpSim extends Simulation {
  build() {
    const { matrixA, matrixB, scalarA, operator, expression } = this.config;

    this.scaledA = scalarMultiply(scalarA, matrixA);
    this.finalResult = operator === '+'
      ? add(this.scaledA, matrixB)
      : subtract(this.scaledA, matrixB);

    this.phase = 0;
    this.scalarDone = new Set();
    this.sumDone = new Set();
    this.totalCells = matrixA.length * matrixA[0].length;
    this.pending = null;

    this.scaffold({
      brief: this.config.brief,
      promptText: `Tahap 1 — seret chip $${scalarA}$ ke setiap elemen $A$, satu per satu.`,
      promptStep: `Tahap 1 · 0 / ${this.totalCells}`,
    });

    this.checklist = createChecklist([
      `Kalikan setiap elemen $A$ dengan $${scalarA}$ (manual)`,
      `Jumlahkan hasilnya dengan $B$ elemen demi elemen (manual)`,
    ]);
    this.addHint(this.checklist);

    const a = renderMatrix(matrixA, { name: 'A', showAddress: true });
    const b = renderMatrix(matrixB, { name: 'B', showAddress: true, addressPrefix: 'b' });
    const c = renderMatrix(this.finalResult, { name: 'Hasil', empty: true, showAddress: true, addressPrefix: 'c' });

    this.cellsA = a.cells;
    this.cellsB = b.cells;
    this.cellsC = c.cells;
    this.viewA = a;

    this.chip = createScalarChip(scalarA);
    makeDraggable(this.chip, { data: { scalar: scalarA }, reusable: true });

    this.stage.appendChild(equationRow(
      this.chip, operatorGlyph('×'), a.root, operatorGlyph(operator), b.root, operatorGlyph('='), c.root
    ));

    this.meet = createMeetPoint({ operator, hint: 'Titik temu' });
    this.meetRow = stageRow(this.meet);
    this.meetRow.style.display = 'none';
    this.stage.appendChild(this.meetRow);

    matrixA.forEach((row, i) => {
      row.forEach((_, j) => {
        const cell = this.cellsA.get(`${i},${j}`);
        cell.classList.add('cell--awaiting');
        this.track(registerDropZone(cell, {
          padding: 4,
          onDrop: () => this.scaleCell(i, j),
        }));
      });
    });
  }

  async scaleCell(i, j) {
    if (this.busy || this.phase !== 0) return;
    const key = `${i},${j}`;
    if (this.scalarDone.has(key)) return;

    this.setBusy(true);
    const cell = this.cellsA.get(key);
    const value = this.scaledA[i][j];

    cell.classList.add('cell--pulse');
    await new Promise((r) => setTimeout(r, 220));

    cell.textContent = formatNumber(value);
    cell.dataset.value = String(value);
    cell.classList.remove('cell--pulse', 'cell--awaiting');
    cell.classList.add('anim-flash-success');
    setTimeout(() => cell.classList.remove('anim-flash-success'), 620);

    this.scalarDone.add(key);
    this.setBusy(false);

    this.setPrompt(
      `Tahap 1 — lanjutkan ke elemen $A$ berikutnya.`,
      `Tahap 1 · ${this.scalarDone.size} / ${this.totalCells}`
    );

    if (this.scalarDone.size >= this.totalCells) this.startSumPhase();
  }

  /** Tahap 2 TIDAK otomatis — siswa tetap harus menyeret pasangannya. */
  startSumPhase() {
    this.phase = 1;
    this.checklist.advance(0);
    this.chip.dataset.dragDisabled = 'true';
    this.chip.classList.add('is-spent');
    this.meetRow.style.display = '';
    this.meet.dataset.awaiting = 'true';

    this.setPrompt(
      `Tahap 2 — sekarang **kamu sendiri** yang menjumlahkan: seret pasangan elemen seletak dari $A$ dan $B$ ke titik temu.`,
      `Tahap 2 · 0 / ${this.totalCells}`
    );

    this.track(registerDropZone(this.meet, {
      padding: 12,
      onDrop: (data, sourceEl) => this.handleSumDrop(data, sourceEl),
    }));

    this.cellsA.forEach((cell, key) => {
      const [row, col] = key.split(',').map(Number);
      cell.classList.add('cell--draggable');
      makeDraggable(cell, { data: { which: 'A', row, col, value: Number(cell.dataset.value) } });
    });
    this.cellsB.forEach((cell, key) => {
      const [row, col] = key.split(',').map(Number);
      cell.classList.add('cell--draggable');
      makeDraggable(cell, { data: { which: 'B', row, col, value: Number(cell.dataset.value) } });
    });
  }

  handleSumDrop(data, sourceEl) {
    if (this.busy || this.phase !== 1) return;

    if (!this.pending) {
      this.pending = { data, el: sourceEl };
      sourceEl.classList.add('cell--pulse');
      delete this.meet.dataset.awaiting;
      return;
    }

    if (this.pending.data.which === data.which ||
        this.pending.data.row !== data.row ||
        this.pending.data.col !== data.col) {
      this.reject(sourceEl, 'notAligned', {
        ai: this.pending.data.row + 1, aj: this.pending.data.col + 1,
        bi: data.row + 1, bj: data.col + 1,
      });
      return;
    }

    this.runSum(this.pending, { data, el: sourceEl });
  }

  async runSum(first, second) {
    this.setBusy(true);
    const { row, col } = first.data;
    first.el.classList.remove('cell--pulse');
    this.pending = null;

    const target = this.cellsC.get(`${row},${col}`);
    await flyMergeLand([first.el, second.el], this.meet, target, {
      operator: this.config.operator,
      resultText: formatNumber(this.finalResult[row][col]),
    });

    target.classList.add('cell--done');
    target.appendChild(el('span', 'cell__check', icon('check', { size: 11 })));
    [first.el, second.el].forEach((c) => { c.dataset.dragDisabled = 'true'; c.classList.add('cell--spent'); });

    this.sumDone.add(`${row},${col}`);
    this.setBusy(false);

    if (this.sumDone.size >= this.totalCells) {
      this.checklist.advance(1);
      this.setPrompt(`Selesai: $${this.config.expression} = ${toLatex(this.finalResult)}$`, 'Selesai');
      this.complete();
    } else {
      this.meet.dataset.awaiting = 'true';
      this.setPrompt('Tahap 2 — pasangan seletak berikutnya.', `Tahap 2 · ${this.sumDone.size} / ${this.totalCells}`);
    }
  }
}

/* ============================================================
   4. ordo_check — mini-simulasi KHUSUS menentukan ordo hasil kali
   ============================================================ */
export class OrdoCheckSim extends Simulation {
  build() {
    this.index = 0;
    this.maxReached = 0;

    this.scaffold({
      brief: this.config.brief,
      promptText: '',
      promptStep: 'Kasus 1',
      legend: [
        { tone: 'blue', label: 'Biru = angka dalam (harus kembar)' },
        { tone: 'amber', label: 'Kuning = angka luar (jadi ordo hasil)' },
      ],
    });

    this.useSteps(this.config.cases.map((c, i) => `Kasus ${i + 1}`), {
      allowJump: true,
      onJump: (index) => {
        if (index > this.maxReached) return;
        this.index = index;
        this.runCase();
      },
    });

    this.runCase();
  }

  runCase() {
    const item = this.config.cases[this.index];
    if (!item) return this.complete();

    this.maxReached = Math.max(this.maxReached, this.index);
    this.setStep(this.index);
    this.resetStage();

    // Catat pilihan yang keliru pada kasus ini supaya saat siswa kembali ke
    // slide ini, opsi yang dulu salah tetap terlihat sudah dicoret.
    this.wrongPicks = [];

    this.setPrompt(
      `Ordo $A$ adalah $${item.a[0]} \\times ${item.a[1]}$ dan ordo $B$ adalah $${item.b[0]} \\times ${item.b[1]}$. Bisakah $A \\times B$ dihitung? Kalau bisa, berapa ordo hasilnya?`,
      `Kasus ${this.index + 1} dari ${this.config.cases.length}`
    );

    // Tampilan ordo besar: 2×3 · 3×4 dengan angka dalam/luar diberi warna.
    const display = el('div', 'ordo-check');
    display.innerHTML = `
      <div class="ordo-check__group">
        <span class="ordo-check__num ordo-check__num--outer">${item.a[0]}</span>
        <span class="ordo-check__times">×</span>
        <span class="ordo-check__num ordo-check__num--inner">${item.a[1]}</span>
      </div>
      <span class="ordo-check__dot">·</span>
      <div class="ordo-check__group">
        <span class="ordo-check__num ordo-check__num--inner">${item.b[0]}</span>
        <span class="ordo-check__times">×</span>
        <span class="ordo-check__num ordo-check__num--outer">${item.b[1]}</span>
      </div>`;
    this.stage.appendChild(stageRow(display));

    const answerHost = el('div', 'stage__row');
    this.stage.appendChild(answerHost);

    const solved = this.getSlideState(this.index);

    item.options.forEach((opt, i) => {
      const btn = el('button', 'btn btn--ghost btn--lg');
      btn.type = 'button';
      btn.innerHTML = renderMixed(opt.label);

      if (solved) {
        // Kunjungan ulang: tampilkan hasil terdahulu apa adanya, jangan ulangi.
        btn.disabled = true;
        if (i === item.answerIndex) btn.classList.add('btn--success');
        else if (solved.wrong && solved.wrong.includes(i)) btn.classList.add('is-failed');
      } else {
        btn.addEventListener('click', () => {
          if (this.busy) return;
          if (i === item.answerIndex) {
            btn.classList.add('anim-flash-success');
            this.showVerdict(item);
          } else {
            this.reject(btn, opt.wrongKey || 'wrongOrdo');
            lockWrongOption(btn);
            this.wrongPicks.push(i);
          }
        });
      }

      answerHost.appendChild(btn);
    });

    this.verdictHost = el('div', 'stage__row');
    this.stage.appendChild(this.verdictHost);

    if (solved) {
      this.verdictHost.appendChild(this.solvedBanner('Kasus ini sudah kamu selesaikan.'));
      this.renderWhy(item);
    }
  }

  renderWhy(item) {
    const box = el('div', 'callout callout--tip');
    box.style.maxWidth = '640px';
    box.innerHTML = `
      <span class="callout__icon">${icon('lightbulb')}</span>
      <div class="callout__body">
        <div class="callout__title">${item.valid ? 'Bisa dikalikan' : 'Tidak bisa dikalikan'}</div>
        <div class="callout__text">${renderMixed(item.why)}</div>
      </div>`;
    this.verdictHost.appendChild(box);
  }

  showVerdict(item) {
    this.renderWhy(item);
    this.markSlideSolved(this.index, { wrong: this.wrongPicks.slice() });
    this.index += 1;
    setTimeout(() => this.runCase(), 2400);
  }
}

/* ============================================================
   5. matrix_multiply — DIRANCANG ULANG
   Horizontal A × B = C, tanpa akumulator terpisah; hasil kali dijumlahkan
   langsung di dalam sel target.
   ============================================================ */
export class MatrixMultiplySim extends Simulation {
  /**
   * Tiga kasus dengan ordo berbeda, dipilih lewat sub-navigasi di atas
   * panggung. Ordo yang berganti-ganti itulah pelajarannya: siswa melihat
   * sendiri bahwa hasil $2\times3$ dikali $3\times1$ berordo $2\times1$,
   * bukan mengikuti salah satu operannya.
   */
  build() {
    // Konfigurasi lama (matrixA/matrixB tunggal) tetap didukung supaya
    // sub-topik lain yang memakai engine ini tidak ikut berubah.
    this.cases = Array.isArray(this.config.cases) && this.config.cases.length
      ? this.config.cases
      : [{
          id: 'tunggal',
          label: 'Kasus 1',
          nameA: this.config.nameA || 'A',
          nameB: this.config.nameB || 'B',
          matrixA: this.config.matrixA,
          matrixB: this.config.matrixB,
        }];

    this.caseIndex = 0;
    this.solvedCases = new Set();

    this.root = el('div', 'sim');
    this.container.appendChild(this.root);

    if (this.config.brief) this.addHint(createBrief(this.config.brief));

    // Sub-navigasi kasus. Dibangun SEKALI dan tidak pernah ikut dibongkar,
    // supaya berpindah kasus tidak membuat tombolnya berkedip hilang-muncul.
    this.caseBar = el('div', 'case-bar');
    this.caseBar.setAttribute('role', 'tablist');
    this.caseBar.setAttribute('aria-label', 'Pilih kasus perkalian');

    this.caseButtons = this.cases.map((c, i) => {
      const btn = el('button', 'case-chip');
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.innerHTML = `<b>${c.label || `Kasus ${i + 1}`}</b>${c.ordo ? `<span>${c.ordo}</span>` : ''}`;
      btn.addEventListener('click', () => this.selectCase(i));
      this.caseBar.appendChild(btn);
      return btn;
    });

    // Pemilih kasus juga kendali, jadi ia duduk di panel kiri bersama
    // petunjuk — panggung tetap murni berisi matriks.
    if (this.cases.length > 1) this.addHint(this.caseBar);

    this.caseHost = el('div', 'case-host');
    this.root.appendChild(this.caseHost);

    this.buildCase();
  }

  /** Pindah kasus; menolak selama satu sel masih setengah dikerjakan. */
  selectCase(index) {
    if (index === this.caseIndex) return;
    if (this.busy) return;

    if (this.activeCell && this.terms.length) {
      toast.warn(this.msg('switchBusy') || 'Selesaikan dulu sel yang sedang dihitung.');
      return;
    }

    this.caseIndex = index;
    this.buildCase();
  }

  syncCaseBar() {
    this.caseButtons.forEach((btn, i) => {
      btn.setAttribute('aria-selected', String(i === this.caseIndex));
      btn.dataset.state = this.solvedCases.has(i) ? 'done' : (i === this.caseIndex ? 'active' : 'idle');
    });
  }

  /** Bangun ulang seluruh panggung untuk kasus yang sedang dipilih. */
  buildCase() {
    // Bersihkan TOTAL: drop-zone, isyarat seret, chip terbang, dan slider
    // langkah milik kasus sebelumnya. Tanpa ini, slider menumpuk dua kali
    // dan drop-zone lama masih menangkap jatuhan.
    this.teardownCase();

    const current = this.cases[this.caseIndex];
    const { matrixA, matrixB, nameA = 'A', nameB = 'B' } = current;

    this.activeMatrixA = matrixA;
    this.activeMatrixB = matrixB;

    const check = canMultiply(matrixA, matrixB);
    if (!check.valid) {
      this.caseHost.appendChild(el('div', 'callout callout--warn',
        `<div class="callout__body"><div class="callout__text">${check.reason}</div></div>`));
      return;
    }

    this.result = multiply(matrixA, matrixB);
    this.completedCells = new Set();
    this.activeCell = null;

    /**
     * Rangkaian suku yang sedang dibangun untuk satu sel.
     * Setiap suku: { a, b } — b diisi belakangan, jadi suku "setengah jadi"
     * tampil sebagai `3` dulu, lalu menjadi `(3×1)` setelah pasangannya masuk.
     */
    this.terms = [];
    this.total = this.result.length * this.result[0].length;

    // Petunjuk per-kasus hidup di wadahnya sendiri (`caseHints`) supaya ikut
    // terbongkar bersama kasusnya, tetapi TAMPIL di panel kendali.
    this.caseHints = el('div', 'case-hints');
    this.addHint(this.caseHints);

    this.promptEl = createPrompt(
      'Klik satu **sel kosong** di matriks hasil untuk mulai menghitungnya.',
      `0 / ${this.total} sel`
    );
    this.caseHints.appendChild(this.promptEl);

    if (current.note) {
      this.caseHints.appendChild(el('div', 'case-note', renderMixed(current.note)));
    }

    this.caseHints.appendChild(createColorLegend([
      { tone: 'blue', label: `Biru = baris dari $${nameA}$` },
      { tone: 'coral', label: `Oranye = kolom dari $${nameB}$` },
      { tone: 'amber', label: 'Kuning = sel yang sedang dihitung' },
    ]));

    this.stage = createStage();
    this.caseHost.appendChild(this.stage);

    // Matriks besar (3 kolom ke atas) diberi kelas agar selnya mengecil
    // sedikit — tanpa itu, 3×3 · 3×3 melebar melewati layar lanskap.
    const widest = Math.max(matrixA[0].length, matrixB[0].length, this.result[0].length);
    this.stage.dataset.span = widest >= 3 ? 'wide' : 'normal';

    this.syncCaseBar();

    const a = renderMatrix(matrixA, { name: nameA, draggable: true, showAddress: true, showOrdo: true });
    const b = renderMatrix(matrixB, { name: nameB, draggable: true, showAddress: true, addressPrefix: 'b', showOrdo: true });
    const c = renderMatrix(this.result, { name: 'C', empty: true, showAddress: true, addressPrefix: 'c', showOrdo: true });

    this.cellsA = a.cells;
    this.cellsB = b.cells;
    this.cellsC = c.cells;

    this.stage.appendChild(equationRow(
      a.root, operatorGlyph('×'), b.root, operatorGlyph('='), c.root
    ));

    // Papan kerja + tombol konfirmasi hidup di wadah bertinggi TETAP,
    // sehingga munculnya tombol tidak menggeser matriks di atasnya.
    this.work = el('div', 'workstrip');
    this.work.innerHTML = '<span class="workstrip__idle">Pilih sel hasil untuk mulai</span>';

    this.confirmBtn = el('button', 'btn btn--success btn--pulse workstrip__confirm');
    this.confirmBtn.type = 'button';
    this.confirmBtn.innerHTML = `${icon('check', { size: 17 })}<span>Hitung Sel Ini</span>`;
    this.confirmBtn.hidden = true;
    this.confirmBtn.addEventListener('click', () => this.finishCell());

    const workRow = el('div', 'workstrip-row');
    workRow.append(this.work, this.confirmBtn);
    this.stage.appendChild(workRow);

    this.cellsC.forEach((cell, key) => {
      cell.style.cursor = 'pointer';
      cell.setAttribute('role', 'button');
      cell.tabIndex = 0;
      const [i, j] = key.split(',').map(Number);
      const pick = () => this.selectTarget(i, j);
      cell.addEventListener('click', pick);
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
      });
    });

    this.wireDrag(this.cellsA, 'A');
    this.wireDrag(this.cellsB, 'B');

    const cellLabels = [];
    this.cellOrder = [];
    this.result.forEach((row, i) => row.forEach((_, j) => {
      cellLabels.push(`Sel c${i + 1}${j + 1}`);
      this.cellOrder.push([i, j]);
    }));

    this.useSteps(cellLabels, {
      allowJump: true,
      onJump: (index) => {
        const t = this.cellOrder[index];
        if (!t) return;
        if (this.completedCells.has(`${t[0]},${t[1]}`)) {
          toast.info(`Sel $c_{${t[0] + 1}${t[1] + 1}}$ sudah selesai.`);
          return;
        }
        this.selectTarget(t[0], t[1]);
      },
    });

    // `useSteps` menempelkan slider lewat addHint(), yang di sini mendarat di
    // panel kendali bersama seluruh kasus. Ia dipindahkan ke wadah petunjuk
    // MILIK KASUS supaya ikut terbongkar saat kasusnya berganti — inilah
    // sumber bug "slider dobel".
    if (this.slider) this.caseHints.appendChild(this.slider);

    // Semua sel hasil berdenyut sampai salah satunya dipilih.
    this.cellsC.forEach((cell) => cell.classList.add('cell--invite'));
  }

  /**
   * Bongkar seluruh jejak kasus sebelumnya.
   *
   * Ini bukan sekadar mengosongkan HTML: drop-zone terdaftar di modul
   * dragDrop dan akan tetap menangkap jatuhan meski elemennya sudah lenyap
   * dari DOM, dan isyarat seret hidup di luar wadah ini.
   */
  teardownCase() {
    this.cleanups.forEach((fn) => {
      try { fn(); } catch (err) { /* diabaikan */ }
    });
    this.cleanups = [];

    hideDragCue();
    clearTapSelection();

    if (this.releaseTargetZone) {
      this.releaseTargetZone();
      this.releaseTargetZone = null;
    }

    document.querySelectorAll('.fly-chip, .drag-ghost, .diag-trace').forEach((n) => n.remove());

    this.slider = null;
    this.stepJump = null;
    this.promptEl = null;
    this.stage = null;
    this.activeCell = null;
    this.terms = [];
    this.caseHost.innerHTML = '';

    // Petunjuk kasus hidup di panel kendali, bukan di caseHost — jadi ia
    // harus dibuang terpisah, kalau tidak ia menumpuk tiap ganti kasus.
    if (this.caseHints) {
      this.caseHints.remove();
      this.caseHints = null;
    }
  }

  wireDrag(cells, which) {
    cells.forEach((cell, key) => {
      const [row, col] = key.split(',').map(Number);
      makeDraggable(cell, { data: { which, row, col, value: Number(cell.dataset.value) } });
    });
  }

  /** Suku ke berapa yang sedang dibangun (0-based). */
  termIndexNow() {
    return this.terms.length ? this.terms.length - (this.terms[this.terms.length - 1].b == null ? 1 : 0) : 0;
  }

  /** Suku terakhir yang masih menunggu pasangan kolomnya. */
  openTerm() {
    const last = this.terms[this.terms.length - 1];
    return last && last.b == null ? last : null;
  }

  /* ---------------- Langkah A: pilih sel target ---------------- */
  selectTarget(i, j) {
    if (this.busy) return;
    if (getTapSource()) return;      // ketukan kedua = jatuhkan, bukan pilih ulang
    if (this.completedCells.has(`${i},${j}`)) return;
    if (this.activeCell && this.terms.length) {
      toast.warn('Selesaikan dulu sel yang sedang dihitung sebelum berpindah.');
      return;
    }

    this.activeCell = { i, j };
    this.terms = [];

    clearHighlights(this.cellsA);
    clearHighlights(this.cellsB);
    this.cellsC.forEach((c) => c.classList.remove('cell--target', 'cell--invite'));

    this.cellsC.forEach((c, key) => {
      if (key !== `${i},${j}` && !this.completedCells.has(key)) c.classList.add('cell--locked');
    });

    const colsA = ordo(this.activeMatrixA).cols;
    const rowsB = ordo(this.activeMatrixB).rows;
    rowCells(this.cellsA, i, colsA).forEach((c) => c.classList.add('cell--row-hl'));
    colCells(this.cellsB, j, rowsB).forEach((c) => c.classList.add('cell--col-hl'));

    const targetCell = this.cellsC.get(`${i},${j}`);
    targetCell.classList.add('cell--target');
    targetCell.classList.remove('cell--locked');

    if (this.releaseTargetZone) this.releaseTargetZone();
    this.releaseTargetZone = registerDropZone(targetCell, {
      padding: 14,
      onDrop: (data, sourceEl) => this.handleDrop(data, sourceEl),
    });
    this.track(this.releaseTargetZone);

    this.renderScaffoldMarkers();
    this.updateWorkstrip();
    this.showCueForTerm();

    const stepIndex = this.cellOrder.findIndex(([r, cc]) => r === i && cc === j);
    if (stepIndex >= 0) this.setStep(stepIndex);

    this.setPrompt(
      `Menghitung $c_{${i + 1}${j + 1}}$ — bawa elemen **biru** ke-1 ke sel kuning. Seret, atau ketuk elemennya lalu ketuk selnya.`,
      `${this.completedCells.size} / ${this.total} sel`
    );
  }

  showCueForTerm() {
    hideDragCue();
    if (!this.activeCell) return;

    const { i, j } = this.activeCell;
    const open = this.openTerm();
    const k = open ? this.terms.length - 1 : this.terms.length;

    const target = this.cellsC.get(`${i},${j}`);
    // Kalau suku sedang setengah jadi, isyaratkan HANYA pasangan kolomnya.
    const sources = open
      ? [this.cellsB.get(`${k},${j}`)]
      : [this.cellsA.get(`${i},${k}`)];

    if (!target || !sources[0]) return;
    this.cue = showDragCue(sources.filter(Boolean), target);
  }

  renderScaffoldMarkers() {
    this.clearScaffoldMarkers();
    if (this.config.scaffold === false) return;

    const { i, j } = this.activeCell;
    const colsA = ordo(this.activeMatrixA).cols;
    const marks = ['①', '②', '③'];

    for (let k = 0; k < colsA; k++) {
      [this.cellsA.get(`${i},${k}`), this.cellsB.get(`${k},${j}`)].forEach((cell) => {
        if (cell) cell.appendChild(el('span', 'cell__order', marks[k] || String(k + 1)));
      });
    }
  }

  clearScaffoldMarkers() {
    this.stage.querySelectorAll('.cell__order').forEach((n) => n.remove());
  }

  /** Ekspresi berjalan: `3` → `(3×1)` → `(3×1) + (3×0)`. */
  expressionText() {
    return this.terms.map((t) => (
      t.b == null ? `${formatNumber(t.a)}` : `(${formatNumber(t.a)}×${formatNumber(t.b)})`
    )).join(' + ');
  }

  updateWorkstrip() {
    if (!this.activeCell) {
      this.work.innerHTML = '<span class="workstrip__idle">Pilih sel hasil untuk mulai</span>';
      this.confirmBtn.hidden = true;
      return;
    }

    const { i, j } = this.activeCell;
    const expr = this.terms.length ? this.expressionText() : '…';
    this.work.innerHTML = `
      <span class="workstrip__label">${renderMixed(`$c_{${i + 1}${j + 1}}$`)} =</span>
      <span class="workstrip__expr">${expr}</span>`;

    // Tombol konfirmasi hanya muncul setelah SEMUA pasangan lengkap.
    const need = ordo(this.activeMatrixA).cols;
    const ready = this.terms.length === need && this.terms.every((t) => t.b != null);
    this.confirmBtn.hidden = !ready;
  }

  handleDrop(data, sourceEl) {
    if (this.busy) return;

    if (!this.activeCell) {
      this.reject(sourceEl, 'pickCellFirst');
      return;
    }

    const { i, j } = this.activeCell;
    const open = this.openTerm();
    const k = open ? this.terms.length - 1 : this.terms.length;
    const need = ordo(this.activeMatrixA).cols;

    if (k >= need) {
      toast.warn('Semua pasangan sudah lengkap — tekan "Hitung Sel Ini".');
      return;
    }

    // Menunggu elemen BARIS (dari A) atau elemen KOLOM (dari B)?
    const wantWhich = open ? 'B' : 'A';

    if (data.which !== wantWhich) {
      this.reject(sourceEl, wantWhich === 'A' ? 'needRowFirst' : 'needColNext', { step: k + 1 });
      return;
    }

    const inLine = wantWhich === 'A'
      ? (data.row === i && data.col === k)
      : (data.col === j && data.row === k);

    if (!inLine) {
      const wrongLine = wantWhich === 'A' ? data.row !== i : data.col !== j;
      this.reject(sourceEl, wrongLine ? 'wrongMatrix' : 'notParallel',
        { row: i + 1, col: j + 1, step: k + 1 });
      return;
    }

    this.acceptElement(data, sourceEl, wantWhich);
  }

  /* ---------------- Langkah B–D: terima elemen satu per satu ---------------- */
  async acceptElement(data, sourceEl, which) {
    this.setBusy(true);
    hideDragCue();
    clearTapSelection();

    const { i, j } = this.activeCell;
    const targetCell = this.cellsC.get(`${i},${j}`);

    // Terbangkan salinan elemen ke sel target — gerakan yang sama untuk
    // seret maupun ketuk.
    const chip = makeFlyChip(sourceEl, { text: sourceEl.dataset.value });
    await landOn(chip, targetCell, { text: null });

    if (which === 'A') {
      this.terms.push({ a: data.value, b: null });
    } else {
      const open = this.openTerm();
      if (open) open.b = data.value;
    }

    // Sumber diredupkan & dikunci agar tidak terpakai dua kali.
    sourceEl.classList.add('cell--spent');
    sourceEl.dataset.dragDisabled = 'true';

    // Sel target menampilkan ekspresi yang sedang tumbuh.
    targetCell.textContent = '';
    const exprEl = el('span', 'cell__expr', this.expressionText());
    targetCell.appendChild(exprEl);
    targetCell.classList.add('cell--building');

    this.updateWorkstrip();
    this.setBusy(false);

    const need = ordo(this.activeMatrixA).cols;
    const complete = this.terms.length === need && this.terms.every((t) => t.b != null);

    if (complete) {
      this.setPrompt(
        `Semua pasangan lengkap: ${this.expressionText()}. Tekan **Hitung Sel Ini** untuk menghitungnya.`,
        `${this.completedCells.size} / ${this.total} sel`
      );
      return;
    }

    this.showCueForTerm();
    this.setPrompt(
      this.openTerm()
        ? `Sekarang bawa pasangannya dari deret **oranye** (elemen ke-${this.terms.length}).`
        : `Bagus. Sekarang bawa elemen **biru** ke-${this.terms.length + 1}.`,
      `${this.completedCells.size} / ${this.total} sel`
    );
  }

  /* ---------------- Langkah E: konfirmasi & hitung ---------------- */
  async finishCell() {
    if (this.busy || !this.activeCell) return;
    this.setBusy(true);
    this.confirmBtn.hidden = true;

    const { i, j } = this.activeCell;
    const targetCell = this.cellsC.get(`${i},${j}`);
    const value = this.result[i][j];

    // Animasi penutup: ekspresi mengerut, lalu angka hasilnya muncul.
    targetCell.classList.add('cell--resolving');
    await new Promise((r) => setTimeout(r, 420));

    targetCell.innerHTML = '';
    targetCell.textContent = formatNumber(value);
    targetCell.classList.remove('cell--resolving', 'cell--building', 'cell--target');
    targetCell.classList.add('cell--done', 'anim-land');
    targetCell.appendChild(el('span', 'cell__addr', `c${i + 1}${j + 1}`));
    targetCell.appendChild(el('span', 'cell__check', icon('check', { size: 11 })));
    targetCell.style.cursor = 'default';

    this.completedCells.add(`${i},${j}`);

    const stepIndex = this.cellOrder.findIndex(([r, cc]) => r === i && cc === j);
    if (stepIndex >= 0) this.markStepDone(stepIndex);

    toast.success(this.msg('cellDone', { row: i + 1, col: j + 1 }));

    this.activeCell = null;
    this.terms = [];
    hideDragCue();

    clearHighlights(this.cellsA);
    clearHighlights(this.cellsB);
    this.clearScaffoldMarkers();

    // Pulihkan elemen sumber untuk sel berikutnya.
    [this.cellsA, this.cellsB].forEach((map) => map.forEach((c) => {
      c.classList.remove('cell--spent');
      delete c.dataset.dragDisabled;
    }));

    this.cellsC.forEach((c, key) => {
      c.classList.remove('cell--locked');
      if (!this.completedCells.has(key)) c.classList.add('cell--invite');
    });

    this.updateWorkstrip();
    this.setBusy(false);

    if (this.completedCells.size >= this.total) {
      this.solvedCases.add(this.caseIndex);
      this.syncCaseBar();

      const label = (this.cases[this.caseIndex].label) || 'Kasus ini';
      this.setPrompt(`Seluruh sel matriks hasil terisi. ${label} selesai.`, 'Selesai');

      // Kasus pertama sudah cukup untuk membuka Mini Kuis; dua kasus lain
      // tetap terbuka sebagai latihan tambahan, bukan syarat.
      if (!this.finished) {
        this.complete();
      } else if (this.cases.length > 1) {
        toast.success(this.msg('caseDone', { label }) || `${label} selesai!`);
      }
    } else {
      this.setPrompt('Klik sel kosong berikutnya di matriks hasil.', `${this.completedCells.size} / ${this.total} sel`);
    }
  }
}

/* ============================================================
   6. property_cards — "Benar atau Jebakan?"
   ============================================================ */
export class PropertyCardsSim extends Simulation {
  build() {
    this.index = 0;
    this.scaffold({
      brief: this.config.brief,
      promptText: 'Seret simbol $=$ atau $\\ne$ ke antara dua ekspresi.',
      promptStep: `1 / ${this.config.pairs.length}`,
    });

    this.pairHost = el('div');
    this.pairHost.style.cssText = 'display:flex;flex-direction:column;gap:var(--sp-4);align-items:center;width:100%';
    this.stage.appendChild(this.pairHost);

    this.proofHost = el('div');
    this.proofHost.style.cssText = 'width:100%';
    this.stage.appendChild(this.proofHost);

    this.renderPair();
  }

  renderPair() {
    const pair = this.config.pairs[this.index];
    if (!pair) return this.complete();

    this.pairHost.innerHTML = '';
    this.proofHost.innerHTML = '';
    this.setPrompt('Apakah kedua ekspresi ini setara?', `${this.index + 1} / ${this.config.pairs.length}`);

    const row = el('div', 'equation');
    const left = el('div', 'equation__block');
    left.innerHTML = renderMixed(`$${pair.left}$`);
    left.style.minWidth = '110px';

    const slot = el('div', 'equation__slot', '?');

    const right = el('div', 'equation__block');
    right.innerHTML = renderMixed(`$${pair.right}$`);
    right.style.minWidth = '110px';

    row.append(left, slot, right);
    this.pairHost.appendChild(row);

    const chips = el('div', 'stage__row');
    ['=', '\\ne'].forEach((symbol) => {
      const chip = el('div', 'symbol-chip');
      chip.innerHTML = renderMixed(`$${symbol}$`);
      makeDraggable(chip, { data: { symbol } });
      chips.appendChild(chip);
    });
    this.pairHost.appendChild(chips);

    this.track(registerDropZone(slot, {
      padding: 12,
      onDrop: (data, sourceEl) => this.judge(pair, data, sourceEl, slot),
    }));
  }

  judge(pair, data, sourceEl, slot) {
    if (data.symbol !== pair.answer) {
      this.reject(sourceEl, 'wrongSymbol');
      lockWrongOption(sourceEl);
      return;
    }

    slot.innerHTML = renderMixed(`$${data.symbol}$`);
    slot.dataset.filled = 'true';
    slot.classList.add('anim-flash-success');

    this.showProof(pair);
    this.index += 1;
    setTimeout(() => this.renderPair(), 3400);
  }

  showProof(pair) {
    const { matrixA, matrixB } = this.config;
    let leftVal;
    let rightVal;

    try {
      switch (pair.prove) {
        case 'add': leftVal = add(matrixA, matrixB); rightVal = add(matrixB, matrixA); break;
        case 'multiply': leftVal = multiply(matrixA, matrixB); rightVal = multiply(matrixB, matrixA); break;
        case 'transposeMul':
          leftVal = transpose(multiply(matrixA, matrixB));
          rightVal = multiply(transpose(matrixB), transpose(matrixA));
          break;
        case 'transposeMulWrong':
          leftVal = transpose(multiply(matrixA, matrixB));
          rightVal = multiply(transpose(matrixA), transpose(matrixB));
          break;
        default: return;
      }
    } catch (err) { return; }

    const box = el('div', 'explain anim-rise');
    box.innerHTML = `
      <div class="explain__title">Pembuktian dengan angka</div>
      <div style="display:flex;gap:var(--sp-4);flex-wrap:wrap;align-items:center;justify-content:center">
        <div>${renderMixed(`$${pair.left} = ${toLatex(leftVal)}$`)}</div>
        <div>${renderMixed(`$${pair.right} = ${toLatex(rightVal)}$`)}</div>
      </div>
      <p style="margin-top:var(--sp-3)">${renderMixed(pair.why)}</p>`;
    this.proofHost.appendChild(box);
  }
}
