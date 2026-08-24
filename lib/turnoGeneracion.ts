import type { Prisma } from "@/lib/generated/prisma/client";
import { procesarEleccion, generarEvento, type ConsecuenciaGenerada, type EventoGenerado, type DecisionGenerada } from "@/lib/aiMotor";
import { construirEstadoIA, construirInstruccionMentor, construirInstruccionTipoEvento } from "@/lib/estadoIA";
import { usoVacio, sumarUso, type UsoIA } from "@/lib/aiCost";

type PartidaConHistorial = Prisma.PartidaGetPayload<{
  include: { jugador: true; decisiones: true; eventos: true };
}>;

export interface ResultadoConsecuencia {
  consecuencia: ConsecuenciaGenerada;
  uso: UsoIA;
}

export interface ResultadoSiguienteEvento {
  siguienteEvento: EventoGenerado | null;
  uso: UsoIA;
}

function construirHistorial(partida: PartidaConHistorial) {
  return [
    ...partida.decisiones.map((d) => ({ anio: d.anio, titulo: d.titulo, opcionElegida: d.opcionElegida, opcionTexto: d.opcionTexto })),
    ...partida.eventos.map((e) => ({ anio: e.anio, titulo: e.nombre, opcionElegida: e.opcionElegida, opcionTexto: e.opcionTexto })),
  ].sort((a, b) => a.anio - b.anio);
}

// El "próximo evento" (imprevisto/oportunidad) NO depende de cuál de las 4
// opciones elija el jugador — usa el mismo estadoIA de ANTES de la elección
// (ver construirEstadoIA acá abajo, nunca recibe decisionTomada). Por eso
// vive separado de generarSoloConsecuencia*: se precalcula UNA sola vez por
// turno (cacheado sin la letra en la clave, ver decision/simular/route.ts),
// no 4 veces como la consecuencia — generarlo 4 veces sería tirar plata real
// sin ninguna razón, las 4 corridas parten de exactamente el mismo estado.

export function generarSoloConsecuenciaDecision(
  partida: PartidaConHistorial,
  decision: DecisionGenerada,
  opcionLetra: string,
  opcionTitulo: string,
  tiempoRespuesta: number
): Promise<ResultadoConsecuencia> {
  const historial = construirHistorial(partida);
  const estadoIA = construirEstadoIA(partida, historial, null);
  const totalTurnosPrevios = partida.decisiones.length + partida.eventos.length;
  const { instruccion: instruccionMentor, forzar: forzarMentor } = construirInstruccionMentor(
    partida.mentorActivo,
    totalTurnosPrevios,
    partida.edadActual - partida.edadInicio
  );

  let uso: UsoIA = usoVacio();
  return procesarEleccion(
    estadoIA,
    { titulo: decision.titulo, opcion_elegida: opcionLetra, opcion_texto: opcionTitulo, tiempo_respuesta: tiempoRespuesta },
    instruccionMentor,
    forzarMentor,
    (u) => {
      uso = sumarUso(uso, u);
    }
  ).then((consecuencia) => ({ consecuencia, uso }));
}

export function generarSiguienteEventoParaDecision(partida: PartidaConHistorial): Promise<ResultadoSiguienteEvento> {
  const eventosEsteAnio = partida.eventos.filter((e) => e.anio === partida.edadActual).length;
  if (eventosEsteAnio >= 2) return Promise.resolve({ siguienteEvento: null, uso: usoVacio() });

  const historial = construirHistorial(partida);
  const estadoIA = construirEstadoIA(partida, historial, null);
  let uso: UsoIA = usoVacio();
  return generarEvento(estadoIA, construirInstruccionTipoEvento(partida.eventos), (u) => {
    uso = sumarUso(uso, u);
  })
    .then((siguienteEvento) => ({ siguienteEvento, uso }))
    .catch((error) => {
      console.error("Error generando siguiente evento con IA:", error);
      return { siguienteEvento: null, uso };
    });
}

// Mismo patrón que las dos de arriba, para la consecuencia/siguiente evento
// de un evento (imprevisto/oportunidad) — usadas por evento/route.ts y
// evento/simular/route.ts.

export function generarSoloConsecuenciaEvento(
  partida: PartidaConHistorial,
  evento: EventoGenerado,
  opcionLetra: string,
  opcionTexto: string,
  tiempoRespuesta: number
): Promise<ResultadoConsecuencia> {
  const historial = construirHistorial(partida);
  const estadoIA = construirEstadoIA(partida, historial, evento.nombre);
  const totalTurnosPrevios = partida.decisiones.length + partida.eventos.length;
  const { instruccion: instruccionMentor, forzar: forzarMentor } = construirInstruccionMentor(
    partida.mentorActivo,
    totalTurnosPrevios,
    partida.edadActual - partida.edadInicio
  );

  let uso: UsoIA = usoVacio();
  return procesarEleccion(
    estadoIA,
    { titulo: evento.nombre, opcion_elegida: opcionLetra, opcion_texto: opcionTexto, tiempo_respuesta: tiempoRespuesta },
    instruccionMentor,
    forzarMentor,
    (u) => {
      uso = sumarUso(uso, u);
    }
  ).then((consecuencia) => ({ consecuencia, uso }));
}

export function generarSiguienteEventoParaEvento(
  partida: PartidaConHistorial,
  eventoActual: EventoGenerado
): Promise<ResultadoSiguienteEvento> {
  const eventosEsteAnio = partida.eventos.filter((e) => e.anio === partida.edadActual).length + 1;
  if (eventosEsteAnio >= 2) return Promise.resolve({ siguienteEvento: null, uso: usoVacio() });

  const historial = construirHistorial(partida);
  const estadoIA = construirEstadoIA(partida, historial, eventoActual.nombre);
  const tiposConEsteEvento = [...partida.eventos, { tipoEvento: eventoActual.tipo }];
  let uso: UsoIA = usoVacio();
  return generarEvento(estadoIA, construirInstruccionTipoEvento(tiposConEsteEvento), (u) => {
    uso = sumarUso(uso, u);
  })
    .then((siguienteEvento) => ({ siguienteEvento, uso }))
    .catch((error) => {
      console.error("Error generando siguiente evento con IA:", error);
      return { siguienteEvento: null, uso };
    });
}
