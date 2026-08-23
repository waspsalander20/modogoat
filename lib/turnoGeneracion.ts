import type { Prisma } from "@/lib/generated/prisma/client";
import { procesarEleccion, generarEvento, type ConsecuenciaGenerada, type EventoGenerado, type DecisionGenerada } from "@/lib/aiMotor";
import { construirEstadoIA, construirInstruccionMentor, construirInstruccionTipoEvento } from "@/lib/estadoIA";
import { usoVacio, sumarUso, type UsoIA } from "@/lib/aiCost";

type PartidaConHistorial = Prisma.PartidaGetPayload<{
  include: { jugador: true; decisiones: true; eventos: true };
}>;

export interface ResultadoGeneracionTurno {
  consecuencia: ConsecuenciaGenerada;
  siguienteEvento: EventoGenerado | null;
  uso: UsoIA;
}

function construirHistorial(partida: PartidaConHistorial) {
  return [
    ...partida.decisiones.map((d) => ({ anio: d.anio, titulo: d.titulo, opcionElegida: d.opcionElegida, opcionTexto: d.opcionTexto })),
    ...partida.eventos.map((e) => ({ anio: e.anio, titulo: e.nombre, opcionElegida: e.opcionElegida, opcionTexto: e.opcionTexto })),
  ].sort((a, b) => a.anio - b.anio);
}

// Genera la consecuencia de una decisión (+ el siguiente evento si queda
// cupo este año, en paralelo — ver comentario original en decision/route.ts)
// sin tocar la base de datos. La usan tanto decision/route.ts (al confirmar
// la elección real) como decision/simular/route.ts (precálculo mientras el
// jugador todavía está leyendo, ver lib/turnoCache.ts) — la misma función
// para las dos, así nunca pueden desincronizarse.
export function generarConsecuenciaDecision(
  partida: PartidaConHistorial,
  decision: DecisionGenerada,
  opcionLetra: string,
  opcionTitulo: string,
  tiempoRespuesta: number
): Promise<ResultadoGeneracionTurno> {
  const historial = construirHistorial(partida);
  const estadoIA = construirEstadoIA(partida, historial, null);

  const totalTurnosPrevios = partida.decisiones.length + partida.eventos.length;
  const { instruccion: instruccionMentor, forzar: forzarMentor } = construirInstruccionMentor(
    partida.mentorActivo,
    totalTurnosPrevios,
    partida.edadActual - partida.edadInicio
  );

  const eventosEsteAnio = partida.eventos.filter((e) => e.anio === partida.edadActual).length;
  const debeGenerarEvento = eventosEsteAnio < 2;

  let uso: UsoIA = usoVacio();
  const promesaConsecuencia = procesarEleccion(
    estadoIA,
    { titulo: decision.titulo, opcion_elegida: opcionLetra, opcion_texto: opcionTitulo, tiempo_respuesta: tiempoRespuesta },
    instruccionMentor,
    forzarMentor,
    (u) => {
      uso = sumarUso(uso, u);
    }
  );
  const promesaEvento = debeGenerarEvento
    ? generarEvento(estadoIA, construirInstruccionTipoEvento(partida.eventos), (u) => {
        uso = sumarUso(uso, u);
      })
    : null;
  promesaEvento?.catch(() => {});

  return (async () => {
    const consecuencia = await promesaConsecuencia;
    let siguienteEvento: EventoGenerado | null = null;
    if (promesaEvento) {
      try {
        siguienteEvento = await promesaEvento;
      } catch (error) {
        console.error("Error generando siguiente evento con IA:", error);
      }
    }
    return { consecuencia, siguienteEvento, uso };
  })();
}

// Mismo patrón que generarConsecuenciaDecision, para la consecuencia de un
// evento (imprevisto/oportunidad) — usada por evento/route.ts y
// evento/simular/route.ts.
export function generarConsecuenciaEvento(
  partida: PartidaConHistorial,
  evento: EventoGenerado,
  opcionLetra: string,
  opcionTexto: string,
  tiempoRespuesta: number
): Promise<ResultadoGeneracionTurno> {
  const historial = construirHistorial(partida);
  const estadoIA = construirEstadoIA(partida, historial, evento.nombre);

  const totalTurnosPrevios = partida.decisiones.length + partida.eventos.length;
  const { instruccion: instruccionMentor, forzar: forzarMentor } = construirInstruccionMentor(
    partida.mentorActivo,
    totalTurnosPrevios,
    partida.edadActual - partida.edadInicio
  );

  const eventosEsteAnio = partida.eventos.filter((e) => e.anio === partida.edadActual).length + 1;
  const debeGenerarEvento = eventosEsteAnio < 2;
  const tiposConEsteEvento = [...partida.eventos, { tipoEvento: evento.tipo }];

  let uso: UsoIA = usoVacio();
  const promesaConsecuencia = procesarEleccion(
    estadoIA,
    { titulo: evento.nombre, opcion_elegida: opcionLetra, opcion_texto: opcionTexto, tiempo_respuesta: tiempoRespuesta },
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
  promesaEvento?.catch(() => {});

  return (async () => {
    const consecuencia = await promesaConsecuencia;
    let siguienteEvento: EventoGenerado | null = null;
    if (promesaEvento) {
      try {
        siguienteEvento = await promesaEvento;
      } catch (error) {
        console.error("Error generando siguiente evento con IA:", error);
      }
    }
    return { consecuencia, siguienteEvento, uso };
  })();
}
