/**
 * modules/kuis/examEngine.js — Mesin Ujian CBT (Fase 18)
 *
 * ============================================================
 * KENAPA INI KELAS TERSENDIRI, BUKAN MODE DI `QuizEngine`
 * ============================================================
 *
 * `QuizEngine` melayani **Mini Kuis** di dalam sub-topik, dan di sana
 * umpan balik langsung memang benar: itu *mastery learning* — siswa harus
 * menjawab benar untuk membuka sub-topik berikutnya, jadi ia perlu tahu
 * hasilnya SEKARANG.
 *
 * Mode Kuis mandiri mengajarkan hal yang berbeda: mengelola waktu dan
 * keraguan di ruang ujian. Di UTBK/SNBT tidak ada tombol "periksa jawaban";
 * siswa melompat-lompat antar soal, mengganti jawaban, dan baru tahu
 * hasilnya setelah mengumpulkan. Menyatukan dua perilaku yang berlawanan itu
 * ke satu kelas akan membuat setiap cabang `if` di dalamnya berarti dua hal
 * sekaligus.
 *
 * Karena itu: dua kelas, dua kontrak. `QuizEngine` TIDAK disentuh.
 *
 * Tipe soal: mathpad · single_choice (A–E) · multi_select · matrix_input
 */

import { renderMixed, renderToString } from '../../engine/katexRenderer.js';
import { numbersMatch } from '../../engine/validator.js';
import { attachMathpad } from '../../ui/mathpad.js';
import { icon } from '../../ui/icons.js';
import { confirmAction } from '../../ui/modal.js';
import toast from '../../ui/toast.js';
import { celebrate } from '../../interactions/flyToAnimation.js';
import { createScratchpad } from '../../ui/scratchpad.js';

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

/** Label opsi bergaya ujian: A, B, C, D, E, … */
const HURUF = 'ABCDEFGHIJ';

/** Angka dari isian Mathpad, termasuk bentuk pecahan "a/b". */
function parseNumber(raw) {
  if (raw == null || raw === '') return null;
  const text = String(raw).replace(',', '.');
  if (text.includes('/')) {
    const [a, b] = text.split('/');
    const n = Number(a); const d = Number(b);
    if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null;
    return n / d;
  }
  const v = Number(text);
  return Number.isFinite(v) ? v : null;
}

export class ExamEngine {
  /**
   * @param {HTMLElement} container
   * @param {Array} questions
   * @param {object} options { eyebrow, title, onExit, onFinish, history }
   */
  constructor(container, questions, options = {}) {
    this.container = container;
    this.questions = questions;
    this.options = options;

    /**
     * Jawaban SEMENTARA, satu slot per soal. Bentuknya mengikuti tipe soal:
     *
     *   mathpad       → string
     *   single_choice → number (indeks opsi)
     *   multi_select  → number[] (indeks-indeks yang dicentang)
     *   matrix_input  → string[][]
     *
     * `null` berarti belum dijawab — dan itulah yang dihitung kisi navigasi.
     */
    this.answers = questions.map(() => null);

    this.index = 0;
    this.submitted = false;
    this.graded = null;
  }

  /* ============================================================
     Kerangka dua kolom
     ============================================================ */
  start() {
    this.buildLayout();
    this.renderSide();
    this.renderQuestion();
  }

