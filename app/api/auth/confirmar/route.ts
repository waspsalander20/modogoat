import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { urlBase } from "@/lib/email/resend";

// GET porque es el link que el jugador toca directo desde el correo — no
// hay formulario de por medio.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${urlBase()}/juego/login?confirmado=error`);
  }

  const jugador = await prisma.jugador.findUnique({ where: { emailConfirmacionToken: token } });
  if (!jugador) {
    return NextResponse.redirect(`${urlBase()}/juego/login?confirmado=error`);
  }

  await prisma.jugador.update({
    where: { id: jugador.id },
    data: { emailConfirmado: true, emailConfirmacionToken: null },
  });

  return NextResponse.redirect(`${urlBase()}/juego/login?confirmado=ok`);
}
