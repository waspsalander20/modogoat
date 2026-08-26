import type { PerfilId } from "@/lib/types";

export type PaisId = "CO" | "PE" | "AR";

export const PAIS_DEFECTO: PaisId = "CO";

export function esPaisValido(pais: string | null | undefined): pais is PaisId {
  return pais === "CO" || pais === "PE" || pais === "AR";
}

export function normalizarPais(pais: string | null | undefined): PaisId {
  return esPaisValido(pais) ? pais : PAIS_DEFECTO;
}

interface ConfigPais {
  nombre: string;
  ciudadEjemplo: string;
  monedaCodigo: string; // ISO 4217, para Intl.NumberFormat
  monedaSimbolo: string; // para el formato compacto ($, S/)
  locale: string;
  // Salario mínimo legal — usado como hito narrativo en la regla 6c del
  // SYSTEM_PROMPT (arco de ingreso del perfil emprendedor). Opcional: si no
  // se tiene el dato verificado para un país, la regla cae a lenguaje
  // genérico en vez de inventar una cifra.
  salarioMinimo?: number;
  // Umbral de ingreso mensual absoluto para calificar al resultado GOAT (no
  // relativo al salario base del perfil, a diferencia de alto/medio/bajo) —
  // ver determinarResultado en lib/motor.ts. Cruzar este número solo
  // desbloquea la PREGUNTA de reflexión final; el GOAT en sí exige además
  // responder que sí es feliz con su camino (regla de producto, 1 ago 2026).
  umbralGoat: number;
  // Rangos narrados por la IA (regla 6 del SYSTEM_PROMPT) — frases ya
  // formateadas en la moneda local, listas para interpolar en el prompt.
  rangosIngreso: {
    informal: string;
    profesional: string;
    excepcional: string;
  };
}

