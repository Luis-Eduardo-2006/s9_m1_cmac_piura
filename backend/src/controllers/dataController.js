const { createClient } = require('@supabase/supabase-js');

function clienteParaUsuario(token) {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

async function listarCuentas(req, res) {
  const supabase = clienteParaUsuario(req.token);
  const { data, error } = await supabase
    .from('cmac_cuentas')
    .select('*')
    .order('orden', { ascending: true });

  if (error) {
    console.error('[listarCuentas]', error.message);
    return res.status(500).json({ message: 'Error al obtener las cuentas. Intenta más tarde.' });
  }
  res.json(data);
}

async function listarMovimientos(req, res) {
  const supabase = clienteParaUsuario(req.token);
  const { data, error } = await supabase
    .from('cmac_movimientos')
    .select('*')
    .order('fecha', { ascending: false });

  if (error) {
    console.error('[listarMovimientos]', error.message);
    return res.status(500).json({ message: 'Error al obtener los movimientos. Intenta más tarde.' });
  }
  res.json(data);
}

module.exports = { listarCuentas, listarMovimientos };
