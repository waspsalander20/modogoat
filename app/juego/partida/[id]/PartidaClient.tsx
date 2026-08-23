"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import type { DecisionGenerada, EventoGenerado, OpcionGenerada, ReflexionFinalGenerada } from "@/lib/aiMotor";
import PantallaCarga from "@/app/juego/PantallaCarga";
import type { ResumenAnio } from "@/lib/motor";
import { formatoPesos, formatoPesosCompacto } from "@/lib/format";
import { normalizarPais, type PaisId } from "@/lib/data/paises";
import { nombreSkill } from "@/lib/data/skills";
import { medalla } from "@/lib/data/medallas";
import { mentor } from "@/lib/data/mentores";
import { usePartidaHeader } from "./PartidaHeaderContext";

interface TurnoResponse {
  terminado: boolean;
  anio?: number;
  turno?:
    | { tipo: "decision"; decision: DecisionGenerada }
    | { tipo: "evento"; evento: EventoGenerado }
    | { tipo: "reflexion_final"; reflexion: ReflexionFinalGenerada }
    | null;
  resumen?: ResumenAnio | null;
  error?: string;
}

type ResultadoPrecarga = { redirigir: true } | { redirigir: false; fase: Fase };

type Fase =
  | { tipo: "cargando" }
  | { tipo: "decision"; decision: DecisionGenerada; opcionSeleccionada: string | null; inicio: number }
  | { tipo: "campo_libre"; decision: DecisionGenerada; opcion: OpcionGenerada; inicio: number }
  | {
      tipo: "resultado";
      narrativa: string;
      tono: "positivo" | "negativo";
      ingresoAntes: number;
      ingresoDespues: number;
      skills: Record<string, number>;
      medallaDesbloqueada: string | null;
      mentorActivado: string | null;
      cabritaReflexion: string | null;
      onContinuar: () => void;
    }
  | { tipo: "evento"; evento: EventoGenerado; opcionSeleccionada: string | null; inicio: number }
  | { tipo: "resumen_anio"; anio: number; resumen: ResumenAnio | null }
  | { tipo: "reflexion_final"; reflexion: ReflexionFinalGenerada }
  | { tipo: "error"; mensaje: string };

