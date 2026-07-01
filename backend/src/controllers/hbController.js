const { createClient } = require('@supabase/supabase-js');

// Cliente Supabase por request con el token del usuario → aplica RLS por usuario
// (mismo patrón que dataController).
function clienteParaUsuario(token) {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

// Resuelve el cmac_clientes vinculado al usuario autenticado (auth_user_id).
async function resolverCliente(supabase, authUserId) {
  const { data, error } = await supabase
    .from('cmac_clientes')
    .select('id, codcliente, nombre')
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// POST /api/hb/solicitar — el cliente autenticado solicita un crédito.
async function solicitar(req, res) {
  try {
    const supabase = clienteParaUsuario(req.token);

    const cliente = await resolverCliente(supabase, req.user.id);
    if (!cliente) {
      return res.status(409).json({
        message: 'Tu usuario no está vinculado a un cliente del banco. Vincula el cliente (ver docs/CASOS_PRUEBA_HB_CORE.md).',
      });
    }

    const { productoCodigo = 'EMP', monto, plazoMeses, conDesgravamen = false } = req.body || {};
    const m = Number(monto);
    const n = Number(plazoMeses);
    if (!Number.isFinite(m) || m <= 0) {
      return res.status(400).json({ message: 'El monto debe ser mayor a 0.' });
    }
    if (!Number.isInteger(n) || n <= 0) {
      return res.status(400).json({ message: 'El plazo en meses debe ser un entero mayor a 0.' });
    }

    const { data: producto, error: errProd } = await supabase
      .from('cmac_productos')
      .select('id, codigo')
      .eq('codigo', productoCodigo)
      .maybeSingle();
    if (errProd) throw errProd;
    if (!producto) return res.status(404).json({ message: 'Producto de crédito no encontrado.' });

    const codsolicitud = `sol-${Date.now().toString(36)}`;
    const { data, error } = await supabase
      .from('cmac_solicitudes')
      .insert({
        codsolicitud,
        cliente_id: cliente.id,
        producto_id: producto.id,
        estado: 'En Evaluacion',
        monto_solicitado: m,
        plazo_meses: n,
        con_desgravamen: !!conDesgravamen,
      })
      .select('codsolicitud, estado')
      .maybeSingle();
    if (error) throw error;

    return res.status(201).json(data);
  } catch (error) {
    console.error('[hb/solicitar]', error.message);
    return res.status(500).json({ message: 'No se pudo registrar la solicitud. Intenta más tarde.' });
  }
}

// GET /api/hb/mis-solicitudes — estado de las solicitudes del cliente autenticado.
async function misSolicitudes(req, res) {
  try {
    const supabase = clienteParaUsuario(req.token);
    const { data, error } = await supabase
      .from('cmac_solicitudes')
      .select('codsolicitud, estado, monto_solicitado, monto_aprobado, plazo_meses, con_desgravamen, creada_en, cmac_productos(codigo, nombre)')
      .order('creada_en', { ascending: false });
    if (error) throw error;
    return res.json(data);
  } catch (error) {
    console.error('[hb/mis-solicitudes]', error.message);
    return res.status(500).json({ message: 'No se pudieron obtener tus solicitudes.' });
  }
}

module.exports = { solicitar, misSolicitudes };
