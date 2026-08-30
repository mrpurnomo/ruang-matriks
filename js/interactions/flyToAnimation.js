/**
 * interactions/flyToAnimation.js
 * Animasi "Fly-to" — fase 2 dari urutan 4 fase di PRD §8.1.
 *
 * Elemen sumber TIDAK dipindahkan; yang terbang adalah klon visual, sehingga
 * konteks matriks asal tetap utuh di layar (prinsip Manim: penonton tidak
 * boleh kehilangan referensi asalnya).
 *
 * Lintasan sengaja MELENGKUNG (quadratic bezier), bukan garis lurus, meniru
 * gerak kamera Manim yang jarang linear.
 */

import { getSettings } from '../state/progressStore.js';

const hasGSAP = () => typeof window !== 'undefined' && typeof window.gsap !== 'undefined';

/**
 * Kecepatan animasi bersifat KONSTAN — tidak ada lagi pengatur 0.5×/1×/2×.
 * Setiap durasi sudah ditimbang agar pas secara pedagogis, dan pilihan
 * kecepatan hanya menambah beban keputusan tanpa manfaat belajar.
 * Satu-satunya penyimpangan: prefers-reduced-motion, yang memampatkan gerak
 * tanpa mengubah urutan langkahnya.
 */
export function speedFactor() {
  return prefersReducedMotion() ? 4 : 1;
}

export function prefersReducedMotion() {
  const s = getSettings();
  if (s.reducedMotion) return true;
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Durasi efektif setelah dibagi faktor kecepatan. */
function dur(base) {
  return base / speedFactor();
}

function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
}

/** Buat klon visual sebuah sel, diposisikan tepat menimpa aslinya. */
export function makeFlyChip(sourceEl, { text, variant } = {}) {
  const rect = sourceEl.getBoundingClientRect();
  const chip = document.createElement('div');
  chip.className = `fly-chip${variant ? ` fly-chip--${variant}` : ''}`;
  chip.textContent = text != null ? text : sourceEl.textContent.trim();
  chip.style.left = `${rect.left}px`;
  chip.style.top = `${rect.top}px`;
  chip.style.width = `${rect.width}px`;
  chip.style.height = `${rect.height}px`;
  document.body.appendChild(chip);
  return chip;
}

/**
 * FASE 1 — Highlight: tandai elemen sumber sebelum bergerak.
 */
export function highlight(elements, className = 'cell--pulse') {
  const list = Array.isArray(elements) ? elements : [elements];
  list.forEach((el) => el && el.classList.add(className));
  return () => list.forEach((el) => el && el.classList.remove(className));
}

/**
 * FASE 2 — Fly: terbangkan satu chip ke posisi tujuan lewat lintasan lengkung.
 * @returns {Promise<HTMLElement>} chip yang sudah sampai di tujuan
 */
export function flyTo(chip, targetEl, { arc = 0.35, duration = 600, ease = 'power2.inOut' } = {}) {
  return new Promise((resolve) => {
    const from = centerOf(chip);
    const to = centerOf(targetEl);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const time = dur(duration);

    if (!hasGSAP() || prefersReducedMotion()) {
      // Fallback: transisi CSS lurus (urutan pedagogis tetap sama).
      chip.style.transition = `transform ${time}ms cubic-bezier(.22,.8,.36,1)`;
      chip.style.transform = `translate(${dx}px, ${dy}px)`;
      setTimeout(() => resolve(chip), time);
      return;
    }

    // Titik kendali bezier ditarik tegak lurus lintasan agar melengkung.
    const midX = dx / 2 - dy * arc;
    const midY = dy / 2 + dx * arc;

    window.gsap.to(chip, {
      duration: time / 1000,
      ease,
      motionPath: window.MotionPathPlugin
        ? { path: [{ x: 0, y: 0 }, { x: midX, y: midY }, { x: dx, y: dy }], curviness: 1.4 }
        : undefined,
      x: window.MotionPathPlugin ? undefined : dx,
      y: window.MotionPathPlugin ? undefined : dy,
      onComplete: () => resolve(chip),
    });
  });
}

