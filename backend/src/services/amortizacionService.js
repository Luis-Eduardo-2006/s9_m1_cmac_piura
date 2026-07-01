// =====================================================================
// amortizacionService.js — Cálculo de crédito del CORE (funciones puras)
//
// Portado EXACTO desde frontend/src/lib/amortizacion.js (mismo r2 a 2
// decimales, mismo ajuste de la última cuota para cerrar el saldo en 0.00).
// Única diferencia: la TEA entra como PARÁMETRO — este archivo NO conoce
// ningún valor del tarifario.
//
// === TASA DEL TARIFARIO: la TEA llega desde cmac_productos (no hardcodeada) ===
// TEM = (1 + TEA)^(1/12) - 1   |   Amortización francesa, cuota fija
// =====================================================================

// Redondeo a 2 decimales (idéntico al del frontend).
const r2 = (x) => Math.round(x * 100) / 100;

// Tasa efectiva mensual a partir de la TEA: TEM = (1 + TEA)^(1/12) - 1
function tasaMensual(tea) {
  return Math.pow(1 + tea, 1 / 12) - 1;
}

// Cuota fija (amortización francesa). La TEA se recibe como parámetro.
function calcularCuota(monto, meses, tea) {
  const i = tasaMensual(tea);
  const cuota =
    (monto * (i * Math.pow(1 + i, meses))) / (Math.pow(1 + i, meses) - 1);
  return r2(cuota);
}

// Suma k meses a una fecha 'YYYY-MM-DD' y la devuelve como 'DD/MM/YYYY'
function sumarMeses(iso, k) {
  const [y, m, d] = iso.split('-').map(Number);
  const f = new Date(y, m - 1 + k, d);
  const dd = String(f.getDate()).padStart(2, '0');
  const mm = String(f.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${f.getFullYear()}`;
}

// Cronograma completo. primeraCuotaISO en formato 'YYYY-MM-DD' (opcional).
function generarCronograma(monto, meses, tea, primeraCuotaISO) {
  const i = tasaMensual(tea);
  const cuota = calcularCuota(monto, meses, tea);

  const filas = [];
  let saldo = monto;
  for (let n = 1; n <= meses; n++) {
    const interes = r2(saldo * i);
    let capital = r2(cuota - interes);
    if (n === meses) capital = saldo;           // última cuota cierra el saldo
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
