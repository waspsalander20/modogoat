import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { DecisionGenerada } from "@/lib/aiMotor";
import { generarConsecuenciaDecision } from "@/lib/turnoGeneracion";
import { clavePrecalculo, precalcular } from "@/lib/turnoCache";
import type { UsoIA } from "@/lib/aiCost";

interface Body {
  opcionLetra: "A" | "B" | "C" | "D";
}

// Las 4 opciones se precalculan de verdad — cada una es una llamada real a
// la IA que Anthropic sí cobra, se use o no. Si solo se registrara el uso
// de la opción que el jugador termina eligiendo (ver decision/route.ts), el
// costo real por partida en el dashboard de Sapiencia quedaría subestimado
// hasta ~4x. Se registra acá, apenas cada precálculo termina, sin esperar
// a que el jugador elija.
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

// El cliente llama esto 4 veces (una por opción) apenas se muestra la
// decisión — mientras el jugador todavía está leyendo, no cuando ya eligió.
// No devuelve el resultado: solo lo deja calculado y cacheado del lado del
// servidor (ver lib/turnoCache.ts) para que decision/route.ts lo reuse al
// confirmar. tiempo_respuesta real todavía no se conoce acá — se persiste
// igual con el valor real en decision/route.ts, esto solo afecta el texto
// que ve la IA mientras redacta, no el dato guardado.
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

  const turno = partida.turnoActual as { tipo: string; decision?: DecisionGenerada } | null;
  // La decisión inicial (con campo libre) no tiene una consecuencia fija
  // por opción — genera una segunda decisión según el área que el jugador
  // escriba, que no se puede adivinar de antemano. Nada que precalcular acá.
  if (!turno || turno.tipo !== "decision" || !turno.decision || turno.decision.tieneCampoLibre) {
    return NextResponse.json({ ok: false });
  }
  const decision = turno.decision;
  const opcion = decision.opciones.find((o) => o.letra === body.opcionLetra);
  if (!opcion) {
    return NextResponse.json({ ok: false });
  }

  const clave = clavePrecalculo(id, decision.titulo, opcion.letra);
  precalcular(clave, () => generarConsecuenciaDecision(partida, decision, opcion.letra, opcion.titulo, 0))
    .then((resultado) => registrarUsoPrecalculo(id, resultado.uso))
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
