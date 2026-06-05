import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Supabase guarda la sesión en localStorage (no en cookies),
// por lo que la verificación de auth se hace en cada página individualmente.
// Este proxy solo deja pasar todas las peticiones.
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
