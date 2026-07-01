const bcrypt = require('bcryptjs');
const { getPorDni } = require('../repositories/personalRepository');
const { sign } = require('../lib/jwt');
const { CORE_JWT_SECRET } = require('../middlewares/rbac');
const { resetearIntentos } = require('../middlewares/rateLimiter');

// Login del personal del banco.
// P4: la contraseña se valida con bcrypt.compare contra cmac_personal.password_hash
// (ya NO en texto plano). La contraseña efectiva de los usuarios de prueba sigue
// siendo el DNI (ver backend/db/11_hash_personal.sql) — modo desarrollo.
async function login(req, res) {
  try {
    const { numerodni, password } = req.body || {};
    if (!numerodni || !password) {
      return res.status(400).json({ message: 'DNI y contraseña son requeridos' });
    }

    const dni = String(numerodni).trim();
    const personal = await getPorDni(dni);

    // Comparación con hash bcrypt. Si no hay hash, no se permite el acceso.
    const passwordOk = personal && personal.activo && personal.password_hash
      ? await bcrypt.compare(String(password), personal.password_hash)
      : false;

    if (!passwordOk) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const ip = req.ip || req.connection?.remoteAddress;
    resetearIntentos(dni, ip);   // login exitoso limpia el rate limiting

    // aud:'core' separa el token de personal del token de cliente del Homebanking.
    const token = sign(
      { personal_id: personal.id, numerodni: personal.numerodni, rol: personal.rol, aud: 'core' },
      CORE_JWT_SECRET
    );

    return res.json({
      token,
      personal: {
        id: personal.id,
        numerodni: personal.numerodni,
        nombre: personal.nombre,
        rol: personal.rol,
      },
    });
  } catch (error) {
    console.error('[core/login]', error.message);
    return res.status(500).json({ message: 'No se pudo iniciar sesión. Intenta más tarde.' });
  }
}

function me(req, res) {
  return res.json({ personal: req.personal });
}

module.exports = { login, me };
