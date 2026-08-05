import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crearTokenSesion, verifyPassword, JUGADOR_COOKIE } from "@/lib/jugadorAuth";

interface LoginBody {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as LoginBody;
  const email = body.email?.trim().toLowerCase();

  if (!email || !body.password) {
    return NextResponse.json({ error: "Ingresa tu correo y contraseña" }, { status: 400 });
  }

  const jugador = await prisma.jugador.findUnique({ where: { email } });
  if (!jugador || !jugador.passwordHash || !(await verifyPassword(body.password, jugador.passwordHash))) {
    return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
  }

  if (!jugador.activo) {
    return NextResponse.json(
      { error: "Tu cuenta todavía no fue activada. Consulta con tu colegio o administrador." },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ ok: true, tieneOnboarding: !!jugador.edad });
  response.cookies.set(JUGADOR_COOKIE, crearTokenSesion(jugador.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
