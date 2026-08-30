/**
 * modules/belajar/lessonRenderer.js
 * Merender satu sub-topik: Materi → Simulasi → Mini Kuis.
 *
 * Dua perilaku navigasi:
 *  - Sub-topik BARU  → berurutan; tab hanya penanda progres.
 *  - Sub-topik SELESAI → mode review; tab bisa diklik bebas untuk melompat
 *    ke bagian mana pun tanpa mengulang langkah sebelumnya.
 */

import { renderMixed, renderToString } from '../../engine/katexRenderer.js';
import { icon } from '../../ui/icons.js';
import { mountSimulation } from './simulations/index.js';
import { QuizEngine } from '../kuis/quizEngine.js';
import {
  markSubtopicStarted, markSubtopicCompleted, recordAttempt,
  setChapterCompleteIfDone, unlockBadge, getSubtopicProgress,
} from '../../state/progressStore.js';
import toast from '../../ui/toast.js';
import { lessonKey, getResume, patchResume, clearResume } from '../../state/sessionState.js';

const STEPS = [
  { id: 'materi', label: 'Materi' },
  { id: 'simulasi', label: 'Simulasi' },
  { id: 'kuis', label: 'Mini Kuis' },
];

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

const CALLOUT_MAP = {
  def: { cls: 'callout--def', icon: 'book', fallback: 'Definisi' },
  tip: { cls: 'callout--tip', icon: 'lightbulb', fallback: 'Trik Ingat' },
  warn: { cls: 'callout--warn', icon: 'alert-triangle', fallback: 'Perhatikan' },
};

function renderBlock(block) {
  switch (block.t) {
    case 'p':
      return el('p', null, renderMixed(block.x));
    case 'tex':
      return el('div', null, renderToString(block.x, { display: true }));
    case 'list': {
      const ul = el('ul');
      block.items.forEach((item) => ul.appendChild(el('li', null, renderMixed(item))));
      return ul;
    }
    case 'steps': {
      const ol = el('ol');
      block.items.forEach((item) => ol.appendChild(el('li', null, renderMixed(item))));
      return ol;
    }
    case 'def':
    case 'tip':
    case 'warn': {
      const meta = CALLOUT_MAP[block.t];
      const node = el('div', `callout ${meta.cls}`);
      node.innerHTML = `
        <span class="callout__icon">${icon(meta.icon)}</span>
        <div class="callout__body">
          <div class="callout__title">${block.title || meta.fallback}</div>
          <div class="callout__text">${renderMixed(block.x)}</div>
        </div>
      `;
      return node;
    }
    case 'carousel':
      return renderCarousel(block);

    default:
      return el('p', 'text-muted', renderMixed(block.x || ''));
  }
}

/**
 * Blok materi berbentuk carousel: satu konsep per kartu, dengan bentuk
 * visualnya. Dipakai untuk "Jenis-Jenis Matriks" agar keenam jenis dijelaskan
 * satu per satu, bukan sebagai daftar panjang yang menumpuk.
 */
