/**
 * ui/icons.js
 * Ikon SVG inline (stroke 2px, gaya konsisten — bukan emoji).
 * Emoji dilarang sebagai ikon struktural karena bergantung font OS dan
 * tidak bisa dikendalikan lewat design token.
 */

const PATHS = {
  'book': '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  'pencil': '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  'puzzle': '<path d="M4 7h3a2 2 0 0 0 2-2V4a2 2 0 1 1 4 0v1a2 2 0 0 0 2 2h3a1 1 0 0 1 1 1v3a2 2 0 0 0 2 2h1a2 2 0 1 1 0 4h-1a2 2 0 0 0-2 2v3a1 1 0 0 1-1 1h-3.5"/><path d="M9 20H5a1 1 0 0 1-1-1v-4"/>',
  'grid': '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  'play': '<polygon points="6 3 20 12 6 21 6 3"/>',
  'pause': '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  'rotate': '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  'check': '<polyline points="20 6 9 17 4 12"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><polyline points="16 9.5 10.8 15 8 12.4"/>',
  'x': '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  'x-circle': '<circle cx="12" cy="12" r="9"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  'info': '<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  'alert-circle': '<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  'alert-triangle': '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  'lightbulb': '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.1 14c.6-1 1.4-1.7 2.1-2.7A6 6 0 1 0 6 8c0 1.6.7 2.8 1.8 4.1.7 1 1.5 1.7 2.1 2.7"/>',
  'target': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
  'lock': '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  'unlock': '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.5-2"/>',
  'arrow-left': '<line x1="20" y1="12" x2="4" y2="12"/><polyline points="10 18 4 12 10 6"/>',
  'arrow-right': '<line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/>',
  'arrow-down': '<line x1="12" y1="4" x2="12" y2="20"/><polyline points="6 14 12 20 18 14"/>',
  'home': '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/>',
  'flame': '<path d="M12 22c4 0 7-2.6 7-6.5 0-4.5-4-6-4-9.5-2 1-3 3-3 5-1-.6-1.5-1.6-1.5-3C8 10 5 12 5 15.5 5 19.4 8 22 12 22z"/>',
  'trophy': '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3"/><path d="M7 5H4v2a3 3 0 0 0 3 3"/>',
  'delete': '<path d="M20 5H9l-6 7 6 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>',
  'plus-minus': '<line x1="6" y1="7" x2="12" y2="7"/><line x1="9" y1="4" x2="9" y2="10"/><line x1="12" y1="17" x2="18" y2="17"/>',
  'sigma': '<path d="M18 5H6l6 7-6 7h12"/>',
  'save': '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
  'trash': '<polyline points="3 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  'clock': '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
  'refresh': '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><polyline points="21 3 21 9 15 9"/>',
  'zap': '<polygon points="13 2 4 14 11 14 10 22 20 10 13 10 13 2"/>',
  'search': '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/>',
  'layers': '<polygon points="12 2 2 8 12 14 22 8 12 2"/><polyline points="2 16 12 22 22 16"/><polyline points="2 12 12 18 22 12"/>',
  'chevron-right': '<polyline points="9 6 15 12 9 18"/>',
  'chevron-down': '<polyline points="6 9 12 15 18 9"/>',
  'circle': '<circle cx="12" cy="12" r="9"/>',
  'fold': '<path d="M4 4h10l6 6v10H4z"/><polyline points="14 4 14 10 20 10"/><line x1="4" y1="4" x2="20" y2="20"/>',
  'swap': '<polyline points="7 4 3 8 7 12"/><line x1="3" y1="8" x2="15" y2="8"/><polyline points="17 12 21 16 17 20"/><line x1="21" y1="16" x2="9" y2="16"/>',
  'sun': '<circle cx="12" cy="12" r="4.2"/><line x1="12" y1="2" x2="12" y2="4.4"/><line x1="12" y1="19.6" x2="12" y2="22"/><line x1="2" y1="12" x2="4.4" y2="12"/><line x1="19.6" y1="12" x2="22" y2="12"/><line x1="4.9" y1="4.9" x2="6.6" y2="6.6"/><line x1="17.4" y1="17.4" x2="19.1" y2="19.1"/><line x1="4.9" y1="19.1" x2="6.6" y2="17.4"/><line x1="17.4" y1="6.6" x2="19.1" y2="4.9"/>',
  'moon': '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',

  /* --- Papan Coret (Fase 15) --- */
  'eye': '<path d="M2.2 12S6 5.5 12 5.5 21.8 12 21.8 12 18 18.5 12 18.5 2.2 12 2.2 12z"/><circle cx="12" cy="12" r="3"/>',
  'eraser': '<path d="M4 20.5h16"/><path d="M15.4 3.6a2 2 0 0 1 2.9 0l2.1 2.1a2 2 0 0 1 0 2.9L11.6 17.4H6.9l-3-3a2 2 0 0 1 0-2.9z"/><line x1="9.2" y1="9.8" x2="14.6" y2="15.2"/>',
  'undo': '<polyline points="9 14 4 9 9 4"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  'redo': '<polyline points="15 14 20 9 15 4"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
  'minimize': '<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>',
};

/**
 * Hasilkan markup SVG untuk satu ikon.
 * @param {string} name  Kunci pada PATHS
 * @param {object} opts  { size, stroke, className }
 */
export function icon(name, opts = {}) {
  const body = PATHS[name];
  if (!body) {
    console.warn(`[icons] ikon "${name}" tidak ditemukan`);
    return '';
  }
  const size = opts.size || 24;
  const stroke = opts.stroke || 2;
  const cls = opts.className ? ` class="${opts.className}"` : '';
  return `<svg${cls} viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

export function hasIcon(name) {
  return Object.prototype.hasOwnProperty.call(PATHS, name);
}

export default icon;
