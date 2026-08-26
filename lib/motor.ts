import type { EstadoPartida, PerfilId, Puntos } from "@/lib/types";
import { SALARIOS_BASE, CONFIG_PAIS, PAIS_DEFECTO, type PaisId } from "@/lib/data/paises";
import { calcularPerfil, contarCambiosRuta } from "@/lib/perfilamiento";
import { formatoPesosCompacto } from "@/lib/format";

// Duración de la partida en años, desde la edad de inicio del jugador (no
// siempre termina "a los 30" — alguien que empieza a los 16 termina a los
// 16+DURACION_ANIOS). Único lugar donde se define: fin-anio/route.ts,
// Header.tsx, resultado/page.tsx y estadoIA.ts importan este valor en vez
// de duplicarlo, para que cambiarlo (ej. para acortar un demo) sea un
// cambio de una sola línea.
export const DURACION_ANIOS = 7;

// Recalibrado 1 ago 2026 (investigación con fuentes reales, ver auditoría).
// La dirección (gasto SUBE con la edad) se mantiene — no está invertida: un
// hallazgo previo sobre déficit poblacional concentrado en 0-27 años (DANE,
// metodología de cuentas de transferencia nacionales) mide algo distinto —
// el déficit agregado de TODA la población incluye a quienes todavía no
// generan ingreso propio (niños, estudiantes dependientes), no a alguien que
// ya gana desde el turno 1 como el jugador de este juego. Lo relevante para
// el jugador es la transición real hacia la independencia económica:
// - 14-18: 0% — los padres están legalmente obligados a vivienda y
//   manutención hasta esta edad (Infobae, ley colombiana).
// - 19-22: 25% — la mayoría de jóvenes en este rango sigue viviendo con sus
//   padres (35% de los colombianos de 20-29 aún vive en casa de sus padres,
//   OCDE vía Universidad de la Sabana) y ahorra fuerte mientras tanto (a los
//   20, viviendo con los papás, se recomienda ahorrar al menos 50% del
//   ingreso — techo de gasto ~50%, Forbes Colombia 2024).
// - 23-26: 45% — transición hacia la independencia: vivir solo en estrato
//   medio cuesta entre $2M y $3,1M/mes (arriendo + servicios + alimentación),
//   independizarse cuesta entre $4,4M y $7,8M en total (Portafolio /
//   Agencia PI 2026) — un gasto real que empieza a pesar antes de llegar a
//   la edad promedio de independencia.
// - 27+: 65% — Colombia tiene la edad promedio de independencia más alta de
//   la comparación (28 años, vs. 24 en EE.UU. y 26 en Europa — Universidad
//   de la Sabana), así que a esta edad la mayoría ya asume el costo pleno de
//   vivir independiente; consistente con que los colombianos de 18-34 años
//   ahorran en promedio solo 15% de su ingreso (Fincomercio, vía Semana/
//   El Tiempo) — gasto ~85% en esa cohorte agregada, este tramo se queda
//   deliberadamente por debajo de ese techo para no sobrecorregir con un
//   dato agregado que incluye edades más allá del rango de esta partida.
//
// Parametrizado por país (2 ago 2026) — antes esta función no recibía país
// en absoluto, así que Perú heredaba silenciosamente los tramos de edad de
// Colombia. Investigación propia (La República/Roomi, verificado directo en
// la fuente): los peruanos se independizan en promedio a los 29 años, la
// edad más tardía de Sudamérica (vs. 27 en Colombia y Chile, 25 en Brasil)
// — motivado por salarios bajos frente al costo de vida y fuerte cultura
// familiar. Se corre el último tramo un año más tarde para Perú (23-28
// "transición" en vez de 23-26, 29+ "independencia plena" en vez de 27+),
// mismo criterio y mismos porcentajes que Colombia, solo con el corte de
// edad ajustado a la realidad local — no hay un estudio de porcentaje de
// gasto específico de Perú todavía, así que las fracciones (0/0.25/0.45/
// 0.65) se mantienen sin cambio, solo los tramos de edad.
//
// Argentina (26 ago 2026) usa el mismo tramo que Colombia (26) a propósito,
// no por default silencioso: la edad mediana nacional de independencia es
// 28,1 años, pero específicamente en Buenos Aires (nuestro ciudadEjemplo)
// el 50% ya se independizó a los ~27 (UADE, vía Infobae/Cronista) — coincide
// con el tramo de Colombia, no con el de Perú.
export function calcularGastos(edad: number, pais: PaisId = PAIS_DEFECTO): number {
  const ultimoTramo = pais === "PE" ? 28 : 26;
  if (edad <= 18) return 0.0;
  if (edad <= 22) return 0.25;
  if (edad <= ultimoTramo) return 0.45;
  return 0.65;
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
//
// Recalibrado 1 ago 2026 con la fuente primaria de la taxonomía (libro del
// usuario "La pregunta que nadie te hizo", metodología ABCDE STAR) — cada
// capítulo lista 3 habilidades nativas + 3 "a desarrollar para escalar tu
// facturación" por arquetipo; acá se usan las de "a desarrollar" (las que
// de verdad mueven el ingreso), priorizando las que ya existen en el
// vocabulario de skills del juego:
// - EMP (Operador): "liderazgo y delegación efectiva" + "negociación
//   táctica" (antes tenía gestionEquipos en vez de negociacion).
// - INV (Investigador): "pensamiento analítico" (nativa, sigue siendo
//   central) + "traducción y síntesis / storytelling de datos" (narrativa)
//   — el libro es explícito: esta es la habilidad que separa a un
//   Investigador que comercializa su conocimiento de un "académico
//   frustrado" que sabe mucho y gana poco. Reemplaza a investigacion.
// - EMP2 (Empresario): "interpretación analítica de datos" (analisisDatos,
//   nueva) + toleranciaRiesgo (se mantiene, es un rasgo nativo central:
//   "cuero duro para la incertidumbre"). Reemplaza a negociacion.
// - FREE (Freelancer): "prospección y venta de servicios B2B" (ventas,
//   nueva) + gestionProyectos ("productización del conocimiento" — empacar
//   servicios en entregables cerrados). Reemplaza a marcaPersonal, que el
//   libro liga más a CRE ("la soberanía de la marca") que a FREE.
// - CRE (Creador): marketingDigital (se mantiene — embudos/copywriting) +
//   "capacidad de síntesis y reinterpretación" (narrativa, nueva). El libro
//   es explícito en que la producción audiovisual NO es lo que importa
//   ("la inversión no está en los fierros ni en la cámara... está en la
//   honestidad de tu perspectiva y en la claridad de tu mensaje") — por
//   eso se reemplaza produccionAudiovisual, que contradecía ese punto.
export const SKILLS_CLAVE_POR_PERFIL: Record<PerfilId, string[]> = {
  EMP: ["liderazgo", "negociacion"],
  INV: ["analisisDatos", "narrativa"],
  EMP2: ["analisisDatos", "toleranciaRiesgo"],
  FREE: ["ventas", "gestionProyectos"],
  CRE: ["marketingDigital", "narrativa"],
};

// El inglés no vale lo mismo para todos los perfiles. Para la mayoría es
// una prima de bilingüismo dentro del mismo mercado laboral local — nivel
// 2-3 (intermedio) recalibrado a +30% con Manpower Group/Mercer Marsh (vía
// El Colombiano 2026: "la diferencia de remuneración para un mismo cargo
// entre bilingüe y no bilingüe puede ser de 20%-30%"); nivel 4+ (avanzado/
// B2, antes ×1.6) recalibrado a +50% con el estudio de Pearson 2024 (vía
// Portafolio): la fluidez/dominio avanzado del inglés puede subir el
// salario hasta 50% — específico de nivel avanzado, no de cualquier
// bilingüismo (solo 11% con inglés básico reporta ingreso alto, vs. 42% con
// inglés avanzado). Reemplaza la referencia previa de LinkedIn Economic
// Graph (+35-42%, sin cifra exacta reencontrada en esta investigación) por
// una fuente más específica y verificable. Para FREE es distinto: es la
// puerta a mercado internacional, donde el mismo trabajo se paga 100-200%
// más que a un cliente local (freelancermap/vacantesremotas 2026;
// confirmado con tarifas Upwork internacionales $25-60 USD/h vs. ~$24 USD/h
// en Suramérica) — un salto de mercado, no una prima gradual. Investigación
// 1 ago 2026.
//
// El nivel2 de FREE se corrigió de ×1.6 a ×1.3 (investigación 1 ago 2026,
// segunda ronda) — el ×1.6 original nunca tuvo cifra propia, solo la lógica
// cualitativa de que B1 ya abre mercado internacional. Encontramos algo más
// preciso y específico de freelancers: fluentcap.live (citando Payoneer
// Global Freelancer Report 2024, Upwork Future Workforce Report 2024,
// Mastercard Gig Economy 2023) dice que freelancers bilingües ganan en
// promedio +30% de tarifa — prácticamente el mismo ×1.3 genérico que ya
// usan los demás perfiles — y confirma textualmente que "muchos freelancers
// internacionales exitosos operan con nivel B1-B2, no con fluidez nativa".
// Eso separa mejor la historia: en nivel 2-3 (intermedio, sin fluidez
// plena) un freelancer todavía recibe la prima genérica de ser bilingüe,
// igual que cualquier otro perfil — el verdadero salto de mercado
// internacional (100-200% más, ×2.2) se reserva para cuando ya tiene
// fluidez real (nivel4). Antes de este cambio se investigó y se descartó
// una cifra de otra fuente (ARQ Finance, "+20-30% por inglés fluido") que
// no se pudo verificar yendo directo a la página original — no se cita,
// para no repetir el error de CHASIDE de esta misma auditoría.
//
// CRE recibió su propio nivel4 (2 ago 2026), mismo patrón que FREE: nivel
// 2-3 sigue con la prima genérica, el salto de mercado se reserva para
// cuando ya hay fluidez real. Verificado directo (milx.app, CPM de YouTube
// 2026): contenido en inglés $14,67 vs. español $5,61 — ratio real de ~2,6x
// en ingreso publicitario por el mismo contenido, solo por idioma (acceso a
// audiencias de EE.UU./UK/Australia vs. LatAm). Se descartó una cifra de
// "5-10x con audiencia en inglés" (InfluenceFlow) que no se pudo verificar
// yendo directo al artículo — no está ahí, fabricación del resumen de
// búsqueda. El ×2.0 elegido queda DEBAJO del ratio de CPM verificado (2,6x)
// a propósito: a diferencia de FREE (100% tarifa/cliente), la regla 6e ya
// documenta que el 90% del ingreso rentable de un creador viene de
// productos propios/cursos, no de CPM publicitario — aplicar el ratio
// completo de CPM sobrestimaría el efecto real del inglés en su ingreso
// total.
// Parametrizado por país (2 ago 2026) — antes era un solo Record<PerfilId,
// ...> global, así que Perú heredaba en silencio los multiplicadores de
// Colombia sin que nadie lo hubiera verificado. Investigación específica de
// Perú, verificada directo en la fuente: British Council Perú reporta que
// un profesional con inglés avanzado gana 30%-50% más — prácticamente el
// mismo rango que ya usamos para Colombia (Pearson 2024: hasta 50%). Para
// el salto de mercado internacional de FREE, la cifra de "100-200% más por
// el mismo servicio a un cliente internacional" (vacantesremotas.com)
// resultó ser la MISMA fuente/cifra pan-LatAm que ya usábamos para
// Colombia, no un dato Colombia-específico — no hay evidencia de que este
// mecanismo (acceso a mercado de EE.UU./Europa vía Upwork y similares)
// difiera entre países de la región. Conclusión honesta: el código ahora
// SÍ soporta variar por país, pero los valores verificados de Perú
// convergen con los de Colombia — no es un placeholder sin investigar, es
// que la investigación real no encontró una razón para que difieran.
const MULTIPLICADOR_INGLES_POR_PAIS_Y_PERFIL: Record<PaisId, Record<PerfilId, { nivel2: number; nivel4: number }>> = {
  CO: {
    EMP: { nivel2: 1.3, nivel4: 1.5 },
    INV: { nivel2: 1.3, nivel4: 1.5 },
    EMP2: { nivel2: 1.3, nivel4: 1.5 },
    FREE: { nivel2: 1.3, nivel4: 2.2 },
    CRE: { nivel2: 1.3, nivel4: 2.0 },
  },
  PE: {
    EMP: { nivel2: 1.3, nivel4: 1.5 },
    INV: { nivel2: 1.3, nivel4: 1.5 },
    EMP2: { nivel2: 1.3, nivel4: 1.5 },
    FREE: { nivel2: 1.3, nivel4: 2.2 },
    CRE: { nivel2: 1.3, nivel4: 2.0 },
  },
  // Argentina, 26 ago 2026: mdzol.com reporta 20%-35% más de salario para
  // dominio avanzado de inglés — converge con el rango que ya usábamos
  // (Pearson 2024: hasta 50%), mismo patrón de "no hay evidencia de que
  // difiera" que Perú.
  AR: {
    EMP: { nivel2: 1.3, nivel4: 1.5 },
    INV: { nivel2: 1.3, nivel4: 1.5 },
    EMP2: { nivel2: 1.3, nivel4: 1.5 },
    FREE: { nivel2: 1.3, nivel4: 2.2 },
    CRE: { nivel2: 1.3, nivel4: 2.0 },
  },
};

export function calcularSalarioProyectado(
  perfilDominante: PerfilId,
  skills: Record<string, number>,
  pais: PaisId = PAIS_DEFECTO
): number {
  const salarioBase = SALARIOS_BASE[pais][perfilDominante];

  // Recalibrado 1 ago 2026 — 3+ skills bajó de ×2.0 a ×1.6: IIENSTITU (el
  // mismo estudio que ya respaldaba 1 y 2 skills) dice que el premium
  // compuesto por múltiples certificaciones relevantes "puede superar
  // 50-60%", no 100%. El salto entre 2 y 3+ queda chico a propósito (1.5 →
  // 1.6) porque la fuente describe retornos marginales decrecientes por
  // certificación adicional — no es un error de diseño, es lo que dice el
  // dato real.
  const skillsNivel5 = Object.values(skills).filter((v) => v >= 5).length;
  let multiplicadorSkills = 1.0;
  if (skillsNivel5 >= 3) multiplicadorSkills = 1.6;
  else if (skillsNivel5 >= 2) multiplicadorSkills = 1.5;
  else if (skillsNivel5 >= 1) multiplicadorSkills = 1.2;

  const nivelIngles = skills.ingles ?? 0;
  const { nivel2: inglesNivel2, nivel4: inglesNivel4 } = MULTIPLICADOR_INGLES_POR_PAIS_Y_PERFIL[pais][perfilDominante];
  let multiplicadorIngles = 1.0;
  if (nivelIngles >= 4) multiplicadorIngles = inglesNivel4;
  else if (nivelIngles >= 2) multiplicadorIngles = inglesNivel2;

  const nivelClave = Math.max(0, ...SKILLS_CLAVE_POR_PERFIL[perfilDominante].map((s) => skills[s] ?? 0));
  let multiplicadorClave = 1.0;
  if (nivelClave >= 4) multiplicadorClave = 1.5;
  else if (nivelClave >= 2) multiplicadorClave = 1.25;

  return Math.round(salarioBase * multiplicadorSkills * multiplicadorIngles * multiplicadorClave);
}

export type TipoResultado = "goat" | "alto" | "medio" | "bajo" | "troll";

// GOAT exige cruzar el umbral económico absoluto del país (no relativo al
// perfil, a diferencia de alto/medio/bajo) — se usa para decidir si vale la
// pena hacerle al jugador la reflexión final de felicidad antes de cerrar
// la partida (ver fin-anio/route.ts). Decisión de producto 1 ago 2026: el
// dinero solo, sin esa reflexión, no basta para el resultado más alto.
export function calificaParaGoatEconomico(ingreso: number, pais: PaisId = PAIS_DEFECTO): boolean {
  return ingreso >= CONFIG_PAIS[pais].umbralGoat;
}

export function determinarResultado(
  estado: EstadoPartida,
  perfilDominante: PerfilId,
  esTroll: boolean,
  pais: PaisId = PAIS_DEFECTO,
  feliz: boolean | null = null
): TipoResultado {
  if (esTroll) return "troll";

  const salarioBase = SALARIOS_BASE[pais][perfilDominante];

  // El ingreso alto ya no basta por sí solo para GOAT: tiene que cruzar el
  // umbral absoluto del país Y el jugador tiene que haber respondido que sí
  // es feliz con su camino en la reflexión final. Si califica económicamente
  // pero dice que no (o nunca se le preguntó), queda en "alto" — sigue
  // siendo un resultado alto, solo no el máximo.
  if (calificaParaGoatEconomico(estado.ingreso, pais) && feliz === true) return "goat";
  if (estado.ingreso >= salarioBase) return "alto";
  if (estado.ingreso >= salarioBase * 0.5) return "medio";
  return "bajo";
}

export function elegirMedallasGanadas(estado: EstadoPartida, resultado: TipoResultado): string[] {
  const medallas = new Set<string>(estado.medallasGanadas);

  // Medallas de "enganche" (hito de primera acción, no una afirmación sobre
  // el mundo real — no necesitan fuente, ver auditoría sección 08).
  if (estado.decisiones.length >= 1) medallas.add("la_chispa");
  if (estado.ingreso > 0) medallas.add("primer_peso");
  if (estado.eventos.length >= 1) medallas.add("sobreviviente");

  // Bilingüe y Red de Oro sí son afirmaciones verificables sobre el mundo
  // real, ahora con fuente (2 ago 2026, ver auditoría sección 08): hablar
  // inglés da 15,5% más probabilidad de empleo y 24,5% más acceso a trabajos
  // mejor pagados en Colombia (ANIF + British Council + Universidad de los
  // Andes, vía El Colombiano); tener un mentor activo se asocia a 5x más
  // promociones y 25% de aumento salarial vs. 5% sin mentor (estudio de Sun
  // Microsystems, 1.000 empleados). "Inversor" (3+ skills invertidas) y
  // "Modo Enfoque" (una skill a nivel 5) se quitaron el 2 ago 2026: el
  // primero no tenía un umbral verificable ("3" era arbitrario, solo
  // dirección genérica de multi-skilling); el segundo tenía investigación
  // contradictoria (2026: el mercado premia combinar skills, no solo
  // profundizar en una).
  if ((estado.skills.ingles ?? 0) >= 3) medallas.add("bilingue");
  if (estado.mentorActivo) medallas.add("red_de_oro");

  // Medallas de skill respaldadas por investigación real de psicología
  // organizacional (aportada por el usuario, 1 ago 2026 — ver auditoría
  // sección 08): Schmidt & Hunter 1998 y Dweck 2006 para agilidad mental;
  // Duckworth et al. 2007 para resiliencia/grit; Granovetter 1973 y
  // Waldinger & Schulz 2010 para conexión estratégica; Mayer/Salovey/Caruso
  // 2004 para inteligencia emocional; Senge 1990 y Meadows 2008 para visión
  // sistémica.
  if ((estado.skills.adaptabilidad ?? 0) >= 4) medallas.add("agilidad_mental");
  if ((estado.skills.disciplina ?? 0) >= 4) medallas.add("resiliencia_acero");
  if ((estado.skills.networking ?? 0) >= 4) medallas.add("conexion_estrategica");
  if ((estado.skills.comunicacionAsertiva ?? 0) >= 4) medallas.add("inteligencia_emocional");
  if ((estado.skills.analisisDatos ?? 0) >= 4) medallas.add("vision_sistemica");

  // Las 7 de acá abajo (3 ago 2026) cierran el hueco de que EMP, FREE y CRE
  // no tenían ninguna medalla atada a su propia skill clave
  // (SKILLS_CLAVE_POR_PERFIL más arriba) — investigación real por skill:
  // Bass & Avolio, teoría de liderazgo transformacional (liderazgo); Fisher
  // & Ury, "Getting to Yes"/Harvard Negotiation Project (negociacion);
  // Churchill, Ford, Hartley & Walker 1985, meta-análisis de 116 estudios
  // sobre desempeño en ventas (ventas); PMI Pulse of the Profession, mayor
  // tasa de éxito de proyectos con gestión estructurada (gestionProyectos);
  // datos de industria sobre optimización de embudos de conversión
  // (marketingDigital); Green & Brock 2000, teoría del "narrative
  // transportation" (narrativa); McClelland, necesidad de logro y
  // tolerancia calculada al riesgo en el comportamiento emprendedor
  // (toleranciaRiesgo).
  if ((estado.skills.liderazgo ?? 0) >= 4) medallas.add("lider_transformador");
  if ((estado.skills.negociacion ?? 0) >= 4) medallas.add("maestro_negociador");
  if ((estado.skills.ventas ?? 0) >= 4) medallas.add("cerrador_nato");
  if ((estado.skills.gestionProyectos ?? 0) >= 4) medallas.add("arquitecto_proyectos");
  if ((estado.skills.marketingDigital ?? 0) >= 4) medallas.add("maestro_embudo");
  if ((estado.skills.narrativa ?? 0) >= 4) medallas.add("narrador_nato");
  if ((estado.skills.toleranciaRiesgo ?? 0) >= 4) medallas.add("sangre_fria");

  // El Estratega: nunca tenía datos faltantes, solo le faltaba el cable —
  // contarCambiosRuta ya existe y ya se usa para la alerta
  // explorador_vocacional. Se exige un mínimo de decisiones para que "nunca
  // cambió" signifique algo (con 1 sola decisión, cero cambios es trivial).
  if (estado.decisiones.length >= 5 && contarCambiosRuta(estado.decisiones) === 0) {
    medallas.add("el_estratega");
  }

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
  skillsGanadas: Array<{ skill: string; delta: number }>;
  medallasEsteAnio: string[];
  highlights: ResumenHighlight[];
  oportunidadPerdida: string | null;
  mejorMovimiento: string | null;
}

interface ItemAnio {
  opcionTexto: string;
  ingresoAntes: number | null;
  ingresoDespues: number | null;
  skillsSubidas: Record<string, number>;
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
  medallaFn: (id: string) => { nombre: string; condicion: string } | undefined,
  pais: PaisId = PAIS_DEFECTO
): ResumenAnio {
  const highlights: ResumenHighlight[] = [];
  const skillsDeltaEsteAnio: Record<string, number> = {};

  for (const item of items) {
    if (item.medallaDesbloqueada) {
      const m = medallaFn(item.medallaDesbloqueada);
      if (m) highlights.push({ icono: "🏅", texto: `Desbloqueaste ${m.nombre} — ${m.condicion}` });
    }
    if (item.ingresoAntes !== null && item.ingresoDespues !== null) {
      // Mostramos el delta en pesos junto al texto (no solo un ícono de
      // subida/bajada) para que quede claro qué se ganó y qué se perdió
      // cuando una decisión reemplaza un ingreso por otro — ej. dejar un
      // trabajo por uno mejor debe leerse "pierdes X, ganas Y", no solo
      // un ✅ genérico que no explica el cambio real.
      const delta = item.ingresoDespues - item.ingresoAntes;
      if (delta > 0) {
        highlights.push({ icono: "✅", texto: `${item.opcionTexto} (+${formatoPesosCompacto(delta, pais)}/mes)` });
      } else if (delta < 0) {
        highlights.push({ icono: "⚠️", texto: `${item.opcionTexto} (-${formatoPesosCompacto(Math.abs(delta), pais)}/mes)` });
      }
    }
    for (const [skill, delta] of Object.entries(item.skillsSubidas ?? {})) {
      skillsDeltaEsteAnio[skill] = (skillsDeltaEsteAnio[skill] ?? 0) + delta;
    }
  }

  // skillsCount antes contaba TODAS las skills > 0 acumuladas en toda la
  // partida, sin importar el año — un stat "de este año" que en realidad
  // nunca cambiaba de significado. Ahora es lo que subió específicamente
  // este año, y se explicita cada una como highlight (no solo el número).
  const skillsGanadas = Object.entries(skillsDeltaEsteAnio)
    .filter(([, delta]) => delta > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([skill, delta]) => ({ skill, delta }));
  for (const { skill, delta } of skillsGanadas) {
    highlights.push({ icono: "🎯", texto: `${nombreSkillFn(skill)} +${delta}` });
  }
  const skillsCount = skillsGanadas.length;
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
  const actual = calcularSalarioProyectado(perfilDominante, skills, pais);
  let mejorNombre: string | null = null;
  let mejorProyeccion = actual;
  const nivelIngles = skills.ingles ?? 0;

  if (nivelIngles < 4) {
    const proyeccion = calcularSalarioProyectado(perfilDominante, { ...skills, ingles: 4 }, pais);
    if (proyeccion > mejorProyeccion) {
      mejorProyeccion = proyeccion;
      mejorNombre = "inglés a B2";
    }
  }

  const candidatas = new Set([...Object.keys(skills), ...SKILLS_CLAVE_POR_PERFIL[perfilDominante]]);
  for (const skillId of candidatas) {
    if (skillId === "ingles" || (skills[skillId] ?? 0) >= 5) continue;
    const proyeccion = calcularSalarioProyectado(perfilDominante, { ...skills, [skillId]: 5 }, pais);
    if (proyeccion > mejorProyeccion) {
      mejorProyeccion = proyeccion;
      mejorNombre = nombreSkillFn(skillId);
    }
  }

  const mejorMovimiento =
    mejorNombre && mejorProyeccion > actual
      ? `Sube tu ${mejorNombre} y tu salario proyectado pasa de ${formatoPesosCompacto(actual, pais)} a ${formatoPesosCompacto(mejorProyeccion, pais)} al mes.`
      : null;

  return {
    ingresoGanado: ingresoActual - ingresoInicioAnio,
    skillsCount,
    skillsGanadas,
    medallasEsteAnio,
    highlights,
    oportunidadPerdida,
    mejorMovimiento,
  };
}

export { calcularPerfil };
