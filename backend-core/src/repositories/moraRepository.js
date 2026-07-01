const supabase = require('../config/supabase');

const SELECT_CUENTA = `
  id, codcuentacredito, saldo_capital, dias_atraso, estado_mora,
  flag_judicial, flag_castigado, desembolsado_en,
  cmac_clientes ( codcliente, nombre )
`;

// Todas las cuentas de crédito (para cartera + KPIs). Son ~34, no paginamos.
async function getTodas() {
  const { data, error } = await supabase
    .from('cmac_cuentas_credito')
    .select(SELECT_CUENTA)
    .order('dias_atraso', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function getCuentaPorCod(cod) {
  const { data, error } = await supabase
    .from('cmac_cuentas_credito')
    .select(SELECT_CUENTA)
    .eq('codcuentacredito', cod)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function crearGestion(row) {
  const { data, error } = await supabase
    .from('cmac_gestion_cobranza')
    .insert(row)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getGestiones(cuentaId) {
  const { data, error } = await supabase
    .from('cmac_gestion_cobranza')
    .select('id, banda, tipo_gestion, observacion, compromiso_pago, fecha, gestor_id')
    .eq('cuenta_credito_id', cuentaId)
    .order('fecha', { ascending: true });   // cronológico
  if (error) throw error;
  return data || [];
}

// --- Transiciones atómicas vía RPC (backend/db/12_fn_mora.sql) ---
async function derivarJudicialRpc(cod, gestorId, observacion) {
  return supabase.rpc('cmac_derivar_judicial', {
    p_codcuenta: cod, p_gestor: gestorId, p_observacion: observacion || null,
  });
}
async function castigarRpc(cod, gestorId, observacion) {
  return supabase.rpc('cmac_castigar_credito', {
    p_codcuenta: cod, p_gestor: gestorId, p_observacion: observacion || null,
  });
}

module.exports = {
  getTodas, getCuentaPorCod, crearGestion, getGestiones, derivarJudicialRpc, castigarRpc,
};
