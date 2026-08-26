// Smoke test de la lógica pura del juego — sin framework, un script lineal
// con asserts. Corre con: npx tsx smoke-test.ts
//
// Cubre lib/motor.ts, lib/perfilamiento.ts y lib/deteccionTroll.ts: todas
// funciones deterministas (nada de IA acá, eso no se puede testear con
// asserts exactos). El objetivo es atrapar regresiones silenciosas en el
// cálculo de ingreso, resultado, medallas y resumen de año — justo lo que
// un cambio futuro podría romper sin que nadie lo note hasta que un
// usuario se queje.

import assert from "node:assert/strict";
import {
  calcularGastos,
  aplicarSkills,
  sumarPuntos,
  calcularSalarioProyectado,
  determinarResultado,
  elegirMedallasGanadas,
  calcularResumenAnio,
} from "./lib/motor";
import { calcularPerfil, generarAlertas } from "./lib/perfilamiento";
import { calcularBigFive } from "./lib/bigFive";
import { detectarTroll } from "./lib/deteccionTroll";
import { clasificarAreaLibre } from "./lib/data/carrerasDemanda";
import {
  calcularPatronesComparativos,
  calcularAreasDeMejora,
  encontrarMejoresDecisiones,
  type PartidaParaComparar,
} from "./lib/informeComparativo";
import { partidasEsperadas, DEFAULT_PARTIDAS_POR_PAQUETE } from "./lib/data/paquete";
import type { EstadoPartida, Puntos, DecisionTomada } from "./lib/types";

let pasadas = 0;
function caso(nombre: string, fn: () => void) {
  try {
    fn();
    pasadas++;
    console.log(`✓ ${nombre}`);
  } catch (error) {
    console.error(`✗ ${nombre}`);
    console.error(error);
    process.exitCode = 1;
  }
}

const PUNTOS_VACIOS: Puntos = { EMP: 0, INV: 0, EMP2: 0, FREE: 0, CRE: 0 };

function estadoBase(overrides: Partial<EstadoPartida> = {}): EstadoPartida {
  return {
    id: "test",
    nombre: "Test",
    edadInicio: 17,
    edadActual: 20,
    ingreso: 0,
    ahorros: 0,
    puntos: { ...PUNTOS_VACIOS },
    skills: {},
    mentorActivo: null,
    medallasGanadas: [],
    decisiones: [],
    eventos: [],
    aniosEstancado: 0,
    estado: "jugando",
    ...overrides,
  };
}

// --- calcularGastos ---
caso("calcularGastos: sin gastos hasta los 18", () => {
  assert.equal(calcularGastos(17), 0);
  assert.equal(calcularGastos(18), 0);
});
caso("calcularGastos: sube por tramos de edad", () => {
  assert.equal(calcularGastos(19), 0.25);
  assert.equal(calcularGastos(22), 0.25);
  assert.equal(calcularGastos(23), 0.45);
  assert.equal(calcularGastos(26), 0.45);
  assert.equal(calcularGastos(27), 0.65);
  assert.equal(calcularGastos(30), 0.65);
});
caso("calcularGastos: Perú corre el último tramo un año más tarde (independencia a los 29, no 27)", () => {
  assert.equal(calcularGastos(27, "PE"), 0.45, "a los 27 en Perú todavía está en transición, no en independencia plena");
  assert.equal(calcularGastos(28, "PE"), 0.45);
  assert.equal(calcularGastos(29, "PE"), 0.65);
  assert.equal(calcularGastos(27, "CO"), 0.65, "Colombia no cambia — el tramo sigue en 27+");
});
caso("calcularGastos: Argentina usa el mismo tramo que Colombia (27+), no el de Perú", () => {
  assert.equal(calcularGastos(27, "AR"), 0.65, "Buenos Aires (ciudadEjemplo) se independiza en promedio a los 27, igual que Colombia");
  assert.equal(calcularGastos(26, "AR"), 0.45);
});

// --- aplicarSkills ---
caso("aplicarSkills: suma y clampea entre 0 y 5", () => {
  const resultado = aplicarSkills({ ingles: 3 }, { ingles: 10, disciplina: -2 });
  assert.equal(resultado.ingles, 5);
  assert.equal(resultado.disciplina, 0);
});
caso("aplicarSkills: no muta el objeto original", () => {
  const original = { ingles: 3 };
  aplicarSkills(original, { ingles: 1 });
  assert.equal(original.ingles, 3);
});

// --- sumarPuntos ---
caso("sumarPuntos: suma por perfil, ignora perfiles ausentes en el delta", () => {
  const resultado = sumarPuntos(
    { EMP: 10, INV: 5, EMP2: 0, FREE: 0, CRE: 0 },
    { EMP: 5, INV: 0, EMP2: 0, FREE: 0, CRE: 0 }
  );
  assert.equal(resultado.EMP, 15);
  assert.equal(resultado.INV, 5);
});
caso("sumarPuntos: no revienta si la IA devuelve puntos incompletos o undefined", () => {
  // Visto en vivo: la IA a veces devuelve puntos_perfil incompleto pese a
  // strict:true en el schema — esto no puede tumbar la partida.
  const actuales = { EMP: 10, INV: 5, EMP2: 0, FREE: 0, CRE: 0 };
  const incompleto = sumarPuntos(actuales, { EMP: 3 } as Puntos);
  assert.equal(incompleto.EMP, 13);
  assert.equal(incompleto.INV, 5, "los perfiles ausentes en nuevos no deben tocar los actuales");

  const undefinedTotal = sumarPuntos(actuales, undefined);
  assert.equal(undefinedTotal.EMP, 10, "undefined completo en nuevos no debe romper ni sumar nada");
});

