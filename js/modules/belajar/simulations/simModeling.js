/**
 * simModeling.js — Simulasi Bab 4 (Pemodelan & Aplikasi TKA)
 * data_translation · spl_solver · multi_statement
 */

import {
  Simulation, el, renderMatrix, stageRow, createFlowArrow, createChecklist,
} from './simCore.js';
import {
  multiply, inverse, determinant, formatNumber, toLatex,
} from '../../../engine/matrix.js';
import { renderMixed } from '../../../engine/katexRenderer.js';
import { icon } from '../../../ui/icons.js';
import { makeDraggable, registerDropZone } from '../../../interactions/dragDrop.js';
import toast from '../../../ui/toast.js';

const rupiah = (v) => `Rp${Math.round(v).toLocaleString('id-ID')}`;

/* ============================================================
   1. data_translation — narasi menjadi matriks
   ============================================================ */
export class DataTranslationSim extends Simulation {
  build() {
    const { narrative, rowLabels, colLabels, labelPool, matrix, numberPool } = this.config;

    this.phase = 'labels';
    this.filledLabels = new Set();
    this.filledNumbers = new Set();

    this.scaffold({
      brief: this.config.brief,
      promptText: 'Tahap 1 — pasang **label sumbu** lebih dulu (baris = menu, kolom = bahan).',
      promptStep: 'Tahap 1 / 2',
    });

    const narrativeBox = el('div', 'narrative', renderMixed(narrative));
    this.container.querySelector('.sim').insertBefore(narrativeBox, this.stage);

    // Rangka: header kolom di atas, header baris di kiri, grid di tengah.
    const frame = el('div');
    frame.style.cssText = 'display:grid;grid-template-columns:auto auto;gap:6px;align-items:center';

    frame.appendChild(el('div'));  // sudut kosong

    this.colSlots = [];
    const colHeader = el('div');
    colHeader.style.cssText = `display:grid;grid-template-columns:repeat(${colLabels.length}, 1fr);gap:6px`;
    colLabels.forEach((_, j) => {
      const slot = el('div', 'matrix__axis-label');
      slot.dataset.drop = 'true';
      slot.dataset.axis = 'col';
      slot.dataset.index = String(j);
      slot.textContent = '???';
      colHeader.appendChild(slot);
      this.colSlots.push(slot);
    });
    frame.appendChild(colHeader);

    this.rowSlots = [];
    const rowHeader = el('div');
    rowHeader.style.cssText = `display:grid;grid-template-rows:repeat(${rowLabels.length}, 1fr);gap:6px`;
    rowLabels.forEach((_, i) => {
      const slot = el('div', 'matrix__axis-label');
      slot.dataset.drop = 'true';
      slot.dataset.axis = 'row';
      slot.dataset.index = String(i);
      slot.textContent = '???';
      rowHeader.appendChild(slot);
      this.rowSlots.push(slot);
    });
    frame.appendChild(rowHeader);

    const view = renderMatrix(matrix, { empty: true });
    this.cells = view.cells;
    frame.appendChild(view.root);

    this.stage.appendChild(stageRow(frame));

    this.poolHost = el('div');
    this.poolHost.style.cssText = 'display:flex;flex-wrap:wrap;gap:var(--sp-2);justify-content:center;width:100%';
    this.stage.appendChild(this.poolHost);

    [...this.rowSlots, ...this.colSlots].forEach((slot) => {
      this.track(registerDropZone(slot, {
        padding: 6,
        onDrop: (data, sourceEl) => this.handleLabelDrop(slot, data, sourceEl),
      }));
    });

    this.renderLabelPool(labelPool);
  }

  renderLabelPool(labels) {
    this.poolHost.innerHTML = '';
    labels.forEach((label) => {
      const chip = el('div', 'drag-card', label);
      chip.style.cssText += 'font-size:var(--fs-sm);font-weight:600;padding:8px 14px';
      makeDraggable(chip, { data: { label } });
      this.poolHost.appendChild(chip);
    });
  }

  handleLabelDrop(slot, data, sourceEl) {
    const { rowLabels, colLabels } = this.config;
    const axis = slot.dataset.axis;
    const index = Number(slot.dataset.index);
    const expected = axis === 'row' ? rowLabels[index] : colLabels[index];

    if (data.label === expected) {
      slot.textContent = data.label;
      slot.dataset.filled = 'true';
      delete slot.dataset.drop;
      sourceEl.remove();
      this.filledLabels.add(`${axis}${index}`);

      if (this.filledLabels.size === rowLabels.length + colLabels.length) {
        this.startNumberPhase();
      }
      return;
    }

    // Petunjuk mengarahkan tanpa membocorkan jawaban (PRD §8.4, kasus khusus Bab 4).
    const belongsToRows = rowLabels.includes(data.label);
    const belongsToCols = colLabels.includes(data.label);

    if (axis === 'col' && belongsToRows) this.reject(sourceEl, 'wrongAxis');
    else if (axis === 'row' && belongsToCols) this.reject(sourceEl, 'wrongAxisRow');
    else if (!belongsToRows && !belongsToCols) this.reject(sourceEl, 'unusedLabel');
    else this.reject(sourceEl, axis === 'row' ? 'wrongAxisRow' : 'wrongAxis');
  }

