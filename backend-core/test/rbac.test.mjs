// =====================================================================
// Tests de RBAC + JWT (P4). Integración: requiere el backend-core corriendo
// (:3001) y las variables de .env (service_role + anon). Siembra/limpia sus
// propios datos.  ->  npm run test:rbac
// =====================================================================
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

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
const login = (numerodni, password) => api('POST', '/auth/login', null, { numerodni, password });

const email = `rbac_${Date.now().toString(36)}@cmac.test`;
const password = 'test-1234';
let userId = null, cod = null;

try {
  // --- LOGIN (bcrypt) ---
  console.log('\nLogin (bcrypt):');
  const okLogin = await login('11111111', '11111111');   // DNI = contraseña (dev)
  t(okLogin.status === 200 && !!okLogin.data.token, 'login DNI correcto → 200 + JWT');
  const badLogin = await login('11111111', 'clave-mala');
  t(badLogin.status === 401, 'login con contraseña errónea → 401');

  const asesorTok = okLogin.data.token;
  const comiteTok = (await login('11111115', '11111115')).data.token;
  t(!!comiteTok, 'login comité (11111115) → 200 + JWT');

  // --- Semilla: una solicitud en 'En Comite' para probar resolver ---
  const { data: cli } = await sb.from('cmac_clientes').select('id').eq('codcliente', 'cli000001').maybeSingle();
  const { data: prod } = await sb.from('cmac_productos').select('id').eq('codigo', 'EMP').maybeSingle();
  cod = `sol-rbac-${Date.now().toString(36)}`;
  await sb.from('cmac_solicitudes').insert({
    codsolicitud: cod, cliente_id: cli.id, producto_id: prod.id, estado: 'En Comite',
    monto_solicitado: 10000, plazo_meses: 12, con_desgravamen: false,
  });

  // --- MATRIZ DE ROLES ---
  console.log('\nMatriz de roles:');
  const aResolver = await api('POST', `/solicitudes/${cod}/resolver`, asesorTok, { resultado: 'APROBADO', montoAprobado: 10000 });
  t(aResolver.status === 403, 'asesor → resolver comité → 403');

  const aJudicial = await api('POST', `/solicitudes/${cod}/judicial`, asesorTok, {});
  t(aJudicial.status === 403, 'asesor → derivar judicial → 403');

  const cResolver = await api('POST', `/solicitudes/${cod}/resolver`, comiteTok, { resultado: 'APROBADO', montoAprobado: 10000 });
  t(cResolver.status === 200 && cResolver.data.solicitud?.estado === 'Aprobado', 'comité → resolver comité → 200 (Aprobado)');

  // --- SEPARACIÓN DE TOKENS: un token de CLIENTE del HB no vale en el Core ---
  console.log('\nSeparación de tokens cliente/personal:');
  const { data: created } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
  userId = created.user.id;
  const anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, { auth: { persistSession: false } });
  const { data: sesion } = await anon.auth.signInWithPassword({ email, password });
  const clienteTok = sesion.session.access_token;
  const conCliente = await api('GET', '/solicitudes', clienteTok);
  t(conCliente.status === 401, 'token de cliente (HB) en el Core → 401');

  const sinToken = await api('GET', '/solicitudes', null);
  t(sinToken.status === 401, 'sin token → 401');
} catch (e) {
  console.error('ERROR:', e.message); total++;
} finally {
  if (cod) await sb.from('cmac_solicitudes').delete().eq('codsolicitud', cod);
  if (userId) await sb.auth.admin.deleteUser(userId);
  console.log(`\n${ok}/${total} OK ${ok === total ? '✓' : '✗'}`);
  process.exit(ok === total ? 0 : 1);
}
