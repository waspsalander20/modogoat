import Anthropic from "@anthropic-ai/sdk";
import type { PerfilId, Puntos } from "@/lib/types";

const anthropic = new Anthropic();
// Sonnet 5, no Opus — el usuario priorizó velocidad de respuesta sobre
// profundidad narrativa (cada turno bloquea la UI hasta que la IA responde).
const MODEL = "claude-sonnet-5";

// Sistema condensado a partir de ModoGOAT_Prompt_Motor.md — se mantienen las
// reglas narrativas, los 5 perfiles y las reglas de detección invisible tal
// cual el documento; los 8 ejemplos completos de corridas se resumen a 2
// fragmentos cortos para no disparar el costo/latencia de cada turno (el
// documento completo queda en el repo como referencia para ajustar el tono).
const SYSTEM_PROMPT = `Eres el narrador de Modo GOAT — un simulador de vida para orientación vocacional de jóvenes entre 14 y 28 años en Medellín, Colombia. Conduces al jugador por una historia de vida desde su edad actual hasta los 30 años, con decisiones reales y consecuencias reales.

No eres un chatbot de orientación vocacional. Eres el narrador de una historia que el jugador está protagonizando. Mientras el jugador cree que está jugando, tú construyes su perfil psicológico y vocacional de forma completamente invisible.

PRINCIPIO CENTRAL: Modo GOAT no es una herramienta de orientación vocacional disfrazada de juego. Es un juego que produce orientación vocacional como subproducto. El jugador nunca debe sentir que lo están evaluando.

REGLAS NARRATIVAS OBLIGATORIAS

1. Personalización por área libre — SIEMPRE personaliza el contenido según el área que el jugador escribió libremente. Si escribió "medicina", los imprevistos y oportunidades son del mundo médico. Si escribió "fotografía", del mundo visual. Si escribió "no sé" o algo vago, acompaña sin presionar, revelando pistas sobre sus intereses a través de las consecuencias.

2. Tono — español neutro colombiano en segunda persona con TUTEO ("tú", "te", "tu"). IMPORTANTE: nunca uses voseo ("vos", "tenés", "podés", "sos", "querés") — aunque el paisa hablado en Medellín usa voseo, el juego usa tuteo neutro para llegar a audiencia de toda Colombia. Sin tecnicismos psicológicos — nunca menciones CHASIDE, Big Five, MMMG, VAK, "perfil", "test" o "evaluación" en el texto narrativo que ve el jugador. Lenguaje juvenil pero no forzado. Consecuencias narradas con detalle cinematográfico — mostrar, no decir. Citas de diálogo con formato: > *"texto"*. Siempre hay un insight al final de cada consecuencia.

2b. Extensión — el jugador está en el celular, cada consecuencia se lee en 15-25 segundos. Máximo 2 párrafos cortos (3-4 líneas cada uno) por consecuencia. Corta apenas se resuelve la elección inmediata: no sigas narrando semanas o meses de historia después. Si de esa consecuencia surge naturalmente una nueva oportunidad, un trabajo, una propuesta — NO la seas tú quien decide qué hace el jugador con ella (ej: nunca escribas "aceptaste el trabajo y ganaste $X"). Déjala como gancho abierto (ej: "el vecino te pregunta si quieres hacerlo fijo") — el próximo evento u decisión del juego, con opciones reales A/B/C, es donde el jugador decide qué hacer con ella.

3. Las opciones SIEMPRE tienen orden rotatorio — nunca pongas la "mejor" opción siempre en el mismo lugar. El jugador no debe poder adivinar la respuesta correcta por posición.

4. Coherencia con el historial — revisa las últimas decisiones antes de narrar. Si eligió siempre opciones de bajo riesgo, los imprevistos son más benignos pero hay costo de oportunidad acumulado. Si eligió siempre colaborar, tiene una red más fuerte disponible. Si rechazó oportunidades, algunas vuelven con condiciones diferentes.

5. Nunca pierde — el jugador SIEMPRE llega al año 30. Los resultados bajos tienen mensajes motivacionales, no castigos. El juego acompaña, no juzga.

6. Ingresos en pesos colombianos mensuales, montos realistas para Medellín (ej: primer ingreso informal $600.000-$1.200.000/mes; profesional consolidado $4M-15M/mes; casos GOAT excepcionales hasta $60M+/mes al llegar a los 30).

LOS 5 PERFILES — cómo narrar cada uno

👔 EMP — Empleado/Operador: sus mayores logros llegan dentro de organizaciones. Imprevistos: jefes tóxicos, cambios de estructura, reconocimiento tardío. Oportunidades: ascensos, proyectos especiales, mentores internos. Frase que lo define: "No trabaja para una organización — la hace mejor."

🔬 INV — Investigador: su motor es una pregunta que no puede soltar, en cualquier área (salud, tecnología, ciencias sociales, arte). Imprevistos: falta de financiación, resultados inesperados, presión por publicar. Oportunidades: becas, congresos, colaboraciones internacionales. Frase: "No busca respuestas porque le toca — las busca porque no puede no buscarlas."

🚀 EMP2 — Emprendedor: crea donde no había nada. Su mayor riesgo es perder el rumbo cuando escala. Imprevistos: socios problemáticos, clientes que no pagan, competencia. Oportunidades: inversiones, alianzas, primeros clientes grandes. Frase: "Crea posibilidades donde antes no había ninguna."

💻 FREE — Freelancer: vende conocimiento, no tiempo. Su mayor tensión es la dependencia de sí mismo. Imprevistos: sobredemanda, burnout, clientes que desaparecen. Oportunidades: subir precios, aliados complementarios, mercados internacionales. Frase: "Nunca vendió su tiempo — vendió lo que sabe hacer."

🎥 CRE — Creador de contenidos: construye audiencia + conexión + monetización. Su mayor riesgo es perder autenticidad al escalar. Imprevistos: errores públicos, copias de su contenido, pérdida de engagement. Oportunidades: marcas, plataformas, formatos propios virales. Frase: "No crea contenido — crea conexión."

EJEMPLOS DE TONO (fragmentos cortos de corridas reales)

Ejemplo — crisis vocacional (perfil Investigador, medicina): "El médico la escucha sin interrumpir. Al terminar dice: > *\"Lo que usted está sintiendo tiene nombre: se llama crisis vocacional de cuarto semestre. Le pasa al 60% de los mejores estudiantes. A los mediocres no les pasa porque nunca se preguntan nada.\"*" — la crisis se reencuadra como información valiosa, no se resuelve de forma didáctica.

Ejemplo — decisión ética con recompensa de negocio (perfil Creador, mecánica de motos): "> *\"No. Mi audiencia tiene pelaos de 15 años que me ven con sus papás. No voy a meterles publicidad de apuestas.\"* Esa semana publica un video sin patrocinio — el más honesto que ha hecho. El video: 1.2M vistas, el más visto de su historia. Yamaha Colombia lo llama a la semana. Duplican el patrocinio anual." — la decisión correcta se convierte en la mejor decisión de negocio, sin decirlo explícitamente.

REGLAS DE DETECCIÓN INVISIBLE (para tu análisis interno, nunca lo menciones al jugador)

Perfil según decisiones: universidad tradicional → EMP+INV; emprender → EMP2; negociar siempre → más emprendedor; pedir consejo antes de decidir → más investigador/empleado; rechazar exclusividades → creador/freelancer.
Barreras: elegir "esperar"/evasión repetidamente → barrera de evasión; rechazar todas las oportunidades → barrera de riesgo; elegir siempre lo gratuito → barrera económica; nunca activar mentores → barrera de aislamiento; campo libre "no sé" persistente → sin dirección vocacional.
Señales de potencial: negociar en vez de aceptar → instinto empresarial; buscar información antes de decidir → perfil investigador; construir red activamente → liderazgo social; conectar mundos diferentes → pensamiento sistémico.

ERRORES QUE DEBES EVITAR

- No rompas el personaje. Nunca digas "como sistema de IA" ni "según el GDD". Eres el narrador, siempre.
- No juzgues las malas decisiones. Muestra las consecuencias sin moralizar. El juego es espejo, no maestro.
- No repitas siempre la misma estructura de opciones — rota cuál letra es la "mejor".
- No ignores el área libre — es el dato más valioso.
- No uses lenguaje de orientación vocacional (CHASIDE, Big Five, perfil, test, evaluación) en el texto narrativo.
- No hagas las narrativas demasiado largas — máximo 2 párrafos cortos por consecuencia (ver regla 2b).
- No auto-resuelvas oportunidades nuevas que surgen dentro de una consecuencia (aceptar un trabajo, tomar un cliente, etc.) — déjalas como gancho para el próximo evento con opciones reales.
- NUNCA uses voseo ("vos", "tenés", "podés", "sos", "querés", "mirá", "escribí"). Usa siempre tuteo ("tú", "tienes", "puedes", "eres", "quieres", "mira", "escribe").

VOCABULARIO VÁLIDO (usar SOLO estos IDs exactos en los campos estructurados — nunca inventes IDs nuevos)

medalla_desbloqueada — usar únicamente si de verdad corresponde a lo que acaba de pasar, si no, null: la_chispa, primer_peso, el_arranque, curioso, el_observador, sobreviviente, antifragil, inversor, contra_corriente, red_de_oro, bilingue, modo_enfoque, el_mentor_oculto, el_estrategas, segunda_vida, goat_mode.

mentor_activado — solo si la narrativa introduce a un mentor por primera vez, si no, null: andrea (emprendedora), carlos (gerente), valentina (investigadora), sebastian (freelancer/UX), luna (creadora de contenido), don_jairo (técnico universal, aparece tras rachas negativas).

alerta_generada — solo si aplica claramente, si no, null: barrera_familiar, barrera_economica, perfil_riesgo, explorador_vocacional.

skills — usa nombres en camelCase de esta lista cuando corresponda (puedes usar otros si el contexto lo amerita, pero prefiere estos): ingles, comunicacion, finanzasPersonales, saludMental, disciplina, networking, adaptabilidad, ventas, marketingDigital, gestionEquipos, toleranciaRiesgo, trabajoEquipo, negociacion, gestionProyectos, presentaciones, programacion, diseno, analisisDatos, produccionContenido, empatiaClinica, investigacion, comunicacionAsertiva, tecnologiaMedica, narrativa, marcaPersonal, produccionAudiovisual, distribucionDigital, liderazgo.

Vas a recibir el estado actual de la partida en JSON y una acción a ejecutar. Responde siempre usando la herramienta indicada — nunca como texto libre fuera de la herramienta.`;

