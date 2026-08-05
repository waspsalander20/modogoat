import type { Medalla } from "@/lib/types";

export const MEDALLAS: Medalla[] = [
  { id: "la_chispa", nombre: "La Chispa", emoji: "⚡", nivel: "bronce", condicion: "Primera decisión de carrera tomada", secreta: false },
  { id: "primer_peso", nombre: "Primer Ingreso", emoji: "💵", nivel: "bronce", condicion: "Primer ingreso generado en el juego", secreta: false },

  { id: "sobreviviente", nombre: "Sobreviviente", emoji: "💪", nivel: "plata", condicion: "Supera su primer imprevisto", secreta: false },
  { id: "antifragil", nombre: "Antifrágil", emoji: "🛡️", nivel: "plata", condicion: "Supera 3 imprevistos seguidos sin bajar ingreso", secreta: false },

  { id: "red_de_oro", nombre: "Red de Oro", emoji: "🤝", nivel: "oro", condicion: "Completa la misión de un mentor", secreta: false },
  { id: "bilingue", nombre: "Bilingüe", emoji: "🇬🇧", nivel: "oro", condicion: "Sube inglés a nivel 3", secreta: false },
  // Las 5 de acá abajo vienen de investigación real de psicología organizacional
  // aportada por el usuario (1 ago 2026, ver auditoría sección 08) — cada una
  // reemplaza una medalla "fantasma" que dependía de datos que la IA nunca
  // recibía (clics de popup, "misiones" de mentor sin sistema real, comparar
  // dos partidas distintas). Estas 5 usan skills que el juego ya trackea.
  { id: "agilidad_mental", nombre: "Agilidad Mental", emoji: "🧠", nivel: "oro", condicion: "Sube adaptabilidad a nivel 4", secreta: false },
  { id: "resiliencia_acero", nombre: "Resiliencia de Acero", emoji: "🦾", nivel: "oro", condicion: "Sube disciplina a nivel 4", secreta: false },
  { id: "conexion_estrategica", nombre: "Conexión Estratégica", emoji: "🕸️", nivel: "oro", condicion: "Sube networking a nivel 4", secreta: false },
  { id: "inteligencia_emocional", nombre: "Inteligencia Emocional", emoji: "🧘", nivel: "oro", condicion: "Sube comunicación asertiva a nivel 4", secreta: false },
  { id: "vision_sistemica", nombre: "Visión Sistémica", emoji: "🧩", nivel: "oro", condicion: "Sube análisis de datos a nivel 4", secreta: false },
  // Las 7 de acá abajo (3 ago 2026) cierran el hueco detectado en la
  // auditoría: de las 8 skills clave únicas entre los 5 perfiles
  // (SKILLS_CLAVE_POR_PERFIL, lib/motor.ts), solo analisisDatos tenía
  // medalla — EMP, FREE y CRE no tenían ninguna atada a su propia skill
  // clave. Mismo patrón que las 5 de arriba (nivel 4, respaldo real de
  // investigación de la disciplina correspondiente):
  { id: "lider_transformador", nombre: "Liderazgo Transformador", emoji: "👑", nivel: "oro", condicion: "Sube liderazgo a nivel 4", secreta: false },
  { id: "maestro_negociador", nombre: "Maestro Negociador", emoji: "⚖️", nivel: "oro", condicion: "Sube negociación a nivel 4", secreta: false },
  { id: "cerrador_nato", nombre: "Cerrador Nato", emoji: "🎯", nivel: "oro", condicion: "Sube ventas a nivel 4", secreta: false },
  { id: "arquitecto_proyectos", nombre: "Arquitecto de Proyectos", emoji: "🗂️", nivel: "oro", condicion: "Sube gestión de proyectos a nivel 4", secreta: false },
  { id: "maestro_embudo", nombre: "Maestro del marketing", emoji: "📣", nivel: "oro", condicion: "Sube marketing digital a nivel 4", secreta: false },
  { id: "narrador_nato", nombre: "Narrador Nato", emoji: "🎬", nivel: "oro", condicion: "Sube narrativa a nivel 4", secreta: false },
  { id: "sangre_fria", nombre: "Sangre Fría", emoji: "🎲", nivel: "oro", condicion: "Sube tolerancia al riesgo a nivel 4", secreta: false },

  // El Estratega: ya tenía la lógica para detectarla en el código
  // (contarCambiosRuta, ya usada por la alerta explorador_vocacional) — solo
  // le faltaba estar conectada acá. No dependía de datos inexistentes, era
  // un cable suelto.
  { id: "el_estratega", nombre: "El Estratega", emoji: "🏆", nivel: "platino", condicion: "Completa una ruta sin cambiarla nunca", secreta: false },

  { id: "goat_mode", nombre: "GOAT MODE", emoji: "🐐", nivel: "goat", condicion: "Independencia financiera antes de los 30 + inglés nivel 4+", secreta: false },
];

export function medalla(id: string): Medalla | undefined {
  return MEDALLAS.find((m) => m.id === id);
}
