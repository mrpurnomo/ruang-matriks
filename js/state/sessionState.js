/**
 * state/sessionState.js
 * Ingatan JANGKA-SESI: di langkah mana siswa sedang berada.
 *
 * Dipisahkan dari `progressStore.js` dengan sengaja. `progressStore` menyimpan
 * PENCAPAIAN (sub-topik apa yang sudah tuntas, skor terbaiknya) di
 * `localStorage` dan bertahan selamanya. Berkas ini menyimpan POSISI (slide
 * ke berapa, soal ke berapa) di `sessionStorage` — hidup selama tab masih
 * dibuka, lalu hilang. Dua hal yang berbeda umurnya tidak boleh dicampur di
 * satu penyimpanan.
 *
 * Alasannya pedagogis: siswa yang mundur ke menu utama lalu masuk lagi harus
 * mendarat persis di tempat ia berhenti. Dilempar kembali ke awal membuat ia
 * mengulang langkah yang sudah dikuasai, dan itu melelahkan, bukan mengajar.
 */

const KEY = 'matriksLab.session.v1';

/** Cache di memori — dipakai kalau sessionStorage diblokir (mode privat). */
let memoryFallback = {};
let storageWorks = null;

function storage() {
  if (storageWorks === false) return null;
  try {
    const s = window.sessionStorage;
    if (storageWorks === null) {
      const probe = `${KEY}.probe`;
      s.setItem(probe, '1');
      s.removeItem(probe);
      storageWorks = true;
    }
    return s;
  } catch (err) {
    // Mode privat / penyimpanan penuh: jatuh ke cache memori, jangan meledak.
    storageWorks = false;
    return null;
  }
}

function readAll() {
  const s = storage();
  if (!s) return memoryFallback;
  try {
    const raw = s.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('[sessionState] gagal membaca, mulai dari kosong:', err);
    return {};
  }
}

function writeAll(data) {
  memoryFallback = data;
  const s = storage();
  if (!s) return;
  try {
    s.setItem(KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[sessionState] gagal menyimpan:', err);
  }
}

/* ------------------------------------------------------------
   Kunci
   ------------------------------------------------------------ */

/** Kunci untuk satu sub-topik di mode Belajar. */
export function lessonKey(chapterId, subtopicId) {
  return `lesson:${chapterId}/${subtopicId}`;
}

/** Kunci untuk satu sesi kuis mandiri. */
export function quizKey(mode, bankId) {
  return `kuis:${mode}/${bankId || 'all'}`;
}

/* ------------------------------------------------------------
   Baca / tulis
   ------------------------------------------------------------ */

/** Ambil posisi tersimpan. Selalu mengembalikan objek, tidak pernah null. */
export function getResume(key) {
  if (!key) return {};
  const all = readAll();
  const entry = all[key];
  return entry && typeof entry === 'object' ? entry : {};
}

/**
 * Perbarui sebagian posisi. Bentuk `patch` supaya pemanggil bisa menyimpan
 * satu field saja tanpa perlu tahu isi field lainnya.
 */
export function patchResume(key, patch) {
  if (!key || !patch) return;
  const all = readAll();
  all[key] = { ...(all[key] || {}), ...patch, at: Date.now() };
  writeAll(all);
}

/**
 * Hapus posisi tersimpan. Dipanggil saat siswa MENYELESAIKAN modul atau
 * menekan "Ulangi" — dua momen di mana kembali ke awal memang yang diminta.
 */
export function clearResume(key) {
  if (!key) return;
  const all = readAll();
  if (key in all) {
    delete all[key];
    writeAll(all);
  }
}

/** Bersihkan seluruh ingatan sesi (dipakai saat reset progres). */
export function clearAllResume() {
  memoryFallback = {};
  const s = storage();
  if (!s) return;
  try { s.removeItem(KEY); } catch (err) { /* diabaikan */ }
}

export default { lessonKey, quizKey, getResume, patchResume, clearResume, clearAllResume };
