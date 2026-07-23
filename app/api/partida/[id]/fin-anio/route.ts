import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcularGastos, determinarResultado, elegirMedallasGanadas } from "@/lib/motor";
import { generarAlertas } from "@/lib/perfilamiento";
import type { EstadoPartida, PerfilId, Puntos } from "@/lib/types";

const EDAD_FIN = 30;

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const partida = await prisma.partida.findUnique({
    where: { id },
    include: { jugador: true, decisiones: true, eventos: true },
  });
  if (!partida || partida.estado !== "jugando") {
    return NextResponse.json({ error: "Partida no disponible" }, { status: 404 });
  }

  const decisionEsteAnio = partida.decisiones.find((d) => d.anio === partida.edadActual);
  const seEstanco = decisionEsteAnio ? decisionEsteAnio.ingresoDespues <= decisionEsteAnio.ingresoAntes : true;
  const aniosEstancado = seEstanco ? partida.aniosEstancado + 1 : 0;

  const porcentajeGastos = calcularGastos(partida.edadActual);
  const ahorros = partida.ahorros + Math.round(partida.ingresoActual * (1 - porcentajeGastos));
  const nuevaEdad = partida.edadActual + 1;

  if (nuevaEdad < EDAD_FIN) {
    await prisma.partida.update({
      where: { id },
      data: { edadActual: nuevaEdad, ahorros, aniosEstancado, aniosJugados: partida.aniosJugados + 1 },
    });
    return NextResponse.json({ terminado: false, edadActual: nuevaEdad });
  }

  const estado: EstadoPartida = {
    id: partida.id,
    nombre: partida.jugador.nombre,
    edadInicio: partida.edadInicio,
    edadActual: nuevaEdad,
    ingreso: partida.ingresoActual,
    ahorros,
    puntos: partida.puntosPerfil as unknown as Puntos,
    skills: partida.skills as Record<string, number>,
    mentorActivo: partida.mentorActivo,
    medallasGanadas: partida.medallasGanadas,
    decisiones: partida.decisiones.map((d) => ({
      anio: d.anio,
      decisionId: d.decisionId,
      opcionElegida: d.opcionElegida,
      campoLibre: d.campoLibre ?? undefined,
      tiempoRespuesta: d.tiempoRespuesta,
      ingresoAntes: d.ingresoAntes,
      ingresoDespues: d.ingresoDespues,
      skillsSubidas: d.skillsSubidas as Record<string, number>,
      puntosSumados: d.puntosSumados as unknown as Puntos,
    })),
    eventos: partida.eventos.map((e) => ({
      anio: e.anio,
      tipoEvento: e.tipoEvento as "imprevisto" | "oportunidad",
      eventoId: e.eventoId,
      opcionElegida: e.opcionElegida,
      tiempoRespuesta: e.tiempoRespuesta,
    })),
    aniosEstancado,
    estado: "terminado",
  };

  const perfilDominante = (partida.perfilDominante as PerfilId) ?? "EMP";
  const esTroll = partida.patronTroll || aniosEstancado >= 4;
  const resultadoTipo = determinarResultado(estado, perfilDominante, esTroll);
  const alertas = generarAlertas(
    estado,
    { trabaja: partida.jugador.trabaja, contexto: partida.jugador.contexto },
    esTroll
  );
  const medallas = elegirMedallasGanadas(estado, resultadoTipo);

  await prisma.partida.update({
    where: { id },
    data: {
      edadActual: nuevaEdad,
      ahorros,
      aniosEstancado,
      aniosJugados: partida.aniosJugados + 1,
      estado: "terminado",
      resultadoTipo,
      ingresoFinal: partida.ingresoActual,
      skillsFinales: partida.skills as object,
      medallasGanadas: medallas,
      alertas,
      patronTroll: esTroll,
    },
  });

  return NextResponse.json({ terminado: true, resultadoTipo });
}
