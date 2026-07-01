-- =====================================================================
-- 12_fn_mora.sql  —  Transiciones de mora ATÓMICAS (P5)
-- Depende de: 03_credito.sql, 04_operaciones.sql
--
-- Dos funciones plpgsql (una transacción cada una): actualizan la cuenta de
-- crédito (estado_mora + flag + fecha) Y registran la gestión en
-- cmac_gestion_cobranza. Validan el umbral de días dentro de la transacción
-- (defensa en profundidad; el controller también valida antes → 422).
-- Idempotente (create or replace / add column if not exists).
-- =====================================================================

alter table cmac_cuentas_credito add column if not exists fecha_ingreso_judicial timestamptz;
alter table cmac_cuentas_credito add column if not exists fecha_castigo timestamptz;

-- Derivar a judicial: requiere dias_atraso >= 121.
create or replace function cmac_derivar_judicial(
  p_codcuenta text, p_gestor uuid, p_observacion text
) returns jsonb
language plpgsql as $$
declare v_id uuid; v_dias int;
begin
  select id, dias_atraso into v_id, v_dias
  from cmac_cuentas_credito where codcuentacredito = p_codcuenta for update;

  if v_id is null then raise exception 'CUENTA_NO_EXISTE'; end if;
  if v_dias < 121 then raise exception 'UMBRAL_NO_CUMPLIDO: % dias', v_dias; end if;

  update cmac_cuentas_credito
    set flag_judicial = true, estado_mora = 'Judicial', fecha_ingreso_judicial = now()
    where id = v_id;

  insert into cmac_gestion_cobranza (cuenta_credito_id, gestor_id, banda, tipo_gestion, observacion)
    values (v_id, p_gestor, 'Judicial', 'Derivacion judicial', coalesce(p_observacion, 'Derivación a judicial'));

  return (select to_jsonb(c) from cmac_cuentas_credito c where c.id = v_id);
end $$;

-- Castigar crédito: requiere dias_atraso > 180.
create or replace function cmac_castigar_credito(
  p_codcuenta text, p_gestor uuid, p_observacion text
) returns jsonb
language plpgsql as $$
declare v_id uuid; v_dias int;
begin
  select id, dias_atraso into v_id, v_dias
  from cmac_cuentas_credito where codcuentacredito = p_codcuenta for update;

  if v_id is null then raise exception 'CUENTA_NO_EXISTE'; end if;
  if v_dias <= 180 then raise exception 'UMBRAL_NO_CUMPLIDO: % dias', v_dias; end if;

  update cmac_cuentas_credito
    set flag_castigado = true, estado_mora = 'Castigado', fecha_castigo = now()
    where id = v_id;

  insert into cmac_gestion_cobranza (cuenta_credito_id, gestor_id, banda, tipo_gestion, observacion)
    values (v_id, p_gestor, 'Castigado', 'Castigo de credito', coalesce(p_observacion, 'Castigo de crédito'));

  return (select to_jsonb(c) from cmac_cuentas_credito c where c.id = v_id);
end $$;

grant execute on function cmac_derivar_judicial(text, uuid, text) to service_role;
grant execute on function cmac_castigar_credito(text, uuid, text) to service_role;
