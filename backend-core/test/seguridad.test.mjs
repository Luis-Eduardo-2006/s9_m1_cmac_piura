// =====================================================================
// Tests de ciberseguridad S14 (integración). Requiere AMBOS backends corriendo
// (:3000 HB, :3001 Core) + .env con service_role. Cubre: IDOR, fuerza bruta en
// los dos logins, no filtración de stack trace, y sanitización XSS.
//   ->  npm run test:seguridad
// =====================================================================
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const HB = 'http://localhost:3000/api';
const CORE = 'http://localhost:3001/api/core';

let ok = 0, total = 0;
const t = (cond, label) => { total++; if (cond) ok++; console.log(`  ${cond ? '✓' : '✗'} ${label}`); };
async function api(base, method, path, token, body) {
  const res = await fetch(`${base}${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

const ts = Date.now().toString(36);
const A = { email: `idor_a_${ts}@cmac.test`, pass: 'test-1234', uid: null, cod: null };
const B = { email: `idor_b_${ts}@cmac.test`, pass: 'test-1234', uid: null, cod: null };
let gestionXssId = null;

try {
  // ---------- IDOR (Homebanking) ----------
  console.log('\nIDOR — un cliente no ve recursos de otro:');
  A.uid = (await sb.auth.admin.createUser({ email: A.email, password: A.pass, email_confirm: true })).data.user.id;
  B.uid = (await sb.auth.admin.createUser({ email: B.email, password: B.pass, email_confirm: true })).data.user.id;
  await sb.from('cmac_clientes').update({ auth_user_id: A.uid }).eq('codcliente', 'cli000001');
  await sb.from('cmac_clientes').update({ auth_user_id: B.uid }).eq('codcliente', 'cli000002');

  const tokA = (await api(HB, 'POST', '/auth/login', null, { email: A.email, password: A.pass })).data.token;
  const tokB = (await api(HB, 'POST', '/auth/login', null, { email: B.email, password: B.pass })).data.token;
  A.cod = (await api(HB, 'POST', '/hb/solicitar', tokA, { productoCodigo: 'EMP', monto: 6000, plazoMeses: 12 })).data.codsolicitud;
  B.cod = (await api(HB, 'POST', '/hb/solicitar', tokB, { productoCodigo: 'EMP', monto: 7000, plazoMeses: 12 })).data.codsolicitud;

  const misA = await api(HB, 'GET', '/hb/mis-solicitudes', tokA);
  const codsA = (misA.data || []).map((s) => s.codsolicitud);
  t(codsA.includes(A.cod), 'cliente A ve su propia solicitud');
  t(!codsA.includes(B.cod), 'cliente A NO ve la solicitud de B (RLS por auth.uid())');

  // ---------- Fuerza bruta (ambos logins) ----------
  console.log('\nFuerza bruta — rate limiting 429:');
  let hb429 = false;
  for (let i = 0; i < 8 && !hb429; i++) {
    if ((await api(HB, 'POST', '/auth/login', null, { email: `bruta_${ts}@x.com`, password: 'mala' })).status === 429) hb429 = true;
  }
  t(hb429, 'HB login → 429 tras varios intentos fallidos');

  let core429 = false;
  for (let i = 0; i < 8 && !core429; i++) {
    if ((await api(CORE, 'POST', '/auth/login', null, { numerodni: '90000001', password: 'mala' })).status === 429) core429 = true;
  }
  t(core429, 'Core login → 429 tras varios intentos fallidos');

  // ---------- Sin filtración de stack trace ----------
  console.log('\nManejo de errores — sin stack trace:');
  const err401 = await api(HB, 'GET', '/hb/mis-solicitudes', 'token.malformado.xyz');
  const cuerpo = JSON.stringify(err401.data);
  t(err401.status === 401 && typeof err401.data.message === 'string' && !('stack' in err401.data), 'error 401 devuelve solo {message}');
  t(!/\bat \/|\.js:\d+|Error:/.test(cuerpo), 'el cuerpo del error no contiene stack trace/rutas');

  // ---------- XSS almacenado — sanitización ----------
  console.log('\nXSS — texto libre se sanitiza (sin <script>):');
  const asesor = (await api(CORE, 'POST', '/auth/login', null, { numerodni: '11111111', password: '11111111' })).data.token;
  const g = await api(CORE, 'POST', '/mora/ccr-seed-029/gestion', asesor, { tipo_gestion: 'llamada', observacion: '<script>alert(1)</script>Cliente pagará' });
  gestionXssId = g.data?.gestion?.id;
  const guardada = g.data?.gestion?.observacion || '';
  t(g.status === 201 && !/<script>/i.test(guardada) && guardada.includes('Cliente pagará'), `observación almacenada sin tags: "${guardada}"`);
} catch (e) {
  console.error('ERROR:', e.message); total++;
} finally {
  if (gestionXssId) await sb.from('cmac_gestion_cobranza').delete().eq('id', gestionXssId);
  for (const U of [A, B]) {
    if (U.cod) { const { data: s } = await sb.from('cmac_solicitudes').select('id').eq('codsolicitud', U.cod).maybeSingle(); if (s) await sb.from('cmac_solicitudes').delete().eq('id', s.id); }
  }
  await sb.from('cmac_clientes').update({ auth_user_id: null }).in('codcliente', ['cli000001', 'cli000002']);
  for (const U of [A, B]) if (U.uid) await sb.auth.admin.deleteUser(U.uid);
  console.log(`\n${ok}/${total} OK ${ok === total ? '✓' : '✗'}`);
  process.exit(ok === total ? 0 : 1);
}
