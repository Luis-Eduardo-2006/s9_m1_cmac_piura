const repo = require('../repositories/solicitudRepository');
const { getProductoPorId } = require('../repositories/productoRepository');
const { calcularCuota, generarCronograma } = require('../services/amortizacionService');
const { transicionValida, sumarMesesISO, primeraFechaPagoISO } = require('../services/flujoService');
const { evaluarElegibilidad } = require('../services/reglasCreditoService');
const evaluacionService = require('../services/evaluacionService');
const { opinionesRequeridas } = require('../services/rutaAprobacionService');
const { sanitizarTexto } = require('../lib/sanitize');

function estadoInvalido(res, estadoActual, accion) {
  return res.status(409).json({
    message: `Transición inválida: no se puede "${accion}" una solicitud en estado "${estadoActual}".`,
  });
}

// GET /api/core/solicitudes — bandeja.
async function listar(req, res) {
  try {
    return res.json(await repo.listar());
  } catch (error) {
    console.error('[core/listar]', error.message);
    return res.status(500).json({ message: 'No se pudo obtener la bandeja de solicitudes.' });
  }
}

// GET /api/core/solicitudes/:cod — detalle.
async function detalle(req, res) {
  try {
    const solicitud = await repo.getPorCod(req.params.cod);
    if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada.' });
    const [evaluaciones, opiniones] = await Promise.all([
      repo.getEvaluaciones(solicitud.id),
      repo.getOpiniones(solicitud.id),
    ]);
    return res.json({ ...solicitud, evaluaciones, opiniones });
  } catch (error) {
    console.error('[core/detalle]', error.message);
    return res.status(500).json({ message: 'No se pudo obtener la solicitud.' });
  }
}

// POST /api/core/solicitudes/:cod/ingresos — registra ingreso del cliente.
async function registrarIngresos(req, res) {
  try {
    const { ingresoNeto } = req.body || {};
    const ingreso = Number(ingresoNeto);
    if (!Number.isFinite(ingreso) || ingreso <= 0) {
      return res.status(400).json({ message: 'El ingreso neto debe ser mayor a 0.' });
    }
    const solicitud = await repo.getPorCod(req.params.cod);
    if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada.' });
    if (!transicionValida('ingresos', solicitud.estado)) {
      return estadoInvalido(res, solicitud.estado, 'registrar ingresos');
    }
    await repo.actualizarIngresoCliente(solicitud.cliente_id, ingreso);
    return res.json({ ok: true, clienteId: solicitud.cliente_id, ingresoNeto: ingreso });
  } catch (error) {
    console.error('[core/ingresos]', error.message);
    return res.status(500).json({ message: 'No se pudieron registrar los ingresos.' });
  }
}

// POST /api/core/solicitudes/:cod/evaluacion — elegibilidad + RDS/semáforo/scoring.
async function evaluar(req, res) {
  try {
    const { ingresoDisponible, gastoFamiliar = 0, tipo = 'ME', observacion } = req.body || {};

    const solicitud = await repo.getPorCod(req.params.cod);
    if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada.' });
    if (!transicionValida('evaluacion', solicitud.estado)) {
      return estadoInvalido(res, solicitud.estado, 'evaluar');
    }

    const producto = await getProductoPorId(solicitud.producto_id);

    // --- ELEGIBILIDAD (Criterio 2). Si no es elegible → Rechazado + 422. ---
    const eleg = evaluarElegibilidad({
      producto,
      cliente: solicitud.cmac_clientes,
      monto: solicitud.monto_solicitado,
      plazoMeses: solicitud.plazo_meses,
    });
    if (!eleg.elegible) {
      await repo.actualizar(req.params.cod, {
        estado: 'Rechazado',
        motivo_rechazo: `${eleg.codigo}: ${eleg.motivo}`,
      });
      return res.status(422).json({ message: eleg.motivo, codigo: eleg.codigo });
    }

    // Ingreso: el declarado en la evaluación, o el registrado del cliente.
    const ingresoNeto = Number(ingresoDisponible) || Number(solicitud.cmac_clientes?.ingreso_neto) || 0;
    if (ingresoNeto <= 0) {
      return res.status(400).json({ message: 'No hay ingreso del cliente; registra ingresos o envía ingresoDisponible.' });
    }

    // === TASA DEL TARIFARIO: cuota real con la TEA de cmac_productos ===
    const tea = Number(
      solicitud.con_desgravamen ? producto.tea_con_desgravamen : producto.tea_sin_desgravamen
    );
    const cuota = calcularCuota(solicitud.monto_solicitado, solicitud.plazo_meses, tea);

    // RDS + semáforo + scoring.
    const { rds, semaforo, scoring, capacidadPago } = evaluacionService.evaluar({
      cuota,
      ingresoNeto,
      monto: solicitud.monto_solicitado,
      plazoMeses: solicitud.plazo_meses,
      gastoFamiliar,
    });

    await repo.crearEvaluacion({
      solicitud_id: solicitud.id,
      tipo,
      ingreso_disponible: ingresoNeto,
      gasto_familiar: Number(gastoFamiliar) || 0,
      capacidad_pago: capacidadPago,
      observacion: sanitizarTexto(observacion) || `RDS=${rds} · ${semaforo} · scoring=${scoring}`,
    });

    const actualizada = await repo.actualizar(req.params.cod, { scoring, rds, semaforo });
    return res.json({ ok: true, cuota, rds, semaforo, scoring, capacidadPago, solicitud: actualizada });
  } catch (error) {
    console.error('[core/evaluacion]', error.message);
    return res.status(500).json({ message: 'No se pudo registrar la evaluación.' });
  }
}

