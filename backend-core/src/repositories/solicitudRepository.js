const supabase = require('../config/supabase');

// Solicitud + datos del cliente y del producto (para bandeja/detalle).
const SELECT_JOIN = `
  id, codsolicitud, estado, monto_solicitado, monto_aprobado, plazo_meses,
  con_desgravamen, scoring, rds, semaforo, motivo_rechazo, nivel_aprobacion_id, creada_en,
  cliente_id, producto_id,
  cmac_clientes ( id, codcliente, nombre, ingreso_neto, es_sujeto_credito ),
  cmac_productos ( codigo, nombre )
`;

async function listar() {
  const { data, error } = await supabase
    .from('cmac_solicitudes')
    .select(SELECT_JOIN)
    .order('creada_en', { ascending: false });
  if (error) throw error;
  return data;
}

async function getPorCod(cod) {
  const { data, error } = await supabase
    .from('cmac_solicitudes')
    .select(SELECT_JOIN)
    .eq('codsolicitud', cod)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function actualizar(cod, patch) {
  const { data, error } = await supabase
    .from('cmac_solicitudes')
    .update(patch)
    .eq('codsolicitud', cod)
    .select(SELECT_JOIN)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function actualizarIngresoCliente(clienteId, ingresoNeto) {
  const { error } = await supabase
    .from('cmac_clientes')
    .update({ ingreso_neto: ingresoNeto })
    .eq('id', clienteId);
  if (error) throw error;
}

async function crearEvaluacion(row) {
  const { data, error } = await supabase
    .from('cmac_evaluaciones')
    .insert(row)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getEvaluaciones(solicitudId) {
  const { data, error } = await supabase
    .from('cmac_evaluaciones')
    .select('*')
    .eq('solicitud_id', solicitudId);
  if (error) throw error;
  return data || [];
}

// --- Ruta de aprobación / opiniones (P3) ---

async function getNivelPorMonto(monto) {
  const { data, error } = await supabase
    .from('cmac_niveles_aprobacion')
    .select('id, nombre, monto_minimo, monto_maximo, requiere_opinion')
    .lte('monto_minimo', monto)
    .gt('monto_maximo', monto)
    .order('monto_minimo', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getOpiniones(solicitudId) {
  const { data, error } = await supabase
    .from('cmac_opiniones')
    .select('*')
    .eq('solicitud_id', solicitudId);
  if (error) throw error;
  return data || [];
}

// Emitir/actualizar la opinión de un rol para una solicitud. Devuelve la fila
// actualizada, o null si no había una opinión pendiente de ese rol.
async function actualizarOpinion(solicitudId, rolOpinion, patch) {
  const { data, error } = await supabase
    .from('cmac_opiniones')
    .update({ ...patch, fecha: new Date().toISOString() })
    .eq('solicitud_id', solicitudId)
    .eq('rol_opinion', rolOpinion)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function crearOpiniones(rows) {
  if (!rows.length) return [];
  const { data, error } = await supabase
    .from('cmac_opiniones')
    .upsert(rows, { onConflict: 'solicitud_id,rol_opinion', ignoreDuplicates: true })
    .select();
  if (error) throw error;
  return data;
}

// --- Desembolso ATÓMICO vía RPC (P3) ---
// Llama a la función plpgsql cmac_desembolsar_credito (backend/db/10_fn_desembolsar.sql),
// que hace los 4 escritos + update de estado en UNA transacción (todo-o-nada).
async function desembolsarAtomico({ solicitudId, codcuentacredito, clienteId, monto, plan }) {
  const { data, error } = await supabase.rpc('cmac_desembolsar_credito', {
    p_solicitud_id: solicitudId,
    p_codcuentacredito: codcuentacredito,
    p_cliente_id: clienteId,
    p_monto: monto,
    p_plan: plan,
  });
  return { data, error };
}

module.exports = {
  listar,
  getPorCod,
  actualizar,
  actualizarIngresoCliente,
  crearEvaluacion,
  getEvaluaciones,
  getNivelPorMonto,
  getOpiniones,
  crearOpiniones,
  actualizarOpinion,
  desembolsarAtomico,
};