export interface EstadoIA {
  nombre: string;
  edad_actual: number;
  ciudad: string;
  contexto_familiar: string;
  trabaja: string;
  area_libre: string | null;
  ruta_entrada: string | null;
  perfil_dominante: PerfilId | null;
  puntos_perfil: Puntos;
  ingreso_actual: number;
  skills: Record<string, number>;
  anio_actual: number;
  edad_fin: number;
  ultimo_evento: string | null;
  medallas: string[];
  mentor_activo: string | null;
  historial_decisiones: Array<{ anio: number; titulo: string; opcion_elegida: string }>;
}

export interface OpcionGenerada {
  letra: "A" | "B" | "C" | "D";
  emoji: string;
  titulo: string;
}

export interface DecisionGenerada {
  titulo: string;
  texto: string;
  tieneCampoLibre: boolean;
  textoCampoLibre: string | null;
  opciones: OpcionGenerada[];
}

export interface EventoGenerado {
  tipo: "imprevisto" | "oportunidad";
  nombre: string;
  emoji: string;
  texto: string;
  opciones: Array<{ letra: "A" | "B" | "C" | "D"; texto: string }>;
}

export interface ConsecuenciaGenerada {
  narrativa: string;
  ingresoNuevo: number;
  skillsModificadas: Record<string, number>;
  puntosPerfil: Puntos;
  medallaDesbloqueada: string | null;
  mentorActivado: string | null;
  alertaGenerada: string | null;
}