// --- calcularSalarioProyectado ---
caso("calcularSalarioProyectado: sin skills devuelve el salario base del perfil", () => {
  assert.equal(calcularSalarioProyectado("EMP2", {}), 2_000_000);
});
caso("calcularSalarioProyectado: 3+ skills en nivel 5 multiplica x1.6 (premium compuesto, no el doble)", () => {
  const skills = { a: 5, b: 5, c: 5 };
  assert.equal(calcularSalarioProyectado("EMP", skills), Math.round(4_000_000 * 1.6));
});
caso("calcularSalarioProyectado: inglés B2+ (nivel 4) multiplica x1.5", () => {
  assert.equal(calcularSalarioProyectado("INV", { ingles: 4 }), Math.round(6_000_000 * 1.5));
});
caso("calcularSalarioProyectado: multiplicadores de skills e inglés se combinan", () => {
  const skills = { a: 5, b: 5, c: 5, ingles: 4 };
  assert.equal(calcularSalarioProyectado("EMP", skills), Math.round(4_000_000 * 1.6 * 1.5));
});
caso("calcularSalarioProyectado: sin país usa Colombia por defecto, y Perú da otra escala", () => {
  assert.equal(calcularSalarioProyectado("EMP2", {}), calcularSalarioProyectado("EMP2", {}, "CO"));
  assert.equal(calcularSalarioProyectado("EMP2", {}, "PE"), 1_130);
  assert.notEqual(calcularSalarioProyectado("EMP2", {}, "PE"), calcularSalarioProyectado("EMP2", {}, "CO"));
});
caso("calcularSalarioProyectado: FREE tiene su propio multiplicador de inglés (salto de mercado, no prima de bilingüismo)", () => {
  // FREE nivel 4 de inglés: base $2.500.000 × 2.2 (salto de mercado internacional)
  assert.equal(calcularSalarioProyectado("FREE", { ingles: 4 }), Math.round(2_500_000 * 2.2));
  // INV con el mismo nivel de inglés sigue con la prima genérica de bilingüismo (×1.5)
  assert.equal(calcularSalarioProyectado("INV", { ingles: 4 }), Math.round(6_000_000 * 1.5));
  // El multiplicador de FREE debe ser mayor que el genérico al mismo nivel
  const multiplicadorFree = calcularSalarioProyectado("FREE", { ingles: 4 }) / 2_500_000;
  const multiplicadorGenerico = calcularSalarioProyectado("INV", { ingles: 4 }) / 6_000_000;
  assert.ok(multiplicadorFree > multiplicadorGenerico, "el salto de mercado de FREE debe superar la prima genérica de bilingüismo");
});
caso("calcularSalarioProyectado: CRE también tiene su propio multiplicador de inglés, menor que el de FREE", () => {
  // CRE nivel 4 de inglés: base $2.000.000 × 2.0 (acceso a audiencias/CPM de mercados de habla inglesa)
  assert.equal(calcularSalarioProyectado("CRE", { ingles: 4 }), Math.round(2_000_000 * 2.0));
  // Por debajo del ratio de CPM verificado (~2.6x) a propósito: el 90% del ingreso rentable de
  // un creador viene de productos propios, no de CPM publicitario (regla 6e) — no es 100%
  // tarifa/cliente como FREE, así que su multiplicador queda por debajo del de FREE.
  const multiplicadorCre = calcularSalarioProyectado("CRE", { ingles: 4 }) / 2_000_000;
  const multiplicadorFree = calcularSalarioProyectado("FREE", { ingles: 4 }) / 2_500_000;
  assert.ok(multiplicadorCre < multiplicadorFree, "CRE no debe superar el salto de mercado de FREE");
  assert.ok(multiplicadorCre > 1.5, "pero sí debe superar la prima genérica de bilingüismo");
});
caso("calcularSalarioProyectado: el multiplicador de inglés ahora se resuelve por país, no solo por perfil", () => {
  // Investigación 2 ago 2026 (British Council Perú, verificado directo):
  // el multiplicador converge con Colombia, pero el lookup ahora pasa por
  // MULTIPLICADOR_INGLES_POR_PAIS_Y_PERFIL[pais][perfil] — este test falla
  // si alguien borra la entrada de "PE" sin querer, aunque el valor de hoy
  // sea igual al de "CO".
  const salarioPE = calcularSalarioProyectado("FREE", { ingles: 4 }, "PE");
  assert.equal(salarioPE, Math.round(4_200 * 2.2), "salario base FREE Perú (S/4.200) × multiplicador nivel4 (2.2)");
});
caso("calcularSalarioProyectado: Argentina tiene su propia escala de salarios base", () => {
  assert.equal(calcularSalarioProyectado("EMP2", {}, "AR"), 376_600, "EMP2 Argentina ancla al SMVM ago.2026");
  assert.notEqual(calcularSalarioProyectado("EMP2", {}, "AR"), calcularSalarioProyectado("EMP2", {}, "CO"));
  const salarioAR = calcularSalarioProyectado("FREE", { ingles: 4 }, "AR");
  assert.equal(salarioAR, Math.round(2_500_000 * 2.2), "salario base FREE Argentina ($2.500.000) × multiplicador nivel4 (2.2)");
});

