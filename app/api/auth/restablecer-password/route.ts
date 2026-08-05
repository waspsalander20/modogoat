import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/jugadorAuth";

interface RestablecerBody {
  token: string;
  password: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as RestablecerBody;

  if (!body.token || !body.password || body.password.length < 8) {
    return NextResponse.json({ error: "Falta el token o la contraseña debe tener al menos 8 caracteres" }, { status: 400 });
  }

  const jugador = await prisma.jugador.findUnique({ where: { resetPasswordToken: body.token } });
  if (!jugador || !jugador.resetPasswordExpira || jugador.resetPasswordExpira < new Date()) {
    return NextResponse.json({ error: "Este link ya no es válido. Pide uno nuevo." }, { status: 400 });
  }

  const passwordHash = await hashPassword(body.password);
  await prisma.jugador.update({
    where: { id: jugador.id },
    data: { passwordHash, resetPasswordToken: null, resetPasswordExpira: null },
  });

  return NextResponse.json({ ok: true });
}
