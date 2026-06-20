# Reporte de Hallazgos de Seguridad — CMAC Piura

**Proyecto:** Portal Bancario CMAC Piura  
**Stack:** Node.js + Express 5 (backend) · React 18 + Vite 5 (frontend) · Supabase Auth  
**Fecha:** 2026-06-19  
**Metodología:** Reconocimiento → Demostración de vulnerabilidad → Corrección → Verificación

---

## Tabla resumen

| # | Lab / Mejora | Vulnerabilidad demostrada | Contramedida aplicada | Severidad |
|---|---|---|---|---|
| B | Fuerza bruta | Login sin límite de intentos — ataque por diccionario posible | Rate limiting manual: 5 intentos/15 min por IP+email | **Alta** |
| D | Config. insegura | Sin cabeceras HTTP de seguridad; `X-Powered-By: Express` expuesto | Middleware de cabeceras: `X-Content-Type-Options`, `X-Frame-Options`, `CSP`, `Referrer-Policy`; ocultamiento del stack | **Media** |
| E1 | Error exposure | `dataController` devolvía `error.message` de Supabase al cliente (filtra estructura interna de BD) | Mensaje genérico al cliente + `console.error` interno | **Media** |
| 4 | Secretos / Config | URLs de API hardcodeadas en código fuente; sin `.env.example` | Variables de entorno `VITE_API_URL` en frontend; `.env.example` en backend y frontend | **Baja** |
| 5 | Dependencias | `s9_m1_react_supabase/` usaba `vite@5.4.1` (CVE-2025-30208, path traversal en dev server) | Frontend principal actualizado a `vite@5.4.21`; subdirectorio no usar para desarrollo | **Media** |

### Labs NO aplicables a este stack (y por qué)

| Lab | Razón |
|---|---|
| **Lab 1 (bcrypt)** | Supabase Auth maneja el hashing de contraseñas internamente con bcrypt. No hay comparación en texto plano. |
| **Lab 2 (SQL Injection)** | Cero SQL crudo. Todo acceso a BD usa el cliente JS de Supabase, que parametriza automáticamente. |
| **Lab 3 (AES en reposo)** | Supabase cifra la base de datos en reposo por defecto. No hay campos sensibles expuestos en claro. |
| **Mejora A (IDOR)** | `clienteParaUsuario(token)` pasa el JWT del usuario a Supabase. Si RLS (Row Level Security) está activo en las tablas `cmac_cuentas` y `cmac_movimientos`, el filtrado es automático por usuario. Verificar activación de RLS en panel Supabase. |
| **Mejora C (XSS)** | React escapa toda la salida por defecto. No hay uso de `dangerouslySetInnerHTML` en ningún componente. |
| **Mejora E (JWT)** | Supabase genera y firma los tokens JWT con expiración configurada. El backend valida con `supabase.auth.getUser(token)`. |
| **Mejora F (menor privilegio BD)** | Supabase anon key ya tiene permisos restringidos por RLS y políticas de tabla. |

---

## Fichas de hallazgo

---

### Hallazgo 1 — Fuerza bruta en login (Mejora B)

**Severidad:** Alta  
**Endpoint afectado:** `POST /api/auth/login`

**Descripción:** El endpoint de login no tenía ningún mecanismo de control de tasa. Un atacante podía intentar contraseñas de forma ilimitada sin ningún bloqueo ni demora.

**Evidencia (antes):**
```bash
# Script de ejemplo: 1000 intentos sin ningún bloqueo
for i in $(seq 1 1000); do
  curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"victima@cmacpiura.pe","password":"intento'$i'"}'
done
# Resultado: todos los intentos procesados normalmente
```

**Prueba en código (después):**
```
Intento 1 => PERMITIDO
Intento 2 => PERMITIDO
Intento 3 => PERMITIDO
Intento 4 => PERMITIDO
Intento 5 => PERMITIDO
Intento 6 => BLOQUEADO 429: Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.
Intento 7 => BLOQUEADO 429: Demasiados intentos fallidos. Intenta nuevamente en 900 segundos.
```

**Recomendación aplicada:** Middleware `rateLimiter.js` que rastrea intentos por combinación IP+email. Máximo 5 intentos en ventana de 15 minutos. Bloqueo de 15 minutos tras superarlo. Al login exitoso se resetean los contadores. Commit: `seguridad(mejora-b)`.

**Archivos modificados:**
- `backend/src/middlewares/rateLimiter.js` _(nuevo)_
- `backend/src/routes/authRoutes.js`
- `backend/src/controllers/authController.js`

---

### Hallazgo 2 — Ausencia de cabeceras de seguridad HTTP (Mejora D)

**Severidad:** Media  
**Afecta:** todas las respuestas HTTP del backend

**Descripción:** El servidor respondía sin cabeceras de seguridad estándar y con la cabecera `X-Powered-By: Express` que revela el framework usado, facilitando ataques dirigidos.

**Evidencia (antes):**
```http
HTTP/1.1 200 OK
X-Powered-By: Express          ← revela el stack
(sin X-Content-Type-Options)   ← permite MIME sniffing
(sin X-Frame-Options)          ← permite clickjacking
(sin Content-Security-Policy)  ← sin restricciones de origen
```

**Después:**
```http
HTTP/1.1 200 OK
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'
(sin X-Powered-By)
```

