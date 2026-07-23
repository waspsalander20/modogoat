"use client";

import { useState } from "react";
import {
  SKILLS_TRANSVERSALES,
  SKILLS_PERFIL,
  SKILL_LIDERAZGO,
  TODAS_LAS_SKILLS,
} from "@/lib/data/skills";
import type { PerfilId, Skill } from "@/lib/types";

const RECURSOS_NIVEL = [
  { etiqueta: "Gratis", descripcion: "Tutoriales y contenido abierto para empezar por tu cuenta." },
  { etiqueta: "Básico", descripcion: "Cursos cortos o certificaciones de bajo costo para formalizar la base." },
  { etiqueta: "Premium", descripcion: "Programas más completos o mentoría 1 a 1 para llevarla al siguiente nivel." },
];

export default function SkillsGrid({
  skills,
  perfilDominante,
}: {
  skills: Record<string, number>;
  perfilDominante: PerfilId | null;
}) {
  const [skillAbierta, setSkillAbierta] = useState<string | null>(null);

  const skillsPerfil = perfilDominante ? SKILLS_PERFIL[perfilDominante] : [];
  const skillsRelevantes: Skill[] = [
    ...SKILLS_TRANSVERSALES,
    ...skillsPerfil,
    SKILL_LIDERAZGO,
  ];

  const idsRelevantes = new Set(skillsRelevantes.map((s) => s.id));
  const otrasConNivel = TODAS_LAS_SKILLS.filter(
    (s) => !idsRelevantes.has(s.id) && (skills[s.id] ?? 0) > 0
  );

  const desarrolladas = [...skillsRelevantes, ...otrasConNivel]
    .filter((s) => (skills[s.id] ?? 0) > 0)
    .sort((a, b) => (skills[b.id] ?? 0) - (skills[a.id] ?? 0));

  const porDesarrollar = skillsRelevantes.filter((s) => (skills[s.id] ?? 0) === 0);

  return (
    <div className="flex flex-col gap-6 flex-1 px-5 py-6">
      <div>
        <h1 className="text-xl font-extrabold mb-1">Tus skills</h1>
        <p className="text-goat-ink-muted text-sm">Toca una skill para ver cómo subirla.</p>
      </div>

      {desarrolladas.length > 0 && (
        <section>
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-goat-ink-muted mb-3">
            Ya desarrolladas
          </h2>
          <div className="flex flex-col gap-2">
            {desarrolladas.map((s) => (
              <SkillRow
                key={s.id}
                skill={s}
                nivel={skills[s.id] ?? 0}
                abierta={skillAbierta === s.id}
                onToggle={() => setSkillAbierta(skillAbierta === s.id ? null : s.id)}
              />
            ))}
          </div>
        </section>
      )}

      {porDesarrollar.length > 0 && (
        <section>
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-goat-ink-muted mb-3">
            Por desarrollar
          </h2>
          <div className="flex flex-col gap-2">
            {porDesarrollar.map((s) => (
              <SkillRow
                key={s.id}
                skill={s}
                nivel={0}
                abierta={skillAbierta === s.id}
                onToggle={() => setSkillAbierta(skillAbierta === s.id ? null : s.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SkillRow({
  skill,
  nivel,
  abierta,
  onToggle,
}: {
  skill: Skill;
  nivel: number;
  abierta: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="card overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left">
        <span className="text-2xl">{skill.emoji}</span>
        <div className="flex-1">
          <div className="font-bold text-sm">{skill.nombre}</div>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className="w-4 h-1.5 rounded-full"
                style={{
                  background:
                    n <= nivel
                      ? "linear-gradient(90deg, var(--goat-accent-from), var(--goat-accent-to))"
                      : "var(--goat-border)",
                }}
              />
            ))}
          </div>
        </div>
        <span className="text-goat-ink-muted text-xs">{abierta ? "▲" : "▼"}</span>
      </button>
      {abierta && (
        <div className="px-4 pb-4 flex flex-col gap-2 border-t border-goat-border pt-3">
          {RECURSOS_NIVEL.map((r) => (
            <div key={r.etiqueta} className="flex gap-2 items-start">
              <span className="pill-skill mt-0.5">{r.etiqueta}</span>
              <p className="text-xs text-goat-ink-muted flex-1">{r.descripcion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