// --- determinarResultado ---
caso("determinarResultado: troll siempre gana sin importar el ingreso", () => {
  const estado = estadoBase({ ingreso: 999_999_999 });
  assert.equal(determinarResultado(estado, "EMP", true), "troll");
});
caso("determinarResultado: tiers de ingreso vs salario base del perfil", () => {
  const salarioBase = 4_000_000; // EMP
  assert.equal(determinarResultado(estadoBase({ ingreso: 0 }), "EMP", false), "bajo");
  assert.equal(determinarResultado(estadoBase({ ingreso: salarioBase * 0.5 }), "EMP", false), "medio");
  assert.equal(determinarResultado(estadoBase({ ingreso: salarioBase }), "EMP", false), "alto");
});
caso("determinarResultado: GOAT exige cruzar el umbral económico absoluto Y responder feliz a la reflexión final", () => {
  const ingresoGoat = estadoBase({ ingreso: 15_000_000 });
  // Cruza el umbral económico pero no respondió (o respondió que no) —
  // se queda en "alto", el dinero solo no basta.
  assert.equal(determinarResultado(ingresoGoat, "EMP", false, "CO", null), "alto");
  assert.equal(determinarResultado(ingresoGoat, "EMP", false, "CO", false), "alto");
  // Cruza el umbral Y respondió que sí es feliz con su camino -> GOAT real.
  assert.equal(determinarResultado(ingresoGoat, "EMP", false, "CO", true), "goat");

  // Responder feliz no alcanza si nunca cruzó el umbral económico.
  const ingresoBajo = estadoBase({ ingreso: 4_000_000 });
  assert.equal(determinarResultado(ingresoBajo, "EMP", false, "CO", true), "alto");
});

// --- elegirMedallasGanadas ---
caso("elegirMedallasGanadas: primeras medallas por hitos básicos", () => {
  const estado = estadoBase({
    ingreso: 100_000,
    decisiones: [{ anio: 17, decisionId: "d1", opcionElegida: "A", tiempoRespuesta: 1, ingresoAntes: 0, ingresoDespues: 100_000, skillsSubidas: {}, puntosSumados: PUNTOS_VACIOS }],
  });
  const medallas = elegirMedallasGanadas(estado, "medio");
  assert.ok(medallas.includes("la_chispa"), "la_chispa por primera decisión");
  assert.ok(medallas.includes("primer_peso"), "primer_peso por ingreso > 0");
  assert.ok(!medallas.includes("goat_mode"), "no debe dar goat_mode si el resultado no es goat");
});
caso("elegirMedallasGanadas: bilingüe, red de oro y goat mode", () => {
  const estado = estadoBase({
    skills: { ingles: 3 },
    mentorActivo: "don_jairo",
  });
  const medallas = elegirMedallasGanadas(estado, "goat");
  assert.ok(medallas.includes("bilingue"));
  assert.ok(medallas.includes("red_de_oro"));
  assert.ok(medallas.includes("goat_mode"));
});
caso("elegirMedallasGanadas: las 5 medallas de skill respaldadas por investigación (agilidad mental, resiliencia de acero, etc.)", () => {
  const estado = estadoBase({
    skills: { adaptabilidad: 4, disciplina: 4, networking: 4, comunicacionAsertiva: 4, analisisDatos: 4 },
  });
  const medallas = elegirMedallasGanadas(estado, "alto");
  assert.ok(medallas.includes("agilidad_mental"));
  assert.ok(medallas.includes("resiliencia_acero"));
  assert.ok(medallas.includes("conexion_estrategica"));
  assert.ok(medallas.includes("inteligencia_emocional"));
  assert.ok(medallas.includes("vision_sistemica"));
});
caso("elegirMedallasGanadas: las 7 medallas nuevas que cierran el hueco de EMP/FREE/CRE (liderazgo, negociación, ventas, etc.)", () => {
  const estado = estadoBase({
    skills: {
      liderazgo: 4,
      negociacion: 4,
      ventas: 4,
      gestionProyectos: 4,
      marketingDigital: 4,
      narrativa: 4,
      toleranciaRiesgo: 4,
    },
  });
  const medallas = elegirMedallasGanadas(estado, "alto");
  assert.ok(medallas.includes("lider_transformador"));
  assert.ok(medallas.includes("maestro_negociador"));
  assert.ok(medallas.includes("cerrador_nato"));
  assert.ok(medallas.includes("arquitecto_proyectos"));
  assert.ok(medallas.includes("maestro_embudo"));
  assert.ok(medallas.includes("narrador_nato"));
  assert.ok(medallas.includes("sangre_fria"));

  const sinSkills = elegirMedallasGanadas(estadoBase({ skills: { liderazgo: 3 } }), "alto");
  assert.ok(!sinSkills.includes("lider_transformador"), "nivel 3 no basta, exige nivel 4");
});
caso("elegirMedallasGanadas: El Estratega exige nunca cambiar de opción, con suficientes decisiones para que cuente", () => {
  const opcionFija = (anio: number) => ({
    anio,
    decisionId: `d${anio}`,
    opcionElegida: "B",
    tiempoRespuesta: 5,
    ingresoAntes: 0,
    ingresoDespues: 0,
    skillsSubidas: {},
    puntosSumados: PUNTOS_VACIOS,
  });
  const pocasDecisiones = estadoBase({ decisiones: [opcionFija(17), opcionFija(18)] });
  assert.ok(!elegirMedallasGanadas(pocasDecisiones, "medio").includes("el_estratega"), "con menos de 5 decisiones no debe darla, aunque nunca haya cambiado");

  const muchasSinCambiar = estadoBase({
    decisiones: [opcionFija(17), opcionFija(18), opcionFija(19), opcionFija(20), opcionFija(21)],
  });
  assert.ok(elegirMedallasGanadas(muchasSinCambiar, "medio").includes("el_estratega"));

  const conCambio = estadoBase({
    decisiones: [opcionFija(17), opcionFija(18), { ...opcionFija(19), opcionElegida: "C" }, opcionFija(20), opcionFija(21)],
  });
  assert.ok(!elegirMedallasGanadas(conCambio, "medio").includes("el_estratega"), "si cambió de opción alguna vez, no debe dársela");
});
caso("elegirMedallasGanadas: preserva medallas ya ganadas antes", () => {
  const estado = estadoBase({ medallasGanadas: ["el_estratega"] });
  const medallas = elegirMedallasGanadas(estado, "bajo");
  assert.ok(medallas.includes("el_estratega"));
});
caso("elegirMedallasGanadas: quita goat_mode si el resultado real no es goat", () => {
  // La IA puede otorgar goat_mode en cualquier consecuencia intermedia por
  // su cuenta — si el resultado final no es realmente GOAT, no se queda.
  const estado = estadoBase({ medallasGanadas: ["goat_mode", "la_chispa"] });
  const medallas = elegirMedallasGanadas(estado, "troll");
  assert.ok(!medallas.includes("goat_mode"), "goat_mode no debería sobrevivir a un resultado troll");
  assert.ok(medallas.includes("la_chispa"), "las demás medallas previas sí se preservan");
});

