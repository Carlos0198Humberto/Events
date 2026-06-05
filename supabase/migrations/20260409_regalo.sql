-- ─────────────────────────────────────────────────────────────
--  Módulo: Regalo / Transferencia bancaria
--  Ejecutar en Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

alter table eventos
  add column if not exists regalo_activo    boolean default false,
  add column if not exists regalo_banco     text,
  add column if not exists regalo_titular   text,
  add column if not exists regalo_cuenta    text,   -- CLABE / No. cuenta / CBU
  add column if not exists regalo_mensaje   text;   -- Mensaje personalizado opcional
