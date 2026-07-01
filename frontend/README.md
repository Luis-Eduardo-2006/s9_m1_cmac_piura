# frontend — Homebanking (CMAC Piura)

Aplicación web del cliente (React + Vite). Consume la API del Homebanking (`backend`).
Incluye login, simulador de crédito, solicitud de crédito, seguimiento de solicitudes y un
dashboard de cuentas y movimientos.

## Puesta en marcha

```bash
cd frontend
npm install
npm run dev       # servidor de desarrollo Vite (:5173)
npm run build     # build de producción (dist/)
npm run preview   # sirve el build
```

## Variables de entorno (`.env`)

| Clave | Descripción |
|---|---|
| `VITE_API_URL` | URL del backend Homebanking, incluyendo `/api` (ej. `http://localhost:3000/api`) |

## Vistas principales

| Ruta | Vista | Acceso |
|---|---|---|
| `/` | Landing | pública |
| `/banca` | Introducción "Caja Digital" | pública |
| `/login` | Autenticación | pública |
| `/simulador` | Simulador de crédito (amortización francesa) | pública |
| `/solicitar-credito` | Solicitud de crédito (simula y envía) | protegida |
| `/mis-solicitudes` | Estado de solicitudes | protegida |
| `/dashboard` | Cuentas y movimientos | protegida |

## Detalles técnicos

- **HTTP:** Axios; la URL base se lee de `import.meta.env.VITE_API_URL`.
- **Sesión:** token y usuario en `localStorage`; `services/authService.js` es la única fuente
  de la sesión. Las rutas protegidas usan `ProtectedRoute`.
- **Diseño:** tokens de marca CMAC Piura (azul `#004A9F`, amarillo `#F5C200`), fuente Inter,
  iconos Font Awesome; hook `useResponsive()` para adaptabilidad.
- **Despliegue:** Vercel (Vite); `vercel.json` reescribe las rutas a `/index.html` (SPA).
