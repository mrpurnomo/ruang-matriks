/**
 * simBasics.js — Simulasi Bab 1 (Konsep Dasar)
 * identify_element · ordo_builder · label_matrix_types · transpose_morph · equality_link
 */

import {
  Simulation, el, renderMatrix, rowCells, colCells, clearHighlights,
  stageRow, createFlowArrow, lockWrongOption, makeTappable, setCellsMuted,
  createBrief, createStage, createProgressText,
} from './simCore.js';
import { renderMixed } from '../../../engine/katexRenderer.js';
import { transpose, ordoText, formatNumber } from '../../../engine/matrix.js';
import { icon } from '../../../ui/icons.js';
import { makeDraggable, registerDropZone } from '../../../interactions/dragDrop.js';
import { morphRowToColumn } from '../../../interactions/mergeAnimation.js';
import { makeFlyChip, flyTo, merge, landOn } from '../../../interactions/flyToAnimation.js';
import { attachMathpad } from '../../../ui/mathpad.js';
import toast from '../../../ui/toast.js';

/* ============================================================
   1. identify_element — baca alamat baris/kolom
   ============================================================ */
export class IdentifyElementSim extends Simulation {
  build() {
    this.stepIndex = 0;
    this.maxReached = 0;

    this.scaffold({
      brief: this.config.brief,
      promptText: 'Memuat…',
      promptStep: 'Langkah 1',
      legend: [
        { tone: 'blue', label: 'Biru = baris (deret meja ke samping)' },
        { tone: 'coral', label: 'Oranye = kolom (deret meja ke belakang)' },
      ],
    });

    this.useSteps(
      this.config.steps.map((s, i) => s.title || `Langkah ${i + 1}`),
      {
        allowJump: true,
        onJump: (index) => {
          if (index > this.maxReached) return;
          this.stepIndex = index;
          this.runStep();
        },
      }
    );

    this.runStep();
  }

  runStep() {
    const step = this.config.steps[this.stepIndex];
    if (!step) return this.complete();

    this.maxReached = Math.max(this.maxReached, this.stepIndex);
    this.setStep(this.stepIndex);

    // Setiap slide dibangun ulang dari nol — tidak ada state yang bocor.
    this.resetStage();
    this.setPrompt(step.prompt, `Langkah ${this.stepIndex + 1} dari ${this.config.steps.length}`);

    const { root, cells } = renderMatrix(this.config.matrix, {
      name: this.config.name,
      showAddress: true,
      showOrdo: true,
    });
    this.cells = cells;
    this.stage.appendChild(stageRow(root));

    this.answerHost = el('div', 'stage__row');
    this.stage.appendChild(this.answerHost);

    const rows = this.config.matrix.length;
    const cols = this.config.matrix[0].length;

    const solved = this.isSlideSolved(this.stepIndex);

    if (step.mode === 'pick_row') {
      rowCells(cells, step.target - 1, cols)
        .forEach((c) => c.classList.add(solved ? 'cell--done' : 'cell--row-hl'));
      this.renderChoices(step, 'wrongRow', solved);
    } else if (step.mode === 'pick_col') {
      colCells(cells, step.target - 1, rows)
        .forEach((c) => c.classList.add(solved ? 'cell--done' : 'cell--col-hl'));
      this.renderChoices(step, 'wrongCol', solved);
    } else if (step.mode === 'drag_label') {
      const [r, c] = step.targetCell;
      const target = cells.get(`${r - 1},${c - 1}`);
      if (solved) {
        target.classList.add('cell--done');
        target.appendChild(el('span', 'cell__check', icon('check', { size: 11 })));
        this.answerHost.appendChild(
          this.solvedBanner(`Alamatnya $${step.answerLabel}$ — sudah kamu jawab benar.`)
        );
      } else {
        target.classList.add('cell--pulse');
        this.renderLabels(step, target);
      }
    }
  }

  renderChoices(step, wrongKey, solved = false) {
    step.options.forEach((label, index) => {
      const btn = el('button', 'btn btn--ghost', label);
      btn.type = 'button';

      if (solved) {
        btn.disabled = true;
        if (index === step.answerIndex) btn.classList.add('btn--success');
        this.answerHost.appendChild(btn);
        return;
      }

      btn.addEventListener('click', () => {
        if (this.busy) return;
        if (index === step.answerIndex) {
          btn.classList.add('anim-flash-success');
          this.markSlideSolved(this.stepIndex);
          this.stepIndex += 1;
          this.later(() => this.runStep(), 520);
        } else {
          // Opsi salah dimatikan supaya siswa memilih dari sisa yang benar.
          this.reject(btn, wrongKey);
          lockWrongOption(btn);
        }
      });
      this.answerHost.appendChild(btn);
    });
  }

