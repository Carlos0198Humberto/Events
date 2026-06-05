-- ─────────────────────────────────────────────────────────────
--  Módulo: Código de vestimenta
--  Ejecutar en Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

alter table eventos
  add column if not exists vestimenta_activo  boolean default false,
  add column if not exists vestimenta_tipo    text,      -- "Formal", "Semi-formal", "Cocktail", etc.
  add column if not exists vestimenta_colores text,      -- colores separados por coma: "#C9A96E,#FAF6F0,#140d04"
  add column if not exists vestimenta_nota    text;      -- nota libre opcional
