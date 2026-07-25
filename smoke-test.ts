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
import { calcularPerfil } from "./lib/perfilamiento";
import { detectarTroll } from "./lib/deteccionTroll";
import type { EstadoPartida, Puntos } from "./lib/types";

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
  assert.equal(calcularGastos(19), 0.2);
  assert.equal(calcularGastos(22), 0.2);
  assert.equal(calcularGastos(23), 0.4);
  assert.equal(calcularGastos(26), 0.4);
  assert.equal(calcularGastos(27), 0.6);
  assert.equal(calcularGastos(30), 0.6);
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
  assert.equal(calcularSalarioProyectado("EMP2", {}), 8_000_000);
});
caso("calcularSalarioProyectado: 3+ skills en nivel 5 duplica el salario", () => {
  const skills = { a: 5, b: 5, c: 5 };
  assert.equal(calcularSalarioProyectado("EMP", skills), 4_000_000 * 2.0);
});
caso("calcularSalarioProyectado: inglés B2+ (nivel 4) multiplica x1.6", () => {
  assert.equal(calcularSalarioProyectado("INV", { ingles: 4 }), Math.round(6_000_000 * 1.6));
});
caso("calcularSalarioProyectado: multiplicadores de skills e inglés se combinan", () => {
  const skills = { a: 5, b: 5, c: 5, ingles: 4 };
  assert.equal(calcularSalarioProyectado("CRE", skills), Math.round(5_000_000 * 2.0 * 1.6));
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
caso("determinarResultado: GOAT exige ingreso alto Y inglés avanzado", () => {
  const salarioBase = 4_000_000;
  const altoIngresoSinIngles = estadoBase({ ingreso: salarioBase * 2, skills: { ingles: 0 } });
  assert.equal(determinarResultado(altoIngresoSinIngles, "EMP", false), "alto");

  const altoIngresoConIngles = estadoBase({ ingreso: salarioBase * 2, skills: { ingles: 4 } });
  assert.equal(determinarResultado(altoIngresoConIngles, "EMP", false), "goat");
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
caso("elegirMedallasGanadas: bilingüe, modo enfoque, red de oro y goat mode", () => {
  const estado = estadoBase({
    skills: { ingles: 3, disciplina: 5 },
    mentorActivo: "don_jairo",
  });
  const medallas = elegirMedallasGanadas(estado, "goat");
  assert.ok(medallas.includes("bilingue"));
  assert.ok(medallas.includes("modo_enfoque"));
  assert.ok(medallas.includes("red_de_oro"));
  assert.ok(medallas.includes("goat_mode"));
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
    [{ opcionTexto: "opción A", ingresoAntes: null, ingresoDespues: null, medallaDesbloqueada: null, costoOportunidad: null }],
    100_000,
    250_000,
    {},
    "EMP",
    (id) => id,
    () => undefined
  );
  assert.equal(resumen.ingresoGanado, 150_000);
});
caso("calcularResumenAnio: highlights de ingreso al alza/baja y medallas", () => {
  const resumen = calcularResumenAnio(
    [
      { opcionTexto: "subió", ingresoAntes: 100, ingresoDespues: 200, medallaDesbloqueada: null, costoOportunidad: null },
      { opcionTexto: "bajó", ingresoAntes: 200, ingresoDespues: 150, medallaDesbloqueada: null, costoOportunidad: null },
      { opcionTexto: "medalla", ingresoAntes: null, ingresoDespues: null, medallaDesbloqueada: "primer_peso", costoOportunidad: null },
    ],
    100,
    150,
    {},
    "EMP",
    (id) => id,
    (id) => (id === "primer_peso" ? "Primer Peso" : undefined)
  );
  assert.equal(resumen.highlights.filter((h) => h.icono === "✅").length, 1);
  assert.equal(resumen.highlights.filter((h) => h.icono === "⚠️").length, 1);
  assert.ok(resumen.highlights.some((h) => h.texto.includes("Primer Peso")));
});
caso("calcularResumenAnio: costo de oportunidad viene grounded del primer item que lo trae, nunca inventado", () => {
  const conCosto = calcularResumenAnio(
    [{ opcionTexto: "x", ingresoAntes: null, ingresoDespues: null, medallaDesbloqueada: null, costoOportunidad: "perdiste la confianza del cliente" }],
    0,
    0,
    {},
    "EMP",
    (id) => id,
    () => undefined
  );
  assert.equal(conCosto.oportunidadPerdida, "perdiste la confianza del cliente");

  const sinCosto = calcularResumenAnio(
    [{ opcionTexto: "x", ingresoAntes: null, ingresoDespues: null, medallaDesbloqueada: null, costoOportunidad: null }],
    0,
    0,
    {},
    "EMP",
    (id) => id,
    () => undefined
  );
  assert.equal(sinCosto.oportunidadPerdida, null);
});
caso("calcularResumenAnio: mejorMovimiento recomienda la skill clave del perfil cuando gana sobre inglés", () => {
  // Para INV, subir "investigacion" (skill clave) de 0 a 5 da x1.2 (nivel
  // skills) * x1.5 (clave) = x1.8, más que subir solo inglés a B2 (x1.6).
  const resumen = calcularResumenAnio([], 0, 0, {}, "INV", (id) => id, () => undefined);
  assert.ok(
    resumen.mejorMovimiento?.includes("investigacion"),
    `esperaba mención a la skill clave del perfil (investigacion), dio: ${resumen.mejorMovimiento}`
  );
});
caso("calcularResumenAnio: mejorMovimiento recomienda inglés cuando esa sí es la mejora más grande", () => {
  // Con las skills clave del perfil ya casi topadas (nivel 4, multiplicador
  // clave ya en su tope de x1.5), subir inglés de 0 a B2 (x1.6) pesa más
  // que subir cualquiera de esas skills de 4 a 5 (se queda en la misma
  // franja de multiplicador clave, solo suma x1.2 por nivel de skills).
  const resumen = calcularResumenAnio(
    [],
    0,
    0,
    { investigacion: 4, analisisDatos: 4 },
    "INV",
    (id) => id,
    () => undefined
  );
  assert.ok(resumen.mejorMovimiento?.includes("inglés"), `esperaba mención a inglés, dio: ${resumen.mejorMovimiento}`);
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

console.log(`\n${pasadas} casos pasaron.`);
if (process.exitCode === 1) {
  console.error("Hay casos fallidos — revisa arriba.");
} else {
  console.log("Todo bien ✅");
}
