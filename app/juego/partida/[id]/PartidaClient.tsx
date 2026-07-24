"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import type { DecisionGenerada, EventoGenerado, OpcionGenerada } from "@/lib/aiMotor";
import type { ResumenAnio } from "@/lib/motor";
import { formatoPesos, formatoPesosCompacto } from "@/lib/format";
import { nombreSkill } from "@/lib/data/skills";
import { medalla } from "@/lib/data/medallas";
import { mentor } from "@/lib/data/mentores";
import { usePartidaHeader } from "./PartidaHeaderContext";

interface TurnoResponse {
  terminado: boolean;
  anio?: number;
  turno?: { tipo: "decision"; decision: DecisionGenerada } | { tipo: "evento"; evento: EventoGenerado } | null;
  resumen?: ResumenAnio | null;
  error?: string;
}

type Fase =
  | { tipo: "cargando" }
  | { tipo: "decision"; decision: DecisionGenerada; opcionSeleccionada: string | null; inicio: number }
  | { tipo: "campo_libre"; decision: DecisionGenerada; opcion: OpcionGenerada; inicio: number }
  | {
      tipo: "resultado";
      narrativa: string;
      ingresoAntes: number;
      ingresoDespues: number;
      skills: Record<string, number>;
      medallaDesbloqueada: string | null;
      mentorActivado: string | null;
      onContinuar: () => void;
    }
  | { tipo: "evento"; evento: EventoGenerado; opcionSeleccionada: string | null; inicio: number }
  | { tipo: "resumen_anio"; anio: number; resumen: ResumenAnio | null }
  | { tipo: "error"; mensaje: string };

export default function PartidaClient({ partidaId }: { partidaId: string }) {
  const router = useRouter();
  const { datos, refrescar } = usePartidaHeader();
  const [fase, setFase] = useState<Fase>({ tipo: "cargando" });

  const cargarTurno = useCallback(async () => {
    setFase({ tipo: "cargando" });
    const res = await fetch(`/api/partida/${partidaId}/turno`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFase({ tipo: "error", mensaje: data.error ?? "No pudimos cargar tu partida." });
      return;
    }
    const data: TurnoResponse = await res.json();
    if (data.terminado) {
      router.push(`/juego/resultado/${partidaId}`);
      return;
    }

    if (data.turno?.tipo === "decision") {
      setFase({ tipo: "decision", decision: data.turno.decision, opcionSeleccionada: null, inicio: Date.now() });
    } else if (data.turno?.tipo === "evento") {
      setFase({ tipo: "evento", evento: data.turno.evento, opcionSeleccionada: null, inicio: Date.now() });
    } else {
      setFase({ tipo: "resumen_anio", anio: data.anio ?? 0, resumen: data.resumen ?? null });
    }
  }, [partidaId, router]);

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
    setFase({
      tipo: "resultado",
      narrativa: data.narrativa,
      ingresoAntes: data.ingresoAntes,
      ingresoDespues: data.ingresoDespues,
      skills: data.skillsModificadas,
      medallaDesbloqueada: data.medallaDesbloqueada ?? null,
      mentorActivado: data.mentorActivado ?? null,
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
      ingresoAntes: data.ingresoAntes,
      ingresoDespues: data.ingresoDespues,
      skills: data.skillsModificadas,
      medallaDesbloqueada: data.medallaDesbloqueada ?? null,
      mentorActivado: data.mentorActivado ?? null,
      onContinuar: cargarTurno,
    });
  }

  async function finalizarAnio() {
    setFase({ tipo: "cargando" });
    const res = await fetch(`/api/partida/${partidaId}/fin-anio`, { method: "POST" });
    if (!res.ok) {
      setFase({ tipo: "error", mensaje: "No pudimos avanzar de año." });
      return;
    }
    const data = await res.json();
    refrescar();
    if (data.terminado) {
      router.push(`/juego/resultado/${partidaId}`);
      return;
    }
    cargarTurno();
  }

  return (
    <main className="flex flex-1 flex-col">
      {fase.tipo === "cargando" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="text-4xl animate-pulse">🐐</div>
          <p className="text-goat-ink-muted text-sm">Escribiendo tu historia...</p>
        </div>
      )}

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
          ingresoAntes={fase.ingresoAntes}
          ingresoDespues={fase.ingresoDespues}
          skills={fase.skills}
          medallaDesbloqueada={fase.medallaDesbloqueada}
          mentorActivado={fase.mentorActivado}
          onContinuar={fase.onContinuar}
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
        <ResumenAnioView anio={fase.anio} resumen={fase.resumen} nombre={datos?.nombre} onContinuar={finalizarAnio} />
      )}
    </main>
  );
}

