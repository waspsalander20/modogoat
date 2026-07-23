import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BANCO_IMPREVISTOS } from "@/lib/data/imprevistos";
import { BANCO_OPORTUNIDADES } from "@/lib/data/oportunidades";
import { aplicarSkills } from "@/lib/motor";

interface Body {
  eventoId: string;
  tipoEvento: "imprevisto" | "oportunidad";
  opcionLetra: "A" | "B" | "C" | "D";
  tiempoRespuesta: number;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as Body;

  const banco = body.tipoEvento === "imprevisto" ? BANCO_IMPREVISTOS : BANCO_OPORTUNIDADES;
  const evento = banco.find((e) => e.id === body.eventoId);
  if (!evento) {
    return NextResponse.json({ error: "Evento inválido" }, { status: 400 });
  }
  const opcion = evento.opciones.find((o) => o.letra === body.opcionLetra);
  if (!opcion) {
    return NextResponse.json({ error: "Opción inválida" }, { status: 400 });
  }

  const partida = await prisma.partida.findUnique({ where: { id } });
  if (!partida || partida.estado !== "jugando") {
    return NextResponse.json({ error: "Partida no disponible" }, { status: 404 });
  }

  let ingresoModifica = opcion.ingresoModifica ?? 0;
  if (opcion.resultado === "aleatorio") {
    // 50/50: la oportunidad trampa puede salir bien o mal
    ingresoModifica = Math.random() < 0.5 ? 1500000 : -1500000;
  }

  const ingresoNuevo = Math.max(0, partida.ingresoActual + ingresoModifica);
  const skillsNuevas = aplicarSkills(partida.skills as Record<string, number>, opcion.skillsModifica);

  let mentorActivo = partida.mentorActivo;
  if (opcion.resultado === "mentor_activado" || opcion.resultado === "mentor_activado_lento") {
    mentorActivo = mentorActivo ?? "pendiente";
  }

  await prisma.$transaction([
    prisma.eventoJugado.create({
      data: {
        partidaId: id,
        anio: partida.edadActual,
        tipoEvento: body.tipoEvento,
        eventoId: evento.id,
        opcionElegida: opcion.letra,
        tiempoRespuesta: body.tiempoRespuesta ?? 0,
      },
    }),
    prisma.partida.update({
      where: { id },
      data: {
        ingresoActual: ingresoNuevo,
        skills: skillsNuevas,
        mentorActivo,
        alertas: opcion.alertaGenerada
          ? Array.from(new Set([...partida.alertas, opcion.alertaGenerada]))
          : partida.alertas,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    ingresoAntes: partida.ingresoActual,
    ingresoDespues: ingresoNuevo,
    skillsModifica: opcion.skillsModifica,
    consecuencia: opcion.consecuencia ?? null,
  });
}
