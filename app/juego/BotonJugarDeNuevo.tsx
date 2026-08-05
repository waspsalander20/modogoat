"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// El onboarding (datos + las 8 preguntas disfrazadas) ya se contestó una vez
// — de la segunda partida en adelante este botón salta directo a la próxima
// partida vía /api/partida/repetir, en vez de mandar de nuevo al wizard de
// /juego/onboarding (ver ese endpoint para el porqué).
export default function BotonJugarDeNuevo({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/partida/repetir", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo crear la partida");
      }
      const data = await res.json();
      router.push(`/juego/partida/${data.partidaId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal");
      setCargando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button onClick={onClick} disabled={cargando} className={`${className} disabled:opacity-70`} style={style}>
        {cargando ? "Preparando tu nueva partida..." : children}
      </button>
      {error && <p className="text-center text-xs font-semibold text-white">{error}</p>}
    </div>
  );
}
