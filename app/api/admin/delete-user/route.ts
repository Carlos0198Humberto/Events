import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Cliente server-side con service_role — solo existe en el servidor, NUNCA en el browser
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY no configurada");
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function DELETE(req: NextRequest) {
  try {
    // 1. Leer el body
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    // 2. Verificar que el llamante es super admin (usando el JWT del header)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const accessToken = authHeader.replace("Bearer ", "");

    // Creamos un cliente anon con el token del llamante para verificar identidad
    const callerClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Verificar que el llamante es super admin
    const { data: profile } = await callerClient
      .from("profiles")
      .select("es_admin")
      .eq("id", caller.id)
      .single();

    if (!profile?.es_admin) {
      return NextResponse.json({ error: "Acceso denegado — solo super admins" }, { status: 403 });
    }

    // 3. No permitir que el admin se elimine a sí mismo
    if (userId === caller.id) {
      return NextResponse.json({ error: "No podés eliminar tu propia cuenta" }, { status: 400 });
    }

    // 4. Eliminar el usuario de auth.users (el CASCADE elimina profiles y todo lo relacionado)
    const adminClient = getAdminClient();
    const { error } = await adminClient.auth.admin.deleteUser(userId);

    if (error) {
      console.error("Error al eliminar usuario:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno";
    console.error("delete-user route error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