function renderCarousel(block) {
  const wrap = el('div', 'materi-carousel');
  if (block.title) wrap.appendChild(el('div', 'materi-carousel__title', block.title));

  const viewport = el('div', 'materi-carousel__viewport');
  const track = el('div', 'materi-carousel__track');

  block.slides.forEach((slide) => {
    const card = el('div', 'materi-carousel__slide');
    card.innerHTML = `
      <div class="materi-carousel__name">${renderMixed(slide.name)}</div>
      <div class="materi-carousel__figure">${renderToString(slide.tex, { display: true })}</div>
      <p class="materi-carousel__text">${renderMixed(slide.text)}</p>
    `;
    track.appendChild(card);
  });

  viewport.appendChild(track);
  wrap.appendChild(viewport);

  // Navigasi
  const nav = el('div', 'slider__nav');
  const prev = el('button', 'btn btn--ghost btn--icon btn--sm');
  prev.type = 'button';
  prev.setAttribute('aria-label', 'Jenis sebelumnya');
  prev.innerHTML = icon('arrow-left', { size: 16 });

  const next = el('button', 'btn btn--ghost btn--icon btn--sm');
  next.type = 'button';
  next.setAttribute('aria-label', 'Jenis berikutnya');
  next.innerHTML = icon('arrow-right', { size: 16 });

  const dots = el('div', 'slider-dots');
  dots.setAttribute('role', 'tablist');

  const counter = el('div', 'slider__counter', `1 / ${block.slides.length}`);
  let index = 0;

  const go = (i) => {
    index = Math.max(0, Math.min(block.slides.length - 1, i));
    track.style.transform = `translateX(-${index * 100}%)`;
    counter.textContent = `${index + 1} / ${block.slides.length}`;
    prev.disabled = index === 0;
    next.disabled = index === block.slides.length - 1;
    [...dots.children].forEach((d, k) => d.setAttribute('aria-current', String(k === index)));
  };

  block.slides.forEach((slide, i) => {
    const dot = el('button', 'slider-dot');
    dot.type = 'button';
    dot.setAttribute('role', 'tab');
    dot.title = slide.name;
    dot.setAttribute('aria-label', slide.name);
    dot.addEventListener('click', () => go(i));
    dots.appendChild(dot);
  });

  prev.addEventListener('click', () => go(index - 1));
  next.addEventListener('click', () => go(index + 1));

  nav.append(prev, dots, counter, next);
  wrap.appendChild(nav);

  go(0);
  return wrap;
}

export class LessonView {
  constructor(host, ctx) {
    this.host = host;
    this.ctx = ctx;
    this.step = 0;
    this.simulation = null;
    this.simulationDone = false;
    this.quizDone = false;

    // Mode review terbuka jika sub-topik ini SUDAH pernah diselesaikan.
    const progress = getSubtopicProgress(ctx.chapter.id, ctx.subtopic.id);
    this.reviewMode = progress.status === 'completed';
    if (this.reviewMode) {
      this.simulationDone = true;
      this.quizDone = true;
    }

    /**
     * Ingatan sesi. Siswa yang mundur ke menu lalu masuk lagi ke sub-topik
     * yang sama harus mendarat persis di tempat ia berhenti — bukan dilempar
     * balik ke Materi.
     */
    this.sessionKey = lessonKey(ctx.chapter.id, ctx.subtopic.id);
    const saved = getResume(this.sessionKey);

    if (Number.isInteger(saved.step) && saved.step >= 0 && saved.step < STEPS.length) {
      // Langkah Mini Kuis hanya boleh dipulihkan kalau simulasinya memang
      // sudah tuntas — kalau tidak, siswa melewati kerja yang belum ia
      // kerjakan hanya dengan keluar-masuk layar.
      const allowed = saved.step < 2 || this.reviewMode || saved.simulationDone === true;
      if (allowed) this.step = saved.step;
    }

    if (saved.simulationDone === true) this.simulationDone = true;
    this.resumeSimSlide = Number.isInteger(saved.simSlide) ? saved.simSlide : 0;
  }

  /** Catat posisi terkini ke ingatan sesi. */
  remember(patch) {
    patchResume(this.sessionKey, patch);
  }

