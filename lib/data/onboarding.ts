import type { Puntos } from "@/lib/types";

export interface OpcionOnboarding {
  letra: "A" | "B" | "C" | "D" | "E" | "F";
  texto: string;
}

export interface PreguntaOnboarding {
  id: string;
  texto: (nombre: string) => string;
  opciones: OpcionOnboarding[];
  puntos: Record<string, Puntos>;
}

export const PREGUNTAS_ONBOARDING: PreguntaOnboarding[] = [
  {
    id: "pregunta_1",
    texto: (n) => `Es viernes en la noche. No hay nada planeado. ¿Qué hace ${n} normalmente?`,
    opciones: [
      { letra: "A", texto: "Crea algo — diseño, música, videos, arte" },
      { letra: "B", texto: "Sale con parceros — siempre hay plan" },
      { letra: "C", texto: "Investiga algo por curiosidad propia" },
      { letra: "D", texto: "Piensa cómo ganar plata — rebusca, vende" },
      { letra: "E", texto: "Lee, ve documentales, aprende algo" },
      { letra: "F", texto: "Juega videojuegos o consume contenido" },
    ],
    puntos: {
      A: { EMP: 0, INV: 0, EMP2: 1, FREE: 2, CRE: 3 },
      B: { EMP: 2, INV: 0, EMP2: 2, FREE: 0, CRE: 1 },
      C: { EMP: 0, INV: 3, EMP2: 1, FREE: 1, CRE: 0 },
      D: { EMP: 0, INV: 0, EMP2: 3, FREE: 1, CRE: 1 },
      E: { EMP: 1, INV: 3, EMP2: 0, FREE: 1, CRE: 0 },
      F: { EMP: 0, INV: 0, EMP2: 0, FREE: 1, CRE: 3 },
    },
  },
  {
    id: "pregunta_2",
    texto: (n) => `Le piden a ${n} un proyecto libre en el colegio. Sin restricciones. ¿Qué entrega?`,
    opciones: [
      { letra: "A", texto: "Algo creativo que sorprenda" },
      { letra: "B", texto: "Una investigación bien sustentada" },
      { letra: "C", texto: "Una propuesta para resolver un problema real" },
      { letra: "D", texto: "Un plan de negocio o emprendimiento" },
      { letra: "E", texto: "Algo colaborativo — lo hace con otros" },
      { letra: "F", texto: "Lo más fácil y rápido — lo importante es entregar" },
    ],
    puntos: {
      A: { EMP: 0, INV: 0, EMP2: 1, FREE: 2, CRE: 3 },
      B: { EMP: 0, INV: 3, EMP2: 0, FREE: 0, CRE: 1 },
      C: { EMP: 1, INV: 2, EMP2: 2, FREE: 0, CRE: 0 },
      D: { EMP: 1, INV: 0, EMP2: 3, FREE: 1, CRE: 0 },
      E: { EMP: 2, INV: 0, EMP2: 1, FREE: 2, CRE: 0 },
      F: { EMP: 0, INV: 0, EMP2: 0, FREE: 0, CRE: 0 },
    },
  },
  {
    id: "pregunta_3",
    texto: (n) => `En un trabajo en grupo ${n} generalmente...`,
    opciones: [
      { letra: "A", texto: "Organiza todo — cronograma, roles, entregas" },
      { letra: "B", texto: "Toma la vocería y presenta al final" },
      { letra: "C", texto: "Investiga y trae la información más completa" },
      { letra: "D", texto: "Se encarga de que todo se vea bien" },
      { letra: "E", texto: "Se adapta — hace lo que el grupo necesite" },
      { letra: "F", texto: "Hace lo mínimo — espera que otros carguen" },
    ],
    puntos: {
      A: { EMP: 3, INV: 0, EMP2: 1, FREE: 0, CRE: 0 },
      B: { EMP: 2, INV: 0, EMP2: 2, FREE: 0, CRE: 1 },
      C: { EMP: 1, INV: 3, EMP2: 0, FREE: 1, CRE: 0 },
      D: { EMP: 0, INV: 0, EMP2: 1, FREE: 2, CRE: 3 },
      E: { EMP: 2, INV: 1, EMP2: 0, FREE: 2, CRE: 0 },
      F: { EMP: 0, INV: 0, EMP2: 0, FREE: 0, CRE: 0 },
    },
  },
  {
    id: "pregunta_4",
    texto: (n) => `Le llega una crítica fuerte a algo que ${n} hizo. ¿Cómo reacciona?`,
    opciones: [
      { letra: "A", texto: "La analiza — busca qué tiene de verdad" },
      { letra: "B", texto: "La usa como motivación — le da más ganas" },
      { letra: "C", texto: "Se defiende — siente que no es justa" },
      { letra: "D", texto: "La convierte en conversación" },
      { letra: "E", texto: "Se calla — por fuera tranquilo, por dentro le afecta" },
      { letra: "F", texto: "La ignora — no le importa" },
    ],
    puntos: {
      A: { EMP: 2, INV: 3, EMP2: 1, FREE: 1, CRE: 1 },
      B: { EMP: 0, INV: 0, EMP2: 2, FREE: 1, CRE: 2 },
      C: { EMP: 1, INV: 0, EMP2: 2, FREE: 1, CRE: 1 },
      D: { EMP: 2, INV: 1, EMP2: 0, FREE: 1, CRE: 0 },
      E: { EMP: 0, INV: 0, EMP2: 0, FREE: 0, CRE: 0 },
      F: { EMP: 0, INV: 0, EMP2: 0, FREE: 0, CRE: 0 },
    },
  },
  {
    id: "pregunta_5",
    texto: (n) => `¿Qué haría sentir más orgulloso/a a ${n}?`,
    opciones: [
      { letra: "A", texto: "Ser reconocido como referente en algo" },
      { letra: "B", texto: "Haber ayudado a alguien a cambiar su situación" },
      { letra: "C", texto: "Tener libertad financiera y no depender de nadie" },
      { letra: "D", texto: "Haber crecido como persona" },
      { letra: "E", texto: "Construir algo que funcione sin él/ella" },
      { letra: "F", texto: "Tener audiencia que lo siga" },
    ],
    puntos: {
      A: { EMP: 2, INV: 3, EMP2: 1, FREE: 1, CRE: 2 },
      B: { EMP: 3, INV: 2, EMP2: 0, FREE: 0, CRE: 1 },
      C: { EMP: 1, INV: 0, EMP2: 3, FREE: 2, CRE: 1 },
      D: { EMP: 1, INV: 2, EMP2: 1, FREE: 2, CRE: 1 },
      E: { EMP: 2, INV: 0, EMP2: 3, FREE: 1, CRE: 0 },
      F: { EMP: 0, INV: 0, EMP2: 1, FREE: 2, CRE: 3 },
    },
  },
  {
    id: "pregunta_6",
    texto: (n) => `Un proyecto en el que ${n} puso todo falla. ¿Qué hace?`,
    opciones: [
      { letra: "A", texto: "Lo intenta de nuevo solo — aprendió algo" },
      { letra: "B", texto: "Busca un socio para reintentar" },
      { letra: "C", texto: "Lo toma como aprendizaje y busca algo diferente" },
      { letra: "D", texto: "Consigue un trabajo — prefiere la estabilidad" },
      { letra: "E", texto: "Lo documenta y lo cuenta para que otros aprendan" },
      { letra: "F", texto: "Se frustra y no hace nada por un tiempo" },
    ],
    puntos: {
      A: { EMP: 0, INV: 1, EMP2: 3, FREE: 2, CRE: 2 },
      B: { EMP: 2, INV: 1, EMP2: 2, FREE: 1, CRE: 0 },
      C: { EMP: 1, INV: 2, EMP2: 1, FREE: 2, CRE: 1 },
      D: { EMP: 3, INV: 0, EMP2: 0, FREE: 0, CRE: 0 },
      E: { EMP: 0, INV: 2, EMP2: 1, FREE: 1, CRE: 3 },
      F: { EMP: 0, INV: 0, EMP2: 0, FREE: 0, CRE: 0 },
    },
  },
  {
    id: "pregunta_7",
    texto: (n) => `${n} quiere aprender algo nuevo. ¿Cómo lo hace?`,
    opciones: [
      { letra: "A", texto: "Busca videos y tutoriales — aprende viendo" },
      { letra: "B", texto: "Lee artículos o guías detalladas" },
      { letra: "C", texto: "Experimenta directamente — prueba, falla, ajusta" },
      { letra: "D", texto: "Le pregunta a alguien que ya sabe" },
      { letra: "E", texto: "Busca el curso más completo y lo sigue paso a paso" },
      { letra: "F", texto: "Toma notas y organiza la información a su manera" },
    ],
    puntos: {
      A: { EMP: 0, INV: 0, EMP2: 1, FREE: 2, CRE: 3 },
      B: { EMP: 2, INV: 3, EMP2: 0, FREE: 1, CRE: 0 },
      C: { EMP: 1, INV: 0, EMP2: 2, FREE: 3, CRE: 2 },
      D: { EMP: 2, INV: 1, EMP2: 1, FREE: 1, CRE: 2 },
      E: { EMP: 3, INV: 2, EMP2: 1, FREE: 1, CRE: 0 },
      F: { EMP: 1, INV: 3, EMP2: 0, FREE: 1, CRE: 0 },
    },
  },
  {
    id: "pregunta_8",
    texto: (n) => `${n} tiene una semana libre inesperada. ¿Qué hace?`,
    opciones: [
      { letra: "A", texto: "Crea algo que tenía pendiente" },
      { letra: "B", texto: "Aprende algo nuevo que tenía en lista" },
      { letra: "C", texto: "Sale con amigos — planes, parche" },
      { letra: "D", texto: "Explora algo nuevo — lugar, idea, habilidad" },
      { letra: "E", texto: "Descansa de verdad — recarga energía" },
      { letra: "F", texto: "Busca cómo ganarse algo extra" },
    ],
    puntos: {
      A: { EMP: 0, INV: 1, EMP2: 1, FREE: 2, CRE: 3 },
      B: { EMP: 2, INV: 3, EMP2: 0, FREE: 1, CRE: 0 },
      C: { EMP: 2, INV: 0, EMP2: 2, FREE: 1, CRE: 1 },
      D: { EMP: 1, INV: 2, EMP2: 1, FREE: 2, CRE: 1 },
      E: { EMP: 0, INV: 0, EMP2: 0, FREE: 0, CRE: 0 },
      F: { EMP: 0, INV: 0, EMP2: 2, FREE: 2, CRE: 1 },
    },
  },
];
