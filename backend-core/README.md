# backend-core — API del Core Bancario (CMAC Piura)

API REST del **Core** (operación del personal del banco): flujo de otorgamiento de crédito,
reglas de negocio, RBAC por rol, recuperaciones/mora y agregaciones para el dashboard.
Arquitectura por capas `rutas → middlewares → controladores → servicios → repositorios →
Supabase`. Comparte la base de datos con el Homebanking pero se despliega por separado.

## Puesta en marcha

```bash
cd backend-core
npm install
npm start        # node app.js — escucha en $PORT (local: 3001)
```

## Variables de entorno (`.env`)

| Clave | Descripción |
|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_KEY` | service_role key (**obligatoria** en producción) |
| `SUPABASE_KEY` | anon key (fallback local) |
| `CORE_JWT_SECRET` | secreto del JWT del personal (**obligatorio** en producción) |
| `PORT` | Puerto (local 3001; en Render se asigna solo) |
| `FRONTEND_CORE_URL` | Origen permitido por CORS (URL del frontend-core) |
| `NODE_ENV` | `production` activa las validaciones estrictas de arranque |

### ¿Por qué service_role?

El personal del banco **no es usuario de Supabase Auth** (se autentica contra `cmac_personal`
con un JWT propio del Core). Por eso no hay `auth.uid()` y las políticas RLS no aplicarían; la
service_role hace *bypass* de RLS. El control de acceso se hace **en el backend** con RBAC.

En producción (`NODE_ENV=production`), el arranque **falla** si falta `CORE_JWT_SECRET` o
`SUPABASE_SERVICE_KEY` (sin defaults silenciosos).

## Autenticación del personal

`POST /api/core/auth/login` valida `{ numerodni, password }` contra `cmac_personal`. Las
contraseñas están **hasheadas con bcrypt** (`bcrypt.compare`); en el entorno de desarrollo la
contraseña efectiva es el propio DNI. Emite un JWT HS256 `{ personal_id, numerodni, rol,
aud: 'core' }`. El claim `aud:'core'` separa el token del personal del token de cliente del
Homebanking. Login con rate limiting (5/15 min → 429).

Usuarios de referencia (uno por rol): `11111111` asesor, `11111112` administrador,
`11111113` jefe_regional, `11111114` riesgos, `11111115` comite, `11111116` analista.

## Endpoints

Todos exigen `Authorization: Bearer <JWT de personal>` salvo el login.

**Flujo de otorgamiento** (`/api/core/solicitudes`)

| Método | Ruta | Roles |
|---|---|---|
| GET | `/` · `/:cod` | cualquier personal |
| POST | `/:cod/ingresos` · `/:cod/evaluacion` · `/:cod/comite` | asesor |
| POST | `/:cod/opinion` | administrador, jefe_regional, riesgos, analista |
| POST | `/:cod/resolver` · `/:cod/desembolsar` | comite |

**Recuperaciones / Mora** (`/api/core/mora`)

| Método | Ruta | Roles |
|---|---|---|
| GET | `/cartera?banda=` · `/kpis` · `/:cod/gestiones` | cualquier personal |
| POST | `/:cod/gestion` | administrador, asesor, analista |
| POST | `/:cod/judicial` (≥121 días) | administrador |
| POST | `/:cod/castigar` (>180 días) | comite |

**Dashboard** (`/api/core/dashboard`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/resumen` | KPIs + agregaciones (mora por banda, por producto, desembolsos/mes) |
| GET | `/export.csv` | Cartera como CSV descargable |

## Reglas de negocio

- **Elegibilidad** (`reglasCreditoService`): monto en rango del producto, plazo válido, cliente
  sujeto de crédito. No elegible → `Rechazado` + HTTP 422.
- **RDS y semáforo** (`evaluacionService`): `RDS = cuota / ingreso`; VERDE ≤ 0.30, AMBAR ≤ 0.40,
  ROJO > 0.40. Scoring 0–100 explicable.
- **Ruta de aprobación por montos** (`cmac_niveles_aprobacion` + `rutaAprobacionService`).
- **Desembolso y transiciones de mora atómicas** vía funciones RPC de PostgreSQL
  (`cmac_desembolsar_credito`, `cmac_derivar_judicial`, `cmac_castigar_credito`).
- **Bandas de mora** (`moraService.clasificarBanda`): fuente única reutilizada por mora y dashboard.

## Seguridad

- RBAC por rol (`middlewares/rbac.js`, `requireAuthPersonal` + `requireRol` → 403).
- Contraseñas con bcrypt; JWT con `aud:'core'`; rate limiting en el login.
- Sanitización de texto libre almacenado (`lib/sanitize.js`) + cabeceras HTTP de seguridad + CORS por env.
- Errores genéricos al cliente + log interno.

## Estructura

```
backend-core/
  app.js
  src/
    config/supabase.js
    lib/            # jwt.js (HS256), sanitize.js
    middlewares/    # rbac.js, rateLimiter.js
    routes/         # authRoutes, solicitudRoutes, moraRoutes, dashboardRoutes
    controllers/    # authController, solicitudController, moraController, dashboardController
    services/       # amortizacionService, flujoService, reglasCreditoService,
                    # evaluacionService, rutaAprobacionService, moraService
    repositories/   # personalRepository, productoRepository, solicitudRepository,
                    # moraRepository, dashboardRepository
  test/             # reglas, rbac, mora, seguridad, dashboard
```

## Tests

```bash
npm run test:reglas       # 9/9   elegibilidad + RDS + semáforo
npm run test:rbac         # 8/8   matriz de roles + separación de tokens + login bcrypt
npm run test:mora         # 19/19 bandas + KPIs + umbrales + roles
npm run test:seguridad    # 7/7   IDOR + fuerza bruta + sin stack trace + XSS
npm run test:dashboard    # 10/10 KPIs + coherencia + export CSV
```

> Los tests de integración requieren el servidor corriendo (`npm start`) y las variables de
> entorno configuradas.
