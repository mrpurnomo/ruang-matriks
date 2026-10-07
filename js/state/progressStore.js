/**
 * state/progressStore.js
 * Pembungkus localStorage sesuai skema di PRD §9.
 *
 * Semua tulis-baca progres lewat modul ini agar migrasi skema terpusat dan
 * kegagalan localStorage (mode privat, kuota penuh) tidak merusak aplikasi.
 */

const STORAGE_KEY = 'matriksLab.v1';
const CURRENT_VERSION = 1;
const MAX_QUIZ_HISTORY = 50;

let cache = null;
let storageAvailable = true;

function defaultState() {
  const now = new Date().toISOString();
  return {
    schemaVersion: CURRENT_VERSION,
    profile: {
      displayName: 'Siswa',
      createdAt: now,
      lastActiveAt: now,
    },
    progress: {
      chapters: {},
      lastVisited: null,
    },
    quizHistory: [],
    achievements: { badges: [], unlockedAt: {} },
    settings: {
      reducedMotion: false,
      scaffoldHints: true,
      soundEnabled: true,
    },
  };
}

/** Migrasi berurutan berdasarkan versi tersimpan. */
function migrate(data) {
  let state = data;
  if (!state.schemaVersion) state.schemaVersion = 1;
  // Versi mendatang: tambahkan langkah migrasi di sini, satu blok per versi.
  state.schemaVersion = CURRENT_VERSION;
  return state;
}

function load() {
  if (cache) return cache;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cache = defaultState();
    } else {
      const parsed = JSON.parse(raw);
      cache = migrate({ ...defaultState(), ...parsed });
      // Gabungkan objek bersarang agar kunci baru tetap punya nilai default.
      cache.profile = { ...defaultState().profile, ...parsed.profile };
      cache.settings = { ...defaultState().settings, ...parsed.settings };
      cache.progress = { ...defaultState().progress, ...parsed.progress };
    }
  } catch (err) {
    console.warn('[progressStore] gagal membaca localStorage, memakai state default:', err);
    storageAvailable = false;
    cache = defaultState();
  }

  return cache;
}

function persist() {
  if (!storageAvailable) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    return true;
  } catch (err) {
    console.warn('[progressStore] gagal menyimpan:', err);
    storageAvailable = false;
    return false;
  }
}

export function getState() {
  return load();
}

export function isStorageAvailable() {
  load();
  return storageAvailable;
}

/** Tandai aktivitas terakhir. (Fitur streak harian sudah dihapus.) */
export function touchSession() {
  const state = load();
  state.profile.lastActiveAt = new Date().toISOString();
  persist();
  return state.profile;
}

/* ------------------------------------------------------------------
   Progres bab & sub-topik
   ------------------------------------------------------------------ */

function ensureChapter(chapterId) {
  const state = load();
  if (!state.progress.chapters[chapterId]) {
    state.progress.chapters[chapterId] = { status: 'in_progress', subtopics: {} };
  }
  return state.progress.chapters[chapterId];
}

function ensureSubtopic(chapterId, subtopicId) {
  const chapter = ensureChapter(chapterId);
  if (!chapter.subtopics[subtopicId]) {
    chapter.subtopics[subtopicId] = { status: 'locked', bestQuizScore: 0, attempts: 0 };
  }
  return chapter.subtopics[subtopicId];
}

export function getSubtopicProgress(chapterId, subtopicId) {
  const chapter = load().progress.chapters[chapterId];
  if (!chapter || !chapter.subtopics[subtopicId]) {
    return { status: 'locked', bestQuizScore: 0, attempts: 0 };
  }
  return chapter.subtopics[subtopicId];
}

/**
 * Status kunci dihitung dari URUTAN sub-topik, bukan disimpan sebagai
 * keputusan mandiri — mencegah state yang saling bertentangan (PRD §9).
 */
export function isSubtopicUnlocked(chapterId, subtopicOrder, subtopicId) {
  const index = subtopicOrder.indexOf(subtopicId);
  if (index <= 0) return true;
  const previous = subtopicOrder[index - 1];
  return getSubtopicProgress(chapterId, previous).status === 'completed';
}

export function markSubtopicStarted(chapterId, subtopicId) {
  const sub = ensureSubtopic(chapterId, subtopicId);
  if (sub.status !== 'completed') sub.status = 'in_progress';
  load().progress.lastVisited = { chapter: chapterId, subtopic: subtopicId };
  persist();
}

