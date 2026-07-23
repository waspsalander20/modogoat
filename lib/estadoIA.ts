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
