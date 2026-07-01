const supabase = require('../config/supabase');

// Personal por DNI (para el login del Core).
async function getPorDni(numerodni) {
  const { data, error } = await supabase
    .from('cmac_personal')
    .select('id, numerodni, nombre, rol, activo, password_hash')
    .eq('numerodni', numerodni)
    .maybeSingle();
  if (error) throw error;
  return data;
}

module.exports = { getPorDni };
