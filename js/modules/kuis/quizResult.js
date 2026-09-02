/**
 * modules/kuis/quizResult.js
 * Layar hasil kuis: skor, rincian sub-topik yang lemah, dan jalur remedial
 * langsung kembali ke Mode Belajar.
 */

import { icon } from '../../ui/icons.js';
import { renderMixed } from '../../engine/katexRenderer.js';

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

const SUBTOPIC_LABELS = {
  pengertian_letak: 'Pengertian & Letak Baris/Kolom',
  ordo_matriks: 'Ordo Matriks',
  jenis_matriks: 'Jenis-Jenis Matriks',
  transpose: 'Transpose Matriks',
  kesamaan_matriks: 'Kesamaan Dua Matriks',
  penjumlahan_pengurangan: 'Penjumlahan & Pengurangan',
  perkalian_skalar: 'Perkalian Skalar',
  kombinasi_operasi: 'Kombinasi Operasi',
  perkalian_matriks: 'Perkalian Dua Matriks',
  sifat_operasi: 'Sifat-Sifat Operasi',
  determinan_2x2: 'Determinan 2×2',
  determinan_3x3: 'Determinan 3×3 (Sarrus)',
  singular_nonsingular: 'Matriks Singular',
  sifat_determinan: 'Sifat-Sifat Determinan',
  invers_2x2: 'Invers 2×2',
  invers_3x3: 'Invers 3×3 (Adjoin)',
  persamaan_matriks: 'Persamaan Matriks',
  translasi_data: 'Translasi Data & Aturan Domino',
  spldv_matriks: 'Model Invers SPLDV (Gaya UTBK)',
  ekstraksi_elemen: 'Ekstraksi Elemen Tersembunyi (Sniper)',
  analisis_multi_kondisi: 'Analisis Multi-Kondisi',
};

/** Cari bab pemilik sebuah sub-topik dari manifest. */
function findChapterOf(manifest, subtopicId) {
  return manifest.chapters.find((ch) => ch.subtopicOrder.includes(subtopicId));
}

function verdict(score) {
  if (score === 100) return { title: 'Sempurna!', text: 'Semua soal kamu jawab dengan benar.', icon: 'trophy', color: 'var(--success)' };
  if (score >= 70) return { title: 'Bagus!', text: 'Sedikit lagi menuju sempurna.', icon: 'check-circle', color: 'var(--brand-primary)' };
  if (score >= 40) return { title: 'Lumayan', text: 'Beberapa konsep masih perlu diperkuat.', icon: 'target', color: 'var(--accent-amber-dark)' };
  return { title: 'Ayo Ulangi', text: 'Tidak apa-apa — ulangi materinya, kamu pasti bisa.', icon: 'refresh', color: 'var(--accent-coral-dark)' };
}

/**
 * Render layar hasil.
 * @param {object} ctx { result, manifest, onRetry, onExit, onRemedial }
 */
export function renderQuizResult(host, ctx) {
  const { result, manifest } = ctx;
  const v = verdict(result.score);

  host.innerHTML = '';
  const wrap = el('div', 'quiz anim-rise');

  const card = el('div', 'card');
  card.style.textAlign = 'center';
  card.innerHTML = `
    <div style="display:grid;place-items:center;gap:var(--sp-3)">
      <span style="color:${v.color}">${icon(v.icon, { size: 48 })}</span>
      <h2>${v.title}</h2>
      <p class="text-muted">${v.text}</p>
      <div style="font-family:var(--font-mono);font-size:var(--fs-2xl);font-weight:800;color:${v.color}">
        ${result.score}<span style="font-size:var(--fs-md);color:var(--ink-500)">/100</span>
      </div>
      <div class="badge">${result.correct} benar dari ${result.totalQuestions} soal</div>
    </div>
  `;
  wrap.appendChild(card);

  // Rincian sub-topik yang masih lemah + jalur remedial
  if (result.weakSubtopics && result.weakSubtopics.length) {
    const panel = el('div', 'panel');
    panel.style.marginTop = 'var(--sp-4)';
    panel.appendChild(el('div', 'panel__label', 'Perlu diperkuat'));

    const list = el('div', 'subtopic-list');

    result.weakSubtopics.forEach((id) => {
      const chapter = findChapterOf(manifest, id);
      const btn = el('button', 'subtopic-item');
      btn.type = 'button';
      btn.innerHTML = `
        <span class="subtopic-item__state" style="background:var(--danger-soft);color:var(--danger)">
          ${icon('refresh', { size: 15 })}
        </span>
        <span class="subtopic-item__title">
          ${SUBTOPIC_LABELS[id] || id}
          ${chapter ? `<br><span class="text-sm text-muted">Bab ${chapter.number} · ${chapter.title}</span>` : ''}
        </span>
        ${icon('chevron-right', { size: 16 })}
      `;

      if (chapter && typeof ctx.onRemedial === 'function') {
        btn.addEventListener('click', () => ctx.onRemedial(chapter.id, id));
      } else {
        btn.disabled = true;
      }

      list.appendChild(btn);
    });

    panel.appendChild(list);
    panel.appendChild(el('p', 'quiz__hint',
      'Ketuk salah satu untuk kembali mempelajari materinya.'));
    wrap.appendChild(panel);
  }

  const actions = el('div', 'actionbar');

  const exit = el('button', 'btn btn--ghost');
  exit.type = 'button';
  exit.innerHTML = `${icon('home', { size: 17 })}<span>Menu Utama</span>`;
  exit.addEventListener('click', () => ctx.onExit());
  actions.appendChild(exit);

  actions.appendChild(el('div', 'actionbar__spacer'));

  const retry = el('button', 'btn btn--primary');
  retry.type = 'button';
  retry.innerHTML = `${icon('refresh', { size: 17 })}<span>Ulangi Kuis</span>`;
  retry.addEventListener('click', () => ctx.onRetry());
  actions.appendChild(retry);

  wrap.appendChild(actions);
  host.appendChild(wrap);
}

export { SUBTOPIC_LABELS };
export default renderQuizResult;