  renderLabels(step, targetCell) {
    this.track(registerDropZone(targetCell, {
      padding: 8,
      onDrop: (data, sourceEl) => {
        if (data.label === step.answerLabel) {
          targetCell.classList.remove('cell--pulse');
          targetCell.classList.add('cell--done');
          targetCell.appendChild(el('span', 'cell__check', icon('check', { size: 11 })));
          sourceEl.remove();
          this.markSlideSolved(this.stepIndex);
          this.stepIndex += 1;
          this.later(() => this.runStep(), 620);
        } else {
          this.reject(sourceEl, 'wrongLabel');
          lockWrongOption(sourceEl);
        }
      },
    }));

    step.labels.forEach((label) => {
      const chip = el('div', 'symbol-chip');
      chip.innerHTML = renderMixed(`$${label}$`);
      chip.dataset.label = label;
      makeDraggable(chip, { data: { label } });
      this.answerHost.appendChild(chip);
    });

    this.answerHost.appendChild(el('p', 'text-sm text-muted', 'Seret label ke sel yang berkedip.'));
  }
}

/* ============================================================
   2. ordo_builder — slide mandiri, tiap tantangan direset bersih
   ============================================================ */
export class OrdoBuilderSim extends Simulation {
  build() {
    this.index = 0;
    this.maxReached = 0;

    this.scaffold({ brief: this.config.brief, promptText: '', promptStep: 'Tantangan 1' });

    this.useSteps(
      this.config.challenges.map((c, i) => `Tantangan ${i + 1}`),
      {
        allowJump: true,
        onJump: (index) => {
          if (index > this.maxReached) return;
          this.index = index;
          this.runChallenge();
        },
      }
    );

    this.runChallenge();
  }

  /** Setiap tantangan memulai dari 1×1 — state slide sebelumnya tidak terbawa. */
  runChallenge() {
    const challenge = this.config.challenges[this.index];
    if (!challenge) return this.complete();

    this.maxReached = Math.max(this.maxReached, this.index);
    this.setStep(this.index);
    this.resetStage();

    // Kunjungan ulang memakai ordo yang DULU berhasil dibuat, bukan reset 1x1.
    const remembered = this.getSlideState(this.index);
    this.rows = remembered ? remembered.rows : 1;
    this.cols = remembered ? remembered.cols : 1;
    this.solved = Boolean(remembered);

    this.setPrompt(challenge.prompt, `Tantangan ${this.index + 1} dari ${this.config.challenges.length}`);

    const controls = el('div');
    controls.style.cssText = 'display:grid;gap:var(--sp-4);min-width:230px';
    controls.appendChild(this.makeSlider('Baris', 'rows'));
    controls.appendChild(this.makeSlider('Kolom', 'cols'));

    this.gridHost = el('div', 'matrix');
    const bracket = el('div', 'matrix__bracket');
    this.grid = el('div', 'matrix__grid');
    bracket.appendChild(this.grid);
    this.ordoLabel = el('span', 'matrix__ordo', '');
    bracket.appendChild(this.ordoLabel);
    this.gridHost.appendChild(bracket);

    this.stage.appendChild(stageRow(controls, this.gridHost));

    // Validasi hanya terjadi saat siswa menekan "Cek" — bukan otomatis
    // saat slider bergerak. Ini membuat setiap slide punya penutup yang jelas.
    this.checkBtn = el('button', 'btn btn--primary');
    this.checkBtn.type = 'button';
    this.checkBtn.innerHTML = `${icon('check', { size: 17 })}<span>Cek Ordo</span>`;
    this.checkBtn.addEventListener('click', () => this.check());

    // Ruang vonis DIPESAN sejak awal dengan tinggi tetap. Sebelumnya panel
    // "Tepat!" disisipkan ke aliran dokumen dan mendorong seluruh panggung
    // turun tepat saat siswa sedang melihat hasilnya.
    this.verdictHost = this.reserveSlot(72);
    this.verdictHost.classList.add('reserved-slot--verdict');
    this.stage.appendChild(stageRow(this.checkBtn));
    this.stage.appendChild(this.verdictHost);

    this.renderGrid();

    if (this.solved) {
      this.checkBtn.disabled = true;
      this.verdictHost.appendChild(
        this.solvedBanner(`Sudah selesai — ordo ${this.rows}×${this.cols} terbentuk dengan benar.`)
      );
    }
  }

