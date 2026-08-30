/**
 * modules/kuis/quizEngine.js
 * Mesin soal untuk Mini Kuis maupun mode Kuis mandiri.
 *
 * Disajikan sebagai SLIDER satu-soal-per-layar dengan titik navigasi,
 * sehingga ruang layar terpakai maksimal di potret maupun lanskap.
 *
 * Tipe input: mathpad · single_choice · multi_select · matrix_input
 * Setiap jawaban salah WAJIB memunculkan Toast penjelas (PRD §8.4).
 */

import { renderMixed, renderToString } from '../../engine/katexRenderer.js';
import { numbersMatch } from '../../engine/validator.js';
import { attachMathpad } from '../../ui/mathpad.js';
import { icon } from '../../ui/icons.js';
import toast from '../../ui/toast.js';
import { celebrate } from '../../interactions/flyToAnimation.js';
import { getResume, patchResume, clearResume } from '../../state/sessionState.js';

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

export class QuizEngine {
  constructor(container, questions, options = {}) {
    this.container = container;
    this.questions = questions;
    this.options = options;
    this.index = 0;
    this.correctCount = 0;
    this.wrongSubtopics = new Set();
    this.answered = false;
    this.finished = false;          // penjaga anti-spam tombol Selesai
    this.results = new Array(questions.length).fill(null);

    // Ingatan sesi: nomor soal DAN hasil per soal. Menyimpan nomornya saja
    // tidak cukup — siswa akan mendarat di soal 3 dengan skor nol, dan
    // navigasi titiknya ikut mati karena tidak ada riwayat jawaban.
    this.sessionKey = options.sessionKey || null;
    this.restoreSession();
  }

  restoreSession() {
    if (!this.sessionKey) return;

    const saved = getResume(this.sessionKey);
    if (!Array.isArray(saved.results) || saved.results.length !== this.questions.length) return;

    this.results = saved.results.slice();
    this.correctCount = this.results.filter((r) => r === true).length;

    const index = Number(saved.index);
    if (Number.isInteger(index) && index >= 0 && index < this.questions.length) {
      this.index = index;
    }
  }

  saveSession() {
    if (!this.sessionKey) return;
    patchResume(this.sessionKey, { index: this.index, results: this.results });
  }

  start() {
    this.buildShell();
    this.render();
  }

  /** Kerangka slider: viewport soal + navigasi titik di bawah. */
  buildShell() {
    this.container.innerHTML = '';

    const shell = el('div', 'quiz-slider');

    this.slideHost = el('div', 'slider__viewport');
    shell.appendChild(this.slideHost);

    this.navHost = el('div', 'slider__nav');
    shell.appendChild(this.navHost);

    this.container.appendChild(shell);
    this.buildNav();
  }

  /**
   * Navigasi soal: tombol Sebelumnya / Berikutnya yang berdiri sendiri,
   * plus pelacak "Soal 1 dari 3".
   *
   * Titik-titik kecil versi lama sulit ditekan di layar sentuh dan tidak
   * pernah menyebutkan ada berapa soal seluruhnya — siswa tidak tahu
   * seberapa jauh lagi jalannya.
   */
  buildNav() {
    this.navHost.innerHTML = '';
    this.navHost.className = 'quiz-nav';

    this.prevBtn = el('button', 'btn btn--ghost btn--icon btn--sm');
    this.prevBtn.type = 'button';
    this.prevBtn.setAttribute('aria-label', 'Soal sebelumnya');
    this.prevBtn.title = 'Soal sebelumnya';
    this.prevBtn.innerHTML = icon('arrow-left', { size: 16 });
    this.prevBtn.addEventListener('click', () => this.goTo(this.index - 1));

    this.nextBtn = el('button', 'btn btn--ghost btn--icon btn--sm');
    this.nextBtn.type = 'button';
    this.nextBtn.setAttribute('aria-label', 'Soal berikutnya');
    this.nextBtn.title = 'Soal berikutnya';
    this.nextBtn.innerHTML = icon('arrow-right', { size: 16 });
    this.nextBtn.addEventListener('click', () => this.goTo(this.index + 1));

    const track = el('div', 'quiz-nav__track');
    this.dotNodes = this.questions.map((q, i) => {
      const step = el('button', 'quiz-nav__step');
      step.type = 'button';
      step.setAttribute('aria-label', `Soal ${i + 1}`);
      step.title = `Soal ${i + 1}`;
      step.addEventListener('click', () => this.goTo(i));
      track.appendChild(step);
      return step;
    });

    this.counter = el('div', 'quiz-nav__count');
    this.counter.setAttribute('aria-live', 'polite');

    this.navHost.append(this.prevBtn, track, this.counter, this.nextBtn);

    // Soal tunggal tidak butuh navigasi sama sekali.
    this.navHost.hidden = this.questions.length <= 1;
  }