  buildLayout() {
    this.container.innerHTML = '';

    const workspace = el('div', 'workspace workspace--split exam');

    /* ---------------- Kolom kiri: kendali ujian ---------------- */
    const side = el('aside', 'ws-side');
    side.setAttribute('aria-label', 'Panel kendali ujian');

    const head = el('div', 'ws-side__head');
    const back = el('button', 'btn btn--icon btn--ghost ws-side__back');
    back.type = 'button';
    back.setAttribute('aria-label', 'Keluar dari ujian');
    back.title = 'Keluar dari ujian';
    back.innerHTML = icon('arrow-left', { size: 18 });
    back.addEventListener('click', () => this.confirmExit());
    head.appendChild(back);

    const titles = el('div', 'workspace__titles');
    titles.appendChild(el('div', 'workspace__eyebrow', this.options.eyebrow || 'Ujian'));
    titles.appendChild(el('div', 'workspace__title', renderMixed(this.options.title || 'Latihan')));
    head.appendChild(titles);
    side.appendChild(head);

    this.sideBody = el('div', 'ws-side__hint exam-side');
    side.appendChild(this.sideBody);

    this.actionHost = el('div', 'workspace__actions ws-side__actions');
    side.appendChild(this.actionHost);

    workspace.appendChild(side);

    /* ---------------- Kolom kanan: panggung soal ---------------- */
    const stage = el('section', 'ws-stage');
    stage.setAttribute('aria-label', 'Area soal');
    this.body = el('div', 'workspace__body');
    stage.appendChild(this.body);
    workspace.appendChild(stage);

    this.container.appendChild(workspace);

    /**
     * PAPAN CORET — di ujian ini bukan pelengkap, melainkan alat kerja.
     *
     * Soal TKA menuntut hitungan panjang (determinan, kofaktor, perkalian
     * baris x kolom), dan tanpa tempat mencoret siswa harus mengambil
     * kertas — begitu matanya turun ke kertas, konteks soalnya hilang.
     * Itulah alasan papan ini dibuat di Fase 15, dan alasan yang sama
     * berlaku di sini.
     *
     * Ditambatkan ke `.ws-stage`, sama seperti di mode Belajar, sehingga
     * seluruh CSS papan (FAB di sudut, kanvas, bilah alat, Mengintip)
     * berlaku apa adanya tanpa satu baris pun gaya baru.
     *
     * WAJIB dibuat SEKALI per sesi ujian, bukan per soal: coretan hitungan
     * harus bertahan saat siswa berpindah antar soal — di ujian, melompat
     * ke soal lain lalu kembali adalah hal yang biasa.
     */
    this.scratchpad = createScratchpad(stage);
  }

  /** Bongkar papan coret saat sesi ujian ditinggalkan. */
  destroy() {
    if (this.scratchpad) {
      this.scratchpad.destroy();
      this.scratchpad = null;
    }
  }

  /* ============================================================
     Panel kiri: info, riwayat, kisi navigasi
     ============================================================ */
  renderSide() {
    this.sideBody.innerHTML = '';

    // --- Info ujian ---
    const info = el('div', 'exam-info');
    info.appendChild(el('div', 'exam-info__row',
      `<span>Jumlah soal</span><b>${this.questions.length}</b>`));
    info.appendChild(el('div', 'exam-info__row',
      `<span>Penilaian</span><b>Setelah dikumpulkan</b>`));
    this.sideBody.appendChild(info);

    /**
     * Riwayat DIBACA ULANG setiap kali panel digambar, bukan disalin sekali
     * saat konstruksi.
     *
     * Percobaan yang baru saja dikumpulkan disimpan lewat `onFinish`, dan
     * panel ini digambar ulang tepat sesudahnya — dengan daftar statis,
     * nilai yang baru saja diperoleh siswa tidak pernah muncul di riwayatnya
     * sendiri (terukur: panelnya kosong padahal skornya sudah tersimpan).
     */
    const history = typeof this.options.getHistory === 'function'
      ? (this.options.getHistory() || [])
      : (this.options.history || []);
    if (history.length) {
      const box = el('div', 'exam-history');
      box.appendChild(el('div', 'exam-history__title', 'Riwayat Percobaan'));
      const list = el('div', 'exam-history__list');
      // Terbaru di ATAS, tapi nomor percobaannya tetap urutan aslinya.
      history.forEach((h) => {
        const chip = el('div', 'exam-history__chip');
        chip.dataset.tone = h.score === 100 ? 'perfect' : (h.score >= 70 ? 'good' : 'low');
        chip.innerHTML = `<span>Percobaan ${h.attempt}</span><b>${h.score}</b>`;
        list.appendChild(chip);
      });
      box.appendChild(list);
      this.sideBody.appendChild(box);
    }

    // --- Kisi navigasi soal ---
    const navBox = el('div', 'exam-nav');
    navBox.appendChild(el('div', 'exam-nav__title', 'Navigasi Soal'));

    const grid = el('div', 'exam-nav__grid');
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', 'Lompat ke soal');

    this.navButtons = this.questions.map((q, i) => {
      const btn = el('button', 'exam-nav__item');
      btn.type = 'button';
      btn.textContent = String(i + 1);
      btn.addEventListener('click', () => this.goTo(i));
      grid.appendChild(btn);
      return btn;
    });

    navBox.appendChild(grid);

    this.legend = el('div', 'exam-nav__legend');
    navBox.appendChild(this.legend);

    this.sideBody.appendChild(navBox);
    this.syncNav();
  }