  makeSlider(label, key) {
    const wrap = el('div');
    const head = el('div');
    head.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:var(--sp-2)';
    head.appendChild(el('span', 'text-sm', `<strong>${label}</strong>`));
    const current = this[key] || 1;
    const value = el('span', 'badge badge--primary', String(current));
    head.appendChild(value);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = '1';
    input.max = '3';
    input.value = String(current);
    input.disabled = this.solved;
    input.style.width = '100%';
    input.setAttribute('aria-label', `Jumlah ${label.toLowerCase()}`);

    input.addEventListener('input', () => {
      if (this.solved) return;
      this[key] = Number(input.value);
      value.textContent = input.value;
      this.renderGrid();
    });

    wrap.append(head, input);
    return wrap;
  }

  renderGrid() {
    this.grid.innerHTML = '';
    this.grid.style.gridTemplateColumns = `repeat(${this.cols}, auto)`;
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        this.grid.appendChild(el('div', 'cell anim-pop-in', '·'));
      }
    }
    this.ordoLabel.textContent = `${this.rows}×${this.cols}`;
  }

  check() {
    if (this.solved) return;
    const challenge = this.config.challenges[this.index];
    const bracket = this.gridHost.querySelector('.matrix__bracket');

    if (this.rows === challenge.rows && this.cols === challenge.cols) {
      this.solved = true;
      this.markSlideSolved(this.index, { rows: this.rows, cols: this.cols });
      bracket.classList.add('anim-flash-success');
      this.checkBtn.disabled = true;

      const verdict = el('div', 'panel anim-pop-in');
      verdict.style.borderColor = 'var(--success)';
      verdict.style.background = 'var(--success-soft)';
      verdict.innerHTML = `<div style="display:flex;align-items:center;gap:var(--sp-3);color:var(--success)">
        ${icon('check-circle', { size: 24 })}
        <strong>Tepat! Ordo ${this.rows}×${this.cols} terbentuk.</strong></div>`;
      this.verdictHost.appendChild(verdict);

      toast.success(this.msg('success') || 'Pas!');
      this.index += 1;
      this.later(() => this.runChallenge(), 1200);
      return;
    }

    // Umpan balik spesifik: sumbu mana yang meleset.
    if (this.rows !== challenge.rows) this.reject(bracket, 'wrongRows');
    else this.reject(bracket, 'wrongCols');
  }
}

/* ============================================================
   3. label_matrix_types — tempelkan LABEL ke matriks (bisa lebih dari satu)
   ============================================================ */
export class LabelMatrixTypesSim extends Simulation {
  build() {
    this.index = 0;
    this.maxReached = 0;

    this.scaffold({
      brief: this.config.brief,
      promptText: 'Ketuk sebuah label, lalu ketuk matriksnya. Cari SEMUA label yang cocok.',
      promptStep: 'Matriks 1',
    });

    this.useSteps(
      this.config.cards.map((c, i) => `Matriks ${i + 1}`),
      {
        allowJump: true,
        onJump: (index) => {
          if (index > this.maxReached) return;
          this.index = index;
          this.runCard();
        },
      }
    );

    this.runCard();
  }

