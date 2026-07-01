// =====================================================================
// reglasCreditoService.js — Elegibilidad (sujeto de crédito)
// Reglas configurables y PURAS (sin acceso a BD): reciben el producto, el
// cliente y los parámetros de la solicitud, y deciden si es elegible.
// =====================================================================

// Plazos permitidos por producto (meses). Para EMP Micro-Micro son los que
// aparecen en frontend/src/data/casos.js.
const PLAZOS_VALIDOS = {
  EMP: [6, 12, 18, 24, 36],
  CON: [6, 12, 18, 24, 36],
};
const PLAZOS_DEFAULT = [6, 12, 18, 24, 36];

function plazosDe(codigo) {
  return PLAZOS_VALIDOS[codigo] || PLAZOS_DEFAULT;
}

// Devuelve { elegible, codigo, motivo }. Se detiene en la primera regla que falla.
function evaluarElegibilidad({ producto, cliente, monto, plazoMeses }) {
  const m = Number(monto);
  const n = Number(plazoMeses);

  if (!cliente || cliente.es_sujeto_credito !== true) {
    return { elegible: false, codigo: 'NO_SUJETO_CREDITO', motivo: 'El cliente no es sujeto de crédito.' };
  }

  const min = Number(producto.monto_min);
  const max = Number(producto.monto_max);
  if (!Number.isFinite(m) || m < min || m > max) {
    return {
      elegible: false,
      codigo: 'MONTO_FUERA_DE_RANGO',
      motivo: `El monto S/ ${m} está fuera del rango permitido para ${producto.codigo} (S/ ${min}–${max}).`,
    };
  }

  const plazos = plazosDe(producto.codigo);
  if (!plazos.includes(n)) {
    return {
      elegible: false,
      codigo: 'PLAZO_INVALIDO',
      motivo: `El plazo de ${n} meses no es válido para ${producto.codigo}. Plazos permitidos: ${plazos.join(', ')}.`,
    };
  }

  return { elegible: true, codigo: 'ELEGIBLE', motivo: 'Cumple las condiciones de elegibilidad.' };
}

module.exports = { evaluarElegibilidad, plazosDe, PLAZOS_VALIDOS };
