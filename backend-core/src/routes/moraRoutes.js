const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/moraController');
const { requireAuthPersonal, requireRol } = require('../middlewares/rbac');

router.use(requireAuthPersonal);

// R1 — lecturas: cualquier personal autenticado.
router.get('/cartera', ctrl.cartera);
router.get('/kpis', ctrl.kpis);
router.get('/:cod/gestiones', ctrl.listarGestiones);

// R2 — gestión de cobranza: gestores de cobranza (administrador, asesor, analista).
router.post('/:cod/gestion', requireRol('administrador', 'asesor', 'analista'), ctrl.registrarGestion);

// R3 — transiciones críticas (umbral validado en el controller + RPC atómico).
router.post('/:cod/judicial', requireRol('administrador'), ctrl.derivarJudicial);   // ≥121 días
router.post('/:cod/castigar', requireRol('comite'), ctrl.castigar);                 // >180 días

module.exports = router;
