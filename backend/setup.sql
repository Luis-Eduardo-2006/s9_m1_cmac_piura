-- ============================================================
-- CMAC PIURA -- Setup completo de base de datos
-- Pegar y ejecutar en: Supabase > SQL Editor > New query
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLAS
-- ------------------------------------------------------------

create table if not exists cmac_cuentas (
  id     uuid primary key default gen_random_uuid(),
  label  text not null,
  saldo  numeric(12,2) not null default 0,
  sub    text,
  color  text,
  icono  text,
  orden  integer not null default 0
);

create table if not exists cmac_movimientos (
  id           uuid primary key default gen_random_uuid(),
  fecha        timestamptz not null default now(),
  descripcion  text not null,
  tipo         text not null check (tipo in ('entrada', 'salida')),
  monto        numeric(12,2) not null
);

-- ------------------------------------------------------------
-- 2. DATOS DE PRUEBA
-- ------------------------------------------------------------

insert into cmac_cuentas (label, saldo, sub, color, icono, orden) values
  ('Cuenta de Ahorros',      3250.80,  'Ahorro Corriente',  '#27AE60', 'fa-piggy-bank',      1),
  ('CuentaMás',              1500.00,  'Cuenta remunerada', '#3498DB', 'fa-wallet',          2),
  ('Crédito MYPE',          -8200.00,  'Saldo pendiente',   '#E74C3C', 'fa-hand-holding-usd',3),
  ('Fondo Seguro',           4800.50,  'Plazo fijo',        '#F39C12', 'fa-shield-alt',      4);

insert into cmac_movimientos (fecha, descripcion, tipo, monto) values
  (now() - interval '1 day',   'Depósito en ventanilla',          'entrada', 500.00),
  (now() - interval '2 days',  'Pago servicio de agua',            'salida',   85.50),
  (now() - interval '3 days',  'Transferencia recibida',           'entrada', 1200.00),
  (now() - interval '5 days',  'Pago cuota crédito MYPE',          'salida',  420.00),
  (now() - interval '7 days',  'Cobro de haberes',                 'entrada', 2800.00),
  (now() - interval '8 days',  'Compra supermercado',              'salida',  230.75),
  (now() - interval '10 days', 'Transferencia a tercero',          'salida',  350.00),
  (now() - interval '12 days', 'Abono extra a ahorros',            'entrada',  800.00),
  (now() - interval '15 days', 'Pago servicio de luz',             'salida',   95.20),
  (now() - interval '20 days', 'Rendimiento fondo seguro',         'entrada',   48.30);

-- ------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS)
--    Permite que cualquier usuario autenticado lea los datos.
--    Si más adelante quieres filtrar por usuario, agrega una
--    columna user_id y ajusta las políticas.
-- ------------------------------------------------------------

alter table cmac_cuentas    enable row level security;
alter table cmac_movimientos enable row level security;

-- Eliminar políticas previas si existen
drop policy if exists "Lectura autenticada cuentas"      on cmac_cuentas;
drop policy if exists "Lectura autenticada movimientos"  on cmac_movimientos;

-- Permitir SELECT a usuarios con sesión activa
create policy "Lectura autenticada cuentas"
  on cmac_cuentas for select
  using (auth.role() = 'authenticated');

create policy "Lectura autenticada movimientos"
  on cmac_movimientos for select
  using (auth.role() = 'authenticated');
