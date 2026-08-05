"use client";

import Image from "next/image";
import { usePartidaHeader } from "./PartidaHeaderContext";
import { formatoPesos } from "@/lib/format";
import { NOMBRES_PERFIL } from "@/lib/data/perfiles";
import { normalizarPais } from "@/lib/data/paises";
import { DURACION_ANIOS } from "@/lib/motor";
import type { PerfilId } from "@/lib/types";

export default function Header() {
  const { datos } = usePartidaHeader();

  if (!datos) {
    return <div className="h-32 animate-pulse" style={{ background: "var(--game-header-mid)" }} />;
  }

  const edadFin = datos.edadInicio + DURACION_ANIOS;
  const restantes = Math.max(0, edadFin - datos.edadActual);
  const totalAnios = Math.max(1, edadFin - datos.edadInicio);
  const progreso = Math.min(
    100,
    Math.max(0, ((datos.edadActual - datos.edadInicio) / totalAnios) * 100)
  );
  const perfilDominante = datos.perfilDominante ? NOMBRES_PERFIL[datos.perfilDominante as PerfilId] : null;
  const subtitulo = perfilDominante ?? "Explorando";

  return (
    <div
      className="px-5 pt-5 pb-4"
      style={{
        background: `linear-gradient(160deg, var(--game-header-from), var(--game-header-mid) 55%, var(--game-header-to))`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/80 bg-white/20 shrink-0">
            <Image src="/goat-avatar.png" alt="" width={88} height={88} className="w-full h-full object-cover object-top" />
          </div>
          <div>
            <div className="text-white font-extrabold leading-tight">{datos.nombre}</div>
            <div className="text-white/85 text-xs font-semibold">{subtitulo}</div>
          </div>
        </div>
        <div
          className="flex items-center gap-1 text-white font-extrabold text-sm rounded-full px-3 py-1.5"
          style={{ background: "var(--game-income-pill)" }}
        >
          {formatoPesos(datos.ingresoActual, normalizarPais(datos.pais))}/mes
        </div>
      </div>

      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-white/85 font-bold uppercase tracking-wide">Tu camino</span>
        <span className="text-white font-bold">
          Año {datos.edadActual} · {restantes} restantes
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/25 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${progreso}%`, background: "var(--game-progress-fill)" }}
        />
      </div>
    </div>
  );
}
