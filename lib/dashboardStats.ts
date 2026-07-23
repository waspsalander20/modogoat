import { prisma } from "@/lib/prisma";

export async function getEstadisticasPoblacionales() {
  const partidas = await prisma.partida.findMany({
    where: { estado: "terminado" },
    include: { jugador: true },
    orderBy: { updatedAt: "desc" },
  });

  const totalPartidas = partidas.length;
  const jugadoresUnicos = new Set(partidas.map((p) => p.jugadorId)).size;

  const distribucionPerfiles: Record<string, number> = { EMP: 0, INV: 0, EMP2: 0, FREE: 0, CRE: 0 };
  const alertasPorTipo: Record<string, number> = {};
  const areasLibresConteo = new Map<string, number>();
  let goatCount = 0;

  for (const p of partidas) {
    if (p.perfilDominante && p.perfilDominante in distribucionPerfiles) {
      distribucionPerfiles[p.perfilDominante]++;
    }
    for (const alerta of p.alertas) {
      alertasPorTipo[alerta] = (alertasPorTipo[alerta] ?? 0) + 1;
    }
    if (p.areaLibre) {
      const clave = p.areaLibre.trim().toLowerCase();
      areasLibresConteo.set(clave, (areasLibresConteo.get(clave) ?? 0) + 1);
    }
    if (p.resultadoTipo === "goat") goatCount++;
  }

  const areasLibresMasFrecuentes = Array.from(areasLibresConteo.entries())
    .map(([area, cantidad]) => ({ area, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10);

  const listaPartidas = partidas.map((p) => ({
    id: p.id,
    nombre: p.jugador.nombre,
    edad: p.jugador.edad,
    ciudad: p.jugador.ciudad,
    perfilDominante: p.perfilDominante,
    resultadoTipo: p.resultadoTipo,
    ingresoFinal: p.ingresoFinal,
    areaLibre: p.areaLibre,
    createdAt: p.createdAt,
  }));

  return {
    totalPartidas,
    jugadoresUnicos,
    distribucionPerfiles,
    areasLibresMasFrecuentes,
    alertasPorTipo,
    tasaGoatMode: totalPartidas > 0 ? goatCount / totalPartidas : 0,
    partidas: listaPartidas,
  };
}

export type EstadisticasPoblacionales = Awaited<ReturnType<typeof getEstadisticasPoblacionales>>;
