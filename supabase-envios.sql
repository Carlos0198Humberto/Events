-- ─── Envíos: versículo de la invitación y marcas de enviado / recordado ───────
-- Ejecutar en el SQL Editor de Supabase.
--
-- versiculo_texto / versiculo_cita: el texto bíblico que el organizador eligió
-- para la invitación (tarjeta, vista previa de WhatsApp y mensaje).
--
-- enviado_at / recordatorio_at: cuándo se le mandó a cada invitado la
-- invitación y el recordatorio. Con esto el envío en grupo sabe a quién falta
-- mandarle, aunque se cambie de computadora o se recargue la página.
--
-- La app funciona igual antes de correr esto: sin las columnas no se guarda el
-- versículo, y las marcas de enviado quedan solo en ese navegador.

ALTER TABLE eventos
  ADD COLUMN IF NOT EXISTS versiculo_texto text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS versiculo_cita text DEFAULT NULL;

ALTER TABLE invitados
  ADD COLUMN IF NOT EXISTS enviado_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recordatorio_at timestamptz DEFAULT NULL;
