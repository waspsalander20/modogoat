// Costo real de las llamadas a la IA — para el dashboard de Sapiencia.
// Precios de Claude Sonnet 5 (lib/aiMotor.ts MODEL) por millón de tokens.
// Si se cambia el modelo o Anthropic ajusta precios, actualizar acá — es
// el único lugar donde vive esto.
const PRECIO_INPUT_POR_MILLON_USD = 3.0;
const PRECIO_OUTPUT_POR_MILLON_USD = 15.0;
// Cache de 5 minutos (ephemeral, ver cache_control en aiMotor.ts): escribir
// cuesta 1.25x el input normal, leer cuesta 0.1x.
const PRECIO_CACHE_WRITE_POR_MILLON_USD = PRECIO_INPUT_POR_MILLON_USD * 1.25;
const PRECIO_CACHE_READ_POR_MILLON_USD = PRECIO_INPUT_POR_MILLON_USD * 0.1;

export interface UsoIA {
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
}

export function usoVacio(): UsoIA {
  return { inputTokens: 0, outputTokens: 0, cacheWriteTokens: 0, cacheReadTokens: 0 };
}

export function sumarUso(a: UsoIA, b: UsoIA): UsoIA {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cacheWriteTokens: a.cacheWriteTokens + b.cacheWriteTokens,
    cacheReadTokens: a.cacheReadTokens + b.cacheReadTokens,
  };
}

export function calcularCostoUsd(uso: UsoIA): number {
  return (
    (uso.inputTokens / 1_000_000) * PRECIO_INPUT_POR_MILLON_USD +
    (uso.outputTokens / 1_000_000) * PRECIO_OUTPUT_POR_MILLON_USD +
    (uso.cacheWriteTokens / 1_000_000) * PRECIO_CACHE_WRITE_POR_MILLON_USD +
    (uso.cacheReadTokens / 1_000_000) * PRECIO_CACHE_READ_POR_MILLON_USD
  );
}
