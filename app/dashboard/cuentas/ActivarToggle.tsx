"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ActivarToggle({ jugadorId, activo }: { jugadorId: string; activo: boolean }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  async function toggle() {
    setCargando(true);
    await fetch(`/api/dashboard/jugador/${jugadorId}/activar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !activo }),
    });
    router.refresh();
    setCargando(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={cargando}
      className={`rounded-full px-4 py-1.5 text-xs font-bold ${
        activo ? "bg-goat-good-bg text-goat-good-text" : "bg-goat-surface-2 text-goat-ink-muted border border-goat-border"
      }`}
    >
      {activo ? "Activa · Desactivar" : "Pendiente · Activar"}
    </button>
  );
}
