import type { Decision, Evento, EstadoPartida, PerfilId, Puntos } from "@/lib/types";
import { BANCO_DECISIONES } from "@/lib/data/decisiones";
import { BANCO_IMPREVISTOS } from "@/lib/data/imprevistos";
import { BANCO_OPORTUNIDADES } from "@/lib/data/oportunidades";
import { SALARIOS_BASE } from "@/lib/data/salarios";
import { calcularPerfil } from "@/lib/perfilamiento";

export type EventoConTipo = Evento & { tipoEvento: "imprevisto" | "oportunidad" };

const TODOS_LOS_EVENTOS: EventoConTipo[] = [
  ...BANCO_IMPREVISTOS.map((e) => ({ ...e, tipoEvento: "imprevisto" as const })),
  ...BANCO_OPORTUNIDADES.map((e) => ({ ...e, tipoEvento: "oportunidad" as const })),
];

export function calcularGastos(edad: number): number {
  if (edad <= 18) return 0.0;
  if (edad <= 22) return 0.2;
  if (edad <= 26) return 0.4;
  return 0.6;
}

export function elegirDecisionParaAnio(edadActual: number, decisionesUsadas: string[]): Decision | null {
  const disponibles = BANCO_DECISIONES.filter((d) => !decisionesUsadas.includes(d.id));
  if (disponibles.length === 0) return null;

  const enRango = disponibles.filter((d) => edadActual >= d.edadMinima && edadActual <= d.edadMaxima);
  if (enRango.length > 0) {
    return enRango.sort((a, b) => a.edadMinima - b.edadMinima)[0];
  }

  const yaPasaron = disponibles.filter((d) => edadActual > d.edadMaxima);
  if (yaPasaron.length > 0) {
    return yaPasaron.sort((a, b) => a.edadMinima - b.edadMinima)[0];
  }

  return null;
}

function pesaEvento(e: EventoConTipo, edad: number): boolean {
  if (e.edadMinima !== undefined && edad < e.edadMinima) return false;
  if (e.edadMaxima !== undefined && edad > e.edadMaxima) return false;
  return true;
}

export function seleccionarEventos(
  estado: EstadoPartida,
  perfilDominante: PerfilId,
  eventosUsados: string[],
  ultimoAnioEventos: string[]
): EventoConTipo[] {
  const disponibles = TODOS_LOS_EVENTOS.filter(
    (e) => !eventosUsados.includes(e.id) && !ultimoAnioEventos.includes(e.id) && pesaEvento(e, estado.edadActual)
  );

  // Regla especial: trampa del inglés siempre aparece si aplica
  const inglesActual = estado.skills.ingles ?? 0;
  const forzarIngles =
    inglesActual < 2 &&
    estado.edadActual >= 18 &&
    estado.edadActual <= 24 &&
    !eventosUsados.includes("trampa_ingles");
  const trampaIngles = disponibles.find((e) => e.id === "trampa_ingles");

  const seleccion: EventoConTipo[] = [];
  if (forzarIngles && trampaIngles) {
    seleccion.push(trampaIngles);
  }

  const perfilPool = disponibles.filter(
    (e) => !seleccion.some((s) => s.id === e.id) && e.perfilesPreferentes.includes(perfilDominante)
  );
  const universalPool = disponibles.filter(
    (e) => !seleccion.some((s) => s.id === e.id) && e.universal
  );

  const faltantes = 2 - seleccion.length;
  for (let i = 0; i < faltantes; i++) {
    const usarPerfil = Math.random() < 0.7;
    let pool = usarPerfil ? perfilPool : universalPool;
    if (pool.length === 0) pool = usarPerfil ? universalPool : perfilPool;
    pool = pool.filter((e) => !seleccion.some((s) => s.id === e.id));
    if (pool.length === 0) continue;
    const elegido = pool[Math.floor(Math.random() * pool.length)];
    seleccion.push(elegido);
  }

  return seleccion;
}

export function aplicarSkills(
  skillsActuales: Record<string, number>,
  cambios: Record<string, number>
): Record<string, number> {
  const resultado = { ...skillsActuales };
  for (const [skill, delta] of Object.entries(cambios)) {
    const actual = resultado[skill] ?? 0;
    resultado[skill] = Math.max(0, Math.min(5, actual + delta));
  }
  return resultado;
}

export function sumarPuntos(actuales: Puntos, nuevos: Puntos): Puntos {
  return {
    EMP: actuales.EMP + (nuevos.EMP ?? 0),
    INV: actuales.INV + (nuevos.INV ?? 0),
    EMP2: actuales.EMP2 + (nuevos.EMP2 ?? 0),
    FREE: actuales.FREE + (nuevos.FREE ?? 0),
    CRE: actuales.CRE + (nuevos.CRE ?? 0),
  };
}

export function procesarFinDeAnio(estado: EstadoPartida): EstadoPartida {
  const porcentajeGastos = calcularGastos(estado.edadActual);
  const ahorros = estado.ahorros + Math.round(estado.ingreso * (1 - porcentajeGastos));

  return {
    ...estado,
    ahorros,
    edadActual: estado.edadActual + 1,
  };
}

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

  return Math.round(salarioBase * multiplicadorSkills * multiplicadorIngles);
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
  if (resultado === "goat") medallas.add("goat_mode");

  return Array.from(medallas);
}

export { calcularPerfil };
