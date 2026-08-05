import type { Puntos, PerfilId, EstadoPartida, DecisionTomada } from "@/lib/types";
import { SALARIOS_BASE, PAIS_DEFECTO, type PaisId } from "@/lib/data/paises";

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

export function contarCambiosRuta(decisiones: DecisionTomada[]): number {
  let cambios = 0;
  for (let i = 1; i < decisiones.length; i++) {
    if (decisiones[i].opcionElegida !== decisiones[i - 1].opcionElegida) cambios++;
  }
  return cambios;
}

function contarRechazosInversion(decisiones: DecisionTomada[]): number {
  return decisiones.filter((d) => Object.keys(d.skillsSubidas).length === 0).length;
}

function contarSkillsDistintasInvertidas(decisiones: DecisionTomada[]): number {
  const skills = new Set<string>();
  for (const d of decisiones) {
    for (const s of Object.keys(d.skillsSubidas)) skills.add(s);
  }
  return skills.size;
}

export function generarAlertas(
  estado: EstadoPartida,
  jugador: { trabaja: string; contexto: string },
  perfilDominante: PerfilId,
  pais: PaisId = PAIS_DEFECTO
): string[] {
  const alertas = new Set<string>();

  // alta_empleabilidad (3 ago 2026) — cambiada de disciplina a liderazgo:
  // disciplina no era skill clave de EMP (SKILLS_CLAVE_POR_PERFIL.EMP =
  // liderazgo/negociacion, lib/motor.ts), quedaba sin razonar frente a las
  // demás alertas positivas. Liderazgo sí lo es, y ahora tiene su propia
  // medalla (Liderazgo Transformador, nivel 4) con la misma fuente
  // (Bass & Avolio / Judge & Piccolo 2004) — mismo patrón que las 3 nuevas
  // de abajo.
  if (estado.puntos.EMP > 40 && (estado.skills.liderazgo ?? 0) >= 3) {
    alertas.add("alta_empleabilidad");
  }
  if (estado.puntos.EMP2 > 40 && (estado.skills.toleranciaRiesgo ?? 0) >= 3) {
    alertas.add("emprendedor_solido");
  }
  // Nuevas (3 ago 2026) — cierran el hueco de que solo EMP y EMP2 tenían una
  // alerta positiva propia. Mismo patrón (puntos del perfil > 40 + su skill
  // clave en SKILLS_CLAVE_POR_PERFIL, lib/motor.ts, ya grounded en el libro
  // ABCDE STAR) en vez de inventar un umbral nuevo sin razonar.
  if (estado.puntos.FREE > 40 && (estado.skills.ventas ?? 0) >= 3) {
    alertas.add("freelancer_solido");
  }
  if (estado.puntos.CRE > 40 && (estado.skills.marketingDigital ?? 0) >= 3) {
    alertas.add("creador_solido");
  }
  if (estado.puntos.INV > 40 && (estado.skills.analisisDatos ?? 0) >= 3) {
    alertas.add("investigador_solido");
  }
  // Afinado (3 ago 2026) — antes solo cruzaba contexto real del jugador
  // (no trabaja + vive con familiares), sin ningún dato económico de por
  // medio. Se agrega el ingreso simulado de la partida (mismo umbral ×0.5
  // ya verificado y reutilizado en barrera_economica y determinarResultado,
  // no un número nuevo) como señal corroborante — no es una verificación
  // del ingreso real del jugador (eso no existe hoy, ver auditoría), es el
  // mismo argumento de todo el proyecto: cómo decide bajo presión económica
  // dentro de la simulación revela algo real, incluso si la cifra es
  // ficticia. Deliberadamente NO exige la alerta barrera_economica completa
  // (que también exige no invertir en skills) — un jugador de bajo ingreso
  // que sí invierte bien en skills sigue siendo un candidato válido a beca,
  // no debería excluirse por manejarse bien dentro del juego.
  // Fase 2 (3 ago 2026) — perfil_beca no debe ser solo "quién lo necesita",
  // sino "quién lo necesita Y tiene buena probabilidad de aprovecharlo",
  // igual que evalúan los programas de becas reales (necesidad + mérito).
  // Grounded en el modelo de integración de Tinto (1975/1993) — la teoría
  // más usada para predecir persistencia/deserción universitaria, con una
  // adaptación cultural verificada para universidades privadas en Colombia
  // (Tandfonline 2025): la probabilidad de terminar depende de integración
  // académica (avance real, no estancarse) e integración social (mentoría).
  // Deliberadamente un umbral BAJO/suficiente, no alto: la propia regla de
  // escasez económica del motor (4e, Mullainathan/Shafir) dice que la
  // presión financiera real reduce la capacidad de sostener disciplina —
  // exigir un estándar alto excluiría sistemáticamente a quien más lo
  // necesita, por la misma escasez que lo hace candidato. "Suficiente", no
  // "el mejor".
  if (
    jugador.trabaja === "no" &&
    (jugador.contexto === "solo_mama" || jugador.contexto === "otros_familiares") &&
    estado.ingreso < SALARIOS_BASE[pais][perfilDominante] * 0.5 &&
    (estado.skills.disciplina ?? 0) >= 2 &&
    estado.aniosEstancado < 3
  ) {
    alertas.add("perfil_beca");
  }
  // Ya no incluye patronTroll: ese caso ya vive aparte en
  // Partida.patronTroll/resultadoTipo "troll" — meterlo también acá
  // duplicaba la señal e inflaba "Perfil en riesgo" en el dashboard con
  // partidas trolleadas, mezclándolas con jóvenes genuinamente
  // estancados/indecisos (dos cosas muy distintas — ver auditoría sección
  // 06). Esta alerta ahora mide solo indecisión/desenganche real
  // (CDDQ — Gati et al., categoría "falta de disposición").
  if (estado.aniosEstancado >= 3) {
    alertas.add("perfil_riesgo");
  }
  if (contarCambiosRuta(estado.decisiones) >= 3) {
    alertas.add("explorador_vocacional");
  }
  // Afinado (2 ago 2026) para reflejar el mecanismo real de la teoría de
  // escasez (Mullainathan & Shafir; Mani/Mullainathan/Shafir/Zhao, Science
  // 2013 — verificado directo en Princeton, ver auditoría sección 06): la
  // escasez económica genuina secuestra la atención hacia lo inmediato y
  // saca de foco la inversión a futuro. Antes esta alerta se disparaba con
  // cualquier patrón de no-inversión en skills, sin importar el ingreso —
  // eso medía "Inadequate Preparation" (CBI), no "dependencia económica"
  // como dice su nombre. Ahora exige AMBAS cosas: no invertir en skills Y
  // un ingreso genuinamente bajo (mismo umbral ×0.5 ya usado y verificado
  // en determinarResultado para el tier "Medio" — no se inventa un número
  // nuevo).
  if (contarRechazosInversion(estado.decisiones) >= 3 && estado.ingreso < SALARIOS_BASE[pais][perfilDominante] * 0.5) {
    alertas.add("barrera_economica");
  }
  if (estado.decisiones.some((d) => d.alertaGenerada === "barrera_familiar")) {
    alertas.add("barrera_familiar");
  }
  // Nueva (2 ago 2026) — cierra el hueco de "barrera de evasión", descrita
  // en el prompt (regla 7c, aiMotor.ts) desde antes pero sin ID ni
  // condición de código detrás. Grounded en el estilo "evasivo" (avoidant)
  // del General Decision-Making Style (Scott & Bruce, 1995 — validado
  // también en español) — la IA la marca libremente igual que
  // barrera_familiar, no es un umbral numérico de código.
  if (estado.decisiones.some((d) => d.alertaGenerada === "barrera_evasion")) {
    alertas.add("barrera_evasion");
  }
  // Nueva (2 ago 2026) — lado positivo grounded en el Career Decision
  // Self-Efficacy Scale (Betz & Taylor; 40+ años de investigación, 5
  // factores replicados en múltiples países: autoevaluación, información
  // ocupacional, selección de metas, planeación, resolución de problemas).
  // Buscar mentor activamente = información ocupacional buscada; invertir
  // en 3+ skills distintas = planeación/desarrollo autodirigido; no estar
  // estancado = progreso real en la resolución de problemas. Igual que el
  // resto de umbrales del motor, el "3" y el "aniosEstancado < 3" son
  // diseño razonado, no un número que el CDSE valide directamente.
  if (estado.mentorActivo && contarSkillsDistintasInvertidas(estado.decisiones) >= 3 && estado.aniosEstancado < 3) {
    alertas.add("desarrollo_autodirigido");
  }

  return Array.from(alertas);
}

export function detectarBarreraPrincipal(alertas: string[]): string | null {
  if (alertas.includes("perfil_riesgo")) return "evasion_sistematica";
  if (alertas.includes("barrera_economica")) return "dependencia_economica";
  if (alertas.includes("barrera_familiar")) return "aislamiento";
  if (alertas.includes("barrera_evasion")) return "estilo_evasivo";
  if (alertas.includes("explorador_vocacional")) return "sin_direccion";
  return null;
}