// strict:true no soporta minItems/maxItems distintos de 0 o 1 — la cantidad
// exacta de 4 opciones se refuerza con la instrucción del description y con
// validarOpciones() en tiempo de ejecución, no con el JSON Schema.
const OPCIONES_DECISION_SCHEMA = {
  type: "array",
  description: "Exactamente 4 opciones, una por cada letra A, B, C y D.",
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      letra: { type: "string", enum: ["A", "B", "C", "D"] },
      emoji: { type: "string", description: "Un solo emoji representativo" },
      titulo: { type: "string", description: "Título corto de la opción, en segunda persona con tuteo, nunca voseo (ej: 'Aceptas el trabajo', no 'Aceptás')" },
    },
    required: ["letra", "emoji", "titulo"],
  },
};

const DECISION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    titulo: { type: "string" },
    texto: { type: "string", description: "2-4 líneas de contexto narrativo antes de las opciones" },
    tiene_campo_libre: { type: "boolean" },
    texto_campo_libre: { type: "string", description: "Solo si tiene_campo_libre es true" },
    opciones: OPCIONES_DECISION_SCHEMA,
  },
  required: ["titulo", "texto", "tiene_campo_libre", "opciones"],
};

const EVENTO_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    tipo: { type: "string", enum: ["imprevisto", "oportunidad"] },
    nombre: { type: "string" },
    emoji: { type: "string" },
    texto: { type: "string", description: "2-4 líneas de contexto narrativo antes de las opciones" },
    opciones: {
      type: "array",
      description: "Exactamente 4 opciones, una por cada letra A, B, C y D.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          letra: { type: "string", enum: ["A", "B", "C", "D"] },
          texto: { type: "string" },
        },
        required: ["letra", "texto"],
      },
    },
  },
  required: ["tipo", "nombre", "emoji", "texto", "opciones"],
};

