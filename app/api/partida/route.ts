import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PREGUNTAS_ONBOARDING } from "@/lib/data/onboarding";
import { detectarTroll } from "@/lib/deteccionTroll";
import { calcularPerfil } from "@/lib/perfilamiento";
import { PUNTOS_VACIOS, type Puntos } from "@/lib/types";
import { sanitizarTextoLibre, sanitizarDatoCorto } from "@/lib/sanitizarTexto";
import { normalizarPais } from "@/lib/data/paises";
import { getJugadorSesion } from "@/lib/jugadorSesion";

interface CrearPartidaBody {
  edad?: number;
  genero?: string;
  ciudad?: string;
  pais?: string;
  programaSlug?: string;
  contexto?: string;
  trabaja?: string;
  yaTieneCarrera?: boolean;
  respuestas: Record<string, string>;
  tiempos: Record<string, number>;
  areaLibre?: string;
}

export async function POST(request: NextRequest) {
  // El proxy (ver proxy.ts) ya exige sesión para llegar a /juego/onboarding
  // — esta es la segunda capa, la que de verdad importa para este endpoint
  // (ver docs de Next.js: nunca confiar solo en el proxy dentro de un
  // Server Function).
  const jugador = await getJugadorSesion();
  if (!jugador) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as CrearPartidaBody;

  if (!body.respuestas || Object.keys(body.respuestas).length !== PREGUNTAS_ONBOARDING.length) {
    return NextResponse.json({ error: "Datos de onboarding incompletos" }, { status: 400 });
  }

  // Primera partida de esta cuenta: edad/genero/ciudad/contexto/trabaja
  // todavía no existen y vienen en el body. De la segunda en adelante, esos
  // datos ya están guardados en la cuenta y se reusan tal cual — no se
  // le vuelven a pedir al jugador (ver OnboardingWizard.tsx).
  const esPrimeraPartida = jugador.edad === null;

  if (esPrimeraPartida) {
    if (
      !body.ciudad?.trim() ||
      !Number.isInteger(body.edad) ||
      (body.edad as number) < 14 ||
      (body.edad as number) > 28 ||
      !body.genero ||
      !body.contexto ||
      !body.trabaja
    ) {
      return NextResponse.json({ error: "Datos de onboarding incompletos" }, { status: 400 });
    }
  }

  const deteccion = detectarTroll(body.respuestas, body.tiempos ?? {});

  // Si la partida viene de un link institucional (?programa=cep-andino), el
  // programa pre-llena el país en vez de que el jugador tenga que elegirlo
  // — pero Jugador.pais sigue siendo la fuente de verdad (ver lib/data/paises.ts),
  // no una referencia indirecta a través del programa.
  const programa = body.programaSlug
    ? await prisma.programa.findUnique({ where: { slug: body.programaSlug } })
    : null;

  let puntosPerfil: Puntos = { ...PUNTOS_VACIOS };
  for (const pregunta of PREGUNTAS_ONBOARDING) {
    const letra = body.respuestas[pregunta.id];
    const puntos = pregunta.puntos[letra];
    if (puntos) {
      puntosPerfil = {
        EMP: puntosPerfil.EMP + puntos.EMP,
        INV: puntosPerfil.INV + puntos.INV,
        EMP2: puntosPerfil.EMP2 + puntos.EMP2,
        FREE: puntosPerfil.FREE + puntos.FREE,
        CRE: puntosPerfil.CRE + puntos.CRE,
      };
    }
  }

  const perfil = calcularPerfil(puntosPerfil);

  const edad = esPrimeraPartida ? (body.edad as number) : jugador.edad!;
  const genero = esPrimeraPartida ? (body.genero as string) : jugador.genero!;
  const ciudad = esPrimeraPartida ? sanitizarDatoCorto(body.ciudad)! : jugador.ciudad;
  const contexto = esPrimeraPartida ? (body.contexto as string) : jugador.contexto!;
  const trabaja = esPrimeraPartida ? (body.trabaja as string) : jugador.trabaja!;
  const pais = esPrimeraPartida ? normalizarPais(programa?.pais ?? body.pais) : normalizarPais(jugador.pais);

  // yaTieneCarrera se persiste apenas se responde una vez, sin importar si
  // es la primera partida — la pregunta solo se hace (ver OnboardingWizard.tsx)
  // mientras jugador.yaTieneCarrera siga en null, así que si llega en el
  // body es porque de verdad tocaba preguntarla.
  const actualizacionesJugador: Record<string, unknown> = {};
  if (esPrimeraPartida) {
    Object.assign(actualizacionesJugador, {
      edad,
      genero,
      ciudad,
      pais,
      contexto,
      trabaja,
      programaId: programa?.id ?? jugador.programaId,
    });
  }
  if (typeof body.yaTieneCarrera === "boolean" && jugador.yaTieneCarrera === null) {
    actualizacionesJugador.yaTieneCarrera = body.yaTieneCarrera;
  }
  if (Object.keys(actualizacionesJugador).length > 0) {
    await prisma.jugador.update({ where: { id: jugador.id }, data: actualizacionesJugador });
  }

  const partida = await prisma.partida.create({
    data: {
      jugadorId: jugador.id,
      respuestasOnboarding: body.respuestas,
      tiemposOnboarding: body.tiempos ?? {},
      areaLibre: sanitizarTextoLibre(body.areaLibre),
      puntosPerfil,
      perfilDominante: perfil.dominante,
      perfilSecundario: perfil.secundario,
      esMixto: perfil.esMixto,
      edadInicio: edad,
      edadActual: edad,
      ingresoActual: 0,
      skills: {},
      estado: "jugando",
      tiempoPromedio: deteccion.tiempoPromedio,
      // patronTroll es el único campo persistido que fin-anio y generarAlertas
      // leen como "es troll" — tiene que guardar la señal completa (esTroll),
      // no solo el patrón repetido. Antes guardaba deteccion.patronRepetido y
      // perdía silenciosamente la señal de "respondió demasiado rápido".
      patronTroll: deteccion.esTroll,
    },
  });

  return NextResponse.json({
    partidaId: partida.id,
    esTroll: deteccion.esTroll,
  });
}
