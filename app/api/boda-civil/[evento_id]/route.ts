import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const BUCKET = "boda-civil";

type RamoDato = {
  activa: boolean;
  inicio: number;
  duracion: number;
  participantes: { nombre: string; ts: number }[];
  ganadora: string | null;
};

type Meta = {
  video_url: string | null;
  fotos: string[];
  nombres: string;
  reactions?: { nombre: string; ts: number }[];
  ramo?: RamoDato | null;
};

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

async function getMeta(admin: ReturnType<typeof adminClient>, evento_id: string): Promise<Meta> {
  const { data, error } = await admin.storage.from(BUCKET).download(`${evento_id}/meta.json`);
  if (error || !data) return { video_url: null, fotos: [], nombres: "", reactions: [], ramo: null };
  try {
    const text = await data.text();
    return JSON.parse(text) as Meta;
  } catch {
    return { video_url: null, fotos: [], nombres: "", reactions: [], ramo: null };
  }
}

async function saveMeta(admin: ReturnType<typeof adminClient>, evento_id: string, meta: Meta) {
  const blob = new Blob([JSON.stringify(meta)], { type: "application/json" });
  await admin.storage.from(BUCKET).upload(`${evento_id}/meta.json`, blob, { upsert: true, contentType: "application/json" });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ evento_id: string }> }) {
  const { evento_id } = await params;
  const admin = adminClient();
  await ensureBucket(admin);
  const meta = await getMeta(admin, evento_id);
  return NextResponse.json(meta);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ evento_id: string }> }) {
  const { evento_id } = await params;
  const admin = adminClient();
  await ensureBucket(admin);
  const form = await req.formData();
  const type = form.get("type") as string;
  const meta = await getMeta(admin, evento_id);

  if (type === "get_upload_url") {
    const path = form.get("path") as string;
    const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) return NextResponse.json({ error: error?.message ?? "no url" }, { status: 500 });
    return NextResponse.json({ ok: true, signedUrl: data.signedUrl, token: data.token, path: data.path });
  }

  if (type === "set_nombres") {
    meta.nombres = (form.get("nombres") as string) || "";
    await saveMeta(admin, evento_id, meta);
    return NextResponse.json({ ok: true, meta });
  }

  if (type === "set_video_url") {
    const newUrl = form.get("url") as string;
    if (meta.video_url && meta.video_url !== newUrl) {
      const oldPath = extractPath(meta.video_url);
      if (oldPath) await admin.storage.from(BUCKET).remove([oldPath]);
    }
    meta.video_url = newUrl;
    await saveMeta(admin, evento_id, meta);
    return NextResponse.json({ ok: true, meta });
  }

  if (type === "add_foto_url") {
    const url = form.get("url") as string;
    if (meta.fotos.length >= 20) return NextResponse.json({ error: "Máximo 20 fotos" }, { status: 400 });
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

  // ── RAMO ──
  if (type === "iniciar_ramo") {
    meta.ramo = { activa: true, inicio: Date.now(), duracion: 180, participantes: [], ganadora: null };
    await saveMeta(admin, evento_id, meta);
    return NextResponse.json({ ok: true, ramo: meta.ramo });
  }

  if (type === "add_ramo_participante") {
    const nombre = ((form.get("nombre") as string) || "").trim();
    if (!nombre) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    if (!meta.ramo?.activa) return NextResponse.json({ error: "Rifa no activa" }, { status: 400 });
    const ya = meta.ramo.participantes.some(p => p.nombre.toLowerCase() === nombre.toLowerCase());
    if (ya) return NextResponse.json({ ok: true, ramo: meta.ramo, duplicado: true });
    meta.ramo.participantes.push({ nombre, ts: Date.now() });
    await saveMeta(admin, evento_id, meta);
    return NextResponse.json({ ok: true, ramo: meta.ramo });
  }

  if (type === "finalizar_ramo") {
    const ganadora = ((form.get("ganadora") as string) || "").trim();
    if (!meta.ramo) return NextResponse.json({ error: "Sin rifa" }, { status: 400 });
    meta.ramo.activa = false;
    meta.ramo.ganadora = ganadora;
    await saveMeta(admin, evento_id, meta);
    return NextResponse.json({ ok: true, ramo: meta.ramo });
  }

  if (type === "reset_ramo") {
    meta.ramo = null;
    await saveMeta(admin, evento_id, meta);
    return NextResponse.json({ ok: true });
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
