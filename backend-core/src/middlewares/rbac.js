// =====================================================================
// rbac.js — Autenticación de personal + control de acceso por rol (P4)
// El Core usa service_role (salta RLS), así que el control de acceso se hace
// SIEMPRE aquí, en el backend.
// =====================================================================
const { verify } = require('../lib/jwt');

const CORE_JWT_SECRET = process.env.CORE_JWT_SECRET || 'core-dev-secret-cmac-piura';

// Verifica el JWT y que sea un token de PERSONAL del Core (aud:'core').
// Un token de cliente del Homebanking (JWT de Supabase, otro secret y sin
// aud:'core') NO pasa esta verificación → 401.
function requireAuthPersonal(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de personal no proporcionado' });
  }
  try {
    const payload = verify(authHeader.split(' ')[1], CORE_JWT_SECRET);
    if (payload.aud !== 'core') {
      return res.status(401).json({ message: 'El token no es de personal del Core.' });
    }
    req.personal = { id: payload.personal_id, numerodni: payload.numerodni, rol: payload.rol };
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

// Exige que req.personal.rol esté en la lista; si no, 403.
function requireRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.personal || !rolesPermitidos.includes(req.personal.rol)) {
      return res.status(403).json({
        message: `Acceso denegado: esta acción requiere el rol ${rolesPermitidos.join(' o ')} (tu rol: ${req.personal?.rol || 'desconocido'}).`,
      });
    }
    next();
  };
}

module.exports = { requireAuthPersonal, requireRol, CORE_JWT_SECRET };
