// Rate limiting del login del Core (anti fuerza-bruta), en memoria por ip:dni.
// Mismo patrón que backend/src/middlewares/rateLimiter.js del Homebanking.
const intentos = new Map();

const MAX_INTENTOS = 5;
const VENTANA_MS = 15 * 60 * 1000;  // 15 min
const BLOQUEO_MS = 15 * 60 * 1000;  // 15 min bloqueado

function limpiarEntradas() {
  const ahora = Date.now();
  for (const [clave, entrada] of intentos.entries()) {
    if (ahora - entrada.inicio > VENTANA_MS && !entrada.bloqueadoHasta) intentos.delete(clave);
    if (entrada.bloqueadoHasta && ahora > entrada.bloqueadoHasta) intentos.delete(clave);
  }
}
setInterval(limpiarEntradas, 5 * 60 * 1000);

function loginRateLimiter(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'ip';
  const dni = String(req.body?.numerodni || '').trim();
  const clave = `${ip}:${dni}`;
  const ahora = Date.now();

  let entrada = intentos.get(clave);

  if (entrada?.bloqueadoHasta) {
    if (ahora < entrada.bloqueadoHasta) {
      const seg = Math.ceil((entrada.bloqueadoHasta - ahora) / 1000);
      return res.status(429).json({ message: `Demasiados intentos fallidos. Intenta en ${seg} segundos.` });
    }
    intentos.delete(clave);
    entrada = undefined;
  }

  if (!entrada || ahora - entrada.inicio > VENTANA_MS) {
    intentos.set(clave, { count: 1, inicio: ahora });
    return next();
  }

  entrada.count += 1;
  if (entrada.count > MAX_INTENTOS) {
    entrada.bloqueadoHasta = ahora + BLOQUEO_MS;
    return res.status(429).json({ message: 'Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.' });
  }
  next();
}

function resetearIntentos(numerodni, ip) {
  intentos.delete(`${ip}:${String(numerodni).trim()}`);
}

module.exports = { loginRateLimiter, resetearIntentos };
