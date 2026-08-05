import type { PerfilId } from "@/lib/types";

export const TEXTOS_FINAL: Record<PerfilId, string> = {
  EMP: `Llegaste a los 30.

Nunca pusiste tu nombre en una empresa. Nunca tuviste socios. Nunca arriesgaste tu propio capital.

Y aun así construiste algo que impacta a personas reales, en lugares reales, todos los días.

Eso es lo que hace un líder desde adentro: no trabaja para una organización. La hace mejor.

Con paciencia. Con método. Con el equipo.

Eso también es GOAT MODE.`,
  INV: `Llegaste a los 30.

Empezaste con una pregunta. Solo una.

Y no paraste hasta tener la respuesta — aunque nadie te lo pidiera, aunque el camino fuera más largo de lo que esperabas, aunque hubiera momentos en que dudaste si valía la pena.

Valía la pena.

Eso es lo que hace un investigador de verdad: no busca respuestas porque le toca. Las busca porque no puede no buscarlas.

Eso eres tú.`,
  EMP2: `Llegaste a los 30.

Empezaste con $0 y una idea que nadie más veía todavía.

Hubo momentos en que todo indicaba que te detuvieras. Y no te detuviste.

No porque fueras el más inteligente ni el más preparado. Sino porque tenías algo que no se aprende en ningún lado: la certeza de que si no lo hacías tú, nadie más lo iba a hacer.

Eso es lo que hace un emprendedor de verdad. No crea empresas.

Crea posibilidades donde antes no había ninguna.`,
  FREE: `Llegaste a los 30.

Nunca tuviste un jefe que te dijera qué hacer.
Nunca tuviste un horario que alguien más diseñó para ti.
Nunca vendiste tu tiempo — vendiste lo que sabes hacer.

Eso tiene un precio que va más allá del dinero: la libertad de decir que no. De elegir con quién trabajas. De hacer las cosas a tu manera aunque sea más difícil.

Y lo más importante — llegaste a los 30 siendo exactamente quien quisiste ser.

Eso no lo logra cualquiera.`,
  CRE: `Llegaste a los 30.

Empezaste hablándole a nadie. A 43 seguidores. A una cámara en un cuarto.

Y nunca traicionaste a las personas que te escucharon desde el principio — cuando no tenías nada que ofrecerles excepto lo que eras.

Eso es lo más difícil de hacer cuando el mundo te ofrece plata para ser otra cosa.

Un creador de verdad no crea contenido.

Crea conexión. Y la conexión que construiste — esa no se puede comprar ni copiar.`,
};

export const TEXTO_FINAL_MIXTO = (textoPerfil1: string, textoPerfil2: string) => `Llegaste a los 30 siendo las dos cosas al mismo tiempo.

${textoPerfil1}

Y también:

${textoPerfil2}

Eso no es contradicción — es complejidad. Y la gente compleja es la que más le aporta al mundo.`;

export const MENSAJES_RESULTADO: Record<"medio" | "bajo" | "troll", string> = {
  medio: `Llegaste a los 30.

No fue el camino más fácil — ni el más directo. Pero llegaste.

Hay cosas que construiste que no aparecen en estos números: lo que aprendiste cuando algo salió mal, las personas que conociste, las decisiones que te enseñaron más que cualquier acierto.

En la vida real — a diferencia del juego — no hay un año 30 que lo resuma todo. Todavía tienes tiempo.

¿Qué pasaría si lo intentaras de otra forma?`,
  bajo: `Esta partida fue difícil.

Hubo momentos en que el camino se cerró — y momentos en que tú mismo lo cerraste sin darte cuenta. Eso también pasa.

Lo más valioso que puedes sacar de esta partida no es el resultado — es reconocer en qué momento dejaste de elegir y empezaste a dejar que las cosas pasaran.

Porque esa es la diferencia real: no entre los que tienen suerte y los que no. Sino entre los que eligen y los que esperan.

Todavía puedes elegir.`,
  troll: `Llegaste al año 30.

Esta no fue tu mejor partida — y probablemente lo sabes.

No pasa nada. El juego no te juzga.

Pero hay una pregunta que vale la pena hacerse: ¿qué hubiera pasado si hubieras elegido diferente?

La próxima partida puede ser completamente distinta. Solo tienes que querer que lo sea.`,
};

