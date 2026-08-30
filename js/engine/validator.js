/**
 * engine/validator.js
 * Memeriksa apakah sebuah operasi boleh dijalankan, DAN — yang sama pentingnya —
 * menghasilkan kalimat penjelas yang bisa langsung ditampilkan sebagai Toast.
 *
 * Aturan PRD §8.4: penolakan interaksi tidak pernah boleh berupa indikator
 * visual saja; selalu ada kalimat yang menjelaskan MENGAPA.
 */

import { ordo, ordoText, isSquare, determinant } from './matrix.js';

/** Bentuk hasil pemeriksaan yang seragam. */
function ok() {
  return { valid: true, reason: null };
}

function fail(reason) {
  return { valid: false, reason };
}

/** Penjumlahan & pengurangan: ordo wajib identik. */
export function canAddSubtract(a, b, opLabel = 'dijumlahkan') {
  if (!a || !b) return fail('Kedua matriks harus tersedia lebih dulu.');
  const oa = ordo(a);
  const ob = ordo(b);
  if (oa.rows !== ob.rows || oa.cols !== ob.cols) {
    return fail(
      `Belum bisa ${opLabel} — ordo A adalah ${ordoText(a)} sedangkan B adalah ${ordoText(b)}. ` +
      `Operasi ini butuh ordo yang sama persis agar setiap elemen punya pasangan seletak.`
    );
  }
  return ok();
}

/** Perkalian matriks: kolom A harus sama dengan baris B. */
export function canMultiply(a, b) {
  if (!a || !b) return fail('Kedua matriks harus tersedia lebih dulu.');
  const oa = ordo(a);
  const ob = ordo(b);
  if (oa.cols !== ob.rows) {
    return fail(
      `Belum bisa dikalikan — kolom A ada ${oa.cols} sedangkan baris B ada ${ob.rows}. ` +
      `Perkalian matriks mensyaratkan kolom A = baris B.`
    );
  }
  return ok();
}

/** Determinan: hanya untuk matriks persegi, dan dibatasi ordo ≤ 3 sesuai kurikulum. */
export function canDeterminant(m) {
  if (!m) return fail('Matriks belum tersedia.');
  if (!isSquare(m)) {
    return fail(
      `Determinan hanya dimiliki matriks persegi, sedangkan matriks ini berordo ${ordoText(m)}. ` +
      `Banyak baris dan kolomnya harus sama.`
    );
  }
  if (m.length > 3) {
    return fail('Cakupan materi kelas 11 membatasi determinan sampai ordo 3×3 saja.');
  }
  return ok();
}

/** Invers: persegi, ordo ≤ 3, dan non-singular. */
export function canInverse(m) {
  const detCheck = canDeterminant(m);
  if (!detCheck.valid) {
    return fail(detCheck.reason.replace('Determinan hanya dimiliki', 'Invers hanya dimiliki'));
  }
  const det = determinant(m);
  if (Math.abs(det) < 1e-10) {
    return fail(
      'Matriks ini singular (determinannya 0), sehingga inversnya tidak ada — ' +
      'rumus invers akan membagi dengan nol, dan pembagian dengan nol tidak terdefinisi.'
    );
  }
  return ok();
}

/** Transpose: selalu boleh, tanpa syarat apa pun. */
export function canTranspose(m) {
  return m ? ok() : fail('Matriks belum tersedia.');
}

/** Cek apakah dua alamat sel merujuk posisi seletak (dipakai simulasi penjumlahan). */
export function checkAligned(cellA, cellB) {
  if (cellA.row === cellB.row && cellA.col === cellB.col) return ok();
  return fail(
    `Posisi tidak seletak — a<sub>${cellA.row + 1}${cellA.col + 1}</sub> ada di baris ${cellA.row + 1} ` +
    `kolom ${cellA.col + 1}, sedangkan b<sub>${cellB.row + 1}${cellB.col + 1}</sub> ada di baris ${cellB.row + 1} ` +
    `kolom ${cellB.col + 1}. Pasangkan elemen yang alamat baris-kolomnya identik.`
  );
}

/**
 * Isi placeholder {{kunci}} pada string Toast yang tersimpan di JSON konten.
 * Contoh: fillTemplate("ordo A {{ordoA}}", { ordoA: "2×3" })
 */
export function fillTemplate(template, values = {}) {
  if (typeof template !== 'string') return '';
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  );
}

/** Validasi input angka dari Mathpad. */
export function validateNumberInput(raw, { allowNegative = true, allowDecimal = true } = {}) {
  if (raw === '' || raw == null) return fail('Isian masih kosong — masukkan angka lewat Mathpad.');
  const value = Number(raw);
  if (!Number.isFinite(value)) return fail('Format angka belum benar.');
  if (!allowNegative && value < 0) return fail('Nilai negatif tidak berlaku untuk isian ini.');
  if (!allowDecimal && !Number.isInteger(value)) return fail('Isian ini hanya menerima bilangan bulat.');
  return { valid: true, reason: null, value };
}

/** Bandingkan jawaban numerik dengan toleransi (untuk hasil pecahan). */
export function numbersMatch(actual, expected, tolerance = 1e-6) {
  return Math.abs(Number(actual) - Number(expected)) <= tolerance;
}