  mount() {
    const { chapter, subtopic } = this.ctx;
    markSubtopicStarted(chapter.id, subtopic.id);

    this.host.innerHTML = '';

    /**
     * Kerangka "Sidebar & Stage" (Fase 10).
     *
     * Sebelumnya semuanya bertumpuk vertikal: judul, tab, petunjuk, lalu
     * matriks. Di lanskap pendek, tumpukan itu meremas matriks sampai
     * $3\times3$ nyaris tak terbaca. Sekarang layar dibelah dua:
     *
     *   KIRI  (±28%) — kendali: tombol kembali, judul, tab langkah,
     *                  petunjuk langkah-demi-langkah, dan aksi utama.
     *   KANAN (±72%) — panggung: HANYA kanvas. Matriks, persamaan, atau
     *                  teks teori punya seluruh ruang itu untuk bernapas.
     */
    const workspace = el('div', 'workspace workspace--split');

    const side = el('aside', 'ws-side');
    side.setAttribute('aria-label', 'Panel kendali sub-topik');

    const sideHead = el('div', 'ws-side__head');

    const back = el('button', 'btn btn--icon btn--ghost ws-side__back');
    back.type = 'button';
    back.setAttribute('aria-label', 'Kembali ke daftar sub-topik');
    back.title = 'Kembali ke daftar sub-topik';
    back.innerHTML = icon('arrow-left', { size: 18 });
    back.addEventListener('click', () => this.ctx.onExit());
    sideHead.appendChild(back);

    const titles = el('div', 'workspace__titles');
    titles.appendChild(el('div', 'workspace__eyebrow', `Bab ${chapter.number} · ${chapter.title}`));
    titles.appendChild(el('div', 'workspace__title', renderMixed(subtopic.title)));
    sideHead.appendChild(titles);

    side.appendChild(sideHead);

    if (this.reviewMode) {
      const flag = el('div', 'review-flag');
      flag.innerHTML = `${icon('check-circle', { size: 13 })}<span>Mode Review</span>`;
      flag.title = 'Sub-topik ini sudah selesai — kamu bebas melompat ke bagian mana pun.';
      side.appendChild(flag);
    }

    // Tab langkah
    this.stepsEl = el('div', 'steps');
    this.stepsEl.setAttribute('role', this.reviewMode ? 'tablist' : 'group');
    this.stepsEl.setAttribute('aria-label', 'Bagian sub-topik');
    if (this.reviewMode) this.stepsEl.dataset.mode = 'review';

    STEPS.forEach((s, i) => {
      const item = el(this.reviewMode ? 'button' : 'div', 'steps__item');
      item.dataset.state = i === 0 ? 'active' : 'pending';
      item.innerHTML = `<span class="steps__num">${i + 1}</span><span>${s.label}</span>`;

      if (this.reviewMode) {
        item.type = 'button';
        item.setAttribute('role', 'tab');
        item.setAttribute('aria-selected', String(i === 0));
        item.title = `Lompat ke ${s.label}`;
        item.addEventListener('click', () => this.goTo(i));
      }

      this.stepsEl.appendChild(item);
    });

    side.appendChild(this.stepsEl);

    /**
     * Tempat petunjuk langkah. Simulasi menaruh brief, legenda warna, prompt,
     * dan checklist-nya DI SINI, bukan di atas panggung — supaya panggung
     * benar-benar hanya berisi matriks.
     */
    this.hintHost = el('div', 'ws-side__hint');
    side.appendChild(this.hintHost);

    // Bilah aksi hidup DI LUAR area gulir: aksi utama ("Lanjut ke …") harus
    // selalu terlihat tanpa siswa perlu menggulir apa pun.
    this.actionHost = el('div', 'workspace__actions ws-side__actions');
    side.appendChild(this.actionHost);

    workspace.appendChild(side);

    const stage = el('section', 'ws-stage');
    stage.setAttribute('aria-label', 'Area kerja');

    this.body = el('div', 'workspace__body');
    stage.appendChild(this.body);
    workspace.appendChild(stage);

    this.workspace = workspace;
    this.host.appendChild(workspace);
    this.renderStep();
  }

  /** Lompat ke bagian tertentu (hanya berlaku di mode review). */
  goTo(index) {
    if (!this.reviewMode || index === this.step) return;
    this.step = index;
    this.renderStep();
  }

  syncSteps() {
    [...this.stepsEl.children].forEach((item, i) => {
      // Di mode review semua bagian dianggap tuntas; yang aktif tetap ditandai.
      const state = i === this.step ? 'active' : (this.reviewMode || i < this.step ? 'done' : 'pending');
      item.dataset.state = state;
      if (this.reviewMode) item.setAttribute('aria-selected', String(i === this.step));
    });
  }