// POST /api/core/solicitudes/:cod/comite — asigna nivel por monto + opiniones requeridas.
async function enviarAComite(req, res) {
  try {
    const solicitud = await repo.getPorCod(req.params.cod);
    if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada.' });
    if (!transicionValida('comite', solicitud.estado)) {
      return estadoInvalido(res, solicitud.estado, 'enviar a comité');
    }

    const evaluaciones = await repo.getEvaluaciones(solicitud.id);
    if (evaluaciones.length === 0) {
      return res.status(409).json({ message: 'Registra la evaluación antes de enviar a comité.' });
    }

    // RUTA DE APROBACIÓN POR MONTOS.
    const monto = Number(solicitud.monto_aprobado) || Number(solicitud.monto_solicitado);
    const nivel = await repo.getNivelPorMonto(monto);

    // Opiniones requeridas según el nivel (estructura lista; validación de rol en P4).
    let opiniones = [];
    if (nivel) {
      const roles = opinionesRequeridas(nivel.nombre);
      if (roles.length) {
        // TODO(P4): solo el rol correspondiente podrá emitir/resolver su opinión.
        opiniones = await repo.crearOpiniones(
          roles.map((rol) => ({ solicitud_id: solicitud.id, rol_opinion: rol, resultado: 'Pendiente' }))
        );
      }
    }

    const actualizada = await repo.actualizar(req.params.cod, {
      estado: 'En Comite',
      nivel_aprobacion_id: nivel ? nivel.id : null,
    });
    return res.json({ ok: true, nivel, opinionesRequeridas: opinionesRequeridas(nivel?.nombre), solicitud: actualizada });
  } catch (error) {
    console.error('[core/comite]', error.message);
    return res.status(500).json({ message: 'No se pudo enviar a comité.' });
  }
}

// POST /api/core/solicitudes/:cod/opinion — un rol de opinión emite su dictamen.
// Roles permitidos (guard en la ruta): administrador, jefe_regional, riesgos, analista.
async function opinar(req, res) {
  try {
    const { resultado, observacion } = req.body || {};
    if (!['Favorable', 'Desfavorable'].includes(resultado)) {
      return res.status(400).json({ message: 'resultado debe ser Favorable o Desfavorable.' });
    }
    const solicitud = await repo.getPorCod(req.params.cod);
    if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada.' });

    // La opinión que se emite corresponde al rol del personal autenticado.
    const opinion = await repo.actualizarOpinion(solicitud.id, req.personal.rol, { resultado, observacion: sanitizarTexto(observacion) || null });
    if (!opinion) {
      return res.status(409).json({ message: `No hay una opinión pendiente de tu rol (${req.personal.rol}) para esta solicitud.` });
    }
    return res.json({ ok: true, opinion });
  } catch (error) {
    console.error('[core/opinion]', error.message);
    return res.status(500).json({ message: 'No se pudo registrar la opinión.' });
  }
}

