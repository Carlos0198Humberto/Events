-- ══════════════════════════════════════════════════════════════════════════════
--  EVENTIX — BASE DE DATOS COMPLETA v5.0
--  Humb3rsec 2026
--
--  NOVEDADES v5.0 (sobre v4.0):
--    • tema: columna de tema/plantilla visual por evento
--    • regalo_*: transferencia bancaria configurable por evento
--    • vestimenta_*: código de vestimenta configurable por evento
--    • tabla mesas: asignación de mesas a invitados
--    • tabla itinerario: programa/agenda del evento
--    • Todos los parches anteriores integrados en un solo script limpio
--
--  Ejecutar en: Supabase > SQL Editor
--  ⚠️  Este script ELIMINA y recrea todas las tablas. Úsalo en un entorno limpio.
--     Si ya tienes datos en producción, usa el bloque PARCHE al final.
-- ══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 0. LIMPIAR TODO (orden inverso a FK)
-- ─────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS itinerario         CASCADE;
DROP TABLE IF EXISTS agradecimientos    CASCADE;
DROP TABLE IF EXISTS reacciones         CASCADE;
DROP TABLE IF EXISTS deseos             CASCADE;
DROP TABLE IF EXISTS fotos              CASCADE;
DROP TABLE IF EXISTS invitados          CASCADE;
DROP TABLE IF EXISTS mesas              CASCADE;
DROP TABLE IF EXISTS eventos            CASCADE;
DROP TABLE IF EXISTS profiles           CASCADE;

DROP FUNCTION IF EXISTS auto_aprobar_foto()                              CASCADE;
DROP FUNCTION IF EXISTS handle_new_user()                                CASCADE;
DROP FUNCTION IF EXISTS confirmar_invitado(UUID,UUID,INTEGER,TEXT,TEXT)  CASCADE;
DROP FUNCTION IF EXISTS es_super_admin()                                  CASCADE;

DROP VIEW  IF EXISTS vista_resumen_evento    CASCADE;
DROP VIEW  IF EXISTS vista_admin_usuarios    CASCADE;

-- Storage policies (puede fallar si no existen — eso está bien)
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
  es_admin      boolean DEFAULT false,
  bloqueado     boolean DEFAULT false,
  evento_limit  integer DEFAULT NULL,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perfil_propio"
  ON profiles FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "superadmin_ve_perfiles"
  ON profiles FOR SELECT
  USING (es_super_admin());

