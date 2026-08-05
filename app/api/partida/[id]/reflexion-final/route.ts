import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { finalizarPartidaAhora } from "@/lib/finalizacion";

interface Body {
  respuestaFeliz: boolean;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as Body;

  const partida = await prisma.partida.findUnique({ where: { id } });
  if (!partida || partida.estado !== "jugando") {
    return NextResponse.json({ error: "Partida no disponible" }, { status: 404 });
  }

  const turno = partida.turnoActual as { tipo: string } | null;
  if (!turno || turno.tipo !== "reflexion_final") {
    return NextResponse.json({ error: "No hay una reflexión final pendiente" }, { status: 400 });
  }

  await prisma.partida.update({
    where: { id },
    data: {
      felizFinal: body.respuestaFeliz,
      turnoActual: Prisma.DbNull,
    },
  });

  const resultado = await finalizarPartidaAhora(id);
  return NextResponse.json(resultado);
}
