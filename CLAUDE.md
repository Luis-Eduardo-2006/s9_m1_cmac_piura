# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portal bancario educativo para CMAC Piura (Caja Municipal de Ahorro y Crédito de Piura). Monorepo con backend Express y frontend React separados.

## Running the Project

**Backend** (puerto 3000):
```bash
cd backend
node app.js
```

**Frontend** (puerto 5173):
```bash
cd frontend/s9_m1_react_supabase
npm run dev
```

Both must run simultaneously. The frontend calls the backend at `http://localhost:3000`.

## Backend Architecture

Strict 4-layer architecture: **Routes → Controllers → Services → Repository → Supabase**

```
backend/
  app.js                          # Entry point, CORS, mounts /api/auth and /api
  src/
    config/supabase.js            # Single shared Supabase client instance
    routes/authRoutes.js          # POST /api/auth/login, GET /api/auth/me
    routes/dataRoutes.js          # GET /api/cuentas, GET /api/movimientos
    middlewares/authMiddleware.js # verificarToken — validates Bearer token via Supabase
    controllers/authController.js # login(), me()
    controllers/dataController.js # listarCuentas(), listarMovimientos()
```

**Auth middleware** (`verificarToken`): validates the Bearer token via `supabase.auth.getUser()` and attaches `{ id, email, nombre }` to `req.user`. All `/api/*` data routes are protected.

**Data controller pattern**: `clienteParaUsuario(token)` creates a per-request Supabase client passing the user's token in headers — this ensures Supabase RLS (Row Level Security) applies per user.

**Backend `.env`** (required):
```
SUPABASE_URL=
SUPABASE_KEY=
JWT_SECRET=
PORT=3000
```

## Frontend Architecture

```
frontend/s9_m1_react_supabase/src/
  main.jsx                      # React entry point
  App.jsx                       # BrowserRouter + all routes
  index.css                     # Design tokens (CSS vars), shared button/message classes
  services/
    authService.js              # login(), guardarSesion(), obtenerSesion(), cerrarSesion(), haySession()
    dataService.js              # getCuentas(), getMovimientos() — attaches Bearer token via authHeader()
  components/
    ProtectedRoute.jsx          # Redirects to /login if haySession() is false
  pages/
    LandingPage.jsx             # Public homepage
    BancaPage.jsx               # "Caja Digital" intro page
    LoginPage.jsx               # Auth form
    DashboardPage.jsx           # Protected — accounts + transactions
```

**Routes:**
| Path | Component | Protection |
|---|---|---|
| `/` | LandingPage | Public |
| `/banca` | BancaPage | Public |
| `/login` | LoginPage | Public |
| `/dashboard` | DashboardPage | ProtectedRoute |

**Session storage**: token and user object are stored in `localStorage` (`'token'` and `'usuario'` keys). `authService.js` is the single source of truth for session reads/writes.

**Styling**: inline styles + global `index.css`. Design tokens in CSS variables: `--azul` (#004A9F), `--amarillo` (#F5C200). Icons via Font Awesome 6.5 (CDN). Font: Inter (Google Fonts).

## Supabase Tables

| Table | Key columns |
|---|---|
| `cmac_cuentas` | `id`, `label`, `saldo`, `sub`, `color`, `icono`, `orden` |
| `cmac_movimientos` | `id`, `fecha`, `descripcion`, `tipo`, `monto` |

`tipo` in `cmac_movimientos` distinguishes `'entrada'` (green) vs `'salida'` (red) in the dashboard.

## Adding New Features

Follow the existing 4-layer pattern for backend. For example, to add "Transferencias":
1. `src/routes/dataRoutes.js` — add route with `verificarToken`
2. `src/controllers/dataController.js` — add controller function using `clienteParaUsuario`
3. Frontend: add a service function in `dataService.js`, then consume it in a new page/component
4. Register the route in `App.jsx` and add a link in `DashboardPage.jsx`'s quick actions grid
