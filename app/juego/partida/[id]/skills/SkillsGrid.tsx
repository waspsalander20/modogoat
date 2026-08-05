"use client";

import Image from "next/image";
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
    <div className="flex flex-1 flex-col">
      <div className="relative flex flex-col items-start overflow-hidden px-6 pt-[17px] pb-6">
        <Image src="/splash-bg.png" alt="" fill priority sizes="100vw" className="object-cover" />

        <div className="relative w-[150px]">
          <Image src="/skills-banner.png" alt="Tus skills" width={1536} height={807} className="h-auto w-full" />
        </div>

        <div
          className="relative mt-3 w-[220px] max-w-[85%] rounded-[20px] bg-white px-4 py-3"
          style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.1)" }}
        >
          <p className="font-semibold text-[11px] leading-tight" style={{ color: "var(--skills-bubble-ink)" }}>
            Cada habilidad cambia tu destino. Entrénalas para desbloquear nuevas oportunidades.
          </p>
          <p className="mt-1 font-extrabold text-[11px] leading-tight" style={{ color: "var(--skills-bubble-ink)" }}>
            ¡Sigue entrenando! Cada nivel te acerca a tu mejor versión.
          </p>
        </div>

        <div className="pointer-events-none absolute bottom-0 right-1 h-[150px] w-[135px]">
          <Image src="/skills-goat.png" alt="" fill className="object-contain object-bottom" />
        </div>
      </div>

      <div className="flex flex-col gap-5 px-5 pt-5 pb-6">
        {desarrolladas.length > 0 && (
          <section>
            <SeccionPill tipo="dominadas" />
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {desarrolladas.map((s) => (
                <SkillCard
                  key={s.id}
                  skill={s}
                  nivel={skills[s.id] ?? 0}
                  dominada
                  abierta={skillAbierta === s.id}
                  onToggle={() => setSkillAbierta(skillAbierta === s.id ? null : s.id)}
                />
              ))}
            </div>
          </section>
        )}

        {porDesarrollar.length > 0 && (
          <section>
            <SeccionPill tipo="por_desarrollar" />
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {porDesarrollar.map((s) => (
                <SkillCard
                  key={s.id}
                  skill={s}
                  nivel={0}
                  dominada={false}
                  abierta={skillAbierta === s.id}
                  onToggle={() => setSkillAbierta(skillAbierta === s.id ? null : s.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function SeccionPill({ tipo }: { tipo: "dominadas" | "por_desarrollar" }) {
  const esDominadas = tipo === "dominadas";
  return (
    <div
      className="flex items-center gap-2 rounded-[20px] px-3.5 py-2"
      style={{
        background: esDominadas
          ? "linear-gradient(90deg, var(--skills-dominadas-from), var(--skills-dominadas-to))"
          : "linear-gradient(90deg, var(--skills-desarrollar-from), var(--skills-desarrollar-to))",
        border: `1px solid ${esDominadas ? "var(--skills-dominadas-border)" : "var(--skills-desarrollar-border)"}`,
        boxShadow: "0px 4px 4px rgba(0,0,0,0)",
      }}
    >
      <span className="flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full bg-white/90">
        <Image
          src={esDominadas ? "/icon-checked.png" : "/icon-idea.png"}
          alt=""
          width={13}
          height={13}
          className="h-[13px] w-[13px] object-contain"
        />
      </span>
      <span className="font-extrabold text-sm text-white">
        {esDominadas ? "Dominadas" : "Por desarrollar"}
      </span>
    </div>
  );
}

function SkillCard({
  skill,
  nivel,
  dominada,
  abierta,
  onToggle,
}: {
  skill: Skill;
  nivel: number;
  dominada: boolean;
  abierta: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="overflow-hidden rounded-[20px] p-4"
      style={{
        background: "linear-gradient(132.49deg, var(--skills-card-bg-from) 26.1%, var(--skills-card-bg-to) 86.54%)",
        boxShadow: "inset 0px 4px 4px rgba(255,255,255,0.25)",
      }}
    >
      <button onClick={onToggle} className="flex w-full items-start justify-between gap-2 text-left">
        <div className="flex flex-1 flex-col gap-2">
          <span className="font-extrabold text-[13px]" style={{ color: "var(--skills-card-ink)" }}>
            {skill.nombre}
          </span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className="h-[10px] w-[13px] rounded-[6px]"
                style={{
                  background: n <= nivel ? "var(--skills-dot-active)" : "var(--skills-dot-inactive)",
                  border: "0.5px solid rgba(0,0,0,0.04)",
                }}
              />
            ))}
          </div>
          <span
            className="inline-flex w-fit items-center gap-1 rounded-full px-3 py-1"
            style={{
              background: dominada
                ? "linear-gradient(180deg, var(--skills-mejorar-from) 0%, var(--skills-mejorar-to) 87.96%)"
                : "linear-gradient(180deg, var(--skills-entrenar-from) 0%, var(--skills-entrenar-to) 87.96%)",
              border: `1px solid ${dominada ? "var(--skills-mejorar-border)" : "var(--skills-entrenar-border)"}`,
              boxShadow: "0px 3px 5px rgba(0,0,0,0.22), inset 0px 4px 4px rgba(255,255,255,0.25)",
            }}
          >
            <span className="font-extrabold text-[9px] text-white" style={{ textShadow: "0px 2px 5px rgba(0,0,0,0.05)" }}>
              {dominada ? "Mejorar" : "Entrenar"}
            </span>
            <Image
              src="/icon-left-arrow.png"
              alt=""
              width={7}
              height={7}
              style={{ transform: "rotate(180deg)", filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.44))" }}
            />
          </span>
        </div>

        <span
          className="relative flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[14px]"
          style={{
            background: "linear-gradient(180deg, #E8BE15 0%, #E96D00 100%)",
            boxShadow: "0px 4px 4px rgba(0,0,0,0.25), inset 0px 4px 4px rgba(255,232,232,0.25)",
          }}
        >
          <Image src="/marco.png" alt="" width={58} height={58} className="absolute -inset-0.5 h-[calc(100%+4px)] w-[calc(100%+4px)]" />
          <span className="relative text-2xl leading-none">{skill.emoji}</span>
        </span>
      </button>

      {abierta && (
        <div className="mt-3 flex flex-col gap-2 border-t pt-3" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          {RECURSOS_NIVEL.map((r) => (
            <div key={r.etiqueta} className="flex items-start gap-2">
              <span className="pill-skill mt-0.5 shrink-0">{r.etiqueta}</span>
              <p className="flex-1 text-xs" style={{ color: "var(--skills-card-ink)" }}>
                {r.descripcion}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
