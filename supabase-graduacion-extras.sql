-- ─── Mejoras de graduación: carrusel de fotos + dedicatorias con voz ──────────
-- Ejecutar en el SQL Editor de Supabase.

-- 1) Carrusel de fotos del graduado (array de URLs en jsonb)
ALTER TABLE eventos
  ADD COLUMN IF NOT EXISTS fotos_carrusel jsonb DEFAULT NULL;

-- 2) Dedicatoria con voz: URL del audio grabado por el invitado
ALTER TABLE deseos
  ADD COLUMN IF NOT EXISTS audio_url text DEFAULT NULL;

-- 3) (Opcional pero recomendado) Bucket para audios si no existe.
--    Si ya usás el bucket "fotos-eventos" público, los audios se guardan ahí
--    en la carpeta audios/ y no necesitás nada más.
