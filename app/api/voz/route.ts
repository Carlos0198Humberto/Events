// ─── /api/voz: una frase de la invitación dicha con la voz elegida ────────────
//
// GET ?i=<token del invitado>&t=<frase> (o &calentar; ?salud sin token). Solo para invitaciones que existen
// (el token se revisa), frases de hasta 400 letras. Si la frase ya está
// guardada, se redirige a ese archivo; si no, se genera, se guarda (solo en
// Vercel: las pruebas en la compu no escriben en el almacenamiento) y se
// devuelve el audio.

import { createClient } from "@supabase/supabase-js";
import { NextResponse, after } from "next/server";
import { BUCKET_VOZ, MAX_LETRAS_VOZ, claveVoz, textoParaVoz, urlPublicaVoz } from "@/lib/vozGrabada";
import { prepararVoz, sintetizar } from "@/lib/vozServidor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// El primer pedido baja el modelo y arranca el motor
export const maxDuration = 60;

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Las invitaciones ya revisadas en este servidor: cada frase de un invitado no
// vuelve a consultar la base
const tokensValidos = new Set<string>();

async function invitacionExiste(token: string): Promise<boolean> {
  if (tokensValidos.has(token)) return true;
  const supabase = createClient(URL_SUPABASE, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data } = await supabase.from("invitados").select("id").eq("token", token).maybeSingle();
  if (data) tokensValidos.add(token);
  return !!data;
}

let ultimaSalud: Promise<{ ok: boolean; segundos?: number; error?: string }> | null = null;
function salud() {
  ultimaSalud ??= (async () => {
    const t0 = Date.now();
    try {
      const audio = await sintetizar("Hola.");
      return { ok: audio.length > 1000, segundos: (Date.now() - t0) / 1000 };
    } catch (e) {
      ultimaSalud = null;
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  })();
  return ultimaSalud;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  // ?salud: ¿la voz anda en este servidor? Dice una frase FIJA (no se le
  // puede pedir otro texto sin invitación) y recuerda el resultado.
  if (url.searchParams.has("salud")) return NextResponse.json(await salud());
  const token = (url.searchParams.get("i") ?? "").trim();
  // ?calentar: la invitación se abrió, todavía no habla. Se arranca el motor
  // mientras el invitado mira la portada.
  if (url.searchParams.has("calentar")) {
    if (!token || !(await invitacionExiste(token))) return new NextResponse(null, { status: 404 });
    try { await prepararVoz(); } catch (e) { console.error("[voz]", e); return new NextResponse(null, { status: 503 }); }
    return new NextResponse(null, { status: 204 });
  }
  const texto = textoParaVoz(url.searchParams.get("t") ?? "");
  if (!token || !texto || texto.length > MAX_LETRAS_VOZ) {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }
  if (!(await invitacionExiste(token))) {
    return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
  }

  const clave = await claveVoz(texto);
  const publica = clave ? urlPublicaVoz(URL_SUPABASE, clave) : null;
  // nuevo=1: el navegador ya buscó la frase guardada y no estaba
  if (publica && !url.searchParams.has("nuevo")) {
    const guardada = await fetch(publica, { method: "HEAD" }).catch(() => null);
    if (guardada?.ok) return NextResponse.redirect(publica, 302);
  }

  let audio: Uint8Array;
  try {
    audio = await sintetizar(texto);
  } catch (e) {
    console.error("[voz]", e);
    return NextResponse.json({ error: "No se pudo generar la voz" }, { status: 503 });
  }

  // Guardarla para la próxima (con la llave de servicio, que solo vive en el
  // servidor), DESPUÉS de responder: el invitado no espera la subida
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (clave && llave && process.env.VERCEL) {
    after(async () => {
      const admin = createClient(URL_SUPABASE, llave, { auth: { persistSession: false, autoRefreshToken: false } });
      const { error } = await admin.storage.from(BUCKET_VOZ).upload(clave, audio, { contentType: "audio/wav", upsert: true, cacheControl: "31536000" });
      if (error) console.error("[voz] no se guardó", error.message);
    });
  }

  return new NextResponse(new Blob([audio as BlobPart], { type: "audio/wav" }), {
    headers: { "Content-Type": "audio/wav", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
