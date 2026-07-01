const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/solicitudController');
const { requireAuthPersonal, requireRol } = require('../middlewares/rbac');

// Todas exigen JWT de personal del Core (aud:'core').
router.use(requireAuthPersonal);

// --- LECTURAS: cualquier personal autenticado ---
router.get('/', ctrl.listar);
router.get('/:cod', ctrl.detalle);

// --- ESCRITURAS: matriz de permisos por rol (RBAC, fuente de verdad = backend) ---
router.post('/:cod/ingresos',    requireRol('asesor'), ctrl.registrarIngresos);
router.post('/:cod/evaluacion',  requireRol('asesor'), ctrl.evaluar);
router.post('/:cod/comite',      requireRol('asesor'), ctrl.enviarAComite);
router.post('/:cod/opinion',     requireRol('administrador', 'jefe_regional', 'riesgos', 'analista'), ctrl.opinar);
router.post('/:cod/resolver',    requireRol('comite'), ctrl.resolver);
router.post('/:cod/desembolsar', requireRol('comite'), ctrl.desembolsar);

// Nota (P5): 'derivar a judicial' y 'castigar' viven ahora en el módulo de mora
// (/api/core/mora/:cod/judicial y /castigar), operan sobre codcuentacredito.

module.exports = router;