  runCard() {
    const card = this.config.cards[this.index];
    if (!card) return this.complete();

    this.maxReached = Math.max(this.maxReached, this.index);
    this.setStep(this.index);
    this.resetStage();

    const remembered = this.getSlideState(this.index);
    this.attached = new Set(remembered ? remembered.attached : []);
    this.needed = new Set(card.valid);
    this.solvedCard = Boolean(remembered);

    this.setPrompt(
      `Matriks ini termasuk jenis apa saja? Temukan **semua** label yang cocok (ada ${card.valid.length}).`,
      `Matriks ${this.index + 1} dari ${this.config.cards.length}`
    );

    const view = renderMatrix(card.matrix, { name: 'M', showOrdo: true });
    this.matrixView = view;

    // Rak tempat label yang sudah benar menempel di matriks.
    this.shelf = el('div', 'label-shelf');
    this.shelf.appendChild(el('span', 'label-shelf__hint', 'Label yang cocok akan muncul di sini'));

    const target = el('div', 'label-target');
    target.appendChild(view.root);
    target.appendChild(this.shelf);

    this.stage.appendChild(stageRow(target));
    this.stage.appendChild(createFlowArrow('arrow-down'));

    this.poolHost = el('div', 'label-pool');
    this.stage.appendChild(this.poolHost);

    this.track(registerDropZone(target, {
      padding: 10,
      onDrop: (data, sourceEl) => this.handleDrop(card, data, sourceEl),
    }));

    if (this.solvedCard) {
      // Kunjungan ulang: tampilkan label yang dulu benar, tanpa interaksi lagi.
      const hint = this.shelf.querySelector('.label-shelf__hint');
      if (hint) hint.remove();
      card.valid.forEach((id) => {
        const meta = this.config.labelPool.find((l) => l.id === id);
        const badge = el('span', 'badge badge--success',
          `${icon('check', { size: 12 })}<span>${meta ? meta.name : id}</span>`);
        this.shelf.appendChild(badge);
      });
      this.stage.appendChild(this.solvedBanner('Matriks ini sudah kamu beri label lengkap.'));
      return;
    }

    this.config.labelPool.forEach((label) => {
      const chip = el('div', 'drag-card label-chip', label.name);
      chip.dataset.labelId = label.id;
      makeDraggable(chip, { data: { id: label.id, name: label.name } });
      this.poolHost.appendChild(chip);
    });
  }

  handleDrop(card, data, sourceEl) {
    if (this.attached.has(data.id)) return;

    if (!card.valid.includes(data.id)) {
      // Label keliru dimatikan — pilihan mengerucut, bukan menebak berulang.
      const why = (this.config.reasons && this.config.reasons[data.id]) || 'wrongLabel';
      this.reject(sourceEl, why);
      lockWrongOption(sourceEl);
      return;
    }

    this.attached.add(data.id);
    sourceEl.remove();

    const hint = this.shelf.querySelector('.label-shelf__hint');
    if (hint) hint.remove();

    const badge = el('span', 'badge badge--success anim-pop-in', `${icon('check', { size: 12 })}<span>${data.name}</span>`);
    this.shelf.appendChild(badge);

    this.matrixView.bracket.classList.add('anim-flash-success');
    this.later(() => this.matrixView.bracket.classList.remove("anim-flash-success"), 620);

    if (this.attached.size >= this.needed.size) {
      toast.success(
        card.valid.length > 1
          ? `Lengkap! Matriks ini memang termasuk ${card.valid.length} jenis sekaligus.`
          : 'Tepat!'
      );
      this.markSlideSolved(this.index, { attached: [...this.attached] });
      this.index += 1;
      this.later(() => this.runCard(), 1300);
    } else {
      const left = this.needed.size - this.attached.size;
      toast.info(`Benar! Masih ada ${left} label lagi yang cocok untuk matriks ini.`);
    }
  }
}

/* ============================================================
   4. transpose_morph — baris BERUBAH menjadi kolom (tanpa metafora lipat)
   ============================================================ */
export class TransposeMorphSim extends Simulation {
  build() {
    this.rowIndex = 0;
    this.result = transpose(this.config.matrix);

    this.scaffold({
      brief: this.config.brief,
      promptText: 'Klik tombol di bawah untuk memindahkan baris pertama menjadi kolom pertama.',
      promptStep: `0 / ${this.config.matrix.length} baris`,
      legend: [
        { tone: 'blue', label: 'Biru = baris asal' },
        { tone: 'coral', label: 'Oranye = kolom hasil' },
      ],
    });

    const source = renderMatrix(this.config.matrix, {
      name: this.config.name, showAddress: true, showOrdo: true,
    });
    this.sourceCells = source.cells;

    const target = renderMatrix(this.result, {
      name: `${this.config.name}ᵀ`, empty: true, showAddress: true, showOrdo: true,
    });
    this.targetCells = target.cells;

    this.stage.appendChild(stageRow(source.root, createFlowArrow('arrow-right'), target.root));

    this.moveBtn = el('button', 'btn btn--primary btn--pulse');
    this.moveBtn.type = 'button';
    this.moveBtn.innerHTML = `${icon('swap', { size: 17 })}<span>Pindahkan Baris 1 → Kolom 1</span>`;
    this.moveBtn.addEventListener('click', () => this.morphNext());

    this.stage.appendChild(stageRow(this.moveBtn));

    this.highlightRow(0);
  }