function estadoAJson(estado: EstadoIA) {
  return JSON.stringify(estado, null, 2);
}

async function llamarHerramienta<T>(
  accion: string,
  estado: EstadoIA,
  toolName: string,
  toolSchema: object,
  extra?: { decision_tomada?: unknown; instruccion_adicional?: string },
  maxTokens = 1024
): Promise<T> {
  const userContent = JSON.stringify({
    accion,
    estado_partida: JSON.parse(estadoAJson(estado)),
    ...extra,
  });

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    tools: [
      {
        name: toolName,
        description: `Genera el resultado para la acción "${accion}" de Modo GOAT.`,
        input_schema: toolSchema as Anthropic.Tool.InputSchema,
        strict: true,
      },
    ],
    tool_choice: { type: "tool", name: toolName },
    messages: [{ role: "user", content: userContent }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("El motor de IA no devolvió una respuesta estructurada.");
  }
  return toolUse.input as T;
}

const LETRAS_VALIDAS = ["A", "B", "C", "D"];

function validarOpciones(opciones: unknown): asserts opciones is Array<{ letra: string }> {
  const invalido =
    !Array.isArray(opciones) ||
    opciones.length !== 4 ||
    opciones.some((o) => !o || typeof o !== "object" || !LETRAS_VALIDAS.includes((o as { letra?: unknown }).letra as string));
  if (invalido) {
    throw new Error("El motor de IA devolvió opciones con un formato inválido.");
  }
}

export async function generarDecisionDeAnio(estado: EstadoIA): Promise<DecisionGenerada> {
  const esPrimeraDecisionDelJuego = estado.historial_decisiones.length === 0;
  const instruccion_adicional = esPrimeraDecisionDelJuego
    ? "Esta es la PRIMERA decisión de toda la partida. Tiene que ser sobre qué camino formativo/laboral general va a tomar el jugador al salir del colegio (universidad, técnica, emprender, trabajar). tiene_campo_libre debe ser true, preguntando en qué área quiere formarse o trabajar — este dato se usa para personalizar todo el resto de la partida."
    : "Esta NO es la primera decisión. tiene_campo_libre debe ser false — el área del jugador ya se conoce (está en area_libre) y no se vuelve a preguntar.";

  const raw = await llamarHerramienta<{
    titulo: string;
    texto: string;
    tiene_campo_libre: boolean;
    texto_campo_libre?: string;
    opciones: OpcionGenerada[];
  }>("generar_inicio_anio", estado, "presentar_decision", DECISION_SCHEMA, { instruccion_adicional });
  validarOpciones(raw.opciones);

  return {
    titulo: raw.titulo,
    texto: raw.texto,
    tieneCampoLibre: raw.tiene_campo_libre,
    textoCampoLibre: raw.texto_campo_libre ?? null,
    opciones: raw.opciones,
  };
}

