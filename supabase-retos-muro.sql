-- ─── Retos de fotos del muro ─────────────────────────────────────────────────
-- Ejecutar en el SQL Editor de Supabase. Se puede correr más de una vez.
--
-- Arriba del muro aparecen dos retos: «Con la quinceañera» (o con los novios,
-- con el graduado…) y «El pastel». Cada foto puede ser de un reto; tocar el
-- reto muestra solo esas fotos. Cada invitado sube 1 foto libre y 1 por reto.
--   reto  NULL = foto libre · 'protagonista' · 'pastel'
--
-- La app funciona igual antes de correr esto: los retos no aparecen y cada
-- invitado sube su foto como siempre.

ALTER TABLE fotos
  ADD COLUMN IF NOT EXISTS reto text DEFAULT NULL;

ALTER TABLE fotos DROP CONSTRAINT IF EXISTS fotos_reto_check;
ALTER TABLE fotos
  ADD CONSTRAINT fotos_reto_check CHECK (reto IS NULL OR reto IN ('protagonista', 'pastel'));

CREATE INDEX IF NOT EXISTS idx_fotos_evento_reto ON fotos(evento_id, reto);