export function markSubtopicCompleted(chapterId, subtopicId, score = 100) {
  const sub = ensureSubtopic(chapterId, subtopicId);
  sub.status = 'completed';
  sub.attempts = (sub.attempts || 0) + 1;
  sub.bestQuizScore = Math.max(sub.bestQuizScore || 0, score);
  persist();
}

/**
 * Coba Ulang Mini Kuis (Fase 20): perbarui skor terbaik TANPA menyentuh
 * status. Percobaan ulang adalah latihan, bukan ujian ulang — sub-topik yang
 * sudah tuntas tidak boleh terkunci kembali, dan sub-topik sesudahnya tidak
 * boleh ikut tertutup, apa pun hasilnya. Skor hanya bisa NAIK.
 *
 * @returns {boolean} true bila skor ini memecahkan rekor sebelumnya
 */
export function raiseBestQuizScore(chapterId, subtopicId, score) {
  const sub = ensureSubtopic(chapterId, subtopicId);
  const before = sub.bestQuizScore || 0;
  if (score <= before) return false;
  sub.bestQuizScore = score;
  persist();
  return true;
}

export function recordAttempt(chapterId, subtopicId) {
  const sub = ensureSubtopic(chapterId, subtopicId);
  sub.attempts = (sub.attempts || 0) + 1;
  persist();
}

export function setChapterCompleteIfDone(chapterId, subtopicOrder) {
  const chapter = ensureChapter(chapterId);
  const done = subtopicOrder.every(
    (id) => chapter.subtopics[id] && chapter.subtopics[id].status === 'completed'
  );
  chapter.status = done ? 'completed' : 'in_progress';
  persist();
  return done;
}

export function getChapterProgress(chapterId, subtopicOrder) {
  const chapter = load().progress.chapters[chapterId];
  if (!chapter) return { completed: 0, total: subtopicOrder.length, percent: 0 };
  const completed = subtopicOrder.filter(
    (id) => chapter.subtopics[id] && chapter.subtopics[id].status === 'completed'
  ).length;
  return {
    completed,
    total: subtopicOrder.length,
    percent: subtopicOrder.length ? Math.round((completed / subtopicOrder.length) * 100) : 0,
  };
}

/** Persentase penguasaan seluruh kurikulum, untuk progress ring di header. */
export function getOverallProgress(manifest) {
  if (!manifest || !manifest.chapters) return { completed: 0, total: 0, percent: 0 };
  let completed = 0;
  let total = 0;
  manifest.chapters.forEach((ch) => {
    const p = getChapterProgress(ch.id, ch.subtopicOrder);
    completed += p.completed;
    total += p.total;
  });
  return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
}

export function getLastVisited() {
  return load().progress.lastVisited;
}

/* ------------------------------------------------------------------
   Riwayat kuis
   ------------------------------------------------------------------ */

export function saveQuizResult(result) {
  const state = load();
  state.quizHistory.unshift({ id: `q_${Date.now()}`, ...result });
  if (state.quizHistory.length > MAX_QUIZ_HISTORY) {
    state.quizHistory.length = MAX_QUIZ_HISTORY;
  }
  persist();
}

export function getQuizHistory(limit = 10) {
  return load().quizHistory.slice(0, limit);
}

/* ------------------------------------------------------------------
   Pencapaian & pengaturan
   ------------------------------------------------------------------ */

export function unlockBadge(badgeId) {
  const state = load();
  if (state.achievements.badges.includes(badgeId)) return false;
  state.achievements.badges.push(badgeId);
  state.achievements.unlockedAt[badgeId] = new Date().toISOString();
  persist();
  return true;
}

export function getBadges() {
  return load().achievements.badges;
}

export function getSettings() {
  return load().settings;
}

export function updateSettings(patch) {
  const state = load();
  state.settings = { ...state.settings, ...patch };
  persist();
  return state.settings;
}

/** Hapus seluruh progres. Selalu panggil lewat Modal konfirmasi, bukan confirm(). */
export function resetAll() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[progressStore] gagal menghapus:', err);
  }
  cache = defaultState();
  persist();
}

export default {
  getState,
  touchSession,
  getSubtopicProgress,
  isSubtopicUnlocked,
  markSubtopicStarted,
  markSubtopicCompleted,
  recordAttempt,
  setChapterCompleteIfDone,
  getChapterProgress,
  getOverallProgress,
  getLastVisited,
  saveQuizResult,
  getQuizHistory,
  unlockBadge,
  getBadges,
  getSettings,
  updateSettings,
  resetAll,
  isStorageAvailable,
};
