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
  if (error && !error.message.includes("already exists")) {
    console.warn("createBucket warn:", error.message);
  }
}

async function getMeta(admin: ReturnType<typeof adminClient>, evento_id: string) {
  const { data, error } = await admin.storage
    .from(BUCKET)
    .download(`${evento_id}/meta.json`);
  if (error || !data) return { video_url: null, fotos: [] as string[], nombres: "", reactions: [] as { nombre: string; ts: number }[] };
  try {
    const text = await data.text();
    return JSON.parse(text) as { video_url: string | null; fotos: string[]; nombres: string; reactions?: { nombre: string; ts: number }[] };
  } catch {
    return { video_url: null, fotos: [] as string[], nombres: "", reactions: [] as { nombre: string; ts: number }[] };
  }
}

async function saveMeta(
  admin: ReturnType<typeof adminClient>,
  evento_id: string,
  meta: { video_url: string | null; fotos: string[]; nombres: string; reactions?: { nombre: string; ts: number }[] }
) {
  const blob = new Blob([JSON.stringify(meta)], { type: "application/json" });
  await admin.storage
    .from(BUCKET)
    .upload(`${evento_id}/meta.json`, blob, { upsert: true, contentType: "application/json" });
}

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

  if (type === "get_upload_url") {
    const path = form.get("path") as string;
    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error || !data) return NextResponse.json({ error: error?.message ?? "no url" }, { status: 500 });
    return NextResponse.json({ ok: true, signedUrl: data.signedUrl, token: data.token, path: data.path });
  }

  if (type === "set_nombres") {
    meta.nombres = (form.get("nombres") as string) || "";
    await saveMeta(admin, evento_id, meta);
    return NextResponse.json({ ok: true, meta });
  }

  // El cliente subio el video directo a Storage, solo actualiza meta.json
  if (type === "set_video_url") {
    const newUrl = form.get("url") as string;
    // Eliminar video anterior si era diferente
    if (meta.video_url && meta.video_url !== newUrl) {
      const oldPath = extractPath(meta.video_url);
      if (oldPath) await admin.storage.from(BUCKET).remove([oldPath]);
    }
    meta.video_url = newUrl;
    await saveMeta(admin, evento_id, meta);
    return NextResponse.json({ ok: true, meta });
  }

  // El cliente subio la foto directo a Storage, solo actualiza meta.json
  if (type === "add_foto_url") {
    const url = form.get("url") as string;
    if (meta.fotos.length >= 20) {
      return NextResponse.json({ error: "Máximo 20 fotos" }, { status: 400 });
    }
    if (!meta.fotos.includes(url)) meta.fotos.push(url);
    await saveMeta(admin, evento_id, meta);
    return NextResponse.json({ ok: true, meta });
  }

  if (type === "add_reaction") {
    const nombre = (form.get("nombre") as string) || "Un invitado";
    if (!meta.reactions) meta.reactions = [];
    meta.reactions.push({ nombre, ts: Date.now() });
    await saveMeta(admin, evento_id, meta);
    return NextResponse.json({ ok: true, reactions: meta.reactions });
  }

  if (type === "delete_video") {
    if (meta.video_url) {
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

  return NextResponse.json({ error: "type inválido" }, { status: 400 });
}

function extractPath(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const match = url.pathname.match(/\/storage\/v1\/object\/public\/boda-civil\/(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