  startNumberPhase() {
    this.phase = 'numbers';
    this.setPrompt('Tahap 2 — jatuhkan angka dari narasi ke sel yang sesuai.', 'Tahap 2 / 2');
    toast.success('Label sumbu lengkap! Sekarang isi angkanya.');

    this.cells.forEach((cell, key) => {
      this.track(registerDropZone(cell, {
        padding: 6,
        onDrop: (data, sourceEl) => this.handleNumberDrop(key, cell, data, sourceEl),
      }));
    });

    this.poolHost.innerHTML = '';
    this.config.numberPool.forEach((value, index) => {
      const chip = el('div', 'cell cell--draggable', formatNumber(value));
      chip.dataset.value = String(value);
      chip.dataset.poolIndex = String(index);
      makeDraggable(chip, { data: { value, index } });
      this.poolHost.appendChild(chip);
    });
  }

  handleNumberDrop(key, cell, data, sourceEl) {
    const [i, j] = key.split(',').map(Number);
    const expected = this.config.matrix[i][j];

    if (data.value === expected) {
      cell.textContent = formatNumber(expected);
      cell.classList.add('cell--done');
      cell.appendChild(el('span', 'cell__check', icon('check', { size: 11 })));
      sourceEl.remove();
      this.filledNumbers.add(key);

      const total = this.config.matrix.length * this.config.matrix[0].length;
      if (this.filledNumbers.size === total) {
        this.setPrompt('Narasi berhasil menjadi objek matematis!', 'Selesai');
        this.complete();
      }
      return;
    }

    // Bedakan: angka ada di narasi tapi salah tempat, vs tidak ada sama sekali.
    const inMatrix = this.config.matrix.some((row) => row.includes(data.value));
    this.reject(sourceEl, inMatrix ? 'wrongNumber' : 'numberNotInNarrative');
  }
}

/* ============================================================
   2. spl_solver — SPLDV / SPLTV dari soal cerita
   ============================================================ */
export class SplSolverSim extends Simulation {
  build() {
    const { narrative, size, coefficients, constants, varNames } = this.config;

    this.filledCoef = new Set();
    this.filledConst = new Set();

    this.scaffold({
      brief: this.config.brief,
      promptText: 'Tahap 1 — susun matriks koefisien $A$ dan matriks konstanta $B$ dari narasi.',
      promptStep: 'Tahap 1 / 2',
    });

    const narrativeBox = el('div', 'narrative', renderMixed(narrative));
    this.container.querySelector('.sim').insertBefore(narrativeBox, this.stage);

    const aView = renderMatrix(coefficients, { name: 'A', empty: true, showAddress: true });
    this.coefCells = aView.cells;

    const xView = renderMatrix(varNames.map((v) => [v]), { name: 'X' });
    xView.cells.forEach((cell, key) => {
      const [i] = key.split(',').map(Number);
      cell.textContent = varNames[i];
      cell.dataset.role = 'unknown';
      cell.style.background = 'var(--accent-amber-soft)';
      cell.style.color = 'var(--accent-amber-dark)';
    });

    const bView = renderMatrix(constants, { name: 'B', empty: true });
    this.constCells = bView.cells;

    this.stage.appendChild(stageRow(
      aView.root, xView.root, el('div', 'matrix__name', '='), bView.root
    ));

    this.poolHost = el('div');
    this.poolHost.style.cssText = 'display:flex;flex-wrap:wrap;gap:var(--sp-2);justify-content:center;width:100%';
    this.stage.appendChild(this.poolHost);

    this.resultHost = el('div');
    this.resultHost.style.cssText = 'width:100%';
    this.stage.appendChild(this.resultHost);

    this.coefCells.forEach((cell, key) => {
      this.track(registerDropZone(cell, {
        padding: 6,
        onDrop: (data, sourceEl) => this.handleDrop('coef', key, cell, data, sourceEl),
      }));
    });
    this.constCells.forEach((cell, key) => {
      this.track(registerDropZone(cell, {
        padding: 6,
        onDrop: (data, sourceEl) => this.handleDrop('const', key, cell, data, sourceEl),
      }));
    });

    this.renderPool();
  }

