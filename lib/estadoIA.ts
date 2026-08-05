import type { EstadoIA } from "@/lib/aiMotor";
import { DURACION_ANIOS, type TipoResultado } from "@/lib/motor";
import { normalizarPais } from "@/lib/data/paises";
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
  felizFinal?: boolean | null;
  vecesCabrita?: number;
  // contexto/trabaja son opcionales a nivel de Jugador (recién se llenan en
  // el onboarding de la primera partida — ver Jugador en schema.prisma),
  // pero toda partida que llega hasta acá ya pasó por ese onboarding, así
  // que en la práctica siempre vienen set.
  jugador: { nombre: string; ciudad: string; pais: string; contexto: string | null; trabaja: string | null };
}

interface DecisionOEventoReciente {
  anio: number;
  titulo: string;
  opcionElegida: string;
  opcionTexto: string;
}

export function construirEstadoIA(
  partida: PartidaConDatos,
  historial: DecisionOEventoReciente[],
  ultimoEvento: string | null,
  resultadoTipo?: TipoResultado | null
): EstadoIA {
  return {
    nombre: partida.jugador.nombre,
    edad_actual: partida.edadActual,
    ciudad: partida.jugador.ciudad,
    pais: normalizarPais(partida.jugador.pais),
    contexto_familiar: partida.jugador.contexto ?? "",
    trabaja: partida.jugador.trabaja ?? "",
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
    feliz_final: partida.felizFinal ?? null,
    resultado_tipo: resultadoTipo ?? null,
    veces_cabrita: partida.vecesCabrita ?? 0,
    // Últimas 12 (no 6) para que hechos establecidos varios años atrás —
    // como haber dejado o cambiado de trabajo — no se pierdan de vista antes
    // de que termine la partida (hasta ~30 turnos en 10 años). Antes con 6
    // la IA perdía de vista decisiones de más de 2-3 años y terminaba
    // volviendo a ofrecer o preguntar por cosas que el jugador ya había
    // resuelto. Con el texto real de lo elegido, no solo la letra A/B/C/D.
    historial_decisiones: historial.slice(-12).map((d) => ({
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
//
// La activación forzada se mide en AÑOS transcurridos (no en turnos): la
// investigación de mentoría natural en jóvenes (Rhodes et al. — el mentor
// emerge de una relación ya sostenida, no de una asignación instantánea)
// respalda dar suficiente contexto narrativo antes de forzarlo. Turno 4
// (usado antes) caía demasiado pronto — con hasta 3 turnos/año, podía
// dispararse a mitad del segundo año de la partida. Año 3 da runway real
// sin dejar pasar la ventana de mayor impacto (las transiciones tempranas).
export function construirInstruccionMentor(
  mentorActivo: string | null,
  totalTurnos: number,
  aniosTranscurridos: number
): { instruccion: string | undefined; forzar: boolean } {
  if (mentorActivo) return { instruccion: undefined, forzar: false };
  if (aniosTranscurridos >= 3) {
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
