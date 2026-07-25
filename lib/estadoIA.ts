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
  opcionTexto: string;
}

// La partida dura 10 años desde la edad de inicio del jugador, no siempre
// "hasta los 30" (ver también fin-anio/route.ts y Header.tsx).
const DURACION_ANIOS = 10;

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
    edad_fin: partida.edadInicio + DURACION_ANIOS,
    ultimo_evento: ultimoEvento,
    medallas: partida.medallasGanadas,
    mentor_activo: partida.mentorActivo,
    // Últimas 6 (no 3) para que hechos establecidos hace 2 años no se
    // pierdan de vista, y con el texto real de lo elegido — antes solo
    // mandaba la letra (A/B/C/D), que sin el texto no dice nada; la IA no
    // podía recordar qué había pasado, solo que el jugador "eligió C".
    historial_decisiones: historial.slice(-6).map((d) => ({
      anio: d.anio,
      titulo: d.titulo,
      opcion_elegida: d.opcionElegida,
      opcion_texto: d.opcionTexto,
    })),
  };
}

// Sin esto, mentor_activado queda 100% a discreción de la IA y en la
// práctica casi nunca aparece — incluso pidiéndolo explícito por prompt la
// IA sigue devolviendo null si ya nombró al mentor en una consecuencia
// anterior (lo trata como "ya introducido" y no lo re-activa). Por eso
// además de la instrucción, forzar=true le quita "null" al schema del
// campo — con strict:true eso sí obliga a elegir un mentor real.
export function construirInstruccionMentor(
  mentorActivo: string | null,
  totalTurnos: number
): { instruccion: string | undefined; forzar: boolean } {
  if (mentorActivo) return { instruccion: undefined, forzar: false };
  if (totalTurnos >= 4) {
    return {
      instruccion:
        'mentor_activo en el estado es null: NO HAY mentor activado todavía en el sistema, sin importar si ya mencionaste por nombre a alguien como Jairo/Andrea/Carlos/etc. en una consecuencia anterior — esa mención no activó nada formalmente. Esta vez el campo mentor_activado es obligatorio: pon ahí el id del mentor (el mismo personaje que ya venías narrando, o uno nuevo si no había ninguno) — andrea, carlos, valentina, sebastian, luna, o don_jairo.',
      forzar: true,
    };
  }
  if (totalTurnos >= 2) {
    return {
      instruccion: "Si surge naturalmente en la narrativa, aprovecha para introducir un mentor (mentor_activado) — el jugador todavía no tiene ninguno.",
      forzar: false,
    };
  }
  return { instruccion: undefined, forzar: false };
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
