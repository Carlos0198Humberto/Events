-- ─── Invitados a distancia: familiares, amigos o hermanos en Cristo ─────────
-- Ejecutar en el SQL Editor de Supabase (después de supabase-distancia.sql).
-- Se puede correr más de una vez.
--
-- Cada invitado a distancia recibe la carta, el mensaje y la dedicatoria de la
-- tarjeta según quién es: familia, amigos o hermanos en Cristo. Sin vínculo
-- (los que ya estaban marcados) sigue recibiendo la carta general.
--
-- La app funciona igual antes de correr esto: el vínculo simplemente no se
-- guarda y todos reciben la carta general.

ALTER TABLE invitados
  ADD COLUMN IF NOT EXISTS vinculo text DEFAULT NULL;

ALTER TABLE invitados DROP CONSTRAINT IF EXISTS invitados_vinculo_check;
ALTER TABLE invitados
  ADD CONSTRAINT invitados_vinculo_check CHECK (vinculo IS NULL OR vinculo IN ('familia', 'amigos', 'hermanos'));
