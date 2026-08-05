import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { determinarResultado, elegirMedallasGanadas } from "@/lib/motor";
import { normalizarPais } from "@/lib/data/paises";
import { generarAlertas } from "@/lib/perfilamiento";
import { calcularBigFive } from "@/lib/bigFive";
import { generarAnalisisFinal } from "@/lib/aiMotor";
import { construirEstadoIA } from "@/lib/estadoIA";
import type { EstadoPartida, PerfilId, Puntos } from "@/lib/types";
import { usoVacio, sumarUso, type UsoIA } from "@/lib/aiCost";

// Compartido entre fin-anio (cuando no hace falta preguntar por la
// reflexión final) y reflexion-final (una vez que ya la respondió) — en
// ambos casos, para cuando esto se llama, edadActual/ahorros ya están
// persistidos en la fila de Partida; esta función solo calcula y guarda el
// resultado de cierre.
export async function finalizarPartidaAhora(id: string) {
  const partida = await prisma.partida.findUnique({
    where: { id },
    include: { jugador: true, decisiones: true, eventos: true },
  });
  if (!partida) throw new Error("Partida no encontrada para finalizar");

  const estado: EstadoPartida = {
    id: partida.id,
    nombre: partida.jugador.nombre,
    edadInicio: partida.edadInicio,
    edadActual: partida.edadActual,
    ingreso: partida.ingresoActual,
    ahorros: partida.ahorros,
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
    aniosEstancado: partida.aniosEstancado,
    estado: "terminado",
  };

  const paisId = normalizarPais(partida.jugador.pais);
  const perfilDominante = (partida.perfilDominante as PerfilId) ?? "EMP";
  const esTroll = partida.patronTroll || partida.aniosEstancado >= 4;
  const resultadoTipo = determinarResultado(estado, perfilDominante, esTroll, paisId, partida.felizFinal);
  const alertas = generarAlertas(
    estado,
    { trabaja: partida.jugador.trabaja ?? "", contexto: partida.jugador.contexto ?? "" },
    perfilDominante,
    paisId
  );
  const medallas = elegirMedallasGanadas(estado, resultadoTipo);
  const bigFive = calcularBigFive(estado);

  const historial = [
    ...partida.decisiones.map((d) => ({ anio: d.anio, titulo: d.titulo, opcionElegida: d.opcionElegida, opcionTexto: d.opcionTexto })),
    ...partida.eventos.map((e) => ({ anio: e.anio, titulo: e.nombre, opcionElegida: e.opcionElegida, opcionTexto: e.opcionTexto })),
  ].sort((a, b) => a.anio - b.anio);
  const estadoIA = construirEstadoIA(partida, historial, null, resultadoTipo);

  let uso: UsoIA = usoVacio();
  let analisisFinal: string | null = null;
  try {
    const resultado = await generarAnalisisFinal(estadoIA, (u) => {
      uso = sumarUso(uso, u);
    });
    analisisFinal = resultado.narrativa;
  } catch (error) {
    console.error("Error generando análisis final con IA:", error);
  }

  await prisma.partida.update({
    where: { id },
    data: {
      estado: "terminado",
      resultadoTipo,
      ingresoFinal: partida.ingresoActual,
      skillsFinales: partida.skills as object,
      medallasGanadas: medallas,
      alertas,
      bigFive: bigFive as unknown as Prisma.InputJsonValue,
      patronTroll: esTroll,
      analisisFinal,
      turnoActual: Prisma.DbNull,
      tokensInput: { increment: uso.inputTokens },
      tokensOutput: { increment: uso.outputTokens },
      tokensCacheWrite: { increment: uso.cacheWriteTokens },
      tokensCacheRead: { increment: uso.cacheReadTokens },
    },
  });

  return { terminado: true as const, resultadoTipo };
}
