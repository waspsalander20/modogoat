import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/jugadorAuth";
import { sanitizarDatoCorto } from "@/lib/sanitizarTexto";
import { enviarEmail, urlBase } from "@/lib/email/resend";
import { emailConfirmacion } from "@/lib/email/plantillas";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegistroBody {
  nombre: string;
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as RegistroBody;
  const nombre = sanitizarDatoCorto(body.nombre);
  const email = body.email?.trim().toLowerCase();

  if (!nombre || !email || !EMAIL_REGEX.test(email) || !body.password || body.password.length < 8) {
    return NextResponse.json(
      { error: "Revisa tu nombre, correo y que la contraseña tenga al menos 8 caracteres" },
      { status: 400 }
    );
  }

  const existente = await prisma.jugador.findUnique({ where: { email } });
  if (existente) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese correo" }, { status: 409 });
  }

  const passwordHash = await hashPassword(body.password);
  const emailConfirmacionToken = crypto.randomBytes(32).toString("hex");
  await prisma.jugador.create({
    data: { nombre, email, passwordHash, activo: false, emailConfirmacionToken },
  });

  const urlConfirmacion = `${urlBase()}/api/auth/confirmar?token=${emailConfirmacionToken}`;
  const { subject, html } = emailConfirmacion(nombre, urlConfirmacion);
  await enviarEmail({ to: email, subject, html });

  return NextResponse.json({ ok: true });
}