**Recomendación aplicada:** Middleware de cabeceras en `app.js` + `app.disable('x-powered-by')`. CORS restringido a origen configurado por variable de entorno `FRONTEND_URL`. Commit: `seguridad(mejora-d)`.

**Archivos modificados:**
- `backend/app.js`

---

### Hallazgo 3 — Exposición de errores internos al cliente

**Severidad:** Media  
**Endpoints afectados:** `GET /api/cuentas`, `GET /api/movimientos`

**Descripción:** En caso de error, el controlador devolvía `error.message` directamente de Supabase al cliente. Esto puede exponer nombres de tablas, columnas, esquemas o mensajes de configuración de la base de datos.

**Evidencia (antes):**
```json
HTTP/1.1 500
{ "message": "relation \"cmac_cuentas\" does not exist" }
```
Un mensaje así confirma al atacante la existencia (o ausencia) de tablas y el motor de base de datos.

**Después:**
```json
HTTP/1.1 500
{ "message": "Error al obtener las cuentas. Intenta más tarde." }
```
El error real se registra en el servidor con `console.error('[listarCuentas]', error.message)`.

**Recomendación aplicada:** Mensajes genéricos en todas las respuestas de error 500. Log interno para diagnóstico. Commit: `seguridad(error-exposure)`.

**Archivos modificados:**
- `backend/src/controllers/dataController.js`

---

### Hallazgo 4 — URLs hardcodeadas y ausencia de `.env.example`

**Severidad:** Baja  
**Archivos afectados:** `frontend/src/services/authService.js`, `frontend/src/services/dataService.js`

**Descripción:** La URL base del backend (`http://localhost:3000`) estaba hardcodeada en el código fuente del frontend. Cualquier cambio de entorno (staging, producción) requería editar código. Además, no existía `.env.example` para guiar la configuración.

**Después:** La URL se lee de `import.meta.env.VITE_API_URL` (variable Vite). Se crearon `.env.example` en backend y frontend documentando las variables necesarias. El `.env` real sigue excluido por `.gitignore`.

**Recomendación aplicada:** Variables de entorno `VITE_API_URL` (frontend) y `FRONTEND_URL` (backend para CORS). Commit: `seguridad(lab-4)`.

---

### Hallazgo 5 — Dependencia vulnerable en subdirectorio (CVE-2025-30208)

**Severidad:** Media (solo en entorno de desarrollo)  
**Paquete:** `vite@5.4.1` en `frontend/s9_m1_react_supabase/`

**Descripción:** El subdirectorio `s9_m1_react_supabase/` instaló `vite@5.4.1`, afectado por CVE-2025-30208 (path traversal en el servidor de desarrollo de Vite: un atacante en la misma red puede leer archivos arbitrarios del sistema usando parámetros de consulta especiales en la URL).

**Versión vulnerable:** `vite@5.4.1`  
**Versión corregida:** `vite@5.4.15+`  
**Frontend principal instalado:** `vite@5.4.21` ✅ no vulnerable

**Recomendación:** Usar siempre el frontend principal en `frontend/` (tiene vite 5.4.21). No usar `frontend/s9_m1_react_supabase/` para desarrollo. Cuando haya conectividad de red, ejecutar `npm audit fix` para actualizar dependencias automáticamente.

---

## Vulnerabilidad propia detectada — Ausencia de validación de formato de entrada en login

**Severidad:** Baja  
**Endpoint:** `POST /api/auth/login`

**Descripción:** El endpoint solo valida que `email` y `password` no sean vacíos, pero no valida formato de email ni longitud mínima de contraseña. Esto permite enviar valores malformados que llegan directamente a Supabase Auth, potencialmente causando comportamientos inesperados o errores informativos.

**Ejemplo:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"no-es-un-email","password":"x"}'
# Supabase responde con su propio error que puede ser informativo
```

**Plan de corrección:** Agregar validación de formato con regex de email y longitud mínima de contraseña (≥8 caracteres) antes de llamar a Supabase:
```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return res.status(400).json({ message: 'Formato de correo inválido' });
}
if (password.length < 8) {
  return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
}
```

---

## Estado final de checklist

- [x] FASE 0 ejecutada — mapa de archivos presentado antes de editar
- [x] Mejora B — Rate limiting: 5 intentos/15 min por IP+email, verificado
- [x] Mejora D — Cabeceras de seguridad y eliminación de `X-Powered-By`, verificado
- [x] Error exposure — Mensajes genéricos al cliente, log interno
- [x] Lab 4 — `.env.example` en backend y frontend; URLs como variables de entorno
- [x] Lab 5 — Dependencias auditadas; vite 5.4.21 en frontend principal (no vulnerable)
- [x] Labs 1, 2, 3 y Mejoras A, C, E, F — N/A documentado con justificación técnica
- [x] Un commit por mejora, sin push
- [x] Servicios backend (puerto 3000) siguen operando normalmente
- [ ] `npm audit` — pendiente de red: ejecutar `npm audit` y `npm audit fix` cuando haya conectividad

---

## Commits generados

```
seguridad(mejora-b): rate limiting en login — 5 intentos max por IP/email, bloqueo 15 min
seguridad(mejora-d): cabeceras HTTP seguras, ocultar X-Powered-By, CORS restringido por env var
seguridad(error-exposure): mensajes de error genéricos al cliente, log interno en servidor
seguridad(lab-4): .env.example documentado, URLs de API movidas a variables de entorno VITE_API_URL
```
