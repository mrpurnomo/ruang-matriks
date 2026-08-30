/**
 * interactions/dragDrop.js
 *
 * Dua cara memindahkan elemen, hidup berdampingan:
 *
 *   1. SERET (drag)      — pointer-based, nyaman dengan mouse/pen.
 *   2. KETUK-KETUK (tap) — ketuk sumber, lalu ketuk tujuan.
 *
 * Jalur kedua bukan sekadar aksesibilitas: di ponsel dan tablet, menyeret
 * elemen kecil sambil layar ikut menggulir itu melelahkan dan sering gagal.
 * Karena itu SETIAP elemen yang bisa diseret otomatis juga bisa diketuk, dan
 * keduanya memanggil callback `onDrop` yang PERSIS SAMA — sehingga animasi
 * Fly/Merge yang dipicu identik, apa pun cara yang dipakai siswa.
 */

import toast from '../ui/toast.js';

const DRAG_THRESHOLD = 5;      // px — cegah drag tak sengaja saat siswa hanya mengetuk
const CLICK_SUPPRESS_MS = 320; // abaikan click yang merupakan ekor dari sebuah drag

let activeDrag = null;
const zones = new Map();
let zoneSeq = 0;

/* ------------------------------------------------------------------
   State jalur ketuk-ketuk
   ------------------------------------------------------------------ */
let tapSource = null;          // { el, data }
let suppressClickUntil = 0;

function isTapArmed() {
  return tapSource !== null;
}

export function getTapSource() {
  return tapSource;
}

/** Batalkan pilihan ketuk yang sedang aktif. */
export function clearTapSelection() {
  if (!tapSource) return;
  delete tapSource.el.dataset.tapSelected;
  tapSource = null;
  document.body.classList.remove('is-tap-armed');
  highlightTapTargets(false);
}

function selectTapSource(el, data, options) {
  if (tapSource && tapSource.el === el) {
    clearTapSelection();
    return;
  }
  clearTapSelection();

  tapSource = { el, data, options };
  el.dataset.tapSelected = 'true';
  document.body.classList.add('is-tap-armed');
  highlightTapTargets(true);

  if (typeof options.onStart === 'function') options.onStart(data, el);

  // Petunjuk hanya sekali per sesi supaya tidak berisik.
  if (!selectTapSource._hinted) {
    selectTapSource._hinted = true;
    toast.info('Elemen terpilih. Sekarang **ketuk tujuannya** untuk memindahkannya.');
  }
}

/**
 * Tandai semua drop-zone yang menerima payload terpilih, supaya siswa tahu
 * ke mana ketukan kedua harus diarahkan.
 */
function highlightTapTargets(on) {
  zones.forEach((zone) => {
    if (!document.body.contains(zone.el)) return;
    if (!on) {
      delete zone.el.dataset.tapTarget;
      return;
    }
    const accepts = typeof zone.accepts === 'function'
      ? zone.accepts(tapSource ? tapSource.data : null)
      : true;
    if (accepts) zone.el.dataset.tapTarget = 'true';
  });
}

/** Jalankan drop lewat jalur ketuk — memanggil callback yang sama dengan drag. */
function completeTap(zone, point) {
  if (!tapSource) return;

  const { el, data, options } = tapSource;
  clearTapSelection();

  if (zone && typeof zone.onDrop === 'function') {
    zone.onDrop(data, el, point || centerOf(zone.el));
  }
  if (typeof options.onDrop === 'function') options.onDrop(data, zone ? zone.id : null, el);
}

function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/* ------------------------------------------------------------------
   Sumber yang bisa diseret / diketuk
   ------------------------------------------------------------------ */

/**
 * @param {HTMLElement} el
 * @param {object} options { data, onStart, onDrop, onCancel, ghostClass, reusable }
 */
