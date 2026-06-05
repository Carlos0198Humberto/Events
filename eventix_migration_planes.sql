-- ══════════════════════════════════════════════════════════════════════════════
--  EVENTIX — MIGRACIÓN: Sistema de planes
--  Humb3rsec 2026
--
--  Ejecutar en: Supabase > SQL Editor
--  Este script es ADITIVO — no borra ni recrea tablas existentes.
-- ══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Columna plan en profiles
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro'));

-- Todos los usuarios existentes arrancan en free
UPDATE profiles SET plan = 'free' WHERE plan IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Actualizar vista_admin_usuarios para incluir plan
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW vista_admin_usuarios AS
SELECT
  p.id,
  p.nombre,
  p.email,
  p.es_admin,
  p.bloqueado,
  p.evento_limit,
  p.plan,
  p.created_at,
  COUNT(e.id) AS total_eventos
FROM profiles p
LEFT JOIN eventos e ON e.organizador_id = p.id
GROUP BY
  p.id, p.nombre, p.email,
  p.es_admin, p.bloqueado,
  p.evento_limit, p.plan, p.created_at
ORDER BY p.created_at DESC;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Refrescar caché de Supabase
-- ─────────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
