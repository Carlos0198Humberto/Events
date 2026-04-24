-- Migración: agregar campo plano_mesas_url a la tabla eventos
-- Ejecutar en Supabase SQL Editor

ALTER TABLE eventos
  ADD COLUMN IF NOT EXISTS plano_mesas_url text;
