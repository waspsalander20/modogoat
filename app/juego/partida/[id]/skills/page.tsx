import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SkillsGrid from "./SkillsGrid";
import type { PerfilId } from "@/lib/types";

export default async function SkillsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const partida = await prisma.partida.findUnique({ where: { id } });
  if (!partida) notFound();

  return (
    <SkillsGrid
      skills={(partida.skills as Record<string, number>) ?? {}}
      perfilDominante={(partida.perfilDominante as PerfilId) ?? null}
    />
  );
}