// --- calcularResumenAnio ---
caso("calcularResumenAnio: calcula ingreso ganado e ignora items sin ingreso", () => {
  const resumen = calcularResumenAnio(
    [{ opcionTexto: "opción A", ingresoAntes: null, ingresoDespues: null, skillsSubidas: {}, medallaDesbloqueada: null, costoOportunidad: null }],
    100_000,
    250_000,
    {},
    "EMP",
    (id) => id,
    () => undefined as { nombre: string; condicion: string } | undefined
  );
  assert.equal(resumen.ingresoGanado, 150_000);
});
caso("calcularResumenAnio: highlights de ingreso al alza/baja y medallas", () => {
  const resumen = calcularResumenAnio(
    [
      { opcionTexto: "subió", ingresoAntes: 100, ingresoDespues: 200, skillsSubidas: {}, medallaDesbloqueada: null, costoOportunidad: null },
      { opcionTexto: "bajó", ingresoAntes: 200, ingresoDespues: 150, skillsSubidas: {}, medallaDesbloqueada: null, costoOportunidad: null },
      { opcionTexto: "medalla", ingresoAntes: null, ingresoDespues: null, skillsSubidas: {}, medallaDesbloqueada: "primer_peso", costoOportunidad: null },
    ],
    100,
    150,
    {},
    "EMP",
    (id) => id,
    (id) => (id === "primer_peso" ? { nombre: "Primer Ingreso", condicion: "Primer ingreso generado en el juego" } : undefined)
  );
  assert.equal(resumen.highlights.filter((h) => h.icono === "✅").length, 1);
  assert.equal(resumen.highlights.filter((h) => h.icono === "⚠️").length, 1);
  assert.ok(resumen.highlights.some((h) => h.texto.includes("Primer Ingreso")));
});
caso("calcularResumenAnio: costo de oportunidad viene grounded del primer item que lo trae, nunca inventado", () => {
  const conCosto = calcularResumenAnio(
    [{ opcionTexto: "x", ingresoAntes: null, ingresoDespues: null, skillsSubidas: {}, medallaDesbloqueada: null, costoOportunidad: "perdiste la confianza del cliente" }],
    0,
    0,
    {},
    "EMP",
    (id) => id,
    () => undefined as { nombre: string; condicion: string } | undefined
  );
  assert.equal(conCosto.oportunidadPerdida, "perdiste la confianza del cliente");

  const sinCosto = calcularResumenAnio(
    [{ opcionTexto: "x", ingresoAntes: null, ingresoDespues: null, skillsSubidas: {}, medallaDesbloqueada: null, costoOportunidad: null }],
    0,
    0,
    {},
    "EMP",
    (id) => id,
    () => undefined as { nombre: string; condicion: string } | undefined
  );
  assert.equal(sinCosto.oportunidadPerdida, null);
});
caso("calcularResumenAnio: mejorMovimiento recomienda la skill clave del perfil cuando gana sobre inglés", () => {
  // Para INV, subir "analisisDatos" (primera skill clave del perfil, ver
  // SKILLS_CLAVE_POR_PERFIL) de 0 a 5 da x1.2 (nivel skills) * x1.5 (clave)
  // = x1.8, más que subir solo inglés a B2 (x1.5).
  const resumen = calcularResumenAnio([], 0, 0, {}, "INV", (id) => id, () => undefined);
  assert.ok(
    resumen.mejorMovimiento?.includes("analisisDatos"),
    `esperaba mención a la skill clave del perfil (analisisDatos), dio: ${resumen.mejorMovimiento}`
  );
});
caso("calcularResumenAnio: mejorMovimiento recomienda inglés cuando esa sí es la mejora más grande", () => {
  // Con las skills clave del perfil ya casi topadas (nivel 4, multiplicador
  // clave ya en su tope de x1.5), subir inglés de 0 a B2 (x1.5) pesa más
  // que subir cualquiera de esas skills de 4 a 5 (se queda en la misma
  // franja de multiplicador clave, solo suma x1.2 por nivel de skills).
  const resumen = calcularResumenAnio(
    [],
    0,
    0,
    { analisisDatos: 4, narrativa: 4 },
    "INV",
    (id) => id,
    () => undefined as { nombre: string; condicion: string } | undefined
  );
  assert.ok(resumen.mejorMovimiento?.includes("inglés"), `esperaba mención a inglés, dio: ${resumen.mejorMovimiento}`);
});

