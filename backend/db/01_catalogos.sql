-- =====================================================================
-- 01_catalogos.sql  —  Catálogos base del Core (productos y niveles)
-- Depende de: 00_extensions.sql
-- Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- cmac_productos: catálogo de productos de crédito y sus tasas (TEA).
--   codigo: EMP = Crédito Empresarial Micro-Micro | CON = Consumo
--   tea_con_desgravamen / tea_sin_desgravamen: tasas efectivas anuales
--   como fracción (0.4092 = 40.92 %).
-- ---------------------------------------------------------------------
create table if not exists cmac_productos (
  id                  uuid primary key default gen_random_uuid(),
  codigo              text not null unique check (codigo in ('EMP', 'CON')),
  nombre              text not null,
  tea_con_desgravamen numeric(6,4) not null,
  tea_sin_desgravamen numeric(6,4) not null,
  monto_min           numeric(14,2) not null default 0,
  monto_max           numeric(14,2) not null,
  activo              boolean not null default true,
  creado_en           timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- cmac_niveles_aprobacion: ruta de aprobación según el monto solicitado.
--   requiere_opinion: si además del comité se necesita opinión de
--   Administrador/Riesgos/Jefe Regional (se refina en P3/P4).
-- ---------------------------------------------------------------------
create table if not exists cmac_niveles_aprobacion (
  id               uuid primary key default gen_random_uuid(),
  nombre           text not null unique,
  monto_minimo     numeric(14,2) not null,
  monto_maximo     numeric(14,2) not null,
  requiere_opinion boolean not null default false,
  descripcion      text
);

-- Índice para resolver rápido el nivel a partir de un monto.
create index if not exists idx_niveles_rango
  on cmac_niveles_aprobacion (monto_minimo, monto_maximo);
