import { prisma } from "@/lib/prisma";
import type { BigFive } from "@/lib/bigFive";
import { normalizarPais, type PaisId } from "@/lib/data/paises";
import type { PerfilId } from "@/lib/types";
import { clasificarAreaLibre } from "@/lib/data/carrerasDemanda";

const RASGOS_BIG_FIVE: (keyof BigFive)[] = [
  "apertura",
  "responsabilidad",
  "extraversion",
  "amabilidad",
  "estabilidadEmocional",
];

const PERFILES: PerfilId[] = ["EMP", "INV", "EMP2", "FREE", "CRE"];

const BIG_FIVE_VACIO: BigFive = { apertura: 0, responsabilidad: 0, extraversion: 0, amabilidad: 0, estabilidadEmocional: 0 };

function promediarBigFive(suma: BigFive, cantidad: number): BigFive {
  if (cantidad === 0) return { ...BIG_FIVE_VACIO };
  const promedio = { ...BIG_FIVE_VACIO };
  for (const rasgo of RASGOS_BIG_FIVE) promedio[rasgo] = Math.round(suma[rasgo] / cantidad);
  return promedio;
}

// Lunes de la semana ISO que contiene `fecha` — clave estable para agrupar
// partidas por semana sin depender de librerías extra.
function inicioDeSemana(fecha: Date): string {
  const d = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
  const diaSemana = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - diaSemana + 1);
  return d.toISOString().slice(0, 10);
}

