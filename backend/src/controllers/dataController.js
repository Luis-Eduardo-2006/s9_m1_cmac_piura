const { createClient } = require('@supabase/supabase-js');

function clienteParaUsuario(token) {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

async function listarCuentas(req, res) {
  const supabase = clienteParaUsuario(req.token);

  const { data: cuentas, error } = await supabase
    .from('cmac_cuentas')
    .select('*')
    .order('orden', { ascending: true });

  if (error) {
    console.error('[listarCuentas]', error.message);
    return res.status(500).json({ message: 'Error al obtener las cuentas. Intenta más tarde.' });
  }

  // Reflejar los créditos desembolsados del cliente (RLS filtra por dueño).
  const { data: creditos, error: errCred } = await supabase
    .from('cmac_cuentas_credito')
    .select('id, codcuentacredito, saldo_capital, estado_mora, desembolsado_en')
    .order('desembolsado_en', { ascending: false });

  if (errCred) {
    console.error('[listarCuentas/creditos]', errCred.message);
    return res.json(cuentas); // degradación suave: al menos las cuentas normales
  }

  const cuentasCredito = (creditos || []).map((c) => ({
    id: c.id,
    label: `Crédito ${c.codcuentacredito}`,
    saldo: c.saldo_capital,
    sub: `Saldo capital · ${c.estado_mora}`,
    color: '#004A9F',
    icono: 'fa-hand-holding-dollar',
    orden: 999,
    tipo: 'credito',
  }));

  res.json([...(cuentas || []), ...cuentasCredito]);
}

async function listarMovimientos(req, res) {
  const supabase = clienteParaUsuario(req.token);

  const { data: movimientos, error } = await supabase
    .from('cmac_movimientos')
    .select('*')
    .order('fecha', { ascending: false });

  if (error) {
    console.error('[listarMovimientos]', error.message);
    return res.status(500).json({ message: 'Error al obtener los movimientos. Intenta más tarde.' });
  }

  // Reflejar operaciones de crédito (Desembolso / Pago Cuota) como movimientos.
  const { data: operaciones, error: errOps } = await supabase
    .from('cmac_operaciones')
    .select('id, tipo, monto, fecha')
    .order('fecha', { ascending: false });

  if (errOps) {
    console.error('[listarMovimientos/operaciones]', errOps.message);
    return res.json(movimientos);
  }

  const opsComoMovimientos = (operaciones || []).map((o) => ({
    id: o.id,
    fecha: o.fecha,
    descripcion: o.tipo === 'Desembolso' ? 'Desembolso de crédito' : 'Pago de cuota de crédito',
    tipo: o.tipo === 'Desembolso' ? 'entrada' : 'salida',
    monto: o.monto,
  }));

  const todos = [...(movimientos || []), ...opsComoMovimientos].sort(
    (a, b) => new Date(b.fecha) - new Date(a.fecha)
  );

  res.json(todos);
}

module.exports = { listarCuentas, listarMovimientos };
