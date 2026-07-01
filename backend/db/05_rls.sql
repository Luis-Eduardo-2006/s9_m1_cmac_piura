-- =====================================================================
-- 05_rls.sql  —  Row Level Security del Core Bancario
-- Depende de: 01..04
-- Idempotente: drop policy if exists antes de cada create policy.
--
-- Modelo de acceso:
--   * CLIENTE  -> solo ve/gestiona SUS propios recursos
--                 (match auth.uid() = cmac_clientes.auth_user_id y,
--                  vía esa relación, solicitudes/cuentas/plan/operaciones).
--   * PERSONAL -> puede LEER la cartera (personal autenticado y activo).
--
-- Las acciones de escritura sensibles del personal (aprobar, desembolsar,
-- gestionar cobranza) se validarán ADEMÁS en el backend según el rol.
-- TODO(P4): reemplazar la lectura amplia del personal por RBAC fino por rol.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helpers: identifican al usuario autenticado como personal o cliente.
-- SECURITY DEFINER para poder consultar las tablas sin recursión de RLS.
-- ---------------------------------------------------------------------
create or replace function cmac_es_personal()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from cmac_personal p
    where p.auth_user_id = auth.uid() and p.activo
  );
$$;

create or replace function cmac_cliente_id_actual()
returns uuid
language sql stable security definer set search_path = public as $$
  select c.id from cmac_clientes c where c.auth_user_id = auth.uid() limit 1;
$$;

-- =====================================================================
-- Habilitar RLS en todas las tablas nuevas.
-- =====================================================================
alter table cmac_productos          enable row level security;
alter table cmac_niveles_aprobacion enable row level security;
alter table cmac_personal           enable row level security;
alter table cmac_clientes           enable row level security;
alter table cmac_solicitudes        enable row level security;
alter table cmac_evaluaciones       enable row level security;
alter table cmac_cuentas_credito    enable row level security;
alter table cmac_plan_pagos         enable row level security;
alter table cmac_operaciones        enable row level security;
alter table cmac_gestion_cobranza   enable row level security;

-- ---------------------------------------------------------------------
-- CATÁLOGOS (productos, niveles): tarifario PÚBLICO.
-- Lectura para anon + authenticated: el simulador de crédito es de cara al
-- cliente (endpoint público POST /api/creditos/simular) y el backend lee la
-- TEA de cmac_productos con la anon key.
-- ---------------------------------------------------------------------
drop policy if exists productos_lectura on cmac_productos;
create policy productos_lectura on cmac_productos          -- tarifario público
  for select to anon, authenticated using (true);

drop policy if exists niveles_lectura on cmac_niveles_aprobacion;
create policy niveles_lectura on cmac_niveles_aprobacion   -- rutas de aprobación visibles
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------
-- PERSONAL: cada trabajador ve su propia ficha; el personal ve al personal.
-- ---------------------------------------------------------------------
drop policy if exists personal_ve_su_ficha on cmac_personal;
create policy personal_ve_su_ficha on cmac_personal        -- protege datos de staff
  for select to authenticated
  using (auth_user_id = auth.uid() or cmac_es_personal());

-- ---------------------------------------------------------------------
-- CLIENTES: el cliente ve/edita su perfil; el personal lee todos.
-- ---------------------------------------------------------------------
drop policy if exists clientes_cliente_ve_su_perfil on cmac_clientes;
create policy clientes_cliente_ve_su_perfil on cmac_clientes  -- el cliente solo se ve a sí mismo
  for select to authenticated
  using (auth_user_id = auth.uid() or cmac_es_personal());

drop policy if exists clientes_cliente_edita_su_perfil on cmac_clientes;
create policy clientes_cliente_edita_su_perfil on cmac_clientes  -- el cliente edita solo su ficha
  for update to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- ---------------------------------------------------------------------
-- SOLICITUDES: el cliente ve/crea las suyas; el personal lee todas.
-- ---------------------------------------------------------------------
drop policy if exists solicitudes_lectura on cmac_solicitudes;
create policy solicitudes_lectura on cmac_solicitudes      -- dueño o personal
  for select to authenticated
  using (cliente_id = cmac_cliente_id_actual() or cmac_es_personal());

drop policy if exists solicitudes_cliente_crea on cmac_solicitudes;
create policy solicitudes_cliente_crea on cmac_solicitudes -- el cliente solicita para sí mismo
  for insert to authenticated
  with check (cliente_id = cmac_cliente_id_actual());

-- ---------------------------------------------------------------------
-- EVALUACIONES: visibles al dueño de la solicitud o al personal.
-- ---------------------------------------------------------------------
drop policy if exists evaluaciones_lectura on cmac_evaluaciones;
create policy evaluaciones_lectura on cmac_evaluaciones    -- ligada al dueño de la solicitud
  for select to authenticated
  using (
    cmac_es_personal() or exists (
      select 1 from cmac_solicitudes s
      where s.id = solicitud_id and s.cliente_id = cmac_cliente_id_actual()
    )
  );

-- ---------------------------------------------------------------------
-- CUENTAS DE CRÉDITO: el cliente ve las suyas; el personal lee todas.
-- ---------------------------------------------------------------------
drop policy if exists ccredito_lectura on cmac_cuentas_credito;
create policy ccredito_lectura on cmac_cuentas_credito     -- dueño o personal
  for select to authenticated
  using (cliente_id = cmac_cliente_id_actual() or cmac_es_personal());

-- ---------------------------------------------------------------------
-- PLAN DE PAGOS: visible al dueño del crédito o al personal.
-- ---------------------------------------------------------------------
drop policy if exists plan_lectura on cmac_plan_pagos;
create policy plan_lectura on cmac_plan_pagos              -- ligado al dueño del crédito
  for select to authenticated
  using (
    cmac_es_personal() or exists (
      select 1 from cmac_cuentas_credito cc
      where cc.id = cuenta_credito_id and cc.cliente_id = cmac_cliente_id_actual()
    )
  );

-- ---------------------------------------------------------------------
-- OPERACIONES: visibles al dueño del crédito o al personal.
-- ---------------------------------------------------------------------
drop policy if exists operaciones_lectura on cmac_operaciones;
create policy operaciones_lectura on cmac_operaciones      -- ligado al dueño del crédito
  for select to authenticated
  using (
    cmac_es_personal() or exists (
      select 1 from cmac_cuentas_credito cc
      where cc.id = cuenta_credito_id and cc.cliente_id = cmac_cliente_id_actual()
    )
  );

-- ---------------------------------------------------------------------
-- GESTIÓN DE COBRANZA: interna, solo personal (dato sensible de recuperación).
-- ---------------------------------------------------------------------
drop policy if exists cobranza_lectura on cmac_gestion_cobranza;
create policy cobranza_lectura on cmac_gestion_cobranza    -- solo personal del banco
  for select to authenticated
  using (cmac_es_personal());

-- =====================================================================
-- NOTA: las políticas de INSERT/UPDATE/DELETE del personal (aprobar,
-- desembolsar, registrar cobranza) se agregan en P4 junto con el RBAC.
-- El backend usa el token del usuario, por lo que estas policies aplican
-- por request. El seed (06/07) se ejecuta con el rol de servicio del SQL
-- Editor, que hace bypass de RLS.
-- =====================================================================
