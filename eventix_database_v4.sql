-- ══════════════════════════════════════════════════════════════════════════════
--  EVENTIX — BASE DE DATOS COMPLETA v4.0
--  Humb3rsec 2026
--
--  NOVEDADES v4.0:
--    • cupo_elije_invitado: el invitado elige cuántas personas irán
--    • muro_abierto: organizador controla cuándo cerrar el muro
--    • nombres_personas: json con nombres de las personas del grupo
--    • Mensaje de invitación estructurado (sin video, foto lugar opcional)
--    • Agradecimiento personalizado post-evento
--    • Super-admin con gestión de usuarios
--
--  Ejecutar en: Supabase > SQL Editor (una sola vez, limpia todo)
-- ══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 0. LIMPIAR TODO (orden inverso a FK)
-- ─────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS agradecimientos   CASCADE;
DROP TABLE IF EXISTS reacciones        CASCADE;
DROP TABLE IF EXISTS deseos            CASCADE;
DROP TABLE IF EXISTS fotos             CASCADE;
DROP TABLE IF EXISTS invitados         CASCADE;
DROP TABLE IF EXISTS eventos           CASCADE;
DROP TABLE IF EXISTS profiles          CASCADE;

DROP FUNCTION IF EXISTS auto_aprobar_foto()                              CASCADE;
DROP FUNCTION IF EXISTS handle_new_user()                                CASCADE;
DROP FUNCTION IF EXISTS confirmar_invitado(UUID,UUID,INTEGER,TEXT,TEXT)  CASCADE;
DROP FUNCTION IF EXISTS es_super_admin()                                  CASCADE;

DROP VIEW  IF EXISTS vista_resumen_evento    CASCADE;
DROP VIEW  IF EXISTS vista_admin_usuarios    CASCADE;

-- Storage policies (puede fallar si no existen, eso está bien)
DO $$ BEGIN
  DROP POLICY IF EXISTS "eventos_insert"            ON storage.objects;
  DROP POLICY IF EXISTS "eventos_select"            ON storage.objects;
  DROP POLICY IF EXISTS "eventos_update"            ON storage.objects;
  DROP POLICY IF EXISTS "eventos_delete"            ON storage.objects;
  DROP POLICY IF EXISTS "fotos_eventos_insert"      ON storage.objects;
  DROP POLICY IF EXISTS "fotos_eventos_select"      ON storage.objects;
  DROP POLICY IF EXISTS "fotos_eventos_delete"      ON storage.objects;
  DROP POLICY IF EXISTS "invitados_fotos_insert"    ON storage.objects;
  DROP POLICY IF EXISTS "invitados_fotos_select"    ON storage.objects;
  DROP POLICY IF EXISTS "musica_eventos_insert"     ON storage.objects;
  DROP POLICY IF EXISTS "musica_eventos_select"     ON storage.objects;
  DROP POLICY IF EXISTS "musica_eventos_update"     ON storage.objects;
  DROP POLICY IF EXISTS "musica_eventos_delete"     ON storage.objects;
  DROP POLICY IF EXISTS "libros_recuerdos_insert"   ON storage.objects;
  DROP POLICY IF EXISTS "libros_recuerdos_select"   ON storage.objects;
  -- Políticas viejas que pueden existir
  DROP POLICY IF EXISTS "Subir imagenes"            ON storage.objects;
  DROP POLICY IF EXISTS "Ver imagenes"              ON storage.objects;
  DROP POLICY IF EXISTS "subir fotos"               ON storage.objects;
  DROP POLICY IF EXISTS "leer fotos"                ON storage.objects;
  DROP POLICY IF EXISTS "subir libros"              ON storage.objects;
  DROP POLICY IF EXISTS "leer libros"               ON storage.objects;
  DROP POLICY IF EXISTS "Permitir subida pública de fotos" ON storage.objects;
  DROP POLICY IF EXISTS "Permitir lectura pública de fotos" ON storage.objects;
  DROP POLICY IF EXISTS "subir musica"              ON storage.objects;
  DROP POLICY IF EXISTS "leer musica"               ON storage.objects;
  DROP POLICY IF EXISTS "subir videos"              ON storage.objects;
  DROP POLICY IF EXISTS "leer videos"               ON storage.objects;
  DROP POLICY IF EXISTS "videos_lugar_insert"       ON storage.objects;
  DROP POLICY IF EXISTS "videos_lugar_select"       ON storage.objects;
  DROP POLICY IF EXISTS "videos_lugar_update"       ON storage.objects;
  DROP POLICY IF EXISTS "videos_lugar_delete"       ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. HELPER: ¿Es super admin?
