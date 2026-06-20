// Lógica de amortización francesa (cuota fija) para el simulador de crédito.
// Tarifario "Crédito Empresarial – Micro Micro":
//   con seguro de desgravamen → TEA 40.92 %   |   sin seguro → TEA 43.92 %

export const TEA = { con: 0.4092, sin: 0.4392 };

// Tasa efectiva mensual a partir de la TEA:  TEM = (1 + TEA)^(1/12) − 1
export function tasaMensual(tea) {
  return Math.pow(1 + tea, 1 / 12) - 1;
}

const r2 = (x) => Math.round(x * 100) / 100;

// Cuota fija (amortización francesa)
export function calcularCuota(monto, meses, conDesgravamen) {
  const tea = conDesgravamen ? TEA.con : TEA.sin;
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
export function generarCronograma(monto, meses, conDesgravamen, primeraCuotaISO) {
  const tea = conDesgravamen ? TEA.con : TEA.sin;
  const i = tasaMensual(tea);
  const cuota = calcularCuota(monto, meses, conDesgravamen);

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
