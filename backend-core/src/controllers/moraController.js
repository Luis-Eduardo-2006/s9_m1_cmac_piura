const repo = require('../repositories/moraRepository');
const mora = require('../services/moraService');
const { sanitizarTexto } = require('../lib/sanitize');

const round2 = (x) => Math.round(x * 100) / 100;
const TIPOS_GESTION = ['llamada', 'visita', 'SMS', 'compromiso'];

// Enriquece una cuenta con su banda calculada (fuente única de verdad).
function conBanda(c) {
  return {
    codcuentacredito: c.codcuentacredito,
    cliente: c.cmac_clientes?.nombre || null,
    codcliente: c.cmac_clientes?.codcliente || null,
    saldo_capital: Number(c.saldo_capital),
    dias_atraso: c.dias_atraso,
    banda: mora.clasificarBanda(c.dias_atraso, c),
    estado_mora: c.estado_mora,
    flag_judicial: c.flag_judicial,
    flag_castigado: c.flag_castigado,
  };
}

// GET /api/core/mora/cartera?banda=  — cartera en mora (dias_atraso >= 1).
async function cartera(req, res) {
  try {
    const filtroBanda = req.query.banda;
    const cartera = (await repo.getTodas())
      .map(conBanda)
      .filter((c) => mora.esMora(c.banda))
      .filter((c) => !filtroBanda || c.banda === filtroBanda);
    return res.json(cartera);
  } catch (error) {
    console.error('[mora/cartera]', error.message);
    return res.status(500).json({ message: 'No se pudo obtener la cartera en mora.' });
  }
}

// GET /api/core/mora/kpis  — totales, ratio de mora y desglose por banda.
async function kpis(req, res) {
  try {
    const todas = (await repo.getTodas()).map(conBanda);
    const saldoTotal = todas.reduce((s, c) => s + c.saldo_capital, 0);
    const saldoMora = todas.filter((c) => mora.esNPL(c.banda)).reduce((s, c) => s + c.saldo_capital, 0);

    const porBanda = {};
    for (const b of mora.BANDAS) porBanda[b] = { conteo: 0, saldo: 0 };
    for (const c of todas) { porBanda[c.banda].conteo += 1; porBanda[c.banda].saldo = round2(porBanda[c.banda].saldo + c.saldo_capital); }

    return res.json({
      totalCreditos: todas.length,
      saldoTotal: round2(saldoTotal),
      saldoMora: round2(saldoMora),
      ratioMoraPct: saldoTotal > 0 ? round2((saldoMora / saldoTotal) * 100) : 0,   // divide seguro
      porBanda,
    });
  } catch (error) {
    console.error('[mora/kpis]', error.message);
    return res.status(500).json({ message: 'No se pudieron calcular los KPIs de mora.' });
  }
}

// POST /api/core/mora/:cod/gestion — registra una gestión de cobranza (roles gestores).
async function registrarGestion(req, res) {
  try {
    const { tipo_gestion, observacion, compromiso_pago } = req.body || {};
    if (!TIPOS_GESTION.includes(tipo_gestion)) {
      return res.status(400).json({ message: `tipo_gestion debe ser uno de: ${TIPOS_GESTION.join(', ')}.` });
    }
    const cuenta = await repo.getCuentaPorCod(req.params.cod);
    if (!cuenta) return res.status(404).json({ message: 'Cuenta de crédito no encontrada.' });

    const gestion = await repo.crearGestion({
      cuenta_credito_id: cuenta.id,
      gestor_id: req.personal.id,
      banda: mora.clasificarBanda(cuenta.dias_atraso, cuenta),
      tipo_gestion,
      observacion: sanitizarTexto(observacion) || null,   // XSS: sin tags HTML
      compromiso_pago: compromiso_pago || null,
    });
    return res.status(201).json({ ok: true, gestion });
  } catch (error) {
    console.error('[mora/gestion]', error.message);
    return res.status(500).json({ message: 'No se pudo registrar la gestión.' });
  }
}

// GET /api/core/mora/:cod/gestiones — historial cronológico.
async function listarGestiones(req, res) {
  try {
    const cuenta = await repo.getCuentaPorCod(req.params.cod);
    if (!cuenta) return res.status(404).json({ message: 'Cuenta de crédito no encontrada.' });
    return res.json(await repo.getGestiones(cuenta.id));
  } catch (error) {
    console.error('[mora/gestiones]', error.message);
    return res.status(500).json({ message: 'No se pudo obtener el historial de gestiones.' });
  }
}

// POST /api/core/mora/:cod/judicial — derivar a judicial (rol administrador, dias >= 121).
async function derivarJudicial(req, res) {
  try {
    const cuenta = await repo.getCuentaPorCod(req.params.cod);
    if (!cuenta) return res.status(404).json({ message: 'Cuenta de crédito no encontrada.' });
    if (cuenta.dias_atraso < mora.UMBRAL_JUDICIAL) {
      return res.status(422).json({ message: `No se puede derivar a judicial: requiere ≥ ${mora.UMBRAL_JUDICIAL} días de atraso (tiene ${cuenta.dias_atraso}).` });
    }
    const { data, error } = await repo.derivarJudicialRpc(req.params.cod, req.personal.id, sanitizarTexto(req.body?.observacion));
    if (error) {
      console.error('[mora/judicial/rpc]', error.message);
      if ((error.message || '').includes('UMBRAL_NO_CUMPLIDO')) return res.status(422).json({ message: 'No cumple el umbral de días para judicial.' });
      if (error.code === 'PGRST202' || /function .* does not exist/i.test(error.message || '')) return res.status(500).json({ message: 'Falta ejecutar backend/db/12_fn_mora.sql en Supabase.' });
      return res.status(500).json({ message: 'No se pudo derivar a judicial.' });
    }
    return res.json({ ok: true, cuenta: data });
  } catch (error) {
    console.error('[mora/judicial]', error.message);
    return res.status(500).json({ message: 'No se pudo derivar a judicial.' });
  }
}

// POST /api/core/mora/:cod/castigar — castigar crédito (rol comite, dias > 180).
async function castigar(req, res) {
  try {
    const cuenta = await repo.getCuentaPorCod(req.params.cod);
    if (!cuenta) return res.status(404).json({ message: 'Cuenta de crédito no encontrada.' });
    if (cuenta.dias_atraso <= mora.UMBRAL_CASTIGO) {
      return res.status(422).json({ message: `No se puede castigar: requiere > ${mora.UMBRAL_CASTIGO} días de atraso (tiene ${cuenta.dias_atraso}).` });
    }
    const { data, error } = await repo.castigarRpc(req.params.cod, req.personal.id, sanitizarTexto(req.body?.observacion));
    if (error) {
      console.error('[mora/castigar/rpc]', error.message);
      if ((error.message || '').includes('UMBRAL_NO_CUMPLIDO')) return res.status(422).json({ message: 'No cumple el umbral de días para castigo.' });
      if (error.code === 'PGRST202' || /function .* does not exist/i.test(error.message || '')) return res.status(500).json({ message: 'Falta ejecutar backend/db/12_fn_mora.sql en Supabase.' });
      return res.status(500).json({ message: 'No se pudo castigar el crédito.' });
    }
    return res.json({ ok: true, cuenta: data });
  } catch (error) {
    console.error('[mora/castigar]', error.message);
    return res.status(500).json({ message: 'No se pudo castigar el crédito.' });
  }
}

module.exports = { cartera, kpis, registrarGestion, listarGestiones, derivarJudicial, castigar };