/**
 * FASE 3 — Merge: dua/lebih chip melebur menjadi satu hasil.
 * Operator muncul sekilas di antara keduanya sebelum melebur.
 */
export function merge(chips, resultText, { operator, duration = 400 } = {}) {
  return new Promise((resolve) => {
    const time = dur(duration);
    const anchor = chips[0];
    const center = centerOf(anchor);

    let opEl = null;
    if (operator && !prefersReducedMotion()) {
      opEl = document.createElement('div');
      opEl.className = 'fly-chip';
      opEl.style.cssText = `
        left:${center.x - 16}px; top:${center.y - 46}px;
        min-width:32px; min-height:32px; border-color:var(--accent-amber);
        color:var(--accent-amber-dark); background:var(--accent-amber-soft);
        font-size:1rem;
      `;
      opEl.textContent = operator;
      document.body.appendChild(opEl);
    }

    const finish = () => {
      chips.slice(1).forEach((c) => c.remove());
      if (opEl) opEl.remove();
      const result = chips[0];
      result.classList.add('fly-chip--result');
      result.textContent = resultText;
      result.classList.add('anim-land');
      setTimeout(() => resolve(result), dur(220));
    };

    if (!hasGSAP() || prefersReducedMotion()) {
      chips.forEach((c) => c.classList.add('anim-merge'));
      setTimeout(finish, time);
      return;
    }

    const tl = window.gsap.timeline({ onComplete: finish });

    // Semua chip meluncur ke titik yang sama sambil mengecil.
    chips.forEach((chip, i) => {
      if (i === 0) return;
      const c = centerOf(chip);
      tl.to(chip, {
        duration: time / 1000,
        x: `+=${center.x - c.x}`,
        y: `+=${center.y - c.y}`,
        scale: 0.72,
        opacity: 0.35,
        ease: 'power2.in',
      }, 0);
    });

    tl.to(chips[0], { duration: time / 1000, scale: 0.86, ease: 'power2.in' }, 0);
    if (opEl) tl.to(opEl, { duration: time / 1000, opacity: 0, y: 10, ease: 'power1.in' }, 0);
    tl.to(chips[0], { duration: dur(200) / 1000, scale: 1, ease: 'back.out(2)' });
  });
}

/**
 * FASE 4 — Land: chip hasil mendarat di sel tujuan dengan pantulan halus,
 * lalu nilainya "diserahkan" ke sel asli dan chip dibuang.
 */
export function landOn(chip, targetEl, { text, duration = 400 } = {}) {
  return new Promise((resolve) => {
    const time = dur(duration);
    const from = centerOf(chip);
    const to = centerOf(targetEl);
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    const finish = () => {
      if (text != null) targetEl.textContent = text;
      targetEl.classList.add('anim-land');
      chip.remove();
      setTimeout(() => targetEl.classList.remove('anim-land'), 500);
      resolve(targetEl);
    };

    if (!hasGSAP() || prefersReducedMotion()) {
      chip.style.transition = `transform ${time}ms cubic-bezier(.34,1.56,.64,1), opacity ${time}ms linear`;
      const current = chip.style.transform || '';
      chip.style.transform = `${current} translate(${dx}px, ${dy}px)`;
      setTimeout(finish, time);
      return;
    }

    window.gsap.to(chip, {
      duration: time / 1000,
      x: `+=${dx}`,
      y: `+=${dy}`,
      ease: 'back.out(1.7)',
      onComplete: finish,
    });
  });
}

/**
 * Urutan lengkap 4 fase untuk satu pasang elemen.
 * Ini fungsi yang dipakai mayoritas simulasi.
 *
 * @param {HTMLElement[]} sourceEls  sel-sel sumber
 * @param {HTMLElement} meetEl       titik temu
 * @param {HTMLElement} targetEl     sel tujuan (boleh null bila hasil menetap di titik temu)
 * @param {object} opts { operator, resultText, keepChip }
 */
