-- =====================================================================
-- 04_operaciones.sql  —  Operaciones y gestión de cobranza
-- Depende de: 03_credito.sql, 02_personas.sql
-- Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- cmac_operaciones: movimientos monetarios de una cuenta de crédito.
--   tipo: Desembolso (salida al cliente) | Pago Cuota (ingreso del cliente).
-- ---------------------------------------------------------------------
create table if not exists cmac_operaciones (
  id                uuid primary key default gen_random_uuid(),
  cuenta_credito_id uuid not null references cmac_cuentas_credito(id) on delete cascade,
  tipo              text not null check (tipo in ('Desembolso','Pago Cuota')),
  monto             numeric(14,2) not null,
  canal             text not null default 'Homebanking',
  fecha             timestamptz not null default now()
);

create index if not exists idx_operaciones_cuenta on cmac_operaciones (cuenta_credito_id);
create index if not exists idx_operaciones_tipo   on cmac_operaciones (tipo);

-- ---------------------------------------------------------------------
-- cmac_gestion_cobranza: gestiones de recuperación sobre créditos en mora
--   (módulo Recuperaciones, P5).
--   banda: banda de mora al momento de la gestión.
--   gestor_id: personal que realiza la gestión.
-- ---------------------------------------------------------------------
create table if not exists cmac_gestion_cobranza (
  id                uuid primary key default gen_random_uuid(),
  cuenta_credito_id uuid not null references cmac_cuentas_credito(id) on delete cascade,
  gestor_id         uuid references cmac_personal(id),
  banda             text,
  tipo_gestion      text,
  compromiso_pago   date,
  observacion       text,
  fecha             timestamptz not null default now()
);

create index if not exists idx_cobranza_cuenta on cmac_gestion_cobranza (cuenta_credito_id);
create index if not exists idx_cobranza_gestor on cmac_gestion_cobranza (gestor_id);
