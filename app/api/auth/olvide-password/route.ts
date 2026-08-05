import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarEmail, urlBase } from "@/lib/email/resend";
import { emailRecuperarPassword } from "@/lib/email/plantillas";

interface OlvidePasswordBody {
  email: string;
}

const UNA_HORA_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const body = (await request.json()) as OlvidePasswordBody;
  const email = body.email?.trim().toLowerCase();

  // Siempre respondemos "ok" exista o no la cuenta — no le damos a nadie
  // una forma de averiguar qué correos están registrados.
  if (!email) {
    return NextResponse.json({ ok: true });
  }

  const jugador = await prisma.jugador.findUnique({ where: { email } });
  if (jugador) {
    const resetPasswordToken = crypto.randomBytes(32).toString("hex");
    await prisma.jugador.update({
      where: { id: jugador.id },
      data: { resetPasswordToken, resetPasswordExpira: new Date(Date.now() + UNA_HORA_MS) },
    });

    const urlReset = `${urlBase()}/juego/login/restablecer?token=${resetPasswordToken}`;
    const { subject, html } = emailRecuperarPassword(jugador.nombre, urlReset);
    await enviarEmail({ to: email, subject, html });
  }

  return NextResponse.json({ ok: true });
}