  renderStep() {
    this.syncSteps();
    this.body.scrollTop = 0;
    this.remember({ step: this.step, simulationDone: this.simulationDone });

    if (this.simulation) {
      this.simulation.destroy();
      this.simulation = null;
    }

    this.body.innerHTML = '';
    if (this.actionHost) this.actionHost.innerHTML = '';
    if (this.hintHost) this.hintHost.innerHTML = '';

    if (this.step === 0) return this.renderMateri();
    if (this.step === 1) return this.renderSimulation();
    return this.renderQuiz();
  }

  /* ---------------- A. Materi ---------------- */
  renderMateri() {
    const { subtopic } = this.ctx;

    // Teks TIDAK PERNAH langsung di atas latar grid — selalu di dalam kartu solid.
    // Fase 9 — SATU kolom mengalir, titik. Paginasi berkolom dari Fase 8
    // memotong-motong bacaan menjadi kolom sempit yang justru sulit diikuti.
    // Teori panjang sekarang digulir dengan tenang DI DALAM kartunya sendiri
    // (lihat `.materi-card` di phase9.css), sementara halamannya tetap 100vh.
    this.setHint(
      'Materi',
      'Baca dulu penjelasannya. Kalau sudah paham, lanjutkan ke simulasi lewat tombol di bawah.'
    );

    const card = el('div', 'content-card materi-card anim-rise');
    const wrap = el('div', 'materi');
    subtopic.materi.forEach((block) => wrap.appendChild(renderBlock(block)));
    card.appendChild(wrap);
    this.body.appendChild(card);

    const actions = el('div', 'actionbar');
    actions.appendChild(el('span', 'actionbar__note', 'Sudah paham? Lanjut ke simulasi.'));
    actions.appendChild(el('div', 'actionbar__spacer'));

    const next = el('button', 'btn btn--primary');
    next.type = 'button';
    next.innerHTML = `<span>Mulai Simulasi</span>${icon('arrow-right', { size: 17 })}`;
    next.addEventListener('click', () => { this.step = 1; this.renderStep(); });
    actions.appendChild(next);

    this.actionHost.appendChild(actions);
  }

