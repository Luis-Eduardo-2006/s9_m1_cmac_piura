const express = require('express');
const router = express.Router();
const { solicitar, misSolicitudes } = require('../controllers/hbController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Solicitud de crédito desde el Homebanking (cliente autenticado).
router.post('/solicitar', verificarToken, solicitar);
router.get('/mis-solicitudes', verificarToken, misSolicitudes);

module.exports = router;
