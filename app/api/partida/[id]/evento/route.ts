import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { procesarEleccion, generarEvento, type EventoGenerado } from "@/lib/aiMotor";
import { construirEstadoIA, construirInstruccionMentor, construirInstruccionTipoEvento } from "@/lib/estadoIA";
import { aplicarSkills, sumarPuntos, calcularPerfil } from "@/lib/motor";
import type { Puntos } from "@/lib/types";
import { usoVacio, sumarUso, type UsoIA } from "@/lib/aiCost";

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
    ...partida.decisiones.map((d) => ({ anio: d.anio, titulo: d.titulo, opcionElegida: d.opcionElegida, opcionTexto: d.opcionTexto })),
    ...partida.eventos.map((e) => ({ anio: e.anio, titulo: e.nombre, opcionElegida: e.opcionElegida, opcionTexto: e.opcionTexto })),
  ].sort((a, b) => a.anio - b.anio);
  const estadoIA = construirEstadoIA(partida, historial, evento.nombre);

  const totalTurnosPrevios = partida.decisiones.length + partida.eventos.length;
  const { instruccion: instruccionMentor, forzar: forzarMentor } = construirInstruccionMentor(
    partida.mentorActivo,
    totalTurnosPrevios,
    partida.edadActual - partida.edadInicio
  );

  // procesarEleccion (consecuencia del turno) y generarEvento (el siguiente
  // turno) no dependen entre sí — ambas parten del mismo estadoIA de antes
  // de esta elección — así que se disparan en paralelo en vez de en
  // secuencia. Esto corta a la mitad la latencia percibida por turno sin
  // tocar el modelo ni el prompt.
  const eventosEsteAnio = partida.eventos.filter((e) => e.anio === partida.edadActual).length + 1;
  const debeGenerarEvento = eventosEsteAnio < 2;
  const tiposConEsteEvento = [...partida.eventos, { tipoEvento: evento.tipo }];

  let uso: UsoIA = usoVacio();
  const promesaConsecuencia = procesarEleccion(
    estadoIA,
    {
      titulo: evento.nombre,
      opcion_elegida: opcion.letra,
      opcion_texto: opcion.texto,
      tiempo_respuesta: body.tiempoRespuesta ?? 0,
    },
    instruccionMentor,
    forzarMentor,
    (u) => {
      uso = sumarUso(uso, u);
    }
  );
  const promesaEvento = debeGenerarEvento
    ? generarEvento(estadoIA, construirInstruccionTipoEvento(tiposConEsteEvento), (u) => {
        uso = sumarUso(uso, u);
      })
    : null;
  // Si promesaConsecuencia falla y salimos antes de llegar al await de
  // promesaEvento más abajo, esta promesa igual puede rechazar en segundo
  // plano — sin esto Node la reporta como unhandled rejection.
  promesaEvento?.catch(() => {});

  let consecuencia;
  try {
    consecuencia = await promesaConsecuencia;
  } catch (error) {
    console.error("Error procesando evento con IA:", error);
    return NextResponse.json({ error: "No pudimos continuar tu historia. Intenta de nuevo." }, { status: 502 });
  }

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
  let nuevoTurno = null;
  if (promesaEvento) {
    try {
      const siguienteEvento = await promesaEvento;
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
        tokensInput: { increment: uso.inputTokens },
        tokensOutput: { increment: uso.outputTokens },
        tokensCacheWrite: { increment: uso.cacheWriteTokens },
        tokensCacheRead: { increment: uso.cacheReadTokens },
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
