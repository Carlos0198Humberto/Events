-- ─── Quiénes van: nombres que el invitado marcó al confirmar ──────────────────
-- Ejecutar en el SQL Editor de Supabase.
--
-- nombres_personas es la lista que carga el organizador (quiénes están en la
-- tarjeta). asistentes_nombres es lo que respondió el invitado: el subconjunto
-- de esa lista que confirmó que va. Se guarda aparte para no pisar la lista
-- del organizador; num_personas sigue siendo la cantidad.
--
-- La app funciona igual antes de correr esto: si la columna no existe, la
-- confirmación se guarda sin los nombres.

ALTER TABLE invitados
  ADD COLUMN IF NOT EXISTS asistentes_nombres jsonb DEFAULT NULL;
