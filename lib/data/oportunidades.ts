import type { Evento } from "@/lib/types";

export const BANCO_OPORTUNIDADES: Evento[] = [
  {
    id: "contacto_inesperado", nombre: "El contacto inesperado", emoji: "📩",
    texto: "Alguien que admirás o que tiene más experiencia que vos te escribe o te busca. No esperabas ese contacto.",
    perfilesPreferentes: [], universal: true, apareceDespuesDe: "logro_visible",
    opciones: [
      { letra: "A", texto: "Respondés rápido y proponés reunión", skillsModifica: { networking: 2 } },
      { letra: "B", texto: "Investigás quién es antes de responder", skillsModifica: { networking: 1, investigacion: 1 } },
      { letra: "C", texto: "Lo dejás para después — no tenés tiempo ahora", skillsModifica: {}, ventanaSeCierra: true },
      { letra: "D", texto: "No respondés — desconfiás", skillsModifica: {}, ventanaSeCierra: true },
    ],
  },
  {
    id: "reconocimiento_publico", nombre: "El reconocimiento público", emoji: "🏆",
    texto: "Alguien habla bien de vos en público — en redes, en un evento, con personas influyentes.",
    perfilesPreferentes: ["CRE", "INV"], universal: false,
    opciones: [
      { letra: "A", texto: "Lo aprovechás — publicás, te movés, aprovechás el momentum", skillsModifica: { marcaPersonal: 2, networking: 1 } },
      { letra: "B", texto: "Lo agradecés pero seguís con tu ritmo", skillsModifica: { marcaPersonal: 1 } },
      { letra: "C", texto: "No hacés nada — te da pena el protagonismo", skillsModifica: {} },
      { letra: "D", texto: "Lo usás para abrir una conversación específica", skillsModifica: { networking: 2 } },
    ],
  },
  {
    id: "beca_subsidio", nombre: "La beca o el subsidio", emoji: "🎓",
    texto: "Aparece una oportunidad de formación gratuita o subsidiada que normalmente costaría mucho.",
    perfilesPreferentes: ["INV", "EMP"], universal: false, edadMaxima: 24,
    opciones: [
      { letra: "A", texto: "Aplicás inmediatamente", skillsModifica: { disciplina: 1 } },
      { letra: "B", texto: "Investigás si realmente vale la pena antes de aplicar", skillsModifica: { investigacion: 1 } },
      { letra: "C", texto: "Lo dejás para después — el plazo cierra", skillsModifica: {}, ventanaSeCierra: true },
      { letra: "D", texto: "No aplicás — no tenés tiempo", skillsModifica: {}, ventanaSeCierra: true },
    ],
  },
  {
    id: "mentor_inesperado", nombre: "El mentor inesperado", emoji: "🧭",
    texto: "Alguien con mucha más experiencia que vos muestra interés genuino en ayudarte — sin pedir nada a cambio.",
    perfilesPreferentes: [], universal: true, apareceCuando: "perfil_consolidado",
    opciones: [
      { letra: "A", texto: "Aceptás — la experiencia ajena es el atajo más honesto", skillsModifica: {}, resultado: "mentor_activado" },
      { letra: "B", texto: "Aceptás con cautela — querés entender sus motivaciones primero", skillsModifica: {}, resultado: "mentor_activado_lento" },
      { letra: "C", texto: "Rechazás — preferís aprender solo", skillsModifica: {}, ventanaSeCierra: true },
      { letra: "D", texto: "Lo dejás para después", skillsModifica: {}, ventanaSeCierra: true },
    ],
  },
  {
    id: "proyecto_grande", nombre: "El proyecto grande", emoji: "🚀",
    texto: "Te ofrecen participar en algo significativamente más grande que lo que manejaste hasta ahora.",
    perfilesPreferentes: ["EMP2", "EMP", "INV"], universal: false,
    opciones: [
      { letra: "A", texto: "Aceptás sin dudar — los saltos grandes requieren valentía", skillsModifica: { liderazgo: 2, toleranciaRiesgo: 1 } },
      { letra: "B", texto: "Aceptás pero pedís apoyo — no vas solo", skillsModifica: { networking: 1, gestionEquipos: 1 } },
      { letra: "C", texto: "Pedís tiempo para prepararte antes de comprometerte", skillsModifica: { disciplina: 1 } },
      { letra: "D", texto: "Rechazás — no te sentís listo", skillsModifica: {}, ventanaSeCierra: true, mostrarCostoOportunidad: true },
    ],
  },
  {
    id: "alianza_estrategica", nombre: "La alianza estratégica", emoji: "🤝",
    texto: "Alguien con recursos complementarios a los tuyos propone trabajar juntos.",
    perfilesPreferentes: ["EMP2", "FREE"], universal: false,
    opciones: [
      { letra: "A", texto: "Aceptás — la complementariedad multiplica", skillsModifica: { networking: 2 } },
      { letra: "B", texto: "Hacés due diligence primero", skillsModifica: { investigacion: 2 } },
      { letra: "C", texto: "Proponés condiciones claras antes de arrancar", skillsModifica: { negociacion: 2 } },
      { letra: "D", texto: "Rechazás — preferís seguir solo", skillsModifica: {} },
    ],
  },
  {
    id: "exposicion_internacional", nombre: "La exposición internacional", emoji: "🌍",
    texto: "Tu trabajo llega a alguien fuera de Colombia — una persona, empresa o institución de otro país muestra interés.",
    perfilesPreferentes: ["INV", "CRE", "FREE"], universal: false,
    opciones: [
      { letra: "A", texto: "Lo perseguís activamente — respondés, proponés, avanzás", skillsModifica: { networking: 2, ingles: 1, marcaPersonal: 1 } },
      { letra: "B", texto: "Buscás a alguien que te ayude a manejarlo", skillsModifica: { networking: 1 } },
      { letra: "C", texto: "Te preparás primero — especialmente el inglés", skillsModifica: { ingles: 2 } },
      { letra: "D", texto: "Lo dejás pasar — no te sentís listo para lo internacional", skillsModifica: {}, ventanaSeCierra: true, mostrarCostoOportunidad: true },
    ],
  },
  {
    id: "recurso_inesperado", nombre: "El recurso inesperado", emoji: "💰",
    texto: "Llega dinero, tiempo o un recurso que no esperabas — un bono, un premio, un ahorro que se liberó.",
    perfilesPreferentes: [], universal: true,
    opciones: [
      { letra: "A", texto: "Lo invertís en tu desarrollo — curso, herramienta, certificación", skillsModifica: { disciplina: 1 } },
      { letra: "B", texto: "Lo invertís en tu proyecto o negocio", skillsModifica: { toleranciaRiesgo: 1 }, ingresoModifica: 500000 },
      { letra: "C", texto: "Lo guardás — preferís tener respaldo", skillsModifica: { finanzasPersonales: 1 } },
      { letra: "D", texto: "Lo disfrutás — te lo merecés", skillsModifica: { saludMental: 1 } },
    ],
  },
  {
    id: "referido_poderoso", nombre: "El referido poderoso", emoji: "📣",
    texto: "Alguien de tu red te recomienda con una persona o institución importante. Llegan por vos sin que hayas hecho nada.",
    perfilesPreferentes: [], universal: true, apareceDespuesDe: "red_construida",
    opciones: [
      { letra: "A", texto: "Lo aprovechás inmediatamente", skillsModifica: { networking: 1, ventas: 1 } },
      { letra: "B", texto: "Investigás antes de reunirte", skillsModifica: { investigacion: 1 } },
      { letra: "C", texto: "Agradecés al que te recomendó primero", skillsModifica: { networking: 2 } },
      { letra: "D", texto: "Lo dejás para después", skillsModifica: {}, ventanaSeCierra: true },
    ],
  },
  {
    id: "reconocimiento_institucional", nombre: "El reconocimiento institucional", emoji: "🏛️",
    texto: "Una institución — universidad, empresa, gobierno — reconoce formalmente tu trabajo o te invita a participar en algo oficial.",
    perfilesPreferentes: ["INV", "EMP"], universal: false,
    opciones: [
      { letra: "A", texto: "Aceptás — la validación institucional abre puertas", skillsModifica: { networking: 2, marcaPersonal: 1 } },
      { letra: "B", texto: "Proponés algo más — si te invitan es porque te necesitan", skillsModifica: { negociacion: 1 } },
      { letra: "C", texto: "Investigás qué implica antes de comprometerte", skillsModifica: { investigacion: 1 } },
      { letra: "D", texto: "Rechazás — no te interesa la validación externa", skillsModifica: {} },
    ],
  },
  {
    id: "segundo_intento", nombre: "El segundo intento", emoji: "🔄",
    texto: "Algo que rechazaste o perdiste antes vuelve a aparecer — una oportunidad que creías cerrada regresa.",
    perfilesPreferentes: [], universal: true, soloSiRechazoAntes: true,
    opciones: [
      { letra: "A", texto: "Aceptás esta vez — aprendiste la lección", skillsModifica: {}, medallaSecretaPosible: "segunda_vida" },
      { letra: "B", texto: "Evaluás si las condiciones cambiaron antes de decidir", skillsModifica: { investigacion: 1 } },
      { letra: "C", texto: "Negociás mejor esta vez — tenés más experiencia", skillsModifica: { negociacion: 2 } },
      { letra: "D", texto: "Rechazás de nuevo — tu posición no cambió", skillsModifica: {}, ventanaSeCierra: true },
    ],
  },
  {
    id: "cliente_aliado_sonado", nombre: "El cliente o aliado soñado", emoji: "⭐",
    texto: "Aparece la persona, empresa o institución con la que siempre quisiste trabajar — y muestran interés genuino en vos.",
    perfilesPreferentes: ["EMP2", "FREE", "CRE"], universal: false,
    opciones: [
      { letra: "A", texto: "Te lanzás — preparado o no", skillsModifica: { ventas: 1, toleranciaRiesgo: 1 } },
      { letra: "B", texto: "Te preparás intensamente antes de la reunión", skillsModifica: { disciplina: 2 } },
      { letra: "C", texto: "Buscás a alguien que te conecte mejor con ellos", skillsModifica: { networking: 2 } },
      { letra: "D", texto: "Esperás a estar más listo", skillsModifica: {}, ventanaSeCierra: true },
    ],
  },
  {
    id: "plataforma_medio", nombre: "La plataforma o el medio", emoji: "📢",
    texto: "Un medio, plataforma o espacio con audiencia grande quiere darte visibilidad — una entrevista, un artículo, una invitación a hablar.",
    perfilesPreferentes: ["CRE", "INV"], universal: false,
    opciones: [
      { letra: "A", texto: "Aceptás — la visibilidad construye marca", skillsModifica: { marcaPersonal: 2, networking: 1 } },
      { letra: "B", texto: "Preparás muy bien lo que vas a decir antes", skillsModifica: { comunicacion: 2 } },
      { letra: "C", texto: "Proponés algo más específico — tenés algo concreto que compartir", skillsModifica: { comunicacionAsertiva: 1 } },
      { letra: "D", texto: "Rechazás — te da pena o miedo la exposición", skillsModifica: {}, ventanaSeCierra: true },
    ],
  },
  {
    id: "upgrade_skills", nombre: "El upgrade de skills", emoji: "📈",
    texto: "Aparece la posibilidad de subir un nivel en algo que ya sabés hacer — no aprender desde cero sino llevar algo bueno a excelente.",
    perfilesPreferentes: [], universal: true, apareceCuando: "skill_en_nivel_3_4",
    opciones: [
      { letra: "A", texto: "La tomás — siempre hay un siguiente nivel", skillsModifica: { disciplina: 1 } },
      { letra: "B", texto: "Evaluás si es el momento correcto", skillsModifica: { investigacion: 1 } },
      { letra: "C", texto: "Proponés hacer algo con esa skill mejorada inmediatamente", skillsModifica: { ventas: 1 } },
      { letra: "D", texto: "Lo dejás para después", skillsModifica: {} },
    ],
  },
  {
    id: "cierre_circulo", nombre: "El cierre del círculo", emoji: "⭕",
    texto: "Algo que empezaste hace años — una idea, un proyecto, una relación — regresa y cobra sentido de una forma que no esperabas.",
    perfilesPreferentes: [], universal: true, edadMinima: 27, edadMaxima: 30,
    opciones: [
      { letra: "A", texto: "Lo retomás — ahora tenés lo que antes no tenías", skillsModifica: {}, medallaSecretaPosible: "segunda_vida" },
      { letra: "B", texto: "Lo reencuadrás — no lo retomás igual sino evolucionado", skillsModifica: { adaptabilidad: 2 } },
      { letra: "C", texto: "Lo compartís con alguien que puede hacerlo mejor que vos", skillsModifica: { networking: 1 } },
      { letra: "D", texto: "Lo dejás ir — ese capítulo ya cerró", skillsModifica: {} },
    ],
  },
];
