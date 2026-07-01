# Despliegue a producción — checklist (P8)

El sistema son **4 piezas** sobre una BD Supabase; se entregan **4 URLs**:

| Pieza | Carpeta | Servicio | Entrega |
|---|---|---|---|
| Homebanking Front | `/frontend` | Vercel | `URL_HomeBanking_FrontEnd` (ya publicada) |
| Core Front (personal) | `/frontend-core` | Vercel | `URL_CORE_FrontEnd` |
| Homebanking Back (API) | `/backend` | Render | `URL_HomeBanking_BackEnd` |
| Core Back (API) | `/backend-core` | Render | `URL_CORE_BackEnd` |

> **Orden obligatorio:** primero los **backends** (Render), luego los **frontends** (Vercel),
> porque cada front necesita la URL de su back. Al final se **cablea** el CORS de los backends
> con las URLs de Vercel y se hace *redeploy*.

Los cuatro leen TODO de variables de entorno; **no hay secretos en el repo** (`.env` y
`.mcp.json` están en `.gitignore`; hay `.env.example` en las 4 piezas con los nombres).

---

## Paso 0 — Seguridad previa (una vez)

1. **Rota el Management Token de Supabase** (Dashboard → Account → Access Tokens): el token
   `sbp_…` que estuvo en `.mcp.json` se usó para aplicar migraciones; genera uno nuevo y borra
   el viejo. (`.mcp.json` está gitignored, pero rotar es buena práctica.)
2. Confirma que no hay claves rastreadas:
   ```bash
   git ls-files | grep -E "\.env$|\.mcp\.json"        # debe salir vacío
   git grep -nE "eyJhbGciOiJ|sbp_[a-z0-9]{20}"          # debe salir vacío
   ```
3. Ten a mano, del Dashboard de Supabase → Project Settings → API:
   - `SUPABASE_URL` (Project URL, público)
   - `anon` key (pública)
   - `service_role` key (**secreta** — solo para el Core)
4. Genera un secreto para el JWT del personal: `openssl rand -hex 32` → será `CORE_JWT_SECRET`.

---

## Paso 1 — Backend Homebanking en Render

- **New → Web Service**, conecta el repo, **Root Directory:** `backend`.
- **Build Command:** `npm install`
- **Start Command:** `node app.js`
- **Environment Variables:**
  | Clave | Valor |
  |---|---|
  | `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
  | `SUPABASE_KEY` | *(anon key)* |
  | `FRONTEND_URL` | *(se completa en el Paso 5 con la URL de Vercel del HB)* |
  | `NODE_ENV` | `production` |
- Deploy → anota la URL → **`URL_HomeBanking_BackEnd`** (ej. `https://cmac-hb.onrender.com`).
- Prueba: abrir esa URL → debe responder `{"mensaje":"API Portal Mi Banco..."}`.

## Paso 2 — Backend Core en Render

- **New → Web Service**, **Root Directory:** `backend-core`.
- **Build Command:** `npm install`
- **Start Command:** `node app.js`
- **Environment Variables:**
  | Clave | Valor |
  |---|---|
  | `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
  | `SUPABASE_SERVICE_KEY` | *(service_role key — secreta)* |
  | `SUPABASE_KEY` | *(anon key; opcional, fallback)* |
  | `CORE_JWT_SECRET` | *(el `openssl rand -hex 32` del Paso 0)* |
  | `FRONTEND_CORE_URL` | *(se completa en el Paso 5 con la URL de Vercel del Core)* |
  | `NODE_ENV` | `production` |
- Deploy → anota la URL → **`URL_CORE_BackEnd`** (ej. `https://cmac-core.onrender.com`).
- Prueba: abrir esa URL → `{"mensaje":"API CORE Bancario..."}`.
  > Si falta `CORE_JWT_SECRET` o `SUPABASE_SERVICE_KEY` con `NODE_ENV=production`, el arranque
  > **falla a propósito** (verás `FATAL: ... obligatorio en producción` en los logs).

## Paso 3 — Frontend Homebanking en Vercel

- **Add New → Project**, **Root Directory:** `frontend`. Framework: **Vite** (autodetectado).
- Build: `npm run build` · Output: `dist` (por defecto). Ya hay `frontend/vercel.json` (SPA).
- **Environment Variable:**
  | Clave | Valor |
  |---|---|
  | `VITE_API_URL` | `https://<URL_HomeBanking_BackEnd>/api` |
- Deploy → anota la URL → **`URL_HomeBanking_FrontEnd`**.

## Paso 4 — Frontend Core en Vercel

- **Add New → Project**, **Root Directory:** `frontend-core`. Framework: **Vite**.
- Ya hay `frontend-core/vercel.json` (reescritura SPA para `/dashboard`, `/mora/:cod`, etc.).
- **Environment Variable:**
  | Clave | Valor |
  |---|---|
  | `VITE_API_URL_CORE` | `https://<URL_CORE_BackEnd>/api/core` |
- Deploy → anota la URL → **`URL_CORE_FrontEnd`**.

## Paso 5 — Cablear el CORS (backends ↔ frontends) y redeploy

Ya tienes las URLs de Vercel; complétalas en Render:
- Backend HB (Paso 1): `FRONTEND_URL = <URL_HomeBanking_FrontEnd>` → **Save + Manual Deploy**.
- Backend Core (Paso 2): `FRONTEND_CORE_URL = <URL_CORE_FrontEnd>` → **Save + Manual Deploy**.

> Sin este paso, el navegador bloqueará las llamadas por CORS (los backends solo permiten su
> propio front). Sin comodín `*`.

## Paso 6 — Verificación e2e en producción

1. **Calienta los backends** (Render free tier "duerme"): abre `URL_HomeBanking_BackEnd` y
   `URL_CORE_BackEnd` en el navegador hasta ver el JSON de salud (primer request tarda ~30 s).
2. **Homebanking** (`URL_HomeBanking_FrontEnd`): login del cliente → **Solicitar crédito**
   (simula y envía) → **Mis solicitudes** muestra "En Evaluacion".
3. **Core** (`URL_CORE_FrontEnd`): login asesor `11111111`/`11111111` → la solicitud aparece en
   la bandeja → registrar ingresos + evaluación → enviar a comité; login comité
   `11111115`/`11111115` → aprobar → desembolsar.
4. **Homebanking** de nuevo: el cliente ve el crédito y el desembolso en cuentas/movimientos.
5. **Core → Dashboard** y **Recuperaciones**: KPIs con ratio ~13 %, export CSV.

> Recuerda: para que el paso 2 funcione, el usuario del cliente debe estar vinculado a un
> `cmac_clientes` (ver `backend/db/08_vincular_demo.sql`).

---

## Recordatorios

- **Migraciones:** la BD ya tiene aplicados `00–12` (esquema + seed + funciones RPC + hash +
  mora). Si se recrea el proyecto Supabase, ejecutar los scripts de `backend/db/` en orden
  (ver `backend/db/README.md`).
- **Nunca** subas `.env` ni pegues llaves en el repo. Si una llave se filtró, **rótala** en
  Supabase.
- **4 URLs a entregar:** `URL_HomeBanking_FrontEnd`, `URL_CORE_FrontEnd`,
  `URL_HomeBanking_BackEnd`, `URL_CORE_BackEnd`.