  /* ---------------- B. Simulasi ---------------- */
  renderSimulation() {
    const { subtopic } = this.ctx;

    const card = el('div', 'content-card content-card--tight anim-rise');
    // Pembungkus simulasi diberi kelas supaya CSS bisa membuatnya ikut
    // menyusut di lanskap. Tanpa kelas, ia jadi flex-item bawaan yang menolak
    // mengecil dan panggung di dalamnya meluap keluar kartu.
    const simHost = el('div', 'sim-host');
    card.appendChild(simHost);
    this.body.appendChild(card);

    const actions = el('div', 'actionbar');

    const back = el('button', 'btn btn--ghost');
    back.type = 'button';
    back.innerHTML = `${icon('arrow-left', { size: 16 })}<span>Materi</span>`;
    back.addEventListener('click', () => { this.step = 0; this.renderStep(); });
    actions.appendChild(back);

    const retry = el('button', 'btn btn--ghost');
    retry.type = 'button';
    retry.innerHTML = `${icon('rotate', { size: 16 })}<span>Ulangi Simulasi</span>`;
    retry.addEventListener('click', () => {
      // "Ulangi" adalah permintaan eksplisit untuk kembali ke awal, jadi
      // ingatan slide-nya memang harus dilupakan.
      this.simulationDone = this.reviewMode;
      this.resumeSimSlide = 0;
      this.remember({ simSlide: 0, simulationDone: this.simulationDone });
      this.renderStep();
    });
    actions.appendChild(retry);

    actions.appendChild(el('div', 'actionbar__spacer'));

    // Tombol "lewati" tetap berupa tombol berkotak, bukan tautan telanjang.
    const skip = el('button', 'btn btn--quiet');
    skip.type = 'button';
    skip.innerHTML = `${icon('chevron-right', { size: 15 })}<span>Lewati Simulasi</span>`;
    skip.addEventListener('click', () => { this.step = 2; this.renderStep(); });

    const next = el('button', 'btn btn--success');
    next.type = 'button';
    next.disabled = !this.simulationDone;
    next.innerHTML = `<span>Lanjut ke Mini Kuis</span>${icon('arrow-right', { size: 17 })}`;
    next.addEventListener('click', () => { this.step = 2; this.renderStep(); });
    if (this.simulationDone) next.classList.add('btn--pulse');
    actions.appendChild(next);

    this.actionHost.appendChild(actions);

    this.simulation = mountSimulation(simHost, subtopic.simulation, () => {
      this.simulationDone = true;
      this.remember({ simulationDone: true });
      next.disabled = false;
      // Denyut menuntun mata siswa ke aksi berikutnya.
      next.classList.add('btn--pulse');
      next.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, {
      hintHost: this.hintHost,
      resumeSlide: this.resumeSimSlide,
      onSlideChange: (index) => {
        this.resumeSimSlide = index;
        this.remember({ simSlide: index });
      },
    });

    // Tombol lewati baru muncul setelah siswa sempat mencoba.
    setTimeout(() => {
      if (!this.simulationDone && actions.isConnected) {
        actions.insertBefore(skip, actions.querySelector('.actionbar__spacer'));
      }
    }, 30000);
  }

  /** Tulis judul + kalimat konteks di panel kiri. */
  setHint(label, text) {
    if (!this.hintHost) return;
    this.hintHost.innerHTML = '';
    this.hintHost.appendChild(el('div', 'ws-hint__label', label));
    this.hintHost.appendChild(el('p', 'ws-hint__text', renderMixed(text)));
  }

  /* ---------------- C. Mini Kuis ---------------- */
  renderQuiz() {
    const { chapter, subtopic } = this.ctx;

    this.setHint(
      'Mini Kuis',
      this.reviewMode
        ? 'Sub-topik ini sudah selesai. Baca ulang soal beserta kunci dan pembahasannya.'
        : 'Jawab soalnya untuk membuka sub-topik berikutnya. Salah tidak apa-apa — kamu boleh mencoba lagi.'
    );

    const host = el('div');
    this.body.appendChild(host);

    // Mode review: TIDAK menjalankan logika kuis sama sekali. Siswa hanya
    // membaca kembali soal beserta kunci dan pembahasannya.
    if (this.reviewMode) return this.renderQuizReview(host);

    recordAttempt(chapter.id, subtopic.id);

    const engine = new QuizEngine(host, subtopic.quiz, {
      sessionKey: `${this.sessionKey}#kuis`,
      requireCorrect: true,
      showExplanation: true,
      onFinish: (result) => this.onQuizFinish(result, host),
      backButton: {
        label: 'Simulasi',
        onClick: () => { this.step = 1; this.renderStep(); },
      },
    });

    engine.start();
  }

  /** Tampilan review: soal + kunci jawaban + pembahasan, tanpa interaksi. */
  renderQuizReview(host) {
    const { subtopic } = this.ctx;

    const intro = el('div', 'callout callout--tip');
    intro.innerHTML = `
      <span class="callout__icon">${icon('check-circle')}</span>
      <div class="callout__body">
        <div class="callout__title">Mode Review</div>
        <div class="callout__text">Sub-topik ini sudah kamu selesaikan. Berikut soal Mini Kuis beserta kunci dan pembahasannya.</div>
      </div>`;
    host.appendChild(intro);

    subtopic.quiz.forEach((q, index) => {
      const card = el('div', 'content-card content-card--tight anim-rise');

      const meta = el('div', 'quiz__meta');
      meta.appendChild(el('span', 'badge badge--primary', `Soal ${index + 1}`));
      card.appendChild(meta);

      card.appendChild(el('div', 'quiz__prompt', renderMixed(q.prompt)));
      if (q.tex) card.appendChild(el('div', null, renderToString(q.tex, { display: true })));

      card.appendChild(this.buildAnswerKey(q));

      if (q.explanation) {
        const box = el('div', 'explain');
        box.innerHTML = `<div class="explain__title">Pembahasan</div>${renderMixed(q.explanation)}`;
        card.appendChild(box);
      }

      host.appendChild(card);
    });

    const actions = el('div', 'actionbar');

    const back = el('button', 'btn btn--ghost');
    back.type = 'button';
    back.innerHTML = `${icon('arrow-left', { size: 16 })}<span>Simulasi</span>`;
    back.addEventListener('click', () => { this.step = 1; this.renderStep(); });
    actions.appendChild(back);

    actions.appendChild(el('div', 'actionbar__spacer'));

    const toList = el('button', 'btn btn--primary');
    toList.type = 'button';
    toList.innerHTML = `${icon('layers', { size: 17 })}<span>Daftar Sub-topik</span>`;
    toList.addEventListener('click', () => this.ctx.onExit());
    actions.appendChild(toList);

    this.actionHost.appendChild(actions);
  }

  /** Kunci jawaban yang dirender sesuai tipe soalnya. */
  buildAnswerKey(q) {
    const wrap = el('div', 'answer-key');
    wrap.appendChild(el('div', 'answer-key__label', 'Kunci Jawaban'));

    if (q.input_type === 'single_choice' || q.input_type === 'multi_select') {
      const correct = q.input_type === 'multi_select'
        ? q.answerIndices
        : [q.answerIndex];

      const list = el('div', 'options');
      list.dataset.multi = String(q.input_type === 'multi_select');

      q.options.forEach((opt, i) => {
        const isRight = correct.includes(i);
        const row = el('div', `option option--locked${isRight ? ' option--correct' : ''}`);
        row.innerHTML = `
          <span class="option__box">${isRight ? icon('check', { size: 14 }) : ''}</span>
          <span class="option__label">${opt.tex
            ? `${opt.label ? `<strong>${opt.label}</strong> ` : ''}${renderToString(opt.tex)}`
            : renderMixed(opt.label)}</span>`;
        list.appendChild(row);

        if (q.perOptionFeedback && q.perOptionFeedback[i]) {
          const cap = el('div', `option-feedback option-feedback--${isRight ? 'ok' : 'no'}`,
            renderMixed(q.perOptionFeedback[i]));
          list.appendChild(cap);
        }
      });

      wrap.appendChild(list);
      return wrap;
    }

    if (q.input_type === 'matrix_input') {
      const view = el('div');
      view.style.cssText = 'display:flex;justify-content:center;padding:var(--sp-2) 0';
      view.innerHTML = renderToString(
        q.answer.map((r) => r.join(' & ')).join(' \\\\ ')
          .replace(/^/, '\\begin{pmatrix} ').replace(/$/, ' \\end{pmatrix}'),
        { display: true }
      );
      wrap.appendChild(view);
      return wrap;
    }

    // mathpad / numerik
    wrap.appendChild(el('div', 'answer-key__value', String(q.answer)));
    return wrap;
  }

  onQuizFinish(result, host) {
    const { chapter, subtopic, subtopicOrder } = this.ctx;

    // Modul tuntas: ingatan posisinya dibuang supaya kunjungan berikutnya
    // dimulai dari Materi, bukan dari layar hasil.
    clearResume(this.sessionKey);
    clearResume(`${this.sessionKey}#kuis`);

    if (!this.reviewMode) {
      markSubtopicCompleted(chapter.id, subtopic.id, result.score);
      const chapterDone = setChapterCompleteIfDone(chapter.id, subtopicOrder);

      if (unlockBadge('first_lesson_complete')) {
        toast.info('Lencana baru terbuka: **Langkah Pertama**!');
      }
      if (chapterDone && unlockBadge(`chapter_${chapter.id}`)) {
        toast.info(`Lencana baru: **Bab ${chapter.number} Tuntas**!`);
      }
    }

    this.syncStepsAllDone();

    const index = subtopicOrder.indexOf(subtopic.id);
    const nextId = subtopicOrder[index + 1];

    // Ganti isi panel, JANGAN menumpuk. Bersama penjaga `finished` di
    // QuizEngine, inilah yang menutup bug kartu hasil beranak-pinak.
    host.innerHTML = '';

    // Layar penutup memakai kelasnya sendiri (.lesson-done) supaya bisa
    // memakai seluruh ruang yang tersedia dan tetap terpusat sempurna —
    // termasuk di lanskap, tempat versi lama tampil kecil dan melenceng
    // karena hanya mengandalkan gaya sebaris.
    const panel = el('div', 'quiz lesson-done anim-rise');

    const card = el('div', 'quiz__card lesson-done__card');
    const inner = el('div', 'lesson-done__inner');
    inner.appendChild(el('span', 'lesson-done__icon', icon('trophy', { size: 46 })));
    inner.appendChild(el('h3', 'lesson-done__title',
      this.reviewMode ? 'Review selesai!' : 'Sub-topik selesai!'));
    inner.appendChild(el('p', 'lesson-done__score text-muted',
      `Skor Mini Kuis kamu: <strong>${result.score}</strong> dari 100.`));
    card.appendChild(inner);
    panel.appendChild(card);

    const actions = el('div', 'actionbar');

    const toList = el('button', 'btn btn--ghost');
    toList.type = 'button';
    toList.innerHTML = `${icon('layers', { size: 17 })}<span>Daftar Sub-topik</span>`;
    toList.addEventListener('click', () => this.ctx.onExit());
    actions.appendChild(toList);

    actions.appendChild(el('div', 'actionbar__spacer'));

    if (nextId) {
      const next = el('button', 'btn btn--primary btn--pulse');
      next.type = 'button';
      next.innerHTML = `<span>Sub-topik Berikutnya</span>${icon('arrow-right', { size: 17 })}`;
      next.addEventListener('click', () => this.ctx.onNextSubtopic(nextId));
      actions.appendChild(next);
    } else {
      const done = el('button', 'btn btn--success btn--pulse');
      done.type = 'button';
      done.innerHTML = `${icon('check-circle', { size: 17 })}<span>Bab Selesai</span>`;
      done.addEventListener('click', () => this.ctx.onExit());
      actions.appendChild(done);
    }

    panel.appendChild(actions);
    host.appendChild(panel);
    panel.scrollIntoView({ behavior: 'smooth', block: 'end' });

    // Sejak sekarang tab bisa diklik untuk review.
    if (!this.reviewMode) {
      this.reviewMode = true;
      this.enableReviewTabs();
    }
  }

  /** Ubah penanda langkah menjadi tab yang benar-benar bisa diklik. */
  enableReviewTabs() {
    const current = [...this.stepsEl.children];
    this.stepsEl.dataset.mode = 'review';
    this.stepsEl.setAttribute('role', 'tablist');

    current.forEach((old, i) => {
      const item = el('button', 'steps__item');
      item.type = 'button';
      item.dataset.state = old.dataset.state;
      item.setAttribute('role', 'tab');
      item.setAttribute('aria-selected', String(i === this.step));
      item.title = `Lompat ke ${STEPS[i].label}`;
      item.innerHTML = old.innerHTML;
      item.addEventListener('click', () => this.goTo(i));
      old.replaceWith(item);
    });
  }

  syncStepsAllDone() {
    [...this.stepsEl.children].forEach((item, i) => {
      item.dataset.state = i === this.step ? 'active' : 'done';
    });
  }

  destroy() {
    if (this.simulation) this.simulation.destroy();
  }
}

export default LessonView;
