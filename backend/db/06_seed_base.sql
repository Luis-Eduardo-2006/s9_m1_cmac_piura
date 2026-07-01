-- =====================================================================
-- 06_seed_base.sql  —  Datos semilla base (catálogos, personal, clientes)
-- Depende de: 01_catalogos.sql, 02_personas.sql
-- Idempotente: ON CONFLICT sobre las llaves naturales.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Productos. EMP conserva las TEA reales del simulador (frontend/src/lib).
-- ---------------------------------------------------------------------
insert into cmac_productos
  (codigo, nombre, tea_con_desgravamen, tea_sin_desgravamen, monto_min, monto_max)
values
  ('EMP', 'Crédito Empresarial Micro-Micro', 0.4092, 0.4392, 500,  300000),
  ('CON', 'Crédito de Consumo',              0.3500, 0.3800, 500,  150000)
on conflict (codigo) do update set
  nombre              = excluded.nombre,
  tea_con_desgravamen = excluded.tea_con_desgravamen,
  tea_sin_desgravamen = excluded.tea_sin_desgravamen,
  monto_min           = excluded.monto_min,
  monto_max           = excluded.monto_max;

-- ---------------------------------------------------------------------
-- Niveles de aprobación por monto (ruta de comité / opiniones).
-- ---------------------------------------------------------------------
insert into cmac_niveles_aprobacion
  (nombre, monto_minimo, monto_maximo, requiere_opinion, descripcion)
values
  ('Nivel 1', 0,      30000,    false, 'Hasta S/ 30k: aprueba el comité de créditos.'),
  ('Nivel 2', 30000,  300000,   true,  'S/ 30k–300k: opinión Administrador/Riesgos + comité.'),
  ('Nivel 3', 300000, 99999999, true,  'S/ ≥300k: opinión Jefe Regional + Riesgos + comité.')
on conflict (nombre) do update set
  monto_minimo     = excluded.monto_minimo,
  monto_maximo     = excluded.monto_maximo,
  requiere_opinion = excluded.requiere_opinion,
  descripcion      = excluded.descripcion;

-- ---------------------------------------------------------------------
-- Personal: un usuario por cada uno de los 6 roles + 3 asesores extra.
-- DNIs 11111111..11111119 (alineados al entorno de pruebas del curso).
-- ---------------------------------------------------------------------
insert into cmac_personal (numerodni, nombre, rol) values
  ('11111111', 'Ana Torres',         'asesor'),
  ('11111112', 'Carlos Ruiz',        'administrador'),
  ('11111113', 'María Delgado',      'jefe_regional'),
  ('11111114', 'Jorge Ramírez',      'riesgos'),
  ('11111115', 'Comité de Créditos', 'comite'),
  ('11111116', 'Lucía Fernández',    'analista'),
  ('11111117', 'Pedro Salas',        'asesor'),
  ('11111118', 'Rosa Núñez',         'asesor'),
  ('11111119', 'Miguel Ángel Paz',   'asesor')
on conflict (numerodni) do update set
  nombre = excluded.nombre,
  rol    = excluded.rol;

-- ---------------------------------------------------------------------
-- Clientes: TODOS los que aparecen en frontend/src/data/casos.js.
-- codcliente 'cli000001'..'cli000017'.
-- ---------------------------------------------------------------------
insert into cmac_clientes (codcliente, numerodni, nombre, ingreso_neto) values
  ('cli000001', '40000001', 'Castor Pérez',       1800),
  ('cli000002', '40000002', 'Eneida Mamani',      2500),
  ('cli000003', '40000003', 'Ovidio Torres',      3200),
  ('cli000004', '40000004', 'Dante Flores',       4100),
  ('cli000005', '40000005', 'Laura Mendoza',      5000),
  ('cli000006', '40000006', 'Boccaccio Vargas',   6200),
  ('cli000007', '40000007', 'Orlando Ríos',       2800),
  ('cli000008', '40000008', 'Gerusalemme Huanca', 7500),
  ('cli000009', '40000009', 'Pedro Calderón',     3400),
  ('cli000010', '40000010', 'Félix Chávez',       8800),
  ('cli000011', '40000011', 'Hildegarda Huanca',  1600),
  ('cli000012', '40000012', 'Stendhal Aguilar',   2100),
  ('cli000013', '40000013', 'Kipling Soto',       2900),
  ('cli000014', '40000014', 'Erinná Espinoza',    3600),
  ('cli000015', '40000015', 'Annie Espinoza',     4300),
  ('cli000016', '40000016', 'Homero Quispe',      5400),
  ('cli000017', '40000017', 'Virgilio Mamani',    6000)
on conflict (codcliente) do update set
  numerodni    = excluded.numerodni,
  nombre       = excluded.nombre,
  ingreso_neto = excluded.ingreso_neto;