CREATE POLICY "superadmin_edita_perfiles"
  ON profiles FOR UPDATE
  USING (es_super_admin());

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
--    Incluye todas las columnas de v4.0 + tema + regalo_* + vestimenta_*
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE eventos (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organizador_id              uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Info básica
  nombre                      text NOT NULL,
  tipo                        text NOT NULL CHECK (tipo IN ('boda','quinceañera','cumpleaños','graduacion','otro')),
  anfitriones                 text,
  mensaje_invitacion          text,
  frase_evento                text,

  -- Fecha y lugar
  fecha                       date NOT NULL,
  hora                        time NOT NULL,
  lugar                       text NOT NULL,
  maps_url                    text,
  como_llegar                 text,

  -- Imágenes del evento
  imagen_url                  text,
  foto_lugar_url              text,
  foto_lugar_2_url            text,
  foto_lugar_3_url            text,

  -- Música
  musica_url                  text,
  musica_nombre               text,

  -- Cupo
  cupo_personas               integer,

  -- Confirmaciones
  fecha_limite_confirmacion   date NOT NULL,

  -- Diseño / tema visual
  color_primario              text DEFAULT '#0D9488',
  color_secundario            text DEFAULT '#5EEAD4',
  plantilla                   text DEFAULT 'clasica'
                                CHECK (plantilla IN ('clasica','romantica','elegante','divertida','moderna')),
  tema                        text DEFAULT 'clasico',

  -- Sección de regalo / transferencia bancaria
  regalo_activo               boolean DEFAULT false,
  regalo_banco                text,
  regalo_titular              text,
  regalo_cuenta               text,
  regalo_mensaje              text,

  -- Código de vestimenta
  vestimenta_activo           boolean DEFAULT false,
  vestimenta_tipo             text,
  vestimenta_colores          text,
  vestimenta_nota             text,

  -- Libro de recuerdos
  libro_generado              boolean DEFAULT false,
  libro_url                   text,

  -- Muro
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

CREATE POLICY "organizador_gestiona_eventos_block"
  ON eventos FOR INSERT
  WITH CHECK (
    auth.uid() = organizador_id
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND bloqueado = true
    )
  );

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
-- 5. TABLA MESAS
--    Mesas/grupos para organizar a los invitados en el evento
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE mesas (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id    uuid REFERENCES eventos(id) ON DELETE CASCADE NOT NULL,
  nombre       text NOT NULL,
  capacidad    integer DEFAULT 10,
  descripcion  text,
  orden        integer DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX idx_mesas_evento ON mesas(evento_id);

ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizador_gestiona_mesas"
  ON mesas FOR ALL
  USING (evento_id IN (SELECT id FROM eventos WHERE organizador_id = auth.uid()));

CREATE POLICY "lectura_publica_mesas"
  ON mesas FOR SELECT
  USING (true);

CREATE POLICY "superadmin_gestiona_mesas"
  ON mesas FOR ALL
  USING (es_super_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. TABLA INVITADOS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE invitados (
  id                     uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id              uuid REFERENCES eventos(id) ON DELETE CASCADE,
  mesa_id                uuid REFERENCES mesas(id)  ON DELETE SET NULL,

  -- Datos del invitado principal
  nombre                 text NOT NULL,
  telefono               text,
  email                  text,

  -- Token para URL pública
  token                  text UNIQUE DEFAULT gen_random_uuid()::text,

  -- Cupo
  num_personas           integer DEFAULT 1,
  cupo_elije_invitado    boolean DEFAULT false,
  nombres_personas       text,

  -- Respuesta
  estado                 text DEFAULT 'pendiente'
                           CHECK (estado IN ('pendiente','confirmado','rechazado')),
  numero_confirmacion    integer,
  mensaje                text,

  -- Extras
  foto_url               text,
  deseo                  text,

  -- Logística
  asistio                boolean DEFAULT false,
  tiene_transporte       boolean DEFAULT false,
  alergias               text,

  respondido_at          timestamptz,
  created_at             timestamptz DEFAULT now()
);

CREATE INDEX idx_invitados_evento   ON invitados(evento_id);
CREATE INDEX idx_invitados_token    ON invitados(token);
CREATE INDEX idx_invitados_mesa     ON invitados(mesa_id);
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
-- 7. FUNCIÓN: Confirmar invitado (evita race conditions en cupo)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION confirmar_invitado(
  p_invitado_id  uuid,
  p_evento_id    uuid,
  p_num_personas integer,
  p_foto_url     text DEFAULT NULL,
  p_deseo        text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  v_siguiente integer;
  v_cupo      integer;
  v_ocupado   integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_evento_id::text));

  SELECT cupo_personas INTO v_cupo FROM eventos WHERE id = p_evento_id;
  IF v_cupo IS NOT NULL THEN
    SELECT COALESCE(SUM(num_personas), 0) INTO v_ocupado
    FROM invitados
    WHERE evento_id = p_evento_id AND estado = 'confirmado';
    IF (v_ocupado + p_num_personas) > v_cupo THEN
      RAISE EXCEPTION 'cupo_lleno';
    END IF;
  END IF;

  SELECT COALESCE(MAX(numero_confirmacion), 0) + 1 INTO v_siguiente
  FROM invitados
  WHERE evento_id = p_evento_id AND estado = 'confirmado';

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
-- 8. TABLA FOTOS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE fotos (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id    uuid REFERENCES eventos(id)   ON DELETE CASCADE NOT NULL,
  invitado_id  uuid REFERENCES invitados(id) ON DELETE SET NULL,

  url          text NOT NULL,
  path         text NOT NULL,
  caption      text,
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

-- Auto-aprobar fotos
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
-- 9. TABLA REACCIONES
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
-- 10. TABLA DESEOS
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
-- 11. TABLA AGRADECIMIENTOS
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
-- 12. TABLA ITINERARIO (programa del evento)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE itinerario (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id    uuid REFERENCES eventos(id) ON DELETE CASCADE NOT NULL,
  hora         time,
  titulo       text NOT NULL,
  descripcion  text,
  icono        text,
  orden        integer DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX idx_itinerario_evento ON itinerario(evento_id);

ALTER TABLE itinerario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizador_gestiona_itinerario"
  ON itinerario FOR ALL
  USING (evento_id IN (SELECT id FROM eventos WHERE organizador_id = auth.uid()));

CREATE POLICY "lectura_publica_itinerario"
  ON itinerario FOR SELECT
  USING (true);

CREATE POLICY "superadmin_gestiona_itinerario"
  ON itinerario FOR ALL
  USING (es_super_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- 13. STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('eventos', 'eventos', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('fotos-eventos', 'fotos-eventos', true, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('invitados-fotos', 'invitados-fotos', true, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('musica-eventos', 'musica-eventos', true, 20971520,
        ARRAY['audio/mpeg','audio/ogg','audio/mp3','audio/wav','audio/x-wav','audio/*'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['audio/mpeg','audio/ogg','audio/mp3','audio/wav','audio/x-wav','audio/*'];

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('libros-recuerdos', 'libros-recuerdos', true, 20971520)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de storage
CREATE POLICY "eventos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'eventos');
CREATE POLICY "eventos_select" ON storage.objects FOR SELECT USING (bucket_id = 'eventos');
CREATE POLICY "eventos_update" ON storage.objects FOR UPDATE USING (bucket_id = 'eventos');
CREATE POLICY "eventos_delete" ON storage.objects FOR DELETE USING (bucket_id = 'eventos');

CREATE POLICY "fotos_eventos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'fotos-eventos');
CREATE POLICY "fotos_eventos_select" ON storage.objects FOR SELECT USING (bucket_id = 'fotos-eventos');
CREATE POLICY "fotos_eventos_delete" ON storage.objects FOR DELETE USING (bucket_id = 'fotos-eventos');

CREATE POLICY "invitados_fotos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'invitados-fotos');
CREATE POLICY "invitados_fotos_select" ON storage.objects FOR SELECT USING (bucket_id = 'invitados-fotos');

CREATE POLICY "musica_eventos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'musica-eventos');
CREATE POLICY "musica_eventos_select" ON storage.objects FOR SELECT USING (bucket_id = 'musica-eventos');
CREATE POLICY "musica_eventos_update" ON storage.objects FOR UPDATE USING (bucket_id = 'musica-eventos');
CREATE POLICY "musica_eventos_delete" ON storage.objects FOR DELETE USING (bucket_id = 'musica-eventos');

CREATE POLICY "libros_recuerdos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'libros-recuerdos');
CREATE POLICY "libros_recuerdos_select" ON storage.objects FOR SELECT USING (bucket_id = 'libros-recuerdos');


-- ─────────────────────────────────────────────────────────────────────────────
-- 14. VISTAS
-- ─────────────────────────────────────────────────────────────────────────────

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
  e.tema,
  e.publicado,
  e.muro_abierto,
  e.organizador_id,
  e.regalo_activo,
  e.vestimenta_activo,
  COUNT(DISTINCT i.id)                                            AS total_invitados,
  COUNT(DISTINCT i.id) FILTER (WHERE i.estado = 'confirmado')    AS total_confirmados,
  COUNT(DISTINCT i.id) FILTER (WHERE i.estado = 'pendiente')     AS total_pendientes,
  COUNT(DISTINCT i.id) FILTER (WHERE i.estado = 'rechazado')     AS total_rechazados,
  COALESCE(SUM(i.num_personas) FILTER (WHERE i.estado = 'confirmado'), 0) AS total_personas_confirmadas,
  COUNT(DISTINCT f.id) FILTER (WHERE f.estado = 'aprobada')      AS total_fotos,
  COUNT(DISTINCT d.id) FILTER (WHERE d.aprobado = true)          AS total_deseos
FROM eventos e
LEFT JOIN invitados i ON i.evento_id = e.id
LEFT JOIN fotos f     ON f.evento_id = e.id
LEFT JOIN deseos d    ON d.evento_id = e.id
GROUP BY e.id;


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
-- 15. MARCAR SUPER-ADMIN
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE profiles SET es_admin = true
WHERE email = 'cchavarriaaparicio@gmail.com';


-- ─────────────────────────────────────────────────────────────────────────────
-- 16. REFRESCAR CACHE DE SUPABASE
-- ─────────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';


-- ══════════════════════════════════════════════════════════════════════════════
--  PARCHE — Si ya tienes datos en producción (NO borres todo)
--  Ejecuta SOLO este bloque para agregar lo nuevo sin perder datos
-- ══════════════════════════════════════════════════════════════════════════════
/*
-- Nuevas columnas en eventos (v5.0)
ALTER TABLE eventos
  ADD COLUMN IF NOT EXISTS tema                text DEFAULT 'clasico',
  ADD COLUMN IF NOT EXISTS foto_lugar_2_url    text,
  ADD COLUMN IF NOT EXISTS foto_lugar_3_url    text,
  ADD COLUMN IF NOT EXISTS regalo_activo       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS regalo_banco        text,
  ADD COLUMN IF NOT EXISTS regalo_titular      text,
  ADD COLUMN IF NOT EXISTS regalo_cuenta       text,
  ADD COLUMN IF NOT EXISTS regalo_mensaje      text,
  ADD COLUMN IF NOT EXISTS vestimenta_activo   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS vestimenta_tipo     text,
  ADD COLUMN IF NOT EXISTS vestimenta_colores  text,
  ADD COLUMN IF NOT EXISTS vestimenta_nota     text;

-- Nuevas columnas en invitados (v4.0+)
ALTER TABLE invitados
  ADD COLUMN IF NOT EXISTS cupo_elije_invitado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS nombres_personas    text,
  ADD COLUMN IF NOT EXISTS mesa_id             uuid REFERENCES mesas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invitados_mesa ON invitados(mesa_id);

-- Nueva tabla: mesas
CREATE TABLE IF NOT EXISTS mesas (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id    uuid REFERENCES eventos(id) ON DELETE CASCADE NOT NULL,
  nombre       text NOT NULL,
  capacidad    integer DEFAULT 10,
  descripcion  text,
  orden        integer DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mesas_evento ON mesas(evento_id);
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizador_gestiona_mesas" ON mesas FOR ALL
  USING (evento_id IN (SELECT id FROM eventos WHERE organizador_id = auth.uid()));
CREATE POLICY "lectura_publica_mesas" ON mesas FOR SELECT USING (true);
CREATE POLICY "superadmin_gestiona_mesas" ON mesas FOR ALL USING (es_super_admin());

-- Nueva tabla: itinerario
CREATE TABLE IF NOT EXISTS itinerario (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id    uuid REFERENCES eventos(id) ON DELETE CASCADE NOT NULL,
  hora         time,
  titulo       text NOT NULL,
  descripcion  text,
  icono        text,
  orden        integer DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_itinerario_evento ON itinerario(evento_id);
ALTER TABLE itinerario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizador_gestiona_itinerario" ON itinerario FOR ALL
  USING (evento_id IN (SELECT id FROM eventos WHERE organizador_id = auth.uid()));
CREATE POLICY "lectura_publica_itinerario" ON itinerario FOR SELECT USING (true);
CREATE POLICY "superadmin_gestiona_itinerario" ON itinerario FOR ALL USING (es_super_admin());

-- Marcar super-admin (si ya existe el usuario)
UPDATE profiles SET es_admin = true WHERE email = 'cchavarriaaparicio@gmail.com';

NOTIFY pgrst, 'reload schema';
*/


-- ══════════════════════════════════════════════════════════════════════════════
--  FIN — EVENTIX DATABASE v5.0
-- ══════════════════════════════════════════════════════════════════════════════
