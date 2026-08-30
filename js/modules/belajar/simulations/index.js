/**
 * simulations/index.js
 * Registry engine simulasi. Kunci di sini HARUS cocok dengan nilai
 * `simulation.engine` pada data/chapters/*.json.
 */

import {
  IdentifyElementSim, OrdoBuilderSim, LabelMatrixTypesSim,
  TransposeMorphSim, EqualityLinkSim,
} from './simBasics.js';

import {
  ElementwiseOpSim, ScalarSweepSim, ComboOpSim, OrdoCheckSim,
  MatrixMultiplySim, PropertyCardsSim,
} from './simOperations.js';

import {
  Det2x2Sim, Det3x3SarrusSim, SingularCheckSim, PropertyCalculatorSim,
  Inverse2x2Sim, AdjointFlowSim, MatrixEquationSim,
} from './simDetInv.js';

import {
  DataTranslationSim, SplSolverSim, MultiStatementSim,
} from './simModeling.js';

export const SIMULATION_REGISTRY = {
  identify_element: IdentifyElementSim,
  ordo_builder: OrdoBuilderSim,
  label_matrix_types: LabelMatrixTypesSim,
  transpose_morph: TransposeMorphSim,
  equality_link: EqualityLinkSim,

  elementwise_op: ElementwiseOpSim,
  scalar_sweep: ScalarSweepSim,
  combo_op: ComboOpSim,
  ordo_check: OrdoCheckSim,
  matrix_multiply: MatrixMultiplySim,
  property_cards: PropertyCardsSim,

  det2x2: Det2x2Sim,
  det3x3_sarrus: Det3x3SarrusSim,
  singular_check: SingularCheckSim,
  property_calculator: PropertyCalculatorSim,
  inverse2x2: Inverse2x2Sim,
  adjoint_flow: AdjointFlowSim,
  matrix_equation: MatrixEquationSim,

  data_translation: DataTranslationSim,
  spl_solver: SplSolverSim,
  multi_statement: MultiStatementSim,
};

/**
 * Buat & jalankan sebuah simulasi.
 * @returns {Simulation|null} instance simulasi (untuk destroy() saat pindah layar)
 */
export function mountSimulation(container, definition, onComplete, options = {}) {
  const Engine = SIMULATION_REGISTRY[definition.engine];

  if (!Engine) {
    console.warn(`[simulations] engine "${definition.engine}" belum terdaftar`);
    container.innerHTML = `
      <div class="empty-state">
        <p>Simulasi untuk sub-topik ini belum tersedia.</p>
        <p class="text-sm">Kamu tetap bisa lanjut ke Mini Kuis.</p>
      </div>
    `;
    onComplete();
    return null;
  }

  const config = { ...definition.config, brief: definition.brief };
  const sim = new Engine(container, config, definition.toasts, onComplete);

  // Pelaporan posisi slide: dipasang SEBELUM build() agar slide pertama pun
  // ikut tercatat.
  if (typeof options.onSlideChange === 'function') sim.onSlideChange = options.onSlideChange;

  // Kemajuan yang sudah dicapai di sesi ini (mis. kasus mana yang sel-selnya
  // sudah terisi). Dipasang SEBELUM build() supaya engine bisa langsung
  // memulihkannya saat menggambar panggung pertama kalinya.
  if (options.resumeState) sim.savedState = options.resumeState;
  if (typeof options.onStateChange === 'function') sim.onStateChange = options.onStateChange;

  // Panel kiri (Fase 10). Harus dipasang SEBELUM build() karena scaffold()
  // sudah menempatkan brief dan prompt saat itu juga.
  if (options.hintHost) sim.hintHost = options.hintHost;

  sim.restart = () => {
    sim.destroy();
    container.innerHTML = '';
    const fresh = new Engine(container, config, definition.toasts, onComplete);
    fresh.restart = sim.restart;
    if (typeof options.onSlideChange === 'function') fresh.onSlideChange = options.onSlideChange;
    if (typeof options.onStateChange === 'function') fresh.onStateChange = options.onStateChange;
    if (options.hintHost) {
      options.hintHost.innerHTML = '';
      fresh.hintHost = options.hintHost;
    }
    fresh.build();
    return fresh;
  };

  try {
    sim.build();
    // Setelah panggung terbentuk, kembalikan siswa ke slide tempat ia berhenti.
    if (options.resumeSlide) sim.resumeToStep(Number(options.resumeSlide));
  } catch (err) {
    console.error('[simulations] gagal membangun simulasi:', err);
    container.innerHTML = `
      <div class="empty-state">
        <p>Terjadi kendala saat memuat simulasi ini.</p>
        <p class="text-sm">Silakan lanjut ke Mini Kuis.</p>
      </div>
    `;
    onComplete();
  }

  return sim;
}

export default { SIMULATION_REGISTRY, mountSimulation };