  highlightRow(index) {
    clearHighlights(this.sourceCells);
    clearHighlights(this.targetCells);

    const cols = this.config.matrix[0].length;
    rowCells(this.sourceCells, index, cols).forEach((c) => c.classList.add('cell--row-hl'));

    const rows = this.result.length;
    colCells(this.targetCells, index, rows).forEach((c) => c.classList.add('cell--col-hl'));
  }

  async morphNext() {
    if (this.busy) return;
    const i = this.rowIndex;
    if (i >= this.config.matrix.length) return;

    this.setBusy(true);
    this.moveBtn.disabled = true;
    this.moveBtn.classList.remove('btn--pulse');

    const cols = this.config.matrix[0].length;
    const from = rowCells(this.sourceCells, i, cols);
    const to = colCells(this.targetCells, i, this.result.length);
    const values = this.config.matrix[i].map(formatNumber);

    this.setPrompt(
      `Baris ke-${i + 1} (**berwarna biru**) berputar menjadi kolom ke-${i + 1} (**berwarna oranye**).`,
      `${i} / ${this.config.matrix.length} baris`
    );

    await morphRowToColumn(from, to, values);

    from.forEach((c) => { c.classList.remove('cell--row-hl'); c.classList.add('cell--done'); });
    to.forEach((c) => {
      c.classList.remove('cell--col-hl');
      c.classList.add('cell--done');
      c.appendChild(el('span', 'cell__check', icon('check', { size: 11 })));
    });

    this.rowIndex += 1;
    this.setBusy(false);

    if (this.rowIndex >= this.config.matrix.length) {
      // Tombol disembunyikan, BUKAN dihapus: menghapusnya akan mengempiskan
      // barisnya dan menggeser tata letak tepat saat siswa melihat hasil.
      this.moveBtn.style.visibility = 'hidden';
      this.moveBtn.disabled = true;
      this.setPrompt(
        `Selesai — ordo berubah dari $${ordoText(this.config.matrix).replace('×', ' \\times ')}$ menjadi $${ordoText(this.result).replace('×', ' \\times ')}$.`,
        'Selesai'
      );
      this.complete();
      return;
    }

    this.highlightRow(this.rowIndex);
    this.moveBtn.disabled = false;
    this.moveBtn.classList.add('btn--pulse');
    this.moveBtn.innerHTML =
      `${icon('swap', { size: 17 })}<span>Pindahkan Baris ${this.rowIndex + 1} → Kolom ${this.rowIndex + 1}</span>`;
    this.setPrompt(
      `Sekarang baris ke-${this.rowIndex + 1}. Klik tombol untuk memutarnya menjadi kolom.`,
      `${this.rowIndex} / ${this.config.matrix.length} baris`
    );
  }
}

/* ============================================================
   5. equality_link — klik elemen kiri, pasangannya menyala otomatis
   ============================================================ */
export class EqualityLinkSim extends Simulation {
  /**
   * Dua ketukan per pasangan, dan TIDAK ADA jawaban yang dibocorkan.
   *
   * Alurnya: ketuk elemen di matriks kiri → pasangan seletaknya di kanan
   * menyala → ketuk pasangan itu → keduanya terbang menyatu menjadi sebuah
   * PERSAMAAN di bawah panggung.
   *
   * Versi sebelumnya langsung mencetak "$p = 7$" begitu selnya diklik. Itu
   * menyelesaikan soalnya untuk siswa: yang tersisa cuma membaca. Sekarang
   * persamaannya yang muncul ($2q = 10$), dan nilai variabelnya diisi siswa
   * lewat Mathpad.
   */
  build() {
    this.checked = new Set();
    this.pending = null;      // sel kiri yang sedang menunggu pasangannya

    this.scaffold({
      brief: this.config.brief,
      promptText: 'Ketuk satu elemen di matriks **kiri**. Pasangan seletaknya di kanan akan menyala.',
      promptStep: `0 / ${this.total()} pasangan`,
      legend: [
        { tone: 'blue', label: 'Biru = elemen yang sedang kamu tunjuk' },
        { tone: 'amber', label: 'Kuning = elemen berisi variabel' },
      ],
    });

    // Pasangan boleh diperiksa dalam urutan bebas, jadi yang ditampilkan
    // hitungannya — bukan navigasi langkah yang menyiratkan urutan wajib.
    this.progress = createProgressText(this.total(), 'pasangan');
    this.addHint(this.progress);

    const left = this.renderSide(this.config.left, 'A');
    const right = this.renderSide(this.config.right, 'B');
    this.leftCells = left.cells;
    this.rightCells = right.cells;

    this.stage.appendChild(stageRow(left.root, el('div', 'op-glyph', '='), right.root));

    // Tempat persamaan tumbuh. Tingginya dipesan sejak awal supaya matriks di
    // atasnya tidak terdorong saat persamaan muncul.
    this.infoHost = this.reserveSlot(96);
    this.infoHost.classList.add('reserved-slot--verdict');
    this.stage.appendChild(this.infoHost);

    // Tandai sel bervariabel agar mudah dikenali.
    this.config.variables.forEach((v) => {
      const cell = this.leftCells.get(`${v.cell[0] - 1},${v.cell[1] - 1}`);
      if (cell) cell.classList.add('cell--target');
    });

    // Sisi kiri = pemicu; sisi kanan = tujuan. Keduanya bisa diketuk, tapi
    // sisi kanan menolak selama belum ada pasangan yang dipilih.
    this.config.left.forEach((row, i) => {
      row.forEach((_, j) => {
        const cell = this.leftCells.get(`${i},${j}`);
        this.track(makeTappable(cell, () => this.pickLeft(i, j),
          `Elemen kiri baris ${i + 1} kolom ${j + 1}`));
      });
    });

    this.config.right.forEach((row, i) => {
      row.forEach((_, j) => {
        const cell = this.rightCells.get(`${i},${j}`);
        this.track(makeTappable(cell, () => this.pickRight(i, j),
          `Elemen kanan baris ${i + 1} kolom ${j + 1}`));
      });
    });
  }

