/**
 * ui/mathpad.js
 * Numpad on-screen kustom — satu-satunya jalur input angka di aplikasi ini.
 *
 * Kenapa ini wajib (PRD §7.4): keyboard bawaan OS akan mendorong/merusak
 * tata letak 100vh yang sudah dirancang presisi, dan gayanya keluar dari tema.
 * Karena itu setiap field angka diberi readonly + inputmode="none" sehingga
 * keyboard native TIDAK PERNAH muncul, lalu Mathpad ini yang mengisinya.
 */

import { icon } from './icons.js';

let padEl = null;
let scrimEl = null;
let session = null;

const KEYS = [
  { label: '7', value: '7' },
  { label: '8', value: '8' },
  { label: '9', value: '9' },
  { key: 'backspace', icon: 'delete', style: 'danger', aria: 'Hapus satu digit' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { key: 'sign', icon: 'plus-minus', style: 'util', aria: 'Ganti tanda positif atau negatif' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { key: 'clear', label: 'C', style: 'util', aria: 'Bersihkan isian' },
  { label: '0', value: '0', wide: true },
  { label: ',', value: '.', aria: 'Koma desimal' },
  { key: 'confirm', icon: 'check', style: 'confirm', aria: 'Konfirmasi jawaban' },
];

function build() {
  if (padEl && document.body.contains(padEl)) return;

  scrimEl = document.createElement('div');
  scrimEl.className = 'mathpad-scrim hidden';
  /**
   * Mengetuk di luar pad menutupnya dengan MENYIMPAN, bukan membuang.
   *
   * Sebelumnya ia memanggil `close(true)` — jalur pembatalan yang sama
   * dengan Escape — sehingga angka yang sudah diketik siswa lenyap tanpa
   * jejak hanya karena jarinya meleset ke luar kotak. Di isian matriks
   * yang punya empat sampai sembilan sel, itu berarti mengulang seluruh
   * pengetikan.
   */
  scrimEl.addEventListener('pointerdown', () => close({ simpan: true }));

  padEl = document.createElement('div');
  padEl.className = 'mathpad';
  padEl.setAttribute('role', 'group');
  padEl.setAttribute('aria-label', 'Papan angka');
  padEl.dataset.open = 'false';
  padEl.dataset.mode = 'decimal';

  padEl.innerHTML = `
    <div class="mathpad__head">
      <div class="mathpad__preview" data-role="preview" data-empty="true" aria-live="polite"></div>
      <div class="mathpad__mode" data-role="mode">
        <button type="button" data-mode-btn="decimal" aria-pressed="true">Angka</button>
        <button type="button" data-mode-btn="fraction" aria-pressed="false">Pecahan</button>
        <button type="button" data-mode-btn="letter" aria-pressed="false">Variabel</button>
      </div>
    </div>
    <div class="mathpad__fraction">
      <!-- Tersusun VERTIKAL: pembilang di atas, garis, penyebut di bawah —
           persis seperti pecahan ditulis di buku. -->
      <div class="mathpad__frac-stack">
        <span class="mathpad__frac-caption">Pembilang</span>
        <button type="button" class="mathpad__frac-slot" data-slot="num" data-active="true"
                aria-label="Pembilang">0</button>
        <div class="mathpad__frac-bar" aria-hidden="true"></div>
        <button type="button" class="mathpad__frac-slot" data-slot="den"
                aria-label="Penyebut">1</button>
        <span class="mathpad__frac-caption">Penyebut</span>
      </div>
    </div>
    <div class="mathpad__grid" data-role="grid"></div>
    <div class="mathpad__letters" data-role="letters"></div>
    <div class="mathpad__abc" data-role="abc"></div>
  `;

  const grid = padEl.querySelector('[data-role="grid"]');
  KEYS.forEach((k) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `mp-key${k.style ? ` mp-key--${k.style}` : ''}${k.wide ? ' mp-key--wide' : ''}`;
    btn.innerHTML = k.icon ? icon(k.icon) : `<span>${k.label}</span>`;
    btn.setAttribute('aria-label', k.aria || k.label);
    // pointerdown (bukan click) agar respons terasa <100ms dan tidak
    // memicu blur pada field sumber.
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handleKey(k);
    });
    grid.appendChild(btn);
  });

  buildAbc(padEl.querySelector('[data-role="abc"]'));

  // Papan huruf: variabel dibatasi SATU huruf (A–Z / a–z), sesuai konvensi
  // penulisan variabel matriks di buku.
  const letters = padEl.querySelector('[data-role="letters"]');
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((ch) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mp-letter';
    btn.textContent = ch;
    btn.setAttribute('aria-label', `Variabel ${ch}`);
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      setLetter(ch);
    });
    letters.appendChild(btn);
  });

  const caseBtn = document.createElement('button');
  caseBtn.type = 'button';
  caseBtn.className = 'mp-letter mp-letter--case';
  caseBtn.textContent = 'aA';
  caseBtn.setAttribute('aria-label', 'Ganti huruf besar atau kecil');
  caseBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    padEl.dataset.letterCase = padEl.dataset.letterCase === 'lower' ? 'upper' : 'lower';
    const lower = padEl.dataset.letterCase === 'lower';
    letters.querySelectorAll('.mp-letter:not(.mp-letter--case)').forEach((b) => {
      b.textContent = lower ? b.textContent.toLowerCase() : b.textContent.toUpperCase();
    });
  });
  letters.appendChild(caseBtn);

  padEl.querySelectorAll('[data-mode-btn]').forEach((btn) => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      setMode(btn.dataset.modeBtn);
    });
  });

  padEl.querySelectorAll('[data-slot]').forEach((slot) => {
    slot.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!session) return;
      session.activeSlot = slot.dataset.slot;
      syncFraction();
    });
  });

  // Cegah pad menutup saat area kosongnya ditekan.
  padEl.addEventListener('pointerdown', (e) => e.stopPropagation());

  document.body.appendChild(scrimEl);
  document.body.appendChild(padEl);
}

