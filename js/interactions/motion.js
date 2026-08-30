/**
 * interactions/motion.js
 * SATU titik pembersihan untuk seluruh gerak yang hidup DI LUAR pohon layar.
 *
 * Masalah yang diselesaikan berkas ini (Fase 11, isu 5): `mountScreen()`
 * mengosongkan `#screen-host`, tapi animasi tidak tinggal di sana. Timeline
 * GSAP hidup di objek global, chip terbang & hantu seret ditempelkan ke
 * `document.body`, dan drop-zone terdaftar di peta modul `dragDrop`. Semua itu
 * SELAMAT dari `innerHTML = ''` — lalu terus berjalan, membakar CPU, dan
 * menulis ke node yang sudah lenyap.
 *
 * Karena itu pembongkaran layar harus memanggil `killAllMotion()`, bukan
 * sekadar membuang HTML-nya.
 */

import { hideDragCue } from './flyToAnimation.js';
import { resetDragSystem } from './dragDrop.js';

/** Node yang hidup di `document.body`, di luar jangkauan pembongkaran layar. */
const ORPHAN_SELECTOR = [
  '.fly-chip',
  '.drag-ghost',
  '.diag-trace',
  '.cue-layer',
  '.cue-hand',
  '.confetti-host',
].join(', ');

/** Bunuh seluruh tween GSAP yang sedang berjalan, apa pun targetnya. */
export function killGsap() {
  const gsap = typeof window !== 'undefined' ? window.gsap : null;
  if (!gsap) return;

  try {
    // `clear()` membuang anak-anak timeline global; `killTweensOf('*')`
    // menyapu tween yang terlanjur lepas dari timeline itu. Keduanya perlu —
    // yang satu tidak menjamin yang lain.
    gsap.globalTimeline.clear();
    gsap.killTweensOf('*');
  } catch (err) {
    console.warn('[motion] gagal menghentikan GSAP:', err);
  }
}

/** Buang node animasi yang menempel langsung di `document.body`. */
export function removeOrphanNodes() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll(ORPHAN_SELECTOR).forEach((node) => node.remove());
}

/**
 * Pembongkaran total: tween, node yatim, isyarat seret, dan seluruh state
 * modul seret/ketuk. Dipanggil setiap kali layar berganti.
 */
export function killAllMotion() {
  killGsap();
  hideDragCue();
  resetDragSystem();
  removeOrphanNodes();

  // Gaya global yang dipasang saat seret dimulai bisa tertinggal kalau
  // layarnya berganti di tengah seretan.
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
}

export default { killAllMotion, killGsap, removeOrphanNodes };