  total() {
    return this.config.left.length * this.config.left[0].length;
  }

  renderSide(data, name) {
    const numeric = data.map((row) => row.map(() => 0));
    const { root, cells, bracket } = renderMatrix(numeric, { name, showAddress: true });
    data.forEach((row, i) => {
      row.forEach((value, j) => {
        const cell = cells.get(`${i},${j}`);
        cell.textContent = value;
      });
    });
    return { root, cells, bracket };
  }

  /** Kembalikan penanda kuning pada sel bervariabel yang belum tuntas. */
  repaintVariables() {
    this.config.variables.forEach((v) => {
      const k = `${v.cell[0] - 1},${v.cell[1] - 1}`;
      if (!this.checked.has(k)) {
        const c = this.leftCells.get(k);
        if (c) c.classList.add('cell--target');
      }
    });
  }

  /**
   * Kunci seluruh elemen KIRI selain yang sedang dipilih (Fase 12, isu 11).
   *
   * Selama satu pasangan sedang dikerjakan, mengetuk elemen kiri yang lain
   * hanya menghasilkan kebingungan: pilihannya berpindah diam-diam dan siswa
   * kehilangan jejak pasangan mana yang sedang ia periksa. Sisi KANAN sengaja
   * dibiarkan hidup — di sanalah siswa boleh salah menebak pasangan dan
   * mendapat penjelasan mengapa itu bukan elemen seletak (kontrak §5 butir 3).
   */
  lockOtherSources(activeKey) {
    this.leftCells.forEach((cell, key) => {
      if (key === activeKey) return;
      cell.classList.toggle('cell--muted', activeKey != null);
      if (activeKey != null) cell.dataset.dragDisabled = 'true';
      else delete cell.dataset.dragDisabled;
    });
  }

  /** Batalkan pilihan yang sedang menggantung dan buka kembali semua sel. */
  cancelPending() {
    this.pending = null;
    this.lockOtherSources(null);
    clearHighlights(this.leftCells);
    clearHighlights(this.rightCells);
    this.repaintVariables();
    this.setPrompt(
      'Ketuk satu elemen di matriks **kiri**. Pasangan seletaknya di kanan akan menyala.',
      `${this.checked.size} / ${this.total()} pasangan`
    );
  }