/**
 * Papan huruf penuh untuk isian TEKS (nama, asal sekolah).
 *
 * Berbeda dari papan variabel di atas yang sengaja dibatasi satu huruf, papan
 * ini menerima kalimat. Ia tetap dibangun sendiri — bukan memanggil keyboard
 * OS — karena keyboard bawaan mendorong tata letak 100vh yang sudah dikunci
 * dan menutupi separuh layar di perangkat lanskap.
 *
 * Tata letaknya QWERTY supaya cocok dengan kebiasaan mengetik siswa.
 */
const ABC_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

function buildAbc(host) {
  if (!host) return;
  host.innerHTML = '';

  const press = (btn, handler) => {
    // pointerdown, bukan click: responsnya terasa langsung dan field sumber
    // tidak sempat kehilangan fokus.
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handler();
    });
  };

  ABC_ROWS.forEach((row, index) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'mathpad__abc-row';

    // Baris terakhir dititipi tombol hapus dan Shift agar jempol mudah
    // menjangkaunya tanpa menambah baris baru.
    if (index === 2) {
      const shift = document.createElement('button');
      shift.type = 'button';
      shift.className = 'mp-abc mp-abc--util mp-abc--wide';
      shift.dataset.role = 'abc-shift';
      shift.textContent = 'Aa';
      shift.setAttribute('aria-label', 'Ganti huruf besar atau kecil');
      press(shift, toggleAbcCase);
      rowEl.appendChild(shift);
    }

    row.forEach((ch) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mp-abc';
      btn.dataset.letter = ch;
      btn.textContent = ch;
      press(btn, () => typeText(session && session.abcUpper === false ? ch.toLowerCase() : ch));
      rowEl.appendChild(btn);
    });

    if (index === 2) {
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'mp-abc mp-abc--util mp-abc--wide';
      back.innerHTML = icon('delete', { size: 16 });
      back.setAttribute('aria-label', 'Hapus satu huruf');
      press(back, () => {
        session.buffer = session.buffer.slice(0, -1);
        sync();
      });
      rowEl.appendChild(back);
    }

    host.appendChild(rowEl);
  });

  // Baris terakhir: spasi, bersihkan, selesai.
  const utilRow = document.createElement('div');
  utilRow.className = 'mathpad__abc-row';

  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'mp-abc mp-abc--util mp-abc--wide';
  clear.textContent = 'Hapus';
  clear.setAttribute('aria-label', 'Bersihkan seluruh isian');
  press(clear, () => { session.buffer = ''; sync(); });

  const space = document.createElement('button');
  space.type = 'button';
  space.className = 'mp-abc mp-abc--space';
  space.textContent = 'Spasi';
  space.setAttribute('aria-label', 'Spasi');
  press(space, () => typeText(' '));

  const ok = document.createElement('button');
  ok.type = 'button';
  ok.className = 'mp-abc mp-abc--util mp-abc--ok mp-abc--wide';
  ok.textContent = 'Selesai';
  ok.setAttribute('aria-label', 'Selesai mengisi');
  press(ok, () => { commit(); close(); });

  utilRow.append(clear, space, ok);
  host.appendChild(utilRow);
}