export async function flyMergeLand(sourceEls, meetEl, targetEl, opts = {}) {
  const chips = sourceEls.map((el) => makeFlyChip(el, { text: el.dataset.value ?? el.textContent.trim() }));

  // Fase 1 sudah dilakukan pemanggil (highlight), lanjut ke fase 2.
  await Promise.all(chips.map((chip) => flyTo(chip, meetEl, { arc: opts.arc })));

  // Fase 3
  const result = await merge(chips, opts.resultText, { operator: opts.operator });

  // Fase 4 (opsional — determinan berhenti di kartu hasil, bukan sel matriks)
  if (targetEl) {
    await landOn(result, targetEl, { text: opts.resultText });
    return targetEl;
  }

  if (!opts.keepChip) {
    setTimeout(() => result.remove(), 400);
  }
  return result;
}

/**
 * Animasi berantai (staggered) untuk perkalian skalar — setiap sel berubah
 * satu per satu dengan jeda 80ms, bukan serentak, agar terlihat bahwa SETIAP
 * elemen kena kali.
 */
export function staggerCells(cells, valuesText, { delay = 80 } = {}) {
  return new Promise((resolve) => {
    const step = dur(delay);
    cells.forEach((cell, index) => {
      setTimeout(() => {
        cell.textContent = valuesText[index];
        cell.classList.add('anim-flash-success');
        setTimeout(() => cell.classList.remove('anim-flash-success'), 620);
        if (index === cells.length - 1) setTimeout(resolve, dur(300));
      }, step * index);
    });
    if (!cells.length) resolve();
  });
}

/* ============================================================
   Isyarat gerak (affordance cue)
   ============================================================ */
let cueHandle = null;

/**
 * Peragakan lintasan "dari sini → ke sana" dengan garis putus-putus
 * beranimasi plus kursor hantu yang meluncur mengikutinya.
 *
 * Tanpa ini, mekanik "seret ke sel target" nyaris tak punya afordans:
 * siswa melihat sel menyala tapi tidak tahu bahwa ia harus MEMBAWA sesuatu
 * ke sana. Isyarat ini berulang sampai siswa benar-benar melakukannya.
 *
 * @param {HTMLElement[]} sources  elemen asal (mis. sel baris & kolom)
 * @param {HTMLElement} target     sel tujuan
 */
export function showDragCue(sources, target) {
  hideDragCue();
  if (prefersReducedMotion()) return null;
  if (!sources.length || !target) return null;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'cue-layer');

  const hand = document.createElement('div');
  hand.className = 'cue-hand';
  hand.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M6 11V5.5a1.5 1.5 0 0 1 3 0V11"/>' +
    '<path d="M9 11V4a1.5 1.5 0 0 1 3 0v7"/><path d="M12 11V5.5a1.5 1.5 0 0 1 3 0V11"/>' +
    '<path d="M15 11V7.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6v-2.5a1.5 1.5 0 0 1 3 0"/></svg>';

  document.body.append(svg, hand);

  const center = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  const to = center(target);
  const paths = [];

  sources.forEach((src) => {
    if (!src) return;
    const from = center(src);
    // Lengkung sedikit agar terbaca sebagai gerakan, bukan garis statis.
    const midX = (from.x + to.x) / 2 - (to.y - from.y) * 0.18;
    const midY = (from.y + to.y) / 2 + (to.x - from.x) * 0.18;

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('class', 'cue-path');
    path.setAttribute('d', `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`);
    svg.appendChild(path);
    paths.push({ node: path, from, mid: { x: midX, y: midY }, to });
  });

  let stopped = false;
  let timer = null;

  // Kursor hantu meluncur di sepanjang salah satu lintasan, bergantian.
  const runOnce = (index) => {
    if (stopped || !paths.length) return;
    const p = paths[index % paths.length];
    const duration = 1100;
    const start = performance.now();

    const step = (now) => {
      if (stopped) return;
      const t = Math.min(1, (now - start) / duration);
      // Bezier kuadratik
      const inv = 1 - t;
      const x = inv * inv * p.from.x + 2 * inv * t * p.mid.x + t * t * p.to.x;
      const y = inv * inv * p.from.y + 2 * inv * t * p.mid.y + t * t * p.to.y;
      hand.style.left = `${x}px`;
      hand.style.top = `${y}px`;
      hand.style.opacity = String(t < 0.12 ? t / 0.12 : t > 0.86 ? (1 - t) / 0.14 : 1);
      if (t < 1) requestAnimationFrame(step);
      else timer = setTimeout(() => runOnce(index + 1), 320);
    };

    requestAnimationFrame(step);
  };

  runOnce(0);

  cueHandle = {
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
      svg.remove();
      hand.remove();
    },
  };

  return cueHandle;
}

