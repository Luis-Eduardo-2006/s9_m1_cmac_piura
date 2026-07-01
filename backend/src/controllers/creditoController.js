// =====================================================================
// creditoController.js — Simulación de crédito (endpoint del Core)
// La TEA se lee del tarifario (cmac_productos), NO está hardcodeada.
// =====================================================================
const { getProductoPorCodigo } = require('../repositories/productoRepository');
const { generarCronograma } = require('../services/amortizacionService');

async function simular(req, res) {
  try {
    const {
      productoCodigo = 'EMP',
      monto,
      plazoMeses,
      conDesgravamen = false,
      primeraCuota,
    } = req.body || {};

    const m = Number(monto);
    const n = Number(plazoMeses);

    if (!Number.isFinite(m) || m <= 0) {
      return res.status(400).json({ message: 'El monto debe ser mayor a 0.' });
    }
    if (!Number.isInteger(n) || n <= 0) {
      return res.status(400).json({ message: 'El plazo en meses debe ser un entero mayor a 0.' });
    }

    const producto = await getProductoPorCodigo(productoCodigo);
    if (!producto) {
      return res.status(404).json({ message: 'Producto de crédito no encontrado.' });
    }

    const min = Number(producto.monto_min);
    const max = Number(producto.monto_max);
    if (m < min || m > max) {
      return res.status(400).json({
        message: `El monto debe estar entre ${min} y ${max} para el producto ${producto.codigo}.`,
      });
    }

    // === AQUÍ se aplica la tasa del tarifario (columna de cmac_productos) ===
    const tea = Number(
      conDesgravamen ? producto.tea_con_desgravamen : producto.tea_sin_desgravamen
    );

    const { cuota, tem, filas } = generarCronograma(m, n, tea, primeraCuota);

    return res.json({
      producto: producto.codigo,
      tea,
      tem,
      cuota,
      cronograma: filas,
    });
  } catch (error) {
    console.error('[simular]', error.message);
    return res.status(500).json({ message: 'No se pudo simular el crédito. Intenta más tarde.' });
  }
}

module.exports = { simular };
