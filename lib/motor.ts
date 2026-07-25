import type { EstadoPartida, PerfilId, Puntos } from "@/lib/types";
import { SALARIOS_BASE } from "@/lib/data/salarios";
import { calcularPerfil } from "@/lib/perfilamiento";
import { formatoPesosCompacto } from "@/lib/format";

export function calcularGastos(edad: number): number {
  if (edad <= 18) return 0.0;
  if (edad <= 22) return 0.2;
  if (edad <= 26) return 0.4;
  return 0.6;
}

export function aplicarSkills(
  skillsActuales: Record<string, number>,
  cambios: Record<string, number> | null | undefined
): Record<string, number> {
  const resultado = { ...skillsActuales };
  for (const [skill, delta] of Object.entries(cambios ?? {})) {
    const actual = resultado[skill] ?? 0;
    resultado[skill] = Math.max(0, Math.min(5, actual + delta));
  }
  return resultado;
}

// Defensivo en ambos lados: `nuevos` viene de la IA y, pese a strict:true en
// el schema, ocasionalmente llega incompleto o el objeto entero viene
// undefined — sin esto, sumarPuntos revienta con un 500 sin manejar, el
// turno nunca se guarda, y el jugador queda repitiendo la misma decisión
// para siempre hasta que la IA por fin devuelva algo bien formado (visto en
// vivo durante testing).
export function sumarPuntos(actuales: Puntos | null | undefined, nuevos: Puntos | null | undefined): Puntos {
  const a = actuales ?? ({} as Partial<Puntos>);
  const n = nuevos ?? ({} as Partial<Puntos>);
  return {
    EMP: (a.EMP ?? 0) + (n.EMP ?? 0),
    INV: (a.INV ?? 0) + (n.INV ?? 0),
    EMP2: (a.EMP2 ?? 0) + (n.EMP2 ?? 0),
    FREE: (a.FREE ?? 0) + (n.FREE ?? 0),
    CRE: (a.CRE ?? 0) + (n.CRE ?? 0),
  };
}

// Skills con más peso salarial según el perfil dominante — sin esto, inglés
// es la única skill con un multiplicador propio y "mejor movimiento" en
// calcularResumenAnio siempre termina recomendando lo mismo sin importar el
// área del jugador.
const SKILLS_CLAVE_POR_PERFIL: Record<PerfilId, string[]> = {
  EMP: ["liderazgo", "gestionEquipos"],
  INV: ["investigacion", "analisisDatos"],
  EMP2: ["negociacion", "toleranciaRiesgo"],
  FREE: ["marcaPersonal", "gestionProyectos"],
  CRE: ["produccionAudiovisual", "marketingDigital"],
};

export function calcularSalarioProyectado(perfilDominante: PerfilId, skills: Record<string, number>): number {
  const salarioBase = SALARIOS_BASE[perfilDominante];

  const skillsNivel5 = Object.values(skills).filter((v) => v >= 5).length;
  let multiplicadorSkills = 1.0;
  if (skillsNivel5 >= 3) multiplicadorSkills = 2.0;
  else if (skillsNivel5 >= 2) multiplicadorSkills = 1.5;
  else if (skillsNivel5 >= 1) multiplicadorSkills = 1.2;

  const nivelIngles = skills.ingles ?? 0;
  let multiplicadorIngles = 1.0;
  if (nivelIngles >= 4) multiplicadorIngles = 1.6;
  else if (nivelIngles >= 2) multiplicadorIngles = 1.3;

  const nivelClave = Math.max(0, ...SKILLS_CLAVE_POR_PERFIL[perfilDominante].map((s) => skills[s] ?? 0));
  let multiplicadorClave = 1.0;
  if (nivelClave >= 4) multiplicadorClave = 1.5;
  else if (nivelClave >= 2) multiplicadorClave = 1.25;

  return Math.round(salarioBase * multiplicadorSkills * multiplicadorIngles * multiplicadorClave);
}

export type TipoResultado = "goat" | "alto" | "medio" | "bajo" | "troll";

export function determinarResultado(
  estado: EstadoPartida,
  perfilDominante: PerfilId,
  esTroll: boolean
): TipoResultado {
  if (esTroll) return "troll";

  const salarioBase = SALARIOS_BASE[perfilDominante];
  const ingles = estado.skills.ingles ?? 0;

  if (estado.ingreso >= salarioBase * 1.5 && ingles >= 4) return "goat";
  if (estado.ingreso >= salarioBase) return "alto";
  if (estado.ingreso >= salarioBase * 0.5) return "medio";
  return "bajo";
}

