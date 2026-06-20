const express = require('express');
const router = express.Router();
const { listarCuentas, listarMovimientos } = require('../controllers/dataController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/cuentas', verificarToken, listarCuentas);
router.get('/movimientos', verificarToken, listarMovimientos);

module.exports = router;
