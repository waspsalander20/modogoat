import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import type { EventoGenerado } from "@/lib/aiMotor";
import { aplicarSkills, sumarPuntos, calcularPerfil } from "@/lib/motor";
import type { Puntos } from "@/lib/types";
import { generarConsecuenciaEvento, type ResultadoGeneracionTurno } from "@/lib/turnoGeneracion";
import { clavePrecalculo, tomarPrecalculo } from "@/lib/turnoCache";

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

  // Mismo precálculo en segundo plano que decision/route.ts — ver
  // evento/simular/route.ts y lib/turnoCache.ts.
  const clave = clavePrecalculo(id, evento.nombre, opcion.letra);
  const precalculo = tomarPrecalculo<ResultadoGeneracionTurno>(clave);

  let resultado: ResultadoGeneracionTurno;
  try {
    resultado = precalculo
      ? await precalculo
      : await generarConsecuenciaEvento(partida, evento, opcion.letra, opcion.texto, body.tiempoRespuesta ?? 0);
  } catch (error) {
    console.error("Error procesando evento con IA:", error);
    return NextResponse.json({ error: "No pudimos continuar tu historia. Intenta de nuevo." }, { status: 502 });
  }
  const { consecuencia, siguienteEvento, uso } = resultado;
  // Si vino del precálculo, evento/simular/route.ts ya sumó su costo real
  // apenas terminó de generarse — sumarlo de nuevo acá lo duplicaría.
  const usoParaSumar = precalculo ? { inputTokens: 0, outputTokens: 0, cacheWriteTokens: 0, cacheReadTokens: 0 } : uso;

  const ingresoAntes = partida.ingresoActual;
  const ingresoDespues = consecuencia.ingresoNuevo;
  const skillsNuevas = aplicarSkills(partida.skills as Record<string, number>, consecuencia.skillsModificadas);
  const puntosNuevos = sumarPuntos(partida.puntosPerfil as unknown as Puntos, consecuencia.puntosPerfil);
  const perfil = calcularPerfil(puntosNuevos);

  const medallaNueva =
    consecuencia.medallaDesbloqueada && !partida.medallasGanadas.includes(consecuencia.medallaDesbloqueada)
      ? consecuencia.medallaDesbloqueada
      : null;
  const medallasGanadas = medallaNueva ? Array.from(new Set([...partida.medallasGanadas, medallaNueva])) : partida.medallasGanadas;
  const alertas = consecuencia.alertaGenerada
    ? Array.from(new Set([...partida.alertas, consecuencia.alertaGenerada]))
    : partida.alertas;
  const mentorNuevo = !partida.mentorActivo && consecuencia.mentorActivado ? consecuencia.mentorActivado : null;
  const mentorActivo = partida.mentorActivo ?? mentorNuevo;

  // Mismo tope de 3 apariciones de La Cabrita por partida que decision/route.ts
  // (ver regla 7b en aiMotor.ts) — enforced acá, no solo confiando en el conteo de la IA.
  const cabritaReflexion = partida.vecesCabrita < 3 ? consecuencia.cabritaReflexion : null;
  const vecesCabrita = cabritaReflexion ? partida.vecesCabrita + 1 : partida.vecesCabrita;

  // Mismo tope de 2 eventos/año que decision/route.ts — siempre se intenta
  // uno si queda cupo, para que el jugador nunca quede solo leyendo texto
  // sin una decisión inmediata después.
  const nuevoTurno = siguienteEvento ? { tipo: "evento" as const, evento: siguienteEvento } : null;

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
        skillsSubidas: consecuencia.skillsModificadas,
        medallaDesbloqueada: medallaNueva,
        costoOportunidad: consecuencia.costoOportunidad,
        cabritaReflexion,
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
        vecesCabrita,
        turnoActual: nuevoTurno ? (nuevoTurno as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
        tokensInput: { increment: usoParaSumar.inputTokens },
        tokensOutput: { increment: usoParaSumar.outputTokens },
        tokensCacheWrite: { increment: usoParaSumar.cacheWriteTokens },
        tokensCacheRead: { increment: usoParaSumar.cacheReadTokens },
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    narrativa: consecuencia.narrativa,
    tono: consecuencia.tono,
    ingresoAntes,
    ingresoDespues,
    skillsModificadas: consecuencia.skillsModificadas,
    medallaDesbloqueada: medallaNueva,
    mentorActivado: mentorNuevo,
    cabritaReflexion,
  });
}
