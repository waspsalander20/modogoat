import type { Medalla } from "@/lib/types";

export const MEDALLAS: Medalla[] = [
  { id: "la_chispa", nombre: "La Chispa", emoji: "⚡", nivel: "bronce", condicion: "Primera decisión de carrera tomada", secreta: false },
  { id: "primer_peso", nombre: "Primer Peso", emoji: "💵", nivel: "bronce", condicion: "Primer ingreso generado en el juego", secreta: false },
  { id: "el_arranque", nombre: "El Arranque", emoji: "🔥", nivel: "bronce", condicion: "Completa el onboarding sin abandonar", secreta: false },
  { id: "curioso", nombre: "Curioso", emoji: "🔍", nivel: "bronce", condicion: "Toca el popup de detalle en 5 decisiones seguidas", secreta: false },
  { id: "el_observador", nombre: "El Observador", emoji: "👁️", nivel: "bronce", secreta: true, condicion: "Toca TODOS los popups de detalle antes de elegir en una misma decisión" },

  { id: "sobreviviente", nombre: "Sobreviviente", emoji: "💪", nivel: "plata", condicion: "Supera su primer imprevisto", secreta: false },
  { id: "antifragil", nombre: "Antifrágil", emoji: "🛡️", nivel: "plata", condicion: "Supera 3 imprevistos seguidos sin bajar ingreso", secreta: false },
  { id: "inversor", nombre: "Inversor", emoji: "📈", nivel: "plata", condicion: "Invierte en 3 skills diferentes en una partida", secreta: false },
  { id: "contra_corriente", nombre: "Contra la corriente", emoji: "🌊", nivel: "plata", secreta: true, condicion: "Elige la opción menos popular en 5 decisiones seguidas" },

  { id: "red_de_oro", nombre: "Red de Oro", emoji: "🤝", nivel: "oro", condicion: "Completa la misión de un mentor", secreta: false },
  { id: "bilingue", nombre: "Bilingüe", emoji: "🇬🇧", nivel: "oro", condicion: "Sube inglés a nivel 3", secreta: false },
  { id: "modo_enfoque", nombre: "Modo Enfoque", emoji: "🎯", nivel: "oro", condicion: "Sube cualquier skill al nivel 5", secreta: false },
  { id: "el_mentor_oculto", nombre: "El Mentor Oculto", emoji: "🎭", nivel: "oro", secreta: true, condicion: "Completa misiones de 3 mentores distintos en una partida" },

  { id: "el_estratega", nombre: "El Estratega", emoji: "🏆", nivel: "platino", condicion: "Completa una ruta sin cambiarla nunca", secreta: false },
  { id: "segunda_vida", nombre: "Segunda Vida", emoji: "🔄", nivel: "platino", secreta: true, condicion: "Llega al año 30 con perfil completamente distinto al de su primera partida" },

  { id: "goat_mode", nombre: "GOAT MODE", emoji: "🐐", nivel: "goat", condicion: "Independencia financiera antes de los 30 + inglés nivel 4+", secreta: false },
];

export function medalla(id: string): Medalla | undefined {
  return MEDALLAS.find((m) => m.id === id);
}
