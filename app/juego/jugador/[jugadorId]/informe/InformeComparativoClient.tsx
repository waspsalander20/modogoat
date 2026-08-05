"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import PantallaCarga from "@/app/juego/PantallaCarga";
import { formatoPesos } from "@/lib/format";
import { medalla } from "@/lib/data/medallas";
import type { Medalla } from "@/lib/types";
import { nombreSkill } from "@/lib/data/skills";
import { NOMBRES_PERFIL, EMOJI_PERFIL } from "@/lib/data/perfiles";
import { NOMBRES_ALERTA } from "@/lib/data/alertas";
import type { PerfilId } from "@/lib/types";

interface EstadoResponse {
  nombre: string;
  partidasTerminadas: number;
  partidasEsperadas: number;
  completo: boolean;
  error?: string;
}

interface PartidaResumen {
  id: string;
  perfilDominante: string | null;
  resultadoTipo: string | null;
  ingresoFinal: number | null;
  medallasGanadas: string[];
}

interface MejorDecision {
  partidaId: string;
  anio: number;
  titulo: string;
  saltoIngreso: number;
  medallaDesbloqueada: string | null;
}

interface AreaDeMejora {
  alerta: string;
  vecesPresente: number;
}

interface ResultadoAnalisis {
  nombre: string;
  partidasEsperadas: number;
  partidas: PartidaResumen[];
  patrones: { perfilesRepetidos: string[]; alertasComunes: string[]; skillsComunes: string[] };
  areasDeMejora: AreaDeMejora[];
  mejoresDecisiones: MejorDecision[];
  diferencias: string;
  sintesis: string;
}

const NIVEL_ORDEN: Record<Medalla["nivel"], number> = { goat: 4, platino: 3, oro: 2, plata: 1, bronce: 0 };

type Fase =
  | { tipo: "cargando" }
  | { tipo: "invitacion"; estado: EstadoResponse }
  | { tipo: "analizando" }
  | { tipo: "resultado"; datos: ResultadoAnalisis }
  | { tipo: "error"; mensaje: string };