export default function PartidaClient({ partidaId }: { partidaId: string }) {
  const router = useRouter();
  const { datos, refrescar } = usePartidaHeader();
  const [fase, setFase] = useState<Fase>({ tipo: "cargando" });

  // Interpreta la respuesta de GET /turno sin aplicarla todavía — la
  // comparten cargarTurno (que la aplica al toque) y la precarga en
  // segundo plano del resumen de año (que la deja lista para cuando el
  // jugador haga clic, ver precargarSiguiente más abajo).
  async function interpretarTurno(res: Response): Promise<ResultadoPrecarga> {
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { redirigir: false, fase: { tipo: "error", mensaje: data.error ?? "No pudimos cargar tu partida." } };
    }
    const data: TurnoResponse = await res.json();
    if (data.terminado) return { redirigir: true };
    if (data.turno?.tipo === "decision") {
      return { redirigir: false, fase: { tipo: "decision", decision: data.turno.decision, opcionSeleccionada: null, inicio: Date.now() } };
    }
    if (data.turno?.tipo === "evento") {
      return { redirigir: false, fase: { tipo: "evento", evento: data.turno.evento, opcionSeleccionada: null, inicio: Date.now() } };
    }
    if (data.turno?.tipo === "reflexion_final") {
      return { redirigir: false, fase: { tipo: "reflexion_final", reflexion: data.turno.reflexion } };
    }
    return { redirigir: false, fase: { tipo: "resumen_anio", anio: data.anio ?? 0, resumen: data.resumen ?? null } };
  }

  const cargarTurno = useCallback(async () => {
    setFase({ tipo: "cargando" });
    const resultado = await interpretarTurno(await fetch(`/api/partida/${partidaId}/turno`));
    if (resultado.redirigir) {
      router.push(`/juego/resultado/${partidaId}`);
      return;
    }
    setFase(resultado.fase);
  }, [partidaId, router]);

  // Arranca fin-anio + la siguiente pregunta en segundo plano apenas se
  // muestra el resumen de año — la generación con IA (la parte lenta) tiene
  // así todo el tiempo que el alumno se tarde leyendo el resumen para
  // terminar, en vez de arrancar recién cuando hace clic en "Arrancar el
  // año X" (que es la espera que se sentía lenta y hacía perder interés).
  // Se cachea por año para no duplicar la llamada si el efecto se dispara
  // dos veces (ej. StrictMode) o si el jugador ya hizo clic.
  const precargaRef = useRef<{ anio: number; promise: Promise<ResultadoPrecarga> } | null>(null);
  function precargarSiguiente(anio: number): Promise<ResultadoPrecarga> {
    if (precargaRef.current?.anio === anio) return precargaRef.current.promise;
    const promise = (async (): Promise<ResultadoPrecarga> => {
      const resFin = await fetch(`/api/partida/${partidaId}/fin-anio`, { method: "POST" });
      if (!resFin.ok) {
        return { redirigir: false, fase: { tipo: "error", mensaje: "No pudimos avanzar de año." } };
      }
      const dataFin = await resFin.json();
      if (dataFin.terminado) return { redirigir: true };
      return interpretarTurno(await fetch(`/api/partida/${partidaId}/turno`));
    })();
    precargaRef.current = { anio, promise };
    return promise;
  }

  async function continuarDesdeResumen(anio: number) {
    setFase({ tipo: "cargando" });
    const resultado = await precargarSiguiente(anio);
    refrescar();
    if (resultado.redirigir) {
      router.push(`/juego/resultado/${partidaId}`);
      return;
    }
    setFase(resultado.fase);
  }

  async function confirmarReflexionFinal(respuestaFeliz: boolean) {
    setFase({ tipo: "cargando" });
    const res = await fetch(`/api/partida/${partidaId}/reflexion-final`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ respuestaFeliz }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFase({ tipo: "error", mensaje: data.error ?? "No pudimos guardar tu respuesta." });
      return;
    }
    router.push(`/juego/resultado/${partidaId}`);
  }

  useEffect(() => {
    // Carga inicial del turno al montar/cambiar de partida; el resto de las
    // transiciones de fase ocurren por acción directa del jugador, no por efectos.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarTurno();
  }, [cargarTurno]);

  async function confirmarDecision(decision: DecisionGenerada, opcion: OpcionGenerada, inicio: number, campoLibre?: string) {
    setFase({ tipo: "cargando" });
    const tiempoRespuesta = (Date.now() - inicio) / 1000;
    const res = await fetch(`/api/partida/${partidaId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opcionLetra: opcion.letra, campoLibre, tiempoRespuesta }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFase({ tipo: "error", mensaje: data.error ?? "No pudimos guardar tu decisión." });
      return;
    }
    const data = await res.json();
    refrescar();
    if (data.turno?.tipo === "decision") {
      // Caso especial: la decisión inicial (con área libre) no se resuelve
      // directo a una consecuencia — genera una segunda decisión real sobre
      // cómo arrancar en esa área, para que el jugador vuelva a elegir.
      setFase({ tipo: "decision", decision: data.turno.decision, opcionSeleccionada: null, inicio: Date.now() });
      return;
    }
    setFase({
      tipo: "resultado",
      narrativa: data.narrativa,
      tono: data.tono,
      ingresoAntes: data.ingresoAntes,
      ingresoDespues: data.ingresoDespues,
      skills: data.skillsModificadas,
      medallaDesbloqueada: data.medallaDesbloqueada ?? null,
      mentorActivado: data.mentorActivado ?? null,
      cabritaReflexion: data.cabritaReflexion ?? null,
      onContinuar: cargarTurno,
    });
  }

  function confirmarSeleccionDecision(decision: DecisionGenerada, letra: string, inicio: number) {
    const opcion = decision.opciones.find((o) => o.letra === letra);
    if (!opcion) return;
    if (decision.tieneCampoLibre) {
      setFase({ tipo: "campo_libre", decision, opcion, inicio });
      return;
    }
    confirmarDecision(decision, opcion, inicio, undefined);
  }

  async function confirmarSeleccionEvento(evento: EventoGenerado, letra: string, inicio: number) {
    const opcion = evento.opciones.find((o) => o.letra === letra);
    if (!opcion) return;
    setFase({ tipo: "cargando" });
    const tiempoRespuesta = (Date.now() - inicio) / 1000;
    const res = await fetch(`/api/partida/${partidaId}/evento`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opcionLetra: opcion.letra, tiempoRespuesta }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFase({ tipo: "error", mensaje: data.error ?? "No pudimos guardar tu decisión." });
      return;
    }
    const data = await res.json();
    refrescar();
    setFase({
      tipo: "resultado",
      narrativa: data.narrativa,
      tono: data.tono,
      ingresoAntes: data.ingresoAntes,
      ingresoDespues: data.ingresoDespues,
      skills: data.skillsModificadas,
      medallaDesbloqueada: data.medallaDesbloqueada ?? null,
      mentorActivado: data.mentorActivado ?? null,
      cabritaReflexion: data.cabritaReflexion ?? null,
      onContinuar: cargarTurno,
    });
  }

  // Dispara la precarga en segundo plano apenas se entra al resumen de año
  // (ver precargarSiguiente) — no espera al clic del jugador.
  useEffect(() => {
    if (fase.tipo === "resumen_anio") {
      precargarSiguiente(fase.anio);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  // Precalcula la consecuencia de las 4 opciones apenas se muestra una
  // decisión o evento — mientras el jugador todavía está leyendo/pensando,
  // no cuando ya eligió. Corre server-side (ver /decision/simular,
  // /evento/simular y lib/turnoCache.ts): el cliente solo dispara los 4
  // pedidos y sigue de largo, nunca ve ni necesita el resultado. La
  // decisión inicial (con campo libre) no tiene consecuencia fija por
  // opción — no hay nada que precalcular ahí.
  const precalculadoRef = useRef<string | null>(null);
  useEffect(() => {
    if (fase.tipo !== "decision" && fase.tipo !== "evento") return;
    if (fase.tipo === "decision" && fase.decision.tieneCampoLibre) return;
    const titulo = fase.tipo === "decision" ? fase.decision.titulo : fase.evento.nombre;
    if (precalculadoRef.current === titulo) return;
    precalculadoRef.current = titulo;
    const ruta = fase.tipo === "decision" ? "decision" : "evento";
    const opciones = fase.tipo === "decision" ? fase.decision.opciones : fase.evento.opciones;
    for (const opcion of opciones) {
      fetch(`/api/partida/${partidaId}/${ruta}/simular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opcionLetra: opcion.letra }),
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  return (
    <main className="flex flex-1 flex-col">
      {fase.tipo === "cargando" && <PantallaCarga />}

      {fase.tipo === "error" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <p className="text-goat-bad">{fase.mensaje}</p>
          <button className="btn-secondary" onClick={cargarTurno}>
            Reintentar
          </button>
        </div>
      )}

      {fase.tipo === "decision" && (
        <DecisionCard
          decision={fase.decision}
          opcionSeleccionada={fase.opcionSeleccionada}
          onSeleccionar={(letra) => setFase({ ...fase, opcionSeleccionada: letra })}
          onConfirmar={() => {
            if (fase.opcionSeleccionada) {
              confirmarSeleccionDecision(fase.decision, fase.opcionSeleccionada, fase.inicio);
            }
          }}
        />
      )}

      {fase.tipo === "campo_libre" && (
        <CampoLibreForm
          textoCampoLibre={fase.decision.textoCampoLibre ?? "Contanos más"}
          onSubmit={(texto) => confirmarDecision(fase.decision, fase.opcion, fase.inicio, texto)}
        />
      )}

      {fase.tipo === "resultado" && (
        <ResultadoConsecuencia
          narrativa={fase.narrativa}
          tono={fase.tono}
          ingresoAntes={fase.ingresoAntes}
          ingresoDespues={fase.ingresoDespues}
          skills={fase.skills}
          medallaDesbloqueada={fase.medallaDesbloqueada}
          mentorActivado={fase.mentorActivado}
          cabritaReflexion={fase.cabritaReflexion}
          onContinuar={fase.onContinuar}
          pais={normalizarPais(datos?.pais)}
        />
      )}

      {fase.tipo === "evento" && (
        <EventoCard
          evento={fase.evento}
          opcionSeleccionada={fase.opcionSeleccionada}
          onSeleccionar={(letra) => setFase({ ...fase, opcionSeleccionada: letra })}
          onConfirmar={() => {
            if (fase.opcionSeleccionada) {
              confirmarSeleccionEvento(fase.evento, fase.opcionSeleccionada, fase.inicio);
            }
          }}
        />
      )}

      {fase.tipo === "resumen_anio" && (
        <ResumenAnioView
          anio={fase.anio}
          resumen={fase.resumen}
          nombre={datos?.nombre}
          pais={normalizarPais(datos?.pais)}
          onContinuar={() => continuarDesdeResumen(fase.anio)}
        />
      )}

      {fase.tipo === "reflexion_final" && (
        <ReflexionFinalCard reflexion={fase.reflexion} onResponder={confirmarReflexionFinal} />
      )}
    </main>
  );
}

