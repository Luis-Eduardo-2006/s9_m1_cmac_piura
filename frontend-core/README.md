# frontend-core — Core Bancario (personal · CMAC Piura)

Aplicación web del **personal del banco** (React + Vite). Consume la API del Core
(`backend-core`). Cubre el flujo de otorgamiento de crédito, recuperaciones/mora y un
dashboard ejecutivo de cartera.

## Puesta en marcha

```bash
cd frontend-core
npm install
npm run dev       # servidor de desarrollo Vite (:5174)
npm run build     # build de producción (dist/)
npm run preview   # sirve el build
```

## Variables de entorno (`.env`)

| Clave | Descripción |
|---|---|
| `VITE_API_URL_CORE` | URL del backend Core, incluyendo `/api/core` (ej. `http://localhost:3001/api/core`) |

## Vistas principales

| Ruta | Vista |
|---|---|
| `/login` | Acceso del personal (DNI + contraseña) |
| `/` | Bandeja de solicitudes |
| `/solicitud/:cod` | Detalle de solicitud con las acciones del flujo según el rol |
| `/recuperaciones` | Cartera en mora: KPIs + tabla filtrable por banda |
| `/mora/:cod` | Detalle de cuenta morosa: gestión de cobranza + derivar judicial / castigar |
| `/dashboard` | Dashboard ejecutivo (KPIs, gráficos, export CSV) |

## Detalles técnicos

- **HTTP:** Axios; la URL base se lee de `import.meta.env.VITE_API_URL_CORE`.
- **Sesión:** JWT del personal en `localStorage` (`services/auth.js`); rutas protegidas con
  `ProtectedRoute`.
- **Control de acceso en la UI:** los botones de acciones se muestran según el rol del usuario
  (p. ej. "Resolver comité" solo para comité). Es solo UX — la seguridad real se valida en el
  backend (un rol no autorizado recibe 403 aunque llame el endpoint directamente).
- **Gráficos:** Recharts (área de desembolsos, dona por banda de mora, barras por producto).
- **Diseño:** marca CMAC Piura (azul `#004A9F`, amarillo `#F5C200`), iconos Font Awesome.
- **Despliegue:** Vercel (Vite); `vercel.json` reescribe las rutas a `/index.html` (SPA).