// Colombia: fundamentado en la auditoría del motor (ver artifact) con
// fuentes reales (Tributi 2026, DANE vía El Colombiano/La República,
// Latin Human Capital/IIENSTITU 2026 — investigación del 1 ago 2026). Perú:
// salarios base anclados en promedios reales del INEI (ingreso promedio
// Lima Metropolitana y promedio de carreras profesionales, nov.2025-ene.2026)
// para EMP e INV. EMP2/FREE/CRE investigados independientemente 1 ago 2026
// (ver notas de cada uno más abajo) — ya no son un ratio heredado de
// Colombia.
//
// EMP2 (emprendedor) en Colombia se ancla al salario mínimo, no a "mando
// medio" — la mayoría de trabajadores por cuenta propia en Colombia ganan
// cerca o por debajo de un salario mínimo (DANE vía El Colombiano: 80% de
// cuenta propia informal gana ≤1 mínimo, 48% ≤ medio mínimo). El arco real
// (arranca cerca de $0, cruza el mínimo, luego crece sin techo) lo maneja
// la regla 6c del prompt — este número es el punto de referencia "ya
// estable", no el arranque literal.
//
// FREE (freelancer) en Colombia se ancla a la media salarial freelance real
// ($2.466.676/mes, redondeado) en vez del techo alto ($8M) — el multiplicador
// de skills/inglés lo lleva hacia ese techo a medida que el jugador
// desarrolla el perfil (ver MULTIPLICADOR_INGLES_POR_PERFIL en motor.ts,
// mismo hallazgo). Fuente: tiendanube.com / mividafreelance 2026,
// investigación 1 ago 2026.
//
// CRE (creador de contenido) en Colombia: a diferencia de EMP/INV, no existe
// una encuesta salarial mensual para este oficio — el mercado real paga por
// publicación/pieza, no por mes (nano influencer: $200.000-$4.000.000 COP
// por publicación, El Tiempo 2026). Se ancla a ~2-3 publicaciones/mes en el
// rango bajo de nano influencer (el punto de entrada real del perfil, ver
// regla 6e de aiMotor.ts: arranca por UGC/nano, no como influencer ya
// armado) en vez del techo alto ($8M) sin fuente. El ingreso real de este
// perfil es irregular por naturaleza (feast-or-famine: meses flacos entre
// acuerdos, picos por un patrocinio o lanzamiento) — eso lo maneja la regla
// 6e del prompt turno a turno, este número es solo el ancla de referencia
// "estable" para la proyección de lib/motor.ts, no un ingreso mensual literal
// parejo. Investigación 1 ago 2026.
//
// Perú, investigación independiente 1 ago 2026 (ya no ratio heredado de
// Colombia):
// - EMP2: corregido de S/5.600 (2x EMP, el mismo error de "mando medio" que
//   tenía Colombia antes de su propia corrección) a S/1.130, anclado al RMV
//   2026 — la informalidad en Perú (70,2-70,9% de la PEA, INEI vía Infobae)
//   es incluso más alta que en Colombia, y "la mayoría de la población en
//   condición de pobreza se inserta en el trabajo independiente" (INEI). El
//   arco real (arranca cerca de S/0, cruza el mínimo, luego sin techo) lo
//   maneja la regla 6c del prompt, igual que Colombia.
// - FREE: S/4.200 sin cambiar — freelancers peruanos cobran en promedio
//   $20 USD/hora (Gestión/freelancermap 2025-2026), que a ~60-80 horas
//   facturables/mes y tipo de cambio de agosto 2026 (~S/3,40) da un rango
//   de S/4.000-5.400/mes — S/4.200 cae justo ahí.
// - CRE: S/3.500 sin cambiar — "los creadores más pequeños pueden obtener
//   una renta mensual de entre US$1.000 y US$2.000" (Infobae Perú, marzo
//   2026), que al mismo tipo de cambio da S/3.400-6.800/mes — S/3.500 cae
//   en el piso de ese rango, coherente con anclar al punto de entrada real
//   (mismo criterio que CRE Colombia).
// Argentina, investigación independiente 26 ago 2026 (organizada primero en
// un artifact aparte, revisada y aprobada antes de este commit):
// - EMP: RIPTE (remuneración imponible promedio de trabajadores estables),
//   INDEC, junio 2026 — $1.915.878,76/mes, redondeado a $1.900.000.
// - INV: sin encuesta propia que separe "profesional especializado" de
//   "empleado promedio" en Argentina (a diferencia de Perú, que sí tuvo
//   fuente INEI independiente) — se aplica el mismo ratio ~1.5x EMP que usan
//   Colombia y Perú. Pendiente: reemplazar por una fuente propia si aparece.
// - EMP2: ancla al SMVM (mismo criterio que CO/PE — el arranque real de un
//   emprendedor tiende a $0 y sube hasta cruzar el mínimo, ver regla 6c en
//   aiMotor.ts). Nota: a diferencia de CO/PE, el ingreso real promedio de
//   informales en Argentina (EPH 2025, ~$500.000/mes vía Perfil) es MÁS ALTO
//   que el SMVM — se decidió mantener el SMVM por consistencia de criterio
//   entre países, no porque sea el número "más alto" disponible.
// - FREE: freelancers argentinos cobran US$25/hora en promedio (El Cronista,
//   vs. US$17/h regional) — a 60-80h facturables/mes × dólar oficial ~$1.535
//   (26 ago 2026) da un rango de $2.300.000-$3.070.000/mes; $2.500.000 cae
//   en el extremo bajo de ese rango. A diferencia de COP/PEN, este número
//   depende del tipo de cambio del día — ARS es mucho más volátil, revisar
//   con más frecuencia.
// - CRE: nano-influencer $30.000-$80.000 ARS por publicación — mismo
//   criterio que CO/PE (ancla a 2-3 publicaciones/mes en el rango bajo, el
//   punto de entrada real del perfil, no un influencer ya armado).
export const SALARIOS_BASE: Record<PaisId, Record<PerfilId, number>> = {
  CO: { EMP: 4_000_000, INV: 6_000_000, EMP2: 2_000_000, FREE: 2_500_000, CRE: 2_000_000 },
  PE: { EMP: 2_800, INV: 4_200, EMP2: 1_130, FREE: 4_200, CRE: 3_500 },
  AR: { EMP: 1_900_000, INV: 2_800_000, EMP2: 376_600, FREE: 2_500_000, CRE: 100_000 },
};