  /* ---------------- Ketukan 1: elemen kiri ---------------- */
  pickLeft(i, j) {
    if (this.busy) return;

    const key = `${i},${j}`;
    if (this.checked.has(key)) {
      toast.info('Pasangan ini sudah kamu cek.');
      return;
    }

    // Ketukan kedua pada sel yang SAMA = batalkan. Ini satu-satunya jalan
    // keluar setelah sel lain dikunci, jadi ia harus ada.
    if (this.pending && this.pending.key === key) {
      this.cancelPending();
      return;
    }

    clearHighlights(this.leftCells);
    clearHighlights(this.rightCells);
    this.repaintVariables();

    const leftCell = this.leftCells.get(key);
    const rightCell = this.rightCells.get(key);

    leftCell.classList.add('cell--pulse');
    // Hanya pasangan SELETAK yang menyala — inilah pelajarannya, jadi ia
    // ditunjukkan lewat warna, bukan lewat kalimat.
    rightCell.classList.add('cell--pulse');

    this.pending = { i, j, key, leftCell, rightCell };
    this.lockOtherSources(key);

    this.setPrompt(
      `Sekarang ketuk pasangannya di matriks **kanan** — elemen yang sedang **berkedip** di baris ${i + 1}, kolom ${j + 1}. `
      + 'Ketuk lagi elemen kiri yang sama kalau ingin membatalkan.',
      `${this.checked.size} / ${this.total()} pasangan`
    );
  }

  /* ---------------- Ketukan 2: pasangan di kanan ---------------- */
  pickRight(i, j) {
    if (this.busy) return;

    const cell = this.rightCells.get(`${i},${j}`);

    if (!this.pending) {
      this.reject(cell, 'pickLeftFirst');
      return;
    }

    if (i !== this.pending.i || j !== this.pending.j) {
      const p = this.pending;
      this.reject(cell, 'notAligned', {
        ai: p.i + 1, aj: p.j + 1, bi: i + 1, bj: j + 1,
      });
      return;
    }

    this.mergePair(this.pending);
  }

  /* ---------------- Peleburan → persamaan ---------------- */
  async mergePair(pair) {
    this.setBusy(true);
    this.pending = null;
    this.lockOtherSources(null);

    const { i, j, key, leftCell, rightCell } = pair;
    const leftRaw = String(this.config.left[i][j]);
    const rightRaw = String(this.config.right[i][j]);
    const variable = this.config.variables.find(
      (v) => v.cell[0] === i + 1 && v.cell[1] === j + 1
    );

    // Panel persamaan disiapkan lebih dulu supaya chip punya sasaran mendarat.
    this.infoHost.innerHTML = '';
    const panel = el('div', 'equation-panel anim-rise');
    panel.appendChild(el('div', 'panel__label', `Baris ${i + 1}, Kolom ${j + 1}`));

    const line = el('div', 'equation-panel__line');
    const slot = el('span', 'equation-panel__slot', '…');
    line.appendChild(slot);
    panel.appendChild(line);
    this.infoHost.appendChild(panel);

    // Kedua elemen terbang dan menyatu menjadi satu persamaan.
    const chips = [leftCell, rightCell].map((c) => makeFlyChip(c, { text: c.textContent }));
    await Promise.all(chips.map((chip) => flyTo(chip, slot)));
    const merged = await merge(chips, `${leftRaw} = ${rightRaw}`, { operator: '=' });
    await landOn(merged, slot, { text: null });

    slot.innerHTML = renderMixed(`$${leftRaw} = ${rightRaw}$`);

    this.setBusy(false);

    if (!variable) {
      // Pasangan tanpa variabel: cukup diperiksa sama atau tidak.
      const same = leftRaw === rightRaw;
      const verdict = el('div', `equation-panel__verdict equation-panel__verdict--${same ? 'ok' : 'no'}`);
      verdict.innerHTML = `${icon(same ? 'check-circle' : 'x-circle', { size: 18 })}<span>${
        same
          ? 'Kedua elemen sudah sama — syarat kesamaan terpenuhi di posisi ini.'
          : 'Kedua elemen berbeda — di posisi ini syarat kesamaan belum terpenuhi.'
      }</span>`;
      panel.appendChild(verdict);

      if (same) this.markDone(key, leftCell, rightCell);
      else toast.error('Elemen seletak ini nilainya berbeda, jadi kedua matriks belum bisa disebut sama.');
      return;
    }

    this.askVariable(panel, variable, key, leftCell, rightCell, rightRaw);
  }

