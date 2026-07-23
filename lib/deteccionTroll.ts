export interface ResultadoDeteccion {
  esTroll: boolean;
  tiempoPromedio: number;
  patronRepetido: boolean;
}

const TIEMPO_MINIMO_RESPUESTA = 4; // segundos
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
