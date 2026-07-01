const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');
const { requireAuthPersonal } = require('../middlewares/rbac');

// Lecturas de análisis: cualquier personal autenticado.
router.use(requireAuthPersonal);

router.get('/resumen', ctrl.resumen);
router.get('/export.csv', ctrl.exportCsv);

module.exports = router;
