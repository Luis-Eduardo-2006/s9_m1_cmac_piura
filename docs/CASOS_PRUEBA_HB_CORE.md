# Caso de prueba — Flujo Homebanking ↔ Core (MPR-003-CRE)

Recorrido reproducible del **otorgamiento de crédito de extremo a extremo** sobre la misma
base de datos Supabase. Alimenta el punto 4 del profesor (integración Core↔Homebanking).

## 0. Preparación (una sola vez)

1. **Base de datos**: ya deben estar corridos los scripts `backend/db/00`…`07` (modelo +
   seed). Ver `backend/db/README.md`.
2. **Vincular el cliente al usuario del Homebanking** (para que el HB sepa qué cliente eres):
   - Crea un usuario en Supabase → Authentication → Users (o usa uno existente) y anota su email.
   - Edita `backend/db/08_vincular_demo.sql` poniendo ese email; ejecútalo en el SQL Editor.
   - Deja `codcliente = 'cli000001'` (Castor Pérez) o el que prefieras.
3. **Variables de entorno**:
   - `backend/.env` → `SUPABASE_URL`, `SUPABASE_KEY` (anon), `PORT=3000`, `FRONTEND_URL`.
   - `backend-core/.env` → `SUPABASE_URL`, **`SUPABASE_SERVICE_KEY`** (service_role),
     `PORT=3001`, `FRONTEND_CORE_URL=http://localhost:5174`, `CORE_JWT_SECRET`.
   - `frontend/.env` → `VITE_API_URL=http://localhost:3000/api`.
   - `frontend-core/.env` → `VITE_API_URL_CORE=http://localhost:3001/api/core`.
4. **Levantar las 4 piezas** (4 terminales):
   ```bash
   cd backend        && npm start     # :3000  (Homebanking API)
   cd backend-core   && npm install && npm start   # :3001 (Core API)
   cd frontend       && npm run dev   # :5173  (Homebanking web)
   cd frontend-core  && npm install && npm run dev # :5174 (Core web)
   ```

## 1. Cliente solicita el crédito (Homebanking)

- Entra a `http://localhost:5173/login` e inicia sesión con el usuario vinculado en el paso 0.2.
- Ve a `http://localhost:5173/solicitar-credito`.
- Usa un caso del tarifario, p.ej. **monto 10 000, plazo 12, sin desgravamen**
  (equivale al Caso #5 → cuota esperada **S/ 1 009.46**). Verás la simulación (endpoint de P1).
- Pulsa **Enviar solicitud**. Se crea `cmac_solicitudes` en estado **En Evaluacion**.
- En `http://localhost:5173/mis-solicitudes` aparece con su `codsolicitud` y estado.

✅ *Criterio 1: la solicitud aparecerá en la bandeja del Core.*

## 2. Asesor evalúa (Core)

- Entra a `http://localhost:5174/login` como **asesor**: DNI `11111111`, contraseña `11111111`.
- En la **bandeja** verás la solicitud recién creada. Ábrela.
- **Registrar ingresos**: ingresa el ingreso del cliente (p.ej. 3000) → *Registrar ingresos*.
- **Evaluación**: ingreso disponible (p.ej. 3000) y gasto familiar (p.ej. 500) →
  *Registrar evaluación* (calcula RDS y scoring con la cuota estimada del tarifario).
- **Enviar a comité** → estado pasa a **En Comite**.

## 3. Comité aprueba y desembolsa (Core)

- **Entra como comité**: DNI `11111115` / `11111115`. Desde P4 (RBAC) **solo el rol `comite`**
  puede resolver y desembolsar; un asesor recibiría **403**.
- En el detalle, con estado **En Comite**: fija el **monto aprobado** (10 000) y pulsa **Aprobar**
  → estado **Aprobado**.
- Con estado **Aprobado** aparece **Desembolsar**. Púlsalo:
  - crea `cmac_cuentas_credito` (código `ccr-<codsolicitud>`),
  - genera `cmac_plan_pagos` (cronograma real, cuota 1 009.46, cierra en saldo 0),
  - registra `cmac_operaciones` tipo **Desembolso**,
  - estado pasa a **Desembolsado**.

✅ *Criterio 2: asesor evalúa/envía a comité; comité aprueba y desembolsa.*

## 4. El cliente ve el desembolso reflejado (Homebanking)

- Vuelve al Homebanking (`:5173`).
- **Mis solicitudes**: la solicitud figura como **Desembolsado**.
- **Dashboard**: aparece la **cuenta de crédito** (`Crédito ccr-…`) con su saldo capital, y en
  **movimientos** el **Desembolso de crédito** como entrada — sin tocar la BD a mano.

✅ *Criterio 3: el cliente ve el crédito y el movimiento de desembolso reflejados.*

## 5. Transiciones inválidas → 409

Prueba (p.ej. con curl o desde la UI en un estado que no corresponde):
- Desembolsar una solicitud que no está **Aprobado** → **409**
  `Transición inválida: no se puede "desembolsar" una solicitud en estado "...".`
- Enviar a comité sin evaluación previa → **409** `Registra la evaluación antes de enviar a comité.`

✅ *Criterio 4: las transiciones inválidas devuelven 409.*

## Reglas de negocio (P3) — casos de aceptación

Requiere haber corrido `backend/db/09_opiniones.sql` y `10_fn_desembolsar.sql`.
El ingreso del cliente se fija con **Registrar ingresos** o con `ingresoDisponible` en la
evaluación. La cuota de referencia es la del **Caso #5** (monto 10 000 / 12 m / sin
desgravamen) = **S/ 1 009.46**.

