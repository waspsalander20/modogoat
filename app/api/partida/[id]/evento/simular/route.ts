import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { EventoGenerado } from "@/lib/aiMotor";
import { generarSoloConsecuenciaEvento, generarSiguienteEventoParaEvento } from "@/lib/turnoGeneracion";
import { clavePrecalculo, claveSiguienteEvento, precalcular } from "@/lib/turnoCache";
import type { UsoIA } from "@/lib/aiCost";

interface Body {
  opcionLetra: "A" | "B" | "C" | "D";
}

// Ver el mismo comentario en decision/simular/route.ts — cada opción
// precalculada es una llamada real que Anthropic cobra, se use o no.
async function registrarUsoPrecalculo(partidaId: string, uso: UsoIA) {
  await prisma.partida.update({
    where: { id: partidaId },
    data: {
      tokensInput: { increment: uso.inputTokens },
      tokensOutput: { increment: uso.outputTokens },
      tokensCacheWrite: { increment: uso.cacheWriteTokens },
      tokensCacheRead: { increment: uso.cacheReadTokens },
    },
  });
}

// Mismo patrón que decision/simular/route.ts, para eventos.
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
    return NextResponse.json({ ok: false });
  }

  const turno = partida.turnoActual as { tipo: string; evento?: EventoGenerado } | null;
  if (!turno || turno.tipo !== "evento" || !turno.evento) {
    return NextResponse.json({ ok: false });
  }
  const evento = turno.evento;
  const opcion = evento.opciones.find((o) => o.letra === body.opcionLetra);
  if (!opcion) {
    return NextResponse.json({ ok: false });
  }

  const claveConsecuencia = clavePrecalculo(id, evento.nombre, opcion.letra);
  precalcular(claveConsecuencia, () => generarSoloConsecuenciaEvento(partida, evento, opcion.letra, opcion.texto, 0))
    .then((resultado) => registrarUsoPrecalculo(id, resultado.uso))
    .catch(() => {});

  // Sin letra en la clave — compartida entre las 4 opciones (ver
  // decision/simular/route.ts y lib/turnoGeneracion.ts).
  const claveEvento = claveSiguienteEvento(id, evento.nombre);
  precalcular(claveEvento, () => generarSiguienteEventoParaEvento(partida, evento))
    .then((resultado) => registrarUsoPrecalculo(id, resultado.uso))
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
