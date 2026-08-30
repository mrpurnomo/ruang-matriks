/**
 * engine/matrix.js
 * Logika matematika murni untuk matriks — TANPA sentuhan DOM sama sekali,
 * sehingga bisa diuji terpisah dari tampilan.
 *
 * Konvensi: matriks direpresentasikan sebagai array 2 dimensi baris-mayor,
 * yaitu m[i][j] dengan i = indeks baris (0-based) dan j = indeks kolom (0-based).
 */

/** Buat matriks berukuran rows × cols yang seluruh elemennya bernilai `fill`. */
export function create(rows, cols, fill = 0) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

/** Salinan dalam (deep copy) agar mutasi tidak merembet ke sumber. */
export function clone(m) {
  return m.map((row) => row.slice());
}

/** Ordo matriks sebagai objek { rows, cols }. */
export function ordo(m) {
  return { rows: m.length, cols: m[0] ? m[0].length : 0 };
}

/** Ordo dalam bentuk teks, mis. "2×3". */
export function ordoText(m) {
  const { rows, cols } = ordo(m);
  return `${rows}×${cols}`;
}

export function isSquare(m) {
  const { rows, cols } = ordo(m);
  return rows === cols && rows > 0;
}

export function sameOrdo(a, b) {
  const oa = ordo(a);
  const ob = ordo(b);
  return oa.rows === ob.rows && oa.cols === ob.cols;
}

/** Penjumlahan elemen seletak. Memerlukan ordo yang sama. */
export function add(a, b) {
  if (!sameOrdo(a, b)) throw new Error('Ordo tidak sama');
  return a.map((row, i) => row.map((v, j) => v + b[i][j]));
}

/** Pengurangan elemen seletak. Memerlukan ordo yang sama. */
export function subtract(a, b) {
  if (!sameOrdo(a, b)) throw new Error('Ordo tidak sama');
  return a.map((row, i) => row.map((v, j) => v - b[i][j]));
}

/** Perkalian skalar: setiap elemen dikali k. Tidak ada syarat ordo. */
export function scalarMultiply(k, m) {
  return m.map((row) => row.map((v) => v * k));
}

/** Transpose: a[i][j] menjadi a[j][i]. */
export function transpose(m) {
  const { rows, cols } = ordo(m);
  const out = create(cols, rows);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) out[j][i] = m[i][j];
  }
  return out;
}

/**
 * Perkalian matriks (aturan baris × kolom).
 * Syarat: kolom A harus sama dengan baris B.
 */
export function multiply(a, b) {
  const oa = ordo(a);
  const ob = ordo(b);
  if (oa.cols !== ob.rows) throw new Error('Kolom A tidak sama dengan baris B');
  const out = create(oa.rows, ob.cols, 0);
  for (let i = 0; i < oa.rows; i++) {
    for (let j = 0; j < ob.cols; j++) {
      let sum = 0;
      for (let k = 0; k < oa.cols; k++) sum += a[i][k] * b[k][j];
      out[i][j] = sum;
    }
  }
  return out;
}

/**
 * Daftar suku penyusun satu elemen hasil perkalian, dipakai simulasi
 * untuk menampilkan langkah per langkah, mis. [{a:2, b:4, product:8}, ...].
 */
export function multiplyTerms(a, b, i, j) {
  const terms = [];
  const inner = ordo(a).cols;
  for (let k = 0; k < inner; k++) {
    terms.push({ k, a: a[i][k], b: b[k][j], product: a[i][k] * b[k][j] });
  }
  return terms;
}

/** Matriks identitas berordo n × n. */
export function identity(n) {
  const out = create(n, n, 0);
  for (let i = 0; i < n; i++) out[i][i] = 1;
  return out;
}

/** Determinan matriks persegi (dibatasi ordo 1–3 sesuai kisi-kisi TKA). */
export function determinant(m) {
  if (!isSquare(m)) throw new Error('Determinan hanya untuk matriks persegi');
  const n = m.length;
  if (n === 1) return m[0][0];
  if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  if (n === 3) {
    const [[a, b, c], [d, e, f], [g, h, i]] = m;
    return a * e * i + b * f * g + c * d * h - (g * e * c + h * f * a + i * d * b);
  }
  throw new Error('Ordo di atas 3×3 di luar cakupan materi');
}

/**
 * Enam suku Metode Sarrus untuk matriks 3×3, dipakai simulasi.
 * Mengembalikan { down: [...], up: [...] } masing-masing berisi 3 suku.
 */