// Se seleccionan con detectarBarreraPrincipal (lib/perfilamiento.ts) según
// las alertas de la partida — la más específica que aplique, no todas a la
// vez. "miedo_riesgo" queda sin trigger propio todavía (el concepto
// "rechazar oportunidades" nunca se conectó a un ID de alerta real, mismo
// tipo de cable suelto que tenía "barrera_evasion" antes del 2 ago 2026) —
// se deja escrito para cuando se cierre ese hueco, no se borra.
export const MENSAJES_BARRERA: Record<string, string> = {
  evasion_sistematica: `Notamos algo en tu partida: en los momentos más importantes, elegiste esperar.

Esperar no siempre es malo. Pero cuando se convierte en el patrón — cuando siempre es "después", "cuando esté listo", "cuando las condiciones sean mejores" — el después nunca llega.

El momento perfecto no existe. Solo existe este momento — y lo que decides hacer con él.`,
  miedo_riesgo: `En esta partida rechazaste varias oportunidades que podrían haber cambiado tu historia.

No porque no las vieras — sino porque el riesgo se sentía más grande que la posibilidad.

Eso es completamente normal. El cerebro humano está diseñado para protegerte — no para hacerte crecer.

La buena noticia: el riesgo se entrena. Y este juego es exactamente el lugar para hacerlo — donde equivocarse no cuesta nada real.`,
  dependencia_economica: `Tu personaje llegó a los 30 ganando poco — no porque no pudiera ganar más, sino porque nunca invirtió en sí mismo.

Cada vez que apareció la opción de formarte, de subir una skill, de apostar por tu desarrollo — elegiste la seguridad inmediata.

La seguridad de hoy y la libertad de mañana casi nunca viven en la misma decisión.

¿Qué pasaría si en la próxima partida invirtieras aunque diera miedo?`,
  aislamiento: `Tu personaje construyó todo solo.

Eso tiene algo admirable — la autonomía, la independencia, no depender de nadie.

Pero también tiene un costo: el que va solo llega más rápido al techo de lo que puede hacer una sola persona.

Los que llegaron más lejos en este juego no fueron los más talentosos — fueron los que supieron a quién pedirle ayuda y cuándo.

En la próxima partida — prueba no ir solo.`,
  // Nuevo (2 ago 2026) — corresponde a la alerta barrera_evasion (regla 7c,
  // aiMotor.ts), grounded en el estilo "evasivo" del General
  // Decision-Making Style (Scott & Bruce, 1995): procrastinar y postergar
  // la decisión, no solo "esperar" en general (eso ya lo cubre
  // evasion_sistematica, que es sobre quedarse estancado sin avanzar).
  estilo_evasivo: `Notamos un patrón en cómo decidiste: varias veces, frente a algo importante, elegiste postergarlo.

No fue indecisión de una sola vez — fue un estilo que se repitió: la opción de dejarlo para después, de esperar "más claridad", de no cerrar todavía.

Postergar de vez en cuando es normal. Pero cuando se vuelve el default, el costo real no es la decisión que evitaste — son todas las que dejaste de tomar mientras esperabas el momento perfecto.

En la próxima partida — prueba decidir un poco antes de sentirte listo.`,
  sin_direccion: `Tu personaje probó varios caminos.

Eso no está mal — a veces hay que probar para saber. Pero en algún punto probar sin elegir se convierte en otra forma de no elegir.

¿Hay algo que siempre quisiste hacer pero nunca te permitiste tomar en serio? Algo que cuando lo ves en otros te genera algo — admiración, envidia sana, curiosidad.

Eso que sientes es información.

En la próxima partida — dale una oportunidad a eso.`,
};

// Fallback cuando detectarBarreraPrincipal no encuentra ninguna barrera
// clara — la mayoría de partidas no tienen un patrón problemático marcado,
// así que "próximos pasos" no puede depender solo de MENSAJES_BARRERA.
export const MENSAJE_PROXIMOS_PASOS_GENERICO = `Esta partida ya terminó, pero la pregunta que la generó sigue abierta: ¿esto se parece a lo que de verdad quieres construir?

Investiga en serio sobre lo que escribiste al empezar. Habla con alguien que ya esté trabajando en eso — nadie te lo va a explicar mejor que quien ya lo vive. Y presta atención a qué decisiones de esta partida se sintieron más como tú.

Ese patrón — no el resultado — es lo más real que te llevas.`;

export const MENSAJE_INTERVENCION = {
  titulo: "Notamos que respondiste muy rápido",
  texto: "Eso está bien — pero Modo GOAT funciona mejor cuando las respuestas son honestas. El juego no te califica ni te juzga. Solo construye tu historia según lo que tú digas.",
  opcionA: "✅ Sí, las reviso — quiero que sea real",
  opcionB: "🚀 No, arranca — así está bien",
};

export const MENSAJE_FINAL_TROLL = {
  titulo: "Llegaste al año 30",
  texto: "Esta no fue tu mejor partida — y probablemente lo sabes. No pasa nada. El juego no te juzga. Pero hay una pregunta que vale la pena hacerse: ¿qué hubiera pasado si hubieras elegido diferente?",
  boton: "🔄 Jugar en serio esta vez",
};
