export interface ResultadoDeteccion {
  esTroll: boolean;
  tiempoPromedio: number;
  patronRepetido: boolean;
}

// Recalibrado 1 ago 2026: la metodología académica real de detección de
// "speeding" en encuestas da dos referencias que no coinciden — un piso
// simple de 1-2 segundos (Journal of Survey Statistics and Methodology), o
// 300ms por palabra de la pregunta (que para estas preguntas de onboarding,
// con 6 opciones y ~50-70 palabras entre pregunta y opciones, daría ~18-20
// segundos). Ninguna aplica limpio: es metodología de encuestas formales,
// no de un juego móvil con opciones cortas tipo botón. 6 segundos es un
// punto medio razonado entre el piso simple y el cálculo por palabra — más
// alto que los 4 anteriores (sin fuente), sin llegar al extremo de 18-20s
// que marcaría como troll a jugadores genuinos que solo leen rápido.
const TIEMPO_MINIMO_RESPUESTA = 6; // segundos
const MAXIMO_OPCION_REPETIDA = 6; // de 8 preguntas

export function detectarTroll(
  respuestas: Record<string, string>,
  tiempos: Record<string, number>
): ResultadoDeteccion {
  const valoresTiempo = Object.values(tiempos);
  const tiempoPromedio = valoresTiempo.length
    ? valoresTiempo.reduce((a, b) => a + b, 0) / valoresTiempo.length
    : 0;

  const valores = Object.values(respuestas);
  const conteos = new Map<string, number>();
  for (const v of valores) conteos.set(v, (conteos.get(v) ?? 0) + 1);
  const vecesRepetida = Math.max(0, ...conteos.values());
  const patronRepetido = vecesRepetida >= MAXIMO_OPCION_REPETIDA;

  const tiempoMuyBajo = tiempoPromedio > 0 && tiempoPromedio < TIEMPO_MINIMO_RESPUESTA;

  return {
    esTroll: tiempoMuyBajo || patronRepetido,
    tiempoPromedio,
    patronRepetido,
  };
}