function EstadisticaResumen({
  valor,
  label,
  variante,
  ancho = false,
}: {
  valor: string;
  label: string;
  variante: "ingreso" | "ingresoNegativo" | "dorado";
  ancho?: boolean;
}) {
  const numeroStyle =
    variante === "dorado"
      ? {
          backgroundImage: "linear-gradient(180deg, var(--resumen-number-from) 31.25%, var(--resumen-number-to) 100%)",
          WebkitBackgroundClip: "text" as const,
          backgroundClip: "text" as const,
          WebkitTextFillColor: "transparent" as const,
          WebkitTextStroke: "1px var(--resumen-ink)",
        }
      : {
          color: variante === "ingreso" ? "#2fd442" : "#f50000",
          WebkitTextStroke: `1px ${variante === "ingreso" ? "#078800" : "#8f0000"}`,
        };
  const labelColor = variante === "dorado" ? "var(--resumen-ink)" : variante === "ingreso" ? "#078800" : "#8f0000";

  return (
    <div
      className={`relative flex ${ancho ? "w-full" : "flex-1"} flex-col items-center justify-center rounded-[14px] py-3`}
      style={{ background: "linear-gradient(180deg, var(--resumen-stat-bg-from) 0%, var(--resumen-stat-bg-to) 100%)" }}
    >
      {ancho ? (
        <div className="pointer-events-none absolute" style={{ left: -18, right: -18, top: -15, bottom: -15 }}>
          <Image src="/marco-horizontal.png" alt="" fill className="object-fill" />
        </div>
      ) : (
        <Image
          src="/marco.png"
          alt=""
          width={101}
          height={101}
          className="pointer-events-none absolute -inset-1.5 h-[calc(100%+12px)] w-[calc(100%+12px)]"
        />
      )}
      <span
        className="relative max-w-full truncate font-black text-3xl leading-tight"
        style={{ letterSpacing: "-0.06em", ...numeroStyle }}
      >
        {valor}
      </span>
      <span className="relative mt-1 font-bold text-[11px]" style={{ color: labelColor }}>
        {label}
      </span>
    </div>
  );
}

