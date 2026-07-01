# Reporte de Ciberseguridad — Reto Semana 14

**Sistema:** Portal Bancario CMAC Piura (4 piezas: `/frontend`, `/frontend-core`, `/backend`,
`/backend-core`) sobre Supabase (PostgreSQL).
**Alcance:** 5 familias de ataque (Inyección SQL, XSS, IDOR, Fuerza bruta, Configuración
insegura), cada una: cómo se probó, impacto, severidad, estado y corrección.
**Verificación automática:** `cd backend-core && npm run test:seguridad` → **7/7** (con ambos
backends corriendo). Complementa a `REPORTE_HALLAZGOS.md` (bcrypt, rate limiting, `auth_user`
eliminada); aquí se añaden SQLi, XSS e IDOR.

| # | Ataque | Familia | Severidad | Estado |
|---|---|---|---|---|
| 1 | Inyección SQL | Validación de entradas / BD | Alta | **Mitigado** |
| 2 | XSS (almacenado/reflejado) | Salida / plantillas | Media | **Mitigado** |
| 3 | IDOR | Control de acceso a recursos | Alta | **Mitigado** |
| 4 | Fuerza bruta | Autenticación | Alta | **Mitigado** |
| 5 | Configuración insegura / secretos | Hardening | Media | **Mitigado** |

---

## Ataque 1 — Inyección SQL

**Familia:** Inyección / validación de entradas.
**Estado:** Mitigado (por diseño).

**Cómo se probó (payload):**
```bash
# Payload de inyección en un parámetro de dato (producto):
curl -X POST http://localhost:3000/api/creditos/simular -H "Content-Type: application/json" \
  -d '{"productoCodigo":"EMP'"'"' OR '"'"'1'"'"'='"'"'1","monto":10000,"plazoMeses":12}'
# Payload de inyección en el login:
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"1001'"'"' OR '"'"'1'"'"'='"'"'1","password":"x"}'
```

**Evidencia (resultado real):**
```json
{ "message": "Producto de crédito no encontrado." }   // el string se buscó LITERAL → sin match
{ "message": "Credenciales incorrectas" }              // no hubo bypass de autenticación
```
La cadena `' OR '1'='1` se trató como **dato literal**, no como código SQL. No devolvió todos los
productos ni saltó el login.

**Impacto (si fuera vulnerable):** lectura/alteración masiva de datos, bypass de autenticación.

**Por qué está mitigado / corrección:** **todo** acceso a datos usa el **query builder de
Supabase** (`.from().select().eq(...)`, `.insert()`, `.update()`) o **RPC con parámetros
tipados** (`supabase.rpc('cmac_...', { p_... })`). Estos parametrizan los valores: nunca se
concatena input del usuario en una sentencia SQL. El SQL crudo del proyecto vive solo en las
migraciones `backend/db/*.sql` (estáticas, sin input de usuario) y en funciones plpgsql que
reciben **argumentos tipados** (`jsonb_to_recordset`, `uuid`, `numeric`), no strings interpolados.

**Archivos representativos:** `backend/src/controllers/dataController.js`,
`backend-core/src/repositories/*.js`, `backend/db/10_fn_desembolsar.sql`, `backend/db/12_fn_mora.sql`.

---

## Ataque 2 — XSS (Cross-Site Scripting)

**Familia:** Codificación de salida / almacenamiento de texto libre.
**Estado:** Mitigado (doble capa).

**Cómo se probó (payload):** guardar `"<script>alert(1)</script>Cliente pagará"` como
`observacion` de una gestión de cobranza y leerla de vuelta.
```bash
POST /api/core/mora/ccr-seed-029/gestion  { "tipo_gestion":"llamada",
  "observacion":"<script>alert(1)</script>Cliente pagará" }
```

**Evidencia (antes/después):**
```
Antes  (si no se sanitizara): se almacenaría  <script>alert(1)</script>Cliente pagará
Después (real):               se almacena      "alert(1)Cliente pagará"   ← sin etiquetas
```
Además, React **escapa por defecto** toda interpolación (`{valor}`) al renderizar, y no existe
ningún `dangerouslySetInnerHTML` en `/frontend` ni `/frontend-core` (verificado con grep), por lo
que aunque llegara un tag, se mostraría como texto, no se ejecutaría.

**Impacto (si fuera vulnerable):** ejecución de JS en el navegador de otro usuario/operador,
robo de sesión.

**Corrección aplicada:** sanitización de entrada en el backend (`backend-core/src/lib/sanitize.js`,
`sanitizarTexto()` elimina `<[^>]*>`), aplicada a los campos de texto libre que se persisten:
`observacion` (gestión de cobranza, evaluación, opinión, judicial/castigo) y `motivo_rechazo`.
Capa de salida: React escapa por defecto.

**Archivos:** `backend-core/src/lib/sanitize.js` _(nuevo)_,
`backend-core/src/controllers/moraController.js`, `backend-core/src/controllers/solicitudController.js`.

---

## Ataque 3 — IDOR (Insecure Direct Object Reference)

**Familia:** Control de acceso a recursos.
**Estado:** Mitigado.

**Cómo se probó:** dos clientes A y B (usuarios de Supabase Auth vinculados a `cli000001` y
`cli000002`). Cada uno crea una solicitud. Se pide la bandeja de A y se comprueba que **no**
contiene la solicitud de B.

