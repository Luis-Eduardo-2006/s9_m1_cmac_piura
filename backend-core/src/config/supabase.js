const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// El CORE usa preferentemente la service_role key: el personal del banco no es
// usuario de Supabase Auth, por lo que no hay auth.uid() y las políticas RLS no
// aplicarían. La service_role hace bypass de RLS (backend de confianza). El RBAC
// fino por rol se implementa en P4.
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!process.env.SUPABASE_SERVICE_KEY) {
  console.warn(
    '[backend-core] AVISO: SUPABASE_SERVICE_KEY no está definido; usando anon key. ' +
    'Las escrituras del Core fallarán por RLS. Configura la service_role en .env.'
  );
}

const supabase = createClient(process.env.SUPABASE_URL, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

module.exports = supabase;
