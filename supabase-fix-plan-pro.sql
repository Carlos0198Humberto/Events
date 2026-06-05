-- ============================================================================
--  Fix: error al activar el Plan Pro desde el panel admin
--  Este script NO borra datos. Solo:
--   1. Agrega la columna `plan` en profiles si no existe.
--   2. Asegura que cada perfil tenga un valor ('free' por defecto).
--   3. Crea la policy de RLS para que un admin pueda actualizar `plan`
--      en otros perfiles (UPDATE en profiles).
--
--  Cómo correrlo:
--   1. Abrí Supabase → tu proyecto.
--   2. SQL Editor → New Query.
--   3. Pegá TODO este archivo y dale "Run".
--   4. Volvé a tu app, recargá el panel admin y probá "Activar Pro".
-- ============================================================================

-- 1) Columna `plan` en profiles (si no existe) ───────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';

-- 2) Rellenar valores nulos ──────────────────────────────────────────────────
UPDATE public.profiles
SET plan = 'free'
WHERE plan IS NULL;

-- 3) Restricción de valores válidos (free/pro) ───────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_plan_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'pro'));
  END IF;
END$$;

-- 4) Asegurar que RLS está activo en profiles ────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5) Policy: un admin puede actualizar cualquier perfil ──────────────────────
--    (incluye cambiar `plan`, `bloqueado`, `evento_limit`, etc.)
DROP POLICY IF EXISTS "admins_update_profiles" ON public.profiles;

CREATE POLICY "admins_update_profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.es_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.es_admin = true
    )
  );

-- 6) Policy: cualquier usuario puede leer su propio perfil (por si falta) ────
DROP POLICY IF EXISTS "users_select_own_profile" ON public.profiles;

CREATE POLICY "users_select_own_profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 7) Policy: admins pueden leer todos los perfiles ───────────────────────────
DROP POLICY IF EXISTS "admins_select_all_profiles" ON public.profiles;

CREATE POLICY "admins_select_all_profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.es_admin = true
    )
  );

-- 8) Policy: cada usuario puede actualizar su propio perfil (datos básicos) ──
--    Esta NO permite cambiar `plan` ni `es_admin` por sí mismo: para eso
--    se necesita un admin. Si querés permitir que el usuario edite su
--    nombre/teléfono, dejala. Si no, podés borrarla.
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;

CREATE POLICY "users_update_own_profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- protege que un usuario común no pueda subirse solo al plan pro
    AND plan IS NOT DISTINCT FROM (
      SELECT plan FROM public.profiles WHERE id = auth.uid()
    )
    AND es_admin IS NOT DISTINCT FROM (
      SELECT es_admin FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ============================================================================
--  Listo. Ahora desde el panel admin debería funcionar "✦ Activar Pro".
--  Ningún dato existente fue tocado (solo se agregó una columna y policies).
-- ============================================================================
