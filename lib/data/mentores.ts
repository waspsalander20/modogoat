interface MentorInfo {
  id: string;
  nombre: string;
  emoji: string;
  perfil: string;
  imagen: string;
  frase: string;
}

// Solo para mostrarle al jugador quién apareció — la interacción en sí la
// escribe la IA en la narrativa (ver mentor_activado en lib/aiMotor.ts).
const MENTORES: MentorInfo[] = [
  {
    id: "andrea",
    nombre: "Andrea",
    emoji: "🚀",
    perfil: "Emprendedora",
    imagen: "/mentor-andrea.png",
    frase:
      "No esperes el plan perfecto para arrancar, el mercado te lo corrige gratis. Lanza rápido, escucha rápido — el que se demora pensando pierde el cliente que sí se atrevió.",
  },
  {
    id: "carlos",
    nombre: "Carlos",
    emoji: "👔",
    perfil: "Gerente",
    imagen: "/mentor-carlos.png",
    frase:
      "Un buen gerente no tiene todas las respuestas, tiene las preguntas correctas para su equipo. Delega con confianza — micro-manejar mata la iniciativa antes de que nazca.",
  },
  {
    id: "valentina",
    nombre: "Valentina",
    emoji: "🔬",
    perfil: "Investigadora",
    imagen: "/mentor-valentina.png",
    frase:
      "La pregunta mal hecha te da una respuesta que no sirve para nada. Duda de lo obvio, mide dos veces — la ciencia premia al paciente, no al que tiene prisa.",
  },
  {
    id: "sebastian",
    nombre: "Sebastián",
    emoji: "💻",
    perfil: "Freelancer / UX",
    imagen: "/mentor-sebastian.png",
    frase:
      "Uno no programa contra la máquina, programa contra el tiempo. Guarda como si el compu se fuera a apagar en cualquier momento — porque se va a apagar.",
  },
  {
    id: "luna",
    nombre: "Luna",
    emoji: "🎥",
    perfil: "Creadora de contenido",
    imagen: "/mentor-luna.png",
    frase:
      "El algoritmo no premia al que espera el video perfecto, premia al que publica seguido. Constancia le gana a la perfección — sube el video, aprende del dato, ajusta.",
  },
  {
    id: "don_jairo",
    nombre: "Don Jairo",
    emoji: "🔧",
    perfil: "Técnico universal",
    imagen: "/mentor-jairo.png",
    frase:
      "Antes de cambiar la pieza, entiende por qué se dañó, si no, la nueva se va a dañar igual. El que arregla rápido dura poco; el que entiende, dura toda la vida.",
  },
];

export function mentor(id: string): MentorInfo | undefined {
  return MENTORES.find((m) => m.id === id);
}