/** Sisipkan satu karakter ke isian teks, dengan batas panjang yang wajar. */
function typeText(ch) {
  if (!session || session.mode !== 'text') return;

  // 40 karakter cukup untuk nama lengkap maupun nama sekolah, dan menjaga
  // sapaan di menu tetap muat satu baris.
  if (session.buffer.length >= 40) {
    flashLimit();
    return;
  }

  // Spasi ganda tidak menambah makna, hanya merusak tampilan sapaan.
  if (ch === ' ' && (session.buffer === '' || session.buffer.endsWith(' '))) return;

  session.buffer += ch;
  sync();
}

function toggleAbcCase() {
  if (!session) return;
  session.abcUpper = session.abcUpper === false;
  padEl.querySelectorAll('[data-letter]').forEach((btn) => {
    btn.textContent = session.abcUpper ? btn.dataset.letter : btn.dataset.letter.toLowerCase();
  });
  const shift = padEl.querySelector('[data-role="abc-shift"]');
  if (shift) shift.setAttribute('aria-pressed', String(Boolean(session.abcUpper)));
}

function handleKey(k) {
  if (!session) return;

  if (k.key === 'confirm') {
    commit();
    close();
    return;
  }

  if (k.key === 'clear') {
    if (session.mode === 'fraction') {
      session.numerator = '';
      session.denominator = '';
    } else {
      session.buffer = '';
    }
    sync();
    return;
  }

  if (k.key === 'backspace') {
    mutateActive((cur) => cur.slice(0, -1));
    sync();
    return;
  }

  if (k.key === 'sign') {
    mutateActive((cur) => (cur.startsWith('-') ? cur.slice(1) : `-${cur}`));
    sync();
    return;
  }

  // Tombol digit / desimal
  mutateActive((cur) => {
    if (k.value === '.') {
      if (session.mode === 'fraction') return cur; // pecahan tidak menerima desimal
      if (cur.includes('.')) return cur;
      return cur === '' || cur === '-' ? `${cur}0.` : `${cur}.`;
    }
    if (cur === '0') return k.value;
    if (cur === '-0') return `-${k.value}`;

    // Batas isian: maksimal DUA digit untuk bagian bulat (−99 … 99).
    // Batas ini disengaja agar matriks tetap terbaca di layar kecil dan
    // perhitungan mentalnya tetap masuk akal untuk siswa.
    const digits = cur.replace('-', '').replace('.', '');
    const maxDigits = session.mode === 'decimal' && cur.includes('.') ? 4 : 2;
    if (digits.length >= maxDigits) {
      flashLimit();
      return cur;
    }
    return cur + k.value;
  });

  sync();
}

/** Pilih satu huruf sebagai variabel — langsung menggantikan isi sebelumnya. */
function setLetter(ch) {
  if (!session) return;
  session.buffer = ch;
  sync();
}

/** Kedipkan pratinjau saat siswa menabrak batas dua digit. */
function flashLimit() {
  const preview = padEl && padEl.querySelector('[data-role="preview"]');
  if (!preview) return;
  preview.classList.remove('is-limit');
  void preview.offsetWidth;
  preview.classList.add('is-limit');
  setTimeout(() => preview.classList.remove('is-limit'), 420);
}

/** Terapkan perubahan ke buffer yang sedang aktif (biasa / pembilang / penyebut). */
function mutateActive(fn) {
  if (session.mode === 'fraction') {
    if (session.activeSlot === 'den') session.denominator = fn(session.denominator);
    else session.numerator = fn(session.numerator);
  } else {
    session.buffer = fn(session.buffer);
  }
}

