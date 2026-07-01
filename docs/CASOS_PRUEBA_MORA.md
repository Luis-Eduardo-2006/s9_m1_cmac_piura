# Casos de prueba — Recuperaciones / Mora (P5)

Recorrido reproducible del módulo de mora sobre el **Core** (`/frontend-core` + `/backend-core`),
con la cartera semilla (mora ~13%). Requiere las migraciones `00–12` aplicadas y el Core
levantado (`backend-core` en :3001, `frontend-core` en :5174).

Usuarios (contraseña = DNI en desarrollo):

| Rol | DNI | Puede |
|---|---|---|
| administrador | `11111112` | consultar, gestionar, **derivar a judicial** |
| asesor | `11111111` | consultar, **gestionar cobranza** |
| analista | `11111116` | consultar, gestionar cobranza |
| comite | `11111115` | consultar, **castigar** |

## 1. Consultar cartera en mora (R1)

- Entra a `http://localhost:5174/login` (p.ej. asesor `11111111`) y abre **Recuperaciones**.
- Arriba verás los **KPIs**: saldo total, **saldo en mora (NPL)**, **ratio de mora ≈ 13.02 %**,
  y el conteo por banda (chips clicables que filtran).
- La tabla lista los créditos en mora con su **banda coloreada** (preventiva/temprana ámbar,
  tardía/judicial rojo, castigado gris). Filtra por banda con los chips o `?banda=` en la API.

✅ *R1: cartera por bandas + KPIs ~13 %.*

## 2. Registrar una gestión de cobranza (R2)

- Abre una cuenta morosa (**Gestionar**). En "Registrar gestión de cobranza": elige
  `llamada/visita/SMS/compromiso`, escribe una observación (y compromiso de pago opcional) →
  **Registrar gestión**.
- Aparece en el **Historial de gestiones** (orden cronológico).
- Un rol no gestor (p.ej. comité) verá el aviso "tu rol no gestiona cobranza" (y el backend
  devolvería 403 si llamara el endpoint por fuera).

✅ *R2: gestión registrada y visible en el historial.*

## 3. Derivar a judicial (R3 — administrador, ≥121 días)

- Entra como **administrador** (`11111112`). Abre una cuenta con **≥121 días** de atraso
  (banda Judicial en la tabla) → botón **Derivar a judicial**.
- Resultado: `estado_mora='Judicial'`, `flag_judicial=true`, `fecha_ingreso_judicial` fijada, y se
  registra la gestión "Derivacion judicial" (todo atómico vía RPC).
- Si la cuenta tiene **< 121 días** → **422** (umbral). Si lo intenta un **asesor** → **403** (rol).

## 4. Castigar crédito (R3 — comité, >180 días)

- Entra como **comité** (`11111115`). Abre una cuenta con **> 180 días** → **Castigar**.
- Resultado: `estado_mora='Castigado'`, `flag_castigado=true`, `fecha_castigo` fijada + gestión
  registrada (atómico).
- Con **≤ 180 días** → **422**. Con otro rol (p.ej. administrador) → **403**.

✅ *R3: transiciones exigen umbral de días Y rol; atómicas; reflejadas en estado_mora + flags.*

## Verificación automática

```bash
cd backend-core && npm start          # en otra terminal
cd backend-core && npm run test:mora  # 19/19: bandas límite + KPI ~13% + umbrales + roles
```

## Prueba rápida por API

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/core/auth/login -H 'Content-Type: application/json' \
  -d '{"numerodni":"11111112","password":"11111112"}' | sed -E 's/.*"token":"([^"]+)".*/\1/')

curl -s "http://localhost:3001/api/core/mora/kpis" -H "Authorization: Bearer $TOKEN"
curl -s "http://localhost:3001/api/core/mora/cartera?banda=Judicial" -H "Authorization: Bearer $TOKEN"
# Derivar a judicial (cuenta con >=121 días):
curl -s -X POST "http://localhost:3001/api/core/mora/CCR/judicial" -H "Authorization: Bearer $TOKEN"
```
