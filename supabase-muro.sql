-- ─── Muro: fotos livianas + comentarios reales ────────────────────────────────
-- Ejecutar en el SQL Editor de Supabase.
--
-- La app funciona antes de correr esto (fotos sin miniatura, sin comentarios);
-- después de correrlo, las fotos nuevas se suben con miniatura y el
-- organizador puede generar las miniaturas de las fotos que ya estaban.

-- 1) Miniatura y medidas de cada foto
--    thumb_url: versión chica (≤ 720 px) que muestra la grilla del muro.
--    ancho/alto: para reservar el lugar exacto antes de que la foto cargue.
ALTER TABLE fotos ADD COLUMN IF NOT EXISTS thumb_url text    DEFAULT NULL;
ALTER TABLE fotos ADD COLUMN IF NOT EXISTS ancho     integer DEFAULT NULL;
ALTER TABLE fotos ADD COLUMN IF NOT EXISTS alto      integer DEFAULT NULL;

-- 2) Comentarios de fotos (antes solo vivían en la memoria del navegador)
CREATE TABLE IF NOT EXISTS comentarios_fotos (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  foto_id      uuid REFERENCES fotos(id)     ON DELETE CASCADE NOT NULL,
  evento_id    uuid REFERENCES eventos(id)   ON DELETE CASCADE NOT NULL,
  invitado_id  uuid REFERENCES invitados(id) ON DELETE SET NULL,
  nombre_autor text NOT NULL,
  texto        text NOT NULL CHECK (char_length(texto) BETWEEN 1 AND 300),
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comentarios_fotos_foto ON comentarios_fotos(foto_id);

ALTER TABLE comentarios_fotos ENABLE ROW LEVEL SECURITY;

-- Todos los que ven el muro leen los comentarios
DROP POLICY IF EXISTS "lectura_publica_comentarios" ON comentarios_fotos;
CREATE POLICY "lectura_publica_comentarios" ON comentarios_fotos
  FOR SELECT USING (true);

-- Comenta un invitado (sin cuenta), en una foto de su mismo evento
DROP POLICY IF EXISTS "invitado_comenta" ON comentarios_fotos;
CREATE POLICY "invitado_comenta" ON comentarios_fotos
  FOR INSERT WITH CHECK (
    invitado_id IS NOT NULL
    AND foto_id IN (SELECT id FROM fotos WHERE fotos.evento_id = comentarios_fotos.evento_id)
    AND invitado_id IN (SELECT id FROM invitados WHERE invitados.evento_id = comentarios_fotos.evento_id)
  );

-- Solo el organizador del evento borra comentarios
DROP POLICY IF EXISTS "organizador_borra_comentarios" ON comentarios_fotos;
CREATE POLICY "organizador_borra_comentarios" ON comentarios_fotos
  FOR DELETE USING (
    evento_id IN (SELECT id FROM eventos WHERE organizador_id = auth.uid())
  );
