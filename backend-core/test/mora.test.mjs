// =====================================================================
// Tests de Recuperaciones / Mora (P5). Parte pura (clasificarBanda) +
// integración (umbrales, roles, KPI). Requiere el backend-core corriendo
// (:3001) + .env (service_role). Siembra/limpia sus datos.  ->  npm run test:mora
// =====================================================================
import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert/strict';
import 'dotenv/config';
import mora from '../src/services/moraService.js';

const { clasificarBanda } = mora;
const CORE = 'http://localhost:3001/api/core';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

let ok = 0, total = 0;
const t = (cond, label) => { total++; if (cond) ok++; console.log(`  ${cond ? '✓' : '✗'} ${label}`); };
async function api(method, path, token, body) {
  const res = await fetch(`${CORE}${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
const login = (d) => api('POST', '/auth/login', null, { numerodni: d, password: d });

// Crea una cuenta de crédito de prueba con dias de atraso dado (+ su solicitud).
async function seedCuenta(codsol, cod, dias) {
  const { data: cli } = await sb.from('cmac_clientes').select('id').eq('codcliente', 'cli000001').maybeSingle();
  const { data: prod } = await sb.from('cmac_productos').select('id').eq('codigo', 'EMP').maybeSingle();
  const { data: sol } = await sb.from('cmac_solicitudes').insert({ codsolicitud: codsol, cliente_id: cli.id, producto_id: prod.id, estado: 'Desembolsado', monto_solicitado: 5000, plazo_meses: 12, con_desgravamen: false }).select('id').maybeSingle();
  await sb.from('cmac_cuentas_credito').insert({ codcuentacredito: cod, cliente_id: cli.id, solicitud_id: sol.id, monto_desembolsado: 5000, saldo_capital: 5000, dias_atraso: dias, estado_mora: 'Mora Tardia' });
  return { solId: sol.id };
}
async function limpiaCuenta(codsol, cod) {
  const { data: cc } = await sb.from('cmac_cuentas_credito').select('id').eq('codcuentacredito', cod).maybeSingle();
  if (cc) { await sb.from('cmac_gestion_cobranza').delete().eq('cuenta_credito_id', cc.id); await sb.from('cmac_cuentas_credito').delete().eq('id', cc.id); }
  const { data: s } = await sb.from('cmac_solicitudes').select('id').eq('codsolicitud', codsol).maybeSingle();
  if (s) await sb.from('cmac_solicitudes').delete().eq('id', s.id);
}

const ts = Date.now().toString(36);
const J = { sol: `sol-mj-${ts}`, cod: `ccr-mj-${ts}` };   // judicial (dias 130)
const C = { sol: `sol-mc-${ts}`, cod: `ccr-mc-${ts}` };   // castigo (dias 200)

try {
  // ---------- clasificarBanda: casos límite ----------
  console.log('\nclasificarBanda (casos límite):');
  const esperado = { 0: 'Vigente', 7: 'Mora Preventiva', 8: 'Mora Temprana', 30: 'Mora Temprana', 31: 'Mora Tardia', 120: 'Mora Tardia', 121: 'Judicial', 180: 'Judicial', 181: 'Castigado' };
  for (const [dias, banda] of Object.entries(esperado)) {
    let got; try { got = clasificarBanda(Number(dias)); assert.equal(got, banda); t(true, `${dias} días → ${banda}`); }
    catch { t(false, `${dias} días → esperado ${banda}, obtuvo ${got}`); }
  }

  // ---------- Tokens ----------
  const admin = (await login('11111112')).data.token;   // administrador
  const comite = (await login('11111115')).data.token;  // comite
  const asesor = (await login('11111111')).data.token;  // asesor

  // ---------- KPIs (~13%) ----------
  console.log('\nKPIs de mora:');
  const kpis = (await api('GET', '/mora/kpis', asesor)).data;
  t(Math.abs(kpis.ratioMoraPct - 13) < 1.5, `ratio de mora = ${kpis.ratioMoraPct}% (~13%)`);
  t(kpis.saldoTotal > 0, `saldo total = ${kpis.saldoTotal}`);

  // ---------- R2: registrar gestión ----------
  console.log('\nGestión de cobranza (R2):');
  await seedCuenta(J.sol, J.cod, 130);
  const g = await api('POST', `/mora/${J.cod}/gestion`, asesor, { tipo_gestion: 'llamada', observacion: 'Cliente promete pagar' });
  t(g.status === 201, 'asesor registra gestión → 201');
  const hist = await api('GET', `/mora/${J.cod}/gestiones`, asesor);
  t(hist.status === 200 && hist.data.length >= 1, `historial tiene ${hist.data.length} gestión(es)`);

  // ---------- R3: derivar a judicial (umbral + rol) ----------
  console.log('\nDerivar a judicial (R3):');
  t((await api('POST', `/mora/${J.cod}/judicial`, asesor)).status === 403, 'asesor → judicial → 403 (rol)');
  const jOk = await api('POST', `/mora/${J.cod}/judicial`, admin);
  t(jOk.status === 200 && jOk.data.cuenta?.flag_judicial === true && jOk.data.cuenta?.estado_mora === 'Judicial', 'administrador + 130 días → judicial 200 (flag+estado)');

  // umbral: una cuenta con <121 días no puede ir a judicial
  await seedCuenta(`${J.sol}-b`, `${J.cod}-b`, 100);
  t((await api('POST', `/mora/${J.cod}-b/judicial`, admin)).status === 422, 'administrador + 100 días → 422 (umbral)');

  // ---------- R3: castigar (umbral + rol) ----------
  console.log('\nCastigar crédito (R3):');
  await seedCuenta(C.sol, C.cod, 200);
  t((await api('POST', `/mora/${C.cod}/castigar`, admin)).status === 403, 'administrador → castigar → 403 (rol: solo comité)');
  const cOk = await api('POST', `/mora/${C.cod}/castigar`, comite);
  t(cOk.status === 200 && cOk.data.cuenta?.flag_castigado === true && cOk.data.cuenta?.estado_mora === 'Castigado', 'comité + 200 días → castigo 200 (flag+estado)');
  // umbral: <=180 no se puede castigar
  await seedCuenta(`${C.sol}-b`, `${C.cod}-b`, 150);
  t((await api('POST', `/mora/${C.cod}-b/castigar`, comite)).status === 422, 'comité + 150 días → 422 (umbral)');
} catch (e) {
  console.error('ERROR:', e.message); total++;
} finally {
  await limpiaCuenta(J.sol, J.cod);
  await limpiaCuenta(`${J.sol}-b`, `${J.cod}-b`);
  await limpiaCuenta(C.sol, C.cod);
  await limpiaCuenta(`${C.sol}-b`, `${C.cod}-b`);
  console.log(`\n${ok}/${total} OK ${ok === total ? '✓' : '✗'}`);
  process.exit(ok === total ? 0 : 1);
}
