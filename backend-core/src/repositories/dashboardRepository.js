const supabase = require('../config/supabase');

// Cuentas de crédito con su cliente y su producto (vía la solicitud).
async function getCuentasConProducto() {
  const { data, error } = await supabase
    .from('cmac_cuentas_credito')
    .select(`
      id, codcuentacredito, saldo_capital, monto_desembolsado, dias_atraso,
      estado_mora, flag_judicial, flag_castigado, cliente_id,
      cmac_clientes ( codcliente, nombre ),
      cmac_solicitudes ( cmac_productos ( codigo, nombre ) )
    `);
  if (error) throw error;
  return data || [];
}

// Operaciones de desembolso (para la evolución por mes).
async function getDesembolsos() {
  const { data, error } = await supabase
    .from('cmac_operaciones')
    .select('monto, fecha')
    .eq('tipo', 'Desembolso');
  if (error) throw error;
  return data || [];
}

module.exports = { getCuentasConProducto, getDesembolsos };
