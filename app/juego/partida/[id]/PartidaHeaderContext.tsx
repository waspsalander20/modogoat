"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface EncabezadoPartida {
  nombre: string;
  perfilDominante: string | null;
  edadInicio: number;
  edadActual: number;
  ingresoActual: number;
  skills: Record<string, number>;
}

interface ContextoPartidaHeader {
  datos: EncabezadoPartida | null;
  refrescar: () => void;
}

const PartidaHeaderContext = createContext<ContextoPartidaHeader | null>(null);

export function usePartidaHeader() {
  const ctx = useContext(PartidaHeaderContext);
  if (!ctx) throw new Error("usePartidaHeader debe usarse dentro de PartidaHeaderProvider");
  return ctx;
}

export function PartidaHeaderProvider({
  partidaId,
  children,
}: {
  partidaId: string;
  children: React.ReactNode;
}) {
  const [datos, setDatos] = useState<EncabezadoPartida | null>(null);

  const refrescar = useCallback(() => {
    fetch(`/api/partida/${partidaId}`)
      .then((r) => r.json())
      .then((d) => {
        const p = d.partida;
        if (!p) return;
        setDatos({
          nombre: p.jugador.nombre,
          perfilDominante: p.perfilDominante,
          edadInicio: p.edadInicio,
          edadActual: p.edadActual,
          ingresoActual: p.ingresoActual,
          skills: p.skills ?? {},
        });
      })
      .catch(() => {});
  }, [partidaId]);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  return (
    <PartidaHeaderContext.Provider value={{ datos, refrescar }}>
      {children}
    </PartidaHeaderContext.Provider>
  );
}
