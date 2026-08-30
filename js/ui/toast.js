/**
 * ui/toast.js
 * Pengganti SATU-SATUNYA untuk alert(). Notifikasi non-blocking yang tidak
 * pernah mencuri fokus (aria-live="polite"), sesuai PRD §7.4.
 *
 * Toast error sengaja tampil lebih lama (5 detik) karena isinya kalimat
 * penjelas yang harus benar-benar dibaca, bukan sekadar dilirik.
 */

import { renderMixed } from '../engine/katexRenderer.js';
import { icon } from './icons.js';

const DURATIONS = { info: 3500, success: 3500, warn: 4500, error: 5000 };
const MAX_VISIBLE = 2;

let host = null;
const active = new Set();

/**
 * Toast kesalahan bersifat SINGLETON: hanya boleh ada satu pada satu waktu.
 * Kalau kesalahan baru muncul, yang lama langsung diganti — bukan ditumpuk,
 * supaya siswa selalu membaca satu pesan yang paling relevan.
 */
let activeError = null;

function ensureHost() {
  if (host && document.body.contains(host)) return host;
  host = document.createElement('div');
  host.className = 'toast-host';
  host.setAttribute('role', 'status');
  host.setAttribute('aria-live', 'polite');
  host.setAttribute('aria-atomic', 'false');
  document.body.appendChild(host);
  return host;
}

const ICON_FOR = {
  info: 'info',
  success: 'check-circle',
  warn: 'alert-triangle',
  error: 'alert-circle',
};

const TITLE_FOR = {
  info: null,
  success: 'Tepat!',
  warn: 'Perhatikan',
  error: 'Belum tepat',
};

/**
 * Tampilkan toast.
 * @param {string} message  Teks penjelas (mendukung $latex$ dan **tebal**).
 * @param {object} options  { type, title, duration }
 */
export function showToast(message, options = {}) {
  const type = options.type || 'info';
  const parent = ensureHost();

  // Satu error pada satu waktu: yang lama diganti seketika.
  if (type === 'error' && activeError) {
    dismiss(activeError, true);
    activeError = null;
  }

  // Batasi jumlah toast agar layar tidak tertutup tumpukan pesan.
  while (active.size >= MAX_VISIBLE) {
    const oldest = active.values().next().value;
    dismiss(oldest, true);
  }

  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const title = options.title !== undefined ? options.title : TITLE_FOR[type];

  el.innerHTML = `
    <span class="toast__icon">${icon(ICON_FOR[type] || 'info')}</span>
    <div class="toast__body">
      ${title ? `<div class="toast__title">${renderMixed(title)}</div>` : ''}
      <div>${renderMixed(message)}</div>
    </div>
  `;

  const duration = options.duration ?? DURATIONS[type] ?? 3500;
  const timer = setTimeout(() => dismiss(el), duration);

  el.addEventListener('click', () => {
    clearTimeout(timer);
    dismiss(el);
  });

  el._timer = timer;
  parent.appendChild(el);
  active.add(el);
  if (type === 'error') activeError = el;

  return el;
}

function dismiss(el, immediate = false) {
  if (!el || !active.has(el)) return;
  active.delete(el);
  if (activeError === el) activeError = null;
  clearTimeout(el._timer);

  if (immediate) {
    el.remove();
    return;
  }

  el.dataset.closing = 'true';
  el.addEventListener('animationend', () => el.remove(), { once: true });
  // Jaring pengaman kalau animasi tidak berjalan (mis. reduced-motion).
  setTimeout(() => el.remove(), 400);
}

/** Tutup seluruh toast — dipakai saat berpindah layar. */
export function clearToasts() {
  [...active].forEach((el) => dismiss(el, true));
}

export const toast = {
  info: (msg, opts) => showToast(msg, { ...opts, type: 'info' }),
  success: (msg, opts) => showToast(msg, { ...opts, type: 'success' }),
  warn: (msg, opts) => showToast(msg, { ...opts, type: 'warn' }),
  /**
   * Toast kesalahan. Ini jalur WAJIB setiap kali interaksi siswa ditolak —
   * indikator visual (merah/getar) tidak pernah boleh berdiri sendiri.
   */
  error: (msg, opts) => showToast(msg, { ...opts, type: 'error' }),
  clear: clearToasts,
};

export default toast;