--    Agrega tu email real en el array
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION es_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id    = auth.uid()
      AND email = ANY(ARRAY[
        'admin@eventix.app',
        'cchavarriaaparicio@gmail.com'
      ])
  );
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABLA PROFILES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id            uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nombre        text    NOT NULL,
  email         text    NOT NULL,
  avatar_url    text,
  es_admin      boolean DEFAULT false,    -- super-admin de la plataforma
  bloqueado     boolean DEFAULT false,    -- bloqueado por super-admin
  evento_limit  integer DEFAULT NULL,     -- límite de eventos creables (NULL = sin límite)
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Usuario ve/edita su propio perfil
CREATE POLICY "perfil_propio"
  ON profiles FOR ALL
  USING (auth.uid() = id);

-- Super-admin ve todos los perfiles
CREATE POLICY "superadmin_ve_perfiles"
  ON profiles FOR SELECT
  USING (es_super_admin());

-- Super-admin puede modificar perfiles (bloquear, asignar admin, límite)
CREATE POLICY "superadmin_edita_perfiles"
  ON profiles FOR UPDATE
  USING (es_super_admin());

-- Super-admin puede eliminar perfiles
CREATE POLICY "superadmin_elimina_perfiles"
  ON profiles FOR DELETE
  USING (es_super_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TRIGGER: Auto-crear perfil al registrarse
-- ─────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1), 'Usuario'),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Sincronizar usuarios existentes
INSERT INTO profiles (id, nombre, email)
SELECT id, COALESCE(email, 'usuario'), COALESCE(email, '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. TABLA EVENTOS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE eventos (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organizador_id              uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Info básica
  nombre                      text NOT NULL,
  tipo                        text NOT NULL CHECK (tipo IN ('boda','quinceañera','cumpleaños','graduacion','otro')),
  anfitriones                 text,
  mensaje_invitacion          text,   -- texto adicional opcional en la tarjeta
  frase_evento                text,   -- frase especial del evento

  -- Fecha y lugar
  fecha                       date NOT NULL,
  hora                        time NOT NULL,
  lugar                       text NOT NULL,
  maps_url                    text,           -- link Google Maps
  como_llegar                 text,           -- instrucciones textuales

  -- Imágenes
  imagen_url                  text,           -- foto de portada del evento
  foto_lugar_url              text,           -- foto del lugar (OPCIONAL)

  -- Música (autoplays al abrir la tarjeta)
  musica_url                  text,           -- pista de música (mp3/ogg en storage)
  musica_nombre               text,           -- nombre de la canción

  -- Cupo total del evento
  cupo_personas               integer,        -- null = sin límite

  -- Confirmaciones
  fecha_limite_confirmacion   date NOT NULL,

  -- Diseño / plantilla
  color_primario              text DEFAULT '#0D9488',
  color_secundario            text DEFAULT '#5EEAD4',
  plantilla                   text DEFAULT 'clasica'
                                CHECK (plantilla IN ('clasica','romantica','elegante','divertida','moderna')),

  -- Libro de recuerdos
  libro_generado              boolean DEFAULT false,
  libro_url                   text,

  -- Tema visual de la tarjeta de invitación (clasico | rosado | esmeralda)
  tema                        text DEFAULT 'clasico',

  -- Muro de fotos y deseos
  -- El organizador puede abrir/cerrar el muro en cualquier momento
  muro_abierto                boolean DEFAULT true,

  -- Estado
  agradecimiento_enviado      boolean DEFAULT false,
  publicado                   boolean DEFAULT true,

  created_at                  timestamptz DEFAULT now()
);

ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizador_gestiona_eventos"
  ON eventos FOR ALL
  USING (auth.uid() = organizador_id);