export function makeDraggable(el, options = {}) {
  el.dataset.draggable = 'true';
  el.style.touchAction = 'none';
  if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
  el.setAttribute('role', el.getAttribute('role') || 'button');

  const onPointerDown = (event) => {
    if (event.button != null && event.button !== 0) return;
    if (el.dataset.dragDisabled === 'true') return;

    const start = { x: event.clientX, y: event.clientY };
    let started = false;

    const onMove = (moveEvent) => {
      const dx = moveEvent.clientX - start.x;
      const dy = moveEvent.clientY - start.y;

      if (!started) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        started = true;
        // Memulai seret membatalkan pilihan ketuk yang menggantung.
        clearTapSelection();
        beginDrag(el, options, moveEvent);
      }
      updateDrag(moveEvent);
    };

    const onUp = (upEvent) => {
      cleanup();
      if (started) {
        suppressClickUntil = Date.now() + CLICK_SUPPRESS_MS;
        endDrag(upEvent);
      }
    };

    const onCancelEvent = () => {
      cleanup();
      if (started) {
        suppressClickUntil = Date.now() + CLICK_SUPPRESS_MS;
        abortDrag();
      }
    };

    function cleanup() {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onCancelEvent);
    }

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onCancelEvent);
  };

  // --- jalur KETUK ---
  const onClick = (event) => {
    if (Date.now() < suppressClickUntil) return;   // ini ekor dari sebuah drag
    if (el.dataset.dragDisabled === 'true') return;
    event.stopPropagation();
    selectTapSource(el, options.data, options);
  };

  const onKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (el.dataset.dragDisabled === 'true') return;
    event.preventDefault();
    selectTapSource(el, options.data, options);
  };

  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('click', onClick);
  el.addEventListener('keydown', onKeyDown);

  el._dragCleanup = () => {
    el.removeEventListener('pointerdown', onPointerDown);
    el.removeEventListener('click', onClick);
    el.removeEventListener('keydown', onKeyDown);
  };

  return el;
}

/* ------------------------------------------------------------------
   Mesin seret
   ------------------------------------------------------------------ */
function beginDrag(el, options, event) {
  const rect = el.getBoundingClientRect();

  const ghost = el.cloneNode(true);
  ghost.classList.add('drag-ghost');
  if (options.ghostClass) ghost.classList.add(options.ghostClass);
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  ghost.style.left = `${event.clientX}px`;
  ghost.style.top = `${event.clientY}px`;
  ghost.removeAttribute('id');
  delete ghost.dataset.tapSelected;
  document.body.appendChild(ghost);

  el.dataset.dragging = 'true';
  document.body.style.cursor = 'grabbing';
  document.body.style.userSelect = 'none';

  activeDrag = { el, ghost, options, data: options.data, currentZone: null };

  if (typeof options.onStart === 'function') options.onStart(options.data, el);
}

function updateDrag(event) {
  if (!activeDrag) return;

  activeDrag.ghost.style.left = `${event.clientX}px`;
  activeDrag.ghost.style.top = `${event.clientY}px`;

  const zone = findZoneAt(event.clientX, event.clientY);

  if (zone !== activeDrag.currentZone) {
    if (activeDrag.currentZone) {
      delete activeDrag.currentZone.el.dataset.over;
      delete activeDrag.currentZone.el.dataset.invalid;
    }
    if (zone) {
      const accepts = typeof zone.accepts === 'function' ? zone.accepts(activeDrag.data) : true;
      zone.el.dataset[accepts ? 'over' : 'invalid'] = 'true';
    }
    activeDrag.currentZone = zone;
  }
}

function endDrag(event) {
  if (!activeDrag) return;

  const { el, ghost, options, currentZone, data } = activeDrag;
  const zone = currentZone || findZoneAt(event.clientX, event.clientY);

  cleanupGhost(ghost);
  delete el.dataset.dragging;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';

  if (zone) {
    delete zone.el.dataset.over;
    delete zone.el.dataset.invalid;
  }

  activeDrag = null;

  if (zone && typeof zone.onDrop === 'function') {
    zone.onDrop(data, el, { x: event.clientX, y: event.clientY });
  } else if (typeof options.onCancel === 'function') {
    options.onCancel(data, el);
  }

  if (typeof options.onDrop === 'function') options.onDrop(data, zone ? zone.id : null, el);
}