export const CONFIG_PAIS: Record<PaisId, ConfigPais> = {
  CO: {
    nombre: "Colombia",
    ciudadEjemplo: "Medellín",
    monedaCodigo: "COP",
    monedaSimbolo: "$",
    locale: "es-CO",
    // Salario mínimo 2026 + auxilio de transporte ($1.750.905 + $249.095).
    // Fuente: Fedesarrollo / Wise, investigación 1 ago 2026.
    //
    // rangosIngreso.excepcional ($60M+) — recalibrado con fuente 1 ago 2026:
    // el "Estudio de Remuneración C-level 2024" de PageGroup (vía La
    // República) reporta que ejecutivos C-level de empresas con facturación
    // ≥US$201M/mes ganan $75M COP/mes en adelante; gerentes generales de
    // empresas grandes superan $35M/mes, y sectores top (consumo masivo,
    // salud, petróleo) pagan $70-80M+/mes en compañías grandes. $60M+ queda
    // como un piso conservador y bien respaldado para un caso "excepcional",
    // no un techo inventado.
    salarioMinimo: 2_000_000,
    // Umbral GOAT: definido por el usuario (1 ago 2026), no derivado de una
    // encuesta — decisión de producto directa, coherente con la data real de
    // concentración de ingreso (DIAN: el top 1% de Colombia son 370.000
    // personas con patrimonio líquido ≥$649M; el 10% más rico concentra el
    // 43,5% del ingreso del país — "sobresalir" económicamente es, por
    // diseño, poco común). El GOAT exige además responder que sí a la
    // reflexión final de felicidad — no es solo este número.
    umbralGoat: 15_000_000,
    rangosIngreso: {
      informal: "$600.000-$1.200.000/mes",
      profesional: "$4M-15M/mes",
      excepcional: "hasta $60M+/mes",
    },
  },
  PE: {
    nombre: "Perú",
    ciudadEjemplo: "Huancayo",
    monedaCodigo: "PEN",
    monedaSimbolo: "S/",
    locale: "es-PE",
    // Salario mínimo (RMV) 2026: S/1.130. Fuente: Wise / Infobae /
    // SueldoJusto.pe, investigación 1 ago 2026 — antes este campo no estaba
    // cargado para Perú.
    salarioMinimo: 1_130,
    // Umbral GOAT recalibrado 2 ago 2026 — antes S/10.500, derivado por el
    // mismo ratio que Colombia (15M/4M = 3.75x el EMP de Perú) sin dato
    // propio. Ahora S/12.000: mismo criterio de diseño que Colombia (el
    // umbral GOAT coincide con el TECHO del rango "profesional consolidado"
    // de rangosIngreso — cruzar GOAT significa superar incluso el techo de
    // una carrera profesional consolidada normal, no solo tener buen
    // sueldo), aplicado sobre el rango de profesional consolidado de Perú
    // ya recalibrado con fuente real (Michael Page/Bumeran, ver abajo).
    // Contexto de apoyo (INEI, vía Infobae, verificado directo): el decil 10
    // (top 10%) de ingreso per cápita en Perú promedia solo S/3.805/mes a
    // nivel nacional y S/4.403 en Lima/Callao — un ingreso personal de
    // S/12.000/mes ya es varias veces eso, confirma que "sobresalir
    // económicamente" sigue siendo poco común, igual que en Colombia.
    umbralGoat: 12_000,
    // rangosIngreso recalibrado 2 ago 2026 con investigación propia (antes
    // era un estimado genérico, sin fuente específica de Perú):
    // - informal: verificado dos veces, INEI EPEN — ingreso promedio de
    //   jóvenes 14-24 años S/1.176 (oct.2023-sep.2024) y S/1.232 (1er
    //   trimestre 2026, verificado directo en la fuente vía Diario Correo).
    //   El rango existente (S/700-S/1.300) ya caía bien alrededor de este
    //   número real — no se cambió, solo se le encontró la cita.
    // - profesional: corregido de S/3.000-7.000 a S/3.500-12.000 — Michael
    //   Page (Guía Salarial 2026, 3.100+ profesionales) y Bumeran muestran
    //   que un profesional consolidado real llega a S/10.000-12.000/mes
    //   (ej. Sistemas nivel jefe/supervisor S/12.000, Salud/Medicina
    //   S/11.764 promedio pretendido) — el rango anterior se quedaba corto.
    // - excepcional: corregido de "hasta S/25.000+" a "hasta S/90.000+" —
    //   Estudio de Remuneraciones Hunters Group 2026 (3.200 profesionales,
    //   verificado directo vía peru-retail.com): gerentes generales de
    //   minería ganan S/90.000-120.000/mes, banca/finanzas S/85.000-110.000.
    //   Mismo error que tenía el umbral GOAT de Colombia antes de
    //   corregirlo — el número anterior no tenía fuente y se quedaba muy
    //   corto frente a casos excepcionales reales.
    rangosIngreso: {
      informal: "S/700-S/1.300/mes",
      profesional: "S/3.500-S/12.000/mes",
      excepcional: "hasta S/90.000+/mes",
    },
  },
  // Argentina, investigación 26 ago 2026 (organizada primero en un artifact
  // aparte, revisada y aprobada antes de este commit — ver también
  // SALARIOS_BASE.AR arriba).
  AR: {
    nombre: "Argentina",
    ciudadEjemplo: "Buenos Aires",
    monedaCodigo: "ARS",
    // Mismo símbolo "$" que Colombia — sin ambigüedad en el código porque
    // Intl.NumberFormat usa monedaCodigo, pero si alguna vez se muestra el
    // símbolo solo (sin país al lado) en la UI, hay que tenerlo presente.
    monedaSimbolo: "$",
    locale: "es-AR",
    // SMVM agosto 2026 (Rosario Finanzas / Infobae) — sube muy rápido
    // (16,8% entre nov.2025 y ago.2026), revisar con más frecuencia que
    // Colombia/Perú.
    salarioMinimo: 376_600,
    // Decisión de producto (no derivada) — coincide con el techo del rango
    // "profesional" de abajo, mismo criterio que Colombia/Perú.
    umbralGoat: 9_000_000,
    rangosIngreso: {
      // EPH 2025: ingreso promedio de trabajadores informales $500.000/mes
      // (vía Perfil) — más alto que el salario mínimo, a diferencia de
      // Colombia/Perú donde el ingreso informal real y el mínimo legal caían
      // cerca uno del otro.
      informal: "$350.000-$600.000/mes",
      // Piso = RIPTE jun.2026 ($1.915.878,76, INDEC). Techo = "sueldo que
      // necesitó un ejecutivo para vivir" ~$9,7M (iProfesional 2026),
      // redondeado a $9M para que coincida con el umbral GOAT. El punto
      // medio de este rango todavía no tiene una fuente propia — pendiente
      // de una encuesta salarial más granular si se quiere afinar.
      profesional: "$1.900.000-$9.000.000/mes",
      // Industria pesada promedia $25.569.600/mes; directores financieros de
      // empresas grandes en CABA hasta $19.049.930/mes (iProfesional 2026).
      excepcional: "hasta $25.000.000+/mes",
    },
  },
};
