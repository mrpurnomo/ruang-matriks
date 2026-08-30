/**
 * interactions/mergeAnimation.js
 * Animasi khusus yang bukan sekadar "fly + merge" generik:
 * swap silang (invers), flip tanda, lipat transpose, dan salin kolom Sarrus.
 */

import { speedFactor, prefersReducedMotion } from './flyToAnimation.js';

const hasGSAP = () => typeof window !== 'undefined' && typeof window.gsap !== 'undefined';

function dur(base) {
  return base / speedFactor();
}

function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/**
 * Swap silang: dua elemen bertukar posisi lewat dua lintasan lengkung
 * yang saling menyilang (seperti dua pesawat saling menyalip).
 * Dipakai pada tahap 1 invers 2×2.
 */
export function swapArc(elA, elB, { duration = 620 } = {}) {
  return new Promise((resolve) => {
    const time = dur(duration);
    const a = centerOf(elA);
    const b = centerOf(elB);

    const finish = () => {
      // Tukar isi teks, lalu kembalikan transform agar DOM tetap rapi.
      const tmp = elA.textContent;
      elA.textContent = elB.textContent;
      elB.textContent = tmp;
      const tmpVal = elA.dataset.value;
      elA.dataset.value = elB.dataset.value ?? '';
      elB.dataset.value = tmpVal ?? '';

      [elA, elB].forEach((el) => {
        el.style.transform = '';
        el.style.transition = '';
        el.style.zIndex = '';
        el.classList.add('anim-flash-success');
        setTimeout(() => el.classList.remove('anim-flash-success'), 620);
      });
      resolve();
    };

    if (!hasGSAP() || prefersReducedMotion()) {
      elA.style.transition = `transform ${time}ms cubic-bezier(.22,.8,.36,1)`;
      elB.style.transition = elA.style.transition;
      elA.style.transform = `translate(${b.x - a.x}px, ${b.y - a.y}px)`;
      elB.style.transform = `translate(${a.x - b.x}px, ${a.y - b.y}px)`;
      setTimeout(finish, time);
      return;
    }

    elA.style.zIndex = '5';
    elB.style.zIndex = '5';

    const tl = window.gsap.timeline({ onComplete: finish });

    // Lengkungan berlawanan arah (satu ke atas, satu ke bawah) agar terlihat menyilang.
    tl.to(elA, {
      duration: time / 1000,
      ease: 'power2.inOut',
      motionPath: window.MotionPathPlugin
        ? { path: [{ x: 0, y: 0 }, { x: (b.x - a.x) / 2, y: -42 }, { x: b.x - a.x, y: b.y - a.y }], curviness: 1.5 }
        : undefined,
      x: window.MotionPathPlugin ? undefined : b.x - a.x,
      y: window.MotionPathPlugin ? undefined : b.y - a.y,
    }, 0);

    tl.to(elB, {
      duration: time / 1000,
      ease: 'power2.inOut',
      motionPath: window.MotionPathPlugin
        ? { path: [{ x: 0, y: 0 }, { x: (a.x - b.x) / 2, y: 42 }, { x: a.x - b.x, y: a.y - b.y }], curviness: 1.5 }
        : undefined,
      x: window.MotionPathPlugin ? undefined : a.x - b.x,
      y: window.MotionPathPlugin ? undefined : a.y - b.y,
    }, 0);
  });
}

/**
 * Gerbang tanda ⊖: chip berputar 180° di sumbu Y (efek flip kartu),
 * lalu muncul kembali dengan tanda terbalik.
 */
export function flipSign(el, newValue, { duration = 520 } = {}) {
  return new Promise((resolve) => {
    const time = dur(duration);

    const applyValue = () => {
      el.textContent = String(newValue);
      el.dataset.value = String(newValue);
    };

    if (!hasGSAP() || prefersReducedMotion()) {
      el.classList.add('anim-flip');
      setTimeout(applyValue, time / 2);
      setTimeout(() => {
        el.classList.remove('anim-flip');
        resolve();
      }, time);
      return;
    }

    const tl = window.gsap.timeline({ onComplete: resolve });
    tl.to(el, { duration: time / 2000, rotationY: 90, ease: 'power2.in' })
      .call(applyValue)
      .to(el, { duration: time / 2000, rotationY: 0, ease: 'power2.out' })
      .call(() => {
        el.classList.add('anim-flash-success');
        setTimeout(() => el.classList.remove('anim-flash-success'), 620);
      });
  });
}

