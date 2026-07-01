-- =====================================================================
-- 00_extensions.sql  —  Extensiones requeridas por el Core Bancario
-- Ejecutar PRIMERO en el SQL Editor de Supabase.
-- Idempotente: create extension if not exists.
-- =====================================================================

-- pgcrypto: provee gen_random_uuid() para las llaves primarias uuid.
create extension if not exists pgcrypto;