export async function getEstadisticasPoblacionales(pais?: PaisId, programaId?: string) {
  const programas = await prisma.programa.findMany({ orderBy: { nombre: "asc" } });

  const partidas = await prisma.partida.findMany({
    where: {
      estado: "terminado",
      ...(pais ? { jugador: { pais } } : {}),
      ...(programaId ? { jugador: { programaId } } : {}),
    },
    include: { jugador: { include: { programa: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const totalPartidas = partidas.length;
  const jugadoresUnicos = new Set(partidas.map((p) => p.jugadorId)).size;

  const distribucionPerfiles: Record<string, number> = { EMP: 0, INV: 0, EMP2: 0, FREE: 0, CRE: 0 };
  const alertasPorTipo: Record<string, number> = {};
  const areasLibresConteo = new Map<string, number>();
  let goatCount = 0;
  const sumaBigFive: BigFive = { ...BIG_FIVE_VACIO };
  let conBigFive = 0;

  // Segmentación por perfil dominante (2 ago 2026) — un promedio global de
  // Big Five o un conteo de alertas mezcla perfiles muy distintos entre sí
  // (ej. tolerancia al riesgo de un EMP2 vs. la de un EMP). Se acumula por
  // separado para poder mostrar "Big Five de los EMP2" vs. "de los INV", no
  // solo un número poblacional plano.
  const sumaBigFivePorPerfil = new Map<PerfilId, { suma: BigFive; cantidad: number }>();
  const alertasPorPerfil = new Map<PerfilId, Record<string, number>>();
  const semanas = new Map<string, { partidas: number; goat: number }>();

  // Cruce con carreras de alta demanda laboral (2 ago 2026) — mismo criterio
  // que ya usa PRONABEC (Beca 18, Perú) para dar puntaje adicional en su
  // proceso real de selección: si area_libre matchea una carrera de alta
  // demanda oficial (OLE en Colombia, Encuesta de Demanda Ocupacional en
  // Perú), cuenta. Match por palabra clave sobre texto libre — aproximado,
  // no una clasificación oficial, se etiqueta así en la UI.
  const demandaPorCategoria = new Map<string, number>();
  let conAreaLibre = 0;
  let enAltaDemanda = 0;

  for (const p of partidas) {
    const perfil = p.perfilDominante as PerfilId | null;
    if (perfil && perfil in distribucionPerfiles) {
      distribucionPerfiles[perfil]++;
    }
    for (const alerta of p.alertas) {
      alertasPorTipo[alerta] = (alertasPorTipo[alerta] ?? 0) + 1;
      if (perfil) {
        const conteo = alertasPorPerfil.get(perfil) ?? {};
        conteo[alerta] = (conteo[alerta] ?? 0) + 1;
        alertasPorPerfil.set(perfil, conteo);
      }
    }
    if (p.areaLibre) {
      const clave = p.areaLibre.trim().toLowerCase();
      areasLibresConteo.set(clave, (areasLibresConteo.get(clave) ?? 0) + 1);

      conAreaLibre++;
      const categoria = clasificarAreaLibre(p.areaLibre, normalizarPais(p.jugador.pais));
      if (categoria) {
        enAltaDemanda++;
        demandaPorCategoria.set(categoria, (demandaPorCategoria.get(categoria) ?? 0) + 1);
      }
    }
    const esGoat = p.resultadoTipo === "goat";
    if (esGoat) goatCount++;
    if (p.bigFive) {
      const bf = p.bigFive as unknown as BigFive;
      for (const rasgo of RASGOS_BIG_FIVE) sumaBigFive[rasgo] += bf[rasgo] ?? 0;
      conBigFive++;
      if (perfil) {
        const entrada = sumaBigFivePorPerfil.get(perfil) ?? { suma: { ...BIG_FIVE_VACIO }, cantidad: 0 };
        for (const rasgo of RASGOS_BIG_FIVE) entrada.suma[rasgo] += bf[rasgo] ?? 0;
        entrada.cantidad++;
        sumaBigFivePorPerfil.set(perfil, entrada);
      }
    }

    const semana = inicioDeSemana(p.createdAt);
    const entradaSemana = semanas.get(semana) ?? { partidas: 0, goat: 0 };
    entradaSemana.partidas++;
    if (esGoat) entradaSemana.goat++;
    semanas.set(semana, entradaSemana);
  }

  const bigFivePromedio = promediarBigFive(sumaBigFive, conBigFive);

  const bigFivePorPerfil = PERFILES.map((perfil) => {
    const entrada = sumaBigFivePorPerfil.get(perfil);
    return {
      perfil,
      cantidad: entrada?.cantidad ?? 0,
      bigFive: promediarBigFive(entrada?.suma ?? BIG_FIVE_VACIO, entrada?.cantidad ?? 0),
    };
  });

  const alertasPorPerfilLista = PERFILES.map((perfil) => ({
    perfil,
    alertas: alertasPorPerfil.get(perfil) ?? {},
  })).filter((p) => Object.keys(p.alertas).length > 0);

  const tendenciaSemanal = Array.from(semanas.entries())
    .map(([semana, { partidas: cantidad, goat }]) => ({ semana, partidas: cantidad, goat }))
    .sort((a, b) => a.semana.localeCompare(b.semana))
    .slice(-12);

  const areasLibresMasFrecuentes = Array.from(areasLibresConteo.entries())
    .map(([area, cantidad]) => ({ area, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10);

  const demandaLaboral = {
    conAreaLibre,
    enAltaDemanda,
    porcentaje: conAreaLibre > 0 ? enAltaDemanda / conAreaLibre : 0,
    porCategoria: Array.from(demandaPorCategoria.entries())
      .map(([categoria, cantidad]) => ({ categoria, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad),
  };

  const listaPartidas = partidas.map((p) => ({
    id: p.id,
    nombre: p.jugador.nombre,
    // Cualquier jugador con una partida ya pasó por el onboarding que llena
    // edad — nunca queda null en la práctica en este punto.
    edad: p.jugador.edad!,
    ciudad: p.jugador.ciudad,
    pais: p.jugador.pais,
    programa: p.jugador.programa?.nombre ?? null,
    perfilDominante: p.perfilDominante,
    resultadoTipo: p.resultadoTipo,
    ingresoFinal: p.ingresoFinal,
    areaLibre: p.areaLibre,
    createdAt: p.createdAt,
  }));

  return {
    programas: programas.map((prog) => ({ id: prog.id, nombre: prog.nombre, pais: prog.pais })),
    totalPartidas,
    jugadoresUnicos,
    distribucionPerfiles,
    demandaLaboral,
    areasLibresMasFrecuentes,
    alertasPorTipo,
    alertasPorPerfil: alertasPorPerfilLista,
    tasaGoatMode: totalPartidas > 0 ? goatCount / totalPartidas : 0,
    bigFivePromedio,
    bigFivePorPerfil,
    conBigFive,
    tendenciaSemanal,
    partidas: listaPartidas,
  };
}

export type EstadisticasPoblacionales = Awaited<ReturnType<typeof getEstadisticasPoblacionales>>;