  renderPool() {
    this.poolHost.innerHTML = '';
    this.config.numberPool.forEach((value, index) => {
      const chip = el('div', 'cell cell--draggable', formatNumber(value));
      chip.dataset.value = String(value);
      chip.style.minWidth = value > 999 ? '84px' : '54px';
      makeDraggable(chip, { data: { value, index } });
      this.poolHost.appendChild(chip);
    });
  }

  handleDrop(which, key, cell, data, sourceEl) {
    const [i, j] = key.split(',').map(Number);
    const expected = which === 'coef'
      ? this.config.coefficients[i][j]
      : this.config.constants[i][0];

    if (data.value !== expected) {
      // Bedakan kekeliruan koefisien vs konstanta agar penjelasannya spesifik.
      const isConstantValue = this.config.constants.some((row) => row.includes(data.value));
      if (which === 'coef' && isConstantValue) {
        this.reject(sourceEl, 'wrongConstant');
      } else {
        this.reject(sourceEl, which === 'coef' ? 'wrongCoefficient' : 'wrongConstant', { row: i + 1 });
      }
      return;
    }

    cell.textContent = formatNumber(expected);
    cell.classList.add('cell--done');
    sourceEl.remove();

    if (which === 'coef') this.filledCoef.add(key);
    else this.filledConst.add(key);

    const totalCoef = this.config.coefficients.length * this.config.coefficients[0].length;
    const totalConst = this.config.constants.length;

    if (this.filledCoef.size === totalCoef && this.filledConst.size === totalConst) {
      this.startSolvePhase();
    }
  }

  startSolvePhase() {
    this.setPrompt('Tahap 2 — selesaikan $AX = B$ dengan $X = A^{-1}B$.', 'Tahap 2 / 2');
    toast.success('Bentuk matriksnya sudah benar! Sekarang selesaikan.');

    const buttons = el('div', 'stage__row');

    const full = el('button', 'btn btn--primary');
    full.type = 'button';
    full.innerHTML = `${icon('layers', { size: 17 })}<span>Kerjakan Penuh</span>`;
    full.addEventListener('click', () => this.solve(true));
    buttons.appendChild(full);

    if (this.config.allowFastPath) {
      const fast = el('button', 'btn btn--ghost');
      fast.type = 'button';
      fast.innerHTML = `${icon('zap', { size: 17 })}<span>Percepat</span>`;
      fast.addEventListener('click', () => this.solve(false));
      buttons.appendChild(fast);
    }

    this.resultHost.appendChild(buttons);
  }

  solve(showSteps) {
    const A = this.config.coefficients;
    const B = this.config.constants;
    const det = determinant(A);

    if (Math.abs(det) < 1e-10) {
      toast.error('Matriks koefisiennya singular — sistem ini tidak punya solusi tunggal.');
      return;
    }

    const inv = inverse(A);
    const X = multiply(inv, B);

    const box = el('div', 'explain anim-rise');
    let html = `<div class="explain__title">Penyelesaian</div>`;

    if (showSteps) {
      html += renderMixed(`$$\\det(A) = ${formatNumber(det)}$$`);
      html += renderMixed(`$$A^{-1} = ${toLatex(inv, { fraction: true })}$$`);
    }
    html += renderMixed(`$$X = A^{-1}B = ${toLatex(X)}$$`);

    // Kembalikan hasil ke konteks cerita.
    const values = {};
    this.config.varNames.forEach((name, i) => {
      values[name] = Math.round(X[i][0]).toLocaleString('id-ID');
    });
    let closing = this.config.closing || '';
    Object.entries(values).forEach(([k, v]) => {
      closing = closing.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
    });
    html += `<p style="margin-top:var(--sp-3)"><strong>${closing}</strong></p>`;

    box.innerHTML = html;
    this.resultHost.appendChild(box);

    this.setPrompt('Solusi ditemukan dan kembali bermakna dalam konteks cerita.', 'Selesai');
    this.complete();
  }
}

/* ============================================================
   3. multi_statement — analisis "pilih semua yang benar"
   ============================================================ */
