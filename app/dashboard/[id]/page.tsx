import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatoPesos } from "@/lib/format";
import { nombreSkill } from "@/lib/data/skills";
import { medalla } from "@/lib/data/medallas";
import { BANCO_DECISIONES } from "@/lib/data/decisiones";

export default async function DashboardIndividualPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const partida = await prisma.partida.findUnique({
    where: { id },
    include: { jugador: true, decisiones: { orderBy: { anio: "asc" } }, eventos: { orderBy: { anio: "asc" } } },
  });

  if (!partida) notFound();

  const skillsFinales = (partida.skillsFinales as Record<string, number>) ?? {};

  return (
    <main className="flex flex-1 flex-col px-6 py-10 max-w-2xl mx-auto w-full gap-6">
      <Link href="/dashboard" className="text-goat-accent text-sm font-bold">
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
              <span key={a} className="text-xs bg-goat-accent/15 text-goat-accent border border-goat-accent/40 rounded-full px-3 py-1.5">
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card p-5">
        <h2 className="font-extrabold mb-3">Decisiones tomadas</h2>
        <div className="flex flex-col gap-2 text-sm">
          {partida.decisiones.map((d) => {
            const decisionInfo = BANCO_DECISIONES.find((dec) => dec.id === d.decisionId);
            return (
              <div key={d.id} className="flex justify-between border-b border-goat-border/50 pb-2">
                <span>
                  Año {d.anio} · {decisionInfo?.titulo ?? d.decisionId}
                </span>
                <span className="text-goat-ink-muted">
                  Opción {d.opcionElegida} · {d.tiempoRespuesta.toFixed(1)}s
                </span>
              </div>
            );
          })}
        </div>
      </div>
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
