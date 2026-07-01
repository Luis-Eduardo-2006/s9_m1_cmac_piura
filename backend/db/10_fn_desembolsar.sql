-- =====================================================================
-- 10_fn_desembolsar.sql  —  Desembolso ATÓMICO (P3)
-- Depende de: 03_credito.sql, 04_operaciones.sql
--
-- Función plpgsql que hace, en UNA sola transacción (todo-o-nada):
--   1) inserta cmac_cuentas_credito
--   2) inserta cmac_plan_pagos (desde el cronograma en jsonb)
--   3) inserta cmac_operaciones (Desembolso)
--   4) actualiza cmac_solicitudes.estado -> 'Desembolsado'
-- Si CUALQUIER paso falla, se revierte TODO y el estado NO cambia.
-- La llama backend-core vía supabase.rpc('cmac_desembolsar_credito', {...}).
-- Idempotente en cuanto a definición (create or replace).
-- =====================================================================

create or replace function cmac_desembolsar_credito(
  p_solicitud_id     uuid,
  p_codcuentacredito text,
  p_cliente_id       uuid,
  p_monto            numeric,
  p_plan             jsonb
) returns uuid
language plpgsql
as $$
declare
  v_estado text;
  v_cuenta uuid;
begin
  -- Bloquea la solicitud y valida el estado dentro de la transacción.
  select estado into v_estado
  from cmac_solicitudes
  where id = p_solicitud_id
  for update;

  if v_estado is null then
    raise exception 'SOLICITUD_NO_EXISTE';
  end if;
  if v_estado <> 'Aprobado' then
    raise exception 'ESTADO_INVALIDO: %', v_estado;
  end if;

  -- 1) Cuenta de crédito
  insert into cmac_cuentas_credito
    (codcuentacredito, cliente_id, solicitud_id, monto_desembolsado, saldo_capital, dias_atraso, estado_mora)
  values
    (p_codcuentacredito, p_cliente_id, p_solicitud_id, p_monto, p_monto, 0, 'Vigente')
  returning id into v_cuenta;

  -- 2) Plan de pagos (desde el cronograma jsonb)
  insert into cmac_plan_pagos
    (cuenta_credito_id, nro_cuota, fecha_pago, cuota, capital, interes, saldo, pagada)
  select v_cuenta, x.nro_cuota, x.fecha_pago, x.cuota, x.capital, x.interes, x.saldo, false
  from jsonb_to_recordset(p_plan) as x(
    nro_cuota int, fecha_pago date, cuota numeric, capital numeric, interes numeric, saldo numeric
  );

  -- 3) Operación de desembolso
  insert into cmac_operaciones (cuenta_credito_id, tipo, monto, canal)
  values (v_cuenta, 'Desembolso', p_monto, 'Core');

  -- 4) Estado final
  update cmac_solicitudes set estado = 'Desembolsado' where id = p_solicitud_id;

  return v_cuenta;
end;
$$;

-- El backend-core la invoca con la service_role.
grant execute on function cmac_desembolsar_credito(uuid, text, uuid, numeric, jsonb) to service_role;
