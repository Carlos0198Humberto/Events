import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Cliente con service_role — bypasea RLS, solo existe en el servidor
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY no configurada");
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { evento_id, nombre } = await req.json();

    if (!evento_id || !nombre?.trim()) {
      return NextResponse.json(
        { error: "evento_id y nombre son requeridos" },
        { status: 400 }
      );
    }

    const admin = getAdminClient();

    // Verificar que el evento existe
    const { data: evento } = await admin
      .from("eventos")
      .select("id")
      .eq("id", evento_id)
      .single();

    if (!evento) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    // Generar token único
    const token = crypto.randomUUID();

    const { error } = await admin.from("invitados").insert({
      evento_id,
      nombre: nombre.trim(),
      token,
      estado: "confirmado",
      num_personas: 1,
      telefono: null,
      email: null,
    });

    if (error) {
      console.error("walk-in insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ token });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno";
    console.error("walk-in route error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
