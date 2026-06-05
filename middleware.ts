import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rutas que requieren sesión activa
const PROTECTED_PREFIXES = ["/dashboard", "/eventos", "/admin"];

// Rutas de auth (redirigir al dashboard si ya hay sesión)
const AUTH_PREFIXES = ["/auth/login", "/auth/registro"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Leer el token de sesión de Supabase (cookie que establece el cliente)
  // Supabase guarda la sesión en sb-<projectRef>-auth-token
  const hasSession = request.cookies
    .getAll()
    .some(
      (c) =>
        c.name.startsWith("sb-") &&
        c.name.endsWith("-auth-token") &&
        c.value.length > 0,
    );

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  // Sin sesión → redirigir a login
  if (isProtected && !hasSession) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Con sesión en página de auth → redirigir al dashboard
  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/eventos/:path*",
    "/admin/:path*",
    "/auth/login",
    "/auth/registro",
  ],
};
