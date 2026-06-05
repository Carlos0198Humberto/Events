-- Ejecutar en Supabase → SQL Editor → Run

-- Paso 1: Ver en qué schema está la tabla eventos
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name = 'eventos';

-- Paso 2: Agregar la columna (ajusta el schema si el paso 1 muestra otro)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'video_lugar_url'
  ) THEN
    EXECUTE 'ALTER TABLE ' || (
      SELECT table_schema || '.eventos'
      FROM information_schema.tables
      WHERE table_name = 'eventos'
      LIMIT 1
    ) || ' ADD COLUMN video_lugar_url text';
    RAISE NOTICE 'Columna video_lugar_url agregada';
  ELSE
    RAISE NOTICE 'La columna ya existe';
  END IF;
END$$;

-- Paso 3: Bucket para videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos-lugar', 'videos-lugar', true, 104857600,
  ARRAY['video/mp4','video/quicktime','video/webm','video/mov','video/*']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/mp4','video/quicktime','video/webm','video/mov','video/*'];

-- Paso 4: Políticas storage
DROP POLICY IF EXISTS "videos_lugar_insert" ON storage.objects;
DROP POLICY IF EXISTS "videos_lugar_select" ON storage.objects;
DROP POLICY IF EXISTS "videos_lugar_update" ON storage.objects;
DROP POLICY IF EXISTS "videos_lugar_delete" ON storage.objects;

CREATE POLICY "videos_lugar_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos-lugar');
CREATE POLICY "videos_lugar_select" ON storage.objects FOR SELECT USING (bucket_id = 'videos-lugar');
CREATE POLICY "videos_lugar_update" ON storage.objects FOR UPDATE USING (bucket_id = 'videos-lugar');
CREATE POLICY "videos_lugar_delete" ON storage.objects FOR DELETE USING (bucket_id = 'videos-lugar');
