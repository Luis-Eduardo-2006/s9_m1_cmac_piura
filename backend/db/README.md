# Modelo de datos del Core Bancario — scripts SQL

Migraciones versionadas para levantar el esquema del **Core Bancario** de CMAC Piura
sobre la misma base de datos Supabase que ya usa el Homebanking (`cmac_cuentas`,
`cmac_movimientos`).

Todas las tablas nuevas usan el prefijo `cmac_`, llaves primarias `uuid`
(`gen_random_uuid()`) y tienen **RLS habilitado**.

## Cómo ejecutar

En el **SQL Editor de Supabase**, abre cada archivo y pégalo/ejecútalo **en orden**.
Los scripts son **idempotentes**: puedes volver a correrlos sin duplicar datos ni
romper el esquema.

| Orden | Archivo | Qué hace |
|---|---|---|
| 1 | `00_extensions.sql`   | Extensión `pgcrypto` (para `gen_random_uuid()`). |
| 2 | `01_catalogos.sql`    | `cmac_productos`, `cmac_niveles_aprobacion`. |
| 3 | `02_personas.sql`     | `cmac_personal` (staff con rol), `cmac_clientes`. |
| 4 | `03_credito.sql`      | `cmac_solicitudes`, `cmac_evaluaciones`, `cmac_cuentas_credito`, `cmac_plan_pagos`. |
| 5 | `04_operaciones.sql`  | `cmac_operaciones`, `cmac_gestion_cobranza`. |
| 6 | `05_rls.sql`          | Funciones helper + políticas RLS por dueño y por personal. |
| 7 | `06_seed_base.sql`    | Semilla: 2 productos, 3 niveles, 9 empleados (1 por rol + 3 asesores), 17 clientes. |
| 8 | `07_seed_cartera.sql` | Semilla: 34 créditos desembolsados con cronograma real y mora ~13%. |
| 9 | `08_vincular_demo.sql` | (Demo P2) Vincula un `cmac_clientes` con un usuario de Supabase Auth. |
| 10 | `09_opiniones.sql`    | (P3) Columna `semaforo` en solicitudes + tabla `cmac_opiniones` + RLS. |
| 11 | `10_fn_desembolsar.sql` | (P3) Función RPC `cmac_desembolsar_credito` — desembolso atómico. |
| 12 | `11_hash_personal.sql` | (P4) Columna `password_hash` + hash bcrypt del DNI (pgcrypto). |
| 13 | `12_fn_mora.sql`       | (P5) Columnas de fecha + RPCs `cmac_derivar_judicial` / `cmac_castigar_credito`. |

> **Importante:** respeta el orden. Las llaves foráneas exigen que los catálogos y
> personas (01–02) existan antes que el crédito y las operaciones (03–04), y los seeds
> (06–07) dependen de que todo el esquema (01–05) ya esté creado. `09` y `10` (reglas de
> negocio P3) van después; `08` es opcional (solo para el demo del flujo HB→Core).

El `07_seed_cartera.sql` imprime un `NOTICE` al final con el número de cuentas, el saldo
total y el ratio de mora efectivo (~13%).

## Orden de dependencias (FK)

```
00_extensions
   └─ 01_catalogos ──┐
   └─ 02_personas ───┤
                     ├─ 03_credito ──┐
                     │               ├─ 04_operaciones
                     │               │
                     └─────── 05_rls (habilita RLS + policies)
                                     │
   06_seed_base (catálogos + personas) ──> 07_seed_cartera (crédito + operaciones)
```

## Enlace con Supabase Auth

`cmac_personal.auth_user_id` y `cmac_clientes.auth_user_id` quedan en `null` en el seed.
Se enlazarán con los usuarios reales de Supabase Auth más adelante; hasta entonces, las
políticas RLS de "dueño" no hacen match para esas filas (algo esperado: el seed se corre
con el rol de servicio, que hace bypass de RLS). El RBAC fino por rol se implementa en P4.

## Reset de la cartera semilla

`07_seed_cartera.sql` borra al inicio sus propias filas (códigos `sol-seed-*` /
`ccr-seed-*`) antes de reinsertar, así que reejecutarlo regenera la cartera desde cero
sin tocar el resto de datos.
