const express = require('express');
const router = express.Router();
const { listarCuentas, listarMovimientos } = require('../controllers/dataController');
const { simular } = require('../controllers/creditoController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/cuentas', verificarToken, listarCuentas);
router.get('/movimientos', verificarToken, listarMovimientos);

// Simulador de crédito: público (de cara al cliente), sin verificarToken.
router.post('/creditos/simular', simular);

module.exports = router;
