/**
 * simModeling.js — Simulasi Bab 4 (Pemodelan & Aplikasi TKA)
 *
 * Lama : data_translation · spl_solver · multi_statement
 * Fase 17 : domino_translation · spldv_utbk · sniper_extraction · multi_condition
 */

import {
  Simulation, el, renderMatrix, stageRow, equationRow, operatorGlyph,
  createFlowArrow, createChecklist, createProgressText, makeTappable,
  lockWrongOption, rowCells, colCells,
} from './simCore.js';
import {
  multiply, inverse, determinant, formatNumber, toLatex,
} from '../../../engine/matrix.js';
import { Inverse2x2Sim } from './simDetInv.js';
import { MatrixMultiplySim } from './simOperations.js';
import { renderMixed } from '../../../engine/katexRenderer.js';
import { icon } from '../../../ui/icons.js';
import { makeDraggable, registerDropZone } from '../../../interactions/dragDrop.js';
import { makeFlyChip, flyTo, landOn } from '../../../interactions/flyToAnimation.js';
import { attachMathpad } from '../../../ui/mathpad.js';
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
    this.buttonHost = buttons;

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

    /**
     * Sekali jalan saja. Tanpa kunci ini, menekan "Kerjakan Penuh" atau
     * "Percepat" berulang kali menumpuk kotak penyelesaian yang sama
     * berkali-kali di panggung (Fase 13, audit sistemik).
     */
    if (!this.claim('solve')) return;
    if (this.buttonHost) this.lockChoices(this.buttonHost);

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
      await this.wait(320);
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

      /**
       * ⚠️ `classList.add('')` MELEMPAR `SyntaxError` — token kosong tidak
       * pernah sah. Versi sebelumnya menulis
       * `add('option--locked', st.correct ? … : (picked ? … : ''))`, dan
       * argumen ketiga menjadi string kosong tepat pada satu kasus:
       * pernyataan SALAH yang dibiarkan TIDAK dicentang — yaitu ketika
       * siswa menjawab butir itu dengan BENAR.
       *
       * Akibatnya `check()` berhenti di tengah jalan: caption penjelas
       * untuk butir sesudahnya tidak pernah muncul, panggung tidak pernah
       * terkunci, dan simulasinya tidak pernah selesai. Bug ini sudah ada
       * sejak engine `multi_statement` dibuat dan baru terlihat ketika
       * alurnya benar-benar dijalankan sampai akhir dengan jawaban campuran.
       */
      const tone = st.correct ? 'option--correct' : (picked ? 'option--wrong' : null);
      btn.classList.add('option--locked');
      if (tone) btn.classList.add(tone);

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
      this.later(() => this.complete(''), 900);
    }
  }
}

/* ============================================================
   FASE 17 — MASTERCLASS PEMODELAN TKA

   Empat engine yang menggeser latihan dari MENGHITUNG ke
   MEMBACA: mengurai soal cerita, mengenali pola, dan memilih
   jalan terpendek. Tiga dari empatnya memakai ULANG mesin yang
   sudah matang sebagai sub-engine — pola yang sama dengan
   Fase 16 (lihat HANDOFF §0000).
   ============================================================ */

/**
 * Bawa sebuah panel ke dalam pandangan di kolom panggung.
 *
 * Panggung boleh menggulir di dalam dirinya sendiri (kontrak §5 butir 30),
 * dan alur bertahap seperti Bab 4 memang tumbuh ke bawah. Tetapi PERTANYAAN
 * yang baru muncul tidak boleh mendarat di luar layar: terukur, panel opsi
 * UTBK berhenti di y=806 sementara panggungnya berakhir di y=816 — hanya
 * mengintip 10px, dan siswa harus menggulir untuk menemukan soal yang
 * sedang ditanyakan kepadanya.
 *
 * `body` aplikasi `position: fixed`, jadi ini hanya menggulir kolom
 * panggung; halamannya sendiri tidak bisa ikut bergerak.
 */
/**
 * Nilai sebuah sel sebagai TEKS BERSIH.
 *
 * ⚠️ Jangan pernah membaca `cell.textContent` pada sel yang dirender dengan
 * `showAddress: true`. Label alamat adalah `<span>` ANAK, jadi `textContent`
 * mengembalikan gabungannya: sel bernilai 10 dengan label `a11` terbaca
 * **"10a11"**, dan persamaan hasil ekstraksi tampil sebagai
 * `10a11(120) + 25a12(40) + k(60) = 2680`.
 *
 * Kerabat persis dari jebakan `rewriteCell()` di Fase 16 (HANDOFF §0000):
 * anak elemen di dalam sel selalu ikut terbaca, dan `dataset.value` adalah
 * satu-satunya sumber yang bersih.
 */
