/**
 * ui/modal.js
 * Pengganti SATU-SATUNYA untuk confirm() dan prompt() (PRD §7.4).
 *
 * Selalu memakai label aksi yang deskriptif ("Ya, Timpa Slot Ini"), bukan
 * "OK"/"Cancel" generik, agar siswa tahu persis apa yang akan terjadi.
 * Fokus dijebak di dalam modal dan dikembalikan saat ditutup.
 */

import { renderMixed } from '../engine/katexRenderer.js';
import { icon } from './icons.js';

let openInstance = null;

const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Tampilkan modal kustom.
 * @returns {Promise<any>} nilai dari tombol yang ditekan, atau null jika dibatalkan.
 */
export function showModal({
  title,
  body = '',
  icon: iconName = 'info',
  variant = 'default',
  actions = [{ label: 'Mengerti', value: true, style: 'primary' }],
  dismissible = true,
} = {}) {
  // Hanya satu modal pada satu waktu — modal bertumpuk membingungkan.
  if (openInstance) closeModal(null);

  return new Promise((resolve) => {
    const prevFocus = document.activeElement;

    const scrim = document.createElement('div');
    scrim.className = 'modal-scrim';
    scrim.setAttribute('role', 'presentation');

    const modal = document.createElement('div');
    modal.className = `modal${variant !== 'default' ? ` modal--${variant}` : ''}`;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modal-title');

    modal.innerHTML = `
      <div class="modal__icon">${icon(iconName)}</div>
      <h2 class="modal__title" id="modal-title">${renderMixed(title || '')}</h2>
      <div class="modal__body">${typeof body === 'string' ? renderMixed(body) : ''}</div>
      <div class="modal__actions"></div>
    `;

    // Body bisa juga berupa elemen DOM (mis. pratinjau ringkas).
    if (body instanceof HTMLElement) {
      const holder = modal.querySelector('.modal__body');
      holder.innerHTML = '';
      holder.appendChild(body);
    }

    const actionHost = modal.querySelector('.modal__actions');
    actions.forEach((action) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn btn--${action.style || 'ghost'}`;
      btn.innerHTML = `${action.icon ? icon(action.icon) : ''}<span>${renderMixed(action.label)}</span>`;
      btn.addEventListener('click', () => finish(action.value));
      actionHost.appendChild(btn);
    });

    scrim.appendChild(modal);
    document.body.appendChild(scrim);

    // Paksa reflow agar transisi masuk benar-benar berjalan.
    void scrim.offsetHeight;
    scrim.dataset.open = 'true';

    const first = modal.querySelector(FOCUSABLE);
    if (first) first.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape' && dismissible) {
        event.preventDefault();
        finish(null);
        return;
      }
      if (event.key !== 'Tab') return;

      // Jebak fokus di dalam modal.
      const items = [...modal.querySelectorAll(FOCUSABLE)];
      if (!items.length) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    }

    function onScrimClick(event) {
      if (event.target === scrim && dismissible) finish(null);
    }

    document.addEventListener('keydown', onKeyDown);
    scrim.addEventListener('click', onScrimClick);

    function finish(value) {
      document.removeEventListener('keydown', onKeyDown);
      scrim.removeEventListener('click', onScrimClick);
      scrim.dataset.open = 'false';
      openInstance = null;

      setTimeout(() => {
        scrim.remove();
        if (prevFocus && document.body.contains(prevFocus)) prevFocus.focus();
      }, 220);

      resolve(value);
    }

    openInstance = { finish };
  });
}

export function closeModal(value = null) {
  if (openInstance) openInstance.finish(value);
}

/**
 * Konfirmasi ya/tidak. Label default sengaja tetap deskriptif; pemanggil
 * sangat dianjurkan mengirim label spesifik sesuai konteks.
 */
export function confirmAction({
  title,
  body,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'default',
  icon: iconName = 'alert-triangle',
} = {}) {
  return showModal({
    title,
    body,
    icon: iconName,
    variant,
    actions: [
      { label: cancelLabel, value: false, style: 'ghost' },
      { label: confirmLabel, value: true, style: variant === 'danger' ? 'coral' : 'primary' },
    ],
  }).then((v) => v === true);
}

/** Dialog informasi sederhana — pengganti alert() untuk pesan yang butuh perhatian penuh. */
export function alertDialog({ title, body, icon: iconName = 'info', variant = 'default' } = {}) {
  return showModal({
    title,
    body,
    icon: iconName,
    variant,
    actions: [{ label: 'Mengerti', value: true, style: 'primary' }],
  });
}

export default { showModal, closeModal, confirmAction, alertDialog };
