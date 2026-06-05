import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { evento_id, nombre } = await req.json();

    if (!evento_id || !nombre?.trim()) {
      return NextResponse.json(
        { error: "evento_id y nombre son requeridos" },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Debug: verificar variables (solo en logs del servidor, no se expone al cliente)
    if (!url || !serviceKey) {
      console.error("ENV FALTANTES — URL:", !!url, "SERVICE_KEY:", !!serviceKey);
      return NextResponse.json(
        { error: `Variables de entorno faltantes: URL=${!!url} KEY=${!!serviceKey}` },
        { status: 500 }
      );
    }

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

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
      console.error("walk-in insert error:", JSON.stringify(error));
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: 500 }
      );
    }

    return NextResponse.json({ token });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("walk-in route exception:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
