import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { elegirDecisionParaAnio, seleccionarEventos } from "@/lib/motor";
import type { EstadoPartida, PerfilId, Puntos } from "@/lib/types";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const partida = await prisma.partida.findUnique({
    where: { id },
    include: { decisiones: true, eventos: true },
  });

  if (!partida) {
    return NextResponse.json({ error: "Partida no encontrada" }, { status: 404 });
  }

  if (partida.estado === "terminado") {
    return NextResponse.json({ terminado: true });
  }

  const decisionesUsadas = partida.decisiones.map((d) => d.decisionId);
  const decision = elegirDecisionParaAnio(partida.edadActual, decisionesUsadas);

  const eventosDeEsteAnio = partida.eventos.filter((e) => e.anio === partida.edadActual);
  const eventosUsados = partida.eventos.map((e) => e.eventoId);
  const anioAnterior = partida.edadActual - 1;
  const ultimoAnioEventos = partida.eventos.filter((e) => e.anio === anioAnterior).map((e) => e.eventoId);

  const estado: EstadoPartida = {
    id: partida.id,
    nombre: "",
    edadInicio: partida.edadInicio,
    edadActual: partida.edadActual,
    ingreso: partida.ingresoActual,
    ahorros: partida.ahorros,
    puntos: partida.puntosPerfil as unknown as Puntos,
    skills: partida.skills as Record<string, number>,
    mentorActivo: partida.mentorActivo,
    medallasGanadas: partida.medallasGanadas,
    decisiones: [],
    eventos: [],
    aniosEstancado: partida.aniosEstancado,
    estado: partida.estado as EstadoPartida["estado"],
  };

  const eventos =
    eventosDeEsteAnio.length > 0
      ? [] // ya se generaron eventos este año pero no se han jugado todos — el cliente ya los tiene
      : seleccionarEventos(estado, (partida.perfilDominante as PerfilId) ?? "EMP", eventosUsados, ultimoAnioEventos);

  return NextResponse.json({
    terminado: false,
    anio: partida.edadActual,
    decision: decision && !partida.decisiones.some((d) => d.decisionId === decision.id) ? decision : null,
    eventos,
    eventosYaJugadosEsteAnio: eventosDeEsteAnio.length,
  });
}
