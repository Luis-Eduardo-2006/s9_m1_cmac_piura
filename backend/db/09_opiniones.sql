-- =====================================================================
-- 09_opiniones.sql  —  Reglas de negocio (P3): semáforo + ruta de opiniones
-- Depende de: 03_credito.sql, 05_rls.sql (helper cmac_es_personal()).
-- Idempotente.
-- =====================================================================

-- Color de semáforo del RDS persistido en la solicitud (VERDE/AMBAR/ROJO).
alter table cmac_solicitudes
  add column if not exists semaforo text
  check (semaforo in ('VERDE', 'AMBAR', 'ROJO'));

-- ---------------------------------------------------------------------
-- cmac_opiniones: opinión de un rol requerida por la ruta de aprobación
-- (según el nivel/monto). El resultado lo emite el rol en P4 (RBAC fino);
-- aquí se crean como 'Pendiente' al enviar a comité.
-- ---------------------------------------------------------------------
create table if not exists cmac_opiniones (
  id           uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references cmac_solicitudes(id) on delete cascade,
  rol_opinion  text not null,
  resultado    text not null default 'Pendiente'
                 check (resultado in ('Pendiente', 'Favorable', 'Desfavorable')),
  observacion  text,
  fecha        timestamptz not null default now(),
  unique (solicitud_id, rol_opinion)
);

create index if not exists idx_opiniones_solicitud on cmac_opiniones (solicitud_id);

alter table cmac_opiniones enable row level security;

drop policy if exists opiniones_lectura on cmac_opiniones;
create policy opiniones_lectura on cmac_opiniones      -- solo personal del banco
  for select to authenticated using (cmac_es_personal());

-- TODO(P4): políticas de INSERT/UPDATE por rol — solo el `rol_opinion`
-- correspondiente (administrador/riesgos/jefe_regional) podrá emitir/resolver
-- su propia opinión. Por ahora las escrituras las hace el backend-core con la
-- service_role (bypass de RLS).