function ResumenAnioView({
  anio,
  resumen,
  nombre,
  onContinuar,
  pais,
}: {
  anio: number;
  resumen: ResumenAnio | null;
  nombre?: string;
  onContinuar: () => void;
  pais: PaisId;
}) {
  return (
    <div
      className="flex-1 flex flex-col items-center px-[19px] pt-1 pb-6"
      style={{ background: "linear-gradient(132.49deg, var(--resumen-bg-from) 26.1%, var(--resumen-bg-to) 86.54%)" }}
    >
      <Image src="/badge-resumen.png" alt="Resumen de año" width={230} height={70} priority />

      <div
        className="mt-2.5 w-full flex flex-col items-center px-[22px] pt-6 pb-8"
        style={{
          background: "var(--resumen-card-bg)",
          border: "2px solid var(--resumen-card-border)",
          borderRadius: 25,
          boxShadow: "0px 4px 4px rgba(0,0,0,0.25)",
        }}
      >
        <span
          className="font-black leading-none"
          style={{
            fontSize: 76,
            letterSpacing: "-0.06em",
            backgroundImage: "linear-gradient(180deg, var(--resumen-number-from) 31.25%, var(--resumen-number-to) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            WebkitTextStroke: "2px var(--resumen-ink)",
          }}
        >
          {anio}
        </span>

        <div className="mt-3 flex items-center gap-3">
          <span className="h-0.5 w-[70px]" style={{ background: "var(--resumen-ink)" }} />
          <span
            className="h-[15px] w-[15px] rotate-45 rounded-[2px]"
            style={{ background: "var(--resumen-number-from)", boxShadow: "0px 1px 1px rgba(0,0,0,0.25)" }}
          />
          <span className="h-0.5 w-[70px]" style={{ background: "var(--resumen-ink)" }} />
        </div>

        <h2 className="mt-3 text-center font-extrabold text-lg" style={{ color: "var(--resumen-ink-2)" }}>
          ¡Terminaste el año {anio}!
        </h2>
        {nombre && (
          <p className="mt-0.5 text-center font-semibold text-[11px]" style={{ color: "var(--resumen-ink)" }}>
            Mira tu progreso y lo que viene para ti.
          </p>
        )}

        {resumen && (
          <>
            <div className="mt-6 flex w-full flex-col gap-2.5">
              <EstadisticaResumen
                ancho
                valor={`${resumen.ingresoGanado >= 0 ? "+" : ""}${formatoPesosCompacto(resumen.ingresoGanado, pais)}`}
                label="Ingresos"
                variante={resumen.ingresoGanado >= 0 ? "ingreso" : "ingresoNegativo"}
              />
              <div className="flex w-full gap-2.5">
                <EstadisticaResumen valor={String(resumen.skillsCount)} label="Skills" variante="dorado" />
                <EstadisticaResumen
                  valor={String(resumen.medallasEsteAnio.length)}
                  label={resumen.medallasEsteAnio.length === 1 ? "Medalla" : "Medallas"}
                  variante="dorado"
                />
              </div>
            </div>

            {resumen.highlights.length > 0 && (
              <div className="mt-4 flex w-full flex-col gap-2.5">
                {resumen.highlights.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-[20px] px-4 py-3.5"
                    style={{
                      background: "linear-gradient(132.49deg, var(--resumen-highlight-from) 26.1%, var(--resumen-highlight-to) 86.54%)",
                      border: "1px solid #f9f9f9",
                    }}
                  >
                    <span className="relative flex h-[34px] w-[34px] shrink-0 items-center justify-center">
                      <Image src="/marco.png" alt="" width={34} height={34} className="absolute inset-0 h-full w-full" />
                      <span className="relative text-base">{h.icono}</span>
                    </span>
                    <span className="font-extrabold text-sm" style={{ color: "var(--resumen-ink)" }}>
                      {h.texto}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {resumen.oportunidadPerdida && (
              <div className="mt-4 w-full">
                <div
                  className="flex items-center justify-center gap-2 rounded-[20px] px-4 py-2.5"
                  style={{
                    background: "linear-gradient(121.4deg, var(--resumen-bad-from) 31.05%, var(--resumen-bad-to) 97.65%)",
                    border: "1px solid var(--resumen-bad-from)",
                    boxShadow: "inset 0px 4px 4px rgba(255,255,255,0.25)",
                  }}
                >
                  <span
                    className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full"
                    style={{ background: "var(--resumen-bad-from)", boxShadow: "0px 4px 4px rgba(0,0,0,0.25), inset 0px 4px 4px rgba(255,255,255,0.25)" }}
                  >
                    <Image src="/icon-caution.png" alt="" width={17} height={17} />
                  </span>
                  <span className="font-extrabold text-sm uppercase tracking-wide text-white">Costo de oportunidad</span>
                </div>
                <p className="mt-3 text-center font-semibold text-sm" style={{ color: "#161616" }}>
                  {resumen.oportunidadPerdida}
                </p>
              </div>
            )}
          </>
        )}

        <button
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-extrabold text-lg text-white"
          style={{
            background: "linear-gradient(180deg, var(--resumen-cta-from) 0%, var(--resumen-cta-to) 87.96%)",
            border: "1px solid var(--resumen-cta-border)",
            boxShadow: "0px 4px 4px rgba(0,0,0,0.41), inset 0px 4px 4px rgba(255,255,255,0.25)",
            textShadow: "0px 2px 2.4px #00885D",
          }}
          onClick={onContinuar}
        >
          Arrancar el año {anio + 1}
          <Image src="/icon-left-arrow.png" alt="" width={14} height={14} style={{ transform: "rotate(180deg)" }} />
        </button>
      </div>
    </div>
  );
}

type TipoTarjeta = "decision" | "imprevisto" | "oportunidad";

const TEMA_TARJETA: Record<
  TipoTarjeta,
  {
    gradFrom: string;
    gradTo: string;
    badge: string;
    badgeW: number;
    badgeH: number;
    opcionBorder: string;
    radioBorder: string;
    seleccionadaBg: string;
    seleccionadaBorder: string;
    radioFill: string;
  }
> = {
  decision: {
    gradFrom: "#009DE0",
    gradTo: "#1573B5",
    badge: "/badge-decision.png",
    badgeW: 258,
    badgeH: 63,
    opcionBorder: "rgba(0, 96, 137, 0.14)",
    radioBorder: "rgba(37, 132, 158, 0.26)",
    seleccionadaBg: "#003850",
    seleccionadaBorder: "#05BCFF",
    radioFill: "#2FC9D4",
  },
  oportunidad: {
    gradFrom: "#00E000",
    gradTo: "#15B515",
    badge: "/badge-oportunidad.png",
    badgeW: 260,
    badgeH: 67,
    opcionBorder: "rgba(0, 137, 9, 0.14)",
    radioBorder: "rgba(37, 158, 84, 0.26)",
    seleccionadaBg: "#007D00",
    seleccionadaBorder: "#4DFF4D",
    radioFill: "#2FD442",
  },
  imprevisto: {
    gradFrom: "#F50000",
    gradTo: "#B51515",
    badge: "/badge-imprevisto.png",
    badgeW: 288,
    badgeH: 58,
    opcionBorder: "rgba(181, 21, 21, 0.14)",
    radioBorder: "rgba(181, 21, 21, 0.14)",
    seleccionadaBg: "#860000",
    seleccionadaBorder: "#FF7E7E",
    radioFill: "#F50000",
  },
};

function CheckIcon() {
  return (
    <svg width="13" height="10" viewBox="0 0 13 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1 5L4.5 8.5L12 1"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TarjetaPregunta({
  tipo,
  texto,
  opciones,
  opcionSeleccionada,
  onSeleccionar,
  onConfirmar,
}: {
  tipo: TipoTarjeta;
  texto: string;
  opciones: Array<{ letra: string; texto: string; emoji: string }>;
  opcionSeleccionada: string | null;
  onSeleccionar: (letra: string) => void;
  onConfirmar: () => void;
}) {
  const tema = TEMA_TARJETA[tipo];
  return (
    <div
      className="flex flex-col flex-1"
      style={{ background: `linear-gradient(180deg, ${tema.gradFrom} 0%, ${tema.gradTo} 100%)` }}
    >
      <div className="flex flex-col items-center px-6 pt-[26px]">
        <Image src={tema.badge} alt="" width={tema.badgeW} height={tema.badgeH} priority />
        <div
          className="tarjeta-narrativa mt-6 text-center text-white"
          style={{
            fontWeight: 800,
            fontSize: 24,
            lineHeight: "113.54%",
            letterSpacing: "-0.02em",
            textShadow: "0px 2px 5px rgba(0,0,0,0.15)",
          }}
        >
          <ReactMarkdown>{texto}</ReactMarkdown>
        </div>
        <p
          className="mt-6 text-center text-white"
          style={{
            fontWeight: 600,
            fontSize: 15,
            lineHeight: "96.07%",
            letterSpacing: "-0.04em",
            textShadow: "0px 2px 5px rgba(0,0,0,0.15)",
          }}
        >
          ¿Qué hace tu personaje?
        </p>
      </div>

      <div className="flex flex-col gap-3.5 px-[22px] mt-6">
        {opciones.map((o) => {
          const seleccionada = opcionSeleccionada === o.letra;
          return (
            <button
              key={o.letra}
              onClick={() => onSeleccionar(o.letra)}
              className="flex items-center gap-4 rounded-[25px] px-4 py-3.5 min-h-[63px] text-left transition-colors"
              style={{
                background: seleccionada ? tema.seleccionadaBg : "#FFFFFF",
                border: `1px solid ${seleccionada ? tema.seleccionadaBorder : tema.opcionBorder}`,
                boxSizing: "border-box",
              }}
            >
              <span className="relative shrink-0" style={{ width: 33, height: 33 }}>
                {seleccionada ? (
                  <span
                    className="absolute inset-[1.5px] rounded-full flex items-center justify-center"
                    style={{
                      background: tema.radioFill,
                      boxShadow: "0px 4px 4px rgba(0,0,0,0.25), inset 0px 4px 4px rgba(255,255,255,0.25)",
                    }}
                  >
                    <CheckIcon />
                  </span>
                ) : (
                  <span
                    className="absolute inset-0 rounded-full flex items-center justify-center text-base leading-none"
                    style={{ background: "#FFFFFF", border: `1px solid ${tema.radioBorder}`, boxSizing: "border-box" }}
                  >
                    {o.emoji}
                  </span>
                )}
              </span>
              <span
                className="flex-1"
                style={{ fontWeight: 700, fontSize: 18, color: seleccionada ? "#FFFFFF" : "#000000" }}
              >
                {o.texto}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      <div className="px-6 pb-6 pt-4">
        <button
          className="w-full rounded-full py-4 font-extrabold text-lg transition disabled:opacity-50"
          style={{ background: "#FFFFFF", color: tema.radioFill }}
          disabled={!opcionSeleccionada}
          onClick={onConfirmar}
        >
          {opcionSeleccionada ? "Continuar" : "Elige una opción para continuar"}
        </button>
      </div>
    </div>
  );
}

function DecisionCard({
  decision,
  opcionSeleccionada,
  onSeleccionar,
  onConfirmar,
}: {
  decision: DecisionGenerada;
  opcionSeleccionada: string | null;
  onSeleccionar: (letra: string) => void;
  onConfirmar: () => void;
}) {
  return (
    <TarjetaPregunta
      tipo="decision"
      texto={decision.texto}
      opciones={decision.opciones.map((o) => ({ letra: o.letra, texto: o.titulo, emoji: o.emoji }))}
      opcionSeleccionada={opcionSeleccionada}
      onSeleccionar={onSeleccionar}
      onConfirmar={onConfirmar}
    />
  );
}

const AREAS_SUGERIDAS = [
  "Diseño gráfico",
  "Tecnología y programación",
  "Salud y enfermería",
  "Negocios y ventas",
  "Arte y música",
  "Deportes",
  "Moda",
  "Educación",
  "Belleza y estética",
  "Construcción",
  "Gastronomía",
  "Redes sociales y contenido",
];

// Fragmentos que indican incertidumbre — se busca como substring, no como
// coincidencia exacta, para atrapar frases como "no sé la verdad" o
// "sinceramente no tengo idea", no solo "no sé" a secas.
const FRAGMENTOS_VAGOS = [
  "no se", "no sé", "nose", "no tengo idea", "no tengo ni idea", "ninguna idea",
  "sin idea", "ni idea", "no idea", "quien sabe", "quién sabe", "no c ",
  "noc", "idk", "no estoy segur", "no tengo claro", "no tengo claridad",
];

function esRespuestaVaga(texto: string): boolean {
  const limpio = ` ${texto.trim().toLowerCase()} `;
  if (limpio.trim().length < 2) return true;
  if (["ns", "no c", "no se"].includes(limpio.trim())) return true;
  return FRAGMENTOS_VAGOS.some((frag) => limpio.includes(frag));
}

function CampoLibreForm({ textoCampoLibre, onSubmit }: { textoCampoLibre: string; onSubmit: (texto: string) => void }) {
  const [valor, setValor] = useState("");
  const [mostrarAliento, setMostrarAliento] = useState(false);
  const [intentosVagos, setIntentosVagos] = useState(0);

  function intentarConfirmar() {
    if (esRespuestaVaga(valor) && intentosVagos === 0) {
      setIntentosVagos(1);
      setMostrarAliento(true);
      return;
    }
    onSubmit(valor.trim());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto"
      style={{ background: "linear-gradient(180deg, #FDBA05 0%, #E45603 100%)" }}
    >
      <div className="flex w-full max-w-md flex-col items-center px-6 pt-[60px]">
        <Image src="/logo-mark.png" alt="Modo GOAT" width={120} height={57} priority />

        <div
          className="mt-6 self-start font-extrabold text-sm text-white"
          style={{ letterSpacing: "0.06em", textShadow: "0px 2px 5px rgba(0,0,0,0.66)" }}
        >
          PASO 3 DE 3
        </div>

        <h2 className="mt-3 self-start font-extrabold text-lg text-white">{textoCampoLibre}</h2>

        {mostrarAliento && (
          <div
            className="mt-3 w-full rounded-xl px-4 py-3 text-sm font-semibold"
            style={{ background: "rgba(255,255,255,0.92)", color: "#883900" }}
          >
            Está bien no saberlo todavía — prueba con una idea, aunque sea tentativa. Elige una de aquí abajo o escribe la tuya.
          </div>
        )}

        <div className="mt-4 flex w-full flex-wrap gap-2">
          {AREAS_SUGERIDAS.map((area) => {
            const seleccionada = valor === area;
            return (
              <button
                key={area}
                onClick={() => {
                  setValor(area);
                  setMostrarAliento(false);
                }}
                className="rounded-full px-3.5 py-1.5 font-medium text-xs transition-colors"
                style={{
                  background: seleccionada ? "#E85503" : "rgba(255,247,243,0.36)",
                  border: `1px solid ${seleccionada ? "rgba(53,22,0,0.08)" : "rgba(228,86,3,0.11)"}`,
                  color: seleccionada ? "#FFFFFF" : "#000000",
                }}
              >
                {area}
              </button>
            );
          })}
        </div>

        <input
          autoFocus
          value={valor}
          onChange={(e) => {
            setValor(e.target.value);
            setMostrarAliento(false);
          }}
          placeholder="Ej: Diseño gráfico, mecánica, enfermería..."
          className="mt-4 w-full rounded-[20px] px-[18px] py-[17px] font-bold text-[15px] outline-none"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(53,22,0,0.49)",
            boxShadow: "0px 4px 4px rgba(0,0,0,0.15), inset 0px 4px 4px rgba(255,255,255,0.25)",
            letterSpacing: "-0.02em",
          }}
        />

        <button
          className="mt-4 flex items-center gap-2 self-start rounded-full px-6 py-3.5 font-black text-lg text-white disabled:opacity-50"
          style={{
            background: "linear-gradient(180deg, #FDBA05 0%, #E85503 87.96%)",
            border: "1px solid #E27100",
            boxShadow: "0px 4px 4px rgba(0,0,0,0.41), inset 0px 4px 4px rgba(255,255,255,0.25)",
            textShadow: "0px 2px 2.4px #883900",
          }}
          disabled={!valor.trim()}
          onClick={intentarConfirmar}
        >
          Continuar
          <Image src="/icon-left-arrow.png" alt="" width={14} height={14} style={{ transform: "rotate(180deg)" }} />
        </button>
      </div>

      <div className="relative mt-auto flex w-full justify-center pt-6">
        <Image
          src="/formacion-goat.png"
          alt=""
          width={353}
          height={412}
          className="h-auto w-[88%] max-w-[353px]"
        />
      </div>
    </div>
  );
}

// La narrativa llega en párrafos separados por línea en blanco (y a veces una
// cita en blockquote aparte, ver regla 2b del prompt) — cada bloque se
// muestra en su propia página, para no tirarle al jugador un bloque de texto
// grande de una sola vez en el celular.
function dividirEnBloques(narrativa: string): string[] {
  return narrativa
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
}

const TEMA_NARRATIVA = {
  positivo: {
    fondo: "/narrativa-bg-positivo.png",
    goat: "/narrativa-goat-positivo.png",
    espejarGoat: true,
  },
  negativo: {
    fondo: "/narrativa-bg-negativo.png",
    goat: "/narrativa-goat-negativo.png",
    espejarGoat: false,
  },
} as const;

function PildoraDelta({ texto, positivo }: { texto: string; positivo: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-3"
      style={{
        background: positivo ? "var(--narrativa-good-bg)" : "var(--narrativa-bad-bg)",
        border: `0.5px solid ${positivo ? "var(--narrativa-good-border)" : "var(--narrativa-bad-border)"}`,
      }}
    >
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
        style={{
          background: positivo ? "var(--narrativa-good-circle)" : "var(--narrativa-bad-circle)",
          boxShadow: "0px 4px 4px rgba(0,0,0,0.25), inset 0px 4px 4px rgba(255,255,255,0.25)",
        }}
      >
        <Image
          src="/icon-arrow-delta.png"
          alt=""
          width={9}
          height={10}
          style={{ transform: `rotate(${positivo ? -90 : 90}deg)` }}
        />
      </span>
      <span className="font-bold text-xs" style={{ color: positivo ? "var(--narrativa-good-text)" : "var(--narrativa-bad-text)" }}>
        {texto}
      </span>
    </span>
  );
}

function NuevoMentorScreen({
  mentorInfo,
  medallaInfo,
  onContinuar,
}: {
  mentorInfo: { nombre: string; imagen: string; frase: string };
  medallaInfo?: { nombre: string; emoji: string };
  onContinuar: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center overflow-hidden"
      style={{ background: "linear-gradient(180deg, #FDBA05 0%, #E45603 100%)" }}
    >
      <Image src="/loading-fondo.png" alt="" fill priority sizes="100vw" className="pointer-events-none object-cover" />
      <Image src={mentorInfo.imagen} alt="" fill priority sizes="100vw" className="pointer-events-none object-cover object-bottom" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(136,57,0,0) 32.69%, #782C00 100%)" }}
      />

      <div className="relative mt-[60px]">
        <Image src="/logo-mark.png" alt="Modo GOAT" width={120} height={57} priority />
      </div>

      <h1
        className="relative mt-3 text-center"
        style={{
          fontSize: 32,
          fontWeight: 800,
          lineHeight: "90%",
          letterSpacing: "-0.06em",
          color: "#FFFFFF",
          textShadow: "0px 2px 0px #883900",
        }}
      >
        Nuevo Mentor
      </h1>
      <h2
        className="relative px-6 text-center uppercase"
        style={{
          fontSize: 52,
          fontWeight: 900,
          lineHeight: "90%",
          letterSpacing: "-0.06em",
          backgroundImage: "linear-gradient(180deg, #FFEEC2 31.25%, #FFCA3C 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          WebkitTextStroke: "1.5px #883900",
        }}
      >
        {mentorInfo.nombre}
      </h2>

      <div className="relative mt-auto flex w-full flex-col items-center px-6 pb-8">
        <div
          className="relative z-10 -mb-3.5 flex h-[39px] w-[39px] shrink-0 items-center justify-center overflow-hidden rounded-[14px]"
          style={{
            background: "linear-gradient(180deg, #E8BE15 0%, #E96D00 100%)",
            boxShadow: "0px 4px 4px rgba(0,0,0,0.25), inset 0px 4px 4px rgba(255,232,232,0.25)",
          }}
        >
          <Image src={mentorInfo.imagen} alt="" fill className="object-cover object-top" />
        </div>

        <div
          className="w-full max-w-[324px] rounded-[20px] px-5 pt-6 pb-4 text-center"
          style={{
            background: "linear-gradient(132.49deg, #FFECC4 26.1%, #FFE693 86.54%)",
            border: "1px solid #883900",
            boxShadow: "inset 0px 4px 4px rgba(255,255,255,0.25)",
          }}
        >
          <p
            className="font-extrabold text-[15px]"
            style={{ color: "#883900", letterSpacing: "-0.02em", textShadow: "0px 2px 5px rgba(0,0,0,0.1)" }}
          >
            {mentorInfo.frase}
          </p>
        </div>

        {medallaInfo && (
          <div
            className="mt-2.5 flex items-center gap-2.5 rounded-[20px] px-4 py-2.5"
            style={{
              background: "linear-gradient(132.49deg, #FFFFFF 26.1%, #FFF6DA 86.54%)",
              border: "1px solid #F9F9F9",
              boxShadow: "inset 0px 4px 4px rgba(255,255,255,0.25)",
            }}
          >
            <span className="relative flex h-[34px] w-[34px] shrink-0 items-center justify-center">
              <Image src="/marco.png" alt="" width={34} height={34} className="absolute inset-0 h-full w-full" />
              <span className="relative text-base">{medallaInfo.emoji}</span>
            </span>
            <div className="text-left">
              <div className="font-semibold" style={{ fontSize: 8, color: "#883900" }}>
                MEDALLA DESBLOQUEADA
              </div>
              <div className="font-extrabold text-xs" style={{ color: "#883900" }}>
                {medallaInfo.nombre}
              </div>
            </div>
          </div>
        )}

        <button
          className="mt-5 flex items-center gap-2 rounded-full px-6 py-3.5 font-black text-lg text-white"
          style={{
            background: "linear-gradient(180deg, #FDBA05 0%, #E85503 87.96%)",
            border: "1px solid #E27100",
            boxShadow: "0px 4px 4px rgba(0,0,0,0.41), inset 0px 4px 4px rgba(255,255,255,0.25)",
            textShadow: "0px 2px 2.4px #883900",
          }}
          onClick={onContinuar}
        >
          Continuar
          <Image src="/icon-left-arrow.png" alt="" width={14} height={14} style={{ transform: "rotate(180deg)" }} />
        </button>
      </div>
    </div>
  );
}

function ResultadoConsecuencia({
  narrativa,
  tono,
  ingresoAntes,
  ingresoDespues,
  skills,
  medallaDesbloqueada,
  mentorActivado,
  cabritaReflexion,
  onContinuar,
  pais,
}: {
  narrativa: string;
  tono: "positivo" | "negativo";
  ingresoAntes: number;
  ingresoDespues: number;
  skills: Record<string, number>;
  medallaDesbloqueada: string | null;
  mentorActivado: string | null;
  cabritaReflexion: string | null;
  onContinuar: () => void;
  pais: PaisId;
}) {
  const bloques = dividirEnBloques(narrativa);
  const [pagina, setPagina] = useState(0);
  const [mostrarMentor, setMostrarMentor] = useState(false);
  const esUltimaPagina = pagina >= bloques.length - 1;
  const tema = TEMA_NARRATIVA[tono];
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contenedorRef.current?.scrollTo(0, 0);
  }, [pagina]);

  const diferencia = ingresoDespues - ingresoAntes;
  const skillsEntries = Object.entries(skills ?? {}).filter(([, v]) => v !== 0);
  const medallaInfo = medallaDesbloqueada ? medalla(medallaDesbloqueada) : undefined;
  const mentorInfo = mentorActivado ? mentor(mentorActivado) : undefined;

  if (mostrarMentor && mentorInfo) {
    return <NuevoMentorScreen mentorInfo={mentorInfo} medallaInfo={medallaInfo} onContinuar={onContinuar} />;
  }

  return (
    <div ref={contenedorRef} className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto">
      <Image src={tema.fondo} alt="" fill priority sizes="100vw" className="pointer-events-none object-cover" />

      <div
        className="narrativa-bloque relative mt-[63px] w-[354px] max-w-[88%] rounded-[20px] bg-white p-5"
        style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.15)" }}
      >
        <ReactMarkdown>{bloques[pagina] ?? ""}</ReactMarkdown>
      </div>

      {!esUltimaPagina ? (
        <button
          className="relative mt-6 flex items-center gap-2 rounded-full px-6 py-3.5 font-black text-lg text-white"
          style={{
            background: "linear-gradient(180deg, rgba(253,186,5,0.26) 0%, rgba(232,85,3,0.26) 87.96%)",
            border: "1px solid #E27100",
            boxShadow: "0px 4px 4px rgba(0,0,0,0.41), inset 0px 4px 4px rgba(255,255,255,0.25)",
            textShadow: "0px 2px 2.4px #883900",
          }}
          onClick={() => setPagina((p) => p + 1)}
        >
          Siguiente {pagina + 1}/{bloques.length}
          <Image src="/icon-left-arrow.png" alt="" width={14} height={14} style={{ transform: "rotate(180deg)" }} />
        </button>
      ) : (
        <>
          <button
            className="relative mt-6 flex items-center gap-2 rounded-full px-6 py-3.5 font-black text-lg text-white"
            style={{
              background: "linear-gradient(180deg, #FDBA05 0%, #E85503 87.96%)",
              border: "1px solid #E27100",
              boxShadow: "0px 4px 4px rgba(0,0,0,0.41), inset 0px 4px 4px rgba(255,255,255,0.25)",
              textShadow: "0px 2px 2.4px #883900",
            }}
            onClick={() => (mentorInfo ? setMostrarMentor(true) : onContinuar())}
          >
            Continuar
            <Image src="/icon-left-arrow.png" alt="" width={14} height={14} style={{ transform: "rotate(180deg)" }} />
          </button>

          {medallaInfo && !mentorInfo && (
            <div className="relative mt-4 flex items-center gap-3 rounded-2xl bg-white p-4">
              <span className="text-3xl">{medallaInfo.emoji}</span>
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wide text-amber-600">Medalla desbloqueada</div>
                <div className="font-extrabold">{medallaInfo.nombre}</div>
              </div>
            </div>
          )}

          {(diferencia !== 0 || skillsEntries.length > 0) && (
            <>
              <p
                className="relative mt-4 font-semibold text-sm text-white"
                style={{ textShadow: "0px 2px 5px rgba(0,0,0,0.4)" }}
              >
                Esa decisión te generó:
              </p>
              <div className="relative mt-2 flex flex-wrap justify-center gap-2 px-6">
                {diferencia !== 0 && (
                  <PildoraDelta
                    texto={`${diferencia > 0 ? "+" : ""}${formatoPesos(diferencia, pais)}/mes`}
                    positivo={diferencia > 0}
                  />
                )}
                {skillsEntries.map(([skill, valor]) => (
                  <PildoraDelta
                    key={skill}
                    texto={`${nombreSkill(skill)} ${valor > 0 ? "+" : ""}${valor}`}
                    positivo={valor > 0}
                  />
                ))}
              </div>
            </>
          )}

          {cabritaReflexion && (
            <div
              className="relative mt-4 flex items-start gap-3 rounded-2xl bg-white p-4 text-left"
              style={{ maxWidth: 320 }}
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#fdba05]">
                <Image src="/cabrita-completa.png" alt="La Cabrita" fill sizes="40px" className="object-cover" style={{ objectPosition: "50% 34%" }} />
              </div>
              <p className="text-sm italic text-neutral-700">{cabritaReflexion}</p>
            </div>
          )}
        </>
      )}

      <div className="relative mt-auto w-full pt-6">
        <Image
          src={tema.goat}
          alt=""
          width={402}
          height={396}
          className="mx-auto h-auto w-full max-w-[402px]"
          style={tema.espejarGoat ? { transform: "scaleX(-1)" } : undefined}
        />
      </div>
    </div>
  );
}

function EventoCard({
  evento,
  opcionSeleccionada,
  onSeleccionar,
  onConfirmar,
}: {
  evento: EventoGenerado;
  opcionSeleccionada: string | null;
  onSeleccionar: (letra: string) => void;
  onConfirmar: () => void;
}) {
  return (
    <TarjetaPregunta
      tipo={evento.tipo}
      texto={evento.texto}
      opciones={evento.opciones.map((o) => ({ letra: o.letra, texto: o.texto, emoji: o.emoji }))}
      opcionSeleccionada={opcionSeleccionada}
      onSeleccionar={onSeleccionar}
      onConfirmar={onConfirmar}
    />
  );
}

// Solo aparece una vez por partida, cuando el ingreso ya cruzó el umbral
// económico de GOAT — ver calificaParaGoatEconomico en lib/motor.ts. A
// propósito no se ve como una encuesta (nada de escalas ni "1 al 10"): es
// un momento narrativo más, con solo 2 opciones en vez de 4, sin marco de
// tiempo ni contador de opción seleccionada previa a elegir.
function ReflexionFinalCard({
  reflexion,
  onResponder,
}: {
  reflexion: ReflexionFinalGenerada;
  onResponder: (respuestaFeliz: boolean) => void;
}) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-6 pb-6"
      style={{ background: "linear-gradient(132.49deg, var(--resumen-bg-from) 26.1%, var(--resumen-bg-to) 86.54%)" }}
    >
      <div
        className="w-full max-w-[360px] flex flex-col items-center px-6 pt-8 pb-7"
        style={{
          background: "var(--resumen-card-bg)",
          border: "2px solid var(--resumen-card-border)",
          borderRadius: 25,
          boxShadow: "0px 4px 4px rgba(0,0,0,0.25)",
        }}
      >
        <span className="text-4xl">🪞</span>
        <div
          className="mt-4 text-center"
          style={{ fontWeight: 700, fontSize: 17, lineHeight: "140%", color: "var(--resumen-ink-2)" }}
        >
          <ReactMarkdown>{reflexion.texto}</ReactMarkdown>
        </div>

        <div className="mt-6 flex w-full flex-col gap-3">
          <button
            className="w-full rounded-full py-3.5 px-5 text-left font-bold transition-colors"
            style={{ background: "var(--resumen-cta-from, #FDBA05)", color: "#FFFFFF", fontSize: 15 }}
            onClick={() => onResponder(true)}
          >
            {reflexion.opcionSi}
          </button>
          <button
            className="w-full rounded-full py-3.5 px-5 text-left font-bold transition-colors"
            style={{
              background: "transparent",
              border: "2px solid var(--resumen-card-border)",
              color: "var(--resumen-ink-2)",
              fontSize: 15,
            }}
            onClick={() => onResponder(false)}
          >
            {reflexion.opcionNo}
          </button>
        </div>
      </div>
    </div>
  );
}
