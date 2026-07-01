# Dashboard ejecutivo — guía de lectura (para la sustentación)

**Qué es:** un **dashboard analítico integrado** en el frontend del Core
(`/frontend-core` → ruta `/dashboard`), construido con React + Recharts, que consume datos
**reales** de Supabase a través del backend del Core. Es la alternativa integrada a Power BI
(permitida por el profesor); además, incluye **exportación CSV** como puente por si se desea
armar el mismo tablero en Power BI.

Cuenta la misma historia que la guía Power BI de "Caja Andina" (cartera, mora, desembolsos),
pero con la cartera real del sistema (34 créditos, ratio de mora ~13 %).

## Cómo abrirlo

1. Levanta el Core: `cd backend-core && npm start` y `cd frontend-core && npm run dev`.
2. Entra a `http://localhost:5174/login` con cualquier usuario del personal (p.ej. asesor
   `11111111` / `11111111`) y pulsa **Dashboard** en la barra superior.

## Qué muestra cada bloque

1. **KPI cards (arriba):**
   - **Cartera total** — suma del saldo capital vivo de todos los créditos.
   - **Ratio de mora** — saldo vencido (NPL: Temprana + Tardía + Judicial + Castigado) / cartera
     total. **Coincide con la página de Recuperaciones** (misma fuente `clasificarBanda`).
   - **Cartera vencida** — saldo en mora contable (NPL).
   - **Desembolsos** — total colocado (suma de operaciones de tipo Desembolso).
   - **N° créditos** y **Ticket promedio** (desembolsos / n° créditos).
2. **Desembolsos por mes (área):** evolución de las colocaciones agrupadas por `YYYY-MM` a
   partir de `cmac_operaciones`. Con la cartera semilla se observan ~6 meses (ene–jun 2026).
3. **Cartera por banda de mora (dona):** composición del saldo por banda, con el **semáforo**
   (preventiva/temprana ámbar, tardía/judicial rojo, castigado gris/negro). La porción grande
   "Vigente" vs las de mora ilustra la salud de la cartera.
4. **Cartera por producto (barras):** saldo por producto (Empresarial vs Consumo).
5. **Tabla por banda:** saldo, conteo y % de cartera por banda, con el **ratio de mora resaltado**.
6. **Exportar CSV:** descarga `cartera_cmac_piura.csv` (una fila por crédito) desde
   `GET /api/core/dashboard/export.csv` — el puente a Power BI.

## Coherencia (verificable)

- `cartera_vigente + cartera_vencida = cartera_total` (comprobado por `dashboard.test.mjs`).
- `ratio_mora ≈ 13 %`, igual al de Recuperaciones.
- Todos los cocientes usan **divide seguro** (nunca dividen por cero).

## Limitaciones honestas (no se inventan datos)

- **Producto:** la cartera semilla contiene solo crédito **Empresarial (EMP)**; el bloque por
  producto muestra solo EMP hasta que existan créditos de Consumo (aparecerían automáticamente).
- **Oficinas/agencias:** el modelo de datos no tiene ese eje → se **omite** (no se rellena con
  datos ficticios).
- **Fechas:** los meses provienen de `desembolsado_en` del seed; no hay un cron que recalcule
  días de atraso (se respeta la calibración del 13 %).

## Fuente única de la verdad

El endpoint `GET /api/core/dashboard/resumen` agrega todo en **una** respuesta (menos llamadas),
reutilizando `moraService.clasificarBanda` / `esNPL` — las mismas funciones que alimentan
Recuperaciones —, por lo que las cifras del dashboard y de la cartera en mora **siempre cuadran**.