/**
 * MORPH baris → kolom untuk transpose.
 *
 * Metafora "melipat" sengaja DITINGGALKAN: melipat mengesankan matriks
 * dibalik/dicerminkan, yang memicu miskonsepsi. Yang benar-benar terjadi
 * adalah setiap BARIS berdiri menjadi KOLOM — jadi klon tiap elemen
 * diterbangkan langsung ke slotnya di posisi kolom, satu per satu.
 */
export function morphRowToColumn(fromCells, toCells, values, { stagger = 110 } = {}) {
  return new Promise((resolve) => {
    const flight = dur(520);
    let landed = 0;
    let settled = false;

    // Jaring pengaman: kalau requestAnimationFrame berhenti (tab disembunyikan,
    // browser menahan frame), tween GSAP tidak pernah selesai dan simulasi bisa
    // terkunci selamanya. Watchdog memastikan hasil akhirnya tetap diterapkan.
    const watchdog = setTimeout(() => {
      if (settled) return;
      toCells.forEach((cell, i) => {
        if (!cell) return;
        cell.textContent = values[i];
        cell.dataset.value = values[i];
      });
      document.querySelectorAll('.fly-chip').forEach((n) => n.remove());
      settle();
    }, flight + dur(stagger) * fromCells.length + 900);

    function settle() {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      resolve();
    }

    fromCells.forEach((source, index) => {
      const target = toCells[index];
      if (!target) { landed += 1; return; }

      setTimeout(() => {
        const a = source.getBoundingClientRect();
        const b = target.getBoundingClientRect();

        const chip = document.createElement('div');
        chip.className = 'fly-chip';
        chip.textContent = values[index];
        chip.style.left = `${a.left}px`;
        chip.style.top = `${a.top}px`;
        chip.style.width = `${a.width}px`;
        chip.style.height = `${a.height}px`;
        document.body.appendChild(chip);

        const dx = b.left - a.left;
        const dy = b.top - a.top;

        const finish = () => {
          target.textContent = values[index];
          target.dataset.value = values[index];
          target.classList.add('anim-land');
          chip.remove();
          landed += 1;
          if (landed >= fromCells.length) setTimeout(settle, dur(220));
        };

        if (!hasGSAP() || prefersReducedMotion()) {
          chip.style.transition = `transform ${flight}ms cubic-bezier(.22,.8,.36,1)`;
          chip.style.transform = `translate(${dx}px, ${dy}px)`;
          setTimeout(finish, flight);
          return;
        }

        // Putaran 90° saat terbang = "baris berdiri menjadi kolom".
        window.gsap.fromTo(chip,
          { rotate: 0, scale: 1 },
          {
            duration: flight / 1000,
            x: dx,
            y: dy,
            rotate: 90,
            scale: 1.05,
            ease: 'power2.inOut',
            onComplete: () => {
              window.gsap.to(chip, {
                duration: dur(140) / 1000,
                rotate: 0,
                scale: 1,
                ease: 'back.out(2)',
                onComplete: finish,
              });
            },
          });
      }, dur(stagger) * index);
    });

    if (!fromCells.length) settle();
  });
}

/**
 * Lipat transpose: elemen di luar diagonal utama meluncur ke posisi cerminnya
 * secara SIMULTAN. Dipertahankan untuk alur Adjoin (di sana yang ditranspose
 * adalah matriks kofaktor utuh, bukan pengajaran konsep transpose itu sendiri).
 */
