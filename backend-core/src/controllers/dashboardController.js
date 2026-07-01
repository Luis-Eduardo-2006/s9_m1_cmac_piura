const repo = require('../repositories/dashboardRepository');
const mora = require('../services/moraService');

const round2 = (x) => Math.round(x * 100) / 100;
const bandaDe = (c) => mora.clasificarBanda(c.dias_atraso, c);
const productoDe = (c) => c.cmac_solicitudes?.cmac_productos?.codigo || 'EMP';

// GET /api/core/dashboard/resumen — todo lo que el dashboard necesita en una respuesta.
async function resumen(req, res) {
  try {
    const [cuentas, desembolsos] = await Promise.all([repo.getCuentasConProducto(), repo.getDesembolsos()]);

    const saldo = (c) => Number(c.saldo_capital) || 0;
    const carteraTotal = cuentas.reduce((s, c) => s + saldo(c), 0);
    const carteraVencida = cuentas.filter((c) => mora.esNPL(bandaDe(c))).reduce((s, c) => s + saldo(c), 0);
    const carteraVigente = carteraTotal - carteraVencida;   // vigente = al día + preventiva (no-NPL)
    const nCreditos = cuentas.length;
    const nClientes = new Set(cuentas.map((c) => c.cliente_id)).size;
    const desembolsosTotal = desembolsos.reduce((s, o) => s + (Number(o.monto) || 0), 0);

    // mora por banda (las 6)
    const porBanda = mora.BANDAS.map((b) => ({ banda: b, saldo: 0, conteo: 0 }));
    for (const c of cuentas) {
      const row = porBanda.find((r) => r.banda === bandaDe(c));
      row.saldo = round2(row.saldo + saldo(c)); row.conteo += 1;
    }

    // cartera por producto
    const prodMap = {};
    for (const c of cuentas) {
      const p = productoDe(c);
      prodMap[p] = prodMap[p] || { producto: p, saldo: 0, conteo: 0 };
      prodMap[p].saldo = round2(prodMap[p].saldo + saldo(c)); prodMap[p].conteo += 1;
    }

    // desembolsos por mes (YYYY-MM)
    const mesMap = {};
    for (const o of desembolsos) {
      const periodo = String(o.fecha).slice(0, 7);
      mesMap[periodo] = round2((mesMap[periodo] || 0) + (Number(o.monto) || 0));
    }
    const desembolsosPorMes = Object.entries(mesMap).map(([periodo, monto]) => ({ periodo, monto })).sort((a, b) => a.periodo.localeCompare(b.periodo));

    return res.json({
      kpis: {
        cartera_total: round2(carteraTotal),
        cartera_vigente: round2(carteraVigente),
        cartera_vencida: round2(carteraVencida),
        ratio_mora: carteraTotal > 0 ? round2((carteraVencida / carteraTotal) * 100) : 0,   // divide seguro
        n_creditos: nCreditos,
        n_clientes: nClientes,
        desembolsos_total: round2(desembolsosTotal),
        ticket_promedio: nCreditos > 0 ? round2(desembolsosTotal / nCreditos) : 0,           // divide seguro
      },
      mora_por_banda: porBanda,
      cartera_por_producto: Object.values(prodMap),
      desembolsos_por_mes: desembolsosPorMes,
      // Nota: el modelo no tiene oficinas/agencias → se omite top_oficinas (no inventar datos).
    });
  } catch (error) {
    console.error('[dashboard/resumen]', error.message);
    return res.status(500).json({ message: 'No se pudo generar el resumen del dashboard.' });
  }
}

// GET /api/core/dashboard/export.csv — cartera como CSV (puente a Power BI).
async function exportCsv(req, res) {
  try {
    const cuentas = await repo.getCuentasConProducto();
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['codcuentacredito', 'cliente', 'producto', 'saldo_capital', 'dias_atraso', 'banda', 'estado_mora'];
    const filas = cuentas.map((c) => [
      c.codcuentacredito, c.cmac_clientes?.nombre || '', productoDe(c),
      Number(c.saldo_capital) || 0, c.dias_atraso, bandaDe(c), c.estado_mora,
    ].map(esc).join(','));
    const csv = [header.join(','), ...filas].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="cartera_cmac_piura.csv"');
    return res.send('﻿' + csv);   // BOM para acentos en Excel
  } catch (error) {
    console.error('[dashboard/export]', error.message);
    return res.status(500).json({ message: 'No se pudo exportar la cartera.' });
  }
}

module.exports = { resumen, exportCsv };
