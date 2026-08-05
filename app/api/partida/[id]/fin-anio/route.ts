import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { calcularGastos, calificaParaGoatEconomico, DURACION_ANIOS } from "@/lib/motor";
import { normalizarPais } from "@/lib/data/paises";
import { generarReflexionFinal } from "@/lib/aiMotor";
import { construirEstadoIA } from "@/lib/estadoIA";
import { finalizarPartidaAhora } from "@/lib/finalizacion";
import { usoVacio, sumarUso, type UsoIA } from "@/lib/aiCost";

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
  if (!decisionEsteAnio || partida.turnoActual) {
    // Todavía falta resolver la decisión (o un evento) de este año — no se
    // puede cerrar el año sin eso, sin importar qué haya disparado esta llamada.
    return NextResponse.json({ error: "Todavía tienes una decisión pendiente este año" }, { status: 400 });
  }
  const seEstanco = decisionEsteAnio ? decisionEsteAnio.ingresoDespues <= decisionEsteAnio.ingresoAntes : true;
  const aniosEstancado = seEstanco ? partida.aniosEstancado + 1 : 0;

  const paisId = normalizarPais(partida.jugador.pais);
  const porcentajeGastos = calcularGastos(partida.edadActual, paisId);
  const ahorros = partida.ahorros + Math.round(partida.ingresoActual * (1 - porcentajeGastos));
  const nuevaEdad = partida.edadActual + 1;
  const edadFin = partida.edadInicio + DURACION_ANIOS;

  if (nuevaEdad < edadFin) {
    await prisma.partida.update({
      where: { id },
      data: {
        edadActual: nuevaEdad,
        ahorros,
        aniosEstancado,
        aniosJugados: partida.aniosJugados + 1,
        turnoActual: Prisma.DbNull,
      },
    });
    return NextResponse.json({ terminado: false, edadActual: nuevaEdad });
  }

  // Es el último año de la partida. Antes de cerrar, si el ingreso ya
  // cruzó el umbral económico de GOAT y todavía no se le hizo la
  // reflexión final, se le pregunta si de verdad está en paz con su
  // camino — el GOAT exige las dos cosas, no solo la plata (ver
  // determinarResultado en lib/motor.ts). Se guarda como un turno
  // pendiente más (mismo patrón que decision/evento) para no
  // regenerar la pregunta si el cliente recarga.
  if (calificaParaGoatEconomico(partida.ingresoActual, paisId) && partida.felizFinal === null) {
    const historial = [
      ...partida.decisiones.map((d) => ({ anio: d.anio, titulo: d.titulo, opcionElegida: d.opcionElegida, opcionTexto: d.opcionTexto })),
      ...partida.eventos.map((e) => ({ anio: e.anio, titulo: e.nombre, opcionElegida: e.opcionElegida, opcionTexto: e.opcionTexto })),
    ].sort((a, b) => a.anio - b.anio);
    const estadoIA = construirEstadoIA({ ...partida, edadActual: nuevaEdad }, historial, null);

    let uso: UsoIA = usoVacio();
    const reflexion = await generarReflexionFinal(estadoIA, (u) => {
      uso = sumarUso(uso, u);
    });

    await prisma.partida.update({
      where: { id },
      data: {
        edadActual: nuevaEdad,
        ahorros,
        aniosEstancado,
        aniosJugados: partida.aniosJugados + 1,
        turnoActual: { tipo: "reflexion_final", reflexion } as unknown as Prisma.InputJsonValue,
        tokensInput: { increment: uso.inputTokens },
        tokensOutput: { increment: uso.outputTokens },
        tokensCacheWrite: { increment: uso.cacheWriteTokens },
        tokensCacheRead: { increment: uso.cacheReadTokens },
      },
    });
    return NextResponse.json({ terminado: false, edadActual: nuevaEdad });
  }

  await prisma.partida.update({
    where: { id },
    data: {
      edadActual: nuevaEdad,
      ahorros,
      aniosEstancado,
      aniosJugados: partida.aniosJugados + 1,
      turnoActual: Prisma.DbNull,
    },
  });

  const resultado = await finalizarPartidaAhora(id);
  return NextResponse.json(resultado);
}
