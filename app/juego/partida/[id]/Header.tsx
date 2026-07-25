"use client";

import { usePartidaHeader } from "./PartidaHeaderContext";
import { formatoPesos } from "@/lib/format";
import { NOMBRES_PERFIL } from "@/lib/data/perfiles";
import type { PerfilId } from "@/lib/types";

// La partida dura 10 años desde la edad de inicio, no siempre hasta los 30
// (ver también app/api/partida/[id]/fin-anio/route.ts).
const DURACION_ANIOS = 10;

export default function Header() {
  const { datos } = usePartidaHeader();

  if (!datos) {
    return <div className="bg-goat-header-bg h-40 animate-pulse" />;
  }

  const edadFin = datos.edadInicio + DURACION_ANIOS;
  const restantes = Math.max(0, edadFin - datos.edadActual);
  const totalAnios = Math.max(1, edadFin - datos.edadInicio);
  const progreso = Math.min(
    100,
    Math.max(0, ((datos.edadActual - datos.edadInicio) / totalAnios) * 100)
  );
  const perfilNombre = datos.perfilDominante
    ? NOMBRES_PERFIL[datos.perfilDominante as PerfilId]
    : "Explorando";

  return (
    <div
      className="px-5 pt-5 pb-4"
      style={{
        background: `linear-gradient(160deg, var(--goat-header-bg), var(--goat-header-bg-2))`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-extrabold text-lg"
            style={{ background: "linear-gradient(135deg, var(--goat-accent-from), var(--goat-accent-to))" }}
          >
            {datos.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-white font-extrabold leading-tight">{datos.nombre}</div>
            <div className="text-goat-header-ink-muted text-xs">
              {perfilNombre} · Año {datos.edadActual} de {edadFin}
            </div>
          </div>
        </div>
        <div className="pill-income">{formatoPesos(datos.ingresoActual)}/mes</div>
      </div>

      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-goat-header-ink-muted font-bold uppercase tracking-wide">Tu camino</span>
        <span className="text-goat-warn font-bold">
          Año {datos.edadActual} · {restantes} restantes
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${progreso}%`,
            background: "linear-gradient(90deg, var(--goat-accent-from), var(--goat-accent-to))",
          }}
        />
      </div>
    </div>
  );
}
