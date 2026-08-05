// Cálculo determinístico (sin IA) de patrones entre las N partidas de un
// mismo jugador — la parte narrativa (por qué difirieron, síntesis final)
// la genera generarAnalisisComparativo (lib/aiMotor.ts); esto solo detecta
// qué se repite y qué destaca, con datos que el juego ya guarda.

const ALERTAS_NEGATIVAS = new Set([
  "perfil_riesgo",
  "barrera_economica",
  "barrera_familiar",
  "barrera_evasion",
  "explorador_vocacional",
]);

export interface DecisionResumen {
  anio: number;
  titulo: string;
  ingresoAntes: number;
  ingresoDespues: number;
  medallaDesbloqueada: string | null;
}

export interface PartidaParaComparar {
  id: string;
  perfilDominante: string | null;
  resultadoTipo: string | null;
  ingresoFinal: number | null;
  medallasGanadas: string[];
  alertas: string[];
  skillsFinales: Record<string, number> | null;
  decisiones: DecisionResumen[];
}

export interface PatronesComparativos {
  perfilesRepetidos: string[];
  alertasComunes: string[];
  skillsComunes: string[];
}

export interface AreaDeMejora {
  alerta: string;
  vecesPresente: number;
}

export interface MejorDecision {
  partidaId: string;
  anio: number;
  titulo: string;
  saltoIngreso: number;
  medallaDesbloqueada: string | null;
}

function contarApariciones(listas: string[][]): Map<string, number> {
  const conteo = new Map<string, number>();
  for (const lista of listas) {
    for (const item of new Set(lista)) {
      conteo.set(item, (conteo.get(item) ?? 0) + 1);
    }
  }
  return conteo;
}

// "Repetido/común" exige aparecer en TODAS las partidas del jugador, no solo
// en 2 de N — si el paquete crece más allá de 3 (partidasPorPaquete), un
// patrón real debe sostenerse en el conjunto completo, no en una mayoría.
export function calcularPatronesComparativos(partidas: PartidaParaComparar[]): PatronesComparativos {
  const total = partidas.length;

  const perfiles = partidas.map((p) => (p.perfilDominante ? [p.perfilDominante] : []));
  const perfilesRepetidos = [...contarApariciones(perfiles)].filter(([, n]) => n === total).map(([id]) => id);

  const alertas = partidas.map((p) => p.alertas);
  const alertasComunes = [...contarApariciones(alertas)].filter(([, n]) => n === total).map(([id]) => id);

  const skills = partidas.map((p) => Object.entries(p.skillsFinales ?? {}).filter(([, nivel]) => nivel > 0).map(([id]) => id));
  const skillsComunes = [...contarApariciones(skills)].filter(([, n]) => n === total).map(([id]) => id);

  return { perfilesRepetidos, alertasComunes, skillsComunes };
}

// A diferencia de "patrones" (que exige estar en TODAS), un área de mejora
// real ya vale la pena señalarla si aparece en 2 o más caminos distintos —
// no hace falta que se repita en el 100% para ser una señal genuina.
export function calcularAreasDeMejora(partidas: PartidaParaComparar[]): AreaDeMejora[] {
  const alertas = partidas.map((p) => p.alertas.filter((a) => ALERTAS_NEGATIVAS.has(a)));
  const conteo = contarApariciones(alertas);
  return [...conteo]
    .filter(([, n]) => n >= 2)
    .sort(([, a], [, b]) => b - a)
    .map(([alerta, vecesPresente]) => ({ alerta, vecesPresente }));
}

// La "mejor" decisión de cada partida: el mayor salto de ingreso positivo,
// o si ninguna subió el ingreso, la que desbloqueó una medalla — para no
// dejar una partida sin ninguna decisión destacada solo porque su arco
// económico fue plano (ej. un jugador que recién arranca en EMP2).
export function encontrarMejoresDecisiones(partidas: PartidaParaComparar[]): MejorDecision[] {
  const mejores: MejorDecision[] = [];
  for (const partida of partidas) {
    if (partida.decisiones.length === 0) continue;
    const conSalto = partida.decisiones.map((d) => ({ ...d, salto: d.ingresoDespues - d.ingresoAntes }));
    const mejor = conSalto.reduce((a, b) => {
      if (b.salto !== a.salto) return b.salto > a.salto ? b : a;
      return b.medallaDesbloqueada && !a.medallaDesbloqueada ? b : a;
    });
    if (mejor.salto > 0 || mejor.medallaDesbloqueada) {
      mejores.push({
        partidaId: partida.id,
        anio: mejor.anio,
        titulo: mejor.titulo,
        saltoIngreso: mejor.salto,
        medallaDesbloqueada: mejor.medallaDesbloqueada,
      });
    }
  }
  return mejores;
}
