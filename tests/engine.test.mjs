import * as M from '../js/engine/matrix.js';

let pass = 0, fail = 0;
const eq = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  ok ? pass++ : fail++;
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}${ok ? '' : `\n         dapat ${JSON.stringify(actual)}, harusnya ${JSON.stringify(expected)}`}`);
};

const A = [[6,-2],[3,5]], B = [[1,4],[-3,2]];
eq('A - B', M.subtract(A,B), [[5,-6],[6,3]]);
eq('A + B', M.add(A,B), [[7,2],[0,7]]);
eq('-2 * M', M.scalarMultiply(-2,[[-3,4],[5,0],[2,-1]]), [[6,-8],[-10,0],[-4,2]]);
eq('transpose 2x3', M.transpose([[1,4,7],[2,5,8]]), [[1,2],[4,5],[7,8]]);
eq('[[2,1],[0,3]] x [[4],[-1]]', M.multiply([[2,1],[0,3]],[[4],[-1]]), [[7],[-3]]);
eq('[[1,2],[3,0]] x [[2,1],[1,4]]', M.multiply([[1,2],[3,0]],[[2,1],[1,4]]), [[4,9],[6,3]]);
eq('det [[6,2],[4,5]]', M.determinant([[6,2],[4,5]]), 22);
eq('det Sarrus H', M.determinant([[2,0,1],[1,3,2],[0,1,1]]), 3);
eq('det Sarrus contoh', M.determinant([[1,2,3],[0,1,4],[5,6,0]]), 1);
eq('singular [[2,4],[1,2]]', M.isSingular([[2,4],[1,2]]), true);
eq('inv [[3,5],[1,2]]', M.inverse([[3,5],[1,2]]), [[2,-5],[-1,3]]);
eq('inv [[4,3],[1,1]]', M.inverse([[4,3],[1,1]]), [[1,-3],[-1,4]]);
eq('inv TKA F', M.inverse([[2,0],[0,0.5]]), [[0.5,0],[0,2]]);
eq('solve AX=B', M.solveLeft([[2,1],[1,1]],[[5],[3]]), [[2],[1]]);
// Bandingkan lewat formatNumber, sama seperti yang dilihat siswa di layar:
// hasil mentahnya 12999.999999999998 karena aritmatika floating-point.
eq('solve kantin (terformat)', M.solveLeft([[1,2],[2,1]],[[23000],[31000]]).map(r=>r.map(M.formatNumber)), [['13000'],['5000']]);
eq('solve buah SPLTV', M.solveLeft([[2,1,1],[1,2,1],[1,1,2]],[[140000],[110000],[130000]]).map(r=>r.map(Math.round)), [[45000],[15000],[35000]]);
eq('pendapatan cabang', M.multiply([[50000,120000,200000]],[[8,5,6],[4,6,3],[3,2,5]]), [[1480000,1370000,1660000]]);
eq('A x A^-1 = I', M.multiply([[3,5],[1,2]], M.inverse([[3,5],[1,2]])), M.identity(2));
eq('inv 3x3 adjoin', M.multiply([[1,2,3],[0,1,4],[5,6,0]], M.inverse([[1,2,3],[0,1,4],[5,6,0]])).map(r=>r.map(v=>Math.round(v))), M.identity(3));
eq('toFractionText 0.5', M.toFractionText(0.5), '1/2');
eq('ordoText 2x3', M.ordoText([[1,2,3],[4,5,6]]), '2×3');

console.log(`\nHASIL ENGINE: ${pass}/${pass+fail} lolos`);
process.exit(fail ? 1 : 0);