export function foldTranspose(cellMap, sourceMatrix, { duration = 700 } = {}) {
  return new Promise((resolve) => {
    const time = dur(duration);
    const rows = sourceMatrix.length;
    const cols = sourceMatrix[0].length;
    const moves = [];

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const from = cellMap.get(`${i},${j}`);
        const to = cellMap.get(`${j},${i}`);
        if (!from) continue;

        if (i === j) {
          // Diagonal utama: tidak berpindah, hanya diberi penegasan visual.
          from.classList.add('anim-flash-success');
          setTimeout(() => from.classList.remove('anim-flash-success'), 620);
          continue;
        }
        if (to) moves.push({ from, to });
      }
    }

    if (!moves.length) {
      setTimeout(resolve, time);
      return;
    }

    let done = 0;
    const tick = () => {
      done += 1;
      if (done >= moves.length) setTimeout(resolve, dur(160));
    };

    moves.forEach(({ from, to }) => {
      const a = centerOf(from);
      const b = centerOf(to);
      const dx = b.x - a.x;
      const dy = b.y - a.y;

      if (!hasGSAP() || prefersReducedMotion()) {
        from.style.transition = `transform ${time}ms cubic-bezier(.22,.8,.36,1)`;
        from.style.transform = `translate(${dx}px, ${dy}px)`;
        setTimeout(tick, time);
        return;
      }

      window.gsap.to(from, {
        duration: time / 1000,
        x: dx,
        y: dy,
        ease: 'power2.inOut',
        onComplete: tick,
      });
    });
  });
}

/**
 * Salin dua kolom pertama ke kanan (persiapan Metode Sarrus).
 * Klon meluncur masuk dari posisi aslinya agar hubungan asal-tujuan terlihat.
 */
export function slideCloneColumns(sourceCells, ghostCells, { duration = 560 } = {}) {
  return new Promise((resolve) => {
    const time = dur(duration);

    ghostCells.forEach((ghost, index) => {
      const source = sourceCells[index];
      if (!source) return;

      const a = centerOf(source);
      const b = centerOf(ghost);

      ghost.style.opacity = '0';

      if (!hasGSAP() || prefersReducedMotion()) {
        ghost.style.transition = `opacity ${time}ms linear`;
        ghost.style.opacity = '0.55';
        return;
      }

      window.gsap.fromTo(
        ghost,
        { x: a.x - b.x, y: a.y - b.y, opacity: 0, scale: 0.9 },
        {
          duration: time / 1000,
          x: 0,
          y: 0,
          opacity: 0.55,
          scale: 1,
          ease: 'power2.out',
          delay: (index * 40) / 1000 / speedFactor(),
        }
      );
    });

    setTimeout(resolve, time + dur(ghostCells.length * 40));
  });
}

/**
 * Sapuan skalar: efek "gelombang" menyapu dari kiri-atas ke kanan-bawah.
 * Jeda antar sel disengaja agar terlihat setiap elemen kena kali satu per satu.
 */
export function sweepScalar(cells, newValues, { delay = 80 } = {}) {
  return new Promise((resolve) => {
    const step = dur(delay);

    cells.forEach((cell, index) => {
      setTimeout(() => {
        if (hasGSAP() && !prefersReducedMotion()) {
          window.gsap.timeline()
            .to(cell, { duration: dur(120) / 1000, scale: 1.18, ease: 'power2.out' })
            .call(() => {
              cell.textContent = newValues[index];
              cell.dataset.value = newValues[index];
            })
            .to(cell, { duration: dur(180) / 1000, scale: 1, ease: 'back.out(2)' });
        } else {
          cell.textContent = newValues[index];
          cell.dataset.value = newValues[index];
        }

        cell.classList.add('anim-flash-success');
        setTimeout(() => cell.classList.remove('anim-flash-success'), 620);

        if (index === cells.length - 1) setTimeout(resolve, dur(360));
      }, step * index);
    });

    if (!cells.length) resolve();
  });
}

/**
 * Peleburan A⁻¹A → I lalu lenyap (simulasi persamaan matriks).
 */