caso("calcularResumenAnio: skillsGanadas suma deltas de decisiones y eventos del año, ignora las que no subieron", () => {
  const resumen = calcularResumenAnio(
    [
      { opcionTexto: "curso", ingresoAntes: null, ingresoDespues: null, skillsSubidas: { diseno: 2, disciplina: 1 }, medallaDesbloqueada: null, costoOportunidad: null },
      { opcionTexto: "imprevisto", ingresoAntes: null, ingresoDespues: null, skillsSubidas: { diseno: 1, saludMental: -1 }, medallaDesbloqueada: null, costoOportunidad: null },
    ],
    0,
    0,
    { diseno: 3, disciplina: 1, saludMental: 2 },
    "CRE",
    (id) => id,
    () => undefined
  );
  assert.deepEqual(resumen.skillsGanadas, [
    { skill: "diseno", delta: 3 },
    { skill: "disciplina", delta: 1 },
  ]);
  assert.equal(resumen.skillsCount, 2, "solo cuenta skills que de verdad subieron este año, no el acumulado total");
  assert.ok(resumen.highlights.some((h) => h.icono === "🎯" && h.texto === "diseno +3"));
  assert.ok(!resumen.highlights.some((h) => h.texto.includes("saludMental")), "saludMental bajó, no debe listarse como ganancia");
});

// --- calcularPerfil ---
caso("calcularPerfil: dominante es el de más puntos", () => {
  const perfil = calcularPerfil({ EMP: 50, INV: 10, EMP2: 5, FREE: 0, CRE: 0 });
  assert.equal(perfil.dominante, "EMP");
});
caso("calcularPerfil: mixto y secundario según la diferencia de puntaje", () => {
  const cerca = calcularPerfil({ EMP: 50, INV: 45, EMP2: 0, FREE: 0, CRE: 0 });
  assert.equal(cerca.esMixto, true);
  assert.equal(cerca.secundario, "INV");

  const lejos = calcularPerfil({ EMP: 50, INV: 5, EMP2: 0, FREE: 0, CRE: 0 });
  assert.equal(lejos.esMixto, false);
  assert.equal(lejos.secundario, null);
});

// --- generarAlertas ---
const opcionSinSkills = (anio: number) => ({
  anio,
  decisionId: `d${anio}`,
  opcionElegida: "A",
  tiempoRespuesta: 5,
  ingresoAntes: 0,
  ingresoDespues: 0,
  skillsSubidas: {},
  puntosSumados: PUNTOS_VACIOS,
});

