-- ══════════════════════════════════════════════════════════════════════════════
--  EVORIX — Walk-in: registro de invitados sin invitación
--  Ejecutar en: Supabase > SQL Editor > Run
-- ══════════════════════════════════════════════════════════════════════════════

-- Función segura para registrar un invitado walk-in.
-- SECURITY DEFINER la ejecuta con permisos de superusuario,
-- evitando que RLS bloquee el INSERT anónimo.
CREATE OR REPLACE FUNCTION walk_in_registrar(
  p_evento_id uuid,
  p_nombre    text
)
RETURNS text   -- devuelve el token generado
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token text;
  v_existe boolean;
BEGIN
  -- Validar que el evento existe
  SELECT EXISTS(SELECT 1 FROM eventos WHERE id = p_evento_id)
  INTO v_existe;

  IF NOT v_existe THEN
    RAISE EXCEPTION 'evento_no_encontrado';
  END IF;

  -- Validar nombre
  IF trim(p_nombre) = '' THEN
    RAISE EXCEPTION 'nombre_requerido';
  END IF;

  -- Generar token único
  v_token := gen_random_uuid()::text;

  -- Insertar invitado walk-in
  INSERT INTO invitados (
    evento_id,
    nombre,
    token,
    estado,
    num_personas,
    telefono,
    email
  ) VALUES (
    p_evento_id,
    trim(p_nombre),
    v_token,
    'confirmado',
    1,
    null,
    null
  );

  RETURN v_token;
END;
$$;

-- Permitir que cualquier usuario (incluso anónimo) llame a esta función
GRANT EXECUTE ON FUNCTION walk_in_registrar(uuid, text) TO anon, authenticated;
