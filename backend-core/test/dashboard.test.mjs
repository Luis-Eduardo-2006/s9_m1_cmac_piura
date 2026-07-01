// =====================================================================
// Test del dashboard ejecutivo (P7). Requiere el backend-core corriendo (:3001).
//   ->  npm run test:dashboard
// =====================================================================
import 'dotenv/config';

const CORE = 'http://localhost:3001/api/core';
let ok = 0, total = 0;
const t = (cond, label) => { total++; if (cond) ok++; console.log(`  ${cond ? '✓' : '✗'} ${label}`); };
async function api(method, path, token) {
  const res = await fetch(`${CORE}${path}`, { method, headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

try {
  const loginRes = await fetch(`${CORE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ numerodni: '11111111', password: '11111111' }) });
  const token = (await loginRes.json()).token;

  console.log('\nGET /dashboard/resumen:');
  const r = await api('GET', '/dashboard/resumen', token);
  t(r.status === 200, 'responde 200');
  const k = r.data.kpis || {};
  const clavesKpi = ['cartera_total', 'cartera_vigente', 'cartera_vencida', 'ratio_mora', 'n_creditos', 'n_clientes', 'desembolsos_total', 'ticket_promedio'];
  t(clavesKpi.every((c) => c in k), `kpis tiene las ${clavesKpi.length} claves`);
  t(Array.isArray(r.data.mora_por_banda) && r.data.mora_por_banda.length === 6, 'mora_por_banda: 6 bandas');
  t(Array.isArray(r.data.cartera_por_producto) && r.data.cartera_por_producto.length >= 1, 'cartera_por_producto: array');
  t(Array.isArray(r.data.desembolsos_por_mes), 'desembolsos_por_mes: array');

  console.log('\nCoherencia:');
  t(Math.abs(k.ratio_mora - 13) < 1.5, `ratio_mora = ${k.ratio_mora}% (~13%)`);
  t(Math.abs((k.cartera_vigente + k.cartera_vencida) - k.cartera_total) < 0.01, `vigente + vencida = total (${k.cartera_vigente} + ${k.cartera_vencida} = ${k.cartera_total})`);
  t(k.ticket_promedio > 0 && Math.abs(k.ticket_promedio - k.desembolsos_total / k.n_creditos) < 0.01, `ticket_promedio coherente (${k.ticket_promedio})`);

  console.log('\nGET /dashboard/export.csv:');
  const res = await fetch(`${CORE}/dashboard/export.csv`, { headers: { Authorization: `Bearer ${token}` } });
  const csv = await res.text();
  t(res.headers.get('content-type')?.includes('text/csv'), 'content-type text/csv');
  t(csv.split('\n').length >= 2 && csv.includes('codcuentacredito'), `CSV con cabecera + filas (${csv.split('\n').length - 1} filas)`);
} catch (e) {
  console.error('ERROR:', e.message); total++;
} finally {
  console.log(`\n${ok}/${total} OK ${ok === total ? '✓' : '✗'}`);
  process.exit(ok === total ? 0 : 1);
}
