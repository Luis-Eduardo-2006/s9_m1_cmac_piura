-- =====================================================================
-- 08_vincular_demo.sql  —  Vincular un cliente del Core con un usuario de
-- Supabase Auth (para el demo del flujo Homebanking → Core).
--
-- POR QUÉ: el Homebanking autentica al cliente con Supabase Auth. Para que
-- POST /api/hb/solicitar sepa QUÉ cmac_clientes es el usuario, la fila de
-- cmac_clientes debe tener auth_user_id = el id del usuario de auth.users.
-- Los seeds dejan auth_user_id en null (el enlace real es parte de P4).
--
-- CÓMO USAR:
--   1. Crea/ten un usuario en Supabase Auth (Dashboard → Authentication → Users)
--      con el que inicies sesión en el Homebanking. Anota su email.
--   2. Reemplaza 'CORREO_DEL_CLIENTE@ejemplo.com' por ese email.
--   3. (Opcional) cambia el codcliente por el cliente que quieras usar en el demo.
--   4. Ejecuta este script en el SQL Editor de Supabase.
-- =====================================================================

update cmac_clientes
set auth_user_id = (
  select id from auth.users
  where email = 'CORREO_DEL_CLIENTE@ejemplo.com'
  limit 1
)
where codcliente = 'cli000001';   -- Castor Pérez (cambia si quieres otro)

-- Verificación: debe devolver una fila con auth_user_id NO nulo.
select codcliente, nombre, auth_user_id
from cmac_clientes
where codcliente = 'cli000001';
