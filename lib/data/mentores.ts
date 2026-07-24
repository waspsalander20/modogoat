interface MentorInfo {
  id: string;
  nombre: string;
  emoji: string;
  perfil: string;
}

// Solo para mostrarle al jugador quién apareció — la interacción en sí la
// escribe la IA en la narrativa (ver mentor_activado en lib/aiMotor.ts).
const MENTORES: MentorInfo[] = [
  { id: "andrea", nombre: "Andrea", emoji: "🚀", perfil: "Emprendedora" },
  { id: "carlos", nombre: "Carlos", emoji: "👔", perfil: "Gerente" },
  { id: "valentina", nombre: "Valentina", emoji: "🔬", perfil: "Investigadora" },
  { id: "sebastian", nombre: "Sebastián", emoji: "💻", perfil: "Freelancer / UX" },
  { id: "luna", nombre: "Luna", emoji: "🎥", perfil: "Creadora de contenido" },
  { id: "don_jairo", nombre: "Don Jairo", emoji: "🔧", perfil: "Técnico universal" },
];

export function mentor(id: string): MentorInfo | undefined {
  return MENTORES.find((m) => m.id === id);
}
