// =====================================================================
// rutaAprobacionService.js — Ruta de aprobación por montos (PURO)
// El nivel sale de cmac_niveles_aprobacion (por monto). Aquí definimos qué
// OPINIONES de rol requiere cada nivel antes del comité.
//
// Nivel 1 (hasta 30k)     -> solo comité, sin opiniones previas.
// Nivel 2 (30k–300k)      -> opinión de Administrador + Riesgos.
// Nivel 3 (>=300k)        -> opinión de Jefe Regional + Riesgos.
//
// TODO(P4): la VALIDACIÓN de que solo el rol correspondiente emita/resuelva
// cada opinión se implementa en P4 (RBAC fino). Aquí solo se rutea/estructura.
// =====================================================================

const OPINIONES_POR_NIVEL = {
  'Nivel 1': [],
  'Nivel 2': ['administrador', 'riesgos'],
  'Nivel 3': ['jefe_regional', 'riesgos'],
};

function opinionesRequeridas(nivelNombre) {
  return OPINIONES_POR_NIVEL[nivelNombre] || [];
}

module.exports = { opinionesRequeridas, OPINIONES_POR_NIVEL };
