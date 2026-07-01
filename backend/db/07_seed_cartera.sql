-- =====================================================================
-- 07_seed_cartera.sql  —  Cartera de crédito calibrada (mora ~13%)
-- Depende de: 06_seed_base.sql (productos, personal, clientes)
--
-- Genera 34 créditos desembolsados usando los clientes semilla, con su
-- solicitud, cronograma (amortización francesa real), operaciones y, para
-- los morosos, una gestión de cobranza. ~13% del saldo total queda en
-- estados de mora contable (Temprana/Tardía/Judicial/Castigado).
--
-- Idempotente: borra primero las filas semilla (cod '*-seed-*') y reinserta.
-- Ejecuta con el rol de servicio del SQL Editor (bypass de RLS).
-- =====================================================================

-- --- Limpieza idempotente (en orden de dependencia FK) ---------------
delete from cmac_gestion_cobranza
  where cuenta_credito_id in (select id from cmac_cuentas_credito where codcuentacredito like 'ccr-seed-%');
delete from cmac_operaciones
  where cuenta_credito_id in (select id from cmac_cuentas_credito where codcuentacredito like 'ccr-seed-%');
delete from cmac_plan_pagos
  where cuenta_credito_id in (select id from cmac_cuentas_credito where codcuentacredito like 'ccr-seed-%');
delete from cmac_cuentas_credito where codcuentacredito like 'ccr-seed-%';
delete from cmac_solicitudes    where codsolicitud    like 'sol-seed-%';

do $$
declare
  rec           record;
  v_idx         integer := 0;
  v_producto    uuid;
  v_gestor      uuid;
  v_asesores    uuid[];
  v_asesor      uuid;
  v_nivel       uuid;
  v_cliente_id  uuid;
  v_ingreso     numeric;
  v_solicitud   uuid;
  v_cuenta      uuid;
  v_tea         numeric;
  v_tem         numeric;
  v_cuota       numeric;
  v_saldo_plan  numeric;
  v_int         numeric;
  v_cap         numeric;
  v_desembolso  date;
  v_fecha       date;
  v_pagada      boolean;
  n             integer;
  -- acumuladores para el reporte de calibración
  v_total_saldo numeric := 0;
  v_mora_saldo  numeric := 0;
