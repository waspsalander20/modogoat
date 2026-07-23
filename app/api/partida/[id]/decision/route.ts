import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BANCO_DECISIONES } from "@/lib/data/decisiones";
import { aplicarSkills, sumarPuntos } from "@/lib/motor";
import { calcularPerfil } from "@/lib/perfilamiento";
import type { Puntos } from "@/lib/types";

interface Body {
  decisionId: string;
  opcionLetra: "A" | "B" | "C" | "D";
  campoLibre?: string;
  tiempoRespuesta: number;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as Body;

  const decision = BANCO_DECISIONES.find((d) => d.id === body.decisionId);
  if (!decision) {
    return NextResponse.json({ error: "Decisión inválida" }, { status: 400 });
  }
  const opcion = decision.opciones.find((o) => o.letra === body.opcionLetra);
  if (!opcion) {
    return NextResponse.json({ error: "Opción inválida" }, { status: 400 });
  }

  const partida = await prisma.partida.findUnique({ where: { id } });
  if (!partida || partida.estado !== "jugando") {
    return NextResponse.json({ error: "Partida no disponible" }, { status: 404 });
  }

  const ingresoAntes = partida.ingresoActual;
  const ingresoDespues = Math.max(0, ingresoAntes + (opcion.ingresoModificador ?? 0));
  const skillsNuevas = aplicarSkills(partida.skills as Record<string, number>, opcion.skillsQueSuben);
  const puntosNuevos = sumarPuntos(partida.puntosPerfil as unknown as Puntos, opcion.puntosPerfil);
  const perfil = calcularPerfil(puntosNuevos);

  await prisma.$transaction([
    prisma.decisionJugada.create({
      data: {
        partidaId: id,
        anio: partida.edadActual,
        decisionId: decision.id,
        opcionElegida: opcion.letra,
        campoLibre: body.campoLibre?.trim() || null,
        tiempoRespuesta: body.tiempoRespuesta ?? 0,
        ingresoAntes,
        ingresoDespues,
        skillsSubidas: opcion.skillsQueSuben,
        puntosSumados: opcion.puntosPerfil,
      },
    }),
    prisma.partida.update({
      where: { id },
      data: {
        ingresoActual: ingresoDespues,
        skills: skillsNuevas,
        puntosPerfil: puntosNuevos,
        perfilDominante: perfil.dominante,
        perfilSecundario: perfil.secundario,
        esMixto: perfil.esMixto,
        rutaEntrada: decision.id === "decision_01" ? opcion.titulo : partida.rutaEntrada,
        areaLibre:
          decision.id === "decision_01" && body.campoLibre?.trim()
            ? body.campoLibre.trim()
            : partida.areaLibre,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    ingresoAntes,
    ingresoDespues,
    skillsSubidas: opcion.skillsQueSuben,
  });
}