  /**
   * Kisi navigasi: SEMUA soal selalu bisa dibuka.
   *
   * Ini perbedaan paling mendasar dari Mini Kuis, yang mengunci soal
   * berikutnya sampai yang sekarang benar. Di ruang ujian, melompati soal
   * sulit dan kembali lagi nanti adalah keterampilan tersendiri — mengunci
   * urutannya justru melatih kebiasaan yang merugikan.
   */
  syncNav() {
    this.navButtons.forEach((btn, i) => {
      const dijawab = this.answers[i] !== null;
      let state = dijawab ? 'answered' : 'empty';
      if (this.submitted) state = this.graded[i] ? 'correct' : 'wrong';
      btn.dataset.state = state;
      btn.setAttribute('aria-current', String(i === this.index));
      btn.setAttribute('aria-label',
        `Soal ${i + 1}${this.submitted
          ? (this.graded[i] ? ' — benar' : ' — salah')
          : (dijawab ? ' — sudah dijawab' : ' — belum dijawab')}`);
    });

    const belum = this.answers.filter((a) => a === null).length;
    this.legend.innerHTML = this.submitted
      ? `<span class="exam-legend exam-legend--correct">Benar</span>
         <span class="exam-legend exam-legend--wrong">Salah</span>`
      : `<span class="exam-legend exam-legend--answered">Terisi</span>
         <span class="exam-legend exam-legend--empty">Kosong: <b>${belum}</b></span>`;
  }

  goTo(index) {
    if (index < 0 || index >= this.questions.length) return;
    this.index = index;
    this.renderQuestion();
  }

  /* ============================================================
     Panggung: satu soal
     ============================================================ */
  renderQuestion() {
    const q = this.questions[this.index];
    if (!q) return;

    this.body.innerHTML = '';
    this.syncNav();

    const wrap = el('div', 'quiz exam-question anim-rise');
    const card = el('div', 'quiz__card');

    const meta = el('div', 'quiz__meta');
    meta.appendChild(el('span', 'badge badge--primary',
      `Soal ${this.index + 1} dari ${this.questions.length}`));
    if (q.source) meta.appendChild(el('span', 'badge badge--amber', q.source));
    if (this.submitted) {
      const ok = this.graded[this.index];
      meta.appendChild(el('span', `badge ${ok ? 'badge--success' : 'badge--danger'}`,
        ok ? 'Benar' : 'Salah'));
    }
    card.appendChild(meta);

    card.appendChild(el('div', 'quiz__prompt', renderMixed(q.prompt)));

    /**
     * Tabel data ditulis sebagai DATA (`q.table`), bukan sebagai markdown di
     * dalam `prompt`.
     *
     * ⚠️ `renderMixed()` meng-escape seluruh masukannya dan tidak mengenal
     * sintaks tabel — pipa-pipanya tampil mentah di layar sebagai
     * `| Tipe Kamar | Hotel A | ...`. Soal TKA nomor 4 justru menyajikan
     * datanya sebagai tabel, jadi tabelnya dibangun sebagai node DOM
     * sungguhan, memakai gaya `.data-table` yang sama dengan Bab 4.
     */
    if (q.table) card.appendChild(this.buildTable(q.table));

    if (q.tex) card.appendChild(el('div', 'quiz__tex', renderToString(q.tex, { display: true })));

    // Kalimat penutup soal (pertanyaannya sendiri) berdiri SESUDAH tabel atau
    // rumusnya — kalau ia ikut di `prompt`, siswa membaca pertanyaannya
    // sebelum melihat datanya.
    if (q.after) card.appendChild(el('div', 'quiz__prompt quiz__after', renderMixed(q.after)));

    this.answerHost = el('div', 'quiz__answer');
    card.appendChild(this.answerHost);

    this.feedbackHost = el('div', 'quiz__feedback');
    card.appendChild(this.feedbackHost);

    wrap.appendChild(card);
    this.body.appendChild(wrap);

    switch (q.input_type) {
      case 'mathpad': this.renderMathpad(q); break;
      case 'single_choice': this.renderChoices(q, false); break;
      case 'multi_select': this.renderChoices(q, true); break;
      case 'matrix_input': this.renderMatrixInput(q); break;
      default:
        this.answerHost.innerHTML =
          `<p class="text-muted">Tipe soal "${q.input_type}" belum didukung.</p>`;
    }

    if (this.submitted) this.renderReview(q);
    this.renderActions();
  }

