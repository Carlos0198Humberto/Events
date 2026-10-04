-- ─── Datos propios de la tarjeta de invitación ────────────────────────────────
-- Ejecutar en el SQL Editor de Supabase.
--
-- Un solo jsonb para lo que el organizador escribe a propósito para la tarjeta
-- (todo opcional; sin esto la tarjeta se arma como antes):
--   honor        frase sobre el nombre ("En honor a", "Con orgullo presentamos a"…;
--                "" = sin frase)
--   graduando    nombre completo de quien se gradúa / festeja
--   carrera      de qué se gradúa ("Licenciatura en Ciencias de la Educación")
--   institucion  dónde ("Universidad Centroamericana José Simeón Cañas")
--   familia      quién invita, firma de la tarjeta ("Familia Castillo Pérez")
--   direccion    dirección completa del lugar
--   referencia   punto de referencia ("Frente a la gasolinera Puma")

ALTER TABLE eventos
  ADD COLUMN IF NOT EXISTS tarjeta jsonb DEFAULT NULL;