  /**
   * Nilai variabel DIISI SISWA. Aplikasi hanya menyodorkan persamaannya;
   * menyelesaikannya adalah pekerjaan matematika milik siswa.
   */
  askVariable(panel, variable, key, leftCell, rightCell, rhs) {
    const ask = el('div', 'equation-panel__ask');
    ask.appendChild(el('span', 'equation-panel__ask-label',
      renderMixed(`Jadi $${variable.symbol} = $`)));

    const input = document.createElement('input');
    input.className = 'numfield';
    input.placeholder = '?';
    input.setAttribute('aria-label', `Nilai ${variable.symbol}`);

    attachMathpad(input, {
      allowFraction: true,
      onCommit: (value) => {
        if (Math.abs(Number(value) - Number(variable.answer)) < 1e-9) {
          input.classList.add('numfield--ok');
          input.dataset.locked = 'true';
          input.style.pointerEvents = 'none';

          // Sel kiri baru menampilkan angkanya SETELAH siswa menemukannya.
          leftCell.textContent = formatNumber(Number(variable.answer));
          this.markDone(key, leftCell, rightCell);
          return;
        }

        input.classList.add('numfield--no');
        this.later(() => input.classList.remove("numfield--no"), 600);

        // Isian DIKOSONGKAN setelah jawaban keliru. Tanpa ini, Mathpad dibuka
        // lagi dengan angka lama masih di dalamnya dan ketukan berikutnya
        // menyambung ("9" lalu "5" menjadi "95") — siswa merasa jawabannya
        // benar padahal yang terkirim angka lain.
        input.value = '';
        this.reject(input, 'wrongVariable', {
          symbol: variable.symbol,
          expr: variable.expr,
          rhs,
        });
      },
    });

    ask.appendChild(input);
    panel.appendChild(ask);

    this.setPrompt(
      `Persamaannya sudah terbentuk. Selesaikan sendiri, lalu isi nilai $${variable.symbol}$.`,
      `${this.checked.size} / ${this.total()} pasangan`
    );
  }

  markDone(key, leftCell, rightCell) {
    if (this.checked.has(key)) return;
    this.checked.add(key);
    if (this.progress) this.progress.set(this.checked.size);

    // Pasangan tuntas: seluruh sel sumber dibuka kembali.
    this.lockOtherSources(null);

    [leftCell, rightCell].forEach((c) => {
      c.classList.remove('cell--target', 'cell--pulse');
      c.classList.add('cell--done');
      if (!c.querySelector('.cell__check')) {
        c.appendChild(el('span', 'cell__check', icon('check', { size: 11 })));
      }
    });

    if (this.checked.size >= this.total()) {
      this.setPrompt('Semua pasangan sudah dicek — kedua matriks terbukti sama.', 'Selesai');
      this.later(() => this.complete(), 500);
      return;
    }

    this.setPrompt(
      'Ketuk elemen berikutnya di matriks **kiri** untuk membandingkan pasangannya.',
      `${this.checked.size} / ${this.total()} pasangan`
    );
  }
}

/* ============================================================
   6. coming_soon — placeholder jujur untuk simulasi yang belum dibangun
   ============================================================ */
/**
 * Sub-topik yang materinya sudah lengkap tetapi simulasinya belum ada.
 *
 * Sebelumnya engine yang belum siap menampilkan panggung kosong, dan panggung
 * kosong tidak bisa dibedakan dari aplikasi yang rusak. Placeholder ini
 * mengatakan apa adanya: apa yang belum ada, apa yang SUDAH bisa dikerjakan,
 * dan ke mana siswa sebaiknya melanjutkan.
 *
 * `onComplete()` sengaja dipanggil langsung supaya Mini Kuis tidak ikut
 * terkunci oleh simulasi yang memang belum bisa diselesaikan siapa pun.
 */
export class ComingSoonSim extends Simulation {
  build() {
    const root = el('div', 'sim');
    this.container.appendChild(root);
    this.root = root;

    this.addHint(createBrief(this.config.brief
      || 'Bagian ini belum bisa disimulasikan. Lanjutkan ke Mini Kuis kalau materinya sudah kamu pahami.'));

    this.stage = createStage();
    root.appendChild(this.stage);

    const card = el('div', 'soon-panel anim-rise');
    card.innerHTML = `
      <span class="soon-panel__mark">${icon('clock', { size: 26 })}</span>
      <div class="soon-panel__title">Segera Hadir</div>
      <p class="soon-panel__note">${renderMixed(this.config.note || 'Simulasi untuk sub-topik ini masih dalam pengembangan.')}</p>
      <p class="soon-panel__detail">${renderMixed(this.config.detail || 'Materi dan Mini Kuisnya tetap bisa kamu kerjakan seperti biasa.')}</p>`;
    this.stage.appendChild(card);

    // Mini Kuis dibuka tanpa syarat — tidak ada yang bisa diselesaikan di sini.
    this.onComplete();
  }
}
