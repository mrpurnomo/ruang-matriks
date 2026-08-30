/**
 * engine/rational.js
 * Aritmetika pecahan EKSAK.
 *
 * Kenapa perlu: kalau siswa mengalikan matriks dengan skalar $\frac{1}{3}$,
 * hasilnya harus tetap tampil sebagai $\frac{2}{3}$ — bukan 0.6666666667.
 * Semua nilai di simulasi karena itu dibawa sebagai pasangan (pembilang,
 * penyebut) dan baru dibulatkan saat benar-benar perlu.
 */

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

/** Buat rasional yang sudah disederhanakan; penyebut selalu positif. */
export function rational(numerator, denominator = 1) {
  if (denominator === 0) throw new Error('Penyebut tidak boleh nol');

  let n = numerator;
  let d = denominator;

  // Bawa ke bilangan bulat kalau salah satunya desimal.
  if (!Number.isInteger(n) || !Number.isInteger(d)) {
    const scale = 10 ** Math.max(decimalsOf(n), decimalsOf(d));
    n = Math.round(n * scale);
    d = Math.round(d * scale);
  }

  if (d < 0) { n = -n; d = -d; }

  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

function decimalsOf(value) {
  if (Number.isInteger(value)) return 0;
  const s = String(value);
  const dot = s.indexOf('.');
  return dot < 0 ? 0 : Math.min(9, s.length - dot - 1);
}

/** Parse "3", "-4", "2/3", "-2/3", atau angka desimal menjadi rasional. */
export function parseRational(input) {
  if (input == null || input === '') return rational(0);
  if (typeof input === 'object' && 'n' in input && 'd' in input) return rational(input.n, input.d);

  const text = String(input).trim();
  if (text.includes('/')) {
    const [a, b] = text.split('/');
    const n = Number(a);
    const d = Number(b);
    if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return rational(0);
    return rational(n, d);
  }

  const v = Number(text);
  return Number.isFinite(v) ? rational(v) : rational(0);
}

export function addR(a, b) { return rational(a.n * b.d + b.n * a.d, a.d * b.d); }
export function subR(a, b) { return rational(a.n * b.d - b.n * a.d, a.d * b.d); }
export function mulR(a, b) { return rational(a.n * b.n, a.d * b.d); }

export function divR(a, b) {
  if (b.n === 0) throw new Error('Pembagian dengan nol');
  return rational(a.n * b.d, a.d * b.n);
}

export function toNumber(r) { return r.n / r.d; }
export function isInteger(r) { return r.d === 1; }
export function isZero(r) { return r.n === 0; }

/** Teks polos: "5", "-3", "2/3". */
export function toText(r) {
  return r.d === 1 ? String(r.n) : `${r.n}/${r.d}`;
}

/** LaTeX: bilangan bulat apa adanya, pecahan memakai \frac (sudah disederhanakan). */
export function toLatexR(r) {
  if (r.d === 1) return String(r.n);
  const sign = r.n < 0 ? '-' : '';
  return `${sign}\\frac{${Math.abs(r.n)}}{${r.d}}`;
}

/** Ubah seluruh matriks angka menjadi matriks rasional. */
export function matrixToRational(m) {
  return m.map((row) => row.map((v) => parseRational(v)));
}

export function matrixToNumber(m) {
  return m.map((row) => row.map((r) => toNumber(r)));
}

export default {
  rational, parseRational, addR, subR, mulR, divR,
  toNumber, toText, toLatexR, isInteger, isZero,
  matrixToRational, matrixToNumber,
};
