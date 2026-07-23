export type PerfilId = "EMP" | "INV" | "EMP2" | "FREE" | "CRE";

export type Puntos = Record<PerfilId, number>;

export interface OpcionDecision {
  letra: "A" | "B" | "C" | "D";
  emoji: string;
  titulo: string;
  descripcion?: string;
  pros?: string[];
  contras?: string[];
  skillsQueSuben: Record<string, number>;
  puntosPerfil: Puntos;
  ingresoModificador?: number;
}

export interface Decision {
  id: string;
  titulo: string;
  bloque: 1 | 2 | 3 | 4;
  edadMinima: number;
  edadMaxima: number;
  categoria?: string;
  texto: string;
  tieneCampoLibre?: boolean;
  textoCampoLibre?: string;
  opciones: OpcionDecision[];
}

export interface OpcionEvento {
  letra: "A" | "B" | "C" | "D";
  texto: string;
  consecuencia?: string;
  skillsModifica: Record<string, number>;
  ingresoModifica?: number;
  ventanaSeCierra?: boolean;
  mostrarCostoOportunidad?: boolean;
  medallaSecretaPosible?: string;
  resultado?: string;
  alertaGenerada?: string;
}

export interface Evento {
  id: string;
  nombre: string;
  emoji: string;
  texto: string;
  perfilesPreferentes: PerfilId[];
  universal: boolean;
  edadMinima?: number;
  edadMaxima?: number;
  apareceSiempre?: boolean;
  apareceDespuesDe?: string;
  apareceCuando?: string;
  soloSiRechazoAntes?: boolean;
  opciones: OpcionEvento[];
}

export interface Mentor {
  id: string;
  nombre: string;
  emoji: string;
  perfil: string;
  perfilDominante: PerfilId | "cualquiera";
  condicion: string;
  mision: string;
  recompensaCompletada: { skillsModifica: Record<string, number> };
  prioridad?: boolean;
}

export interface Skill {
  id: string;
  nombre: string;
  emoji: string;
  descripcion?: string;
}

export interface Medalla {
  id: string;
  nombre: string;
  emoji: string;
  nivel: "bronce" | "plata" | "oro" | "platino" | "goat";
  condicion: string;
  secreta: boolean;
}

export interface DecisionTomada {
  anio: number;
  decisionId: string;
  opcionElegida: string;
  campoLibre?: string;
  tiempoRespuesta: number;
  ingresoAntes: number;
  ingresoDespues: number;
  skillsSubidas: Record<string, number>;
  puntosSumados: Puntos;
  alertaGenerada?: string;
}

export interface EventoVivido {
  anio: number;
  tipoEvento: "imprevisto" | "oportunidad";
  eventoId: string;
  opcionElegida: string;
  tiempoRespuesta: number;
}

export interface EstadoPartida {
  id: string;
  nombre: string;
  edadInicio: number;
  edadActual: number;
  ingreso: number;
  ahorros: number;
  puntos: Puntos;
  skills: Record<string, number>;
  mentorActivo: string | null;
  medallasGanadas: string[];
  decisiones: DecisionTomada[];
  eventos: EventoVivido[];
  aniosEstancado: number;
  estado: "onboarding" | "jugando" | "terminado";
}

export const PUNTOS_VACIOS: Puntos = { EMP: 0, INV: 0, EMP2: 0, FREE: 0, CRE: 0 };
