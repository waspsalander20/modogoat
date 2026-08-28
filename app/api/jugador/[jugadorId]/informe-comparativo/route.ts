import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { partidasEsperadas } from "@/lib/data/paquete";
import {
  calcularPatronesComparativos,
  calcularAreasDeMejora,
  encontrarMejoresDecisiones,
  extraerLecciones,
  type PartidaParaComparar,
} from "@/lib/informeComparativo";
import { generarAnalisisComparativo, type PartidaParaAnalisisComparativo } from "@/lib/aiMotor";
import { normalizarPais } from "@/lib/data/paises";
import { medalla } from "@/lib/data/medallas";

async function partidasTerminadas(jugadorId: string) {
  return prisma.partida.findMany({
    where: { jugadorId, estado: "terminado" },
    orderBy: { createdAt: "asc" },
    include: { decisiones: true, eventos: true },
  });
}

// GET: chequeo liviano (sin IA) — cuántas partidas terminó vs. cuántas le
// corresponden, para que la pantalla decida si muestra el mensaje de
// "te faltan N más" antes de disparar el análisis pesado.
export async function GET(request: NextRequest, { params }: { params: Promise<{ jugadorId: string }> }) {
  const { jugadorId } = await params;

  const jugador = await prisma.jugador.findUnique({ where: { id: jugadorId }, include: { programa: true } });
  if (!jugador) {
    return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
  }

  const terminadas = await partidasTerminadas(jugadorId);
  const esperadas = partidasEsperadas(jugador.programa);

  return NextResponse.json({
    nombre: jugador.nombre,
    partidasTerminadas: terminadas.length,
    partidasEsperadas: esperadas,
    completo: terminadas.length >= esperadas,
  });
}

// POST: dispara el análisis completo (determinístico + IA) con las
// partidas terminadas que existan al momento — el jugador puede elegir
// continuar con menos de las esperadas, no se bloquea.
export async function POST(request: NextRequest, { params }: { params: Promise<{ jugadorId: string }> }) {
  const { jugadorId } = await params;

  const jugador = await prisma.jugador.findUnique({ where: { id: jugadorId }, include: { programa: true } });
  if (!jugador) {
    return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
  }

  const terminadas = await partidasTerminadas(jugadorId);
  if (terminadas.length === 0) {
    return NextResponse.json({ error: "Este jugador todavía no terminó ninguna partida" }, { status: 400 });
  }

  const partidasParaComparar: PartidaParaComparar[] = terminadas.map((p) => ({
    id: p.id,
    perfilDominante: p.perfilDominante,
    resultadoTipo: p.resultadoTipo,
    ingresoFinal: p.ingresoFinal,
    medallasGanadas: p.medallasGanadas,
    alertas: p.alertas,
    skillsFinales: p.skillsFinales as Record<string, number> | null,
    decisiones: [...p.decisiones, ...p.eventos].map((d) => ({
      anio: d.anio,
      // Partidas antiguas (previas a que titulo/opcionTexto se guardaran
      // consistentes) pueden traer ambos campos vacíos — "Esta decisión" en
      // vez de un título en blanco en el informe.
      titulo: ("titulo" in d ? d.titulo || d.opcionTexto : d.nombre || d.opcionTexto) || "Esta decisión",
      ingresoAntes: d.ingresoAntes ?? 0,
      ingresoDespues: d.ingresoDespues ?? 0,
      medallaDesbloqueada: d.medallaDesbloqueada,
      costoOportunidad: d.costoOportunidad,
      narrativa: d.narrativa,
    })),
  }));

  const patrones = calcularPatronesComparativos(partidasParaComparar);
  const areasDeMejora = calcularAreasDeMejora(partidasParaComparar);
  const mejoresDecisiones = encontrarMejoresDecisiones(partidasParaComparar);
  const lecciones = extraerLecciones(partidasParaComparar);

  const partidasParaIA: PartidaParaAnalisisComparativo[] = partidasParaComparar.map((p, i) => ({
    numero: i + 1,
    perfilDominante: p.perfilDominante,
    resultadoTipo: p.resultadoTipo,
    ingresoFinal: p.ingresoFinal,
    // Nombres legibles, no los IDs crudos ("la_chispa") — la IA los narra
    // directo en el texto que lee el jugador. De paso filtra medallas viejas
    // que ya no existen en el sistema (ej. partidas sembradas antes de la
    // limpieza de medallas fantasma), en vez de que la IA las mencione igual.
    medallasGanadas: p.medallasGanadas.map((id) => medalla(id)?.nombre).filter((n): n is string => !!n),
    alertas: p.alertas,
  }));

  let analisis;
  try {
    analisis = await generarAnalisisComparativo(jugador.nombre, normalizarPais(jugador.pais), partidasParaIA, patrones);
  } catch (error) {
    console.error("Error generando análisis comparativo:", error);
    return NextResponse.json({ error: "No pudimos generar el análisis. Intenta de nuevo." }, { status: 502 });
  }

  return NextResponse.json({
    nombre: jugador.nombre,
    partidasEsperadas: partidasEsperadas(jugador.programa),
    partidas: partidasParaComparar.map((p) => ({
      id: p.id,
      perfilDominante: p.perfilDominante,
      resultadoTipo: p.resultadoTipo,
      ingresoFinal: p.ingresoFinal,
      medallasGanadas: p.medallasGanadas,
      // El resumen detallado de este camino (mismo texto que ya se generó y
      // guardó al terminar esa partida individual, ver lib/finalizacion.ts)
      // — no se vuelve a llamar a la IA acá, solo se reusa.
      analisisFinal: terminadas.find((t) => t.id === p.id)?.analisisFinal ?? null,
    })),
    patrones,
    areasDeMejora,
    mejoresDecisiones,
    lecciones,
    diferencias: analisis.diferencias,
    sintesis: analisis.sintesis,
  });
}
