// Máquina de estados del flujo de otorgamiento (diagrama MPR-003-CRE).
//
//   En Evaluacion --(comité)--> En Comite --(resolver)--> Aprobado --(desembolsar)--> Desembolsado
//                                                    \--> Rechazado
//
// ingresos / evaluacion se hacen mientras la solicitud está 'En Evaluacion'.

// Estados desde los que cada acción es válida.
const ORIGENES_VALIDOS = {
  ingresos:    ['En Evaluacion'],
  evaluacion:  ['En Evaluacion'],
  comite:      ['En Evaluacion'],
  resolver:    ['En Comite'],
  desembolsar: ['Aprobado'],
};

function transicionValida(accion, estadoActual) {
  const origenes = ORIGENES_VALIDOS[accion];
  return Array.isArray(origenes) && origenes.includes(estadoActual);
}

// Suma k meses a una fecha ISO 'YYYY-MM-DD' y devuelve ISO 'YYYY-MM-DD'
// (para las fechas reales de cmac_plan_pagos.fecha_pago).
function sumarMesesISO(iso, k) {
  const [y, m, d] = iso.split('-').map(Number);
  const f = new Date(Date.UTC(y, m - 1 + k, d));
  return f.toISOString().slice(0, 10);
}

// Primer día de pago por defecto: mismo día del mes siguiente al desembolso.
function primeraFechaPagoISO(base = new Date()) {
  const f = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate()));
  return f.toISOString().slice(0, 10);
}

module.exports = { ORIGENES_VALIDOS, transicionValida, sumarMesesISO, primeraFechaPagoISO };
