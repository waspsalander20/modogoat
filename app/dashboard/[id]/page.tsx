import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatoPesos } from "@/lib/format";
import { nombreSkill } from "@/lib/data/skills";
import { medalla } from "@/lib/data/medallas";
import { calcularCostoUsd } from "@/lib/aiCost";

// TRM aproximada solo para mostrar una referencia en pesos — no es una tasa
// en vivo, ajustar si se vuelve muy vieja. El costo real que Anthropic
// factura siempre es en USD.
const TRM_APROX_COP = 4000;
const MULTIPLICADOR_PRECIO_SUGERIDO = 5;

export default async function DashboardIndividualPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const partida = await prisma.partida.findUnique({
    where: { id },
    include: { jugador: true, decisiones: { orderBy: { anio: "asc" } }, eventos: { orderBy: { anio: "asc" } } },
  });

  if (!partida) notFound();

  const skillsFinales = (partida.skillsFinales as Record<string, number>) ?? {};

  const costoUsd = calcularCostoUsd({
    inputTokens: partida.tokensInput,
    outputTokens: partida.tokensOutput,
    cacheWriteTokens: partida.tokensCacheWrite,
    cacheReadTokens: partida.tokensCacheRead,
  });
  const costoCop = costoUsd * TRM_APROX_COP;
  const precioSugeridoCop = costoCop * MULTIPLICADOR_PRECIO_SUGERIDO;

  return (
    <main className="flex flex-1 flex-col px-6 py-10 max-w-2xl mx-auto w-full gap-6">
      <Link href="/dashboard" className="text-goat-accent-solid text-sm font-bold">
        ← Volver
      </Link>

      <header>
        <h1 className="text-2xl font-extrabold">{partida.jugador.nombre}</h1>
        <p className="text-goat-ink-muted text-sm">
          {partida.jugador.edad} años · {partida.jugador.ciudad} · {partida.jugador.contexto} · trabaja: {partida.jugador.trabaja}
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-extrabold mb-3">Resultado</h2>
          <Row label="Resultado" value={partida.resultadoTipo ?? "—"} />
          <Row label="Perfil dominante" value={partida.perfilDominante ?? "—"} />
          <Row label="Perfil secundario" value={partida.perfilSecundario ?? "—"} />
          <Row label="Es mixto" value={partida.esMixto ? "Sí" : "No"} />
          <Row label="Ingreso final" value={partida.ingresoFinal !== null ? `${formatoPesos(partida.ingresoFinal)}/mes` : "—"} />
          <Row label="Ahorros" value={formatoPesos(partida.ahorros)} />
        </div>

        <div className="card p-5">
          <h2 className="font-extrabold mb-3">Puntos de perfil</h2>
          {Object.entries(partida.puntosPerfil as Record<string, number>).map(([perfil, puntos]) => (
            <Row key={perfil} label={perfil} value={puntos.toString()} />
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-extrabold mb-3">Costo de IA (real)</h2>
        <Row label="Costo real" value={`US$ ${costoUsd.toFixed(4)} · ${formatoPesos(Math.round(costoCop))} (aprox.)`} />
        <Row label={`Precio sugerido (x${MULTIPLICADOR_PRECIO_SUGERIDO})`} value={formatoPesos(Math.round(precioSugeridoCop))} />
        <Row
          label="Tokens (in / out / caché escr. / caché lect.)"
          value={`${partida.tokensInput.toLocaleString("es-CO")} / ${partida.tokensOutput.toLocaleString("es-CO")} / ${partida.tokensCacheWrite.toLocaleString("es-CO")} / ${partida.tokensCacheRead.toLocaleString("es-CO")}`}
        />
      </div>

      {partida.areaLibre && (
        <div className="card p-5">
          <h2 className="font-extrabold mb-2">Área que escribió</h2>
          <p className="text-sm">&ldquo;{partida.areaLibre}&rdquo;</p>
        </div>
      )}

      {Object.keys(skillsFinales).length > 0 && (
        <div className="card p-5">
          <h2 className="font-extrabold mb-3">Skills finales</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(skillsFinales)
              .filter(([, v]) => v > 0)
              .map(([skill, nivel]) => (
                <span key={skill} className="text-xs bg-goat-surface-2 border border-goat-border rounded-full px-3 py-1.5">
                  {nombreSkill(skill)} · Nv.{nivel}
                </span>
              ))}
          </div>
        </div>
      )}

      {partida.medallasGanadas.length > 0 && (
        <div className="card p-5">
          <h2 className="font-extrabold mb-3">Medallas</h2>
          <div className="flex flex-wrap gap-3">
            {partida.medallasGanadas.map((mid) => {
              const m = medalla(mid);
              return m ? (
                <span key={mid} className="text-xs bg-goat-surface-2 border border-goat-border rounded-full px-3 py-1.5">
                  {m.emoji} {m.nombre}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {partida.alertas.length > 0 && (
        <div className="card p-5">
          <h2 className="font-extrabold mb-3">Alertas</h2>
          <div className="flex flex-wrap gap-2">
            {partida.alertas.map((a) => (
              <span key={a} className="text-xs bg-goat-accent-tint text-goat-accent-solid border border-goat-accent-solid/40 rounded-full px-3 py-1.5">
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card p-5">
        <h2 className="font-extrabold mb-3">Decisiones tomadas</h2>
        <div className="flex flex-col gap-3 text-sm">
          {partida.decisiones.map((d) => (
            <div key={d.id} className="border-b border-goat-border/50 pb-3">
              <div className="flex justify-between">
                <span className="font-bold">
                  Año {d.anio} · {d.titulo || d.decisionId}
                </span>
                <span className="text-goat-ink-muted text-xs">
                  Opción {d.opcionElegida} · {d.tiempoRespuesta.toFixed(1)}s
                </span>
              </div>
              {d.opcionTexto && <p className="text-goat-ink-muted mt-1">{d.opcionTexto}</p>}
            </div>
          ))}
        </div>
      </div>

      {partida.eventos.length > 0 && (
        <div className="card p-5">
          <h2 className="font-extrabold mb-3">Eventos vividos</h2>
          <div className="flex flex-col gap-3 text-sm">
            {partida.eventos.map((e) => (
              <div key={e.id} className="border-b border-goat-border/50 pb-3">
                <div className="flex justify-between">
                  <span className="font-bold">
                    Año {e.anio} · {e.nombre || e.eventoId}{" "}
                    <span className="font-normal text-goat-ink-muted">({e.tipoEvento})</span>
                  </span>
                  <span className="text-goat-ink-muted text-xs">
                    Opción {e.opcionElegida} · {e.tiempoRespuesta.toFixed(1)}s
                  </span>
                </div>
                {e.opcionTexto && <p className="text-goat-ink-muted mt-1">{e.opcionTexto}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-goat-ink-muted">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
