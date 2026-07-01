// =====================================================================
// amortizacionService.js — COPIA EXACTA de backend/src/services/amortizacionService.js
//
// Decisión de reuso (ver CLAUDE.md "## Flujo de otorgamiento"): se COPIA el
// módulo puro en lugar de compartir una carpeta /shared, para que /backend y
// /backend-core sean desplegables por separado sin dependencias cruzadas de
// ruta. La fórmula es única y está cubierta por el test backend/test/
// validar_casos_backend.mjs (30/30). Si cambias la fórmula, cámbiala en AMBOS.
//
// === TASA DEL TARIFARIO: la TEA llega desde cmac_productos (no hardcodeada) ===
// TEM = (1 + TEA)^(1/12) - 1   |   Amortización francesa, cuota fija
// =====================================================================

const r2 = (x) => Math.round(x * 100) / 100;

function tasaMensual(tea) {
  return Math.pow(1 + tea, 1 / 12) - 1;
}

function calcularCuota(monto, meses, tea) {
  const i = tasaMensual(tea);
  const cuota =
    (monto * (i * Math.pow(1 + i, meses))) / (Math.pow(1 + i, meses) - 1);
  return r2(cuota);
}

function sumarMeses(iso, k) {
  const [y, m, d] = iso.split('-').map(Number);
  const f = new Date(y, m - 1 + k, d);
  const dd = String(f.getDate()).padStart(2, '0');
  const mm = String(f.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${f.getFullYear()}`;
}

function generarCronograma(monto, meses, tea, primeraCuotaISO) {
  const i = tasaMensual(tea);
  const cuota = calcularCuota(monto, meses, tea);

  const filas = [];
  let saldo = monto;
  for (let n = 1; n <= meses; n++) {
    const interes = r2(saldo * i);
    let capital = r2(cuota - interes);
    if (n === meses) capital = saldo;
    saldo = r2(saldo - capital);
    filas.push({
      n,
      fecha: primeraCuotaISO ? sumarMeses(primeraCuotaISO, n - 1) : `Cuota ${n}`,
      cuota,
      capital,
      interes,
      saldo: saldo < 0 ? 0 : saldo,
    });
  }
  return { cuota, tea, tem: i, filas };
}

module.exports = { tasaMensual, calcularCuota, generarCronograma };