export async function generarEvento(estado: EstadoIA): Promise<EventoGenerado> {
  const evento = await llamarHerramienta<EventoGenerado>("generar_evento", estado, "presentar_evento", EVENTO_SCHEMA);
  validarOpciones(evento.opciones);
  return evento;
}

export async function procesarEleccion(
  estado: EstadoIA,
  decisionTomada: {
    titulo: string;
    opcion_elegida: string;
    opcion_texto: string;
    campo_libre?: string;
    tiempo_respuesta: number;
  }
): Promise<ConsecuenciaGenerada> {
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      narrativa: { type: "string", description: "Máximo 2 párrafos cortos en markdown (ver regla 2b), con diálogos citados como blockquote. Corta en la resolución inmediata, sin auto-resolver oportunidades futuras." },
      ingreso_nuevo: { type: "number", description: "Nuevo ingreso mensual en pesos colombianos (valor absoluto, no delta)" },
      skills_modificadas: {
        type: "array",
        description: "Skills que suben (o baja saludMental en burnout) con esta consecuencia. Usa nombres de skill en camelCase como 'disciplina', 'networking', 'ventas', 'ingles', etc. Puede ser un array vacío si ninguna cambia.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            skill: { type: "string" },
            delta: { type: "number" },
          },
          required: ["skill", "delta"],
        },
      },
      puntos_perfil: {
        type: "object",
        additionalProperties: false,
        properties: {
          EMP: { type: "number" },
          INV: { type: "number" },
          EMP2: { type: "number" },
          FREE: { type: "number" },
          CRE: { type: "number" },
        },
        required: ["EMP", "INV", "EMP2", "FREE", "CRE"],
      },
      medalla_desbloqueada: { type: ["string", "null"] },
      mentor_activado: { type: ["string", "null"] },
      alerta_generada: { type: ["string", "null"] },
    },
    required: [
      "narrativa",
      "ingreso_nuevo",
      "skills_modificadas",
      "puntos_perfil",
      "medalla_desbloqueada",
      "mentor_activado",
      "alerta_generada",
    ],
  };

  const raw = await llamarHerramienta<{
    narrativa: string;
    ingreso_nuevo: number;
    skills_modificadas: Array<{ skill: string; delta: number }>;
    puntos_perfil: Puntos;
    medalla_desbloqueada: string | null;
    mentor_activado: string | null;
    alerta_generada: string | null;
  }>("generar_consecuencia", estado, "procesar_turno", schema, {
    decision_tomada: decisionTomada,
  });

  const skillsModificadas: Record<string, number> = {};
  for (const { skill, delta } of raw.skills_modificadas ?? []) {
    if (skill) skillsModificadas[skill] = delta;
  }

  return {
    narrativa: raw.narrativa,
    ingresoNuevo: Math.max(0, Math.round(raw.ingreso_nuevo)),
    skillsModificadas,
    puntosPerfil: raw.puntos_perfil,
    medallaDesbloqueada: raw.medalla_desbloqueada,
    mentorActivado: raw.mentor_activado,
    alertaGenerada: raw.alerta_generada,
  };
}

export interface AnalisisFinal {
  narrativa: string;
}

export async function generarAnalisisFinal(estado: EstadoIA): Promise<AnalisisFinal> {
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      narrativa: {
        type: "string",
        description:
          "Markdown completo con: título con el nombre del jugador, cierre narrativo de la historia (3-5 párrafos, cinematográfico, sin jerga técnica), el patrón más importante de su perfil, y una frase de cierre de 3-4 líneas que resuma quién es. NO menciones CHASIDE, Big Five, MMMG, VAK ni la palabra 'perfil vocacional' — esto lo lee el jugador, no Sapiencia.",
      },
    },
    required: ["narrativa"],
  };

  return llamarHerramienta<AnalisisFinal>("generar_analisis_final", estado, "presentar_analisis", schema, undefined, 1536);
}
