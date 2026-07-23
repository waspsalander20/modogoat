import type { Evento } from "@/lib/types";

export const BANCO_IMPREVISTOS: Evento[] = [
  {
    id: "abuso_poder", nombre: "El abuso de poder", emoji: "⚠️",
    texto: "Tu jefe, supervisor o socio te pide que 'colaborés' con una suma mensual para mantenerte en el trabajo o conseguir algo que necesitás.",
    perfilesPreferentes: ["EMP", "FREE"], universal: false, edadMinima: 17, edadMaxima: 25,
    opciones: [
      { letra: "A", texto: "Pagás — necesitás el trabajo", consecuencia: "Ingresos pero sin dignidad. El monto sube el próximo mes.", skillsModifica: { disciplina: -1 }, ingresoModifica: -200000 },
      { letra: "B", texto: "Te vas — eso no está bien", consecuencia: "Perdés el ingreso pero ganás autorespeto.", skillsModifica: { adaptabilidad: 1, networking: 1 }, ingresoModifica: -900000 },
      { letra: "C", texto: "Lo reportás", consecuencia: "Proceso largo. Puede costarte el trabajo igual.", skillsModifica: { comunicacionAsertiva: 2 }, ingresoModifica: 0 },
      { letra: "D", texto: "Lo ignorás y seguís", consecuencia: "El problema no desaparece — regresa más grande.", skillsModifica: {}, ingresoModifica: 0 },
    ],
  },
  {
    id: "accidente_enfermedad", nombre: "El accidente o enfermedad", emoji: "🏥",
    texto: "Vos o alguien cercano enfrenta un problema de salud que para todo temporalmente.",
    perfilesPreferentes: [], universal: true, edadMinima: 18, edadMaxima: 28,
    opciones: [
      { letra: "A", texto: "Parás todo y te atendés — la salud primero", consecuencia: "Perdés momentum pero te recuperás bien.", skillsModifica: { saludMental: 1 }, ingresoModifica: -500000 },
      { letra: "B", texto: "Seguís trabajando aunque no estés bien", consecuencia: "A corto plazo funciona. A mediano plazo se complica.", skillsModifica: { saludMental: -1 }, ingresoModifica: 0 },
      { letra: "C", texto: "Delegás mientras te recuperás", consecuencia: "Aprendés a soltar el control.", skillsModifica: { gestionEquipos: 2 }, ingresoModifica: -200000 },
      { letra: "D", texto: "No le decís a nadie y te aguantás", consecuencia: "El problema se agrava.", skillsModifica: { saludMental: -2 }, ingresoModifica: 0 },
    ],
  },
  {
    id: "trampa_ingles", nombre: "La trampa del inglés", emoji: "🇬🇧",
    texto: "Una oportunidad grande llega — trabajo, contrato, alianza — pero requiere inglés que no tenés.",
    perfilesPreferentes: ["INV", "EMP", "FREE"], universal: false, edadMinima: 18, edadMaxima: 25, apareceSiempre: true,
    opciones: [
      { letra: "A", texto: "Vas igual — improvisás en el momento", skillsModifica: { ingles: 1, toleranciaRiesgo: 1 }, ingresoModifica: 0 },
      { letra: "B", texto: "Estudiás intensivo antes de ir", skillsModifica: { ingles: 2, disciplina: 1 }, ingresoModifica: 0 },
      { letra: "C", texto: "Llevás a alguien que sí sabe inglés", skillsModifica: { networking: 1 }, ingresoModifica: -300000 },
      { letra: "D", texto: "Rechazás — no te sentís listo", consecuencia: "Costo de oportunidad visible en pesos.", skillsModifica: {}, ingresoModifica: 0, mostrarCostoOportunidad: true },
    ],
  },
  {
    id: "error_publico", nombre: "El error público", emoji: "😳",
    texto: "Cometiste un error que la gente vio — en redes, en el trabajo, con un cliente. Hay consecuencias públicas.",
    perfilesPreferentes: ["CRE", "FREE"], universal: false, edadMinima: 18, edadMaxima: 28,
    opciones: [
      { letra: "A", texto: "Lo reconocés públicamente — transparencia total", skillsModifica: { marcaPersonal: 2, comunicacion: 1 }, ingresoModifica: 0 },
      { letra: "B", texto: "Verificás primero si el error es real antes de responder", skillsModifica: { investigacion: 1 }, ingresoModifica: 0 },
      { letra: "C", texto: "No decís nada — esperás que pase", skillsModifica: {}, ingresoModifica: 0 },
      { letra: "D", texto: "Te defendés — sentís que no fue tu culpa", skillsModifica: { marcaPersonal: -1 }, ingresoModifica: 0 },
    ],
  },
  {
    id: "te_enganaron", nombre: "Te engañaron", emoji: "🚨",
    texto: "Alguien en quien confiaste — socio, proveedor, cliente — te engañó. Perdiste tiempo, dinero o los dos.",
    perfilesPreferentes: ["EMP2", "FREE"], universal: false, edadMinima: 19, edadMaxima: 27,
    opciones: [
      { letra: "A", texto: "Buscás solución legal o formal", skillsModifica: { finanzasPersonales: 1 }, ingresoModifica: -500000 },
      { letra: "B", texto: "Negociás directamente — recuperás lo que podás", skillsModifica: { negociacion: 1 }, ingresoModifica: -300000 },
      { letra: "C", texto: "Aceptás la pérdida y aprendés — due diligence siempre", skillsModifica: { investigacion: 2 }, ingresoModifica: -1000000 },
      { letra: "D", texto: "Reaccionás con rabia — lo confrontás sin plan", skillsModifica: { comunicacion: -1 }, ingresoModifica: -500000 },
    ],
  },
  {
    id: "sobredemanda", nombre: "La sobredemanda", emoji: "🔥",
    texto: "Tu negocio o trabajo creció más rápido de lo que podés manejar. Tenés más de lo que podés cumplir.",
    perfilesPreferentes: ["FREE", "CRE", "EMP2"], universal: false, edadMinima: 20, edadMaxima: 27,
    opciones: [
      { letra: "A", texto: "Buscás ayuda — contratás o delegás", skillsModifica: { gestionEquipos: 2 }, ingresoModifica: 500000 },
      { letra: "B", texto: "Lo hacés solo aunque te cueste", skillsModifica: { saludMental: -1 }, ingresoModifica: 1000000 },
      { letra: "C", texto: "Decís que no a clientes nuevos — calidad sobre cantidad", skillsModifica: { marcaPersonal: 1 }, ingresoModifica: 0 },
      { letra: "D", texto: "Subís precios — menos clientes, mejor pagados", skillsModifica: { ventas: 1, marcaPersonal: 1 }, ingresoModifica: 500000 },
    ],
  },
  {
    id: "burnout", nombre: "El burnout", emoji: "😮‍💨",
    texto: "Llevas meses trabajando sin parar. Tu cuerpo y tu mente empiezan a pasar la cuenta.",
    perfilesPreferentes: [], universal: true, edadMinima: 21, edadMaxima: 28,
    opciones: [
      { letra: "A", texto: "Parás — te tomás el tiempo que necesitás", skillsModifica: { saludMental: 2 }, ingresoModifica: -500000 },
      { letra: "B", texto: "Seguís con más café — no podés parar ahora", skillsModifica: { saludMental: -2 }, ingresoModifica: 0 },
      { letra: "C", texto: "Delegás para aligerar la carga", skillsModifica: { gestionEquipos: 2, saludMental: 1 }, ingresoModifica: -300000 },
      { letra: "D", texto: "Cambiás de ritmo — no parás pero bajás la velocidad", skillsModifica: { saludMental: 1, disciplina: 1 }, ingresoModifica: -200000 },
    ],
  },
  {
    id: "crisis_economica", nombre: "La crisis económica externa", emoji: "📉",
    texto: "Algo que no controlás — una crisis, un cambio de mercado — afecta directamente tus ingresos.",
    perfilesPreferentes: [], universal: true, edadMinima: 20, edadMaxima: 29,
    opciones: [
      { letra: "A", texto: "Te adaptás — buscás cómo ser útil en el nuevo contexto", skillsModifica: { adaptabilidad: 2 }, ingresoModifica: -300000 },
      { letra: "B", texto: "Usás tus ahorros — aguantás hasta que pase", skillsModifica: { finanzasPersonales: -1 }, ingresoModifica: -500000 },
      { letra: "C", texto: "Buscás aliados — en crisis es mejor estar acompañado", skillsModifica: { networking: 2 }, ingresoModifica: -200000 },
      { letra: "D", texto: "Te paralizás — esperás que vuelva la normalidad", skillsModifica: {}, ingresoModifica: -800000 },
    ],
  },
  {
    id: "presion_familiar", nombre: "La presión familiar", emoji: "👨‍👩‍👧",
    texto: "Tu familia no entiende o no apoya el camino que elegiste. Hay tensión en casa.",
    perfilesPreferentes: ["EMP2", "CRE", "FREE"], universal: false, edadMinima: 17, edadMaxima: 22,
    opciones: [
      { letra: "A", texto: "Les mostrás los números — la evidencia habla", skillsModifica: { comunicacion: 2 }, ingresoModifica: 0 },
      { letra: "B", texto: "Seguís solo — no necesitás su aprobación", skillsModifica: { toleranciaRiesgo: 1 }, ingresoModifica: 0 },
      { letra: "C", texto: "Buscás un punto medio — les das seguridad mientras construís", skillsModifica: { disciplina: 1 }, ingresoModifica: 0 },
      { letra: "D", texto: "Cedés — elegís lo que ellos quieren", consecuencia: "Sin conflicto familiar. Posible insatisfacción a largo plazo.", skillsModifica: {}, ingresoModifica: 300000, alertaGenerada: "barrera_familiar" },
    ],
  },
  {
    id: "crisis_confianza", nombre: "La crisis de confianza", emoji: "😔",
    texto: "Cometiste un error grande o alguien hizo que pareciera que lo cometiste. Tu reputación está en juego.",
    perfilesPreferentes: ["CRE", "EMP"], universal: false, edadMinima: 20, edadMaxima: 28,
    opciones: [
      { letra: "A", texto: "Enfrentás la situación públicamente — con evidencia y calma", skillsModifica: { comunicacionAsertiva: 2 }, ingresoModifica: 0 },
      { letra: "B", texto: "Investigás qué pasó exactamente antes de hablar", skillsModifica: { investigacion: 1 }, ingresoModifica: 0 },
      { letra: "C", texto: "Buscás aliados que den fe de tu reputación", skillsModifica: { networking: 2 }, ingresoModifica: 0 },
      { letra: "D", texto: "Esperás en silencio a que pase", skillsModifica: {}, ingresoModifica: -300000 },
    ],
  },
  {
    id: "oportunidad_trampa", nombre: "La oportunidad trampa", emoji: "⚡",
    texto: "Te ofrecen algo que parece increíble — demasiado bueno para ser verdad. Mucha plata, poco esfuerzo, urgencia para decidir.",
    perfilesPreferentes: [], universal: true, edadMinima: 19, edadMaxima: 28,
    opciones: [
      { letra: "A", texto: "Investigás antes de comprometerte", skillsModifica: { investigacion: 2 }, ingresoModifica: 0 },
      { letra: "B", texto: "Aceptás — la oportunidad no espera", consecuencia: "Puede ser real o puede ser estafa. 50/50.", skillsModifica: { toleranciaRiesgo: 1 }, ingresoModifica: 0, resultado: "aleatorio" },
      { letra: "C", texto: "Consultás con alguien de confianza antes", skillsModifica: { networking: 1 }, ingresoModifica: 0 },
      { letra: "D", texto: "Rechazás — si parece demasiado bueno algo está mal", skillsModifica: {}, ingresoModifica: 0 },
    ],
  },
  {
    id: "cambio_reglas", nombre: "El cambio de reglas", emoji: "📋",
    texto: "Las condiciones del trabajo, negocio o mercado cambian sin avisarte — nuevas leyes, nuevo jefe, nueva política.",
    perfilesPreferentes: ["EMP", "INV"], universal: false, edadMinima: 20, edadMaxima: 28,
    opciones: [
      { letra: "A", texto: "Te adaptás — buscás cómo funcionar en el nuevo contexto", skillsModifica: { adaptabilidad: 2 }, ingresoModifica: 0 },
      { letra: "B", texto: "Negociás — buscás que las nuevas reglas te afecten menos", skillsModifica: { negociacion: 1 }, ingresoModifica: 0 },
      { letra: "C", texto: "Te vas — esas no son las reglas bajo las que querés trabajar", skillsModifica: { adaptabilidad: 1 }, ingresoModifica: -500000 },
      { letra: "D", texto: "Lo aceptás sin cuestionar — necesitás la estabilidad", skillsModifica: {}, ingresoModifica: 0 },
    ],
  },
];