  /** Lompat ke satu soal, sejauh soal itu memang sudah pernah terbuka. */
  goTo(index) {
    if (index < 0 || index >= this.questions.length) return;
    if (index > this.maxReached()) {
      toast.info('Jawab dulu soal ini untuk membuka soal berikutnya.');
      return;
    }
    this.index = index;
    this.render();
  }

  maxReached() {
    // Soal terjauh yang sudah dijawab, +1 agar soal berjalan tetap terjangkau.
    let last = 0;
    this.results.forEach((r, i) => { if (r !== null) last = Math.max(last, i + 1); });
    return Math.min(last, this.questions.length - 1);
  }

  syncNav() {
    const reach = this.maxReached();

    this.dotNodes.forEach((step, i) => {
      step.setAttribute('aria-current', String(i === this.index));
      step.disabled = i > reach;
      step.dataset.state = i === this.index
        ? 'current'
        : (this.results[i] === true ? 'done' : 'idle');
    });

    this.counter.innerHTML = `Soal <b>${this.index + 1}</b> dari ${this.questions.length}`;

    if (this.prevBtn) this.prevBtn.disabled = this.index === 0;
    if (this.nextBtn) this.nextBtn.disabled = this.index >= Math.min(reach, this.questions.length - 1);
  }

  current() {
    return this.questions[this.index];
  }

  render() {
    const q = this.current();
    if (!q) return this.finish();

    this.answered = false;
    this.syncNav();
    this.saveSession();

    this.slideHost.innerHTML = '';

    const wrap = el('div', 'quiz anim-rise');
    const card = el('div', 'quiz__card');

    const meta = el('div', 'quiz__meta');
    meta.appendChild(el('span', 'badge badge--primary', `Soal ${this.index + 1} dari ${this.questions.length}`));
    if (q.source) meta.appendChild(el('span', 'badge badge--amber', q.source));
    card.appendChild(meta);

    card.appendChild(el('div', 'quiz__prompt', renderMixed(q.prompt)));

    if (q.tex) card.appendChild(el('div', null, renderToString(q.tex, { display: true })));

    this.answerHost = el('div');
    card.appendChild(this.answerHost);

    // Ruang pembahasan DIPESAN sejak soal dirender, bukan disisipkan setelah
    // siswa menjawab. Menyisipkannya belakangan membuat kartu memanjang dan
    // seluruh layar melompat tepat saat siswa membaca umpan baliknya.
    this.feedbackHost = el('div', 'quiz__feedback');
    card.appendChild(this.feedbackHost);

    wrap.appendChild(card);

    this.actionHost = el('div', 'actionbar');
    wrap.appendChild(this.actionHost);

    this.slideHost.appendChild(wrap);

    switch (q.input_type) {
      case 'mathpad': this.renderMathpad(q); break;
      case 'single_choice': this.renderChoices(q, false); break;
      case 'multi_select': this.renderChoices(q, true); break;
      case 'matrix_input': this.renderMatrixInput(q); break;
      default:
        this.answerHost.innerHTML = `<p class="text-muted">Tipe soal "${q.input_type}" belum didukung.</p>`;
    }
  }

  /* ---------------- mathpad ---------------- */
  renderMathpad(q) {
    const row = el('div');
    row.style.cssText = 'display:flex;align-items:center;gap:var(--sp-3);flex-wrap:wrap';
    row.appendChild(el('span', 'text-sm text-muted', 'Jawaban:'));

    const input = document.createElement('input');
    input.placeholder = '—';
    input.setAttribute('aria-label', 'Isian jawaban');
    attachMathpad(input, { allowFraction: true });
    this.input = input;
    row.appendChild(input);

    this.answerHost.appendChild(row);
    this.answerHost.appendChild(el('p', 'quiz__hint', 'Ketuk kolom di atas untuk membuka papan angka.'));

    this.addSubmitButton(() => {
      const raw = input.value;
      if (!raw) {
        toast.warn('Isian masih kosong — ketuk kolom jawaban untuk membuka papan angka.');
        return;
      }
      const value = raw.includes('/')
        ? Number(raw.split('/')[0]) / Number(raw.split('/')[1])
        : Number(raw);

      const ok = numbersMatch(value, q.answer, q.tolerance ?? 1e-6);
      input.classList.add(ok ? 'numfield--ok' : 'numfield--no');
      this.judge(ok, q);
    });
  }

