require('dotenv').config();

// --- Validación de entorno (antes de cargar nada) ---
// CORE_JWT_SECRET DEBE venir del entorno. En producción, si falta, el arranque
// FALLA (sin default silencioso). En desarrollo se permite el default de rbac.js
// con un aviso.
if (!process.env.CORE_JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[backend-core] FATAL: CORE_JWT_SECRET es obligatorio en producción. Defínelo en las variables de entorno del servicio.');
    process.exit(1);
  }
  console.warn('[backend-core] AVISO: CORE_JWT_SECRET no definido; usando un secreto de desarrollo (solo local).');
}
if (process.env.NODE_ENV === 'production' && !process.env.SUPABASE_SERVICE_KEY) {
  console.error('[backend-core] FATAL: SUPABASE_SERVICE_KEY es obligatorio en producción (el Core escribe bajo RLS).');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/authRoutes');
const solicitudRoutes = require('./src/routes/solicitudRoutes');
const moraRoutes = require('./src/routes/moraRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');

const app = express();
app.disable('x-powered-by');

// Cabeceras de seguridad HTTP (igual que /backend).
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  next();
});

app.use(cors({
  origin: process.env.FRONTEND_CORE_URL || 'http://localhost:5174',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type'],
}));
app.use(express.json());

app.use('/api/core/auth', authRoutes);
app.use('/api/core/solicitudes', solicitudRoutes);
app.use('/api/core/mora', moraRoutes);
app.use('/api/core/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.json({ mensaje: 'API CORE Bancario CMAC Piura funcionando correctamente' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`[backend-core] Servidor CORE en puerto ${PORT}`));
