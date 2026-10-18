-- ─── Una carta distinta para cada persona a distancia ─────────────────────────
-- Ejecutar en el SQL Editor de Supabase (después de supabase-vinculo.sql).
-- Se puede correr más de una vez.
--
-- En Invitados, cada invitado a distancia tiene «Escribirle su propia carta»:
--   carta_personal        la carta que lee al abrir su invitación (y que la voz
--                         le lee), un párrafo por renglón. Gana a la carta de
--                         su vínculo y a la general.
--   dedicatoria_personal  la frase corta de su tarjeta y del mensaje de WhatsApp.
-- Vacías (NULL) = recibe la carta de siempre.
--
-- La app funciona igual antes de correr esto: el botón no aparece y todos
-- reciben la carta de su vínculo o la general.

ALTER TABLE invitados
  ADD COLUMN IF NOT EXISTS carta_personal text DEFAULT NULL;

ALTER TABLE invitados
  ADD COLUMN IF NOT EXISTS dedicatoria_personal text DEFAULT NULL;

-- Los mismos límites que la app (3000 y 120 caracteres)
ALTER TABLE invitados DROP CONSTRAINT IF EXISTS invitados_carta_personal_largo;
ALTER TABLE invitados
  ADD CONSTRAINT invitados_carta_personal_largo CHECK (carta_personal IS NULL OR char_length(carta_personal) <= 3000);

ALTER TABLE invitados DROP CONSTRAINT IF EXISTS invitados_dedicatoria_personal_largo;
ALTER TABLE invitados
  ADD CONSTRAINT invitados_dedicatoria_personal_largo CHECK (dedicatoria_personal IS NULL OR char_length(dedicatoria_personal) <= 120);