function abortDrag() {
  if (!activeDrag) return;
  const { el, ghost, currentZone, options, data } = activeDrag;
  cleanupGhost(ghost);
  delete el.dataset.dragging;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  if (currentZone) {
    delete currentZone.el.dataset.over;
    delete currentZone.el.dataset.invalid;
  }
  activeDrag = null;
  if (typeof options.onCancel === 'function') options.onCancel(data, el);
}

function cleanupGhost(ghost) {
  if (ghost && ghost.parentNode) ghost.remove();
}

function findZoneAt(x, y) {
  let found = null;
  let bestArea = Infinity;

  zones.forEach((zone) => {
    if (!document.body.contains(zone.el)) return;
    const rect = zone.el.getBoundingClientRect();
    const pad = zone.padding || 0;
    if (
      x >= rect.left - pad && x <= rect.right + pad &&
      y >= rect.top - pad && y <= rect.bottom + pad
    ) {
      const area = rect.width * rect.height;
      if (area < bestArea) {
        bestArea = area;
        found = zone;
      }
    }
  });

  return found;
}

/* ------------------------------------------------------------------
   Drop-zone (menerima seret DAN ketukan kedua)
   ------------------------------------------------------------------ */
export function registerDropZone(el, { onDrop, accepts, padding = 0, id } = {}) {
  const zoneId = id || `zone_${++zoneSeq}`;
  const zone = { id: zoneId, el, onDrop, accepts, padding };
  zones.set(zoneId, zone);
  el.dataset.dropzoneId = zoneId;

  const onClick = (event) => {
    if (Date.now() < suppressClickUntil) return;
    if (!isTapArmed()) return;
    event.stopPropagation();
    completeTap(zone, { x: event.clientX, y: event.clientY });
  };

  el.addEventListener('click', onClick);

  return () => {
    el.removeEventListener('click', onClick);
    delete el.dataset.tapTarget;
    zones.delete(zoneId);
  };
}

export function clearDropZones() {
  zones.clear();
  clearTapSelection();
}

export function isDragging() {
  return activeDrag !== null;
}

export function getDragData() {
  return activeDrag ? activeDrag.data : null;
}

/* ------------------------------------------------------------------
   Batalkan pilihan saat mengetuk ruang kosong / menekan Escape
   ------------------------------------------------------------------ */
if (typeof document !== 'undefined') {
  document.addEventListener('click', () => {
    if (Date.now() < suppressClickUntil) return;
    clearTapSelection();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') clearTapSelection();
  });
}

/**
 * Pasangan sumber–tujuan eksplisit (dipakai simulasi yang butuh kontrol
 * penuh atas pemilihan, mis. memilih sel hasil sebelum menyeret).
 */
export function enableClickToMove(sources, targets, onPair, { getSourceData, getTargetData } = {}) {
  let selected = null;
  const cleanups = [];

  const clearSelection = () => {
    if (selected) delete selected.el.dataset.tapSelected;
    selected = null;
  };

  sources.forEach((el) => {
    const handler = (event) => {
      if (isDragging() || Date.now() < suppressClickUntil) return;
      event.stopPropagation();

      if (selected && selected.el === el) {
        clearSelection();
        return;
      }
      clearSelection();
      selected = { el, data: getSourceData ? getSourceData(el) : el.dataset };
      el.dataset.tapSelected = 'true';
    };
    el.addEventListener('click', handler);
    cleanups.push(() => el.removeEventListener('click', handler));
  });

  targets.forEach((el) => {
    const handler = (event) => {
      if (!selected) return;
      event.stopPropagation();
      const targetData = getTargetData ? getTargetData(el) : el.dataset;
      const sourceEl = selected.el;
      const sourceData = selected.data;
      clearSelection();
      onPair(sourceData, targetData, sourceEl, el);
    };
    el.addEventListener('click', handler);
    cleanups.push(() => el.removeEventListener('click', handler));
  });

  return () => {
    clearSelection();
    cleanups.forEach((fn) => fn());
  };
}

export default {
  makeDraggable, registerDropZone, clearDropZones,
  enableClickToMove, isDragging, getDragData,
  clearTapSelection, getTapSource,
};
