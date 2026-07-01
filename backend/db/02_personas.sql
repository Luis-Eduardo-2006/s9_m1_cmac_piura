-- =====================================================================
-- 02_personas.sql  —  Personal del banco (staff) y clientes
-- Depende de: 00_extensions.sql
-- Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- cmac_personal: trabajadores del banco con su rol (RBAC en P4).
--   auth_user_id: se enlazará luego con el usuario de Supabase Auth.
-- ---------------------------------------------------------------------
create table if not exists cmac_personal (
  id           uuid primary key default gen_random_uuid(),
  numerodni    text not null unique,
  nombre       text not null,
  rol          text not null check (rol in
                 ('asesor','administrador','jefe_regional','riesgos','comite','analista')),
  auth_user_id uuid,
  activo       boolean not null default true,
  creado_en    timestamptz not null default now()
);

create index if not exists idx_personal_auth on cmac_personal (auth_user_id);
create index if not exists idx_personal_rol  on cmac_personal (rol);

-- ---------------------------------------------------------------------
-- cmac_clientes: clientes del banco (dueños de solicitudes y créditos).
--   es_sujeto_credito: bandera de elegibilidad base (scoring fino en P3).
--   auth_user_id: se enlazará luego con el usuario de Supabase Auth.
-- ---------------------------------------------------------------------
create table if not exists cmac_clientes (
  id                uuid primary key default gen_random_uuid(),
  codcliente        text not null unique,
  numerodni         text,
  nombre            text not null,
  ingreso_neto      numeric(14,2) not null default 0,
  es_sujeto_credito boolean not null default true,
  auth_user_id      uuid,
  creado_en         timestamptz not null default now()
);

create index if not exists idx_clientes_auth on cmac_clientes (auth_user_id);
create index if not exists idx_clientes_dni  on cmac_clientes (numerodni);
