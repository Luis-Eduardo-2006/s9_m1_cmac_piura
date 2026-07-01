// =====================================================================
// Tests de las reglas de negocio (P3) — funciones PURAS, sin BD.
//   npm run test:reglas
// =====================================================================
import assert from 'node:assert/strict';
import reglas from '../src/services/reglasCreditoService.js';
import evalSvc from '../src/services/evaluacionService.js';
import amort from '../src/services/amortizacionService.js';

const { evaluarElegibilidad } = reglas;
const { calcularRds, semaforo, calcularScoring } = evalSvc;
const { calcularCuota } = amort;

// Producto EMP (como en cmac_productos) y TEA sin desgravamen del tarifario.
const EMP = { codigo: 'EMP', monto_min: 500, monto_max: 300000 };
const TEA_SIN = 0.4392;
const clienteOK = { es_sujeto_credito: true, ingreso_neto: 3000 };

let ok = 0, total = 0;
function t(nombre, fn) {
  total++;
  try { fn(); ok++; console.log(`  ✓ ${nombre}`); }
  catch (e) { console.log(`  ✗ ${nombre}\n      ${e.message}`); }
}

console.log('\nElegibilidad:');

t('caso elegible (monto/plazo válidos) → pasa a evaluación', () => {
  const r = evaluarElegibilidad({ producto: EMP, cliente: clienteOK, monto: 10000, plazoMeses: 12 });
  assert.equal(r.elegible, true);
  assert.equal(r.codigo, 'ELEGIBLE');
});

t('monto fuera de rango → Rechazado (MONTO_FUERA_DE_RANGO)', () => {
  const r = evaluarElegibilidad({ producto: EMP, cliente: clienteOK, monto: 400000, plazoMeses: 12 });
  assert.equal(r.elegible, false);
  assert.equal(r.codigo, 'MONTO_FUERA_DE_RANGO');
});

t('plazo inválido → Rechazado (PLAZO_INVALIDO)', () => {
  const r = evaluarElegibilidad({ producto: EMP, cliente: clienteOK, monto: 10000, plazoMeses: 10 });
  assert.equal(r.elegible, false);
  assert.equal(r.codigo, 'PLAZO_INVALIDO');
});

t('cliente no sujeto de crédito → Rechazado (NO_SUJETO_CREDITO)', () => {
  const r = evaluarElegibilidad({ producto: EMP, cliente: { es_sujeto_credito: false }, monto: 10000, plazoMeses: 12 });
  assert.equal(r.elegible, false);
  assert.equal(r.codigo, 'NO_SUJETO_CREDITO');
});

console.log('\nRDS + semáforo (cuota real del tarifario):');

// Caso #5 de casos.js: 10 000 / 12 meses / sin desgravamen → cuota 1009.46
const cuota = calcularCuota(10000, 12, TEA_SIN);
t('cuota del tarifario = 1009.46 (Caso #5)', () => assert.equal(cuota, 1009.46));

t('VERDE: ingreso 5000 → RDS ≈ 0.2019 (≤ 0.30)', () => {
  const rds = calcularRds(cuota, 5000);
  assert.ok(Math.abs(rds - 0.2019) < 0.001, `RDS=${rds}`);
  assert.equal(semaforo(rds), 'VERDE');
});

t('AMBAR: ingreso 3000 → RDS ≈ 0.3365 (0.30–0.40)', () => {
  const rds = calcularRds(cuota, 3000);
  assert.ok(Math.abs(rds - 0.3365) < 0.001, `RDS=${rds}`);
  assert.equal(semaforo(rds), 'AMBAR');
});

t('ROJO: ingreso 2000 → RDS ≈ 0.5047 (> 0.40)', () => {
  const rds = calcularRds(cuota, 2000);
  assert.ok(Math.abs(rds - 0.5047) < 0.001, `RDS=${rds}`);
  assert.equal(semaforo(rds), 'ROJO');
});

console.log('\nScoring (0–100, monótono):');

t('scoring VERDE > scoring ROJO y ambos en [0,100]', () => {
  const sVerde = calcularScoring({ rds: 0.2019, monto: 10000, ingresoNeto: 5000, plazoMeses: 12 });
  const sRojo  = calcularScoring({ rds: 0.5047, monto: 10000, ingresoNeto: 2000, plazoMeses: 12 });
  assert.ok(sVerde >= 0 && sVerde <= 100 && sRojo >= 0 && sRojo <= 100, `verde=${sVerde} rojo=${sRojo}`);
  assert.ok(sVerde > sRojo, `esperado verde(${sVerde}) > rojo(${sRojo})`);
});

console.log(`\n${ok}/${total} OK`);
process.exit(ok === total ? 0 : 1);