export function sarrusTerms(m) {
  if (m.length !== 3) throw new Error('Sarrus hanya untuk matriks 3×3');
  const cells = (coords) => coords.map(([i, j]) => m[i][j]);
  const build = (coords) => {
    const values = cells(coords);
    return { coords, values, product: values.reduce((x, y) => x * y, 1) };
  };
  return {
    down: [
      build([[0, 0], [1, 1], [2, 2]]),
      build([[0, 1], [1, 2], [2, 0]]),
      build([[0, 2], [1, 0], [2, 1]]),
    ],
    up: [
      build([[2, 0], [1, 1], [0, 2]]),
      build([[2, 1], [1, 2], [0, 0]]),
      build([[2, 2], [1, 0], [0, 1]]),
    ],
  };
}

export function isSingular(m) {
  return Math.abs(determinant(m)) < 1e-10;
}

/** Sub-matriks hasil mencoret baris `row` dan kolom `col`. */
export function minorMatrix(m, row, col) {
  return m.filter((_, i) => i !== row).map((r) => r.filter((_, j) => j !== col));
}

/** Nilai minor: determinan sub-matriks setelah pencoretan. */
export function minor(m, row, col) {
  return determinant(minorMatrix(m, row, col));
}

/** Kofaktor: minor dengan tanda papan catur (-1)^(i+j). */
export function cofactor(m, row, col) {
  return ((row + col) % 2 === 0 ? 1 : -1) * minor(m, row, col);
}

/** Matriks kofaktor lengkap. */
export function cofactorMatrix(m) {
  return m.map((row, i) => row.map((_, j) => cofactor(m, i, j)));
}

/** Adjoin = transpose dari matriks kofaktor. */
export function adjoint(m) {
  return transpose(cofactorMatrix(m));
}

/**
 * Invers matriks persegi (ordo 2 atau 3).
 * Melempar error jika matriks singular — sesuai materi, ini bukan kasus
 * yang boleh "dibulatkan", melainkan memang tidak terdefinisi.
 */
export function inverse(m) {
  if (!isSquare(m)) throw new Error('Invers hanya untuk matriks persegi');
  const det = determinant(m);
  if (Math.abs(det) < 1e-10) throw new Error('Matriks singular, invers tidak ada');
  if (m.length === 2) {
    const [[a, b], [c, d]] = m;
    return [
      [d / det, -b / det],
      [-c / det, a / det],
    ];
  }
  return scalarMultiply(1 / det, adjoint(m));
}

/** Selesaikan AX = B, yaitu X = A⁻¹B. */
export function solveLeft(a, b) {
  return multiply(inverse(a), b);
}

/** Selesaikan XA = B, yaitu X = BA⁻¹. */
export function solveRight(a, b) {
  return multiply(b, inverse(a));
}

export function equals(a, b, tol = 1e-9) {
  if (!sameOrdo(a, b)) return false;
  return a.every((row, i) => row.every((v, j) => Math.abs(v - b[i][j]) <= tol));
}

/**
 * Format angka untuk ditampilkan: bilangan bulat tampil apa adanya,
 * pecahan dibulatkan maksimal 4 desimal tanpa nol berlebih di belakang.
 */
export function formatNumber(value, maxDecimals = 4) {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.round(value * 1e9) / 1e9;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(parseFloat(rounded.toFixed(maxDecimals)));
}

/** Ubah desimal menjadi pecahan sederhana bila memungkinkan, mis. 0.5 → "1/2". */
export function toFractionText(value, maxDenominator = 64) {
  if (Number.isInteger(value)) return String(value);
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  let best = null;
  for (let den = 2; den <= maxDenominator; den++) {
    const num = Math.round(abs * den);
    if (Math.abs(num / den - abs) < 1e-9) {
      best = { num, den };
      break;
    }
  }
  if (!best) return formatNumber(value);
  return `${sign < 0 ? '-' : ''}${best.num}/${best.den}`;
}

/** Ubah matriks JS menjadi string LaTeX pmatrix untuk dirender KaTeX. */
export function toLatex(m, { fraction = false } = {}) {
  const body = m
    .map((row) => row.map((v) => (fraction ? toFractionText(v) : formatNumber(v))).join(' & '))
    .join(' \\\\ ');
  return `\\begin{pmatrix} ${body} \\end{pmatrix}`;
}

/** Parse teks multi-baris (baris dipisah newline, elemen dipisah spasi/koma). */
export function fromText(text) {
  const rows = text
    .trim()
    .split(/\n+/)
    .map((line) => line.trim().split(/[\s,]+/).map(Number));
  const width = rows[0].length;
  if (!rows.every((r) => r.length === width && r.every(Number.isFinite))) {
    throw new Error('Format matriks tidak valid');
  }
  return rows;
}