-- Bloquear INSERT si el usuario está bloqueado
CREATE POLICY "organizador_gestiona_eventos_block"
  ON eventos FOR INSERT
  WITH CHECK (
    auth.uid() = organizador_id
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND bloqueado = true
    )
  );

-- Respetar límite de eventos por usuario
CREATE POLICY "organizador_respeta_limite"
  ON eventos FOR INSERT
  WITH CHECK (
    auth.uid() = organizador_id
    AND (
      (SELECT evento_limit FROM profiles WHERE id = auth.uid()) IS NULL
      OR
      (SELECT COUNT(*) FROM eventos WHERE organizador_id = auth.uid())
        < (SELECT evento_limit FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "lectura_publica_eventos"
  ON eventos FOR SELECT
  USING (publicado = true);

CREATE POLICY "superadmin_gestiona_eventos"
  ON eventos FOR ALL
  USING (es_super_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. TABLA INVITADOS
--    Cada invitado tiene un token único → URL personalizada /confirmar/[token]
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE invitados (
  id                     uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id              uuid REFERENCES eventos(id) ON DELETE CASCADE,

  -- Datos del invitado principal
  nombre                 text NOT NULL,
  telefono               text,
  email                  text,

  -- Token para la URL pública (WhatsApp share)
  token                  text UNIQUE DEFAULT gen_random_uuid()::text,

  -- Cupo de personas para ESTA invitación
  -- Si cupo_elije_invitado = true → el invitado decide cuántos irán al confirmar
  -- Si cupo_elije_invitado = false → num_personas es el cupo fijo del organizador
  num_personas           integer DEFAULT 1,
  cupo_elije_invitado    boolean DEFAULT false,

  -- Nombres de las personas del grupo (JSON array, opcional)
  -- Ejemplo: '["María López", "Juan López"]'
  nombres_personas       text,

  -- Respuesta del invitado
  estado                 text DEFAULT 'pendiente'
                           CHECK (estado IN ('pendiente','confirmado','rechazado')),
  numero_confirmacion    integer,     -- número correlativo asignado al confirmar
  mensaje                text,        -- mensaje libre al confirmar

  -- Extras
  foto_url               text,        -- foto subida al confirmar
  deseo                  text,        -- deseo/dedicatoria al confirmar

  -- Logística (para organizador)
  asistio                boolean DEFAULT false,
  mesa                   text,
  tiene_transporte       boolean DEFAULT false,
  alergias               text,

  respondido_at          timestamptz,
  created_at             timestamptz DEFAULT now()
);

CREATE INDEX idx_invitados_evento   ON invitados(evento_id);
CREATE INDEX idx_invitados_token    ON invitados(token);
CREATE INDEX idx_invitados_num_conf ON invitados(evento_id, numero_confirmacion)
  WHERE estado = 'confirmado';

ALTER TABLE invitados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizador_gestiona_invitados"
  ON invitados FOR ALL
  USING (evento_id IN (SELECT id FROM eventos WHERE organizador_id = auth.uid()));

CREATE POLICY "lectura_publica_invitados"
  ON invitados FOR SELECT
  USING (true);

CREATE POLICY "invitado_puede_responder"
  ON invitados FOR UPDATE
  USING (true);

CREATE POLICY "superadmin_gestiona_invitados"
  ON invitados FOR ALL
  USING (es_super_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. FUNCIÓN: Confirmar invitado (evita race conditions en cupo)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION confirmar_invitado(
  p_invitado_id  uuid,
  p_evento_id    uuid,
  p_num_personas integer,
  p_foto_url     text DEFAULT NULL,
  p_deseo        text DEFAULT NULL
)
RETURNS integer   -- número de confirmación asignado
LANGUAGE plpgsql AS $$
DECLARE
  v_siguiente integer;
  v_cupo      integer;
  v_ocupado   integer;
BEGIN
  -- Bloqueo a nivel de evento para evitar duplicados simultáneos
  PERFORM pg_advisory_xact_lock(hashtext(p_evento_id::text));

  -- Verificar cupo disponible
  SELECT cupo_personas INTO v_cupo FROM eventos WHERE id = p_evento_id;
  IF v_cupo IS NOT NULL THEN
    SELECT COALESCE(SUM(num_personas), 0) INTO v_ocupado
    FROM invitados
    WHERE evento_id = p_evento_id AND estado = 'confirmado';
    IF (v_ocupado + p_num_personas) > v_cupo THEN
      RAISE EXCEPTION 'cupo_lleno';
    END IF;
  END IF;

  -- Siguiente número correlativo
  SELECT COALESCE(MAX(numero_confirmacion), 0) + 1 INTO v_siguiente
  FROM invitados
  WHERE evento_id = p_evento_id AND estado = 'confirmado';

  -- Actualizar invitado
  UPDATE invitados SET
    estado              = 'confirmado',
    num_personas        = p_num_personas,
    foto_url            = p_foto_url,
    deseo               = p_deseo,
    numero_confirmacion = v_siguiente,
    respondido_at       = now()
  WHERE id = p_invitado_id;

  RETURN v_siguiente;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. TABLA FOTOS
--    Invitados pueden subir hasta 5 fotos desde la tarjeta
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE fotos (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id    uuid REFERENCES eventos(id)   ON DELETE CASCADE NOT NULL,
  invitado_id  uuid REFERENCES invitados(id) ON DELETE SET NULL,

  url          text NOT NULL,
  path         text NOT NULL,             -- path en storage para borrar
  caption      text,                      -- descripción opcional
  estado       text DEFAULT 'aprobada'
                 CHECK (estado IN ('pendiente','aprobada','rechazada')),
  es_favorita  boolean DEFAULT false,
  orden        integer DEFAULT 0,

  created_at   timestamptz DEFAULT now()
);

CREATE INDEX idx_fotos_evento    ON fotos(evento_id);
CREATE INDEX idx_fotos_estado    ON fotos(estado);
CREATE INDEX idx_fotos_favorita  ON fotos(es_favorita);

ALTER TABLE fotos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lectura_publica_fotos"
  ON fotos FOR SELECT
  USING (estado = 'aprobada');

CREATE POLICY "invitado_sube_foto"
  ON fotos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "organizador_gestiona_fotos"
  ON fotos FOR UPDATE
  USING (
    evento_id IN (SELECT id FROM eventos WHERE organizador_id = auth.uid())
    OR es_super_admin()
  );

CREATE POLICY "organizador_elimina_fotos"
  ON fotos FOR DELETE
  USING (
    evento_id IN (SELECT id FROM eventos WHERE organizador_id = auth.uid())
    OR es_super_admin()
  );

-- Auto-aprobar fotos al insertar
CREATE OR REPLACE FUNCTION auto_aprobar_foto()
RETURNS trigger AS $$
BEGIN
  NEW.estado := 'aprobada';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_aprobar
  BEFORE INSERT ON fotos
  FOR EACH ROW
  EXECUTE FUNCTION auto_aprobar_foto();


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. TABLA REACCIONES (a fotos)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE reacciones (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  foto_id      uuid REFERENCES fotos(id)      ON DELETE CASCADE NOT NULL,
  invitado_id  uuid REFERENCES invitados(id)  ON DELETE CASCADE NOT NULL,
  emoji        text NOT NULL CHECK (emoji IN ('❤️','🔥','😍','😂','🥹','👏','🎉')),
  created_at   timestamptz DEFAULT now(),
  UNIQUE(foto_id, invitado_id)
);

CREATE INDEX idx_reacciones_foto ON reacciones(foto_id);

ALTER TABLE reacciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lectura_publica_reacciones"  ON reacciones FOR SELECT  USING (true);
CREATE POLICY "invitado_reacciona"          ON reacciones FOR INSERT  WITH CHECK (true);
CREATE POLICY "invitado_cambia_reaccion"    ON reacciones FOR UPDATE  USING (true);
CREATE POLICY "invitado_quita_reaccion"     ON reacciones FOR DELETE  USING (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. TABLA DESEOS / DEDICATORIAS
--    Los deseos se recopilan y pueden descargarse organizados por persona
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE deseos (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id        uuid REFERENCES eventos(id)   ON DELETE CASCADE NOT NULL,
  invitado_id      uuid REFERENCES invitados(id) ON DELETE SET NULL,

  nombre_autor     text NOT NULL,
  mensaje          text NOT NULL,
  emoji_sticker    text DEFAULT '💜',
  color_fondo      text DEFAULT '#fdf4ff',
  es_anonimo       boolean DEFAULT false,
  aprobado         boolean DEFAULT true,
  incluir_en_libro boolean DEFAULT true,

  created_at       timestamptz DEFAULT now()
);

CREATE INDEX idx_deseos_evento ON deseos(evento_id);

ALTER TABLE deseos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lectura_publica_deseos"
  ON deseos FOR SELECT
  USING (aprobado = true);

CREATE POLICY "cualquiera_deja_deseo"
  ON deseos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "organizador_modera_deseos"
  ON deseos FOR UPDATE
  USING (
    evento_id IN (SELECT id FROM eventos WHERE organizador_id = auth.uid())
    OR es_super_admin()
  );

CREATE POLICY "organizador_elimina_deseos"
  ON deseos FOR DELETE
  USING (
    evento_id IN (SELECT id FROM eventos WHERE organizador_id = auth.uid())
    OR es_super_admin()
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 10. TABLA AGRADECIMIENTOS
--     Mensajes de agradecimiento post-evento a quienes asistieron y confirmaron
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE agradecimientos (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id    uuid REFERENCES eventos(id)   ON DELETE CASCADE NOT NULL,
  invitado_id  uuid REFERENCES invitados(id) ON DELETE CASCADE NOT NULL,
  mensaje      text NOT NULL,
  canal        text DEFAULT 'whatsapp' CHECK (canal IN ('whatsapp','email','ambos')),
  enviado_at   timestamptz DEFAULT now(),
  entregado    boolean DEFAULT false
);

CREATE INDEX idx_agradecimientos_evento ON agradecimientos(evento_id);

ALTER TABLE agradecimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizador_ve_agradecimientos"
  ON agradecimientos FOR ALL
  USING (
    evento_id IN (SELECT id FROM eventos WHERE organizador_id = auth.uid())
    OR es_super_admin()
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 11. STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────────────────────────

-- Portadas y fotos de lugar del evento
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('eventos', 'eventos', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

-- Fotos subidas por invitados (galería del muro — máx 5 por invitado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('fotos-eventos', 'fotos-eventos', true, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

-- Fotos de invitados al confirmar
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('invitados-fotos', 'invitados-fotos', true, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

-- Música del evento (mp3 / ogg — autoplays al abrir la tarjeta)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('musica-eventos', 'musica-eventos', true, 20971520,
        ARRAY['audio/mpeg','audio/ogg','audio/mp3','audio/wav','audio/x-wav','audio/*'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['audio/mpeg','audio/ogg','audio/mp3','audio/wav','audio/x-wav','audio/*'];

-- PDFs del libro de recuerdos
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('libros-recuerdos', 'libros-recuerdos', true, 20971520)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ─── Políticas de storage ─────────────────────────────────────────────────────

-- BUCKET: eventos (portadas + foto lugar)
CREATE POLICY "eventos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'eventos');
CREATE POLICY "eventos_select" ON storage.objects FOR SELECT USING (bucket_id = 'eventos');
CREATE POLICY "eventos_update" ON storage.objects FOR UPDATE USING (bucket_id = 'eventos');
CREATE POLICY "eventos_delete" ON storage.objects FOR DELETE USING (bucket_id = 'eventos');

-- BUCKET: fotos-eventos (galería muro invitados)
CREATE POLICY "fotos_eventos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'fotos-eventos');
CREATE POLICY "fotos_eventos_select" ON storage.objects FOR SELECT USING (bucket_id = 'fotos-eventos');
CREATE POLICY "fotos_eventos_delete" ON storage.objects FOR DELETE USING (bucket_id = 'fotos-eventos');

-- BUCKET: invitados-fotos (foto al confirmar)
CREATE POLICY "invitados_fotos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'invitados-fotos');
CREATE POLICY "invitados_fotos_select" ON storage.objects FOR SELECT USING (bucket_id = 'invitados-fotos');

-- BUCKET: musica-eventos
CREATE POLICY "musica_eventos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'musica-eventos');
CREATE POLICY "musica_eventos_select" ON storage.objects FOR SELECT USING (bucket_id = 'musica-eventos');
CREATE POLICY "musica_eventos_update" ON storage.objects FOR UPDATE USING (bucket_id = 'musica-eventos');
CREATE POLICY "musica_eventos_delete" ON storage.objects FOR DELETE USING (bucket_id = 'musica-eventos');

-- BUCKET: libros-recuerdos
CREATE POLICY "libros_recuerdos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'libros-recuerdos');
CREATE POLICY "libros_recuerdos_select" ON storage.objects FOR SELECT USING (bucket_id = 'libros-recuerdos');


-- ─────────────────────────────────────────────────────────────────────────────
-- 12. VISTAS ÚTILES
-- ─────────────────────────────────────────────────────────────────────────────

-- Vista resumen para dashboard del organizador
CREATE OR REPLACE VIEW vista_resumen_evento AS
SELECT
  e.id,
  e.nombre,
  e.tipo,
  e.fecha,
  e.hora,
  e.lugar,
  e.imagen_url,
  e.foto_lugar_url,
  e.musica_url,
  e.musica_nombre,
  e.cupo_personas,
  e.plantilla,
  e.publicado,
  e.muro_abierto,
  e.organizador_id,
  -- Invitados
  COUNT(DISTINCT i.id)                                            AS total_invitados,
  COUNT(DISTINCT i.id) FILTER (WHERE i.estado = 'confirmado')    AS total_confirmados,
  COUNT(DISTINCT i.id) FILTER (WHERE i.estado = 'pendiente')     AS total_pendientes,
  COUNT(DISTINCT i.id) FILTER (WHERE i.estado = 'rechazado')     AS total_rechazados,
  COALESCE(SUM(i.num_personas) FILTER (WHERE i.estado = 'confirmado'), 0) AS total_personas_confirmadas,
  -- Contenido del muro
  COUNT(DISTINCT f.id) FILTER (WHERE f.estado = 'aprobada')      AS total_fotos,
  COUNT(DISTINCT d.id) FILTER (WHERE d.aprobado = true)          AS total_deseos
FROM eventos e
LEFT JOIN invitados i ON i.evento_id = e.id
LEFT JOIN fotos f     ON f.evento_id = e.id
LEFT JOIN deseos d    ON d.evento_id = e.id
GROUP BY e.id;


-- Vista para panel de super-admin
CREATE OR REPLACE VIEW vista_admin_usuarios AS
SELECT
  p.id,
  p.nombre,
  p.email,
  p.es_admin,
  p.bloqueado,
  p.evento_limit,
  p.created_at,
  COUNT(e.id) AS total_eventos
FROM profiles p
LEFT JOIN eventos e ON e.organizador_id = p.id
GROUP BY
  p.id, p.nombre, p.email,
  p.es_admin, p.bloqueado,
  p.evento_limit, p.created_at
ORDER BY p.created_at DESC;


-- ─────────────────────────────────────────────────────────────────────────────
-- 13. MARCAR EL USUARIO ADMIN COMO SUPER-ADMIN
--     Ejecutar DESPUÉS de que el usuario se haya registrado
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE profiles SET es_admin = true
WHERE email = 'cchavarriaaparicio@gmail.com';


-- ─────────────────────────────────────────────────────────────────────────────
-- 14. REFRESCAR CACHE DE SUPABASE
-- ─────────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';


-- ══════════════════════════════════════════════════════════════════════════════
--  PARCHE RÁPIDO (Si ya tienes la DB en producción y NO quieres borrar todo)
--  Ejecuta SOLO ESTE BLOQUE si ya tienes datos y quieres aplicar los cambios
--  de v4.0 sin perder nada:
-- ══════════════════════════════════════════════════════════════════════════════
/*
-- Nuevas columnas en eventos
ALTER TABLE eventos
  ADD COLUMN IF NOT EXISTS muro_abierto boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS tema text DEFAULT 'clasico';

-- Nuevas columnas en invitados
ALTER TABLE invitados
  ADD COLUMN IF NOT EXISTS cupo_elije_invitado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS nombres_personas text;

-- Marcar super-admin (ejecutar solo si el usuario ya existe)
UPDATE profiles SET es_admin = true
WHERE email = 'cchavarriaaparicio@gmail.com';

NOTIFY pgrst, 'reload schema';
*/


-- ══════════════════════════════════════════════════════════════════════════════
--  NOTAS DE INTEGRACIÓN FRONTEND
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Tarjeta de invitación pública (/confirmar/[token]) ──────────────────────
-- Al abrir: musica_url autoplays automáticamente (ya implementado)
-- Mensaje: "Hola [nombre], te saluda [anfitriones], con relación a nuestro
--           [tipo_evento] te invitamos, por favor confirma antes del [fecha]"
-- El invitado puede:
--   1. Confirmar asistencia (si cupo_elije_invitado=true, elige cuántos van)
--   2. Subir hasta 5 fotos de recuerdo
--   3. Dejar un deseo/dedicatoria

-- ── Control del muro ────────────────────────────────────────────────────────
-- eventos.muro_abierto = true   → muro visible para todos
-- eventos.muro_abierto = false  → muro cerrado para invitados, solo organizador lo ve
-- El organizador puede toggle desde el panel del muro

-- ── Cupo por invitación ──────────────────────────────────────────────────────
-- cupo_elije_invitado = false + num_personas = N  → cupo fijo de N personas
-- cupo_elije_invitado = true                       → al confirmar, aparece selector
--                                                    "¿Cuántas personas irán incluyéndote?"

-- ── Agradecimientos post-evento ─────────────────────────────────────────────
-- Filtrar: invitados WHERE estado = 'confirmado' AND asistio = true
-- Enviar via WhatsApp con template personalizado de la tabla PLANTILLAS en el frontend

-- ── Descarga de fotos y deseos ───────────────────────────────────────────────
-- Vista "Álbumes" del muro: fotos agrupadas por invitado_id (nombre de carpeta = nombre del invitado)
-- Botón descargar en cada álbum → descarga secuencial con nombre: [nombre]_foto1.jpg, etc.
-- Deseos: descarga individual como .txt o descarga masiva como .txt compilado

-- ── Super-admin (/admin) ────────────────────────────────────────────────────
-- Lee: vista_admin_usuarios (todos los perfiles + conteo de eventos)
-- Puede: bloqueado = true/false, eliminar perfil (borra auth.users en cascada)
-- es_super_admin() verifica por email en auth.users (no editable por el usuario)

-- ══════════════════════════════════════════════════════════════════════════════
--  FIN — EVENTIX DATABASE v4.0
-- ══════════════════════════════════════════════════════════════════════════════