**Evidencia (test automatizado):**
```
✓ cliente A ve su propia solicitud
✓ cliente A NO ve la solicitud de B (RLS por auth.uid())
```

**Impacto (si fuera vulnerable):** un cliente vería/gestionaría cuentas, movimientos, solicitudes
o créditos de otro.

**Por qué está mitigado:**
- **Homebanking:** los endpoints de cliente NO confían en ids de la URL; usan
  `clienteParaUsuario(req.token)` (cliente Supabase con el JWT del usuario) → **RLS** filtra por
  `auth.uid()`. `POST /api/hb/solicitar` resuelve el `cliente_id` desde el token
  (`cmac_clientes.auth_user_id = auth.uid()`), no desde el body. `GET /api/cuentas`,
  `/api/movimientos`, `/api/hb/mis-solicitudes` devuelven **solo** filas del dueño.
- **Core:** las lecturas/acciones exigen JWT de personal (`aud:'core'`) + **RBAC** por rol
  (P4). El personal legítimamente ve toda la cartera (es su función); las acciones críticas están
  restringidas por rol, no por ids manipulables.

**Archivos:** `backend/src/controllers/dataController.js`, `backend/src/controllers/hbController.js`,
`backend/db/05_rls.sql` (políticas RLS), `backend-core/src/middlewares/rbac.js`.

---

## Ataque 4 — Fuerza bruta

**Familia:** Autenticación.
**Estado:** Mitigado (ambos logins).

**Cómo se probó:** intentos de login fallidos repetidos contra HB y Core.

**Evidencia (test automatizado):**
```
✓ HB   login → 429 tras varios intentos fallidos
✓ Core login → 429 tras varios intentos fallidos
```

**Impacto (si fuera vulnerable):** adivinación de contraseñas por diccionario (los DNIs del
personal `11111111..` son predecibles).

**Corrección aplicada:** rate limiting en memoria en **ambos** logins: 5 intentos / 15 min por
`ip:usuario`, luego bloqueo 15 min (HTTP 429); un login exitoso resetea el contador.
- HB: `backend/src/middlewares/rateLimiter.js` (por `ip:email`) — ver `REPORTE_HALLAZGOS.md` #1.
- Core: `backend-core/src/middlewares/rateLimiter.js` (por `ip:numerodni`) — añadido en P4.

**Complementos:** las contraseñas del personal están **hasheadas con bcrypt**
(`backend/db/11_hash_personal.sql` + `bcrypt.compare`), no en texto plano
(ver `REPORTE_HALLAZGOS.md` #6).

---

## Ataque 5 — Configuración insegura / secretos

**Familia:** Hardening / gestión de secretos.
**Estado:** Mitigado.

**Cómo se probó / revisó:**
- **CORS:** ambos backends restringen `origin` a la URL propia vía variable de entorno, **sin `*`**:
  `backend/app.js` → `process.env.FRONTEND_URL`; `backend-core/app.js` → `process.env.FRONTEND_CORE_URL`.
- **Errores:** las respuestas de error 4xx/5xx devuelven un **mensaje genérico** (`{ message }`)
  y registran el detalle con `console.error` interno. Test: el cuerpo del 401 no contiene stack
  trace ni rutas de archivo.
  ```
  ✓ error 401 devuelve solo {message}
  ✓ el cuerpo del error no contiene stack trace/rutas
  ```
- **Cabeceras de seguridad:** ambos backends fijan `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`,
  `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` y `app.disable('x-powered-by')`.
- **Secretos:** `.env` está en `.gitignore` (raíz), y `git ls-files` **no rastrea** ningún `.env`
  ni `.mcp.json`. Existe `.env.example` con claves **vacías** en las 4 piezas. Un grep de material
  de claves (`eyJhbGciOiJ`, `sbp_…`) sobre archivos versionados **no encontró ninguna** clave
  hardcodeada en el código.

**Impacto (si fuera vulnerable):** CSRF/robo de datos cross-origin, fingerprinting del stack,
fuga de secretos en el repo.

**Corrección / estado:** ya conforme (ver `REPORTE_HALLAZGOS.md` #2 para cabeceras y CORS).

**Observación menor (deuda técnica, no bloqueante):** el JWT del personal del Core usa un
**secreto por defecto de desarrollo** si `CORE_JWT_SECRET` no está definido. Se añadió un aviso en
el arranque de `backend-core` y **en producción debe definirse `CORE_JWT_SECRET`** por entorno.
No es un secreto real filtrado (es un placeholder de desarrollo), pero conviene fijarlo antes del
despliegue.

**Nota para la usuaria:** no se rotó ninguna llave ni se borró nada de la BD. No se detectaron
secretos reales en el repositorio; si en el futuro se sube uno por error, hay que **rotarlo** en
Supabase y purgar el historial.

---

## Checklist de aceptación

- [x] Los 5 ataques revisados; lo vulnerable, corregido (XSS sanitización + aviso JWT secret).
- [x] Rate limiting en **ambos** logins (HB y Core) → 429.
- [x] CORS restringido por variable de entorno en los 2 backends; sin `*`.
- [x] Sin secretos hardcodeados; `.env` gitignored; `.env.example` en las 4 piezas.
- [x] `seguridad.test.mjs` pasa (IDOR + fuerza bruta + no stack trace + XSS) → 7/7.
- [x] Este documento con ficha de los 5 ataques y evidencia antes/después.
