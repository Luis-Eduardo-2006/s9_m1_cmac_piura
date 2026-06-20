const supabase = require('../config/supabase');
const { resetearIntentos } = require('../middlewares/rateLimiter');

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(401).json({ message: 'Credenciales incorrectas' });
  }

  const ip = req.ip || req.connection.remoteAddress;
  resetearIntentos(email, ip);

  res.json({
    token: data.session.access_token,
    user: {
      id: data.user.id,
      email: data.user.email,
      nombre: data.user.user_metadata?.nombre || data.user.email.split('@')[0],
    },
  });
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, me };
