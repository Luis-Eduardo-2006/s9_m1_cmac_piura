# backend — API Homebanking (CMAC Piura)

API REST del **Homebanking** (cara al cliente). Arquitectura por capas
`rutas → middlewares → controladores → Supabase`. Usa la **anon key** de Supabase junto con el
token del usuario autenticado, de modo que **Row Level Security (RLS)** filtra los datos por
cliente. También expone el **simulador de crédito** (cálculo en el Core) de forma pública.

## Puesta en marcha

```bash
cd backend
npm install
npm start        # node app.js — escucha en $PORT (local: 3000)
```

## Variables de entorno (`.env`)

| Clave | Descripción |
|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_KEY` | anon key (con el token del usuario aplica RLS) |
| `PORT` | Puerto (local 3000; en Render se asigna solo) |
| `FRONTEND_URL` | Origen permitido por CORS (URL del frontend) |

## Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | pública (rate limited) | Login del cliente (Supabase Auth) |
| GET | `/api/auth/me` | Bearer | Usuario del token |
| GET | `/api/cuentas` | Bearer | Cuentas del cliente + créditos desembolsados |
| GET | `/api/movimientos` | Bearer | Movimientos + operaciones de crédito |
| POST | `/api/creditos/simular` | pública | Simulación de crédito (cuota + cronograma) |
| POST | `/api/hb/solicitar` | Bearer | Registra una solicitud de crédito |
| GET | `/api/hb/mis-solicitudes` | Bearer | Estado de las solicitudes del cliente |

**Cálculo de crédito:** la amortización francesa vive en
`src/services/amortizacionService.js` (funciones puras) y la TEA se lee del tarifario
(`cmac_productos`), no está hardcodeada.

## Seguridad

- **Rate limiting** en el login (5 intentos / 15 min por IP+email → HTTP 429).
- **CORS** restringido a `FRONTEND_URL` (sin comodín).
- Cabeceras HTTP de seguridad (CSP, `X-Frame-Options`, `nosniff`, …) y `x-powered-by` deshabilitado.
- Errores con mensaje genérico al cliente + log interno (sin filtrar detalles de la BD).
- Acceso a datos vía el query builder de Supabase (consultas parametrizadas).

## Estructura

```
backend/
  app.js                     # entry point: cabeceras, CORS, montaje de rutas
  src/
    config/supabase.js       # cliente Supabase
    routes/                  # authRoutes, dataRoutes, hbRoutes
    middlewares/             # authMiddleware (verificarToken), rateLimiter
    controllers/             # authController, dataController, creditoController, hbController
    services/                # amortizacionService
    repositories/            # productoRepository
  db/                        # migraciones SQL del Core (00→12) + README
  test/                      # validar_casos_backend.mjs (acceptación del cálculo)
```

## Tests

```bash
npm run test:casos      # 30/30 — valida la cuota del simulador contra el tarifario
```