function cellText(cell) {
  if (!cell) return '';
  const raw = cell.dataset ? cell.dataset.value : '';
  if (raw !== '' && raw != null && Number.isFinite(Number(raw))) return formatNumber(Number(raw));
  return (cell.textContent || '').trim();
}

function revealInStage(node) {
  if (!node || typeof node.scrollIntoView !== 'function') return;
  requestAnimationFrame(() => {
    try { node.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    catch (err) { node.scrollIntoView(false); }
  });
}

/**
 * Tulis ordo sebagai dua BAGIAN terpisah, supaya angka "dalam" dan "luar"
 * bisa disorot sendiri-sendiri — itulah seluruh isi Aturan Domino.
 *
 * Pada matriks KIRI, angka dalamnya adalah jumlah KOLOM; pada matriks kanan,
 * jumlah BARIS. Keduanya harus sama agar perkaliannya sah.
 */
function buildOrdoBadge(host, values, isLeft) {
  const rows = values.length;
  const cols = values[0].length;
  const firstIsOuter = isLeft;

  host.innerHTML = '';
  const first = el('span', `ordo-part ordo-part--${firstIsOuter ? 'outer' : 'inner'}`, String(rows));
  const second = el('span', `ordo-part ordo-part--${firstIsOuter ? 'inner' : 'outer'}`, String(cols));
  host.append(first, el('span', 'ordo-x', '×'), second);
  return host;
}

/** Invers 2×2 sebagai SUB-LANGKAH: banner "lanjut ke Mini Kuis" ditahan. */
class InverseStep extends Inverse2x2Sim {
  complete() {
    if (this.finished) return;
    this.finished = true;
    this.onComplete();
  }
}

/** Perkalian matriks sebagai SUB-LANGKAH — alasan yang sama. */
class MultiplyStep extends MatrixMultiplySim {
  complete() {
    if (this.finished) return;
    this.finished = true;
    this.onComplete();
  }
}

/* ============================================================
   4. domino_translation — parsing visual + Aturan Domino
   ============================================================ */
export class DominoTranslationSim extends Simulation {
  /**
   * Dua tahap:
   *
   *   1. PARSING — angka di dalam narasi bisa diketuk, lalu diketuk lagi
   *      di sel tujuannya. Yang dilatih bukan hitungan, melainkan
   *      keputusan "angka ini milik baris mana, kolom mana" — kelemahan
   *      terbesar siswa di soal cerita matriks.
   *   2. ATURAN DOMINO — ordo kedua matriks diperagakan bertemu:
   *      angka DALAM harus sama (syarat kali), angka LUAR menentukan
   *      ordo hasilnya.
   *
   * > Permintaan Fase 17 menyebut "sekali klik, angkanya terbang ke slot
   * > yang benar". Di sini ia dipecah jadi ketuk-angka lalu ketuk-slot.
   * > Alasannya pedagogis: kalau satu klik sudah menerbangkan angka ke
   * > tempat yang benar, yang memutuskan penempatan adalah APLIKASI, dan
   * > justru keputusan itulah satu-satunya hal yang sedang diajarkan.
   * > Bentuk ketuk-ketuk ini juga yang dipakai seluruh aplikasi
   * > (kontrak §5 butir 12).
   */
  build() {
    const { story, matrices } = this.config;

    this.picked = null;
    this.placed = new Set();
    this.totalSlots = matrices.reduce((n, m) => n + m.values.length * m.values[0].length, 0);

    this.scaffold({
      brief: this.config.brief,
      promptText: 'Tahap 1 — ketuk sebuah **angka di dalam cerita**, lalu ketuk **sel** tempat angka itu seharusnya duduk.',
      promptStep: 'Tahap 1 dari 2',
      legend: [
        { tone: 'amber', label: 'Kuning = angka yang sedang kamu pegang' },
        { tone: 'blue', label: 'Biru = sel yang masih kosong' },
      ],
    });

    this.checklist = createChecklist([
      'Terjemahkan cerita jadi dua matriks',
      'Periksa Aturan Domino',
    ]);
    this.addHint(this.checklist);

    /* ---- Narasi dengan angka yang bisa diketuk ---- */
    const storyBox = el('div', 'story');
    this.numButtons = [];

    story.forEach((part) => {
      if (part.t != null) {
        storyBox.appendChild(el('span', 'story__text', renderMixed(part.t)));
        return;
      }
      const btn = el('button', 'story-num');
      btn.type = 'button';
      btn.textContent = formatNumber(part.n);
      btn.dataset.value = String(part.n);
      btn.dataset.to = part.to;                   // mis. "A:0,1"
      btn.setAttribute('aria-label', `Angka ${part.n} dari cerita`);
      btn.addEventListener('click', () => this.pickNumber(btn));
      storyBox.appendChild(btn);
      this.numButtons.push(btn);
    });

    this.stage.appendChild(storyBox);

    /* ---- Rangka matriks kosong ---- */
    this.mats = matrices.map((spec, index) => {
      const view = renderMatrix(spec.values, { name: spec.name, empty: true, showOrdo: false });
      view.cells.forEach((cell, key) => {
        cell.classList.add('cell--empty-slot');
        this.track(makeTappable(cell, () => this.dropInto(spec.name, key, cell),
          `Sel ${spec.name} baris ${Number(key.split(',')[0]) + 1} kolom ${Number(key.split(',')[1]) + 1}`));
      });

      const wrap = el('div', 'domino-mat');
      wrap.appendChild(view.root);

      /**
       * Kotak ordo diisi LENGKAP sekarang, lalu disembunyikan dengan
       * `visibility` — bukan dibiarkan kosong.
       *
       * ⚠️ Kotak kosong yang di-`visibility:hidden` memang menempati ruang,
       * tetapi ruangnya SEUKURAN ISINYA — dan isi kosong tingginya nol.
       * Versi pertama begitu, dan barisnya melonjak **24px** persis saat
       * ordonya muncul. Mengisinya lebih dulu membuat ruang yang dipesan
       * sama persis dengan ruang yang nanti dipakai.
       */
      const ordo = el('div', 'ordo-badge');
      buildOrdoBadge(ordo, spec.values, index === 0);
      ordo.style.visibility = 'hidden';
      wrap.appendChild(ordo);
      if (spec.caption) wrap.appendChild(el('div', 'domino-mat__cap', spec.caption));

      return { spec, view, ordo, wrap };
    });

    const row = el('div', 'domino-row');
    this.mats.forEach((m, i) => {
      if (i) row.appendChild(operatorGlyph('×'));
      row.appendChild(m.wrap);
    });
    this.stage.appendChild(row);

    // Ruang untuk hasil pemeriksaan domino, dipesan sejak awal.
    this.dominoHost = this.reserveSlot(96);
    this.dominoHost.classList.add('domino-host');
    this.stage.appendChild(this.dominoHost);

    this.progress = createProgressText(this.totalSlots, 'angka');
    this.addHint(this.progress);
  }

  /* ---------------- TAHAP 1: parsing ---------------- */

  pickNumber(btn) {
    if (this.busy) return;
    if (btn.dataset.spent === 'true') return;

    // Ketuk ulang angka yang sama = batalkan pilihan, bukan kesalahan.
    if (this.picked === btn) {
      this.clearPick();
      return;
    }

    this.clearPick();
    this.picked = btn;
    btn.classList.add('story-num--picked');

    // SEMUA sel kosong menyala, bukan cuma yang benar — kalau hanya yang
    // benar yang menyala, aplikasinya sudah menjawab soalnya.
    this.mats.forEach((m) => m.view.cells.forEach((cell) => {
      if (!cell.dataset.filled) cell.classList.add('cell--awaiting');
    }));
  }

  clearPick() {
    if (this.picked) this.picked.classList.remove('story-num--picked');
    this.picked = null;
    this.mats.forEach((m) => m.view.cells.forEach((cell) => cell.classList.remove('cell--awaiting')));
  }

  async dropInto(matName, key, cell) {
    if (this.busy) return;
    if (cell.dataset.filled) return;

    if (!this.picked) {
      this.reject(cell, 'pickFirst');
      return;
    }

    const btn = this.picked;
    if (btn.dataset.to !== `${matName}:${key}`) {
      // Penolakannya SPESIFIK: sebut alamat yang diketuk, jangan cuma "salah".
      const [i, j] = key.split(',').map(Number);
      this.reject(cell, 'wrongSlot', { nilai: btn.textContent, matriks: matName, baris: i + 1, kolom: j + 1 });
      return;
    }

    this.setBusy(true);
    this.clearPick();

    const chip = makeFlyChip(btn, { text: btn.textContent });
    await landOn(chip, cell, { text: null });

    cell.textContent = btn.textContent;
    cell.dataset.value = btn.dataset.value;
    cell.dataset.filled = 'true';
    cell.classList.remove('cell--empty-slot', 'cell--awaiting');
    cell.classList.add('cell--done', 'anim-land');

    btn.dataset.spent = 'true';
    btn.classList.add('story-num--spent');
    btn.setAttribute('aria-disabled', 'true');

    this.placed.add(`${matName}:${key}`);
    this.progress.set(this.placed.size);
    this.setBusy(false);

    if (this.placed.size >= this.totalSlots) {
      this.checklist.advance(0);
      this.later(() => this.startDominoStep(), 460);
    }
  }

  /* ---------------- TAHAP 2: Aturan Domino ---------------- */

  startDominoStep() {
    this.setPrompt(
      'Tahap 2 — sebelum mengalikan, periksa **Aturan Domino**: angka DALAM kedua ordo harus sama.',
      'Tahap 2 dari 2'
    );

    // Ordonya sudah dibangun sejak `build()`; di sini ia tinggal
    // dimunculkan, jadi tidak ada satu piksel pun yang bergeser.
    this.mats.forEach((m) => {
      m.ordo.style.visibility = 'visible';
      m.ordo.classList.add('anim-land');
      m.innerPart = m.ordo.querySelector('.ordo-part--inner');
      m.outerPart = m.ordo.querySelector('.ordo-part--outer');
    });

    const btn = el('button', 'btn btn--primary btn--pulse');
    btn.type = 'button';
    btn.innerHTML = `${icon('layers', { size: 17 })}<span>Cek Aturan Domino</span>`;
    btn.addEventListener('click', () => this.runDomino(btn));
    this.dominoHost.innerHTML = '';
    this.dominoHost.appendChild(stageRow(btn));
  }

  async runDomino(btn) {
    if (this.busy) return;
    if (!this.claim('domino')) return;

    this.setBusy(true);
    btn.disabled = true;
    btn.classList.remove('btn--pulse');

    const [left, right] = this.mats;
    const innerA = Number(left.innerPart.textContent);
    const innerB = Number(right.innerPart.textContent);

    // 1. Kedua angka DALAM menyala hijau bersamaan.
    left.innerPart.classList.add('ordo-part--glow');
    right.innerPart.classList.add('ordo-part--glow');
    await this.wait(620);

    // 2. Angka dalam matriks kanan TERBANG menempel ke pasangannya.
    //    Tujuannya elemen sungguhan, bukan "titik temu" — mekanik itu
    //    dicabut permanen di Fase 13 dan tidak dihidupkan lagi.
    const chip = makeFlyChip(right.innerPart, { text: right.innerPart.textContent });
    await flyTo(chip, left.innerPart);
    chip.remove();

    const cocok = innerA === innerB;
    left.innerPart.classList.add(cocok ? 'ordo-part--matched' : 'ordo-part--clash');
    right.innerPart.classList.add(cocok ? 'ordo-part--matched' : 'ordo-part--clash');
    await this.wait(360);

    // 3. Angka LUAR menyala, lalu ordo hasilnya muncul.
    left.outerPart.classList.add('ordo-part--outer-glow');
    right.outerPart.classList.add('ordo-part--outer-glow');

    const verdict = el('div', `domino-verdict domino-verdict--${cocok ? 'ok' : 'no'} anim-rise`);
    verdict.innerHTML = cocok
      ? `${icon('check-circle', { size: 18 })}<span>${renderMixed(
          `Angka dalamnya **sama** ($${innerA} = ${innerB}$) — perkalian ini **sah**. ` +
          `Angka luarnya memberi ordo hasil: $${left.outerPart.textContent} \\times ${right.outerPart.textContent}$.`
        )}</span>`
      : `${icon('alert', { size: 18 })}<span>${renderMixed(
          `Angka dalamnya **berbeda** ($${innerA} \\ne ${innerB}$) — perkalian ini tidak terdefinisi.`
        )}</span>`;

    this.dominoHost.innerHTML = '';
    this.dominoHost.appendChild(verdict);

    if (cocok) {
      const hasil = el('div', 'ordo-badge ordo-badge--result anim-land');
      hasil.innerHTML = `<span class="ordo-part ordo-part--outer-glow">${left.outerPart.textContent}</span>`
        + `<span class="ordo-x">×</span>`
        + `<span class="ordo-part ordo-part--outer-glow">${right.outerPart.textContent}</span>`;
      const label = el('div', 'domino-result-label', 'Ordo hasil');
      const box = el('div', 'domino-result');
      box.append(label, hasil);
      this.dominoHost.appendChild(box);
    }

    this.checklist.advance(1);
    this.setBusy(false);

    this.setPrompt(
      cocok
        ? `Cerita sudah jadi objek matematis, dan syarat kalinya sudah kamu periksa sendiri.`
        : `Ordo keduanya tidak cocok — di soal seperti ini, jawabannya "tidak dapat ditentukan".`,
      'Selesai'
    );
    this.complete();
  }
}

/* ============================================================
   5. spldv_utbk — model invers dibaca, bukan dihitung habis
   ============================================================ */
export class SPLDVUtbkSim extends SplSolverSim {
  /**
   * Tahap 1 (menyusun $AX = B$ dari cerita) diwarisi UTUH dari
   * `SplSolverSim` — kelasnya sama, bukan salinan.
   *
   * Yang diganti hanya tahap sesudahnya. `SplSolverSim` menutup dengan
   * mencetak $X$ lengkap; di gaya UTBK, jawabannya justru berhenti di
   * BENTUK $X = A^{-1}B$, dan yang diuji adalah kemampuan membaca opsi:
   * mana yang tandanya benar, mana yang skalarnya terbalik. Menghitung
   * $X$ sampai angka terakhir di sini hanya membuang waktu ujian.
   */
  startSolvePhase() {
    this.setPrompt(
      'Tahap 2 — cari $A^{-1}$ dulu. Determinan, adjoin, lalu skalarnya: sama persis dengan Bab 3.',
      'Tahap 2 dari 3'
    );
    toast.success('Bentuk matriksnya sudah benar! Sekarang cari inversnya.');

    this.subHint = el('div', 'tka-subhint');
    this.addHint(this.subHint);

    const host = el('div', 'spldv-inverse');
    this.resultHost.appendChild(host);

    const sub = new InverseStep(host, {
      matrix: this.config.coefficients,
      name: 'A',
    }, this.config.inverseToasts || this.toasts, () => this.showOptions());

    sub.hintHost = this.subHint;
    this.sub = sub;
    sub.build();
  }

  showOptions() {
    const { options, answerIndex = 0, nameB = 'B' } = this.config;

    this.setPrompt(
      'Tahap 3 — **jangan dihitung sampai selesai.** Pilih opsi yang bentuknya benar untuk $X = A^{-1}B$.',
      'Tahap 3 dari 3'
    );

    // Panggung tahap 2 diredupkan, bukan dihapus: siswa masih perlu melihat
    // inversnya sambil membandingkan opsi.
    this.resultHost.querySelector('.spldv-inverse')?.classList.add('is-retired');

    const box = el('div', 'utbk-panel anim-rise');
    box.appendChild(el('div', 'utbk-panel__head', renderMixed(
      `Bentuk yang dicari: $X = A^{-1}${nameB}$. Manakah penulisan yang **tepat**?`
    )));

    const list = el('div', 'utbk-options');
    this.optionNodes = [];

    options.forEach((opt, index) => {
      const card = el('button', 'utbk-option');
      card.type = 'button';
      card.appendChild(el('span', 'utbk-option__tag', opt.label));
      card.appendChild(el('span', 'utbk-option__tex', renderMixed(`$${opt.tex}$`)));
      card.addEventListener('click', () => this.judgeOption(index, card, list));
      list.appendChild(card);
      this.optionNodes.push(card);
    });

    box.appendChild(list);
    this.resultHost.appendChild(box);
    this.answerIndex = answerIndex;
    this.optionList = list;

    // Soalnya harus terlihat begitu ia muncul, bukan menunggu digulir.
    revealInStage(box);
  }

  judgeOption(index, card, list) {
    if (this.busy) return;

    if (index !== this.answerIndex) {
      /**
       * Opsi keliru DIKUNCI permanen (kontrak §5 butir 11) dan alasannya
       * dijelaskan per opsi — di soal UTBK, tiap pengecoh punya kesalahan
       * yang berbeda (tanda terbalik, skalar terbalik, urutan tertukar),
       * dan itulah yang perlu dikenali siswa.
       */
      const why = (this.config.options[index] || {}).why;
      if (why) toast.error(why);
      else this.reject(card, 'wrongOption');
      lockWrongOption(card);
      return;
    }

    // Jawaban benar mengunci SELURUH pilihan seketika, sebelum animasi
    // apa pun berjalan (kontrak §5 butir 44).
    if (!this.claim('choose')) return;
    this.lockChoices(list, { keep: card });
    card.classList.add('utbk-option--correct');

    const box = el('div', 'explain anim-rise');
    box.innerHTML = `<div class="explain__title">Kenapa ini yang benar</div>`
      + renderMixed(this.config.explanation || '');
    this.resultHost.appendChild(box);

    this.setPrompt('Bentuknya benar — dan kamu tidak perlu menghitungnya sampai habis.', 'Selesai');
    this.complete();
  }

  destroy() {
    if (this.sub) { this.sub.destroy(); this.sub = null; }
    super.destroy();
  }
}

/* ============================================================
   6. sniper_extraction — ambil satu baris, tinggalkan sisanya
   ============================================================ */
export class SniperExtractionSim extends Simulation {
  /**
   * Soal TKA sering menyembunyikan satu variabel di dalam matriks besar,
   * dan siswa refleks mengalikan SELURUH matriksnya — sembilan perkalian
   * untuk satu angka yang dicari. Padahal satu sel hasil hanya bergantung
   * pada SATU baris dan SATU kolom.
   *
   * Simulasi ini melatih refleks itu: begitu sel yang mengandung $k$
   * diketuk, seluruh panggung diredupkan kecuali jalur yang benar-benar
   * dipakai, lalu angkanya ditarik keluar menjadi satu persamaan linear
   * biasa. Sisanya pekerjaan aljabar kelas 8.
   */
  build() {
    const { narrative, matrixA, matrixB, matrixC, kPos, kSymbol = 'k' } = this.config;

    this.kPos = kPos;
    this.solved = false;

    this.scaffold({
      brief: this.config.brief,
      promptText: `Cari nilai $${kSymbol}$ **tanpa** mengalikan seluruh matriks. Ketuk sel yang memuat $${kSymbol}$.`,
      promptStep: 'Langkah 1 dari 2',
      legend: [
        { tone: 'blue', label: 'Biru = baris & kolom yang benar-benar dipakai' },
        { tone: 'amber', label: `Kuning = sel yang memuat $${kSymbol}$` },
      ],
    });

    if (narrative) {
      const box = el('div', 'narrative', renderMixed(narrative));
      this.container.querySelector('.sim').insertBefore(box, this.stage);
    }

    const aView = renderMatrix(matrixA, { name: this.config.nameA || 'A', showAddress: true });
    const bView = renderMatrix(matrixB, { name: this.config.nameB || 'B' });
    const cView = renderMatrix(matrixC, { name: this.config.nameC || 'C' });

    this.aCells = aView.cells;
    this.bCells = bView.cells;
    this.cCells = cView.cells;

    // Sel k ditulis sebagai SIMBOL, bukan angka: ia yang dicari.
    const kCell = this.aCells.get(`${kPos[0]},${kPos[1]}`);
    kCell.textContent = kSymbol;
    kCell.dataset.value = '';
    kCell.classList.add('cell--unknown');
    kCell.appendChild(el('span', 'cell__addr', `a${kPos[0] + 1}${kPos[1] + 1}`));

    this.eqRow = equationRow(
      aView.root, operatorGlyph('×'), bView.root, operatorGlyph('='), cView.root
    );
    this.stage.appendChild(this.eqRow);

    // Ruang persamaan hasil ekstraksi, dipesan sejak awal.
    this.extractHost = this.reserveSlot(120);
    this.extractHost.classList.add('sniper-host');
    this.stage.appendChild(this.extractHost);

    this.aCells.forEach((cell, key) => {
      this.track(makeTappable(cell, () => this.pick(key, cell), `Elemen A ${key}`));
    });
  }

  pick(key, cell) {
    if (this.busy || this.solved) return;

    if (key !== `${this.kPos[0]},${this.kPos[1]}`) {
      // Bukan sekadar "salah": jelaskan bahwa yang menentukan adalah
      // BARIS tempat k berada.
      this.reject(cell, 'notK');
      return;
    }

    if (!this.claim('sniper')) return;
    this.runSniper();
  }

  async runSniper() {
    const { matrixA, matrixB, matrixC, kPos, kSymbol = 'k' } = this.config;
    const [i, j] = kPos;
    const cols = matrixA[0].length;

    this.setBusy(true);
    this.setPrompt(
      `Perhatikan: sel hasil $c_{${i + 1}1}$ hanya dibentuk oleh **baris ${i + 1}** dan **kolom 1**. Sisanya tidak dipakai sama sekali.`,
      'Langkah 1 dari 2'
    );

    // 1. Seluruh panggung diredupkan…
    this.eqRow.classList.add('sniper-on');
    await this.wait(420);

    // 2. …lalu HANYA jalur yang dipakai dinyalakan kembali.
    const rowA = rowCells(this.aCells, i, cols);
    const colB = colCells(this.bCells, 0, matrixB.length);
    const cellC = this.cCells.get(`${i},0`);

    rowA.forEach((c) => c.classList.add('sniper-live'));
    colB.forEach((c) => c.classList.add('sniper-live'));
    cellC.classList.add('sniper-live', 'sniper-live--target');
    await this.wait(560);

    // 3. Angkanya ditarik keluar menjadi persamaan linear biasa.
    const strip = el('div', 'sniper-eq anim-rise');
    this.extractHost.innerHTML = '';
    this.extractHost.appendChild(strip);

    const slots = [];
    for (let t = 0; t < cols; t++) {
      if (t) strip.appendChild(el('span', 'sniper-eq__op', '+'));
      const term = el('span', 'sniper-eq__term');
      const a = el('span', 'sniper-eq__slot');
      const b = el('span', 'sniper-eq__slot');
      term.append(a, el('span', 'sniper-eq__paren', '('), b, el('span', 'sniper-eq__paren', ')'));
      strip.appendChild(term);
      slots.push([a, b]);
    }
    strip.appendChild(el('span', 'sniper-eq__op', '='));
    const rhs = el('span', 'sniper-eq__slot sniper-eq__slot--rhs');
    strip.appendChild(rhs);

    for (let t = 0; t < cols; t++) {
      const src = rowA[t];
      const teksA = t === j ? kSymbol : cellText(src);
      const chipA = makeFlyChip(src, { text: teksA });
      await landOn(chipA, slots[t][0], { text: null });
      slots[t][0].textContent = teksA;
      if (t === j) slots[t][0].classList.add('sniper-eq__slot--unknown');
      slots[t][0].classList.add('anim-land');

      const srcB = colB[t];
      const teksB = cellText(srcB);
      const chipB = makeFlyChip(srcB, { text: teksB });
      await landOn(chipB, slots[t][1], { text: null });
      slots[t][1].textContent = teksB;
      slots[t][1].classList.add('anim-land');
    }

    const teksC = cellText(cellC);
    const chipC = makeFlyChip(cellC, { text: teksC });
    await landOn(chipC, rhs, { text: null });
    rhs.textContent = teksC;
    rhs.classList.add('anim-land');

    // Persamaannya harus terlihat begitu selesai dirakit.
    revealInStage(strip);

    this.setBusy(false);
    this.askForK();
  }

  askForK() {
    const { kSymbol = 'k' } = this.config;

    this.setPrompt(
      `Langkah 2 — sekarang tinggal aljabar biasa. Selesaikan persamaannya dan isikan nilai $${kSymbol}$.`,
      'Langkah 2 dari 2'
    );

    const ask = el('div', 'sniper-ask');
    ask.appendChild(el('span', 'sniper-ask__label', renderMixed(`$${kSymbol} = $`)));

    const input = document.createElement('input');
    input.className = 'numfield';
    input.placeholder = '?';
    input.setAttribute('aria-label', `Nilai ${kSymbol}`);
    attachMathpad(input, { onCommit: (value) => this.judgeK(value, input) });
    ask.appendChild(input);

    this.extractHost.appendChild(ask);
  }

  judgeK(value, input) {
    if (this.solved) return;

    if (Math.abs(Number(value) - Number(this.config.kAnswer)) > 1e-9) {
      input.classList.add('numfield--no');
      this.later(() => input.classList.remove('numfield--no'), 600);
      // Isian dikosongkan — kalau tidak, ketukan berikutnya menyambung
      // angka lama ("9" lalu "5" jadi "95").
      input.value = '';
      this.reject(input, 'wrongK');
      return;
    }

    this.solved = true;
    input.classList.add('numfield--ok');
    input.dataset.locked = 'true';
    input.style.pointerEvents = 'none';

    const done = el('div', 'sniper-done anim-rise');
    // (dibiarkan di tempatnya: strip persamaan sudah dibawa ke pandangan)
    done.innerHTML = `${icon('check-circle', { size: 18 })}<span>${renderMixed(
      this.config.closing || 'Tepat — dan kamu hanya memakai satu baris, bukan sembilan perkalian.'
    )}</span>`;
    this.extractHost.appendChild(done);

    this.setPrompt('Satu baris, satu kolom, satu persamaan — itu saja yang dibutuhkan.', 'Selesai');
    this.complete();
  }
}

/* ============================================================
   7. multi_condition — hitung sendiri, lalu nilai pernyataannya
   ============================================================ */
export class MultiConditionSim extends MultiStatementSim {
  /**
   * Turunan `MultiStatementSim`: seluruh logika penilaian per-pernyataan
   * (`renderStatements()` dan `check()`) dipakai APA ADANYA.
   *
   * Yang diganti hanya cara matriks pendapatannya lahir. Versi lama punya
   * tombol "Hitung Matriks Pendapatan" yang mengisi hasilnya sendiri —
   * aplikasi yang menghitung untuk siswa, tepat di langkah yang paling
   * menentukan jawabannya. Sekarang siswa mengalikannya sendiri lewat
   * mesin perkalian matriks dari Bab 2.
   */
  build() {
    const { context, table, priceRow, capacity } = this.config;

    this.computed = false;
    this.selected = new Set();

    this.scaffold({
      brief: this.config.brief,
      promptText: 'Tahap 1 — hitung sendiri matriks pendapatannya: **baris harga × kolom kapasitas**.',
      promptStep: 'Tahap 1 dari 2',
    });

    this.checklist = createChecklist([
      'Hitung matriks pendapatan',
      'Nilai keempat pernyataan',
    ]);
    this.addHint(this.checklist);

    if (context) {
      const box = el('div', 'narrative', renderMixed(context));
      this.container.querySelector('.sim').insertBefore(box, this.stage);
    }

    if (table) this.stage.appendChild(this.buildTable(table));

    this.subHint = el('div', 'tka-subhint');
    this.addHint(this.subHint);

    this.multiplyHost = el('div', 'mc-multiply');
    this.stage.appendChild(this.multiplyHost);

    this.statementHost = el('div', 'mc-statements');
    this.stage.appendChild(this.statementHost);

    const sub = new MultiplyStep(this.multiplyHost, {
      cases: [{
        id: 'revenue',
        label: 'Pendapatan',
        nameA: this.config.priceName || 'Harga',
        nameB: this.config.capacityName || 'Kapasitas',
        matrixA: priceRow,
        matrixB: capacity,
      }],
    }, this.config.multiplyToasts || this.toasts, () => this.onRevenueDone());

    sub.hintHost = this.subHint;
    this.sub = sub;
    sub.build();
  }

  buildTable(table) {
    const wrap = el('div', 'data-table-wrap');
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
    wrap.appendChild(tbl);
    return wrap;
  }

  onRevenueDone() {
    this.computed = true;
    this.checklist.advance(0);

    const result = multiply(this.config.priceRow, this.config.capacity);

    /**
     * Matriks hasil DIKUNCI di layar.
     *
     * Keempat pernyataan di bawah semuanya merujuk angka-angka ini, dan
     * soal bergaya "pilih semua yang benar" dijawab dengan membandingkan,
     * bukan menghitung ulang. Kalau angkanya harus digulir untuk dilihat,
     * siswa akan menghitung ulang di kepala — dan di situlah kesalahan
     * masuk.
     */
    this.multiplyHost.classList.add('is-retired');

    const locked = el('div', 'mc-locked anim-rise');
    locked.appendChild(el('div', 'mc-locked__label', 'Matriks pendapatan (hasil kerjamu)'));

    const row = el('div', 'mc-locked__row');
    this.config.branchNames.forEach((name, j) => {
      const chip = el('div', 'mc-locked__chip');
      chip.appendChild(el('span', 'mc-locked__name', name));
      chip.appendChild(el('span', 'mc-locked__value', rupiah(result[0][j])));
      row.appendChild(chip);
    });
    locked.appendChild(row);

    this.stage.insertBefore(locked, this.statementHost);

    this.setPrompt(
      'Tahap 2 — centang **semua** pernyataan yang benar, lalu tekan Periksa Jawaban.',
      'Tahap 2 dari 2'
    );

    // Penilaian per-pernyataan diwarisi utuh dari MultiStatementSim.
    this.renderStatements();

    // Pernyataannya tumbuh di bawah panggung perkalian yang panjang; tanpa
    // ini siswa harus menggulir sendiri untuk menemukan soalnya.
    revealInStage(this.statementHost);
  }

  check(wrap, submit) {
    super.check(wrap, submit);
    if (this.checklist) this.checklist.advance(1);
  }

  destroy() {
    if (this.sub) { this.sub.destroy(); this.sub = null; }
    super.destroy();
  }
}
