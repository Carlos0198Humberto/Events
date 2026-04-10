-- ─────────────────────────────────────────────────────────────
--  Módulo: QR de entrada / control de asistencia
--  Ejecutar en Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

alter table invitados
  add column if not exists presente       boolean default false,
  add column if not exists presente_hora  timestamptz;

-- Índice para búsquedas rápidas por token al escanear QR
create index if not exists idx_invitados_token on invitados(token);
