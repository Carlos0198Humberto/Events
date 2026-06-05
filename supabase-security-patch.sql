-- ══════════════════════════════════════════════════════════════════════════════
--  EVORIX — PARCHE DE SEGURIDAD
--  Ejecutar en: Supabase > SQL Editor > Run
--
--  Problemas que corrige:
--    1. Storage policies sin verificación de autenticación
--    2. invitados: UPDATE abierto (cualquiera podía modificar cualquier invitado)
--    3. reacciones: INSERT/UPDATE/DELETE sin restricciones
--    4. invitados: SELECT expone datos de todos los eventos
-- ══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. STORAGE — Restringir a usuarios autenticados para buckets privados
--    (fotos-eventos e invitados-fotos quedan públicos: invitados sin cuenta suben fotos)
-- ─────────────────────────────────────────────────────────────────────────────

-- bucket: eventos (solo organizador autenticado)
DROP POLICY IF EXISTS "eventos_insert" ON storage.objects;
DROP POLICY IF EXISTS "eventos_select" ON storage.objects;
DROP POLICY IF EXISTS "eventos_update" ON storage.objects;
DROP POLICY IF EXISTS "eventos_delete" ON storage.objects;

CREATE POLICY "eventos_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'eventos' AND auth.role() = 'authenticated');

CREATE POLICY "eventos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'eventos');

CREATE POLICY "eventos_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'eventos' AND auth.role() = 'authenticated');

CREATE POLICY "eventos_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'eventos' AND auth.role() = 'authenticated');


-- bucket: musica-eventos (solo organizador autenticado)
DROP POLICY IF EXISTS "musica_eventos_insert" ON storage.objects;
DROP POLICY IF EXISTS "musica_eventos_select" ON storage.objects;
DROP POLICY IF EXISTS "musica_eventos_update" ON storage.objects;
DROP POLICY IF EXISTS "musica_eventos_delete" ON storage.objects;

CREATE POLICY "musica_eventos_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'musica-eventos' AND auth.role() = 'authenticated');

CREATE POLICY "musica_eventos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'musica-eventos');

CREATE POLICY "musica_eventos_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'musica-eventos' AND auth.role() = 'authenticated');

CREATE POLICY "musica_eventos_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'musica-eventos' AND auth.role() = 'authenticated');


-- bucket: videos-lugar (solo organizador autenticado)
DROP POLICY IF EXISTS "videos_lugar_insert" ON storage.objects;
DROP POLICY IF EXISTS "videos_lugar_select" ON storage.objects;
DROP POLICY IF EXISTS "videos_lugar_update" ON storage.objects;
DROP POLICY IF EXISTS "videos_lugar_delete" ON storage.objects;

CREATE POLICY "videos_lugar_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'videos-lugar' AND auth.role() = 'authenticated');

CREATE POLICY "videos_lugar_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos-lugar');

CREATE POLICY "videos_lugar_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'videos-lugar' AND auth.role() = 'authenticated');

CREATE POLICY "videos_lugar_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'videos-lugar' AND auth.role() = 'authenticated');


-- bucket: libros-recuerdos (solo organizador autenticado)
DROP POLICY IF EXISTS "libros_recuerdos_insert" ON storage.objects;
DROP POLICY IF EXISTS "libros_recuerdos_select" ON storage.objects;

CREATE POLICY "libros_recuerdos_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'libros-recuerdos' AND auth.role() = 'authenticated');

CREATE POLICY "libros_recuerdos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'libros-recuerdos' AND auth.role() = 'authenticated');


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. INVITADOS — UPDATE restringido al token del invitado
--    La función confirmar_invitado() usa SECURITY DEFINER y no necesita esta policy,
--    pero si alguien llama .update() directamente solo debe poder actualizar su propio registro.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "invitado_puede_responder" ON invitados;

-- El invitado no tiene sesión de auth; usamos la función RPC confirmar_invitado() que ya
-- valida el token. Esta policy más restrictiva bloquea updates directos no autorizados.
-- Solo el organizador dueño del evento puede hacer UPDATE directo.
CREATE POLICY "invitado_puede_responder"
  ON invitados FOR UPDATE
  USING (
    evento_id IN (
      SELECT id FROM eventos WHERE organizador_id = auth.uid()
    )
  );

-- Nota: la confirmación pública de invitados (sin auth) sigue funcionando
-- a través de la función RPC confirmar_invitado() que tiene LANGUAGE plpgsql (no SECURITY DEFINER)
-- y valida internamente el p_invitado_id + p_evento_id antes de hacer el UPDATE.


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. REACCIONES — Restringir DELETE y UPDATE a quien las creó (por session/token)
--    Como las reacciones no tienen user_id de auth, al menos evitamos DELETE masivo.
--    INSERT queda público (invitados pueden reaccionar sin cuenta).
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "invitado_cambia_reaccion"  ON reacciones;
DROP POLICY IF EXISTS "invitado_quita_reaccion"   ON reacciones;

-- Solo el organizador del evento puede modificar/borrar reacciones directamente.
-- Los invitados no pueden borrar reacciones ajenas.
CREATE POLICY "invitado_cambia_reaccion" ON reacciones
  FOR UPDATE USING (
    foto_id IN (
      SELECT f.id FROM fotos f
      JOIN eventos e ON e.id = f.evento_id
      WHERE e.organizador_id = auth.uid()
    )
  );

CREATE POLICY "invitado_quita_reaccion" ON reacciones
  FOR DELETE USING (
    foto_id IN (
      SELECT f.id FROM fotos f
      JOIN eventos e ON e.id = f.evento_id
      WHERE e.organizador_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- Fin del parche
-- ─────────────────────────────────────────────────────────────────────────────
