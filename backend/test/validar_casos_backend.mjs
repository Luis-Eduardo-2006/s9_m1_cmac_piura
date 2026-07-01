// =====================================================================
// Prueba de aceptación P1 — el cálculo del CORE reproduce el tarifario.
//
// Ejecuta los 30 casos de frontend/src/data/casos.js con la lógica del
// backend (amortizacionService), usando la TEA que corresponde en
// cmac_productos EMP (0.4092 con desgravamen / 0.4392 sin), y afirma que la
// cuota calculada coincide con cuotaEsperada (±0.02).
//
//   npm run test:casos   ->   debe imprimir "30/30 OK"
// =====================================================================
import { casos } from '../../frontend/src/data/casos.js';
import amortizacionService from '../src/services/amortizacionService.js';

const { calcularCuota } = amortizacionService;

// TEA del producto EMP en cmac_productos (aquí como constantes de referencia;
// el backend real las lee de la BD).
const TEA = { con: 0.4092, sin: 0.4392 };
const TOLERANCIA = 0.02;

let ok = 0;
const fallos = [];

for (const c of casos) {
  const tea = c.conDesgravamen ? TEA.con : TEA.sin;
  const cuota = calcularCuota(c.monto, c.plazoMeses, tea);
  if (Math.abs(cuota - c.cuotaEsperada) <= TOLERANCIA) {
    ok += 1;
  } else {
    fallos.push({ caso: c.id, esperada: c.cuotaEsperada, obtenida: cuota });
  }
}

console.log(`${ok}/${casos.length} OK`);

if (fallos.length > 0) {
  console.error('Casos que NO coinciden:');
  console.table(fallos);
  process.exit(1);
}
