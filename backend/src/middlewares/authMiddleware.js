const supabase = require('../config/supabase');

async function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }

  req.user = {
    id: data.user.id,
    email: data.user.email,
    nombre: data.user.user_metadata?.nombre || data.user.email.split('@')[0],
  };

  next();
}

module.exports = { verificarToken };