### A. Caso que se APRUEBA (semáforo VERDE)
- Solicita 10 000 a 12 meses. En el Core, evalúa con **ingreso 5 000**.
- `RDS = 1009.46 / 5000 = 0.2019` → **VERDE**. Envía a comité → **Nivel 1** (sin opiniones).
- Comité **Aprueba** (10 000) → **Desembolsa** (atómico). ✅

### B. Caso que se RECHAZA por regla (elegibilidad → 422)
- Solicita con un **plazo inválido** (p.ej. 10 meses) o **monto fuera de rango** (p.ej. 400 000).
- En el Core, al **evaluar**, la solicitud pasa a **Rechazado** con motivo
  (`PLAZO_INVALIDO: …` o `MONTO_FUERA_DE_RANGO: …`) y el endpoint responde **422**. No avanza. ✅

### C. Los tres colores del semáforo (misma cuota 1 009.46)
| Ingreso al evaluar | RDS | Semáforo |
|---|---|---|
| 5 000 | 0.2019 | **VERDE** (≤ 0.30) |
| 3 000 | 0.3365 | **AMBAR** (0.30–0.40) |
| 2 000 | 0.5047 | **ROJO** (> 0.40) |

`ROJO` no bloquea automáticamente: queda registrado y decide el comité. Solo la elegibilidad
bloquea (→ 422). Reproducible en frío con `cd backend-core && npm run test:reglas` (9/9).

### D. Ruta por montos (envío a comité)
- Monto ≤ 30k → **Nivel 1** (sin opiniones). 30k–300k → **Nivel 2** (administrador + riesgos).
  ≥ 300k → **Nivel 3** (jefe_regional + riesgos). Las opiniones se crean como `Pendiente` en
  `cmac_opiniones` (su emisión por rol es P4).

### E. Desembolso atómico
- El `desembolsar` usa el RPC `cmac_desembolsar_credito`: los 4 escritos ocurren en una
  transacción. Si falla cualquiera (o el estado ya no es `Aprobado`), **no se escribe nada** y
  el estado no cambia.

## Resumen de estados

```
En Evaluacion --(comité)--> En Comite --(resolver: APROBADO)--> Aprobado --(desembolsar)--> Desembolsado
                                        \--(resolver: RECHAZADO)--> Rechazado
```

## Prueba rápida por API (sin UI)

```bash
# Login personal (asesor)
TOKEN=$(curl -s -X POST http://localhost:3001/api/core/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"numerodni":"11111111","password":"11111111"}' | sed -E 's/.*"token":"([^"]+)".*/\1/')

# Bandeja
curl -s http://localhost:3001/api/core/solicitudes -H "Authorization: Bearer $TOKEN"

# Con el codsolicitud (COD) del cliente:
curl -s -X POST http://localhost:3001/api/core/solicitudes/COD/evaluacion \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"ingresoDisponible":3000,"gastoFamiliar":500}'
curl -s -X POST http://localhost:3001/api/core/solicitudes/COD/comite      -H "Authorization: Bearer $TOKEN"
curl -s -X POST http://localhost:3001/api/core/solicitudes/COD/resolver    -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"resultado":"APROBADO","montoAprobado":10000}'
curl -s -X POST http://localhost:3001/api/core/solicitudes/COD/desembolsar -H "Authorization: Bearer $TOKEN"
```
