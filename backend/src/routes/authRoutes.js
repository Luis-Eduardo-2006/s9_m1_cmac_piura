const express = require('express');
const router = express.Router();
const { login, me } = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { loginRateLimiter } = require('../middlewares/rateLimiter');

router.post('/login', loginRateLimiter, login);
router.get('/me', verificarToken, me);

module.exports = router;