export function mergeToIdentity(blockA, blockInv, { duration = 620 } = {}) {
  return new Promise((resolve) => {
    const time = dur(duration);

    blockA.dataset.merging = 'true';
    blockInv.dataset.merging = 'true';

    setTimeout(() => {
      blockA.textContent = 'I';
      blockInv.dataset.vanish = 'true';

      setTimeout(() => {
        blockInv.remove();
        blockA.dataset.vanish = 'true';
        setTimeout(() => {
          blockA.remove();
          resolve();
        }, dur(320));
      }, dur(320));
    }, time / 2);
  });
}

/* ============================================================
   Garis seret diagonal (Sarrus & determinan 2×2)
   ============================================================ */

/**
 * Pengendali "gambar garis" di atas sekumpulan sel.
 *
 * Siswa menekan, menahan, lalu menyapu melewati beberapa sel — persis seperti
 * menarik garis diagonal di buku. Garis SVG mengikuti jari/kursor secara
 * real-time, dan sel yang tersentuh dicatat berurutan.
 *
 * Semua elemen garis dibuat di dalam satu <svg> yang dibuang tuntas saat
 * selesai, sehingga tidak ada elemen hantu yang tertinggal setelah reset.
 */
export function createDiagonalTracer(container, { onComplete, hitTest } = {}) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'diag-trace');
  svg.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:30';

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  line.setAttribute('class', 'diag-trace__line');
  line.setAttribute('fill', 'none');
  svg.appendChild(line);

  let active = false;
  let visited = [];
  let points = [];
  let tone = 'blue';

  const setTone = (t) => {
    tone = t;
    line.setAttribute('stroke', t === 'coral' ? 'var(--accent-coral)' : 'var(--brand-primary)');
  };
  setTone('blue');

  function pointAt(x, y) {
    points.push(`${x},${y}`);
    line.setAttribute('points', points.join(' '));
  }

  function centerOfEl(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function onDown(event) {
    if (event.button != null && event.button !== 0) return;
    const cell = typeof hitTest === 'function' ? hitTest(event.target) : null;
    if (!cell) return;

    event.preventDefault();
    active = true;
    visited = [cell];
    points = [];

    document.body.appendChild(svg);
    const c = centerOfEl(cell);
    pointAt(c.x, c.y);
    pointAt(event.clientX, event.clientY);
    cell.classList.add('cell--tracing');

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  }

  function onMove(event) {
    if (!active) return;

    // Titik terakhir selalu mengikuti kursor.
    points[points.length - 1] = `${event.clientX},${event.clientY}`;
    line.setAttribute('points', points.join(' '));

    const under = document.elementFromPoint(event.clientX, event.clientY);
    const cell = typeof hitTest === 'function' ? hitTest(under) : null;
    if (!cell || visited.includes(cell)) return;

    visited.push(cell);
    cell.classList.add('cell--tracing');

    const c = centerOfEl(cell);
    points[points.length - 1] = `${c.x},${c.y}`;
    pointAt(event.clientX, event.clientY);
  }

  function onUp() {
    if (!active) return;
    active = false;

    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onUp);

    const result = visited.slice();
    cleanupVisual();

    if (typeof onComplete === 'function') onComplete(result);
  }

  function cleanupVisual() {
    visited.forEach((c) => c.classList.remove('cell--tracing'));
    if (svg.parentNode) svg.remove();
    points = [];
    line.setAttribute('points', '');
  }

  container.addEventListener('pointerdown', onDown);

  return {
    setTone,
    /** Pembersihan total — tidak menyisakan SVG maupun kelas pada sel. */
    destroy() {
      container.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      cleanupVisual();
      document.querySelectorAll('.diag-trace').forEach((n) => n.remove());
      document.querySelectorAll('.cell--tracing').forEach((n) => n.classList.remove('cell--tracing'));
    },
  };
}

export default {
  swapArc, flipSign, foldTranspose, morphRowToColumn,
  slideCloneColumns, sweepScalar, mergeToIdentity, createDiagonalTracer,
};
