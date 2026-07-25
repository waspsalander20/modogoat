import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PREGUNTAS_ONBOARDING } from "@/lib/data/onboarding";
import { detectarTroll } from "@/lib/deteccionTroll";
import { calcularPerfil } from "@/lib/perfilamiento";
import { PUNTOS_VACIOS, type Puntos } from "@/lib/types";
import { sanitizarTextoLibre } from "@/lib/sanitizarTexto";

interface CrearPartidaBody {
  nombre: string;
  edad: number;
  genero: string;
  ciudad: string;
  contexto: string;
  trabaja: string;
  respuestas: Record<string, string>;
  tiempos: Record<string, number>;
  areaLibre?: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CrearPartidaBody;

  if (
    !body.nombre?.trim() ||
    !Number.isInteger(body.edad) ||
    body.edad < 14 ||
    body.edad > 28 ||
    !body.genero ||
    !body.contexto ||
    !body.trabaja ||
    !body.respuestas ||
    Object.keys(body.respuestas).length !== PREGUNTAS_ONBOARDING.length
  ) {
    return NextResponse.json({ error: "Datos de onboarding incompletos" }, { status: 400 });
  }

  const deteccion = detectarTroll(body.respuestas, body.tiempos ?? {});

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

  const jugador = await prisma.jugador.create({
    data: {
      nombre: body.nombre.trim(),
      edad: body.edad,
      genero: body.genero,
      ciudad: body.ciudad?.trim() || "Medellín",
      contexto: body.contexto,
      trabaja: body.trabaja,
    },
  });

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
      edadInicio: body.edad,
      edadActual: body.edad,
      ingresoActual: 0,
      skills: {},
      estado: "jugando",
      tiempoPromedio: deteccion.tiempoPromedio,
      patronTroll: deteccion.patronRepetido,
    },
  });

  return NextResponse.json({
    partidaId: partida.id,
    esTroll: deteccion.esTroll,
  });
}
