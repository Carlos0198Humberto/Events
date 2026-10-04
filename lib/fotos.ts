// ─── Fotos de eventos: subir livianas, mostrar miniaturas ─────────────────────
//
// Una foto de celular pesa 3–8 MB. Subida y mostrada así, un muro con 30 fotos
// baja más de 100 MB y tarda una eternidad. Por eso:
//
//   • Antes de subir, el propio celular la achica: una versión completa
//     (≤ 2048 px, ~300–600 KB) y una miniatura (≤ 720 px, ~60–100 KB).
//   • El muro muestra la miniatura; la completa se baja recién al abrir la foto.
//   • ancho/alto se guardan para reservar el lugar exacto antes de que cargue
//     (la grilla no salta).
//
// thumb_url, ancho y alto vienen de supabase-muro.sql. Si todavía no se corrió,
// todo sigue funcionando como antes (sin miniatura): los insert/select
// reintentan sin esas columnas.

import { supabase } from "@/lib/supabase";

const BUCKET = "fotos-eventos";
const LADO_COMPLETA = 2048;
const LADO_MINIATURA = 720;

export type FotoPreparada = { completa: Blob; miniatura: Blob; ancho: number; alto: number };

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // El navegador aplica la orientación EXIF al decodificar en <img>
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo leer la imagen"));
    img.src = src;
  });
}

function redimensionar(img: HTMLImageElement, ladoMax: number, calidad: number): Promise<Blob | null> {
  const escala = Math.min(1, ladoMax / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * escala));
  const h = Math.max(1, Math.round(img.naturalHeight * escala));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  // Fondo blanco: un PNG con transparencia no queda negro al pasar a JPEG
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  // JPEG y no WebP: Safari no codifica WebP desde canvas (devolvería PNG)
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", calidad));
}

/** Achica una foto en el dispositivo. null si el navegador no puede leerla (ej. HEIC en Chrome). */
export async function prepararFoto(origen: Blob): Promise<FotoPreparada | null> {
  const url = URL.createObjectURL(origen);
  try {
    const img = await cargarImagen(url);
    const [completa, miniatura] = await Promise.all([
      redimensionar(img, LADO_COMPLETA, 0.84),
      redimensionar(img, LADO_MINIATURA, 0.74),
    ]);
    if (!completa || !miniatura) return null;
    const escala = Math.min(1, LADO_COMPLETA / Math.max(img.naturalWidth, img.naturalHeight));
    return {
      // Si la original ya era más liviana que la "achicada", se queda la original
      completa: completa.size < origen.size ? completa : origen,
      miniatura,
      ancho: Math.round(img.naturalWidth * escala),
      alto: Math.round(img.naturalHeight * escala),
    };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Portada, foto del lugar, carrusel: la foto achicada en el dispositivo antes
 * de subirla (≤ 1800 px, JPEG). Una portada de 3–8 MB hacía lenta la
 * invitación con datos móviles y la tarjeta. Si no es una imagen que el
 * navegador pueda leer (HEIC en Chrome, un GIF animado) o achicarla no ahorra
 * nada, se sube la original.
 */
export async function achicarImagen(archivo: File, ladoMax = 1800): Promise<File> {
  if (!archivo.type.startsWith("image/") || archivo.type === "image/gif") return archivo;
  const url = URL.createObjectURL(archivo);
  try {
    const img = await cargarImagen(url);
    const blob = await redimensionar(img, ladoMax, 0.86);
    if (!blob || blob.size >= archivo.size) return archivo;
    return new File([blob], `${archivo.name.replace(/\.[^.]+$/, "") || "foto"}.jpg`, { type: "image/jpeg" });
  } catch {
    return archivo;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const COLUMNA_FALTANTE = /thumb_url|ancho|alto/i;

/**
 * Sube una foto de un invitado al muro del evento: completa + miniatura.
 * Devuelve las URLs públicas o lanza un error legible.
 */
export async function subirFotoEvento({ archivo, eventoId, invitadoId, caption }: {
  archivo: Blob;
  eventoId: string;
  invitadoId: string;
  caption?: string | null;
}): Promise<{ url: string; thumbUrl: string | null }> {
  const base = `${eventoId}/${invitadoId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const preparada = await prepararFoto(archivo);

  let path: string;
  let thumbPath: string | null = null;
  if (preparada) {
    path = `${base}.jpg`;
    thumbPath = `${base}_t.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, preparada.completa, { contentType: "image/jpeg", upsert: false });
    if (error) throw new Error("No se pudo subir la foto. Probá de nuevo.");
    // La miniatura es una mejora: si falla, la foto igual queda subida
    const { error: errT } = await supabase.storage.from(BUCKET).upload(thumbPath, preparada.miniatura, { contentType: "image/jpeg", upsert: false });
    if (errT) thumbPath = null;
  } else {
    // El navegador no pudo leerla: se sube tal cual, como antes
    const ext = (archivo instanceof File ? archivo.name.split(".").pop() : "jpg") || "jpg";
    path = `${base}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, archivo, {
      contentType: archivo.type || undefined,
      upsert: false,
    });
    if (error) throw new Error("No se pudo subir la foto. Probá de nuevo.");
  }

  const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const thumbUrl = thumbPath ? supabase.storage.from(BUCKET).getPublicUrl(thumbPath).data.publicUrl : null;

  const fila: Record<string, unknown> = {
    evento_id: eventoId,
    invitado_id: invitadoId,
    url,
    path,
    estado: "aprobada",
    caption: caption?.trim() || null,
  };
  if (thumbUrl) fila.thumb_url = thumbUrl;
  if (preparada) { fila.ancho = preparada.ancho; fila.alto = preparada.alto; }

  let { error } = await supabase.from("fotos").insert(fila);
  if (error && COLUMNA_FALTANTE.test(error.message || "")) {
    delete fila.thumb_url; delete fila.ancho; delete fila.alto;
    ({ error } = await supabase.from("fotos").insert(fila));
  }
  if (error) throw new Error("La foto se subió pero no se pudo registrar. Probá de nuevo.");
  return { url, thumbUrl };
}

/**
 * Para fotos subidas antes de las miniaturas: baja la original, genera la
 * miniatura y la guarda. Lo usa el organizador desde el muro (necesita sesión
 * de organizador para poder actualizar la fila).
 */
export async function generarMiniatura(foto: { id: string; url: string; path?: string | null }): Promise<string | null> {
  try {
    const res = await fetch(foto.url);
    if (!res.ok) return null;
    const preparada = await prepararFoto(await res.blob());
    if (!preparada) return null;
    const base = (foto.path || `${foto.id}`).replace(/\.[^./]+$/, "");
    const thumbPath = `${base}_t.jpg`;
    // Sin upsert: el bucket no tiene política de UPDATE. Si ya existe (un intento
    // anterior que no llegó a guardar la fila), se reutiliza.
    const { error } = await supabase.storage.from(BUCKET).upload(thumbPath, preparada.miniatura, { contentType: "image/jpeg", upsert: false });
    if (error && !/exist|duplicate/i.test(error.message || "")) return null;
    const thumbUrl = supabase.storage.from(BUCKET).getPublicUrl(thumbPath).data.publicUrl;
    const { error: errU } = await supabase.from("fotos")
      .update({ thumb_url: thumbUrl, ancho: preparada.ancho, alto: preparada.alto })
      .eq("id", foto.id);
    return errU ? null : thumbUrl;
  } catch {
    return null;
  }
}