function setMode(mode) {
  if (!session) return;
  session.mode = mode;
  padEl.dataset.mode = mode;
  padEl.querySelectorAll('[data-mode-btn]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.modeBtn === mode));
  });
  sync();

  // Mode pecahan menambah tinggi pad, jadi posisinya harus dihitung ulang —
  // tanpa ini, deretan tombol bawah bisa terpotong di luar layar.
  if (session.field) requestAnimationFrame(() => position(session.field));
}

function syncFraction() {
  padEl.querySelectorAll('[data-slot]').forEach((slot) => {
    slot.dataset.active = String(slot.dataset.slot === session.activeSlot);
  });
  padEl.querySelector('[data-slot="num"]').textContent = session.numerator || '0';
  padEl.querySelector('[data-slot="den"]').textContent = session.denominator || '1';
}

function sync() {
  if (!session) return;

  const preview = padEl.querySelector('[data-role="preview"]');
  let text;

  if (session.mode === 'fraction') {
    syncFraction();
    text = `${session.numerator || '0'}/${session.denominator || '1'}`;
  } else {
    text = session.buffer;
  }

  preview.textContent = text || '—';
  preview.dataset.empty = String(!text);

  // Tampilkan nilai berjalan di field sumber (tanpa keyboard OS terlibat).
  if (session.field) session.field.value = displayValue();
  if (typeof session.onInput === 'function') session.onInput(currentValue(), displayValue());
}

function displayValue() {
  if (!session) return '';
  if (session.mode === 'text') return session.buffer;
  if (session.mode === 'fraction') {
    if (!session.numerator) return '';
    return `${session.numerator}/${session.denominator || '1'}`;
  }
  return session.buffer;
}

/** True kalau isian saat ini berupa variabel huruf, bukan angka. */
function isLetterValue() {
  return /^[A-Za-z]$/.test(session ? session.buffer : '');
}

function currentValue() {
  if (!session) return NaN;
  if (session.mode === 'text') return session.buffer;   // teks: nilainya string
  if (isLetterValue()) return NaN;     // variabel tidak punya nilai numerik
  if (session.mode === 'fraction') {
    const n = Number(session.numerator);
    const d = Number(session.denominator || '1');
    if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return NaN;
    return n / d;
  }
  const v = Number(session.buffer);
  return Number.isFinite(v) ? v : NaN;
}

function commit() {
  if (!session) return;
  // Ditandai lebih dulu: `close()` memakai penanda ini untuk memastikan
  // satu penutupan tidak pernah mengirim dua kali.
  session.committed = true;
  if (typeof session.onCommit !== 'function') return;
  session.onCommit(currentValue(), displayValue());
}

/**
 * Apakah ada yang PANTAS disimpan otomatis?
 *
 * Dua penjagaan, dan keduanya perlu:
 *   · isian kosong tidak pernah dikirim — ia akan menimpa nilai lama
 *     dengan kekosongan;
 *   · isian yang TIDAK BERUBAH juga tidak dikirim — beberapa pemakai
 *     (mis. berburu kofaktor di Fase 16) menilai jawaban tepat saat
 *     `onCommit`, dan membuka pad lalu menutupnya tanpa mengetik apa pun
 *     tidak boleh dihitung sebagai jawaban yang keliru.
 */
function layakDisimpanOtomatis() {
  if (!session || session.committed) return false;
  const tampil = displayValue();
  if (tampil === '' || tampil == null) return false;
  return String(tampil) !== String(session.initialDisplay || '');
}

/**
 * Posisikan pad di dekat field pemicu (popover di desktop).
 * Di mobile, CSS mengambil alih dan menjadikannya bottom-sheet.
 */
