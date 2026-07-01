-- =====================================================================
-- 11_hash_personal.sql  —  Hashing de contraseñas del personal (P4)
-- Depende de: 00_extensions.sql (pgcrypto), 02_personas.sql.
--
-- ANTES: el login del Core comparaba password == numerodni en TEXTO PLANO.
-- DESPUÉS: cada personal tiene un hash bcrypt de su numerodni en reposo. La
-- contraseña EFECTIVA sigue siendo el DNI (los usuarios de prueba 11111111..
-- entran igual), pero ya no se guarda/compara en claro. En producción se
-- forzaría un cambio de contraseña en el primer ingreso.
-- Idempotente.
-- =====================================================================

alter table cmac_personal
  add column if not exists password_hash text;

-- Hash bcrypt (blowfish, coste 10) del DNI, solo para los que aún no lo tienen.
update cmac_personal
set password_hash = crypt(numerodni, gen_salt('bf', 10))
where password_hash is null;
