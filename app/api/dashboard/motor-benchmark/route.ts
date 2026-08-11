import { NextResponse } from "next/server";
import {
  generarDecisionDeAnio,
  generarEvento,
  procesarEleccion,
  generarReflexionFinal,
  generarAnalisisFinal,
  type EstadoIA,
} from "@/lib/aiMotor";
import { usoVacio, sumarUso, type UsoIA } from "@/lib/aiCost";

// Benchmark del motor narrativo con IA — no toca ninguna partida real, solo
// corre las 5 llamadas del motor (generarDecisionDeAnio, generarEvento,
// procesarEleccion, generarReflexionFinal, generarAnalisisFinal) contra un
// estado de partida sintético, y devuelve cuánto tardó cada una, con qué
// modelo y cuántos tokens gastó. Protegido por proxy.ts (contraseña del
// dashboard) porque dispara IA real — cada corrida cuesta plata de verdad.
const ESTADO_DE_PRUEBA: EstadoIA = {
  nombre: "Jugador de prueba",
  edad_actual: 19,
  ciudad: "Medellín",
  pais: "CO",
  contexto_familiar: "familia_completa",
  trabaja: "a_veces",
  area_libre: "mecánica de motos",
  ruta_entrada: "Trabajar y aprender el oficio",
  perfil_dominante: "EMP2",
  puntos_perfil: { EMP: 2, INV: 0, EMP2: 5, FREE: 1, CRE: 0 },
  ingreso_actual: 650000,
  skills: { disciplina: 3, negociacion: 2, ventas: 2 },
  anio_actual: 3,
  edad_fin: 23,
  ultimo_evento: "Un cliente no pagó a tiempo",
  medallas: ["primer_peso"],
  mentor_activo: "don_jairo",
  historial_decisiones: [
    { anio: 16, titulo: "Salir a trabajar o seguir estudiando", opcion_elegida: "B", opcion_texto: "Empiezas a trabajar arreglando motos en el barrio" },
    { anio: 17, titulo: "Un vecino te ofrece más trabajo", opcion_elegida: "A", opcion_texto: "Le cobras por el trabajo y le pides que te recomiende" },
    { anio: 18, titulo: "Te ofrecen un local pequeño", opcion_elegida: "B", opcion_texto: "Aceptas el local a crédito" },
  ],
  feliz_final: true,
  resultado_tipo: "alto",
  veces_cabrita: 0,
};

const DECISION_DE_PRUEBA = {
  titulo: "Un vecino te ve arreglando tu moto en el andén",
  opcion_elegida: "B",
  opcion_texto: "Le cobras por el trabajo y le pides que te recomiende con otros",
  tiempo_respuesta: 6.2,
};

interface ResultadoLlamada {
  nombre: string;
  ms: number;
  modelo: "sonnet" | "haiku";
  ok: boolean;
  error?: string;
  tokens?: UsoIA;
  muestra?: unknown;
}

async function medir(
  nombre: string,
  modelo: "sonnet" | "haiku",
  llamada: (registrarUso: (u: UsoIA) => void) => Promise<unknown>
): Promise<ResultadoLlamada> {
  const inicio = Date.now();
  let uso: UsoIA = usoVacio();
  try {
    const resultado = await llamada((u) => {
      uso = sumarUso(uso, u);
    });
    return { nombre, modelo, ms: Date.now() - inicio, ok: true, tokens: uso, muestra: resultado };
  } catch (error) {
    return {
      nombre,
      modelo,
      ms: Date.now() - inicio,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function GET() {
  const inicioTotal = Date.now();

  const resultados = await Promise.all([
    medir("generar_decision", "haiku", (r) => generarDecisionDeAnio(ESTADO_DE_PRUEBA, undefined, r)),
    medir("generar_evento", "haiku", (r) => generarEvento(ESTADO_DE_PRUEBA, undefined, r)),
    medir("procesar_eleccion (consecuencia)", "sonnet", (r) =>
      procesarEleccion(ESTADO_DE_PRUEBA, DECISION_DE_PRUEBA, undefined, false, r)
    ),
    medir("generar_reflexion_final", "sonnet", (r) => generarReflexionFinal(ESTADO_DE_PRUEBA, r)),
    medir("generar_analisis_final", "sonnet", (r) => generarAnalisisFinal(ESTADO_DE_PRUEBA, r)),
  ]);

  return NextResponse.json({
    msTotal: Date.now() - inicioTotal,
    // Todas corren en paralelo (no representa la secuencia real del juego,
    // donde solo procesar_eleccion + generar_evento van juntas) — es para
    // que el benchmark completo no tarde 5 veces la suma de cada una. El
    // ms de cada llamada sí es su tiempo real e individual.
    llamadas: resultados,
  });
}
