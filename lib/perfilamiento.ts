import type { Puntos, PerfilId, EstadoPartida, DecisionTomada } from "@/lib/types";

export function calcularPerfil(puntos: Puntos): {
  dominante: PerfilId;
  secundario: PerfilId | null;
  esMixto: boolean;
} {
  const ordenado = (Object.entries(puntos) as [PerfilId, number][]).sort(([, a], [, b]) => b - a);
  const dominante = ordenado[0][0];
  const primerPuntaje = ordenado[0][1];
  const segundoPuntaje = ordenado[1][1];
  const diferencia = primerPuntaje - segundoPuntaje;

  return {
    dominante,
    secundario: diferencia < 30 ? ordenado[1][0] : null,
    esMixto: diferencia < 15,
  };
}

function contarCambiosRuta(decisiones: DecisionTomada[]): number {
  let cambios = 0;
  for (let i = 1; i < decisiones.length; i++) {
    if (decisiones[i].opcionElegida !== decisiones[i - 1].opcionElegida) cambios++;
  }
  return cambios;
}

function contarRechazosInversion(decisiones: DecisionTomada[]): number {
  return decisiones.filter((d) => Object.keys(d.skillsSubidas).length === 0).length;
}

export function generarAlertas(
  estado: EstadoPartida,
  jugador: { trabaja: string; contexto: string },
  patronTroll: boolean
): string[] {
  const alertas = new Set<string>();

  if (estado.puntos.EMP > 40 && (estado.skills.disciplina ?? 0) >= 3) {
    alertas.add("alta_empleabilidad");
  }
  if (estado.puntos.EMP2 > 40 && (estado.skills.toleranciaRiesgo ?? 0) >= 3) {
    alertas.add("emprendedor_solido");
  }
  if (jugador.trabaja === "no" && (jugador.contexto === "solo_mama" || jugador.contexto === "otros_familiares")) {
    alertas.add("perfil_beca");
  }
  if (patronTroll || estado.aniosEstancado >= 3) {
    alertas.add("perfil_riesgo");
  }
  if (contarCambiosRuta(estado.decisiones) >= 3) {
    alertas.add("explorador_vocacional");
  }
  if (contarRechazosInversion(estado.decisiones) >= 3) {
    alertas.add("barrera_economica");
  }
  if (estado.decisiones.some((d) => d.alertaGenerada === "barrera_familiar")) {
    alertas.add("barrera_familiar");
  }

  return Array.from(alertas);
}

export function detectarBarreraPrincipal(alertas: string[]): string | null {
  if (alertas.includes("perfil_riesgo")) return "evasion_sistematica";
  if (alertas.includes("barrera_economica")) return "dependencia_economica";
  if (alertas.includes("barrera_familiar")) return "aislamiento";
  if (alertas.includes("explorador_vocacional")) return "sin_direccion";
  return null;
}
