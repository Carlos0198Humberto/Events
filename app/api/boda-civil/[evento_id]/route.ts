import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const BUCKET = "boda-civil";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function ensureBucket(admin: ReturnType<typeof adminClient>) {
  const { error } = await admin.storage.createBucket(BUCKET, { public: true });
  // Ignorar error si ya existe
  if (error && !error.message.includes("already exists")) {
    console.warn("createBucket warn:", error.message);
  }
}

async function getMeta(admin: ReturnType<typeof adminClient>, evento_id: string) {
  const { data, error } = await admin.storage
    .from(BUCKET)
    .download(`${evento_id}/meta.json`);
  if (error || !data) return { video_url: null, fotos: [] as string[], nombres: "" };
  try {
    const text = await data.text();
    return JSON.parse(text) as { video_url: string | null; fotos: string[]; nombres: string };
  } catch {
    return { video_url: null, fotos: [] as string[], nombres: "" };
  }
}

async function saveMeta(
  admin: ReturnType<typeof adminClient>,
  evento_id: string,
  meta: { video_url: string | null; fotos: string[]; nombres: string }
) {
  const blob = new Blob([JSON.stringify(meta)], { type: "application/json" });
  await admin.storage
    .from(BUCKET)
    .upload(`${evento_id}/meta.json`, blob, { upsert: true, contentType: "application/json" });
}

// ─── GET ───────────────────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ evento_id: string }> }
) {
  const { evento_id } = await params;
  const admin = adminClient();
  await ensureBucket(admin);
  const meta = await getMeta(admin, evento_id);
  return NextResponse.json(meta);
}

// ─── POST ──────────────────────────────────────────────────────────────────────
// FormData fields:
//   type: "video" | "foto" | "delete_foto" | "delete_video" | "set_nombres"
//   file: File  (para video/foto)
//   url: string (para delete_foto)
//   nombres: string (para set_nombres)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ evento_id: string }> }
) {
  const { evento_id } = await params;
  const admin = adminClient();
  await ensureBucket(admin);

  const form = await req.formData();
  const type = form.get("type") as string;
  const meta = await getMeta(admin, evento_id);

  if (type === "set_nombres") {
    meta.nombres = (form.get("nombres") as string) || "";
    await saveMeta(admin, evento_id, meta);
    return NextResponse.json({ ok: true, meta });
  }

  if (type === "delete_video") {
    if (meta.video_url) {
      // Extraer path desde la URL pública
      const path = extractPath(meta.video_url);
      if (path) await admin.storage.from(BUCKET).remove([path]);
    }
    meta.video_url = null;
    await saveMeta(admin, evento_id, meta);
    return NextResponse.json({ ok: true, meta });
  }

  if (type === "delete_foto") {
    const url = form.get("url") as string;
    const path = extractPath(url);
    if (path) await admin.storage.from(BUCKET).remove([path]);
    meta.fotos = meta.fotos.filter((f) => f !== url);
    await saveMeta(admin, evento_id, meta);
    return NextResponse.json({ ok: true, meta });
  }

  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file requerido" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  if (type === "video") {
    // Eliminar video anterior si existe
    if (meta.video_url) {
      const old = extractPath(meta.video_url);
      if (old) await admin.storage.from(BUCKET).remove([old]);
    }
    const path = `${evento_id}/video.${ext}`;
    const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
      upsert: true,
      contentType: file.type || "video/mp4",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);
    meta.video_url = urlData.publicUrl;
    await saveMeta(admin, evento_id, meta);
    return NextResponse.json({ ok: true, meta });
  }

  if (type === "foto") {
    if (meta.fotos.length >= 20) {
      return NextResponse.json({ error: "Máximo 20 fotos" }, { status: 400 });
    }
    const ts = Date.now();
    const path = `${evento_id}/fotos/${ts}.${ext}`;
    const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
      upsert: false,
      contentType: file.type || "image/jpeg",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);
    meta.fotos.push(urlData.publicUrl);
    await saveMeta(admin, evento_id, meta);
    return NextResponse.json({ ok: true, meta });
  }

  return NextResponse.json({ error: "type inválido" }, { status: 400 });
}

function extractPath(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    // /storage/v1/object/public/boda-civil/EVENTO_ID/...
    const match = url.pathname.match(/\/storage\/v1\/object\/public\/boda-civil\/(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
