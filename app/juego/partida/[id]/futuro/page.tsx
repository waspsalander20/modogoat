import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { calcularSalarioProyectado } from "@/lib/motor";
import { formatoPesos } from "@/lib/format";
import { NOMBRES_PERFIL, CARGOS_POR_PERFIL } from "@/lib/data/perfiles";
import { SKILLS_TRANSVERSALES, SKILLS_PERFIL, nombreSkill, emojiSkill } from "@/lib/data/skills";
import type { PerfilId } from "@/lib/types";

export default async function FuturoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const partida = await prisma.partida.findUnique({ where: { id } });
  if (!partida) notFound();

  const perfilDominante = (partida.perfilDominante as PerfilId) ?? "EMP";
  const skills = (partida.skills as Record<string, number>) ?? {};
  const salario = calcularSalarioProyectado(perfilDominante, skills);
  const nivelIngles = skills.ingles ?? 0;

  const skillsClave = [...SKILLS_TRANSVERSALES, ...SKILLS_PERFIL[perfilDominante]];
  const skillsQueFaltan = skillsClave
    .filter((s) => (skills[s.id] ?? 0) < 5)
    .sort((a, b) => (skills[a.id] ?? 0) - (skills[b.id] ?? 0))
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-6 flex-1 px-5 py-6">
      <div>
        <h1 className="text-xl font-extrabold mb-1">Tu futuro</h1>
        <p className="text-goat-ink-muted text-sm">Proyección según tu perfil y tus skills hasta ahora.</p>
      </div>

      <div className="card p-6 text-center">
        <div className="text-xs font-extrabold uppercase tracking-wide text-goat-accent-solid mb-2">
          Salario proyectado
        </div>
        <div className="text-3xl font-extrabold mb-1">{formatoPesos(salario)}</div>
        <div className="text-goat-ink-muted text-xs">al mes, como {NOMBRES_PERFIL[perfilDominante]}</div>
        {nivelIngles < 4 && (
          <div className="mt-3 text-xs bg-goat-accent-tint text-goat-accent-solid rounded-xl px-3 py-2">
            Subir inglés a nivel 4+ multiplica tu proyección x1.6
          </div>
        )}
      </div>

      <section>
        <h2 className="text-xs font-extrabold uppercase tracking-wide text-goat-ink-muted mb-3">
          Cargos posibles
        </h2>
        <div className="flex flex-col gap-2">
          {CARGOS_POR_PERFIL[perfilDominante].map((cargo) => (
            <div key={cargo} className="card px-4 py-3 text-sm font-bold">
              {cargo}
            </div>
          ))}
        </div>
      </section>

      {skillsQueFaltan.length > 0 && (
        <section>
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-goat-ink-muted mb-3">
            Skills que te faltan para subir tu proyección
          </h2>
          <div className="flex flex-col gap-2">
            {skillsQueFaltan.map((s) => (
              <div key={s.id} className="card px-4 py-3 flex items-center gap-3">
                <span className="text-xl">{emojiSkill(s.id)}</span>
                <span className="flex-1 text-sm font-bold">{nombreSkill(s.id)}</span>
                <span className="text-xs text-goat-ink-muted">Nv. {skills[s.id] ?? 0}/5</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
