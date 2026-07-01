const supabase = require('../config/supabase');

const COLS = 'id, codigo, nombre, tea_con_desgravamen, tea_sin_desgravamen, monto_min, monto_max';

async function getProductoPorId(id) {
  const { data, error } = await supabase
    .from('cmac_productos')
    .select(COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getProductoPorCodigo(codigo) {
  const { data, error } = await supabase
    .from('cmac_productos')
    .select(COLS)
    .eq('codigo', codigo)
    .maybeSingle();
  if (error) throw error;
  return data;
}

module.exports = { getProductoPorId, getProductoPorCodigo };
