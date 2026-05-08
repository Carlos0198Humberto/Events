-- ============================================================================
--  FIX URGENTE: el panel admin desapareció después de correr el script anterior.
--
--  Causa: las policies que creé consultaban `profiles` desde adentro de una
--  policy de `profiles` → recursión infinita en RLS → bloqueo de SELECT.
--
--  Este script:
--   1. Borra las policies problemáticas que dejé.
--   2. Crea una función SECURITY DEFINER que chequea admin sin recursión.
--   3. Recrea las policies usando esa función (seguro y sin recursión).
--   4. NO TOCA NINGÚN DATO. Solo arregla policies.
--
--  Cómo correrlo:
--   1. Supabase → tu proyecto → SQL Editor → New Query.
--   2. Pegá TODO este archivo y dale "Run".
--   3. Recargá tu app. El panel admin debería volver a aparecer.
-- ============================================================================

-- 1) Borrar las policies problemáticas del script anterior ───────────────────
DROP POLICY IF EXISTS "admins_update_profiles"      ON public.profiles;
DROP POLICY IF EXISTS "admins_select_all_profiles"  ON public.profiles;
DROP POLICY IF EXISTS "users_select_own_profile"    ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile"    ON public.profiles;

-- 2) Función helper SECURITY DEFINER (no entra en recursión RLS) ─────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT es_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Permitir que cualquier usuario autenticado pueda invocar la función
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- 3) Policies SELECT en profiles (sin recursión) ─────────────────────────────
--    Cada usuario lee su propio perfil; los admins leen todos.
CREATE POLICY "select_own_or_admin"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_admin()
  );

-- 4) Policy UPDATE: cada usuario actualiza su propio perfil; admins, todos ───
CREATE POLICY "update_own_or_admin"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id
    OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = id
    OR public.is_admin()
  );

-- 5) (Opcional pero útil) policy INSERT — permite crear el propio perfil ─────
DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
--  Listo. Ningún dato se tocó. Recargá la app y el menú admin tiene que volver.
--
--  Si por algún motivo seguís sin ver el menú admin, corré ESTA query
--  en Supabase (con tu user_id real) para confirmar que tu fila tiene
--  es_admin = true:
--
--    SELECT id, nombre, es_admin, plan FROM public.profiles
--    WHERE id = auth.uid();
--
--  (correlo logueado desde tu app o desde el SQL Editor con el rol "authenticated")
-- ============================================================================
