const MAX_LARGO_TEXTO_LIBRE = 200;

// Límite duro para cualquier texto libre del jugador (área libre, campo
// libre) antes de que entre al prompt de la IA — evita payloads gigantes
// de inyección de prompt y mantiene el campo fiel a su propósito real
// ("un área o interés", no un párrafo).
export function sanitizarTextoLibre(texto: string | null | undefined): string | null {
  const limpio = texto?.trim();
  if (!limpio) return null;
  return limpio.slice(0, MAX_LARGO_TEXTO_LIBRE);
}
