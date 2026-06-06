-- ══════════════════════════════════════════════════════════════════════════════
--  MÓDULO MI BODA CIVIL
--  Ejecutar en: Supabase > SQL Editor > Run
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Crear bucket "boda-civil" (público)
--    Si ya existe lo ignora.
INSERT INTO storage.buckets (id, name, public)
VALUES ('boda-civil', 'boda-civil', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Lectura pública (el muro es accesible sin login)
DROP POLICY IF EXISTS "public_read_boda_civil" ON storage.objects;
CREATE POLICY "public_read_boda_civil"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'boda-civil');

-- 3. Subida: solo usuarios autenticados (organizadores)
DROP POLICY IF EXISTS "auth_insert_boda_civil" ON storage.objects;
CREATE POLICY "auth_insert_boda_civil"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'boda-civil');

-- 4. Actualizar (upsert de meta.json y video)
DROP POLICY IF EXISTS "auth_update_boda_civil" ON storage.objects;
CREATE POLICY "auth_update_boda_civil"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'boda-civil');

-- 5. Eliminar fotos/video
DROP POLICY IF EXISTS "auth_delete_boda_civil" ON storage.objects;
CREATE POLICY "auth_delete_boda_civil"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'boda-civil');

-- ══════════════════════════════════════════════════════════════════════════════
-- NOTA: La API route /api/boda-civil/[evento_id] usa SUPABASE_