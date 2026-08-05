// Nombres legibles de cada alerta — compartido entre el dashboard
// institucional (app/dashboard/page.tsx) y el informe comparativo del
// jugador (app/juego/jugador/[jugadorId]/informe), para no duplicar el
// mapa en dos lugares.
export const NOMBRES_ALERTA: Record<string, string> = {
  alta_empleabilidad: "Alta empleabilidad",
  emprendedor_solido: "Emprendedor sólido",
  freelancer_solido: "Freelancer sólido",
  creador_solido: "Creador sólido",
  investigador_solido: "Investigador sólido",
  perfil_beca: "Perfil para beca",
  perfil_riesgo: "Perfil en riesgo",
  explorador_vocacional: "Explorador vocacional",
  barrera_economica: "Barrera económica",
  barrera_familiar: "Barrera familiar",
  barrera_evasion: "Estilo evasivo (decisiones)",
  desarrollo_autodirigido: "Desarrollo autodirigido",
};
