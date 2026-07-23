import type { Skill, PerfilId } from "@/lib/types";

export const SKILLS_TRANSVERSALES: Skill[] = [
  { id: "ingles", nombre: "Inglés", emoji: "🇬🇧", descripcion: "Comunicación en inglés técnico y profesional" },
  { id: "comunicacion", nombre: "Comunicación", emoji: "💬", descripcion: "Expresar ideas con claridad y persuasión" },
  { id: "finanzasPersonales", nombre: "Finanzas personales", emoji: "💰", descripcion: "Administrar ingresos, gastos e inversiones" },
  { id: "saludMental", nombre: "Salud mental", emoji: "🧘", descripcion: "Gestión emocional y bienestar psicológico" },
  { id: "disciplina", nombre: "Disciplina", emoji: "⚡", descripcion: "Consistencia y cumplimiento de compromisos" },
  { id: "networking", nombre: "Networking", emoji: "🤝", descripcion: "Construir y mantener relaciones profesionales" },
  { id: "adaptabilidad", nombre: "Adaptabilidad", emoji: "🔄", descripcion: "Responder bien a los cambios e imprevistos" },
];

export const SKILLS_PERFIL: Record<PerfilId, Skill[]> = {
  EMP2: [
    { id: "ventas", nombre: "Ventas", emoji: "💼" },
    { id: "marketingDigital", nombre: "Marketing digital", emoji: "📱" },
    { id: "gestionEquipos", nombre: "Gestión de equipos", emoji: "👥" },
    { id: "toleranciaRiesgo", nombre: "Tolerancia al riesgo", emoji: "🎯" },
  ],
  EMP: [
    { id: "trabajoEquipo", nombre: "Trabajo en equipo", emoji: "🤝" },
    { id: "negociacion", nombre: "Negociación", emoji: "⚖️" },
    { id: "gestionProyectos", nombre: "Gestión de proyectos", emoji: "📋" },
    { id: "presentaciones", nombre: "Presentaciones", emoji: "🎤" },
  ],
  FREE: [
    { id: "programacion", nombre: "Programación", emoji: "💻" },
    { id: "diseno", nombre: "Diseño", emoji: "🎨" },
    { id: "analisisDatos", nombre: "Análisis de datos", emoji: "📊" },
    { id: "produccionContenido", nombre: "Producción de contenido", emoji: "🎬" },
  ],
  INV: [
    { id: "empatiaClinica", nombre: "Empatía clínica", emoji: "❤️" },
    { id: "investigacion", nombre: "Investigación", emoji: "🔬" },
    { id: "comunicacionAsertiva", nombre: "Comunicación asertiva", emoji: "💬" },
    { id: "tecnologiaMedica", nombre: "Tecnología médica", emoji: "🏥" },
  ],
  CRE: [
    { id: "narrativa", nombre: "Narrativa", emoji: "📖" },
    { id: "marcaPersonal", nombre: "Marca personal", emoji: "⭐" },
    { id: "produccionAudiovisual", nombre: "Producción audiovisual", emoji: "🎥" },
    { id: "distribucionDigital", nombre: "Distribución digital", emoji: "📡" },
  ],
};

export const SKILL_LIDERAZGO: Skill = { id: "liderazgo", nombre: "Liderazgo", emoji: "🏆" };

export const TODAS_LAS_SKILLS: Skill[] = [
  ...SKILLS_TRANSVERSALES,
  ...Object.values(SKILLS_PERFIL).flat(),
  SKILL_LIDERAZGO,
];

export function nombreSkill(id: string): string {
  return TODAS_LAS_SKILLS.find((s) => s.id === id)?.nombre ?? id;
}

export function emojiSkill(id: string): string {
  return TODAS_LAS_SKILLS.find((s) => s.id === id)?.emoji ?? "✨";
}
