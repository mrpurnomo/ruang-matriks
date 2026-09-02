/**
 * app.js — Entry point.
 * Memuat manifest, memasang rute, dan merender tiap layar.
 */

import * as router from './router.js';
import { icon } from './ui/icons.js';
import toast, { clearToasts, anchorToasts } from './ui/toast.js';
import { showModal, confirmAction } from './ui/modal.js';
import { renderMixed } from './engine/katexRenderer.js';
import { LessonView } from './modules/belajar/lessonRenderer.js';
import { QuizEngine } from './modules/kuis/quizEngine.js';
import { ExamEngine } from './modules/kuis/examEngine.js';
import { renderQuizResult } from './modules/kuis/quizResult.js';
import {
  touchSession, getOverallProgress, getChapterProgress, getSubtopicProgress,
  isSubtopicUnlocked, getLastVisited, saveQuizResult, getQuizHistory, getState,
  isStorageAvailable, resetAll, getSettings, updateSettings,
} from './state/progressStore.js';
import { quizKey, clearAllResume } from './state/sessionState.js';
import { attachMathpad, closeMathpad } from './ui/mathpad.js';
import { killAllMotion } from './interactions/motion.js';

/* ------------------------------------------------------------
   State aplikasi
   ------------------------------------------------------------ */
const state = {
  manifest: null,
  chapters: new Map(),   // cache konten bab (lazy-load per bab)
  quizzes: null,
  activeView: null,
};

const screenHost = document.getElementById('screen-host');

/* ------------------------------------------------------------
   Identitas siswa

   Disimpan di localStorage (sejak Fase 14), bukan sessionStorage.
   Alasannya lapangan: sessionStorage hanya hidup di SATU tab. Siswa yang
   tidak sengaja menyegarkan halaman — atau membuka tautan di tab baru —
   dilempar kembali ke layar masuk dan harus mengetik namanya lagi lewat
   papan huruf. Di jaringan sekolah yang lambat itu terasa seperti aplikasi
   yang kehilangan pekerjaannya.

   Konsekuensinya diakui dan ditangani: perangkat kelas yang dipakai
   bergantian kini MENGINGAT siswa pertama sampai ada yang menggantinya.
   Karena itu tombol "Ganti Akun" di menu utama BUKAN pelengkap — ia
   syarat supaya keputusan ini aman. Jangan hapus salah satunya tanpa
   yang lain.
   ------------------------------------------------------------ */
const IDENTITY_KEY = 'matriksLab.identity.v1';