caso("generarAlertas: perfil_riesgo ya no depende de patronTroll, solo de años estancado", () => {
  const estancado = estadoBase({ aniosEstancado: 3 });
  assert.ok(generarAlertas(estancado, { trabaja: "si", contexto: "vive_solo" }, "EMP").includes("perfil_riesgo"));

  const noEstancado = estadoBase({ aniosEstancado: 2 });
  assert.ok(!generarAlertas(noEstancado, { trabaja: "si", contexto: "vive_solo" }, "EMP").includes("perfil_riesgo"));
});
caso("generarAlertas: perfil_beca (fase 2) exige contexto real + ingreso bajo + un umbral SUFICIENTE de disciplina/no-estancamiento, no alto", () => {
  const conBeca = estadoBase({ ingreso: 500_000, skills: { disciplina: 2 }, aniosEstancado: 1 });
  assert.ok(generarAlertas(conBeca, { trabaja: "no", contexto: "solo_mama" }, "EMP", "CO").includes("perfil_beca"));

  const sinBeca = estadoBase({ ingreso: 500_000, skills: { disciplina: 2 }, aniosEstancado: 1 });
  assert.ok(!generarAlertas(sinBeca, { trabaja: "si", contexto: "solo_mama" }, "EMP", "CO").includes("perfil_beca"));

  const ingresoAlto = estadoBase({ ingreso: 3_000_000, skills: { disciplina: 2 }, aniosEstancado: 1 });
  assert.ok(
    !generarAlertas(ingresoAlto, { trabaja: "no", contexto: "solo_mama" }, "EMP", "CO").includes("perfil_beca"),
    "el contexto real ya no basta solo: un jugador con ingreso alto en el juego no debería marcarse como candidato a beca"
  );

  const sinDisciplinaMinima = estadoBase({ ingreso: 500_000, skills: {}, aniosEstancado: 1 });
  assert.ok(
    !generarAlertas(sinDisciplinaMinima, { trabaja: "no", contexto: "solo_mama" }, "EMP", "CO").includes("perfil_beca"),
    "sin disciplina mínima (nivel 2) no cuenta, pero el umbral es bajo a propósito, no exige nivel alto"
  );

  const estancado = estadoBase({ ingreso: 500_000, skills: { disciplina: 2 }, aniosEstancado: 3 });
  assert.ok(
    !generarAlertas(estancado, { trabaja: "no", contexto: "solo_mama" }, "EMP", "CO").includes("perfil_beca"),
    "3+ años estancado tampoco cuenta como buena probabilidad de aprovechar la beca"
  );
});
caso("generarAlertas: barrera_economica exige no invertir en skills Y un ingreso genuinamente bajo (mecanismo de escasez)", () => {
  const decisionesSinInvertir = [opcionSinSkills(17), opcionSinSkills(18), opcionSinSkills(19)];

  const ingresoBajo = estadoBase({ decisiones: decisionesSinInvertir, ingreso: 1_000_000 });
  assert.ok(generarAlertas(ingresoBajo, { trabaja: "si", contexto: "vive_solo" }, "EMP", "CO").includes("barrera_economica"));

  const ingresoOk = estadoBase({ decisiones: decisionesSinInvertir, ingreso: 3_000_000 });
  assert.ok(
    !generarAlertas(ingresoOk, { trabaja: "si", contexto: "vive_solo" }, "EMP", "CO").includes("barrera_economica"),
    "no invertir en skills ya no basta por sí solo, sin un ingreso genuinamente bajo de por medio"
  );
});
caso("generarAlertas: desarrollo_autodirigido (CDSE) exige mentor activo, 3+ skills distintas invertidas y no estar estancado", () => {
  const decisionesConSkills: DecisionTomada[] = [
    { ...opcionSinSkills(17), skillsSubidas: { disciplina: 1 } },
    { ...opcionSinSkills(18), skillsSubidas: { networking: 1 } },
    { ...opcionSinSkills(19), skillsSubidas: { ventas: 1 } },
  ];

  const conTodo = estadoBase({ decisiones: decisionesConSkills, mentorActivo: "andrea", aniosEstancado: 0 });
  assert.ok(generarAlertas(conTodo, { trabaja: "si", contexto: "vive_solo" }, "EMP").includes("desarrollo_autodirigido"));

  const sinMentor = estadoBase({ decisiones: decisionesConSkills, mentorActivo: null, aniosEstancado: 0 });
  assert.ok(!generarAlertas(sinMentor, { trabaja: "si", contexto: "vive_solo" }, "EMP").includes("desarrollo_autodirigido"));

  const estancado = estadoBase({ decisiones: decisionesConSkills, mentorActivo: "andrea", aniosEstancado: 3 });
  assert.ok(!generarAlertas(estancado, { trabaja: "si", contexto: "vive_solo" }, "EMP").includes("desarrollo_autodirigido"));
});
caso("generarAlertas: alta_empleabilidad usa liderazgo (skill clave de EMP), ya no disciplina", () => {
  const conLiderazgo = estadoBase({
    puntos: { ...PUNTOS_VACIOS, EMP: 45 },
    skills: { liderazgo: 3 },
  });
  assert.ok(generarAlertas(conLiderazgo, { trabaja: "si", contexto: "vive_solo" }, "EMP").includes("alta_empleabilidad"));

  const soloDisciplina = estadoBase({
    puntos: { ...PUNTOS_VACIOS, EMP: 45 },
    skills: { disciplina: 5 },
  });
  assert.ok(
    !generarAlertas(soloDisciplina, { trabaja: "si", contexto: "vive_solo" }, "EMP").includes("alta_empleabilidad"),
    "disciplina ya no cuenta para esta alerta, aunque esté al máximo"
  );
});
caso("generarAlertas: freelancer_solido, creador_solido e investigador_solido (mismo patrón que alta_empleabilidad/emprendedor_solido)", () => {
  const freelancerSolido = estadoBase({
    puntos: { ...PUNTOS_VACIOS, FREE: 45 },
    skills: { ventas: 3 },
  });
  assert.ok(generarAlertas(freelancerSolido, { trabaja: "si", contexto: "vive_solo" }, "FREE").includes("freelancer_solido"));

  const creadorSolido = estadoBase({
    puntos: { ...PUNTOS_VACIOS, CRE: 45 },
    skills: { marketingDigital: 3 },
  });
  assert.ok(generarAlertas(creadorSolido, { trabaja: "si", contexto: "vive_solo" }, "CRE").includes("creador_solido"));

  const investigadorSolido = estadoBase({
    puntos: { ...PUNTOS_VACIOS, INV: 45 },
    skills: { analisisDatos: 3 },
  });
  assert.ok(generarAlertas(investigadorSolido, { trabaja: "si", contexto: "vive_solo" }, "INV").includes("investigador_solido"));

  const sinSkillSuficiente = estadoBase({
    puntos: { ...PUNTOS_VACIOS, FREE: 45 },
    skills: { ventas: 2 },
  });
  assert.ok(
    !generarAlertas(sinSkillSuficiente, { trabaja: "si", contexto: "vive_solo" }, "FREE").includes("freelancer_solido"),
    "no basta con los puntos de perfil, también exige la skill clave en nivel 3+"
  );
});
caso("generarAlertas: barrera_evasion (GDMS) se marca cuando la IA la detecta, no por un umbral de código", () => {
  const decisionesConEvasion: DecisionTomada[] = [
    { ...opcionSinSkills(17), alertaGenerada: "barrera_evasion" },
    { ...opcionSinSkills(18) },
  ];
  const conEvasion = estadoBase({ decisiones: decisionesConEvasion });
  assert.ok(generarAlertas(conEvasion, { trabaja: "si", contexto: "vive_solo" }, "EMP").includes("barrera_evasion"));

  const sinEvasion = estadoBase({ decisiones: [opcionSinSkills(17), opcionSinSkills(18)] });
  assert.ok(!generarAlertas(sinEvasion, { trabaja: "si", contexto: "vive_solo" }, "EMP").includes("barrera_evasion"));
});