function position(anchor) {
  if (window.innerWidth <= 768) return;

  const rect = anchor.getBoundingClientRect();
  const padRect = padEl.getBoundingClientRect();
  const gap = 10;
  const margin = 12;
  const vh = window.innerHeight;

  let top = rect.bottom + gap;
  let origin = 'top center';

  // 1) Coba di bawah field. 2) Kalau tidak muat, balik ke atas field.
  if (top + padRect.height > vh - margin) {
    const above = rect.top - padRect.height - gap;
    if (above >= margin) {
      top = above;
      origin = 'bottom center';
    } else {
      // 3) Tidak muat di atas MAUPUN di bawah (kasus mode pecahan pada layar
      //    pendek): tempelkan ke tepi bawah layar. Tinggi pad dibatasi lewat
      //    CSS max-height sehingga isinya bisa di-scroll, bukan terpotong.
      top = Math.max(margin, vh - padRect.height - margin);
      origin = 'center center';
    }
  }
  top = Math.max(margin, top);

  let left = rect.left + rect.width / 2 - padRect.width / 2;
  left = Math.max(12, Math.min(left, window.innerWidth - padRect.width - 12));

  padEl.style.top = `${top}px`;
  padEl.style.left = `${left}px`;
  padEl.style.setProperty('--mp-origin', origin);
}

/**
 * Buka Mathpad untuk sebuah field.
 * @param {HTMLElement} field  Elemen input/target (akan dibuat readonly).
 * @param {object} options     { initial, mode, allowFraction, onInput, onCommit, onClose }
 */
export function openMathpad(field, options = {}) {
  build();

  const initial = options.initial != null ? String(options.initial) : '';
  const isFraction = initial.includes('/');
  const isLetter = /^[A-Za-z]$/.test(initial);

  // Mode teks dipilih eksplisit lewat opsi; ia tidak pernah ditebak dari isi
  // awal, karena nama seperti "7" pun harus tetap dianggap teks.
  const textMode = options.mode === 'text';

  session = {
    field,
    abcUpper: true,
    buffer: isFraction ? '' : initial,
    numerator: isFraction ? initial.split('/')[0] : '',
    denominator: isFraction ? initial.split('/')[1] : '',
    mode: textMode ? 'text' : (options.mode || (isFraction ? 'fraction' : isLetter ? 'letter' : 'decimal')),
    activeSlot: 'num',
    committed: false,
    // Pembanding untuk auto-simpan: hanya yang BERUBAH yang dikirim.
    initialDisplay: initial,
    onInput: options.onInput,
    onCommit: options.onCommit,
    onClose: options.onClose,
  };

  // Papan teks memakai kerangka yang sama tapi tampilan berbeda total, jadi
  // ia ditandai dengan kelas agar CSS bisa menyembunyikan tombol angka.
  padEl.classList.toggle('mathpad--text', textMode);
  padEl.setAttribute('aria-label', textMode ? 'Papan huruf' : 'Papan angka');

  if (textMode) toggleAbcCase(), toggleAbcCase();   // pulihkan huruf besar

  // Toggle mode ditampilkan sesuai izin konteks.
  const fracBtn = padEl.querySelector('[data-mode-btn="fraction"]');
  const letterBtn = padEl.querySelector('[data-mode-btn="letter"]');
  if (fracBtn) fracBtn.style.display = options.allowFraction === false ? 'none' : '';
  if (letterBtn) letterBtn.style.display = options.allowLetter ? '' : 'none';

  padEl.querySelector('[data-role="mode"]').style.display =
    (options.allowFraction === false && !options.allowLetter) ? 'none' : '';

  setMode(session.mode);

  scrimEl.classList.remove('hidden');
  padEl.dataset.open = 'true';
  if (field) field.dataset.active = 'true';

  position(field);
  sync();

  document.addEventListener('keydown', onGlobalKey);
  window.addEventListener('resize', onReposition);
}

function onReposition() {
  if (session && session.field) position(session.field);
}

/**
 * Keyboard fisik tetap didukung sebagai jalur alternatif (aksesibilitas).
 * Yang dilarang adalah keyboard VIRTUAL bawaan OS yang merusak tata letak.
 */
function onGlobalKey(event) {
  if (!session) return;

  // Mode teks: keyboard fisik diteruskan apa adanya (jalur aksesibilitas).
  // Yang dilarang tetap keyboard VIRTUAL bawaan OS, bukan papan fisik.
  if (session.mode === 'text' && event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    typeText(event.key);
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    // Escape adalah SATU-SATUNYA gestur yang benar-benar membatalkan.
    close({ batal: true });
    return;
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    commit();
    close();
    return;
  }
  if (event.key === 'Backspace') {
    event.preventDefault();
    handleKey({ key: 'backspace' });
    return;
  }
  if (/^[0-9]$/.test(event.key)) {
    event.preventDefault();
    handleKey({ value: event.key });
    return;
  }
  if (event.key === '.' || event.key === ',') {
    event.preventDefault();
    handleKey({ value: '.' });
    return;
  }
  if (event.key === '-') {
    event.preventDefault();
    handleKey({ key: 'sign' });
  }
}