export function hideDragCue() {
  if (cueHandle) {
    cueHandle.stop();
    cueHandle = null;
  }
  document.querySelectorAll('.cue-layer, .cue-hand').forEach((n) => n.remove());
}

/** Getaran penolakan — SELALU dipasangkan dengan Toast penjelas (PRD §8.4). */
export function rejectShake(el) {
  if (!el) return;
  el.classList.remove('shake');
  void el.offsetWidth; // paksa reflow agar animasi bisa diulang
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 420);
}

/**
 * Confetti saat sub-topik lulus.
 *
 * Dirancang ulang agar rapi, bukan kacau:
 *  - kepingan disebar pada KOLOM yang merata (bukan posisi acak penuh),
 *    sehingga tidak menggerombol di satu sisi;
 *  - jatuh vertikal ditangani pembungkus, goyang+putar ditangani anaknya,
 *    jadi kedua sumbu tidak saling bertabrakan;
 *  - hanya transform & opacity yang dianimasikan (composite di GPU);
 *  - satu instance saja pada satu waktu.
 */
const CONFETTI_COLORS = ['#4D8DFF', '#FF7A66', '#FFC24D', '#3DD68C', '#7BABFF'];
let confettiHost = null;

export function celebrate({ pieces = 40, duration = 2800 } = {}) {
  if (prefersReducedMotion()) return;

  // Cegah tumpukan confetti kalau dipanggil beruntun.
  if (confettiHost) {
    confettiHost.remove();
    confettiHost = null;
  }

  const host = document.createElement('div');
  host.className = 'confetti-host';
  host.setAttribute('aria-hidden', 'true');
  confettiHost = host;

  const frag = document.createDocumentFragment();
  const columnWidth = 100 / pieces;

  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';

    // Sebar merata per kolom, lalu geser sedikit secara acak di dalam kolomnya.
    const left = i * columnWidth + Math.random() * columnWidth;
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const wide = i % 4 === 0;

    piece.style.left = `${left}%`;
    piece.style.setProperty('--cf-fall', `${1900 + Math.random() * 900}ms`);
    piece.style.setProperty('--cf-delay', `${Math.round(Math.random() * 700)}ms`);

    const bit = document.createElement('i');
    bit.style.setProperty('--cf-color', color);
    bit.style.setProperty('--cf-w', wide ? '10px' : '7px');
    bit.style.setProperty('--cf-h', wide ? '7px' : '12px');
    bit.style.setProperty('--cf-r', wide ? '2px' : '1.5px');
    bit.style.setProperty('--cf-sway', `${900 + Math.random() * 700}ms`);
    bit.style.setProperty('--cf-delay', `${Math.round(Math.random() * 400)}ms`);

    piece.appendChild(bit);
    frag.appendChild(piece);
  }

  host.appendChild(frag);
  document.body.appendChild(host);

  setTimeout(() => {
    host.remove();
    if (confettiHost === host) confettiHost = null;
  }, duration + 900);
}

export default { flyTo, merge, landOn, flyMergeLand, staggerCells, highlight, rejectShake, celebrate, makeFlyChip };
