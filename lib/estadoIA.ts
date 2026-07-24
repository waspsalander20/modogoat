import type { EstadoIA } from "@/lib/aiMotor";
import type { PerfilId, Puntos } from "@/lib/types";

interface PartidaConDatos {
  edadInicio: number;
  edadActual: number;
  areaLibre: string | null;
  rutaEntrada: string | null;
  perfilDominante: string | null;
  puntosPerfil: unknown;
  ingresoActual: number;
  skills: unknown;
  medallasGanadas: string[];
  mentorActivo: string | null;
  jugador: { nombre: string; ciudad: string; contexto: string; trabaja: string };
}

interface DecisionOEventoReciente {
  anio: number;
  titulo: string;
  opcionElegida: string;
}

const EDAD_FIN = 30;

export function construirEstadoIA(
  partida: PartidaConDatos,
  historial: DecisionOEventoReciente[],
  ultimoEvento: string | null
): EstadoIA {
  return {
    nombre: partida.jugador.nombre,
    edad_actual: partida.edadActual,
    ciudad: partida.jugador.ciudad,
    contexto_familiar: partida.jugador.contexto,
    trabaja: partida.jugador.trabaja,
    area_libre: partida.areaLibre,
    ruta_entrada: partida.rutaEntrada,
    perfil_dominante: (partida.perfilDominante as PerfilId) ?? null,
    puntos_perfil: partida.puntosPerfil as Puntos,
    ingreso_actual: partida.ingresoActual,
    skills: (partida.skills as Record<string, number>) ?? {},
    anio_actual: partida.edadActual,
    edad_fin: EDAD_FIN,
    ultimo_evento: ultimoEvento,
    medallas: partida.medallasGanadas,
    mentor_activo: partida.mentorActivo,
    historial_decisiones: historial.slice(-3).map((d) => ({
      anio: d.anio,
      titulo: d.titulo,
      opcion_elegida: d.opcionElegida,
    })),
  };
}

// Sin esto, mentor_activado queda 100% a discreción de la IA y en la
// práctica casi nunca aparece — se fuerza a partir de cierto punto para
// que el jugador siempre vea al menos un mentor en la partida.
export function construirInstruccionMentor(mentorActivo: string | null, totalTurnos: number): string | undefined {
  if (mentorActivo) return undefined;
  if (totalTurnos >= 4) {
    return "El jugador todavía no tiene mentor activo después de varios turnos. DEBES introducir un mentor esta vez a través de mentor_activado (elige el que mejor encaje con el contexto: andrea, carlos, valentina, sebastian, luna, o don_jairo si viene de una racha negativa) — que se sienta orgánico dentro de la narrativa, no forzado ni anunciado.";
  }
  if (totalTurnos >= 2) {
    return "Si surge naturalmente en la narrativa, aprovecha para introducir un mentor (mentor_activado) — el jugador todavía no tiene ninguno.";
  }
  return undefined;
}

// El tipo de evento (imprevisto/oportunidad) queda a discreción de la IA;
// sin esto, una partida puede tocar 3 oportunidades seguidas por azar. Se
// fuerza localmente el tipo con menos apariciones hasta ahora.
export function construirInstruccionTipoEvento(eventos: Array<{ tipoEvento: string }>): string {
  const oportunidades = eventos.filter((e) => e.tipoEvento === "oportunidad").length;
  const imprevistos = eventos.filter((e) => e.tipoEvento === "imprevisto").length;
  const tipo = oportunidades <= imprevistos ? "oportunidad" : "imprevisto";
  return `Este evento DEBE ser de tipo "${tipo}" (campo tipo = "${tipo}").`;
}