/** Penyimpanan identitas; null kalau peramban memblokirnya (mode privat). */
function identityStore() {
  try {
    const s = window.localStorage;
    const probe = `${IDENTITY_KEY}.probe`;
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch (err) {
    return null;
  }
}

function getIdentity() {
  const store = identityStore();
  if (!store) return null;
  try {
    const raw = store.getItem(IDENTITY_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && data.nama ? data : null;
  } catch (err) {
    return null;
  }
}

function setIdentity(identity) {
  const store = identityStore();
  if (!store) {
    console.warn('[app] penyimpanan diblokir — identitas tidak bisa disimpan');
    return;
  }
  try {
    store.setItem(IDENTITY_KEY, JSON.stringify(identity));
  } catch (err) {
    console.warn('[app] identitas gagal disimpan:', err);
  }
}

/**
 * Lupakan siswa yang sedang masuk.
 *
 * Yang dihapus HANYA identitas dan posisi belajarnya. Pencapaian di
 * `progressStore` sengaja DIBIARKAN: ia milik perangkat, bukan milik satu
 * siswa, dan menghapusnya diam-diam setiap pergantian akun akan membuang
 * pekerjaan seisi kelas. Menghapus progres punya pintunya sendiri
 * ("Reset Progres") yang meminta konfirmasi terpisah.
 */
function clearIdentity() {
  const store = identityStore();
  try {
    if (store) store.removeItem(IDENTITY_KEY);
  } catch (err) {
    console.warn('[app] identitas gagal dihapus:', err);
  }
  // Posisi terakhir milik siswa sebelumnya tidak boleh diwarisi.
  clearAllResume();
}

/** Nama panggilan: kata pertama saja, agar sapaan tetap ringkas. */
function firstName(nama) {
  return String(nama || '').trim().split(/\s+/)[0] || 'Siswa';
}

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

/* ------------------------------------------------------------
   Pemuatan data
   ------------------------------------------------------------ */
async function fetchJSON(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Gagal memuat ${path} (${res.status})`);
  return res.json();
}

async function loadManifest() {
  if (state.manifest) return state.manifest;
  state.manifest = await fetchJSON('data/lessons.json');
  return state.manifest;
}

/** Lazy-load: konten bab hanya diambil saat benar-benar dibuka. */
async function loadChapter(chapterId) {
  if (state.chapters.has(chapterId)) return state.chapters.get(chapterId);

  const meta = state.manifest.chapters.find((c) => c.id === chapterId);
  if (!meta) throw new Error(`Bab "${chapterId}" tidak ditemukan`);

  const data = await fetchJSON(meta.src);
  state.chapters.set(chapterId, data);
  return data;
}

async function loadQuizzes() {
  if (state.quizzes) return state.quizzes;
  state.quizzes = await fetchJSON('data/quizzes.json');
  return state.quizzes;
}

/* ------------------------------------------------------------
   Kerangka layar
   ------------------------------------------------------------ */
function mountScreen(builder, { isBack = false } = {}) {
  clearToasts();

  /**
   * Papan angka hidup di `document.body`, bukan di dalam layar — jadi
   * berpindah layar TIDAK membongkarnya, dan ia akan mengambang di atas
   * layar berikutnya. Ditutup di sini, dan ditutup dengan MENYIMPAN:
   * angka yang sudah diketik siswa tidak boleh hilang hanya karena
   * layarnya berganti.
   */
  closeMathpad();

  // Tambatan toast milik layar sebelumnya ikut dilepas; layar yang punya
  // kolom panggung akan memasangnya kembali saat ia dirender.
  anchorToasts(null);

  if (state.activeView && typeof state.activeView.destroy === 'function') {
    state.activeView.destroy();
    state.activeView = null;
  }

  // Membuang HTML layar TIDAK menghentikan animasinya. Timeline GSAP hidup di
  // objek global, dan chip terbang menempel di `document.body` — keduanya
  // selamat dari baris di bawah lalu terus berjalan di latar. Karena itu
  // pembunuhannya harus mendahului pembongkaran (Fase 11, isu 5).
  killAllMotion();

  screenHost.innerHTML = '';

  const screen = el('div', `screen ${isBack ? 'screen--enter-back' : 'screen--enter'}`);
  const container = el('div', 'container');
  screen.appendChild(container);
  screenHost.appendChild(screen);

  builder(container);
  updateHeader();
}

function showLoading(container, message = 'Memuat…') {
  container.innerHTML = `
    <div class="empty-state">
      <div class="skeleton" style="width:220px;height:18px"></div>
      <p class="text-sm">${message}</p>
    </div>
  `;
}

function showError(container, error) {
  console.error(error);
  container.innerHTML = `
    <div class="empty-state">
      <span style="color:var(--danger)">${icon('alert-circle', { size: 44 })}</span>
      <h3>Konten gagal dimuat</h3>
      <p class="text-sm">${error.message}</p>
      <p class="text-sm text-muted">
        Pastikan aplikasi dijalankan lewat server lokal (bukan dibuka langsung
        sebagai file), karena browser memblokir <code>fetch</code> pada protokol <code>file://</code>.
      </p>
    </div>
  `;
}

/* ------------------------------------------------------------
   Header: progress ring
   ------------------------------------------------------------ */
function updateHeader() {
  // LAPIS 2 dari penjaga masuk (isu 4): di layar masuk, tombol rumah dan
  // cincin progres tidak punya makna — yang satu melompati perkenalan, yang
  // lain melaporkan progres siswa yang belum diketahui siapa. Keduanya
  // disembunyikan DAN dimatikan, bukan sekadar diredupkan.
  const onLogin = router.getCurrentPath() === 'login';
  document.body.classList.toggle('is-login-screen', onLogin);

  const homeBtn = document.querySelector('[data-role="home"]');
  if (homeBtn) {
    homeBtn.disabled = onLogin;
    homeBtn.setAttribute('aria-hidden', String(onLogin));
    homeBtn.tabIndex = onLogin ? -1 : 0;
  }

  if (!state.manifest) return;

  const overall = getOverallProgress(state.manifest);
  const ring = document.querySelector('.progress-ring__bar');
  const label = document.querySelector('.progress-ring__label');

  if (ring) {
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    ring.style.strokeDasharray = String(circumference);
    ring.style.strokeDashoffset = String(circumference * (1 - overall.percent / 100));
  }
  if (label) label.textContent = `${overall.percent}%`;

}

/* ------------------------------------------------------------
   Layar: Masuk
   Dua isian, keduanya lewat papan huruf kustom — keyboard OS tidak
   pernah muncul di aplikasi ini, termasuk untuk teks.
   ------------------------------------------------------------ */
function renderLogin(params, options) {
  mountScreen((container) => {
    container.classList.add('login');

    const card = el('div', 'login__card anim-rise');

    card.appendChild(el('span', 'login__mark', icon('grid', { size: 30 })));
    card.appendChild(el('div', 'login__eyebrow', 'Ruang Matriks'));
    card.appendChild(el('h1', 'login__title', 'Selamat Datang'));
    card.appendChild(el('p', 'login__lead',
      'Lengkapi identitas Anda untuk memulai sesi belajar.'));

    const fields = el('div', 'login__fields');

    const makeField = (label, placeholder, name) => {
      const wrap = el('div', 'login__field');
      const id = `login-${name}`;

      const lbl = el('label', 'login__label', label);
      lbl.setAttribute('for', id);

      const input = document.createElement('input');
      input.id = id;
      input.className = 'login__input';
      input.placeholder = placeholder;
      input.setAttribute('aria-label', label);
      attachMathpad(input, { mode: 'text' });

      wrap.append(lbl, input);
      fields.appendChild(wrap);
      return input;
    };

    const namaInput = makeField('Nama', 'Ketuk untuk mengisi', 'nama');
    const sekolahInput = makeField('Asal Sekolah', 'Ketuk untuk mengisi', 'sekolah');

    card.appendChild(fields);

    const submit = el('button', 'btn btn--primary btn--lg login__submit');
    submit.type = 'button';
    submit.innerHTML = `<span>Mulai Belajar</span>${icon('arrow-right', { size: 18 })}`;

    submit.addEventListener('click', () => {
      const nama = namaInput.value.trim();
      const sekolah = sekolahInput.value.trim();

      // Penolakan SELALU menjelaskan apa yang kurang, dan menunjuk fieldnya.
      if (!nama) {
        namaInput.classList.add('is-invalid');
        setTimeout(() => namaInput.classList.remove('is-invalid'), 1200);
        toast.error('Namamu belum diisi — ketuk kolom Nama untuk membuka papan huruf.');
        return;
      }
      if (!sekolah) {
        sekolahInput.classList.add('is-invalid');
        setTimeout(() => sekolahInput.classList.remove('is-invalid'), 1200);
        toast.error('Asal sekolah belum diisi — ketuk kolomnya untuk membuka papan huruf.');
        return;
      }

      setIdentity({ nama, sekolah, at: Date.now() });
      toast.success(`Selamat belajar, ${firstName(nama)}!`);
      router.navigate('');
    });

    card.appendChild(submit);

    const note = el('div', 'login__note');
    note.innerHTML = `${icon('info', { size: 14 })}<span>Datamu hanya tersimpan di perangkat ini selama sesi belajar.</span>`;
    card.appendChild(note);

    container.appendChild(card);
  }, options);
}

/* ------------------------------------------------------------
   Layar: Latihan Soal TKA (placeholder rute #/tka)
   ------------------------------------------------------------ */
function renderTka(params, options) {
  mountScreen((container) => {
    container.classList.add('soon');

    const card = el('div', 'soon__card anim-rise');
    card.appendChild(el('span', 'soon__mark', icon('trophy', { size: 28 })));
    card.appendChild(el('h2', 'soon__title', 'Latihan Soal TKA'));
    card.appendChild(el('p', 'soon__text',
      'Mode ujian dengan soal acak lintas bab sedang disiapkan. Sementara ini, '
      + 'perkuat dulu pemahamanmu lewat Belajar dan Kuis per bab.'));

    const back = el('button', 'btn btn--primary');
    back.type = 'button';
    back.innerHTML = `${icon('home', { size: 17 })}<span>Kembali ke Menu</span>`;
    back.addEventListener('click', () => router.navigate(''));
    card.appendChild(back);

    container.appendChild(card);
  }, options);
}

/**
 * Keluar dari identitas yang tersimpan, lalu kembali ke layar masuk.
 *
 * Dikonfirmasi lebih dulu lewat `modal.js` (kontrak §5 butir 1 melarang
 * `confirm()` bawaan). Konfirmasinya bukan basa-basi: di tablet kelas,
 * salah sentuh akan melempar siswa keluar di tengah pengerjaan, dan satu
 * ketukan tambahan jauh lebih murah daripada mengetik ulang nama lewat
 * papan huruf.
 */
async function switchAccount(identity) {
  const ok = await confirmAction({
    title: 'Ganti akun?',
    // Tebalnya ditulis **markdown**, bukan <b>: `renderMixed()` meng-escape
    // seluruh masukannya, jadi tag HTML akan tampil mentah sebagai teks.
    body: `Kamu akan keluar dari **${firstName(identity.nama)}** dan kembali ke layar masuk. `
      + 'Pencapaian yang sudah tersimpan di perangkat ini **tidak** dihapus.',
    confirmLabel: 'Ya, Ganti Akun',
    cancelLabel: 'Batal',
    icon: 'refresh',
  });
  if (!ok) return;

  clearIdentity();
  toast.info('Sampai jumpa! Silakan masuk dengan nama yang baru.');

  // Penjaga rute akan menahan rute mana pun tanpa identitas, jadi cukup
  // arahkan ke layar masuk dan biarkan ia bekerja.
  router.navigate('login');
}

/* ------------------------------------------------------------
   Layar: Main Menu
   ------------------------------------------------------------ */
const MODE_CARDS = [
  {
    id: 'belajar', title: 'Belajar', icon: 'book', variant: 'primary',
    desc: 'Materi Bab 1–4 dengan simulasi interaktif dan mini kuis di tiap sub-topik.',
    meta: 'Jalur terstruktur', href: 'belajar',
  },
  {
    id: 'kuis', title: 'Kuis', icon: 'puzzle', variant: 'coral',
    desc: 'Latihan soal per bab untuk menguji pemahamanmu setelah belajar.',
    meta: 'Uji pemahaman', href: 'kuis',
  },
];

/* Latihan Soal TKA sengaja TIDAK ada di deretan kartu ini. Pintu masuknya cukup
   satu — tombol di panel Pencapaianmu — supaya siswa tidak melihat dua jalan
   menuju layar yang sama. */

/** Ambil kalimat pembuka materi sebagai cuplikan untuk hero. */
function snippetOf(subtopic) {
  const first = (subtopic.materi || []).find((b) => b.t === 'p' || b.t === 'def');
  if (!first) return 'Buka sub-topik ini untuk melanjutkan belajarmu.';
  return first.x;
}

async function renderMenu(params, options) {
  mountScreen(async (container) => {
    showLoading(container);

    try {
      await loadManifest();
    } catch (err) {
      return showError(container, err);
    }

    container.innerHTML = '';
    container.classList.add('menu');

    const overall = getOverallProgress(state.manifest);
    const profile = getState().profile;

    const identity = getIdentity();

    const head = el('div', 'menu__head');

    if (identity) {
      const greet = el('span', 'menu__greet');
      greet.innerHTML = `${icon('check-circle', { size: 14 })}<span>${identity.sekolah}</span>`;
      head.appendChild(greet);
    } else {
      head.appendChild(el('div', 'menu__eyebrow', 'Matematika Tingkat Lanjut - Kelas 11'));
    }

    const title = el('h1', 'menu__title', identity
      ? `Halo, ${firstName(identity.nama)}.`
      : (overall.completed > 0 ? 'Selamat datang kembali.' : 'Ruang Matriks'));

    if (identity) {
      /**
       * Jalan keluar dari identitas yang menempel.
       *
       * Sejak identitas pindah ke localStorage (Fase 14), perangkat kelas
       * yang dipakai bergantian akan terus menyapa siswa PERTAMA sampai ada
       * yang menggantinya. Tombol ini karena itu bukan pelengkap — ia yang
       * membuat keputusan localStorage aman dipakai bersama.
       *
       * Letaknya menempel pada sapaan nama, karena di situlah siswa
       * berikutnya menyadari "ini bukan saya".
       */
      const row = el('div', 'menu__identity');
      row.appendChild(title);

      const swap = el('button', 'btn--switch');
      swap.type = 'button';
      swap.innerHTML = `${icon('refresh', { size: 14 })}<span>Ganti Akun</span>`;
      swap.setAttribute('aria-label',
        `Keluar dari akun ${firstName(identity.nama)} dan masuk sebagai siswa lain`);
      swap.title = 'Keluar dan masuk sebagai siswa lain';
      swap.addEventListener('click', () => switchAccount(identity));

      row.appendChild(swap);
      head.appendChild(row);
    } else {
      head.appendChild(title);
    }
    head.appendChild(el('p', 'menu__lead',
      'Belajar matriks secara visual dan menyenangkan'));
    container.appendChild(head);

    /* ---------- HERO: dua panel ala Learnara ---------- */
    const hero = el('div', 'hero');

    // Panel kiri: lanjutkan / mulai belajar, lengkap dengan cuplikan materi
    const last = getLastVisited();
    let heroChapter = null;
    let heroSub = null;

    try {
      const targetChapter = last ? last.chapter : state.manifest.chapters[0].id;
      const targetSub = last ? last.subtopic : state.manifest.chapters[0].subtopicOrder[0];
      heroChapter = state.manifest.chapters.find((c) => c.id === targetChapter);
      const chapterData = await loadChapter(targetChapter);
      heroSub = chapterData.subtopics.find((s) => s.id === targetSub);
    } catch (err) {
      console.warn('[app] gagal memuat hero:', err);
    }

    if (heroChapter && heroSub) {
      const chProgress = getChapterProgress(heroChapter.id, heroChapter.subtopicOrder);
      const subIndex = heroChapter.subtopicOrder.indexOf(heroSub.id) + 1;

      const panel = el('div', 'hero__panel');
      panel.innerHTML = `
        <div class="hero__eyebrow">${last ? 'Lanjutkan Belajar' : 'Mulai Dari Sini'}</div>
        <h2 class="hero__title">${renderMixed(heroSub.title)}</h2>
        <div class="hero__meta">
          <span class="badge badge--primary">Bab ${heroChapter.number}</span>
          <span>${heroChapter.title}</span>
          <span>·</span>
          <span>Sub-topik ${subIndex} dari ${heroChapter.subtopicOrder.length}</span>
        </div>
        <div class="hero__snippet">${renderMixed(snippetOf(heroSub))}</div>
        <div>
          <div class="hero__progress-label">
            <span>Progres Bab ${heroChapter.number}</span>
            <span>${chProgress.completed}/${chProgress.total}</span>
          </div>
          <div class="progressbar"><div class="progressbar__fill" style="width:${chProgress.percent}%"></div></div>
        </div>
      `;

      const actions = el('div', 'hero__actions');

      const go = el('button', 'btn btn--primary btn--lg');
      go.type = 'button';
      go.innerHTML = `${icon('play', { size: 18 })}<span>${last ? 'Lanjutkan' : 'Mulai Pelajaran'}</span>`;
      go.addEventListener('click', () => router.navigate(`belajar/${heroChapter.id}/${heroSub.id}`));
      actions.appendChild(go);

      const seePath = el('button', 'btn btn--ghost btn--lg');
      seePath.type = 'button';
      seePath.innerHTML = `${icon('layers', { size: 18 })}<span>Lihat Semua Bab</span>`;
      seePath.addEventListener('click', () => router.navigate('belajar'));
      actions.appendChild(seePath);

      panel.appendChild(actions);
      hero.appendChild(panel);
    }

    // Panel kanan: ringkasan pencapaian
    const stats = el('div', 'hero__panel hero__panel--next');
    stats.innerHTML = `<div class="hero__eyebrow">Pencapaianmu</div>`;

    const statGrid = el('div', 'hero__stats');
    [
      { value: `${overall.percent}%`, label: 'Kurikulum dikuasai', color: 'var(--brand-primary)' },
      { value: `${overall.completed}/${overall.total}`, label: 'Sub-topik selesai', color: 'var(--success)' },
      /**
       * Dulu di sini ada "N Lencana terbuka" — dan itu MENIPU: sistem
       * lencananya tidak pernah ada. `unlockBadge()` memang menyimpan
       * penanda, tetapi tidak ada satu pun layar yang menampilkan lencana,
       * menjelaskan apa artinya, atau bisa dibuka siswa dengan sengaja.
       * Angka yang tidak bisa ditelusuri lebih buruk daripada tidak ada
       * angka sama sekali.
       *
       * Gantinya angka yang benar-benar berarti dan bisa dikejar: nilai
       * TERBAIK dari seluruh percobaan Latihan Soal TKA.
       */
      { value: skorTkaTertinggi(), label: 'Skor TKA tertinggi', color: 'var(--accent-amber)' },
    ].forEach((s) => {
      const box = el('div', 'hero-stat');
      box.style.setProperty('--stat-color', s.color);
      box.innerHTML = `<div class="hero-stat__value">${s.value}</div><div class="hero-stat__label">${s.label}</div>`;
      statGrid.appendChild(box);
    });

    stats.appendChild(statGrid);

    const statActions = el('div', 'hero__actions');
    const toQuiz = el('button', 'btn btn--amber btn--lg');
    toQuiz.type = 'button';
    toQuiz.innerHTML = `${icon('trophy', { size: 18 })}<span>Latihan Soal TKA</span>`;
    toQuiz.addEventListener('click', () => router.navigate('kuis/simulasi_tka/all'));
    statActions.appendChild(toQuiz);
    stats.appendChild(statActions);

    hero.appendChild(stats);
    container.appendChild(hero);

    const grid = el('div', 'menu__grid stagger');
    MODE_CARDS.forEach((card) => {
      const node = el('button', `mode-card mode-card--${card.variant}`);
      node.type = 'button';
      node.dataset.sheet = `LEMBAR 0${MODE_CARDS.indexOf(card) + 1}`;
      node.innerHTML = `
        <span class="mode-card__icon">${icon(card.icon, { size: 26 })}</span>
        <span class="mode-card__title">${card.title}</span>
        <span class="mode-card__desc">${card.desc}</span>
        <span class="mode-card__meta">${card.meta} ${icon('arrow-right', { size: 15 })}</span>
      `;
      node.addEventListener('click', () => router.navigate(card.href));
      grid.appendChild(node);
    });
    container.appendChild(grid);

    // Peringatan bila localStorage tidak tersedia (mode privat/penyimpanan penuh).
    if (!isStorageAvailable()) {
      container.appendChild(el('div', 'callout callout--warn',
        `<span class="callout__icon">${icon('alert-triangle')}</span>
         <div class="callout__body">
           <div class="callout__title">Progres tidak bisa disimpan</div>
           <div class="callout__text">Browser memblokir penyimpanan lokal, jadi kemajuan belajarmu tidak akan tersimpan setelah tab ditutup.</div>
         </div>`));
    }

    // Baris aksi bawah memakai kelasnya sendiri supaya bisa dirapatkan di
    // lanskap pendek — gaya sebaris tidak bisa mengikuti media query.
    const footer = el('div', 'menu__footer');

    const resetBtn = el('button', 'btn btn--danger btn--sm');
    resetBtn.type = 'button';
    resetBtn.innerHTML = `${icon('trash', { size: 15 })}<span>Reset Progres</span>`;
    resetBtn.addEventListener('click', async () => {
      // Modal kustom, bukan confirm() bawaan.
      const ok = await confirmAction({
        title: 'Reset seluruh progres?',
        body: 'Semua kemajuan belajar, riwayat kuis, lencana, dan simpanan Whiteboard akan **dihapus permanen**. Tindakan ini tidak bisa dibatalkan.',
        confirmLabel: 'Ya, Hapus Semua Progres',
        cancelLabel: 'Batal, Simpan Progres Saya',
        variant: 'danger',
        icon: 'alert-triangle',
      });
      if (ok) {
        resetAll();
        // Reset progres juga membuang ingatan posisi — kalau tidak, siswa
        // dengan progres kosong tetap mendarat di tengah sub-topik.
        clearAllResume();
        toast.success('Progres berhasil direset.');
        router.navigate('', { replace: true });
        renderMenu({}, {});
      }
    });
    footer.appendChild(resetBtn);
    container.appendChild(footer);
  }, options);
}

/* ------------------------------------------------------------
   Layar: Daftar Bab
   ------------------------------------------------------------ */
function renderChapterList(params, options) {
  mountScreen(async (container) => {
    showLoading(container);
    try { await loadManifest(); } catch (err) { return showError(container, err); }

    container.innerHTML = '';
    const workspace = el('div', 'workspace');

    workspace.appendChild(buildBar({
      eyebrow: 'Mode Belajar',
      title: 'Pilih Bab',
      onBack: () => router.navigate(''),
    }));

    const body = el('div', 'workspace__body');
    const list = el('div', 'chapter-list stagger');

    state.manifest.chapters.forEach((ch) => {
      const progress = getChapterProgress(ch.id, ch.subtopicOrder);
      const isDone = progress.total > 0 && progress.completed === progress.total;

      const item = el('button', `chapter-item${isDone ? ' chapter-item--completed' : ''}`);
      item.type = 'button';

      // Bab tuntas ditandai emas + ikon piala, jelas beda dari bab berjalan.
      item.innerHTML = `
        <span class="chapter-item__num">${isDone ? icon('trophy', { size: 22 }) : ch.number}</span>
        <span class="chapter-item__body">
          <span class="chapter-item__title">
            ${ch.title}
            ${isDone ? '<span class="badge badge--amber" style="margin-left:8px">Tuntas</span>' : ''}
          </span>
          <span class="chapter-item__tag">${isDone ? 'Semua sub-topik selesai — buka lagi untuk review.' : ch.tagline}</span>
          <span class="progressbar" style="margin-top:8px">
            <span class="progressbar__fill" style="width:${progress.percent}%"></span>
          </span>
        </span>
        <span class="chapter-item__progress">
          ${progress.completed}/${progress.total}
          ${icon('chevron-right', { size: 16 })}
        </span>
      `;
      item.addEventListener('click', () => router.navigate(`belajar/${ch.id}`));
      list.appendChild(item);
    });

    body.appendChild(list);
    workspace.appendChild(body);
    container.appendChild(workspace);
  }, options);
}

/* ------------------------------------------------------------
   Layar: Daftar Sub-topik
   ------------------------------------------------------------ */
function renderSubtopicList(params, options) {
  mountScreen(async (container) => {
    showLoading(container);

    let chapterMeta;
    let chapterData;
    try {
      await loadManifest();
      chapterMeta = state.manifest.chapters.find((c) => c.id === params.chapterId);
      if (!chapterMeta) throw new Error('Bab tidak ditemukan');
      chapterData = await loadChapter(params.chapterId);
    } catch (err) {
      return showError(container, err);
    }

    container.innerHTML = '';
    const workspace = el('div', 'workspace');

    workspace.appendChild(buildBar({
      eyebrow: `Bab ${chapterMeta.number}`,
      title: chapterMeta.title,
      onBack: () => router.navigate('belajar'),
    }));

    const body = el('div', 'workspace__body');
    const list = el('div', 'subtopic-list stagger');

    chapterMeta.subtopicOrder.forEach((id, index) => {
      const sub = chapterData.subtopics.find((s) => s.id === id);
      if (!sub) return;

      const progress = getSubtopicProgress(chapterMeta.id, id);
      const unlocked = isSubtopicUnlocked(chapterMeta.id, chapterMeta.subtopicOrder, id);

      const isDone = progress.status === 'completed';
      const item = el('button', `subtopic-item${isDone ? ' subtopic-item--completed' : ''}`);
      item.type = 'button';
      item.dataset.state = progress.status;
      item.disabled = !unlocked;

      const stateIcon = isDone ? 'check' : unlocked ? 'play' : 'lock';

      item.innerHTML = `
        <span class="subtopic-item__state">${icon(stateIcon, { size: 15 })}</span>
        <span class="subtopic-item__title">${index + 1}. ${sub.title}</span>
        ${isDone
          ? `<span class="badge badge--success">${progress.bestQuizScore}</span>
             <span class="badge badge--primary">Review</span>`
          : ''}
        ${icon('chevron-right', { size: 16 })}
      `;

      if (unlocked) {
        item.addEventListener('click', () =>
          router.navigate(`belajar/${chapterMeta.id}/${id}`));
      } else {
        // Tombol terkunci tetap menjelaskan alasannya.
        item.title = 'Selesaikan sub-topik sebelumnya untuk membuka yang ini.';
      }

      list.appendChild(item);
    });

    body.appendChild(list);
    body.appendChild(el('p', 'quiz__hint',
      'Sub-topik terbuka berurutan — selesaikan Mini Kuis untuk membuka yang berikutnya.'));
    workspace.appendChild(body);
    container.appendChild(workspace);
  }, options);
}

/* ------------------------------------------------------------
   Layar: Satu sub-topik (Materi → Simulasi → Kuis)
   ------------------------------------------------------------ */
function renderLesson(params, options) {
  mountScreen(async (container) => {
    showLoading(container);

    let chapterMeta;
    let chapterData;
    let subtopic;
    try {
      await loadManifest();
      chapterMeta = state.manifest.chapters.find((c) => c.id === params.chapterId);
      chapterData = await loadChapter(params.chapterId);
      subtopic = chapterData.subtopics.find((s) => s.id === params.subtopicId);
      if (!subtopic) throw new Error('Sub-topik tidak ditemukan');
    } catch (err) {
      return showError(container, err);
    }

    container.innerHTML = '';

    const view = new LessonView(container, {
      chapter: chapterMeta,
      subtopic,
      subtopicOrder: chapterMeta.subtopicOrder,
      onExit: () => router.navigate(`belajar/${chapterMeta.id}`),
      onNextSubtopic: (nextId) => router.navigate(`belajar/${chapterMeta.id}/${nextId}`),
    });

    state.activeView = view;
    view.mount();
  }, options);
}

/* ------------------------------------------------------------
   Layar: Menu Kuis
   ------------------------------------------------------------ */
function renderQuizMenu(params, options) {
  mountScreen(async (container) => {
    showLoading(container);
    try {
      await loadManifest();
      await loadQuizzes();
    } catch (err) {
      return showError(container, err);
    }

    container.innerHTML = '';
    const workspace = el('div', 'workspace');

    workspace.appendChild(buildBar({
      eyebrow: 'Mode Kuis',
      title: 'Pilih Jenis Latihan',
      onBack: () => router.navigate(''),
    }));

    const body = el('div', 'workspace__body');

    // --- Latihan Soal TKA: 10 soal tetap, empat di antaranya soal asli 2025 ---
    body.appendChild(el('div', 'panel__label', 'Latihan Soal TKA'));

    const tkaSet = buildTkaSet(state.quizzes);
    const tkaItem = el('button', 'chapter-item');
    tkaItem.type = 'button';
    tkaItem.dataset.role = 'tka-entry';
    tkaItem.innerHTML = `
      <span class="chapter-item__num">${icon('trophy', { size: 18 })}</span>
      <span class="chapter-item__body">
        <span class="chapter-item__title">Latihan Soal TKA</span>
        <span class="chapter-item__tag">${tkaSet.length} soal &middot; gaya ujian sesungguhnya</span>
        ${attemptChips('simulasi_tka', 'all')}
      </span>
      ${icon('chevron-right', { size: 16 })}
    `;
    tkaItem.addEventListener('click', () => router.navigate('kuis/simulasi_tka/all'));
    body.appendChild(tkaItem);

    body.appendChild(el('div', 'panel__label', 'Latihan per Bab'));

    const list = el('div', 'chapter-list stagger');
    state.manifest.chapters.forEach((ch) => {
      const bank = state.quizzes.banks[ch.id] || [];
      const item = el('button', 'chapter-item');
      item.type = 'button';
      item.disabled = bank.length === 0;
      item.innerHTML = `
        <span class="chapter-item__num">${ch.number}</span>
        <span class="chapter-item__body">
          <span class="chapter-item__title">${ch.title}</span>
          <span class="chapter-item__tag">${bank.length} soal tersedia</span>
          ${attemptChips('latihan_bab', ch.id)}
        </span>
        ${icon('chevron-right', { size: 16 })}
      `;
      item.addEventListener('click', () => router.navigate(`kuis/latihan_bab/${ch.id}`));
      list.appendChild(item);
    });

    body.appendChild(list);
    workspace.appendChild(body);
    container.appendChild(workspace);
  }, options);
}

/* ------------------------------------------------------------
   Layar: Sesi Kuis
   ------------------------------------------------------------ */
/**
 * Riwayat percobaan untuk satu set soal, urut dari yang PERTAMA.
 *
 * `progressStore` menyimpan seluruh riwayat kuis dalam satu daftar
 * (terbaru di depan), jadi nomor percobaannya dihitung ulang di sini
 * setelah disaring — tanpa itu, "Percobaan 1" pada Bab 3 bisa berarti
 * percobaan ke-9 secara keseluruhan.
 */
/**
 * Nilai TERBAIK dari seluruh percobaan Latihan Soal TKA.
 *
 * Dibaca dari riwayat kuis di `localStorage`. Belum pernah mencoba berarti
 * belum punya skor — dan itu dikatakan apa adanya, bukan disamarkan jadi "0"
 * yang terbaca seperti nilai nol.
 */
function skorTkaTertinggi() {
  const list = attemptsFor('simulasi_tka', 'all');
  if (!list.length) return 'Belum ada';
  return String(Math.max(...list.map((a) => a.score)));
}

function attemptsFor(mode, bankId) {
  const semua = getQuizHistory(50)
    .filter((h) => h.mode === mode && (h.chapter || 'all') === (bankId || 'all'))
    .slice()
    .reverse();                       // yang paling lama lebih dulu
  return semua.map((h, i) => ({ attempt: i + 1, score: h.score, finishedAt: h.finishedAt }));
}

/** Deretan chip "Percobaan n: skor" untuk kartu di menu kuis. */
function attemptChips(mode, bankId) {
  const list = attemptsFor(mode, bankId);
  if (!list.length) return '';
  // Hanya lima terakhir yang ditampilkan di kartu; sisanya ada di panel ujian.
  const tampil = list.slice(-5);
  const chips = tampil.map((a) => {
    const tone = a.score === 100 ? ' data-tone="perfect"' : '';
    return `<span class="quiz-attempt"${tone}>P${a.attempt}<b>${a.score}</b></span>`;
  }).join('');
  return `<span class="quiz-attempts">${chips}</span>`;
}

function pickRandom(array, count) {
  const pool = [...array];
  const out = [];
  while (pool.length && out.length < count) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

/**
 * Susun set Latihan Soal TKA.
 *
 * Sejak Fase 18 urutannya TETAP, bukan diundi. Alasannya: empat soal
 * pertama adalah soal ASLI TKA 2025 dan harus selalu muncul — mengundinya
 * berarti sebagian siswa tidak pernah menemuinya. Enam sisanya dipilih
 * tangan dari bank bab sebagai soal HOTS penutup.
 *
 * `questionOrder` berisi id soal; `inlineBank` (bank `tka_2025`) memuat
 * soal aslinya. Bila sebuah id tidak ditemukan, ia dilewati dengan
 * peringatan — lebih baik ujiannya lebih pendek daripada gagal total.
 */
function buildTkaSet(quizzes) {
  const config = quizzes.tkaSimulation || {};

  if (Array.isArray(config.questionOrder) && config.questionOrder.length) {
    const index = new Map();
    Object.values(quizzes.banks || {}).forEach((bank) => {
      (bank || []).forEach((q) => index.set(q.id, q));
    });

    const set = [];
    config.questionOrder.forEach((id) => {
      const q = index.get(id);
      if (q) set.push(q);
      else console.warn(`[kuis] soal "${id}" tidak ditemukan di bank mana pun`);
    });
    return set;
  }

  // Jalur lama (undian) tetap didukung untuk konfigurasi tanpa urutan tetap.
  const picked = [];
  (config.drawFrom || []).forEach((bankId) => {
    const bank = quizzes.banks[bankId] || [];
    picked.push(...pickRandom(bank, config.weight[bankId] || 2));
  });
  return pickRandom(picked, config.questionCount || picked.length);
}

function renderQuizSession(params, options) {
  mountScreen(async (container) => {
    showLoading(container);
    try {
      await loadManifest();
      await loadQuizzes();
    } catch (err) {
      return showError(container, err);
    }

    const isTka = params.mode === 'simulasi_tka';
    const questions = isTka
      ? buildTkaSet(state.quizzes)
      : (state.quizzes.banks[params.bankId] || []);

    if (!questions.length) {
      container.innerHTML = '';
      container.appendChild(el('div', 'empty-state',
        `${icon('info', { size: 44 })}<p>Belum ada soal untuk pilihan ini.</p>`));
      return;
    }

    const chapterMeta = state.manifest.chapters.find((c) => c.id === params.bankId);

    /**
     * Mode Kuis mandiri memakai MESIN UJIAN (Fase 18), bukan `QuizEngine`.
     *
     * `QuizEngine` tetap melayani Mini Kuis di dalam sub-topik, tempat umpan
     * balik langsung memang benar (mastery learning). Di sini yang dilatih
     * pengalaman ujian: navigasi bebas, jawaban bisa diubah, dan penilaian
     * baru terjadi setelah dikumpulkan.
     */
    const run = () => {
      /**
       * Sesi lama DIBONGKAR lebih dulu, bukan cuma ditimpa `innerHTML`.
       *
       * Mesin ujian memasang papan coret, dan papan itu memegang
       * `ResizeObserver` serta listener di `window` (kontrak §5 butir 31:
       * pembongkaran harus menyentuh state tingkat-MODUL, bukan hanya DOM).
       * Menekan "Ulangi Ujian" tanpa membongkar akan menumpuk satu papan
       * beserta pengamatnya pada setiap percobaan.
       */
      if (state.activeView && typeof state.activeView.destroy === 'function') {
        state.activeView.destroy();
      }
      container.innerHTML = '';
      const startedAt = new Date().toISOString();

      const engine = new ExamEngine(container, questions, {
        eyebrow: isTka ? 'Latihan Soal TKA' : `Bab ${chapterMeta ? chapterMeta.number : ''}`,
        title: isTka
          ? 'Sepuluh Soal Gaya Ujian'
          : (chapterMeta ? chapterMeta.title : 'Latihan'),
        getHistory: () => attemptsFor(params.mode, params.bankId),
        onExit: () => router.navigate('kuis'),
        onRetry: () => run(),
        onFinish: (result) => {
          saveQuizResult({
            mode: params.mode,
            chapter: params.bankId,
            startedAt,
            finishedAt: new Date().toISOString(),
            ...result,
          });
          updateHeader();
        },
      });
      engine.start();
      // Didaftarkan supaya `mountScreen()` ikut membongkarnya saat siswa
      // berpindah layar.
      state.activeView = engine;
    };

    run();
  }, options);
}

/* ------------------------------------------------------------
   Utilitas UI
   ------------------------------------------------------------ */
function buildBar({ eyebrow, title, onBack }) {
  const bar = el('div', 'workspace__bar');

  const back = el('button', 'btn btn--icon btn--ghost');
  back.type = 'button';
  back.setAttribute('aria-label', 'Kembali');
  back.innerHTML = icon('arrow-left', { size: 18 });
  back.addEventListener('click', onBack);
  bar.appendChild(back);

  const titles = el('div', 'workspace__titles');
  titles.appendChild(el('div', 'workspace__eyebrow', eyebrow));
  titles.appendChild(el('div', 'workspace__title', renderMixed(title)));
  bar.appendChild(titles);

  return bar;
}

/* ------------------------------------------------------------
   Bootstrap
   ------------------------------------------------------------ */
/**
 * Penjaga identitas — LAPIS 1 (Fase 11, isu 4).
 *
 * Berjalan pada setiap perpindahan rute, jadi ia menutup semua pintu masuk
 * sekaligus: tombol rumah di header, tombol Back peramban, dan deep-link yang
 * diketik manual di bilah alamat. Menyembunyikan tombolnya saja (lapis 2 di
 * `updateHeader()`) tidak pernah cukup.
 */
function identityGuard(path) {
  if (path === 'login') return null;          // layar masuk selalu boleh dibuka
  return getIdentity() ? null : 'login';      // sisanya butuh perkenalan
}

function registerRoutes() {
  router.setGuard(identityGuard);
  router.route('/login', renderLogin);
  router.route('/tka', renderTka);
  router.route('/', renderMenu);
  router.route('/belajar', renderChapterList);
  router.route('/belajar/:chapterId', renderSubtopicList);
  router.route('/belajar/:chapterId/:subtopicId', renderLesson);
  router.route('/kuis', renderQuizMenu);
  router.route('/kuis/:mode/:bankId', renderQuizSession);

  router.setNotFound(() => {
    mountScreen((container) => {
      container.appendChild(el('div', 'empty-state', `
        ${icon('search', { size: 44 })}
        <h3>Halaman tidak ditemukan</h3>
        <p class="text-sm">Rute yang kamu tuju tidak dikenali.</p>
      `));
      const btn = el('button', 'btn btn--primary');
      btn.type = 'button';
      btn.innerHTML = `${icon('home', { size: 17 })}<span>Kembali ke Menu</span>`;
      btn.addEventListener('click', () => router.navigate(''));
      container.querySelector('.empty-state').appendChild(btn);
    });
  });
}

/* ------------------------------------------------------------
   Layar penuh
   Media ini dipakai di proyektor dan tablet kelas; layar penuh
   menghilangkan bilah peramban yang memangkas tinggi lanskap.
   ------------------------------------------------------------ */
function syncFullscreenButton() {
  const btn = document.querySelector('[data-role="fullscreen"]');
  if (!btn) return;

  const active = Boolean(document.fullscreenElement);
  const label = btn.querySelector('span');
  if (label) label.textContent = active ? 'Keluar Penuh' : 'Layar Penuh';
  btn.setAttribute('aria-label', active ? 'Keluar dari mode layar penuh' : 'Masuk mode layar penuh');
}

function initFullscreen() {
  const btn = document.querySelector('[data-role="fullscreen"]');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (err) {
      // Sebagian peramban menolak tanpa gestur langsung, atau memblokirnya
      // di iframe. Katakan apa adanya, jangan gagal diam-diam.
      toast.warn('Peramban ini menolak mode layar penuh. Coba tekan tombol F11.');
    }
  });

  document.addEventListener('fullscreenchange', syncFullscreenButton);
  syncFullscreenButton();
}

/**
 * Turunkan layar muat dan munculkan aplikasinya.
 *
 * Dipanggil dari `finally` supaya ia berjalan APA PUN yang terjadi. Kalau
 * `init()` gagal di tengah jalan, siswa harus melihat pesan galat aplikasi —
 * bukan layar muat yang berdenyut selamanya tanpa pernah menjelaskan apa-apa.
 */
function revealApp() {
  document.documentElement.dataset.appReady = 'true';

  const boot = document.getElementById('boot-loader');
  if (!boot) return;

  boot.dataset.done = 'true';
  // Node-nya dibuang setelah transisinya selesai; membiarkannya berarti
  // menyisakan lapisan fixed setinggi layar yang tidak pernah dipakai lagi.
  const drop = () => boot.remove();
  boot.addEventListener('transitionend', drop, { once: true });
  setTimeout(drop, 700);   // jaring pengaman kalau transisinya tidak berjalan
}

async function init() {
  touchSession();
  initFullscreen();
  registerRoutes();

  try {
    await loadManifest();
  } catch (err) {
    console.error('[app] manifest gagal dimuat:', err);
  }

  // Tombol Home di header. Penjaga rute sudah menahan navigasinya, tapi
  // tombolnya juga menolak berbunyi di layar masuk supaya siswa tidak melihat
  // klik yang "tidak melakukan apa-apa" tanpa penjelasan.
  const homeBtn = document.querySelector('[data-role="home"]');
  if (homeBtn) {
    homeBtn.addEventListener('click', (event) => {
      if (!getIdentity()) {
        event.preventDefault();
        toast.info('Isi dulu nama dan asal sekolahmu untuk masuk.');
        return;
      }
      router.navigate('');
    });
  }

  // Pengalihan awal kini ditangani `identityGuard` di dalam router, jadi ia
  // ikut berjalan pada setiap perpindahan berikutnya — bukan sekali saja.
  router.start();
  updateHeader();
}

// Ekspos sedikit permukaan untuk keperluan pengujian otomatis.
window.__matriksLab = {
  state,
  router,
  navigate: (p) => router.navigate(p),
  getOverallProgress: () => getOverallProgress(state.manifest),
  getIdentity,
  setIdentity,
};

/**
 * Bootstrap.
 *
 * `revealApp()` dipanggil di `finally`, jadi layar muat SELALU turun — baik
 * saat semuanya berhasil maupun saat manifesnya gagal diambil. Sampai saat
 * itu, `#app` tetap `opacity: 0`, sehingga siswa tidak pernah melihat header
 * dan footer tergambar duluan di atas isi yang masih kosong.
 */
async function boot() {
  try {
    await init();
  } catch (err) {
    console.error('[app] gagal memulai:', err);
  } finally {
    revealApp();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
