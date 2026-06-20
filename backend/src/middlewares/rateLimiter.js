const intentos = new Map();

const MAX_INTENTOS = 5;
const VENTANA_MS = 15 * 60 * 1000; // 15 minutos
const BLOQUEO_MS = 15 * 60 * 1000; // 15 minutos bloqueado

function limpiarEntradas() {
  const ahora = Date.now();
  for (const [clave, entrada] of intentos.entries()) {
    if (ahora - entrada.inicio > VENTANA_MS && !entrada.bloqueadoHasta) {
      intentos.delete(clave);
    }
    if (entrada.bloqueadoHasta && ahora > entrada.bloqueadoHasta) {
      intentos.delete(clave);
    }
  }
}

setInterval(limpiarEntradas, 5 * 60 * 1000);

function loginRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const email = (req.body?.email || '').toLowerCase().trim();
  const clave = `${ip}:${email}`;
  const ahora = Date.now();

  let entrada = intentos.get(clave);

  if (entrada?.bloqueadoHasta) {
    if (ahora < entrada.bloqueadoHasta) {
      const segundosRestantes = Math.ceil((entrada.bloqueadoHasta - ahora) / 1000);
      return res.status(429).json({
        message: `Demasiados intentos fallidos. Intenta nuevamente en ${segundosRestantes} segundos.`,
      });
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
    return res.status(429).json({
      message: 'Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.',
    });
  }

  next();
}

function resetearIntentos(email, ip) {
  const clave = `${ip}:${email.toLowerCase().trim()}`;
  intentos.delete(clave);
}

module.exports = { loginRateLimiter, resetearIntentos };