begin
  select id into v_producto from cmac_productos where codigo = 'EMP';
  select id into v_gestor   from cmac_personal  where rol = 'analista' limit 1;
  select array_agg(id order by numerodni) into v_asesores
    from cmac_personal where rol = 'asesor' and activo;

  for rec in
    select * from (values
      -- codcliente, monto, meses, desg, pagadas, saldo, estado, dias, judicial, castigado
      ('cli000001', 10000, 12, false, 3,  7500, 'Vigente',          0, false, false),
      ('cli000002', 10000, 12, true,  2,  8000, 'Vigente',          0, false, false),
      ('cli000003',  8000, 18, false, 4,  6000, 'Vigente',          0, false, false),
      ('cli000004', 12000, 24, false, 5,  9000, 'Vigente',          0, false, false),
      ('cli000005',  8000, 12, false, 2,  5500, 'Vigente',          0, false, false),
      ('cli000006', 15000, 24, true,  3, 12000, 'Vigente',          0, false, false),
      ('cli000007',  6000, 12, false, 2,  4000, 'Vigente',          0, false, false),
      ('cli000008', 18000, 24, false, 3, 15000, 'Vigente',          0, false, false),
      ('cli000009',  5000, 12, false, 3,  3000, 'Vigente',          0, false, false),
      ('cli000010', 13000, 24, true,  4, 10000, 'Vigente',          0, false, false),
      ('cli000011',  9000, 18, false, 3,  7000, 'Vigente',          0, false, false),
      ('cli000012', 11000, 18, false, 2,  8500, 'Vigente',          0, false, false),
      ('cli000013',  8500, 12, true,  1,  6500, 'Vigente',          0, false, false),
      ('cli000014', 12000, 24, false, 3,  9500, 'Vigente',          0, false, false),
      ('cli000015',  7000, 18, false, 3,  5000, 'Vigente',          0, false, false),
      ('cli000016', 14000, 24, true,  4, 11000, 'Vigente',          0, false, false),
      ('cli000017',  6000, 18, false, 2,  4500, 'Vigente',          0, false, false),
      ('cli000001', 16000, 36, false, 5, 13000, 'Vigente',          0, false, false),
      ('cli000002',  5000, 12, false, 2,  3500, 'Vigente',          0, false, false),
      ('cli000003', 17000, 36, false, 4, 14000, 'Vigente',          0, false, false),
      ('cli000004',  9500, 18, true,  2,  7200, 'Vigente',          0, false, false),
      ('cli000005', 11000, 24, false, 3,  8800, 'Vigente',          0, false, false),
      ('cli000006',  8000, 18, false, 2,  6300, 'Vigente',          0, false, false),
      ('cli000007', 12000, 24, true,  3,  9200, 'Vigente',          0, false, false),
      ('cli000008',  7500, 18, false, 2,  5800, 'Vigente',          0, false, false),
      ('cli000009', 13000, 24, false, 3, 10500, 'Vigente',          0, false, false),
      ('cli000010',  5500, 12, false, 1,  4200, 'Vigente',          0, false, false),
      -- Mora preventiva (1–7 días): no cuenta como mora contable
      ('cli000011',  8000, 18, false, 3,  6000, 'Mora Preventiva',  4, false, false),
      -- Mora contable (~13% del saldo total)
      ('cli000012', 12000, 18, false, 4,  9500, 'Mora Temprana',   15, false, false),
      ('cli000013',  9000, 24, true,  5,  6500, 'Mora Tardia',     60, false, false),
      ('cli000014',  6000, 12, false, 3,  4000, 'Mora Temprana',   20, false, false),
      ('cli000015',  7000, 24, false, 6,  4500, 'Judicial',       150, true,  false),
      ('cli000016',  6500, 18, false, 5,  3500, 'Castigado',      200, false, true),
      ('cli000017',  8000, 24, true,  4,  5000, 'Mora Tardia',     90, false, false)
    ) as t(codcliente, monto, meses, desg, pagadas, saldo, estado, dias, judicial, castigado)
  loop
    v_idx := v_idx + 1;

    select id, ingreso_neto into v_cliente_id, v_ingreso
      from cmac_clientes where codcliente = rec.codcliente;

    -- Asesor rotando entre los disponibles.
    v_asesor := v_asesores[1 + (v_idx % array_length(v_asesores, 1))];

    -- Nivel de aprobación según el monto solicitado.
    select id into v_nivel from cmac_niveles_aprobacion
      where rec.monto >= monto_minimo and rec.monto < monto_maximo
      order by monto_minimo limit 1;

    -- Tasa del producto según desgravamen + tasa efectiva mensual.
    select case when rec.desg then tea_con_desgravamen else tea_sin_desgravamen end
      into v_tea from cmac_productos where id = v_producto;
    v_tem := power(1 + v_tea, 1.0 / 12) - 1;

    -- Cuota fija (amortización francesa).
    v_cuota := round(
      rec.monto * (v_tem * power(1 + v_tem, rec.meses)) / (power(1 + v_tem, rec.meses) - 1), 2);

    -- Fecha de desembolso: hacia atrás tantos meses como cuotas pagadas.
    v_desembolso := (current_date - make_interval(months => rec.pagadas))::date;

    -- --- Solicitud (ya desembolsada) ---
    v_solicitud := gen_random_uuid();
    insert into cmac_solicitudes
      (id, codsolicitud, cliente_id, producto_id, asesor_id, nivel_aprobacion_id,
       estado, monto_solicitado, monto_aprobado, plazo_meses, con_desgravamen,
       scoring, rds, creada_en)
    values
      (v_solicitud, 'sol-seed-' || lpad(v_idx::text, 3, '0'), v_cliente_id, v_producto,
       v_asesor, v_nivel, 'Desembolsado', rec.monto, rec.monto, rec.meses, rec.desg,
       600 + (v_idx * 7) % 250,
       round(v_cuota / nullif(v_ingreso, 0), 4),
       v_desembolso);

    -- --- Cuenta de crédito (saldo_capital explícito para calibrar mora) ---
    v_cuenta := gen_random_uuid();
    insert into cmac_cuentas_credito
      (id, codcuentacredito, cliente_id, solicitud_id, monto_desembolsado,
       saldo_capital, dias_atraso, estado_mora, flag_judicial, flag_castigado, desembolsado_en)
    values
      (v_cuenta, 'ccr-seed-' || lpad(v_idx::text, 3, '0'), v_cliente_id, v_solicitud,
       rec.monto, rec.saldo, rec.dias, rec.estado, rec.judicial, rec.castigado, v_desembolso);

    -- --- Operación de desembolso ---
    insert into cmac_operaciones (cuenta_credito_id, tipo, monto, canal, fecha)
      values (v_cuenta, 'Desembolso', rec.monto, 'Homebanking', v_desembolso);

    -- --- Cronograma + pagos de las cuotas ya vencidas ---
    v_saldo_plan := rec.monto;
    for n in 1..rec.meses loop
      v_int := round(v_saldo_plan * v_tem, 2);
      v_cap := round(v_cuota - v_int, 2);
      if n = rec.meses then
        v_cap := v_saldo_plan;               -- última cuota cierra el saldo
      end if;
      v_saldo_plan := round(v_saldo_plan - v_cap, 2);
      v_fecha  := (v_desembolso + make_interval(months => n))::date;
      v_pagada := (n <= rec.pagadas);

      insert into cmac_plan_pagos
        (cuenta_credito_id, nro_cuota, fecha_pago, cuota, capital, interes, saldo, pagada, fecha_pagada)
      values
        (v_cuenta, n, v_fecha, v_cuota, v_cap, v_int,
         greatest(v_saldo_plan, 0), v_pagada, case when v_pagada then v_fecha end);

      if v_pagada then
        insert into cmac_operaciones (cuenta_credito_id, tipo, monto, canal, fecha)
          values (v_cuenta, 'Pago Cuota', v_cuota, 'Homebanking', v_fecha);
      end if;
    end loop;

    -- --- Gestión de cobranza para cuentas con atraso ---
    if rec.dias > 0 then
      insert into cmac_gestion_cobranza
        (cuenta_credito_id, gestor_id, banda, tipo_gestion, compromiso_pago, observacion, fecha)
      values
        (v_cuenta, v_gestor, rec.estado,
         case when rec.dias <= 7 then 'Recordatorio'
              when rec.dias <= 30 then 'Llamada'
              when rec.dias <= 120 then 'Visita domiciliaria'
              else 'Notificación legal' end,
         (current_date + 7)::date,
         'Gestión semilla — ' || rec.estado || ' (' || rec.dias || ' días de atraso).',
         current_date);
    end if;

    -- --- Acumular para el reporte de calibración ---
    v_total_saldo := v_total_saldo + rec.saldo;
    if rec.estado in ('Mora Temprana','Mora Tardia','Judicial','Castigado') then
      v_mora_saldo := v_mora_saldo + rec.saldo;
    end if;
  end loop;

  raise notice 'Cartera semilla: % cuentas | saldo total S/ % | mora contable S/ % | ratio % %%',
    v_idx, v_total_saldo, v_mora_saldo,
    round(100 * v_mora_saldo / nullif(v_total_saldo, 0), 2);
end $$;
