import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { generarDecisionDeAnio } from "@/lib/aiMotor";
import { construirEstadoIA } from "@/lib/estadoIA";
import { calcularResumenAnio } from "@/lib/motor";
import { normalizarPais } from "@/lib/data/paises";
import { nombreSkill } from "@/lib/data/skills";
import { medalla } from "@/lib/data/medallas";
import type { PerfilId } from "@/lib/types";
import { usoVacio, sumarUso, type UsoIA } from "@/lib/aiCost";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const partida = await prisma.partida.findUnique({
    where: { id },
    include: {
      jugador: true,
      decisiones: { orderBy: { anio: "asc" } },
      eventos: { orderBy: { anio: "asc" } },
    },
  });

  if (!partida) {
    return NextResponse.json({ error: "Partida no encontrada" }, { status: 404 });
  }

  if (partida.estado === "terminado") {
    return NextResponse.json({ terminado: true });
  }

  if (partida.turnoActual) {
    return NextResponse.json({ terminado: false, anio: partida.edadActual, turno: partida.turnoActual });
  }

  const yaDecidioEsteAnio = partida.decisiones.some((d) => d.anio === partida.edadActual);
  if (yaDecidioEsteAnio) {
    // Ya se resolvió la decisión principal (y sus eventos) de este año — el
    // cliente debe cerrar el año (fin-anio) en vez de recibir otra decisión.
    const itemsEsteAnio = [
      ...partida.decisiones
        .filter((d) => d.anio === partida.edadActual)
        .map((d) => ({
          opcionTexto: d.opcionTexto,
          ingresoAntes: d.ingresoAntes,
          ingresoDespues: d.ingresoDespues,
          skillsSubidas: d.skillsSubidas as Record<string, number>,
          medallaDesbloqueada: d.medallaDesbloqueada,
          costoOportunidad: d.costoOportunidad,
        })),
      ...partida.eventos
        .filter((e) => e.anio === partida.edadActual)
        .map((e) => ({
          opcionTexto: e.opcionTexto,
          ingresoAntes: e.ingresoAntes,
          ingresoDespues: e.ingresoDespues,
          skillsSubidas: e.skillsSubidas as Record<string, number>,
          medallaDesbloqueada: e.medallaDesbloqueada,
          costoOportunidad: e.costoOportunidad,
        })),
    ];
    const primeraDecisionEsteAnio = partida.decisiones.find((d) => d.anio === partida.edadActual);
    const ingresoInicioAnio = primeraDecisionEsteAnio?.ingresoAntes ?? partida.ingresoActual;
    const resumen = calcularResumenAnio(
      itemsEsteAnio,
      ingresoInicioAnio,
      partida.ingresoActual,
      partida.skills as Record<string, number>,
      (partida.perfilDominante as PerfilId) ?? "EMP",
      nombreSkill,
      (id) => {
        const m = medalla(id);
        return m ? { nombre: m.nombre, condicion: m.condicion } : undefined;
      },
      normalizarPais(partida.jugador.pais)
    );
    return NextResponse.json({ terminado: false, anio: partida.edadActual, turno: null, resumen });
  }

  // No hay turno pendiente: generamos la decisión principal del año.
  const historial = [
    ...partida.decisiones.map((d) => ({ anio: d.anio, titulo: d.titulo, opcionElegida: d.opcionElegida, opcionTexto: d.opcionTexto })),
    ...partida.eventos.map((e) => ({ anio: e.anio, titulo: e.nombre, opcionElegida: e.opcionElegida, opcionTexto: e.opcionTexto })),
  ].sort((a, b) => a.anio - b.anio);

  const ultimoEvento = partida.eventos.length > 0 ? partida.eventos[partida.eventos.length - 1].nombre : null;
  const estadoIA = construirEstadoIA(partida, historial, ultimoEvento);

  let uso: UsoIA = usoVacio();
  let decision;
  try {
    decision = await generarDecisionDeAnio(estadoIA, undefined, (u) => {
      uso = sumarUso(uso, u);
    });
  } catch (error) {
    console.error("Error generando decisión con IA:", error);
    return NextResponse.json({ error: "No pudimos generar tu historia. Intenta de nuevo." }, { status: 502 });
  }

  const turno = { tipo: "decision" as const, decision };

  await prisma.partida.update({
    where: { id },
    data: {
      turnoActual: turno as unknown as Prisma.InputJsonValue,
      tokensInput: { increment: uso.inputTokens },
      tokensOutput: { increment: uso.outputTokens },
      tokensCacheWrite: { increment: uso.cacheWriteTokens },
      tokensCacheRead: { increment: uso.cacheReadTokens },
    },
  });

  return NextResponse.json({ terminado: false, anio: partida.edadActual, turno });
}
