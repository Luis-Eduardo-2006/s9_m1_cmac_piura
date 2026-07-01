// =====================================================================
// productoRepository.js — Acceso a cmac_productos (tarifario)
// Usa el cliente Supabase compartido (config/supabase.js).
// =====================================================================
const supabase = require('../config/supabase');

// Devuelve el producto del tarifario por su código (EMP | CON), o null si
// no existe. Incluye las dos TEA y los límites de monto.
async function getProductoPorCodigo(codigo) {
  const { data, error } = await supabase
    .from('cmac_productos')
    .select('codigo, tea_con_desgravamen, tea_sin_desgravamen, monto_min, monto_max')
    .eq('codigo', codigo)
    .maybeSingle();

  if (error) throw error;
  return data;
}

module.exports = { getProductoPorCodigo };
