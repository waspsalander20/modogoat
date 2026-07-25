import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { procesarEleccion, generarEvento, generarDecisionDeAnio, type DecisionGenerada } from "@/lib/aiMotor";
import { construirEstadoIA, construirInstruccionMentor, construirInstruccionTipoEvento } from "@/lib/estadoIA";
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
    ...partida.decisiones.map((d) => ({ anio: d.anio, titulo: d.titulo, opcionElegida: d.opcionElegida, opcionTexto: d.opcionTexto })),
    ...partida.eventos.map((e) => ({ anio: e.anio, titulo: e.nombre, opcionElegida: e.opcionElegida, opcionTexto: e.opcionTexto })),
  ].sort((a, b) => a.anio - b.anio);

  // Esta es la decisión inicial (universidad/técnica/trabajo/emprender +
  // área libre). En vez de resolverla directo a una consecuencia, generamos
  // una segunda decisión real sobre CÓMO arranca en esa área — así el
  // jugador vuelve a elegir en vez de solo leer lo que la IA decidió por él.
  if (decision.tieneCampoLibre) {
    const areaLibre = body.campoLibre?.trim() || null;
    const rutaEntrada = partida.rutaEntrada ?? opcion.titulo;
    const estadoConArea = construirEstadoIA({ ...partida, areaLibre, rutaEntrada }, historial, null);

    let siguienteDecision: DecisionGenerada;
    try {
      siguienteDecision = await generarDecisionDeAnio(estadoConArea, { pasoInicialElegido: opcion.titulo });
    } catch (error) {
      console.error("Error generando el segundo paso inicial con IA:", error);
      return NextResponse.json({ error: "No pudimos continuar tu historia. Intenta de nuevo." }, { status: 502 });
    }

    const nuevoTurnoInicial = { tipo: "decision" as const, decision: siguienteDecision };
    await prisma.partida.update({
      where: { id },
      data: {
        rutaEntrada,
        areaLibre,
        turnoActual: nuevoTurnoInicial as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ ok: true, turno: nuevoTurnoInicial });
  }

  const estadoIA = construirEstadoIA(partida, historial, null);

  const totalTurnosPrevios = partida.decisiones.length + partida.eventos.length;
  const { instruccion: instruccionMentor, forzar: forzarMentor } = construirInstruccionMentor(
    partida.mentorActivo,
    totalTurnosPrevios
  );

  let consecuencia;
  try {
    consecuencia = await procesarEleccion(
      estadoIA,
      {
        titulo: decision.titulo,
        opcion_elegida: opcion.letra,
        opcion_texto: opcion.titulo,
        tiempo_respuesta: body.tiempoRespuesta ?? 0,
      },
      instruccionMentor,
      forzarMentor
    );
  } catch (error) {
    console.error("Error procesando decisión con IA:", error);
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

  // Ritmo del año: hasta 2 eventos (imprevisto/oportunidad) por año, tope fijo
  // decidido localmente (no por la IA) para mantener partidas de duración
  // predecible. Siempre se genera uno si queda cupo — el jugador nunca debe
  // quedarse solo leyendo una consecuencia sin una decisión inmediata después.
  const eventosEsteAnio = partida.eventos.filter((e) => e.anio === partida.edadActual).length;
  let nuevoTurno = null;
  if (eventosEsteAnio < 2) {
    try {
      const evento = await generarEvento(estadoIA, construirInstruccionTipoEvento(partida.eventos));
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
        tiempoRespuesta: body.tiempoRespuesta ?? 0,
        narrativa: consecuencia.narrativa,
        ingresoAntes,
        ingresoDespues,
        skillsSubidas: consecuencia.skillsModificadas,
        puntosSumados: consecuencia.puntosPerfil,
        medallaDesbloqueada: medallaNueva,
        costoOportunidad: consecuencia.costoOportunidad,
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
    medallaDesbloqueada: medallaNueva,
    mentorActivado: mentorNuevo,
  });
}
