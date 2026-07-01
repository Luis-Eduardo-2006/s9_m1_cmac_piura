// JWT HS256 mínimo con crypto nativo (sin dependencias externas).
// Suficiente para el token del personal del Core: { personal_id, numerodni, rol }.
const crypto = require('crypto');

const b64url = (input) => Buffer.from(input).toString('base64url');

function sign(payload, secret, expSeconds = 8 * 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expSeconds };

  const parte1 = b64url(JSON.stringify(header));
  const parte2 = b64url(JSON.stringify(body));
  const data = `${parte1}.${parte2}`;
  const firma = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${firma}`;
}

function verify(token, secret) {
  const partes = String(token).split('.');
  if (partes.length !== 3) throw new Error('Token malformado');

  const [p1, p2, firma] = partes;
  const esperada = crypto.createHmac('sha256', secret).update(`${p1}.${p2}`).digest('base64url');

  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('Firma inválida');
  }

  const body = JSON.parse(Buffer.from(p2, 'base64url').toString('utf8'));
  if (body.exp && Math.floor(Date.now() / 1000) > body.exp) {
    throw new Error('Token expirado');
  }
  return body;
}

module.exports = { sign, verify };