export default function InformeComparativoClient({ jugadorId }: { jugadorId: string }) {
  const [fase, setFase] = useState<Fase>({ tipo: "cargando" });
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    fetch(`/api/jugador/${jugadorId}/informe-comparativo`)
      .then((r) => r.json())
      .then((data: EstadoResponse) => {
        if (data.error) {
          setFase({ tipo: "error", mensaje: data.error });
          return;
        }
        if (data.completo) {
          analizar();
        } else {
          setFase({ tipo: "invitacion", estado: data });
        }
      })
      .catch(() => setFase({ tipo: "error", mensaje: "No pudimos cargar tu informe. Intenta de nuevo." }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jugadorId]);

  function analizar() {
    setFase({ tipo: "analizando" });
    fetch(`/api/jugador/${jugadorId}/informe-comparativo`, { method: "POST" })
      .then((r) => r.json())
      .then((data: ResultadoAnalisis & { error?: string }) => {
        if (data.error) {
          setFase({ tipo: "error", mensaje: data.error });
          return;
        }
        setFase({ tipo: "resultado", datos: data });
      })
      .catch(() => setFase({ tipo: "error", mensaje: "No pudimos generar el análisis. Intenta de nuevo." }));
  }

  if (fase.tipo === "cargando") {
    return <PantallaCarga mensaje="Buscando tus caminos recorridos..." />;
  }
  if (fase.tipo === "analizando") {
    return <PantallaCarga mensaje="Estamos analizando tus caminos juntos. Puede tardar un poco — vale la pena." />;
  }
  if (fase.tipo === "error") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-bold">{fase.mensaje}</p>
        <Link href="/juego" className="rounded-full bg-black px-6 py-3 font-bold text-white">
          Volver al inicio
        </Link>
      </main>
    );
  }
  if (fase.tipo === "invitacion") {
    const { estado } = fase;
    const faltan = estado.partidasEsperadas - estado.partidasTerminadas;
    return (
      <main
        className="relative flex flex-1 flex-col items-center px-6 pb-10 pt-[17px] text-center"
        style={{ background: "linear-gradient(180deg, var(--resultado-bg-from) 0%, var(--resultado-bg-to) 100%)" }}
      >
        <div
          className="relative mt-16 w-full max-w-[355px] rounded-[20px] p-6"
          style={{
            background: "linear-gradient(132.49deg, var(--resultado-card-bg-from) 26.1%, var(--resultado-card-bg-to) 86.54%)",
            boxShadow: "0px 4px 4px rgba(0,0,0,0.17), inset 0px 4px 4px rgba(255,255,255,0.25)",
          }}
        >
          <h1 className="font-black text-xl" style={{ color: "var(--resultado-ink)" }}>
            ¡Vas muy bien, {estado.nombre}!
          </h1>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--resultado-ink)" }}>
            Llevas{" "}
            <strong>
              {estado.partidasTerminadas} de {estado.partidasEsperadas}
            </strong>{" "}
            caminos recorridos. Tienes {faltan === 1 ? "una oportunidad más" : `${faltan} oportunidades más`} para
            explorar otra ruta distinta antes de ver tu informe completo — mientras más caminos recorras, más
            preciso es el análisis.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <Link
              href="/juego/onboarding"
              className="flex items-center justify-center rounded-full py-3 font-black text-white"
              style={{
                background: "linear-gradient(180deg, var(--resultado-cta-from) 0%, var(--resultado-cta-to) 87.96%)",
                border: "1px solid var(--resultado-cta-border)",
              }}
            >
              Recorrer otro camino
            </Link>
            <button
              onClick={analizar}
              className="rounded-full bg-white py-3 font-bold"
              style={{ border: "1px solid var(--resultado-cta-border)", color: "var(--resultado-secundario-text)" }}
            >
              Ver mi análisis con lo que tengo
            </button>
          </div>
        </div>
      </main>
    );
  }

  const { datos } = fase;

  async function descargarPdf() {
    setDescargando(true);
    try {
      const res = await fetch(`/api/jugador/${jugadorId}/informe-comparativo/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      if (!res.ok) throw new Error("No se pudo generar el PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `informe-modo-goat-${datos.nombre.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("No pudimos generar tu PDF. Intenta de nuevo.");
    } finally {
      setDescargando(false);
    }
  }

  const medallasAcumuladas = [...new Set(datos.partidas.flatMap((p) => p.medallasGanadas))]
    .map((id) => medalla(id))
    .filter((m): m is Medalla => !!m)
    .sort((a, b) => NIVEL_ORDEN[b.nivel] - NIVEL_ORDEN[a.nivel]);

  return (
    <main
      className="relative flex flex-1 flex-col items-center gap-3 px-6 pb-10 pt-[17px]"
      style={{ background: "linear-gradient(180deg, var(--resultado-bg-from) 0%, var(--resultado-bg-to) 100%)" }}
    >
      <h1 className="mt-4 text-center font-black text-xl text-white">Tu informe completo</h1>
      <p className="text-center text-sm text-white/90">
        {datos.nombre} · {datos.partidas.length} caminos recorridos
      </p>

      <Tarjeta titulo="Resumen de tus partidas">
        <div className="flex flex-col gap-3">
          {datos.partidas.map((p, i) => (
            <div key={p.id} className="flex flex-col gap-1 text-sm" style={{ color: "var(--resultado-ink)" }}>
              <div className="flex items-center justify-between">
                <span>
                  {EMOJI_PERFIL[p.perfilDominante as PerfilId] ?? "🎯"} Camino {i + 1} —{" "}
                  {p.perfilDominante ? NOMBRES_PERFIL[p.perfilDominante as PerfilId] : "Sin perfil"}
                </span>
                <span className="font-bold capitalize">
                  {p.resultadoTipo ?? "—"}
                  {p.ingresoFinal ? ` · ${formatoPesos(p.ingresoFinal)}` : ""}
                </span>
              </div>
              {p.medallasGanadas.length > 0 && (
                <p className="text-xs" style={{ color: "var(--resultado-ink)", opacity: 0.7 }}>
                  {p.medallasGanadas
                    .map((id) => medalla(id))
                    .filter((m): m is Medalla => !!m)
                    .map((m) => `${m.emoji} ${m.nombre}`)
                    .join(" · ")}
                </p>
              )}
            </div>
          ))}
        </div>
      </Tarjeta>

      {medallasAcumuladas.length > 0 && (
        <Tarjeta titulo="Todas tus medallas">
          <div className="flex flex-wrap gap-2">
            {medallasAcumuladas.map((m) => (
              <span
                key={m.id}
                className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: "rgba(255,255,255,0.5)", color: "var(--resultado-ink)" }}
                title={m.condicion}
              >
                {m.emoji} {m.nombre}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--resultado-ink)", opacity: 0.6 }}>
            {medallasAcumuladas.length} medalla{medallasAcumuladas.length === 1 ? "" : "s"} distinta
            {medallasAcumuladas.length === 1 ? "" : "s"} en {datos.partidas.length} camino
            {datos.partidas.length === 1 ? "" : "s"}
          </p>
        </Tarjeta>
      )}

      {/* Con 1 sola partida, "consistente entre todos tus caminos" no dice nada — todo lo
          que hizo aparece trivialmente en el 100% de un conjunto de 1. Esta sección solo
          aporta algo real a partir de 2+ caminos comparables. */}
      {datos.partidas.length >= 2 &&
        (datos.patrones.perfilesRepetidos.length > 0 ||
          datos.patrones.alertasComunes.length > 0 ||
          datos.patrones.skillsComunes.length > 0) && (
          <Tarjeta titulo="Lo que se repitió en todos tus caminos">
            <ul className="flex flex-col gap-1 text-sm" style={{ color: "var(--resultado-ink)" }}>
              {datos.patrones.perfilesRepetidos.map((p) => (
                <li key={p}>✓ Siempre te inclinaste hacia {NOMBRES_PERFIL[p as PerfilId] ?? p}</li>
              ))}
              {datos.patrones.skillsComunes.map((s) => (
                <li key={s}>✓ Desarrollaste {nombreSkill(s)} en todos tus caminos</li>
              ))}
              {datos.patrones.alertasComunes.map((a) => (
                <li key={a}>✓ {NOMBRES_ALERTA[a] ?? a}</li>
              ))}
            </ul>
          </Tarjeta>
        )}

      <Tarjeta titulo="En qué se diferenciaron">
        <div className="prose-narrativa text-sm leading-relaxed" style={{ color: "var(--resultado-ink)" }}>
          <ReactMarkdown>{datos.diferencias}</ReactMarkdown>
        </div>
      </Tarjeta>

      {datos.mejoresDecisiones.length > 0 && (
        <Tarjeta titulo="Decisiones que más te ayudaron">
          <ul className="flex flex-col gap-2 text-sm" style={{ color: "var(--resultado-ink)" }}>
            {datos.mejoresDecisiones.map((d, i) => (
              <li key={i}>
                <strong>{d.titulo}</strong> (año {d.anio})
                {d.saltoIngreso > 0 ? ` — subió tu ingreso ${formatoPesos(d.saltoIngreso)}` : ""}
                {d.medallaDesbloqueada && ` · desbloqueó ${medalla(d.medallaDesbloqueada)?.nombre ?? d.medallaDesbloqueada}`}
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}

      {datos.areasDeMejora.length > 0 && (
        <Tarjeta titulo="Qué todavía puedes mejorar">
          <ul className="flex flex-col gap-1 text-sm" style={{ color: "var(--resultado-ink)" }}>
            {datos.areasDeMejora.map((a) => (
              <li key={a.alerta}>
                • {NOMBRES_ALERTA[a.alerta] ?? a.alerta} (en {a.vecesPresente} de tus caminos)
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}

      <Tarjeta titulo="En resumen">
        <div className="prose-narrativa text-sm leading-relaxed" style={{ color: "var(--resultado-ink)" }}>
          <ReactMarkdown>{datos.sintesis}</ReactMarkdown>
        </div>
      </Tarjeta>

      <div className="relative -mb-2 mt-2 w-28">
        <Image src="/cabrita-completa.png" alt="La Cabrita" width={1080} height={1920} className="h-auto w-full drop-shadow-xl" />
      </div>

      <Link
        href="/juego/onboarding"
        className="flex w-full max-w-[355px] items-center justify-center rounded-full py-3 font-black text-white"
        style={{
          background: "linear-gradient(180deg, var(--resultado-cta-from) 0%, var(--resultado-cta-to) 87.96%)",
          border: "1px solid var(--resultado-cta-border)",
        }}
      >
        Jugar de nuevo
      </Link>

      <button
        onClick={descargarPdf}
        disabled={descargando}
        className="flex w-full max-w-[355px] items-center justify-center rounded-full bg-white/90 py-3 font-bold disabled:opacity-60"
        style={{ border: "1px solid rgba(255,255,255,0.6)", color: "var(--resultado-secundario-text)" }}
      >
        {descargando ? "Generando tu PDF..." : "Descargar PDF"}
      </button>

      <Link href="/juego" className="mt-1 text-sm font-bold text-white underline">
        Volver al inicio
      </Link>
    </main>
  );
}

function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div
      className="relative w-full max-w-[355px] rounded-[20px] p-5"
      style={{
        background: "linear-gradient(132.49deg, var(--resultado-card-bg-from) 26.1%, var(--resultado-card-bg-to) 86.54%)",
        boxShadow: "0px 4px 4px rgba(0,0,0,0.17), inset 0px 4px 4px rgba(255,255,255,0.25)",
      }}
    >
      <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--resultado-ink)", opacity: 0.6 }}>
        {titulo}
      </p>
      {children}
    </div>
  );
}