export function elegirMedallasGanadas(estado: EstadoPartida, resultado: TipoResultado): string[] {
  const medallas = new Set<string>(estado.medallasGanadas);

  if (estado.decisiones.length >= 1) medallas.add("la_chispa");
  if (estado.ingreso > 0) medallas.add("primer_peso");
  if (estado.eventos.length >= 1) medallas.add("sobreviviente");

  const skillsInvertidas = new Set<string>();
  for (const d of estado.decisiones) {
    for (const s of Object.keys(d.skillsSubidas)) skillsInvertidas.add(s);
  }
  if (skillsInvertidas.size >= 3) medallas.add("inversor");

  if ((estado.skills.ingles ?? 0) >= 3) medallas.add("bilingue");
  if (Object.values(estado.skills).some((v) => v >= 5)) medallas.add("modo_enfoque");
  if (estado.mentorActivo) medallas.add("red_de_oro");

  // goat_mode es la medalla más alta del juego — solo debe quedar si el
  // resultado final realmente es GOAT. La IA puede otorgarla en cualquier
  // consecuencia intermedia por su propio criterio narrativo (está en su
  // vocabulario de medallas válidas para cualquier turno), así que hay que
  // limpiarla acá si el resultado real no la respalda, sin importar qué
  // haya quedado en estado.medallasGanadas de turnos anteriores.
  if (resultado === "goat") {
    medallas.add("goat_mode");
  } else {
    medallas.delete("goat_mode");
  }

  return Array.from(medallas);
}

export interface ResumenHighlight {
  icono: string;
  texto: string;
}

export interface ResumenAnio {
  ingresoGanado: number;
  skillsCount: number;
  medallasEsteAnio: string[];
  highlights: ResumenHighlight[];
  oportunidadPerdida: string | null;
  mejorMovimiento: string | null;
}

interface ItemAnio {
  opcionTexto: string;
  ingresoAntes: number | null;
  ingresoDespues: number | null;
  medallaDesbloqueada: string | null;
  costoOportunidad: string | null;
}

export function calcularResumenAnio(
  items: ItemAnio[],
  ingresoInicioAnio: number,
  ingresoActual: number,
  skills: Record<string, number>,
  perfilDominante: PerfilId,
  nombreSkillFn: (id: string) => string,
  nombreMedallaFn: (id: string) => string | undefined
): ResumenAnio {
  const highlights: ResumenHighlight[] = [];

  for (const item of items) {
    if (item.medallaDesbloqueada) {
      const nombre = nombreMedallaFn(item.medallaDesbloqueada);
      if (nombre) highlights.push({ icono: "🏅", texto: `Desbloqueaste ${nombre}` });
    }
    if (item.ingresoAntes !== null && item.ingresoDespues !== null) {
      if (item.ingresoDespues > item.ingresoAntes) {
        highlights.push({ icono: "✅", texto: item.opcionTexto });
      } else if (item.ingresoDespues < item.ingresoAntes) {
        highlights.push({ icono: "⚠️", texto: item.opcionTexto });
      }
    }
  }

  const skillsCount = Object.values(skills).filter((v) => v > 0).length;
  const medallasEsteAnio = items.map((i) => i.medallaDesbloqueada).filter((m): m is string => !!m);

  // Costo de oportunidad real de este año — lo marca la IA cuando una
  // elección concreta hizo perder confianza, una oportunidad o plata (ver
  // costo_oportunidad en aiMotor.ts). Si ninguna elección tuvo un costo así
  // de específico, no se muestra nada — no se inventa uno genérico.
  const oportunidadPerdida = items.find((i) => i.costoOportunidad)?.costoOportunidad ?? null;

  // Mejor movimiento posible: probar inglés a B2, las skills clave del
  // perfil (aunque el jugador todavía no las haya tocado) y cada skill que
  // ya tiene, todas llevadas a su siguiente umbral relevante — quedarse con
  // la que más sube el salario proyectado. Sin las skills clave del perfil
  // en la lista de candidatas, esto siempre terminaba recomendando inglés
  // porque era la única con multiplicador propio en niveles intermedios.
  const actual = calcularSalarioProyectado(perfilDominante, skills);
  let mejorNombre: string | null = null;
  let mejorProyeccion = actual;
  const nivelIngles = skills.ingles ?? 0;

  if (nivelIngles < 4) {
    const proyeccion = calcularSalarioProyectado(perfilDominante, { ...skills, ingles: 4 });
    if (proyeccion > mejorProyeccion) {
      mejorProyeccion = proyeccion;
      mejorNombre = "inglés a B2";
    }
  }

  const candidatas = new Set([...Object.keys(skills), ...SKILLS_CLAVE_POR_PERFIL[perfilDominante]]);
  for (const skillId of candidatas) {
    if (skillId === "ingles" || (skills[skillId] ?? 0) >= 5) continue;
    const proyeccion = calcularSalarioProyectado(perfilDominante, { ...skills, [skillId]: 5 });
    if (proyeccion > mejorProyeccion) {
      mejorProyeccion = proyeccion;
      mejorNombre = nombreSkillFn(skillId);
    }
  }

  const mejorMovimiento =
    mejorNombre && mejorProyeccion > actual
      ? `Sube tu ${mejorNombre} y tu salario proyectado pasa de ${formatoPesosCompacto(actual)} a ${formatoPesosCompacto(mejorProyeccion)} al mes.`
      : null;

  return {
    ingresoGanado: ingresoActual - ingresoInicioAnio,
    skillsCount,
    medallasEsteAnio,
    highlights,
    oportunidadPerdida,
    mejorMovimiento,
  };
}

export { calcularPerfil };
