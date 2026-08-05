import type { EstadoPartida } from "@/lib/types";
import { contarCambiosRuta } from "@/lib/perfilamiento";

export interface BigFive {
  apertura: number;
  responsabilidad: number;
  extraversion: number;
  amabilidad: number;
  estabilidadEmocional: number;
}

// Inferencia heurística, NO un instrumento psicométrico validado — activa el
// campo bigFive del schema (planeado en el GDD original, nunca conectado a
// nada). Grounded en la dirección de la investigación real de "digital
// footprints" (correlaciones modestas pero reales, r=0.23-0.40, extraversión
// la más fuerte de las 5 — ver auditoría sección 07): se infieren rasgos a
// partir de patrones de comportamiento ya trackeados (qué skills invierte,
// qué tan consistente es, si buscó mentor), no de un cuestionario de
// autoreporte. La FÓRMULA específica (qué skills pesan en qué rasgo) es un
// heurístico nuestro, no algo tomado de un paper — mismo criterio honesto
// que el resto de "DISEÑO (razonado)" en la auditoría: la dirección tiene
// respaldo, el cálculo exacto no.
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const nivel = (skills: Record<string, number>, nombre: string) => (skills[nombre] ?? 0) * 20;
const promedio = (valores: number[]) =>
  valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;

export function calcularBigFive(estado: EstadoPartida): BigFive {
  const { skills, puntos, decisiones, aniosEstancado, mentorActivo } = estado;
  const cambiosRuta = contarCambiosRuta(decisiones);

  const apertura = clamp(
    promedio([
      nivel(skills, "diseno"),
      nivel(skills, "narrativa"),
      nivel(skills, "marketingDigital"),
      nivel(skills, "produccionContenido"),
      nivel(skills, "marcaPersonal"),
    ]) + (puntos.CRE > 30 ? 10 : 0)
  );

  const responsabilidad = clamp(
    promedio([nivel(skills, "disciplina"), nivel(skills, "gestionProyectos"), nivel(skills, "finanzasPersonales")]) -
      Math.min(cambiosRuta * 5, 20) -
      Math.min(aniosEstancado * 5, 20)
  );

  const extraversion = clamp(
    promedio([
      nivel(skills, "networking"),
      nivel(skills, "liderazgo"),
      nivel(skills, "presentaciones"),
      nivel(skills, "ventas"),
      nivel(skills, "trabajoEquipo"),
    ]) + (mentorActivo ? 10 : 0)
  );

  const amabilidad = clamp(
    promedio([nivel(skills, "comunicacionAsertiva"), nivel(skills, "empatiaClinica"), nivel(skills, "trabajoEquipo")])
  );

  const estabilidadEmocional = clamp(nivel(skills, "saludMental") - Math.min(aniosEstancado * 8, 30));

  return { apertura, responsabilidad, extraversion, amabilidad, estabilidadEmocional };
}
