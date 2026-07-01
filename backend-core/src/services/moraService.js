// =====================================================================
// moraService.js — Bandas de mora (FUENTE ÚNICA DE VERDAD) + umbrales (P5)
//
// Bandas por dias_atraso (diagrama "Recuperaciones — Estados del crédito"):
//   Vigente         : 0
//   Mora Preventiva : 1–7
//   Mora Temprana   : 8–30
//   Mora Tardia     : 31–120
//   Judicial        : ≥121  (requiere flag_judicial = true)
//   Castigado       : >180  (requiere flag_castigado = true)
//
// La BANDA es la clasificación de riesgo por días (clasificarBanda). Las TRANSICIONES
// a Judicial/Castigado son ACCIONES explícitas (con umbral de días + rol) que fijan el
// flag y estado_mora en la BD: la banda indica elegibilidad; el flag indica que la acción
// ya se ejecutó. Los flags, si están presentes, tienen prioridad en la clasificación.
// =====================================================================

const UMBRAL_JUDICIAL = 121;   // días para poder derivar a judicial
const UMBRAL_CASTIGO = 180;    // días (>180) para poder castigar

const BANDAS = ['Vigente', 'Mora Preventiva', 'Mora Temprana', 'Mora Tardia', 'Judicial', 'Castigado'];

// Bandas que cuentan como cartera morosa "contable" (NPL) para el ratio de mora.
// (Coincide con la calibración ~13% del seed: Temprana + Tardía + Judicial + Castigado.)
const BANDAS_NPL = ['Mora Temprana', 'Mora Tardia', 'Judicial', 'Castigado'];

// Clasifica la banda a partir de los días de atraso (y los flags, que tienen prioridad).
function clasificarBanda(diasAtraso, flags = {}) {
  const d = Number(diasAtraso) || 0;
  if (flags.flag_castigado || d > 180) return 'Castigado';
  if (flags.flag_judicial || d >= 121) return 'Judicial';
  if (d <= 0) return 'Vigente';
  if (d <= 7) return 'Mora Preventiva';
  if (d <= 30) return 'Mora Temprana';
  return 'Mora Tardia';   // 31–120
}

const esNPL = (banda) => BANDAS_NPL.includes(banda);
const esMora = (banda) => banda !== 'Vigente';

module.exports = { UMBRAL_JUDICIAL, UMBRAL_CASTIGO, BANDAS, BANDAS_NPL, clasificarBanda, esNPL, esMora };
