-- ─── Invitados a distancia: invitación especial de agradecimiento ────────────
-- Ejecutar en el SQL Editor de Supabase. Se puede correr más de una vez.
--
-- Familiares y amigos que están lejos pero fueron parte del logro: no
-- confirman asistencia; reciben una invitación de agradecimiento donde ven las
-- fotos que sube el anfitrión y las del muro, y pueden dejar su mensaje.

-- 1) Marca del invitado a distancia
ALTER TABLE invitados
  ADD COLUMN IF NOT EXISTS a_distancia boolean DEFAULT false;

-- 2) Fotos que sube el anfitrión para ellos (ej. la graduación con sus padres):
--    lista de URLs, en orden
ALTER TABLE eventos
  ADD COLUMN IF NOT EXISTS fotos_anfitrion jsonb DEFAULT NULL;

-- 3) El anfitrión también puede comentar las fotos del muro (antes solo un
--    invitado con su enlace; desde el panel no aparecía dónde comentar)
DROP POLICY IF EXISTS "organizador_comenta" ON comentarios_fotos;
CREATE POLICY "organizador_comenta" ON comentarios_fotos
  FOR INSERT WITH CHECK (
    evento_id IN (SELECT id FROM eventos WHERE organizador_id = auth.uid())
    AND foto_id IN (SELECT id FROM fotos WHERE fotos.evento_id = comentarios_fotos.evento_id)
  );
