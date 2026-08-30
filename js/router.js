/**
 * router.js
 * Router berbasis hash — memungkinkan setiap layar punya URL sendiri
 * (deep-link) dan tombol Back browser tetap berperilaku wajar.
 *
 * Rute:
 *   #/                                  → Main Menu
 *   #/belajar                           → Daftar bab
 *   #/belajar/:chapterId                → Daftar sub-topik
 *   #/belajar/:chapterId/:subtopicId    → Satu sub-topik
 *   #/tka                               → Simulasi TKA (placeholder)
 *   #/kuis                              → Menu kuis
 *   #/kuis/:mode/:bankId?               → Sesi kuis
 */

const routes = [];
let notFoundHandler = null;
let currentPath = null;
let guard = null;

/** Daftarkan rute dengan pola bergaya "/belajar/:chapterId". */
export function route(pattern, handler) {
  const segments = pattern.split('/').filter(Boolean);
  routes.push({ pattern, segments, handler });
}

export function setNotFound(handler) {
  notFoundHandler = handler;
}

/**
 * Penjaga rute — dijalankan pada SETIAP perpindahan, bukan sekali saat boot.
 *
 * Versi sebelumnya hanya memeriksa identitas di `init()`, jadi begitu aplikasi
 * hidup, hash apa pun lolos: mengetik `#/` di bilah alamat atau menekan tombol
 * rumah di layar masuk langsung menembus ke menu tanpa mengisi nama.
 *
 * Handler mengembalikan string path untuk MENGALIHKAN, atau nilai palsu untuk
 * meloloskan.
 */
export function setGuard(handler) {
  guard = typeof handler === 'function' ? handler : null;
}

function parse(hash) {
  const clean = (hash || '').replace(/^#\/?/, '');
  return clean.split('/').filter(Boolean);
}

function match(segments) {
  for (const r of routes) {
    if (r.segments.length !== segments.length) continue;

    const params = {};
    let ok = true;

    for (let i = 0; i < r.segments.length; i++) {
      const part = r.segments[i];
      if (part.startsWith(':')) {
        params[part.slice(1)] = decodeURIComponent(segments[i]);
      } else if (part !== segments[i]) {
        ok = false;
        break;
      }
    }

    if (ok) return { handler: r.handler, params };
  }
  return null;
}

export function resolve() {
  const segments = parse(window.location.hash);
  const path = segments.join('/');

  // Penjaga berjalan SEBELUM pengecekan "hash yang sama", supaya rute yang
  // terlarang tidak pernah lolos hanya karena kebetulan sama dengan yang
  // sedang tampil.
  if (guard) {
    const redirect = guard(path, segments);
    if (redirect && redirect !== path) {
      // `replaceState` dipakai agar rute yang ditolak tidak menumpuk di
      // riwayat — tombol Back tidak boleh memantul bolak-balik ke sana.
      currentPath = null;
      const target = redirect.startsWith('#') ? redirect : `#/${redirect.replace(/^\/+/, '')}`;
      window.history.replaceState(null, '', target);
      resolve();
      return;
    }
  }

  // Hindari render ulang untuk hash yang sama.
  if (path === currentPath) return;
  const previous = currentPath;
  currentPath = path;

  const found = match(segments);

  if (found) {
    // Arah transisi: mundur jika path baru lebih pendek (naik hierarki).
    const isBack = previous != null && path.length < previous.length;
    found.handler(found.params, { isBack });
    return;
  }

  if (notFoundHandler) notFoundHandler(segments);
}

export function navigate(path, { replace = false } = {}) {
  const target = path.startsWith('#') ? path : `#/${path.replace(/^\/+/, '')}`;
  if (replace) {
    window.history.replaceState(null, '', target);
    resolve();
  } else {
    window.location.hash = target;
  }
}

export function back() {
  window.history.back();
}

export function start() {
  window.addEventListener('hashchange', resolve);
  if (!window.location.hash) {
    window.history.replaceState(null, '', '#/');
  }
  resolve();
}

export function getCurrentPath() {
  return currentPath;
}

export default { route, setNotFound, setGuard, navigate, back, start, resolve, getCurrentPath };