  /* ---------------- pilihan ---------------- */
  renderChoices(q, multi) {
    const list = el('div', 'options');
    list.dataset.multi = String(multi);
    list.setAttribute('role', multi ? 'group' : 'radiogroup');

    const selected = new Set();

    q.options.forEach((opt, index) => {
      const btn = el('button', 'option');
      btn.type = 'button';
      btn.setAttribute('role', multi ? 'checkbox' : 'radio');
      btn.setAttribute('aria-checked', 'false');

      const labelHtml = opt.tex
        ? `${opt.label ? `<strong>${opt.label}</strong> ` : ''}${renderToString(opt.tex)}`
        : renderMixed(opt.label);

      btn.innerHTML = `
        <span class="option__box">${icon('check', { size: 14 })}</span>
        <span class="option__label">${labelHtml}</span>
      `;

      btn.addEventListener('click', () => {
        if (this.answered) return;
        if (multi) {
          const now = btn.getAttribute('aria-checked') === 'true';
          btn.setAttribute('aria-checked', String(!now));
          if (now) selected.delete(index); else selected.add(index);
        } else {
          list.querySelectorAll('.option').forEach((b) => b.setAttribute('aria-checked', 'false'));
          btn.setAttribute('aria-checked', 'true');
          selected.clear();
          selected.add(index);
        }
      });

      list.appendChild(btn);
    });

    this.answerHost.appendChild(list);

    if (multi) {
      this.answerHost.appendChild(el('p', 'quiz__hint',
        'Jawaban benar lebih dari satu — centang semua yang menurutmu benar.'));
    }

    this.addSubmitButton(() => {
      if (!selected.size) {
        toast.warn('Pilih dulu jawabanmu sebelum memeriksa.');
        return;
      }

      const buttons = [...list.querySelectorAll('.option')];

      if (multi) {
        const expected = new Set(q.answerIndices);
        const ok = expected.size === selected.size && [...expected].every((i) => selected.has(i));

        buttons.forEach((btn, i) => {
          btn.classList.add('option--locked');
          const picked = btn.getAttribute('aria-checked') === 'true';
          if (expected.has(i)) btn.classList.add('option--correct');
          else if (picked) btn.classList.add('option--wrong');

          if (q.perOptionFeedback && q.perOptionFeedback[i]) {
            const caption = el('div',
              `option-feedback option-feedback--${expected.has(i) ? 'ok' : 'no'}`,
              renderMixed(q.perOptionFeedback[i]));
            btn.insertAdjacentElement('afterend', caption);
          }
        });

        this.judge(ok, q);
        return;
      }

      const picked = [...selected][0];
      const ok = picked === q.answerIndex;
      buttons.forEach((btn, i) => {
        btn.classList.add('option--locked');
        if (i === q.answerIndex) btn.classList.add('option--correct');
        else if (i === picked) btn.classList.add('option--wrong');
      });
      this.judge(ok, q);
    });
  }

  /* ---------------- isian matriks ---------------- */
  renderMatrixInput(q) {
    const wrap = el('div', 'matrix');
    const bracket = el('div', 'matrix__bracket');
    const grid = el('div', 'matrix__grid');
    grid.style.gridTemplateColumns = `repeat(${q.cols}, auto)`;

    const inputs = [];

    for (let i = 0; i < q.rows; i++) {
      inputs.push([]);
      for (let j = 0; j < q.cols; j++) {
        const input = document.createElement('input');
        input.className = 'numfield';
        input.style.cssText = 'min-width:66px;min-height:48px;font-size:var(--fs-base);padding:4px';
        input.placeholder = '?';
        input.setAttribute('aria-label', `Elemen baris ${i + 1} kolom ${j + 1}`);
        attachMathpad(input, { allowFraction: true });
        grid.appendChild(input);
        inputs[i].push(input);
      }
    }

    bracket.appendChild(grid);
    wrap.appendChild(bracket);

    const host = el('div');
    host.style.cssText = 'display:flex;justify-content:center;padding:var(--sp-3) 0';
    host.appendChild(wrap);
    this.answerHost.appendChild(host);

    this.addSubmitButton(() => {
      let filled = true;
      let ok = true;

      for (let i = 0; i < q.rows; i++) {
        for (let j = 0; j < q.cols; j++) {
          const raw = inputs[i][j].value;
          if (!raw) { filled = false; continue; }
          const value = raw.includes('/')
            ? Number(raw.split('/')[0]) / Number(raw.split('/')[1])
            : Number(raw);
          const cellOk = numbersMatch(value, q.answer[i][j], q.tolerance ?? 1e-6);
          inputs[i][j].classList.add(cellOk ? 'numfield--ok' : 'numfield--no');
          if (!cellOk) ok = false;
        }
      }

      if (!filled) {
        toast.warn('Masih ada sel yang kosong — isi seluruh elemen matriks lebih dulu.');
        return;
      }
      this.judge(ok, q);
    });
  }

