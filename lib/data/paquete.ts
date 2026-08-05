// Cuántas partidas componen el "paquete básico" antes de que el informe
// comparativo de un jugador se considere completo. Hoy son 3 para todos los
// clientes, pero es una variable (no una constante hardcodeada en el resto
// del código) porque un cliente institucional futuro podría negociar un
// paquete distinto — ver Programa.partidasPorPaquete en el schema.
export const DEFAULT_PARTIDAS_POR_PAQUETE = 3;

export function partidasEsperadas(programa?: { partidasPorPaquete: number | null } | null): number {
  return programa?.partidasPorPaquete ?? DEFAULT_PARTIDAS_POR_PAQUETE;
}
