"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PaisId } from "@/lib/data/paises";

interface ProgramaOpcion {
  id: string;
  nombre: string;
  pais: string;
}

function construirHref(pais: PaisId | undefined, programaId: string | undefined) {
  const params = new URLSearchParams();
  if (pais) params.set("pais", pais);
  if (programaId) params.set("programa", programaId);
  const query = params.toString();
  return query ? `/dashboard?${query}` : "/dashboard";
}

export default function FiltrosBarra({
  paises,
  paisActivo,
  programas,
  programaActivo,
}: {
  paises: Array<{ id: PaisId; nombre: string }>;
  paisActivo: PaisId | undefined;
  programas: ProgramaOpcion[];
  programaActivo: string | undefined;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FiltroBoton href={construirHref(undefined, programaActivo)} etiqueta="Todos" activo={!paisActivo} />
      {paises.map((p) => (
        <FiltroBoton key={p.id} href={construirHref(p.id, programaActivo)} etiqueta={p.nombre} activo={paisActivo === p.id} />
      ))}
      {programas.length > 0 && (
        <select
          value={programaActivo ?? ""}
          onChange={(e) => router.push(construirHref(paisActivo, e.target.value || undefined))}
          className="text-xs font-bold rounded-full px-3 py-1.5 border border-goat-border text-goat-ink-muted bg-transparent"
        >
          <option value="">Todos los programas</option>
          {programas.map((prog) => (
            <option key={prog.id} value={prog.id}>
              {prog.nombre}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function FiltroBoton({ href, etiqueta, activo }: { href: string; etiqueta: string; activo: boolean }) {
  return (
    <Link
      href={href}
      className={`text-xs font-bold rounded-full px-3 py-1.5 border transition-colors ${
        activo
          ? "bg-goat-accent-solid text-white border-goat-accent-solid"
          : "border-goat-border text-goat-ink-muted hover:border-goat-accent-solid"
      }`}
    >
      {etiqueta}
    </Link>
  );
}