// --- calcularBigFive ---
caso("calcularBigFive: rasgos suben con las skills relacionadas", () => {
  const alto = calcularBigFive(
    estadoBase({
      skills: { networking: 5, liderazgo: 5, presentaciones: 5, ventas: 5, trabajoEquipo: 5 },
      mentorActivo: "andrea",
    })
  );
  assert.equal(alto.extraversion, 100);

  const bajo = calcularBigFive(estadoBase({ skills: {} }));
  assert.equal(bajo.extraversion, 0);
});
caso("calcularBigFive: estancamiento y cambios de ruta bajan responsabilidad y estabilidad emocional", () => {
  const estable = calcularBigFive(estadoBase({ skills: { disciplina: 5, gestionProyectos: 5, finanzasPersonales: 5, saludMental: 5 } }));
  const inestable = calcularBigFive(
    estadoBase({
      skills: { disciplina: 5, gestionProyectos: 5, finanzasPersonales: 5, saludMental: 5 },
      aniosEstancado: 4,
    })
  );
  assert.ok(inestable.responsabilidad < estable.responsabilidad);
  assert.ok(inestable.estabilidadEmocional < estable.estabilidadEmocional);
});
caso("calcularBigFive: todos los rasgos quedan acotados entre 0 y 100", () => {
  const extremo = calcularBigFive(
    estadoBase({
      skills: { disciplina: 5, gestionProyectos: 5, finanzasPersonales: 5, saludMental: 5, networking: 5, liderazgo: 5 },
      aniosEstancado: 10,
      puntos: { EMP: 0, INV: 0, EMP2: 0, FREE: 0, CRE: 50 },
    })
  );
  for (const valor of Object.values(extremo)) {
    assert.ok(valor >= 0 && valor <= 100, `rasgo fuera de rango: ${valor}`);
  }
});

// --- detectarTroll ---
caso("detectarTroll: respuestas muy rápidas se marcan como troll", () => {
  const resultado = detectarTroll(
    { p1: "A", p2: "B", p3: "A", p4: "C" },
    { p1: 1, p2: 1, p3: 1, p4: 1 }
  );
  assert.equal(resultado.esTroll, true);
});
caso("detectarTroll: misma opción repetida 6+ veces de 8 se marca como troll", () => {
  const resultado = detectarTroll(
    { p1: "A", p2: "A", p3: "A", p4: "A", p5: "A", p6: "A", p7: "B", p8: "C" },
    { p1: 10, p2: 10, p3: 10, p4: 10, p5: 10, p6: 10, p7: 10, p8: 10 }
  );
  assert.equal(resultado.esTroll, true);
  assert.equal(resultado.patronRepetido, true);
});
caso("detectarTroll: jugador normal no se marca como troll", () => {
  const resultado = detectarTroll(
    { p1: "A", p2: "B", p3: "C", p4: "A", p5: "D", p6: "B", p7: "A", p8: "C" },
    { p1: 8, p2: 12, p3: 6, p4: 9, p5: 15, p6: 7, p7: 10, p8: 11 }
  );
  assert.equal(resultado.esTroll, false);
});

// --- clasificarAreaLibre ---
caso("clasificarAreaLibre: matchea carreras de alta demanda real por país", () => {
  assert.equal(clasificarAreaLibre("Negocios y ventas", "CO"), "Administración / Negocios");
  assert.equal(clasificarAreaLibre("Enfermería", "PE"), "Enfermería");
  assert.equal(clasificarAreaLibre("Moda sostenible", "CO"), null, "un área sin match no debe forzar una categoría");
});
caso("clasificarAreaLibre: Argentina tiene su propia lista (Randstad 2026)", () => {
  assert.equal(clasificarAreaLibre("Enfermería", "AR"), "Enfermería");
  assert.equal(clasificarAreaLibre("Ingeniería civil", "AR"), "Ingeniería");
  assert.equal(clasificarAreaLibre("Programación", "AR"), "Sistemas / Programación");
});
caso("clasificarAreaLibre: 'programa' como palabra suelta no debe matchear Sistemas/TIC (falso positivo real encontrado en datos)", () => {
  assert.equal(clasificarAreaLibre("Creación de contenido audiovisual y lanzamientos de educación programas", "CO"), null);
  assert.equal(clasificarAreaLibre("Desarrollo de software y programación", "CO"), "Sistemas / TIC / Datos");
});

