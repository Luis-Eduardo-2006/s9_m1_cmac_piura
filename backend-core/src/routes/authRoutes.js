const express = require('express');
const router = express.Router();
const { login, me } = require('../controllers/authController');
const { requireAuthPersonal } = require('../middlewares/rbac');
const { loginRateLimiter } = require('../middlewares/rateLimiter');

router.post('/login', loginRateLimiter, login);   // anti fuerza-bruta
router.get('/me', requireAuthPersonal, me);

module.exports = router;
