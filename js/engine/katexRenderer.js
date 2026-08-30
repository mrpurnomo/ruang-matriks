/**
 * engine/katexRenderer.js
 * Pembungkus tipis di atas KaTeX. Semua render matematika lewat sini agar
 * penanganan error dan opsi render seragam di seluruh aplikasi.
 */

const hasKatex = () => typeof window !== 'undefined' && typeof window.katex !== 'undefined';

/** Render satu ekspresi LaTeX menjadi string HTML. */
export function renderToString(tex, { display = false } = {}) {
  if (!hasKatex()) return escapeHtml(tex);
  try {
    return window.katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      strict: false,
      trust: false,
    });
  } catch (err) {
    console.warn('[katex] gagal merender:', tex, err);
    return escapeHtml(tex);
  }
}

/** Render langsung ke sebuah elemen DOM. */
export function renderInto(el, tex, options) {
  if (!el) return;
  el.innerHTML = renderToString(tex, options);
}

/**
 * Ubah teks campuran menjadi HTML: mendukung $inline$, **tebal**, dan <sub>.
 * Ini format yang dipakai seluruh materi & pesan Toast di data JSON.
 */
export function renderMixed(text) {
  if (typeof text !== 'string') return '';

  // Sisipkan LaTeX ke placeholder DULU, baru terapkan markdown ke seluruh
  // string. Kalau dibalik (split lalu markdown per-segmen), penanda **tebal**
  // yang mengapit sebuah rumus akan terpisah ke dua segmen berbeda dan
  // regex-nya tidak pernah cocok.
  const slots = [];

  const masked = text.replace(/\$([^$]+)\$/g, (_, tex) => {
    slots.push(renderToString(tex, { display: false }));
    // Token sengaja tanpa karakter khusus HTML/markdown agar lolos escaping.
    return `@@KTX${slots.length - 1}@@`;
  });

  const rendered = applyLightMarkdown(masked);

  return rendered.replace(/@@KTX(\d+)@@/g, (_, index) => slots[Number(index)] ?? '');
}

/** Render blok rumus (display mode) menjadi HTML. */
export function renderBlock(tex) {
  return `<div class="katex-block">${renderToString(tex, { display: true })}</div>`;
}

/**
 * Markdown ringan: **tebal** dan *miring*.
 * Teks di-escape lebih dulu, kecuali tag <sub>/<sup> yang memang kita pakai
 * untuk notasi indeks pada pesan Toast.
 */
function applyLightMarkdown(text) {
  let out = escapeHtml(text);
  out = out.replace(/&lt;(\/?)(sub|sup)&gt;/g, '<$1$2>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  return out;
}

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render ulang seluruh elemen ber-atribut data-tex di dalam sebuah root.
 * Berguna setelah komponen menyuntikkan HTML baru.
 */
export function hydrate(root = document) {
  root.querySelectorAll('[data-tex]').forEach((el) => {
    if (el.dataset.texRendered === 'true') return;
    const display = el.dataset.texDisplay === 'true';
    renderInto(el, el.dataset.tex, { display });
    el.dataset.texRendered = 'true';
  });

  root.querySelectorAll('[data-mixed]').forEach((el) => {
    if (el.dataset.mixedRendered === 'true') return;
    el.innerHTML = renderMixed(el.dataset.mixed);
    el.dataset.mixedRendered = 'true';
  });
}