// POST /api/core/solicitudes/:cod/resolver — APROBADO | RECHAZADO.
async function resolver(req, res) {
  try {
    const { resultado, montoAprobado, motivoRechazo } = req.body || {};
    if (!['APROBADO', 'RECHAZADO'].includes(resultado)) {
      return res.status(400).json({ message: 'resultado debe ser APROBADO o RECHAZADO.' });
    }
    const solicitud = await repo.getPorCod(req.params.cod);
    if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada.' });
    if (!transicionValida('resolver', solicitud.estado)) {
      return estadoInvalido(res, solicitud.estado, 'resolver');
    }

    let patch;
    if (resultado === 'APROBADO') {
      const monto = Number(montoAprobado) || Number(solicitud.monto_solicitado);
      if (!Number.isFinite(monto) || monto <= 0) {
        return res.status(400).json({ message: 'montoAprobado inválido.' });
      }
      patch = { estado: 'Aprobado', monto_aprobado: monto, motivo_rechazo: null };
    } else {
      patch = { estado: 'Rechazado', motivo_rechazo: sanitizarTexto(motivoRechazo) || 'Sin especificar' };
    }
    const actualizada = await repo.actualizar(req.params.cod, patch);
    return res.json({ ok: true, solicitud: actualizada });
  } catch (error) {
    console.error('[core/resolver]', error.message);
    return res.status(500).json({ message: 'No se pudo resolver la solicitud.' });
  }
}

// POST /api/core/solicitudes/:cod/desembolsar — DESEMBOLSO ATÓMICO vía RPC.
async function desembolsar(req, res) {
  try {
    const solicitud = await repo.getPorCod(req.params.cod);
    if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada.' });
    if (!transicionValida('desembolsar', solicitud.estado)) {
      return estadoInvalido(res, solicitud.estado, 'desembolsar');
    }

    const monto = Number(solicitud.monto_aprobado) || Number(solicitud.monto_solicitado);
    const meses = Number(solicitud.plazo_meses);

    // === AQUÍ se aplica la tasa del tarifario (columna de cmac_productos) ===
    const producto = await getProductoPorId(solicitud.producto_id);
    const tea = Number(
      solicitud.con_desgravamen ? producto.tea_con_desgravamen : producto.tea_sin_desgravamen
    );

    const primeraCuotaISO = primeraFechaPagoISO(new Date());
    const { cuota, filas } = generarCronograma(monto, meses, tea, primeraCuotaISO);

    const plan = filas.map((f) => ({
      nro_cuota: f.n,
      fecha_pago: sumarMesesISO(primeraCuotaISO, f.n - 1),
      cuota: f.cuota,
      capital: f.capital,
      interes: f.interes,
      saldo: f.saldo,
    }));

    const codcuentacredito = `ccr-${solicitud.codsolicitud}`;

    // Todo-o-nada: cuenta + plan + operación + estado en UNA transacción (plpgsql).
    const { data, error } = await repo.desembolsarAtomico({
      solicitudId: solicitud.id,
      codcuentacredito,
      clienteId: solicitud.cliente_id,
      monto,
      plan,
    });

    if (error) {
      console.error('[core/desembolsar/rpc]', error.message);
      if ((error.message || '').includes('ESTADO_INVALIDO')) {
        return res.status(409).json({ message: 'La solicitud ya no está en estado Aprobado.' });
      }
      // Función aún no creada en la BD → guía clara.
      if (error.code === 'PGRST202' || /function .* does not exist/i.test(error.message || '')) {
        return res.status(500).json({ message: 'Falta ejecutar backend/db/10_fn_desembolsar.sql en Supabase.' });
      }
      return res.status(500).json({ message: 'No se pudo desembolsar el crédito.' });
    }

    return res.json({ ok: true, codcuentacredito, montoDesembolsado: monto, cuota, cuotas: filas.length });
  } catch (error) {
    console.error('[core/desembolsar]', error.message);
    return res.status(500).json({ message: 'No se pudo desembolsar el crédito.' });
  }
}

module.exports = {
  listar,
  detalle,
  registrarIngresos,
  evaluar,
  enviarAComite,
  opinar,
  resolver,
  desembolsar,
};
