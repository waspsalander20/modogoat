import type { Mentor } from "@/lib/types";

export const MENTORES: Mentor[] = [
  {
    id: "andrea", nombre: "Andrea", emoji: "🚀",
    perfil: "Emprendedora — fundadora de marca con presencia en 4 países",
    perfilDominante: "EMP2", condicion: "sobrevivio_fracaso_o_cambio_ruta",
    mision: "Antes de terminar este año necesitás tres cosas: un sistema de costos real, un precio que sostenga el crecimiento y una proyección de cuánto podés vender el próximo año sin quebrarte.",
    recompensaCompletada: { skillsModifica: { finanzasPersonales: 2, gestionProyectos: 1 } },
  },
  {
    id: "carlos", nombre: "Carlos", emoji: "👔",
    perfil: "Gerente general — 25 años en empresas, vivió en 7 países",
    perfilDominante: "EMP", condicion: "lleva_2_anios_mismo_trabajo",
    mision: "En los próximos 6 meses tomá al menos 3 decisiones grandes consultando a tu equipo antes de decidir — no después. Y vení a contarme cómo te fue.",
    recompensaCompletada: { skillsModifica: { liderazgo: 2, comunicacion: 2 } },
  },
  {
    id: "valentina", nombre: "Valentina", emoji: "🔬",
    perfil: "Investigadora — PhD en universidad internacional, trabaja en políticas públicas",
    perfilDominante: "INV", condicion: "invirtio_en_skills_investigacion_2_anios",
    mision: "Este año publicá un paper o un informe con los resultados de tu investigación. No lo respondas — solo definilo bien y encontrá a alguien que te ayude a formalizarlo.",
    recompensaCompletada: { skillsModifica: { investigacion: 2, comunicacion: 2 } },
  },
  {
    id: "sebastian", nombre: "Sebastián", emoji: "💻",
    perfil: "Diseñador UX freelance — trabaja desde Medellín para empresas en Europa",
    perfilDominante: "FREE", condicion: "tiene_al_menos_1_cliente_propio",
    mision: "Subí tus precios un 80% en el próximo mes. Si perdés clientes, los precios estaban bien. Si no los perdés — acabás de doblar tus ingresos sin hacer nada diferente.",
    recompensaCompletada: { skillsModifica: { ventas: 2, marcaPersonal: 2 } },
  },
  {
    id: "luna", nombre: "Luna", emoji: "🎥",
    perfil: "Creadora de contenido educativo — 2M de seguidores",
    perfilDominante: "CRE", condicion: "tiene_contenido_publicado_o_audiencia_creciente",
    mision: "Este año creá un formato de contenido propio — una serie que puedas producir cada semana sin depender de nada externo. Que sea tuyo. Que funcione aunque no pase nada.",
    recompensaCompletada: { skillsModifica: { produccionContenido: 1, marcaPersonal: 2, distribucionDigital: 1 } },
  },
  {
    id: "don_jairo", nombre: "Don Jairo", emoji: "🧓",
    perfil: "Técnico universal — lleva 22 años resolviendo lo que otros no pueden",
    perfilDominante: "cualquiera", condicion: "2_imprevistos_negativos_seguidos_o_ingreso_bajo_2_anios",
    mision: "Hacé lo mismo que rechazaste hace poco. Pero ahora con rabia — que es mejor combustible que la calma.",
    recompensaCompletada: { skillsModifica: { disciplina: 1, adaptabilidad: 1 } },
    prioridad: true,
  },
];