  /* ---------------- aksi ---------------- */
  addSubmitButton(handler) {
    if (this.options.backButton) {
      const back = el('button', 'btn btn--ghost');
      back.type = 'button';
      back.innerHTML = `${icon('arrow-left', { size: 16 })}<span>${this.options.backButton.label}</span>`;
      back.addEventListener('click', this.options.backButton.onClick);
      this.actionHost.appendChild(back);
    }

    this.actionHost.appendChild(el('div', 'actionbar__spacer'));

    const btn = el('button', 'btn btn--primary');
    btn.type = 'button';
    btn.innerHTML = `${icon('check', { size: 17 })}<span>Periksa Jawaban</span>`;
    btn.addEventListener('click', handler);
    this.submitBtn = btn;
    this.actionHost.appendChild(btn);
  }

  /**
   * Kunci SEMUA field angka pada soal ini — benar maupun salah.
   * Field hanya terbuka lagi kalau siswa menekan "Coba Lagi", yang
   * merender ulang soal dari awal.
   */
  lockInputs() {
    this.slideHost.querySelectorAll('.numfield').forEach((input) => {
      input.dataset.locked = 'true';
      input.setAttribute('aria-readonly', 'true');
      input.style.pointerEvents = 'none';
      input.tabIndex = -1;
    });
  }

  judge(ok, q) {
    if (this.answered) return;
    this.answered = true;
    this.submitBtn.disabled = true;
    this.lockInputs();

    if (this.results[this.index] === null) {
      this.results[this.index] = ok;
      if (ok) this.correctCount += 1;
    } else if (ok && this.results[this.index] === false) {
      // Percobaan ulang yang berhasil (mode mastery) ikut dihitung.
      this.results[this.index] = true;
      this.correctCount += 1;
    }

    if (ok) {
      toast.success('Jawabanmu tepat!');
    } else {
      if (q.subtopic) this.wrongSubtopics.add(q.subtopic);
      toast.error(q.toastWrong || 'Belum tepat — periksa kembali langkah pengerjaanmu.');
    }

    if (this.options.showExplanation !== false && q.explanation) {
      const box = el('div', 'explain anim-rise');
      box.innerHTML = `<div class="explain__title">Pembahasan</div>${renderMixed(q.explanation)}`;
      this.feedbackHost.appendChild(box);
    }

    this.syncNav();
    this.saveSession();
    this.renderNextAction(ok, q);
  }

  renderNextAction(ok, q) {
    this.actionHost.innerHTML = '';

    const mustBeCorrect = this.options.requireCorrect && !ok;

    if (mustBeCorrect) {
      this.actionHost.appendChild(el('span', 'actionbar__note',
        'Jawab dengan benar untuk membuka sub-topik berikutnya.'));
      this.actionHost.appendChild(el('div', 'actionbar__spacer'));

      const retry = el('button', 'btn btn--coral btn--pulse');
      retry.type = 'button';
      retry.innerHTML = `${icon('refresh', { size: 17 })}<span>Coba Lagi</span>`;
      retry.addEventListener('click', () => this.render());
      this.actionHost.appendChild(retry);
      return;
    }

    this.actionHost.appendChild(el('div', 'actionbar__spacer'));

    const isLast = this.index >= this.questions.length - 1;
    const next = el('button', `btn ${isLast ? 'btn--success' : 'btn--primary'} btn--pulse`);
    next.type = 'button';
    next.innerHTML = isLast
      ? `${icon('check-circle', { size: 17 })}<span>Selesai</span>`
      : `<span>Soal Berikutnya</span>${icon('arrow-right', { size: 17 })}`;

    next.addEventListener('click', () => {
      // ANTI-SPAM: kunci tombol seketika pada klik pertama, sebelum apa pun
      // dikerjakan. Tanpa ini, klik beruntun pada "Selesai" akan merender
      // kartu hasil berkali-kali.
      if (next.disabled) return;
      next.disabled = true;
      next.classList.remove('btn--pulse');

      if (isLast) {
        this.finish();
      } else {
        this.index += 1;
        this.render();
      }
    });

    this.actionHost.appendChild(next);
  }

  finish() {
    // Lapis kedua penjaga anti-spam: apa pun pemanggilnya, hasil hanya
    // dihitung dan dirender SEKALI.
    if (this.finished) return;
    this.finished = true;

    // Kuis tuntas — posisi tidak perlu diingat lagi. Membiarkannya membuat
    // siswa yang membuka ulang mendarat di soal terakhir, bukan di awal.
    clearResume(this.sessionKey);

    const score = this.questions.length
      ? Math.round((this.correctCount / this.questions.length) * 100)
      : 0;

    if (score === 100) celebrate();

    if (typeof this.options.onFinish === 'function') {
      this.options.onFinish({
        score,
        correct: this.correctCount,
        totalQuestions: this.questions.length,
        weakSubtopics: [...this.wrongSubtopics],
      });
    }
  }
}

export default QuizEngine;
