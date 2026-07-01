-- =====================================================================
-- 03_credito.sql  —  Núcleo del dominio de crédito
-- Depende de: 01_catalogos.sql, 02_personas.sql
-- Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- cmac_solicitudes: solicitud de crédito de un cliente (flujo P2).
--   estado: ciclo de vida En Evaluacion -> En Comite -> Aprobado /
--           Rechazado -> Desembolsado.
--   scoring / rds: se calculan en las reglas de negocio (P3).
-- ---------------------------------------------------------------------
create table if not exists cmac_solicitudes (
  id                   uuid primary key default gen_random_uuid(),
  codsolicitud         text not null unique,
  cliente_id           uuid not null references cmac_clientes(id),
  producto_id          uuid not null references cmac_productos(id),
  asesor_id            uuid references cmac_personal(id),
  nivel_aprobacion_id  uuid references cmac_niveles_aprobacion(id),
  estado               text not null default 'En Evaluacion'
                         check (estado in
                           ('En Evaluacion','En Comite','Aprobado','Rechazado','Desembolsado')),
  monto_solicitado     numeric(14,2) not null,
  monto_aprobado       numeric(14,2),
  plazo_meses          integer not null check (plazo_meses > 0),
  con_desgravamen      boolean not null default false,
  scoring              integer,
  rds                  numeric(6,4),
  motivo_rechazo       text,
  creada_en            timestamptz not null default now()
);

create index if not exists idx_solicitudes_cliente  on cmac_solicitudes (cliente_id);
create index if not exists idx_solicitudes_producto on cmac_solicitudes (producto_id);
create index if not exists idx_solicitudes_asesor   on cmac_solicitudes (asesor_id);
create index if not exists idx_solicitudes_estado   on cmac_solicitudes (estado);

-- ---------------------------------------------------------------------
-- cmac_evaluaciones: evaluación Microempresa (ME) o Consumo (CO) de una
--   solicitud. capacidad_pago alimenta el RDS.
-- ---------------------------------------------------------------------
create table if not exists cmac_evaluaciones (
  id                 uuid primary key default gen_random_uuid(),
  solicitud_id       uuid not null references cmac_solicitudes(id) on delete cascade,
  tipo               text not null check (tipo in ('ME','CO')),
  ingreso_disponible numeric(14,2) not null,
  gasto_familiar     numeric(14,2),
  capacidad_pago     numeric(14,2) not null,
  observacion        text,
  creada_en          timestamptz not null default now()
);

create index if not exists idx_evaluaciones_solicitud on cmac_evaluaciones (solicitud_id);

-- ---------------------------------------------------------------------
-- cmac_cuentas_credito: crédito desembolsado (cuenta viva).
--   estado_mora se deriva de dias_atraso (bandas en P5); flags para
--   judicial/castigo.
-- ---------------------------------------------------------------------
create table if not exists cmac_cuentas_credito (
  id                 uuid primary key default gen_random_uuid(),
  codcuentacredito   text not null unique,
  cliente_id         uuid not null references cmac_clientes(id),
  solicitud_id       uuid not null references cmac_solicitudes(id),
  monto_desembolsado numeric(14,2) not null,
  saldo_capital      numeric(14,2) not null,
  dias_atraso        integer not null default 0,
  estado_mora        text not null default 'Vigente'
                       check (estado_mora in
                         ('Vigente','Mora Preventiva','Mora Temprana','Mora Tardia','Judicial','Castigado')),
  flag_judicial      boolean not null default false,
  flag_castigado     boolean not null default false,
  desembolsado_en    timestamptz not null default now()
);

create index if not exists idx_ccredito_cliente   on cmac_cuentas_credito (cliente_id);
create index if not exists idx_ccredito_solicitud on cmac_cuentas_credito (solicitud_id);
create index if not exists idx_ccredito_mora      on cmac_cuentas_credito (estado_mora);

-- ---------------------------------------------------------------------
-- cmac_plan_pagos: cronograma de cuotas de una cuenta de crédito.
--   Una fila por cuota. pagada/fecha_pagada registran el cumplimiento.
-- ---------------------------------------------------------------------
create table if not exists cmac_plan_pagos (
  id                uuid primary key default gen_random_uuid(),
  cuenta_credito_id uuid not null references cmac_cuentas_credito(id) on delete cascade,
  nro_cuota         integer not null,
  fecha_pago        date not null,
  cuota             numeric(14,2) not null,
  capital           numeric(14,2) not null,
  interes           numeric(14,2) not null,
  saldo             numeric(14,2) not null,
  pagada            boolean not null default false,
  fecha_pagada      date,
  unique (cuenta_credito_id, nro_cuota)
);

create index if not exists idx_plan_cuenta on cmac_plan_pagos (cuenta_credito_id);