// --- partidasEsperadas ---
caso("partidasEsperadas: usa el default (3) si el programa no define uno propio", () => {
  assert.equal(partidasEsperadas(null), DEFAULT_PARTIDAS_POR_PAQUETE);
  assert.equal(partidasEsperadas({ partidasPorPaquete: null }), DEFAULT_PARTIDAS_POR_PAQUETE);
  assert.equal(partidasEsperadas({ partidasPorPaquete: 5 }), 5, "un programa puede pedir un paquete distinto");
});

// --- informeComparativo ---
const partidaComparar = (overrides: Partial<PartidaParaComparar> = {}): PartidaParaComparar => ({
  id: "p1",
  perfilDominante: "EMP",
  resultadoTipo: "alto",
  ingresoFinal: 5_000_000,
  medallasGanadas: [],
  alertas: [],
  skillsFinales: {},
  decisiones: [],
  ...overrides,
});

caso("calcularPatronesComparativos: un patrón exige aparecer en TODAS las partidas, no solo en la mayoría", () => {
  const tresPartidas = [
    partidaComparar({ id: "a", perfilDominante: "EMP", alertas: ["barrera_evasion"], skillsFinales: { disciplina: 3 } }),
    partidaComparar({ id: "b", perfilDominante: "EMP", alertas: ["barrera_evasion"], skillsFinales: { disciplina: 2 } }),
    partidaComparar({ id: "c", perfilDominante: "FREE", alertas: [], skillsFinales: { disciplina: 4 } }),
  ];
  const patrones = calcularPatronesComparativos(tresPartidas);
  assert.deepEqual(patrones.perfilesRepetidos, [], "EMP salió en 2 de 3, no en las 3 — no cuenta como patrón");
  assert.deepEqual(patrones.alertasComunes, [], "barrera_evasion salió en 2 de 3, no en las 3");
  assert.deepEqual(patrones.skillsComunes, ["disciplina"], "disciplina sí se invirtió en las 3, aunque en niveles distintos");

  const mismoPerfilEnLasTres = tresPartidas.map((p) => ({ ...p, perfilDominante: "EMP" }));
  assert.deepEqual(calcularPatronesComparativos(mismoPerfilEnLasTres).perfilesRepetidos, ["EMP"]);
});
caso("calcularAreasDeMejora: alertas negativas presentes en 2+ caminos, ordenadas por frecuencia", () => {
  const partidas = [
    partidaComparar({ alertas: ["barrera_economica", "perfil_riesgo"] }),
    partidaComparar({ alertas: ["barrera_economica"] }),
    partidaComparar({ alertas: ["barrera_economica", "perfil_riesgo"] }),
  ];
  const areas = calcularAreasDeMejora(partidas);
  assert.deepEqual(areas, [
    { alerta: "barrera_economica", vecesPresente: 3 },
    { alerta: "perfil_riesgo", vecesPresente: 2 },
  ]);

  const soloUnaVez = [partidaComparar({ alertas: ["barrera_economica"] }), partidaComparar({ alertas: [] })];
  assert.deepEqual(
    calcularAreasDeMejora(soloUnaVez),
    [],
    "una alerta que solo aparece en 1 de N caminos no cuenta como área de mejora real"
  );
});
caso("encontrarMejoresDecisiones: el mayor salto de ingreso por partida, o la que desbloqueó medalla si no hubo ingreso", () => {
  const partidas = [
    partidaComparar({
      id: "a",
      decisiones: [
        { anio: 18, titulo: "Primer cliente", ingresoAntes: 0, ingresoDespues: 500_000, medallaDesbloqueada: null },
        { anio: 20, titulo: "Contrato grande", ingresoAntes: 500_000, ingresoDespues: 3_000_000, medallaDesbloqueada: null },
      ],
    }),
    partidaComparar({
      id: "b",
      decisiones: [{ anio: 19, titulo: "Certificación", ingresoAntes: 1_000_000, ingresoDespues: 1_000_000, medallaDesbloqueada: "bilingue" }],
    }),
    partidaComparar({ id: "c", decisiones: [] }),
  ];
  const mejores = encontrarMejoresDecisiones(partidas);
  assert.equal(mejores.length, 2, "la partida sin decisiones no aporta ninguna");
  assert.equal(mejores[0].titulo, "Contrato grande", "el mayor salto de ingreso de la partida a");
  assert.equal(mejores[1].medallaDesbloqueada, "bilingue", "sin salto de ingreso, se usa la que desbloqueó medalla");
});

console.log(`\n${pasadas} casos pasaron.`);
if (process.exitCode === 1) {
  console.error("Hay casos fallidos — revisa arriba.");
} else {
  console.log("Todo bien ✅");
}
