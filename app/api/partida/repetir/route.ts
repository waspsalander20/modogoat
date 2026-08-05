import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJugadorSesion } from "@/lib/jugadorSesion";
import { detectarTroll } from "@/lib/deteccionTroll";
import type { Puntos } from "@/lib/types";

// El onboarding (datos + las 8 preguntas disfrazadas) solo se pide una vez
// por cuenta — de la segunda partida en adelante se reusa el perfil ya
// calculado de la partida más reciente en vez de volver a pasar por
// OnboardingWizard (ver comentario "esPrimeraPartida" en /api/partida).
export async function POST() {
  const jugador = await getJugadorSesion();
  if (!jugador) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (jugador.edad === null) {
    return NextResponse.json({ error: "Todavía no completaste el onboarding" }, { status: 400 });
  }

  const anterior = await prisma.partida.findFirst({
    where: { jugadorId: jugador.id },
    orderBy: { createdAt: "desc" },
  });
  if (!anterior) {
    return NextResponse.json({ error: "No hay una partida anterior de la cual partir" }, { status: 400 });
  }

  const respuestasOnboarding = anterior.respuestasOnboarding as Record<string, string>;
  const tiemposOnboarding = anterior.tiemposOnboarding as Record<string, number>;
  const deteccion = detectarTroll(respuestasOnboarding, tiemposOnboarding);

  const partida = await prisma.partida.create({
    data: {
      jugadorId: jugador.id,
      respuestasOnboarding,
      tiemposOnboarding,
      rutaEntrada: anterior.rutaEntrada,
      puntosPerfil: anterior.puntosPerfil as unknown as Puntos,
      perfilDominante: anterior.perfilDominante,
      perfilSecundario: anterior.perfilSecundario,
      esMixto: anterior.esMixto,
      edadInicio: jugador.edad,
      edadActual: jugador.edad,
      ingresoActual: 0,
      skills: {},
      estado: "jugando",
      tiempoPromedio: deteccion.tiempoPromedio,
      patronTroll: deteccion.esTroll,
    },
  });

  return NextResponse.json({ partidaId: partida.id });
}
