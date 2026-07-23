import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatoPesos } from "@/lib/format";
import { nombreSkill, emojiSkill } from "@/lib/data/skills";
import { medalla } from "@/lib/data/medallas";
import { TEXTOS_FINAL, TEXTO_FINAL_MIXTO, MENSAJES_RESULTADO, MENSAJES_BARRERA } from "@/lib/data/mensajes";
import { detectarBarreraPrincipal } from "@/lib/perfilamiento";
import type { PerfilId } from "@/lib/types";

const NOMBRES_PERFIL: Record<PerfilId, string> = {
  EMP: "Empleado / Operador",
  INV: "Investigador / Salud-Social",
  EMP2: "Emprendedor",
  FREE: "Freelancer / Técnico-Creador",
  CRE: "Creador de contenidos",
};

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

  let textoFinal: string;
  if (resultado === "troll") {
    textoFinal = MENSAJES_RESULTADO.troll;
  } else if (resultado === "medio" || resultado === "bajo") {
    textoFinal = MENSAJES_RESULTADO[resultado as "medio" | "bajo"];
  } else if (partida.esMixto && perfilDominante && perfilSecundario) {
    textoFinal = TEXTO_FINAL_MIXTO(TEXTOS_FINAL[perfilDominante], TEXTOS_FINAL[perfilSecundario]);
  } else {
    textoFinal = TEXTOS_FINAL[perfilDominante ?? "EMP"];
  }

  const barreraPrincipal = detectarBarreraPrincipal(partida.alertas);
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
        <p className="whitespace-pre-line text-sm leading-relaxed">{textoFinal}</p>
      </div>

      {barreraPrincipal && MENSAJES_BARRERA[barreraPrincipal] && (
        <div className="card p-5 border-goat-accent/50">
          <p className="whitespace-pre-line text-sm leading-relaxed text-goat-ink-muted">
            {MENSAJES_BARRERA[barreraPrincipal]}
          </p>
        </div>
      )}

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
          <span className="font-bold text-goat-accent">
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
