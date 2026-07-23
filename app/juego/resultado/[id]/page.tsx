import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { prisma } from "@/lib/prisma";
import { formatoPesos } from "@/lib/format";
import { nombreSkill, emojiSkill } from "@/lib/data/skills";
import { medalla } from "@/lib/data/medallas";
import { MENSAJES_RESULTADO } from "@/lib/data/mensajes";
import { NOMBRES_PERFIL } from "@/lib/data/perfiles";
import type { PerfilId } from "@/lib/types";

const TITULOS_RESULTADO: Record<string, string> = {
  goat: "🐐 GOAT MODE",
  alto: "🌟 Resultado alto",
  medio: "📊 Llegaste a los 30",
  bajo: "🌱 Llegaste a los 30",
  troll: "🪞 Llegaste a los 30",
};

export default async function ResultadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const partida = await prisma.partida.findUnique({
    where: { id },
    include: { jugador: true },
  });

  if (!partida || partida.estado !== "terminado") {
    notFound();
  }

  const perfilDominante = partida.perfilDominante as PerfilId | null;
  const perfilSecundario = partida.perfilSecundario as PerfilId | null;
  const resultado = partida.resultadoTipo ?? "medio";

  // El cierre narrativo lo escribe el motor de IA, personalizado con el área
  // y las decisiones del jugador. Si esa llamada falló, caemos al mensaje
  // genérico fijo para no dejar la pantalla vacía.
  const textoFinal = partida.analisisFinal ?? MENSAJES_RESULTADO[resultado as "medio" | "bajo" | "troll"] ?? MENSAJES_RESULTADO.medio;

  const skillsFinales = (partida.skillsFinales as Record<string, number>) ?? {};
  const skillsOrdenadas = Object.entries(skillsFinales)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <main className="flex flex-1 flex-col px-6 py-10 max-w-md mx-auto w-full gap-8">
      <div className="text-center">
        <div className="text-6xl mb-3">{resultado === "goat" ? "🐐" : "🎬"}</div>
        <h1 className="text-2xl font-extrabold mb-1">{TITULOS_RESULTADO[resultado]}</h1>
        <p className="text-goat-ink-muted text-sm">
          {partida.jugador.nombre} · {partida.edadInicio} → 30 años
        </p>
      </div>

      <div className="card p-5">
        <div className="prose-narrativa text-sm leading-relaxed">
          <ReactMarkdown>{textoFinal}</ReactMarkdown>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-extrabold mb-3">Tu informe de perfil</h2>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-goat-ink-muted">Perfil dominante</span>
          <span className="font-bold">{perfilDominante ? NOMBRES_PERFIL[perfilDominante] : "—"}</span>
        </div>
        {partida.esMixto && perfilSecundario && (
          <div className="flex justify-between text-sm mb-2">
            <span className="text-goat-ink-muted">Perfil secundario</span>
            <span className="font-bold">{NOMBRES_PERFIL[perfilSecundario]}</span>
          </div>
        )}
        <div className="flex justify-between text-sm mb-2">
          <span className="text-goat-ink-muted">Ingreso final</span>
          <span className="font-bold text-goat-accent-solid">
            {partida.ingresoFinal !== null ? formatoPesos(partida.ingresoFinal) : "—"}/mes
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-goat-ink-muted">Ahorros acumulados</span>
          <span className="font-bold">{formatoPesos(partida.ahorros)}</span>
        </div>
      </div>

      {skillsOrdenadas.length > 0 && (
        <div className="card p-5">
          <h2 className="font-extrabold mb-3">Skills desarrolladas</h2>
          <div className="flex flex-wrap gap-2">
            {skillsOrdenadas.map(([skill, nivel]) => (
              <span key={skill} className="text-xs bg-goat-surface-2 border border-goat-border rounded-full px-3 py-1.5">
                {emojiSkill(skill)} {nombreSkill(skill)} · Nv.{nivel}
              </span>
            ))}
          </div>
        </div>
      )}

      {partida.medallasGanadas.length > 0 && (
        <div className="card p-5">
          <h2 className="font-extrabold mb-3">Medallas ganadas</h2>
          <div className="flex flex-wrap gap-3">
            {partida.medallasGanadas.map((id) => {
              const m = medalla(id);
              if (!m) return null;
              return (
                <div key={id} className="flex flex-col items-center gap-1 w-16 text-center">
                  <div className="text-3xl">{m.emoji}</div>
                  <span className="text-[10px] text-goat-ink-muted leading-tight">{m.nombre}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {partida.areaLibre && (
        <div className="card p-5">
          <h2 className="font-extrabold mb-2">Tu área</h2>
          <p className="text-sm text-goat-ink-muted">&ldquo;{partida.areaLibre}&rdquo;</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Link href="/juego/onboarding" className="btn-primary text-center">
          🔄 Jugar de nuevo
        </Link>
        <Link href="/juego" className="btn-secondary text-center">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
