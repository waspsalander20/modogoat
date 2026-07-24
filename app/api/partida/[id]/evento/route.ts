import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { procesarEleccion, generarEvento, type EventoGenerado } from "@/lib/aiMotor";
import { construirEstadoIA } from "@/lib/estadoIA";
import { aplicarSkills, sumarPuntos, calcularPerfil } from "@/lib/motor";
import type { Puntos } from "@/lib/types";

interface Body {
  opcionLetra: "A" | "B" | "C" | "D";
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

  const turno = partida.turnoActual as { tipo: string; evento?: EventoGenerado } | null;
  if (!turno || turno.tipo !== "evento" || !turno.evento) {
    return NextResponse.json({ error: "No hay un evento pendiente" }, { status: 400 });
  }
  const evento = turno.evento;
  const opcion = evento.opciones.find((o) => o.letra === body.opcionLetra);
  if (!opcion) {
    return NextResponse.json({ error: "Opción inválida" }, { status: 400 });
  }

  const historial = [
    ...partida.decisiones.map((d) => ({ anio: d.anio, titulo: d.titulo, opcionElegida: d.opcionElegida })),
    ...partida.eventos.map((e) => ({ anio: e.anio, titulo: e.nombre, opcionElegida: e.opcionElegida })),
  ].sort((a, b) => a.anio - b.anio);
  const estadoIA = construirEstadoIA(partida, historial, evento.nombre);

  let consecuencia;
  try {
    consecuencia = await procesarEleccion(estadoIA, {
      titulo: evento.nombre,
      opcion_elegida: opcion.letra,
      opcion_texto: opcion.texto,
      tiempo_respuesta: body.tiempoRespuesta ?? 0,
    });
  } catch (error) {
    console.error("Error procesando evento con IA:", error);
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

  // Mismo tope de 2 eventos/año que decision/route.ts — siempre se intenta
  // uno si queda cupo, para que el jugador nunca quede solo leyendo texto
  // sin una decisión inmediata después.
  const eventosEsteAnio = partida.eventos.filter((e) => e.anio === partida.edadActual).length + 1;
  let nuevoTurno = null;
  if (eventosEsteAnio < 2) {
    try {
      const siguienteEvento = await generarEvento(estadoIA);
      nuevoTurno = { tipo: "evento" as const, evento: siguienteEvento };
    } catch (error) {
      console.error("Error generando siguiente evento con IA:", error);
    }
  }

  await prisma.$transaction([
    prisma.eventoJugado.create({
      data: {
        partidaId: id,
        anio: partida.edadActual,
        tipoEvento: evento.tipo,
        eventoId: evento.nombre,
        nombre: evento.nombre,
        opcionElegida: opcion.letra,
        opcionTexto: opcion.texto,
        tiempoRespuesta: body.tiempoRespuesta ?? 0,
        narrativa: consecuencia.narrativa,
        ingresoAntes,
        ingresoDespues,
        medallaDesbloqueada: consecuencia.medallaDesbloqueada,
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