  buildTable(table) {
    const wrap = el('div', 'data-table-wrap');
    const tbl = el('table', 'data-table');

    const thead = el('thead');
    const headRow = el('tr');
    (table.headers || []).forEach((h) => headRow.appendChild(el('th', null, renderMixed(h))));
    thead.appendChild(headRow);
    tbl.appendChild(thead);

    const tbody = el('tbody');
    (table.rows || []).forEach((row) => {
      const tr = el('tr');
      row.forEach((cell) => tr.appendChild(el('td', null, renderMixed(String(cell)))));
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);

    wrap.appendChild(tbl);
    return wrap;
  }

  /* ---------------- isian angka ---------------- */
  renderMathpad(q) {
    const row = el('div', 'exam-answer-row');
    row.appendChild(el('span', 'text-sm text-muted', 'Jawaban:'));

    const input = document.createElement('input');
    input.placeholder = '—';
    input.setAttribute('aria-label', 'Isian jawaban');
    input.value = this.answers[this.index] || '';
    attachMathpad(input, {
      allowFraction: true,
      // Umpan balik DITUNDA: yang terjadi di sini hanya menyimpan.
      onCommit: (value, display) => {
        this.answers[this.index] = display || value;
        this.syncNav();
      },
    });

    if (this.submitted) this.freezeInput(input);
    row.appendChild(input);

    this.answerHost.appendChild(row);
    this.answerHost.appendChild(el('p', 'quiz__hint', renderMixed(
      'Ketuk kolom di atas untuk membuka papan angka.')));
  }

  /* ---------------- pilihan A–E ---------------- */
  renderChoices(q, multi) {
    const list = el('div', 'options options--exam');
    list.dataset.multi = String(multi);
    list.setAttribute('role', multi ? 'group' : 'radiogroup');

    const saved = this.answers[this.index];
    const selected = new Set(
      multi ? (Array.isArray(saved) ? saved : []) : (saved == null ? [] : [saved])
    );

    q.options.forEach((opt, index) => {
      const btn = el('button', 'option option--lettered');
      btn.type = 'button';
      btn.setAttribute('role', multi ? 'checkbox' : 'radio');
      btn.setAttribute('aria-checked', String(selected.has(index)));

      // Huruf opsi ditulis eksplisit (A–E) — itulah bentuk yang dilihat
      // siswa di lembar UTBK, dan yang dirujuk pembahasannya.
      const huruf = el('span', 'option__letter', HURUF[index] || String(index + 1));
      const isi = el('span', 'option__label');
      isi.innerHTML = opt.tex ? renderToString(opt.tex) : renderMixed(opt.label || '');
      btn.append(huruf, isi);

      btn.addEventListener('click', () => {
        if (this.submitted) return;
        if (multi) {
          const now = btn.getAttribute('aria-checked') === 'true';
          btn.setAttribute('aria-checked', String(!now));
          if (now) selected.delete(index); else selected.add(index);
          this.answers[this.index] = selected.size ? [...selected].sort((a, b) => a - b) : null;
        } else {
          list.querySelectorAll('.option').forEach((b) => b.setAttribute('aria-checked', 'false'));
          btn.setAttribute('aria-checked', 'true');
          selected.clear();
          selected.add(index);
          this.answers[this.index] = index;
        }
        this.syncNav();
      });

      list.appendChild(btn);
    });

    this.answerHost.appendChild(list);
    this.optionNodes = [...list.querySelectorAll('.option')];

    if (multi) {
      /**
       * ⚠️ Teks yang memuat markdown WAJIB lewat `renderMixed()`.
       *
       * `el()` menaruh argumen ketiganya sebagai `innerHTML` mentah, jadi
       * `**lebih dari satu**` tampil apa adanya beserta bintang-bintangnya.
       * `renderMixed()` sendiri sudah lama menangani `**tebal**` dengan
       * benar — yang keliru adalah tidak memanggilnya.
       */
      this.answerHost.appendChild(el('p', 'quiz__hint', renderMixed(
        'Jawaban benar **lebih dari satu** — centang semua yang menurutmu benar.')));
    }
  }

  /* ---------------- isian matriks ---------------- */
  renderMatrixInput(q) {
    /**
     * Matriks punya DUA penyimpanan, dan itu disengaja.
     *
     * `drafts` menampung isian setengah jadi supaya angka yang sudah diketik
     * siswa tidak hilang saat ia melompat ke soal lain dan kembali.
     * `answers` hanya terisi kalau SELURUH selnya penuh — matriks separuh
     * bukan jawaban, dan kisi navigasi tidak boleh menandainya "terisi".
     */
    if (!this.drafts) this.drafts = {};
    const draft = this.drafts[this.index]
      || Array.from({ length: q.rows }, () => Array(q.cols).fill(''));
    this.drafts[this.index] = draft;
    const saved = draft;

    const wrap = el('div', 'matrix matrix--input');
    const bracket = el('div', 'matrix__bracket');
    const grid = el('div', 'matrix__grid matrix__grid--input');
    grid.style.gridTemplateColumns = `repeat(${q.cols}, auto)`;

    this.matrixInputs = [];

    for (let i = 0; i < q.rows; i++) {
      this.matrixInputs.push([]);
      for (let j = 0; j < q.cols; j++) {
        const input = document.createElement('input');
        input.className = 'numfield numfield--cell';
        input.placeholder = '?';
        input.setAttribute('aria-label', `Elemen baris ${i + 1} kolom ${j + 1}`);
        input.value = (saved && saved[i] && saved[i][j]) || '';
        // Setelah dikumpulkan, sel yang salah ditandai supaya siswa tahu
        // PERSIS di mana ia meleset — bukan sekadar "matriksnya salah".
        if (this.submitted) {
          const nilai = parseNumber(input.value);
          const benar = nilai !== null
            && numbersMatch(nilai, q.answer[i][j], q.tolerance ?? 1e-6);
          input.classList.add(benar ? 'numfield--ok' : 'numfield--no');
        }
        attachMathpad(input, {
          allowFraction: true,
          onCommit: (value, display) => {
            draft[i][j] = display || value;
            const penuh = draft.every((row) => row.every((c) => c !== '' && c != null));
            this.answers[this.index] = penuh ? draft.map((r) => r.slice()) : null;
            this.syncNav();
          },
        });
        if (this.submitted) this.freezeInput(input);
        grid.appendChild(input);
        this.matrixInputs[i].push(input);
      }
    }

    bracket.appendChild(grid);
    wrap.appendChild(bracket);

    const host = el('div', 'matrix-input-host');
    host.appendChild(wrap);
    this.answerHost.appendChild(host);
    this.answerHost.appendChild(el('p', 'quiz__hint', renderMixed(
      'Ketuk tiap sel untuk membuka papan angka. **Semua sel** harus terisi.')));
  }

  freezeInput(input) {
    input.dataset.locked = 'true';
    input.setAttribute('aria-readonly', 'true');
    input.style.pointerEvents = 'none';
    input.tabIndex = -1;
  }

  /* ============================================================
     Bilah aksi
     ============================================================ */
  renderActions() {
    this.actionHost.innerHTML = '';

    if (this.submitted) {
      const retry = el('button', 'btn btn--primary btn--lg');
      retry.type = 'button';
      retry.innerHTML = `${icon('refresh', { size: 17 })}<span>Ulangi Ujian</span>`;
      retry.addEventListener('click', () => {
        if (retry.disabled) return;
        retry.disabled = true;
        if (typeof this.options.onRetry === 'function') this.options.onRetry();
      });
      this.actionHost.appendChild(retry);

      const exit = el('button', 'btn btn--ghost');
      exit.type = 'button';
      exit.innerHTML = `${icon('home', { size: 16 })}<span>Kembali ke Menu</span>`;
      exit.addEventListener('click', () => this.options.onExit && this.options.onExit());
      this.actionHost.appendChild(exit);
      return;
    }

    const prev = el('button', 'btn btn--ghost btn--icon');
    prev.type = 'button';
    prev.setAttribute('aria-label', 'Soal sebelumnya');
    prev.title = 'Soal sebelumnya';
    prev.innerHTML = icon('arrow-left', { size: 16 });
    prev.disabled = this.index === 0;
    prev.addEventListener('click', () => this.goTo(this.index - 1));

    const next = el('button', 'btn btn--ghost btn--icon');
    next.type = 'button';
    next.setAttribute('aria-label', 'Soal berikutnya');
    next.title = 'Soal berikutnya';
    next.innerHTML = icon('arrow-right', { size: 16 });
    next.disabled = this.index >= this.questions.length - 1;
    next.addEventListener('click', () => this.goTo(this.index + 1));

    const nav = el('div', 'exam-prevnext');
    nav.append(prev, next);
    this.actionHost.appendChild(nav);

    /**
     * Tombol kumpul hidup di panel kendali dan SELALU terlihat — bukan
     * hanya muncul di soal terakhir. Siswa yang sudah yakin di soal ke-3
     * tidak perlu menyusuri tujuh soal lagi hanya untuk menemukan tombolnya;
     * itulah perilaku CBT yang sesungguhnya. Penekanannya diperkuat saat
     * berada di soal terakhir.
     */
    const submit = el('button',
      `btn btn--success btn--lg${this.index >= this.questions.length - 1 ? ' btn--pulse' : ''}`);
    submit.type = 'button';
    submit.dataset.role = 'submit-exam';
    submit.innerHTML = `${icon('check-circle', { size: 17 })}<span>Kumpulkan Ujian</span>`;
    submit.addEventListener('click', () => this.confirmSubmit(submit));
    this.actionHost.appendChild(submit);
  }

  /* ============================================================
     Pengumpulan & penilaian
     ============================================================ */
  async confirmSubmit(btn) {
    if (this.submitted) return;

    const belum = this.answers.filter((a) => a === null).length;
    const ok = await confirmAction({
      title: 'Kumpulkan ujian sekarang?',
      body: belum
        ? `Masih ada **${belum} soal** yang belum kamu jawab. Soal yang kosong dihitung **salah**.`
        : 'Semua soal sudah kamu jawab. Jawaban tidak bisa diubah setelah dikumpulkan.',
      confirmLabel: 'Ya, Kumpulkan',
      cancelLabel: belum ? 'Batal, Periksa Lagi' : 'Batal',
      variant: belum ? 'danger' : 'primary',
    });
    if (!ok) return;

    // Sekali jalan: klik beruntun tidak boleh menilai dua kali.
    if (this.submitted) return;
    if (btn) btn.disabled = true;
    this.submit();
  }

  /** Nilai SELURUH soal sekaligus. */
  gradeOne(q, answer) {
    if (answer === null) return false;

    switch (q.input_type) {
      case 'mathpad': {
        const value = parseNumber(answer);
        return value !== null && numbersMatch(value, q.answer, q.tolerance ?? 1e-6);
      }
      case 'single_choice':
        return answer === q.answerIndex;
      case 'multi_select': {
        const expected = [...(q.answerIndices || [])].sort((a, b) => a - b);
        const picked = [...answer].sort((a, b) => a - b);
        return expected.length === picked.length
          && expected.every((v, i) => v === picked[i]);
      }
      case 'matrix_input': {
        for (let i = 0; i < q.rows; i++) {
          for (let j = 0; j < q.cols; j++) {
            const value = parseNumber(answer[i] && answer[i][j]);
            if (value === null) return false;
            if (!numbersMatch(value, q.answer[i][j], q.tolerance ?? 1e-6)) return false;
          }
        }
        return true;
      }
      default:
        return false;
    }
  }

  submit() {
    this.submitted = true;
    this.graded = this.questions.map((q, i) => this.gradeOne(q, this.answers[i]));

    const benar = this.graded.filter(Boolean).length;
    const score = this.questions.length
      ? Math.round((benar / this.questions.length) * 100)
      : 0;

    const lemah = new Set();
    this.questions.forEach((q, i) => {
      if (!this.graded[i] && q.subtopic) lemah.add(q.subtopic);
    });

    if (score === 100) celebrate();

    this.result = {
      score,
      correct: benar,
      totalQuestions: this.questions.length,
      weakSubtopics: [...lemah],
    };

    if (typeof this.options.onFinish === 'function') this.options.onFinish(this.result);

    // Kembali ke soal pertama: siswa menelusuri pembahasannya dari awal.
    this.index = 0;
    this.renderSide();
    this.renderSummary();
    this.renderQuestion();
  }

  /** Ringkasan skor, dipasang di panel kendali. */
  renderSummary() {
    const box = el('div', 'exam-score anim-rise');
    const s = this.result.score;
    box.dataset.tone = s === 100 ? 'perfect' : (s >= 70 ? 'good' : (s >= 40 ? 'mid' : 'low'));
    box.innerHTML = `
      <div class="exam-score__label">Nilai kamu</div>
      <div class="exam-score__value">${s}</div>
      <div class="exam-score__sub">${this.result.correct} dari ${this.result.totalQuestions} soal benar</div>
    `;
    this.sideBody.insertBefore(box, this.sideBody.firstChild);

    toast.info(`Ujian dikumpulkan — nilai ${s}. Telusuri pembahasan tiap soal di panel kanan.`);
  }

  /**
   * Tampilan pembahasan setelah dikumpulkan.
   *
   * Jawaban siswa DAN kunci ditandai bersamaan; tanpa keduanya, siswa yang
   * salah tidak pernah tahu ia memilih apa.
   */
  renderReview(q) {
    const ok = this.graded[this.index];
    const jawab = this.answers[this.index];

    if (q.input_type === 'single_choice' || q.input_type === 'multi_select') {
      const benar = q.input_type === 'single_choice'
        ? new Set([q.answerIndex])
        : new Set(q.answerIndices || []);
      const dipilih = new Set(
        jawab === null ? [] : (Array.isArray(jawab) ? jawab : [jawab])
      );

      (this.optionNodes || []).forEach((btn, i) => {
        btn.classList.add('option--locked');
        if (benar.has(i)) btn.classList.add('option--correct');
        else if (dipilih.has(i)) btn.classList.add('option--wrong');
        if (dipilih.has(i)) btn.classList.add('option--picked');

        if (q.perOptionFeedback && q.perOptionFeedback[i]) {
          const cap = el('div',
            `option-feedback option-feedback--${benar.has(i) ? 'ok' : 'no'}`,
            renderMixed(q.perOptionFeedback[i]));
          btn.insertAdjacentElement('afterend', cap);
        }
      });
    }

    if (q.input_type === 'mathpad') {
      const box = el('div', `exam-yours exam-yours--${ok ? 'ok' : 'no'}`);
      box.innerHTML = `<span>Jawabanmu:</span> <b>${jawab === null ? '(kosong)' : jawab}</b>`
        + (ok ? '' : ` <span class="exam-yours__key">Kunci: <b>${q.answer}</b></span>`);
      this.answerHost.appendChild(box);
    }

    if (q.input_type === 'matrix_input' && !ok) {
      const kunci = el('div', 'exam-yours exam-yours--no');
      kunci.innerHTML = '<span>Kunci jawaban:</span> '
        + renderToString(`\\begin{pmatrix}${q.answer.map((r) => r.join(' & ')).join(' \\\\ ')}\\end{pmatrix}`);
      this.answerHost.appendChild(kunci);
    }

    if (q.explanation) {
      const box = el('div', 'explain');
      box.innerHTML = `<div class="explain__title">Pembahasan</div>${renderMixed(q.explanation)}`;
      this.feedbackHost.appendChild(box);
    }
  }

  async confirmExit() {
    if (this.submitted) {
      if (this.options.onExit) this.options.onExit();
      return;
    }
    const ok = await confirmAction({
      title: 'Keluar dari ujian?',
      body: 'Jawaban yang sudah kamu isi pada sesi ini **tidak akan tersimpan**.',
      confirmLabel: 'Ya, Keluar',
      cancelLabel: 'Batal, Lanjut Mengerjakan',
      variant: 'danger',
    });
    if (ok && this.options.onExit) this.options.onExit();
  }
}

export default ExamEngine;