function ResumenAnioView({
  anio,
  resumen,
  nombre,
  onContinuar,
}: {
  anio: number;
  resumen: ResumenAnio | null;
  nombre?: string;
  onContinuar: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col gap-5 px-5 py-6">
      <div className="text-center">
        <div className="text-5xl mb-2">🎂</div>
        <div className="text-xs font-extrabold text-goat-ink-muted uppercase tracking-wide mb-1">Resumen del año</div>
        <h2 className="text-3xl font-extrabold mb-1">{anio}</h2>
        {nombre && <p className="text-goat-ink-muted text-sm">Cerraste el año, {nombre}</p>}
      </div>

      {resumen && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl p-3 text-center bg-goat-good-bg">
              <div className="font-extrabold text-goat-good-text">
                {resumen.ingresoGanado >= 0 ? "+" : ""}
                {formatoPesosCompacto(resumen.ingresoGanado)}
              </div>
              <div className="text-[11px] text-goat-ink-muted mt-0.5">Ingreso</div>
            </div>
            <div className="rounded-2xl p-3 text-center bg-goat-accent-tint">
              <div className="font-extrabold text-goat-accent-solid">{resumen.skillsCount}</div>
              <div className="text-[11px] text-goat-ink-muted mt-0.5">Skills</div>
            </div>
            <div className="rounded-2xl p-3 text-center bg-amber-50">
              <div className="font-extrabold text-amber-600">{resumen.medallasEsteAnio.length}</div>
              <div className="text-[11px] text-goat-ink-muted mt-0.5">
                Medalla{resumen.medallasEsteAnio.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          {resumen.highlights.length > 0 && (
            <div className="flex flex-col gap-2">
              {resumen.highlights.map((h, i) => (
                <div key={i} className="card p-3 flex items-center gap-3">
                  <span className="text-xl">{h.icono}</span>
                  <span className="text-sm font-bold flex-1">{h.texto}</span>
                </div>
              ))}
            </div>
          )}

          {resumen.oportunidadPerdida && (
            <div className="card p-3 flex items-center gap-3 bg-goat-bad-bg border-none">
              <span className="text-xl">❌</span>
              <span className="text-sm font-bold flex-1">{resumen.oportunidadPerdida}</span>
            </div>
          )}

          {resumen.mejorMovimiento && (
            <div className="rounded-2xl p-4 bg-gradient-to-br from-[var(--goat-accent-from)] to-[var(--goat-accent-to)]">
              <div className="text-[11px] font-extrabold text-white/80 uppercase tracking-wide mb-1">
                Si haces una sola cosa el año {anio + 1}
              </div>
              <p className="text-white font-bold text-sm">{resumen.mejorMovimiento}</p>
            </div>
          )}
        </>
      )}

      <button className="btn-primary mt-1" onClick={onContinuar}>
        Arrancar el año {anio + 1} 🚀
      </button>
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
    <div className="flex flex-col gap-5 flex-1 px-5 py-6">
      <div className="card p-5">
        <div className="w-12 h-12 rounded-2xl bg-goat-accent-tint flex items-center justify-center text-2xl mb-3">
          🎯
        </div>
        <div className="text-xs font-extrabold text-goat-accent-solid uppercase tracking-wide mb-1">
          Decisión principal
        </div>
        <h2 className="text-lg font-extrabold mb-2">{decision.titulo}</h2>
        <div className="prose-narrativa text-goat-ink-muted text-sm">
          <ReactMarkdown>{decision.texto}</ReactMarkdown>
        </div>
      </div>

      <p className="text-center font-extrabold text-sm">¿Qué decides hacer?</p>

      <div className="flex flex-col gap-3">
        {decision.opciones.map((o) => {
          const seleccionada = opcionSeleccionada === o.letra;
          return (
            <button
              key={o.letra}
              onClick={() => onSeleccionar(o.letra)}
              className={`opcion-btn p-4 flex items-start gap-3 ${seleccionada ? "seleccionada border-goat-accent-solid" : ""}`}
            >
              <span className="badge-letra">{o.letra}</span>
              <div className="flex-1 text-left font-bold flex items-center gap-1.5">
                <span>{o.emoji}</span>
                <span>{o.titulo}</span>
              </div>
            </button>
          );
        })}
      </div>

      <button className="btn-primary" disabled={!opcionSeleccionada} onClick={onConfirmar}>
        {opcionSeleccionada ? "Continuar" : "Elige una opción para continuar"}
      </button>
    </div>
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
    <div className="flex flex-col gap-5 flex-1 justify-center px-6 py-8">
      <h2 className="text-lg font-extrabold">{textoCampoLibre}</h2>
      {mostrarAliento && (
        <div className="rounded-xl bg-goat-accent-tint border border-goat-accent-solid/30 px-4 py-3 text-sm">
          Está bien no saberlo todavía — prueba con una idea, aunque sea tentativa. Elige una de aquí abajo o escribe la tuya.
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {AREAS_SUGERIDAS.map((area) => (
          <button
            key={area}
            onClick={() => {
              setValor(area);
              setMostrarAliento(false);
            }}
            className="text-xs bg-goat-surface-2 border border-goat-border rounded-full px-3 py-1.5 hover:border-goat-accent-solid"
          >
            {area}
          </button>
        ))}
      </div>
      <input
        autoFocus
        value={valor}
        onChange={(e) => {
          setValor(e.target.value);
          setMostrarAliento(false);
        }}
        placeholder="Ej: diseño gráfico, mecánica, enfermería..."
        className="bg-goat-surface-2 border border-goat-border rounded-xl px-4 py-3 outline-none focus:border-goat-accent-solid"
      />
      <button className="btn-primary self-start" disabled={!valor.trim()} onClick={intentarConfirmar}>
        Confirmar
      </button>
    </div>
  );
}

function ResultadoConsecuencia({
  narrativa,
  ingresoAntes,
  ingresoDespues,
  skills,
  medallaDesbloqueada,
  mentorActivado,
  onContinuar,
}: {
  narrativa: string;
  ingresoAntes: number;
  ingresoDespues: number;
  skills: Record<string, number>;
  medallaDesbloqueada: string | null;
  mentorActivado: string | null;
  onContinuar: () => void;
}) {
  const diferencia = ingresoDespues - ingresoAntes;
  const skillsEntries = Object.entries(skills ?? {}).filter(([, v]) => v !== 0);
  const medallaInfo = medallaDesbloqueada ? medalla(medallaDesbloqueada) : undefined;
  const mentorInfo = mentorActivado ? mentor(mentorActivado) : undefined;
  return (
    <div className="flex-1 flex flex-col gap-5 px-6 py-8">
      <div className="card p-5">
        <div className="prose-narrativa text-sm leading-relaxed">
          <ReactMarkdown>{narrativa}</ReactMarkdown>
        </div>
      </div>

      {mentorInfo && (
        <div className="rounded-2xl p-4 flex items-center gap-3 bg-gradient-to-br from-[var(--goat-accent-from)] to-[var(--goat-accent-to)]">
          <span className="text-3xl">{mentorInfo.emoji}</span>
          <div>
            <div className="text-[11px] font-extrabold text-white/80 uppercase tracking-wide">Nuevo mentor</div>
            <div className="text-white font-extrabold">
              {mentorInfo.nombre} · {mentorInfo.perfil}
            </div>
          </div>
        </div>
      )}

      {medallaInfo && (
        <div className="rounded-2xl p-4 flex items-center gap-3 bg-amber-50">
          <span className="text-3xl">{medallaInfo.emoji}</span>
          <div>
            <div className="text-[11px] font-extrabold text-amber-600 uppercase tracking-wide">Medalla desbloqueada</div>
            <div className="font-extrabold">{medallaInfo.nombre}</div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-3 text-center">
        {diferencia !== 0 && (
          <p className={diferencia > 0 ? "text-goat-good-text font-bold text-lg" : "text-goat-bad font-bold text-lg"}>
            {diferencia > 0 ? "+" : ""}
            {formatoPesos(diferencia)}/mes
          </p>
        )}
        {skillsEntries.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {skillsEntries.map(([skill, valor]) => (
              <span key={skill} className="pill-skill">
                {nombreSkill(skill)} {valor > 0 ? `+${valor}` : valor}
              </span>
            ))}
          </div>
        )}
      </div>

      <button className="btn-primary" onClick={onContinuar}>
        Continuar
      </button>
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
  const esImprevisto = evento.tipo === "imprevisto";
  const colorOpcion = ["bg-emerald-500", "bg-sky-500", "bg-amber-500", "bg-violet-500"];

  return (
    <div className="flex flex-col flex-1">
      <div className={`px-6 py-8 text-center flex flex-col items-center gap-3 ${esImprevisto ? "bg-red-600" : "bg-emerald-600"}`}>
        <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-extrabold uppercase tracking-wide px-3 py-1.5 rounded-full">
          {esImprevisto ? "⚡" : "🌟"} {esImprevisto ? "Imprevisto" : "Oportunidad"}
        </span>
        <div className="text-5xl">{evento.emoji}</div>
        <div className="prose-narrativa font-extrabold text-lg leading-snug [&_p]:!text-white [&_strong]:!text-white [&_blockquote]:!text-white/90 [&_blockquote]:!border-white/50">
          <ReactMarkdown>{evento.texto}</ReactMarkdown>
        </div>
        <p className="text-white/80 text-sm font-bold">¿Qué hace tu personaje?</p>
      </div>

      <div className="flex flex-col gap-3 px-5 py-6 flex-1">
        <div className="flex flex-col gap-3">
          {evento.opciones.map((o, i) => {
            const seleccionada = opcionSeleccionada === o.letra;
            return (
              <button
                key={o.letra}
                onClick={() => onSeleccionar(o.letra)}
                className={`${colorOpcion[i % colorOpcion.length]} rounded-2xl p-4 flex items-center gap-3 text-left transition-transform ${
                  seleccionada ? "ring-4 ring-offset-2 ring-goat-ink scale-[1.02]" : ""
                }`}
              >
                <span className="text-2xl">{o.emoji}</span>
                <span className="flex-1 text-white font-bold">{o.texto}</span>
              </button>
            );
          })}
        </div>

        <button className="btn-primary mt-1" disabled={!opcionSeleccionada} onClick={onConfirmar}>
          {opcionSeleccionada ? "Continuar" : "Elige una opción para continuar"}
        </button>
      </div>
    </div>
  );
}
