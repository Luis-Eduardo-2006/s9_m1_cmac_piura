// =====================================================================
// evaluacionService.js — RDS, semáforo y scoring (funciones PURAS)
//
// RDS (Ratio Deuda/Servicio) = cuota_mensual / ingreso_neto_mensual.
// Semáforo:  VERDE  RDS <= 0.30
//            AMBAR  0.30 < RDS <= 0.40
//            ROJO   RDS > 0.40
//
// Scoring (0–100), explicable, ponderando 3 factores disponibles:
//   scoring = 0.60 * puntajeRDS + 0.25 * puntajeApalancamiento + 0.15 * puntajePlazo
//   - puntajeRDS          = clamp(100 * (1 - RDS / 0.50))          (RDS bajo → alto)
//   - puntajeApalancamiento = clamp(100 * (1 - (monto/ingreso) / 12))  (menor apalancamiento → alto)
//   - puntajePlazo        = clamp(100 * (1 - plazoMeses / 36))     (plazo corto → alto)
// Todos los factores usan solo datos que SÍ tenemos (cuota, ingreso, monto, plazo).
// =====================================================================

// Cortes del semáforo (documentados y nombrados).
const UMBRAL_RDS_VERDE = 0.30;
const UMBRAL_RDS_AMBAR = 0.40;

// Constantes del scoring.
const RDS_DENOM = 0.50;          // RDS al que puntajeRDS llega a 0
const APALANCAMIENTO_MAX = 12;   // monto hasta 12x el ingreso mensual
const PLAZO_MAX = 36;            // meses

const clamp = (x, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, x));
const round2 = (x) => Math.round(x * 100) / 100;
const round4 = (x) => Math.round(x * 10000) / 10000;

// RDS = cuota / ingreso (4 decimales).
function calcularRds(cuota, ingresoNeto) {
  const ingreso = Number(ingresoNeto);
  if (!ingreso || ingreso <= 0) return null;
  return round4(cuota / ingreso);
}

function semaforo(rds) {
  if (rds == null) return 'ROJO';
  if (rds <= UMBRAL_RDS_VERDE) return 'VERDE';
  if (rds <= UMBRAL_RDS_AMBAR) return 'AMBAR';
  return 'ROJO';
}

// Scoring 0–100.
function calcularScoring({ rds, monto, ingresoNeto, plazoMeses }) {
  const ingreso = Number(ingresoNeto);
  const puntajeRds = clamp(100 * (1 - (rds ?? 1) / RDS_DENOM));
  const apal = ingreso > 0 ? Number(monto) / ingreso : APALANCAMIENTO_MAX;
  const puntajeApal = clamp(100 * (1 - apal / APALANCAMIENTO_MAX));
  const puntajePlazo = clamp(100 * (1 - Number(plazoMeses) / PLAZO_MAX));
  return Math.round(0.60 * puntajeRds + 0.25 * puntajeApal + 0.15 * puntajePlazo);
}

// Orquesta el cálculo a partir de la cuota real (ya calculada con la TEA del tarifario).
function evaluar({ cuota, ingresoNeto, monto, plazoMeses, gastoFamiliar = 0 }) {
  const rds = calcularRds(cuota, ingresoNeto);
  const color = semaforo(rds);
  const scoring = calcularScoring({ rds, monto, ingresoNeto, plazoMeses });
  const capacidadPago = round2(Number(ingresoNeto) - Number(gastoFamiliar || 0));
  return { rds, semaforo: color, scoring, capacidadPago };
}

module.exports = {
  UMBRAL_RDS_VERDE,
  UMBRAL_RDS_AMBAR,
  calcularRds,
  semaforo,
  calcularScoring,
  evaluar,
};
