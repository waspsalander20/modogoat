import { NextRequest, NextResponse } from "next/server";
import { DASHBOARD_COOKIE, tokenEsperado } from "@/lib/dashboardAuth";
import { JUGADOR_COOKIE, jugadorIdDeToken } from "@/lib/jugadorAuth";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/dashboard/login") {
    return NextResponse.next();
  }

  const protegeApi = request.nextUrl.pathname.startsWith("/api/dashboard");
  const protegePagina = request.nextUrl.pathname.startsWith("/dashboard");

  if (protegeApi || protegePagina) {
    const cookie = request.cookies.get(DASHBOARD_COOKIE)?.value;
    if (cookie !== tokenEsperado()) {
      if (protegeApi) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      const url = new URL("/dashboard/login", request.url);
      url.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  // Arrancar una partida requiere cuenta — solo esta puerta de entrada.
  // Las páginas de una partida/resultado/informe ya creada quedan igual que
  // hoy (accesibles por link directo, sin sesión), eso es alcance aparte.
  if (request.nextUrl.pathname.startsWith("/juego/onboarding")) {
    const jugadorId = jugadorIdDeToken(request.cookies.get(JUGADOR_COOKIE)?.value);
    if (!jugadorId) {
      const url = new URL("/juego/login", request.url);
      url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/dashboard/:path*", "/juego/onboarding/:path*"],
};
