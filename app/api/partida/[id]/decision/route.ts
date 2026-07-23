import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { procesarEleccion, generarEvento, type DecisionGenerada } from "@/lib/aiMotor";
import { construirEstadoIA } from "@/lib/estadoIA";
import { aplicarSkills, sumarPuntos, calcularPerfil } from "@/lib/motor";
import type { Puntos } from "@/lib/types";

interface Body {
  opcionLetra: "A" | "B" | "C" | "D";
  campoLibre?: string;
  tiempoRespuesta: number;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as Body;

  const partida = await prisma.partida.findUnique({
    where: { id },
    include: {
      jugador: true,
      decisiones: { orderBy: { anio: "asc" } },
      eventos: { orderBy: { anio: "asc" } },
    },
  });

  if (!partida || partida.estado !== "jugando") {
    return NextResponse.json({ error: "Partida no disponible" }, { status: 404 });
  }

  const turno = partida.turnoActual as { tipo: string; decision?: DecisionGenerada } | null;
  if (!turno || turno.tipo !== "decision" || !turno.decision) {
    return NextResponse.json({ error: "No hay una decisión pendiente" }, { status: 400 });
  }
  const decision = turno.decision;
  const opcion = decision.opciones.find((o) => o.letra === body.opcionLetra);
  if (!opcion) {
    return NextResponse.json({ error: "Opción inválida" }, { status: 400 });
  }

  const historial = [
    ...partida.decisiones.map((d) => ({ anio: d.anio, titulo: d.titulo, opcionElegida: d.opcionElegida })),
    ...partida.eventos.map((e) => ({ anio: e.anio, titulo: e.nombre, opcionElegida: e.opcionElegida })),
  ].sort((a, b) => a.anio - b.anio);
  const estadoIA = construirEstadoIA(partida, historial, null);

  let consecuencia;
  try {
    consecuencia = await procesarEleccion(estadoIA, {
      titulo: decision.titulo,
      opcion_elegida: opcion.letra,
      opcion_texto: opcion.titulo,
      campo_libre: body.campoLibre,
      tiempo_respuesta: body.tiempoRespuesta ?? 0,
    });
  } catch (error) {
    console.error("Error procesando decisión con IA:", error);
    return NextResponse.json({ error: "No pudimos continuar tu historia. Intenta de nuevo." }, { status: 502 });
  }

  const ingresoAntes = partida.ingresoActual;
  const ingresoDespues = consecuencia.ingresoNuevo;
  const skillsNuevas = aplicarSkills(partida.skills as Record<string, number>, consecuencia.skillsModificadas);
  const puntosNuevos = sumarPuntos(partida.puntosPerfil as unknown as Puntos, consecuencia.puntosPerfil);
  const perfil = calcularPerfil(puntosNuevos);

  const medallasGanadas = consecuencia.medallaDesbloqueada
    ? Array.from(new Set([...partida.medallasGanadas, consecuencia.medallaDesbloqueada]))
    : partida.medallasGanadas;
  const alertas = consecuencia.alertaGenerada
    ? Array.from(new Set([...partida.alertas, consecuencia.alertaGenerada]))
    : partida.alertas;
  const mentorActivo = partida.mentorActivo ?? consecuencia.mentorActivado;

  // Ritmo del año: hasta 2 eventos (imprevisto/oportunidad) decididos localmente,
  // no por la IA, para mantener partidas de duración predecible.
  const eventosEsteAnio = partida.eventos.filter((e) => e.anio === partida.edadActual).length;
  let nuevoTurno = null;
  const probabilidad = eventosEsteAnio === 0 ? 0.7 : eventosEsteAnio === 1 ? 0.3 : 0;
  if (Math.random() < probabilidad) {
    try {
      const evento = await generarEvento(estadoIA);
      nuevoTurno = { tipo: "evento" as const, evento };
    } catch (error) {
      console.error("Error generando evento con IA:", error);
      // seguimos sin evento este año en vez de romper la partida
    }
  }

  await prisma.$transaction([
    prisma.decisionJugada.create({
      data: {
        partidaId: id,
        anio: partida.edadActual,
        decisionId: decision.titulo,
        titulo: decision.titulo,
        opcionElegida: opcion.letra,
        opcionTexto: opcion.titulo,
        campoLibre: body.campoLibre?.trim() || null,
        tiempoRespuesta: body.tiempoRespuesta ?? 0,
        narrativa: consecuencia.narrativa,
        ingresoAntes,
        ingresoDespues,
        skillsSubidas: consecuencia.skillsModificadas,
        puntosSumados: consecuencia.puntosPerfil,
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
        medallasGanadas,
        alertas,
        mentorActivo,
        rutaEntrada: partida.rutaEntrada ?? opcion.titulo,
        areaLibre: body.campoLibre?.trim() || partida.areaLibre,
        turnoActual: nuevoTurno ? (nuevoTurno as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    narrativa: consecuencia.narrativa,
    ingresoAntes,
    ingresoDespues,
    skillsModificadas: consecuencia.skillsModificadas,
  });
}