/**
 * Tutup pad dari luar — dipakai `mountScreen()` saat layar berganti.
 *
 * Bawaannya MENYIMPAN: pindah layar sambil membawa angka yang sudah
 * diketik jauh lebih masuk akal daripada membuangnya diam-diam. Pad
 * sendiri hidup di `document.body`, jadi tanpa pemanggilan ini ia akan
 * tetap mengambang di atas layar yang baru.
 */
export function closeMathpad(cancelled = false) {
  close(cancelled ? { batal: true } : { simpan: true });
}

/**
 * Tutup pad.
 *
 * @param {object} opt
 *   simpan — kirim dulu apa yang sudah diketik lewat `onCommit`
 *            (klik di luar, atau pindah layar)
 *   batal  — siswa memang membatalkan (Escape); tidak ada yang disimpan
 *
 * Menerima `true` juga demi pemanggil lama, dan itu berarti BATAL.
 */
function close(opt = {}) {
  if (!padEl) return;

  const { simpan = false, batal = false } = (opt === true ? { batal: true } : opt);

  // Simpan SEBELUM sesinya dilepas — `currentValue()` membaca dari sesi itu.
  if (simpan && layakDisimpanOtomatis()) commit();

  /**
   * Membatalkan berarti KOTAKNYA ikut kembali seperti semula.
   *
   * `sync()` menulis tiap ketukan langsung ke field sebagai pratinjau
   * berjalan. Tanpa pemulihan ini, menekan Escape meninggalkan angka yang
   * terlihat di kotak padahal tidak pernah tersimpan — layar mengatakan
   * "99" sementara ujiannya mencatat soal itu masih kosong. Kotak yang
   * berbohong lebih berbahaya daripada kotak yang kosong.
   */
  if (batal && session && session.field) {
    session.field.value = session.initialDisplay || '';
  }

  document.removeEventListener('keydown', onGlobalKey);
  window.removeEventListener('resize', onReposition);

  padEl.dataset.open = 'false';
  scrimEl.classList.add('hidden');

  if (session) {
    if (session.field) delete session.field.dataset.active;
    if (typeof session.onClose === 'function') session.onClose(batal, currentValue(), displayValue());
  }
  session = null;
}

export function isMathpadOpen() {
  return Boolean(session);
}

/**
 * Siapkan sebuah <input> agar HANYA bisa diisi lewat Mathpad.
 * Inilah pintu gerbang yang mencegah keyboard OS muncul.
 */
export function attachMathpad(input, options = {}) {
  input.readOnly = true;                    // keyboard virtual tidak muncul
  input.setAttribute('inputmode', 'none');  // sinyal eksplisit ke browser mobile
  input.setAttribute('autocomplete', 'off');

  // Isian teks punya gayanya sendiri (.login__input) — memaksakan .numfield
  // di sana akan membuatnya tampil seperti kotak angka kecil.
  if (options.mode !== 'text') input.classList.add('numfield');

  const open = (event) => {
    event.preventDefault();
    // Cegah field mendapat fokus keyboard yang bisa memicu IME di sebagian browser.
    input.blur();
    input.dataset.padOpen = 'true';
    openMathpad(input, {
      ...options,
      initial: input.value,
      onCommit: (value, display) => {
        input.value = display;
        if (typeof options.onCommit === 'function') options.onCommit(value, display, input);
      },
      onClose: () => {
        delete input.dataset.padOpen;
        if (typeof options.onClose === 'function') options.onClose();
      },
    });
  };

  input.addEventListener('pointerdown', open);
  input.addEventListener('keydown', (event) => {
    // Buka pad lewat keyboard demi aksesibilitas.
    if (event.key === 'Enter' || event.key === ' ') open(event);
  });

  return input;
}

export default { openMathpad, closeMathpad, attachMathpad, isMathpadOpen };
