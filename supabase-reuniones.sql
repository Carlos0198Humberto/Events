-- ─── Reuniones del día de la graduación ──────────────────────────────────────
-- Ejecutar en el SQL Editor de Supabase. Se puede correr más de una vez.
--
-- Además de la ceremonia, encuentros más chicos ese día (una reunión familiar,
-- una cena), cada uno con su invitación aparte: su tarjeta, su mensaje de
-- WhatsApp y un enlace propio por invitado (/reunion/<token>) donde confirma si
-- va. Los invitados salen de la lista de la graduación o se agregan nuevos.
--
-- Solo el organizador del evento ve y cambia estas tablas. El invitado no tiene
-- sesión: lee su reunión y responde con dos funciones que solo funcionan con su
-- token (SECURITY DEFINER), así las tablas no quedan abiertas a cualquiera.

CREATE TABLE IF NOT EXISTS reuniones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id   uuid NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  nombre      text NOT NULL CHECK (char_length(nombre) BETWEEN 1 AND 60),
  fecha       date,
  hora        time,
  lugar       text CHECK (lugar IS NULL OR char_length(lugar) <= 160),
  direccion   text CHECK (direccion IS NULL OR char_length(direccion) <= 200),
  nota        text CHECK (nota IS NULL OR char_length(nota) <= 300),
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reuniones_evento ON reuniones(evento_id);

CREATE TABLE IF NOT EXISTS reunion_invitados (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reunion_id            uuid NOT NULL REFERENCES reuniones(id) ON DELETE CASCADE,
  -- De la lista de la graduación (NULL = persona nueva). Si se lo borra de la
  -- lista, la invitación a la reunión sigue (con su nombre y teléfono copiados)
  invitado_id           uuid REFERENCES invitados(id) ON DELETE SET NULL,
  nombre                text NOT NULL CHECK (char_length(nombre) BETWEEN 1 AND 120),
  telefono              text CHECK (telefono IS NULL OR char_length(telefono) <= 30),
  -- Lugares ofrecidos y cuántos van: separados, para no contar a quien no confirmó
  num_personas          int NOT NULL DEFAULT 1 CHECK (num_personas BETWEEN 1 AND 50),
  personas_confirmadas  int CHECK (personas_confirmadas IS NULL OR personas_confirmadas BETWEEN 0 AND 50),
  token                 text NOT NULL UNIQUE CHECK (char_length(token) BETWEEN 10 AND 64),
  estado                text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'rechazado')),
  respondido_at         timestamptz,
  enviado_at            timestamptz,
  created_at            timestamptz DEFAULT now(),
  UNIQUE (reunion_id, invitado_id)
);
CREATE INDEX IF NOT EXISTS idx_reunion_invitados_reunion ON reunion_invitados(reunion_id);

-- ── Permisos: solo el organizador del evento (y el administrador) ──
ALTER TABLE reuniones ENABLE ROW LEVEL SECURITY;
ALTER TABLE reunion_invitados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organizador_gestiona_reuniones" ON reuniones;
CREATE POLICY "organizador_gestiona_reuniones" ON reuniones FOR ALL
  USING (evento_id IN (SELECT id FROM eventos WHERE organizador_id = auth.uid()) OR es_super_admin())
  WITH CHECK (evento_id IN (SELECT id FROM eventos WHERE organizador_id = auth.uid()) OR es_super_admin());

DROP POLICY IF EXISTS "organizador_gestiona_reunion_invitados" ON reunion_invitados;
CREATE POLICY "organizador_gestiona_reunion_invitados" ON reunion_invitados FOR ALL
  USING (reunion_id IN (
    SELECT r.id FROM reuniones r JOIN eventos e ON e.id = r.evento_id WHERE e.organizador_id = auth.uid()
  ) OR es_super_admin())
  WITH CHECK (reunion_id IN (
    SELECT r.id FROM reuniones r JOIN eventos e ON e.id = r.evento_id WHERE e.organizador_id = auth.uid()
  ) OR es_super_admin());

-- ── Lo que ve el invitado por su enlace: su invitación, la reunión y el evento ──
CREATE OR REPLACE FUNCTION reunion_por_token(p_token text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'invitado', json_build_object(
      'nombre', ri.nombre, 'num_personas', ri.num_personas, 'estado', ri.estado,
      'personas_confirmadas', ri.personas_confirmadas, 'token', ri.token
    ),
    'reunion', json_build_object(
      'nombre', r.nombre, 'fecha', r.fecha, 'hora', r.hora, 'lugar', r.lugar,
      'direccion', r.direccion, 'nota', r.nota
    ),
    -- El evento como lo ve ya la invitación (la tabla eventos es de lectura pública)
    'evento', to_jsonb(e) - 'organizador_id'
  )
  FROM reunion_invitados ri
  JOIN reuniones r ON r.id = ri.reunion_id
  JOIN eventos e ON e.id = r.evento_id
  WHERE ri.token = p_token
  LIMIT 1;
$$;

-- ── El invitado responde: va (y cuántos, hasta su cupo) o no va ──
CREATE OR REPLACE FUNCTION responder_reunion(p_token text, p_estado text, p_personas int DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v reunion_invitados%ROWTYPE;
BEGIN
  IF p_estado NOT IN ('confirmado', 'rechazado') THEN
    RAISE EXCEPTION 'Respuesta no válida';
  END IF;
  SELECT * INTO v FROM reunion_invitados WHERE token = p_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitación no encontrada';
  END IF;
  UPDATE reunion_invitados SET
    estado = p_estado,
    personas_confirmadas = CASE
      WHEN p_estado = 'confirmado' THEN LEAST(GREATEST(COALESCE(p_personas, 1), 1), v.num_personas)
      ELSE 0 END,
    respondido_at = now()
  WHERE id = v.id;
  RETURN json_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION reunion_por_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION responder_reunion(text, text, int) TO anon, authenticated;
