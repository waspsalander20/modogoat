// Caché en memoria de las 4 posibles consecuencias de una decisión/evento —
// se dispara mientras el jugador todavía está leyendo, antes de que elija,
// para que al confirmar la elección real no tenga que esperar a la IA de
// nuevo. Vive server-side a propósito: el cliente nunca puede decidir qué
// ingreso/medalla/skill le toca, solo cuál letra ya se precalculó.
//
// Es un Map en memoria del proceso, no Redis — no hace falta: es un dato
// efímero de segundos (lo que tarda el jugador en decidir), por partida, y
// se descarta apenas se usa. Si el proceso se reinicia a mitad de una
// decisión, el peor caso es exactamente el comportamiento de hoy (se
// genera fresco al confirmar), nunca un dato incorrecto.

interface Entrada<T> {
  promesa: Promise<T>;
  creadoEn: number;
}

const cache = new Map<string, Entrada<unknown>>();
const TTL_MS = 10 * 60 * 1000;

function limpiarViejas() {
  const ahora = Date.now();
  for (const [clave, entrada] of cache) {
    if (ahora - entrada.creadoEn > TTL_MS) cache.delete(clave);
  }
}

export function clavePrecalculo(partidaId: string, tituloTurno: string, letra: string): string {
  return `${partidaId}:${tituloTurno}:${letra}`;
}

// El "próximo evento" no depende de la letra elegida (ver el comentario en
// lib/turnoGeneracion.ts) — clave sin letra a propósito, para que las 4
// llamadas de precálculo (una por opción) compartan el mismo cálculo en vez
// de dispararlo 4 veces.
export function claveSiguienteEvento(partidaId: string, tituloTurno: string): string {
  return `${partidaId}:${tituloTurno}:siguiente-evento`;
}

// Si ya hay un cálculo en curso o resuelto para esta clave, lo reusa
// (dedupe) — si no, arranca uno nuevo con `generar` y lo cachea de una vez
// (antes de esperarlo), para que llamadas concurrentes no disparen la IA
// dos veces.
export function precalcular<T>(clave: string, generar: () => Promise<T>): Promise<T> {
  limpiarViejas();
  const existente = cache.get(clave);
  if (existente) return existente.promesa as Promise<T>;
  const promesa = generar();
  cache.set(clave, { promesa, creadoEn: Date.now() });
  // Si falla, no dejar la promesa rota cacheada — la próxima llamada (sea
  // precálculo o confirmación real) debe poder reintentar desde cero.
  promesa.catch(() => cache.delete(clave));
  return promesa;
}

// Se usa al confirmar la elección real — si el precálculo ya está (o casi)
// listo, lo consume; si no existe, null (el caller genera fresco, como
// siempre se hizo).
export function tomarPrecalculo<T>(clave: string): Promise<T> | null {
  const entrada = cache.get(clave);
  if (!entrada) return null;
  cache.delete(clave);
  return entrada.promesa as Promise<T>;
}