export class MultiStatementSim extends Simulation {
  build() {
    const { context, table, priceRow, capacity, revenue, branchNames, statements } = this.config;

    this.computed = false;
    this.selected = new Set();

    this.scaffold({
      brief: this.config.brief,
      promptText: 'Tahap 1 — hitung dulu matriks pendapatan tiap cabang.',
      promptStep: 'Tahap 1 / 2',
    });

    const contextBox = el('div', 'narrative', renderMixed(context));
    this.container.querySelector('.sim').insertBefore(contextBox, this.stage);

    // Tabel data mentah
    const tableWrap = el('div', 'data-table-wrap');
    const tbl = el('table', 'data-table');
    const thead = el('thead');
    const headRow = el('tr');
    table.headers.forEach((h) => headRow.appendChild(el('th', null, h)));
    thead.appendChild(headRow);
    tbl.appendChild(thead);
    const tbody = el('tbody');
    table.rows.forEach((row) => {
      const tr = el('tr');
      row.forEach((cellText) => tr.appendChild(el('td', null, cellText)));
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    tableWrap.appendChild(tbl);
    this.stage.appendChild(tableWrap);

    const priceView = renderMatrix(priceRow, { name: 'Harga' });
    const capView = renderMatrix(capacity, { name: 'Kapasitas' });
    const revView = renderMatrix(revenue, { name: 'Pendapatan', empty: true });
    this.revCells = revView.cells;

    this.stage.appendChild(stageRow(priceView.root, el('div', 'matrix__name', '×'), capView.root));
    this.stage.appendChild(createFlowArrow());
    this.stage.appendChild(stageRow(revView.root));

    const computeBtn = el('button', 'btn btn--primary');
    computeBtn.type = 'button';
    computeBtn.innerHTML = `${icon('sigma', { size: 17 })}<span>Hitung Matriks Pendapatan</span>`;
    computeBtn.addEventListener('click', () => this.compute(computeBtn));
    this.stage.appendChild(stageRow(computeBtn));

    this.statementHost = el('div');
    this.statementHost.style.cssText = 'width:100%;display:grid;gap:var(--sp-3)';
    this.stage.appendChild(this.statementHost);
  }

  async compute(btn) {
    if (this.computed) return;
    this.computed = true;
    btn.disabled = true;

    const result = multiply(this.config.priceRow, this.config.capacity);

    // Isi berurutan agar terlihat tiap cabang dihitung terpisah.
    for (let j = 0; j < result[0].length; j++) {
      const cell = this.revCells.get(`0,${j}`);
      await new Promise((r) => setTimeout(r, 320));
      cell.textContent = formatNumber(result[0][j]);
      cell.classList.add('cell--done', 'anim-flash-success');
    }

    const summary = el('div', 'panel anim-rise');
    summary.innerHTML = `
      <div class="panel__label">Pendapatan per cabang</div>
      <div style="display:flex;gap:var(--sp-4);flex-wrap:wrap">
        ${this.config.branchNames.map((name, j) =>
          `<span class="badge badge--amber">${name}: ${rupiah(result[0][j])}</span>`
        ).join('')}
      </div>
    `;
    this.stage.insertBefore(summary, this.statementHost);

    this.setPrompt('Tahap 2 — centang **semua** pernyataan yang benar.', 'Tahap 2 / 2');
    this.renderStatements();
  }

  renderStatements() {
    const wrap = el('div', 'options');
    wrap.dataset.multi = 'true';

    this.config.statements.forEach((st) => {
      const btn = el('button', 'option');
      btn.type = 'button';
      btn.setAttribute('role', 'checkbox');
      btn.setAttribute('aria-checked', 'false');
      btn.innerHTML = `
        <span class="option__box">${icon('check', { size: 14 })}</span>
        <span class="option__label">${renderMixed(st.text)}</span>
      `;
      btn.addEventListener('click', () => {
        if (this.checked) return;
        const now = btn.getAttribute('aria-checked') === 'true';
        btn.setAttribute('aria-checked', String(!now));
        if (now) this.selected.delete(st.id);
        else this.selected.add(st.id);
      });
      btn._statement = st;
      wrap.appendChild(btn);
    });

    const submit = el('button', 'btn btn--success');
    submit.type = 'button';
    submit.innerHTML = `${icon('check', { size: 17 })}<span>Periksa Jawaban</span>`;
    submit.addEventListener('click', () => this.check(wrap, submit));

    this.statementHost.appendChild(wrap);
    this.statementHost.appendChild(submit);
  }

  check(wrap, submit) {
    if (this.checked) return;
    this.checked = true;
    submit.disabled = true;

    let allCorrect = true;

    wrap.querySelectorAll('.option').forEach((btn) => {
      const st = btn._statement;
      const picked = btn.getAttribute('aria-checked') === 'true';
      const correct = picked === st.correct;
      if (!correct) allCorrect = false;

      btn.classList.add('option--locked', st.correct ? 'option--correct' : (picked ? 'option--wrong' : ''));
      if (!st.correct && !picked) btn.classList.remove('option--wrong');

      // Caption penjelas WAJIB di bawah setiap kartu (PRD §8.4).
      const caption = el('div', `option-feedback option-feedback--${st.correct ? 'ok' : 'no'}`);
      caption.innerHTML = renderMixed(st.feedback);
      btn.insertAdjacentElement('afterend', caption);
    });

    if (allCorrect) {
      this.complete();
    } else {
      toast.error(this.msg('partialWrong'));
      // Tetap izinkan lanjut — pembahasan per kartu sudah terlihat.
      setTimeout(() => this.complete(''), 900);
    }
  }
}
