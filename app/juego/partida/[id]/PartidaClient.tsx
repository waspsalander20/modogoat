"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Decision, OpcionDecision, OpcionEvento } from "@/lib/types";
import type { EventoConTipo } from "@/lib/motor";
import { formatoPesos } from "@/lib/format";
import { nombreSkill } from "@/lib/data/skills";

interface TurnoResponse {
  terminado: boolean;
  anio?: number;
  decision?: Decision | null;
  eventos?: EventoConTipo[];
  eventosYaJugadosEsteAnio?: number;
}

type Fase =
  | { tipo: "cargando" }
  | { tipo: "decision"; decision: Decision; detalleAbierto: string | null; inicio: number }
  | { tipo: "campo_libre"; decision: Decision; opcion: OpcionDecision; inicio: number }
  | { tipo: "resultado_decision"; ingresoAntes: number; ingresoDespues: number; skillsSubidas: Record<string, number> }
  | { tipo: "evento"; evento: EventoConTipo; restantes: EventoConTipo[]; inicio: number }
  | {
      tipo: "resultado_evento";
      ingresoAntes: number;
      ingresoDespues: number;
      skillsModifica: Record<string, number>;
      consecuencia: string | null;
      restantes: EventoConTipo[];
    }
  | { tipo: "resumen_anio"; anio: number }
  | { tipo: "error"; mensaje: string };

export default function PartidaClient({ partidaId }: { partidaId: string }) {
  const router = useRouter();
  const [fase, setFase] = useState<Fase>({ tipo: "cargando" });
  const [ingresoActual, setIngresoActual] = useState<number | null>(null);
  const [edadActual, setEdadActual] = useState<number | null>(null);

  const cargarTurno = useCallback(async () => {
    setFase({ tipo: "cargando" });
    const res = await fetch(`/api/partida/${partidaId}/turno`);
    if (!res.ok) {
      setFase({ tipo: "error", mensaje: "No pudimos cargar tu partida." });
      return;
    }
    const data: TurnoResponse = await res.json();
    if (data.terminado) {
      router.push(`/juego/resultado/${partidaId}`);
      return;
    }
    if (data.anio) setEdadActual(data.anio);

    if (data.decision) {
      setFase({ tipo: "decision", decision: data.decision, detalleAbierto: null, inicio: Date.now() });
    } else if (data.eventos && data.eventos.length > 0) {
      const [primero, ...resto] = data.eventos;
      setFase({ tipo: "evento", evento: primero, restantes: resto, inicio: Date.now() });
    } else {
      setFase({ tipo: "resumen_anio", anio: data.anio ?? 0 });
    }
  }, [partidaId, router]);

  useEffect(() => {
    // Carga inicial del turno al montar/cambiar de partida; el resto de las
    // transiciones de fase ocurren por acción directa del jugador, no por efectos.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarTurno();
  }, [cargarTurno]);

  async function elegirOpcionDecision(decision: Decision, opcion: OpcionDecision, inicio: number) {
    if (decision.tieneCampoLibre) {
      setFase({ tipo: "campo_libre", decision, opcion, inicio });
      return;
    }
    await confirmarDecision(decision, opcion, inicio, undefined);
  }

  async function confirmarDecision(decision: Decision, opcion: OpcionDecision, inicio: number, campoLibre?: string) {
    const tiempoRespuesta = (Date.now() - inicio) / 1000;
    const res = await fetch(`/api/partida/${partidaId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decisionId: decision.id,
        opcionLetra: opcion.letra,
        campoLibre,
        tiempoRespuesta,
      }),
    });
    if (!res.ok) {
      setFase({ tipo: "error", mensaje: "No pudimos guardar tu decisión." });
      return;
    }
    const data = await res.json();
    setIngresoActual(data.ingresoDespues);
    setFase({
      tipo: "resultado_decision",
      ingresoAntes: data.ingresoAntes,
      ingresoDespues: data.ingresoDespues,
      skillsSubidas: data.skillsSubidas,
    });
  }

  async function despuesDeDecision() {
    const res = await fetch(`/api/partida/${partidaId}/turno`);
    const data: TurnoResponse = await res.json();
    if (data.eventos && data.eventos.length > 0) {
      const [primero, ...resto] = data.eventos;
      setFase({ tipo: "evento", evento: primero, restantes: resto, inicio: Date.now() });
    } else {
      setFase({ tipo: "resumen_anio", anio: data.anio ?? edadActual ?? 0 });
    }
  }

  async function elegirOpcionEvento(evento: EventoConTipo, opcion: OpcionEvento, restantes: EventoConTipo[], inicio: number) {
    const tiempoRespuesta = (Date.now() - inicio) / 1000;
    const res = await fetch(`/api/partida/${partidaId}/evento`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventoId: evento.id,
        tipoEvento: evento.tipoEvento,
        opcionLetra: opcion.letra,
        tiempoRespuesta,
      }),
    });
    if (!res.ok) {
      setFase({ tipo: "error", mensaje: "No pudimos guardar tu decisión." });
      return;
    }
    const data = await res.json();
    setIngresoActual(data.ingresoDespues);
    setFase({
      tipo: "resultado_evento",
      ingresoAntes: data.ingresoAntes,
      ingresoDespues: data.ingresoDespues,
      skillsModifica: data.skillsModifica,
      consecuencia: data.consecuencia,
      restantes,
    });
  }

  function siguienteEvento(restantes: EventoConTipo[]) {
    if (restantes.length > 0) {
      const [primero, ...resto] = restantes;
      setFase({ tipo: "evento", evento: primero, restantes: resto, inicio: Date.now() });
    } else {
      setFase({ tipo: "resumen_anio", anio: edadActual ?? 0 });
    }
  }

  async function finalizarAnio() {
    setFase({ tipo: "cargando" });
    const res = await fetch(`/api/partida/${partidaId}/fin-anio`, { method: "POST" });
    if (!res.ok) {
      setFase({ tipo: "error", mensaje: "No pudimos avanzar de año." });
      return;
    }
    const data = await res.json();
    if (data.terminado) {
      router.push(`/juego/resultado/${partidaId}`);
      return;
    }
    cargarTurno();
  }

  return (
    <main className="flex flex-1 flex-col px-6 py-8 max-w-md mx-auto w-full">
      <header className="flex items-center justify-between mb-6 text-sm">
        <span className="font-bold">Año {edadActual ?? "..."}</span>
        {ingresoActual !== null && (
          <span className="text-goat-accent font-bold">{formatoPesos(ingresoActual)}/mes</span>
        )}
      </header>

      {fase.tipo === "cargando" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-4xl animate-pulse">🐐</div>
        </div>
      )}

      {fase.tipo === "error" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-goat-bad">{fase.mensaje}</p>
          <button className="btn-secondary" onClick={cargarTurno}>
            Reintentar
          </button>
        </div>
      )}

      {fase.tipo === "decision" && (
        <div className="flex flex-col gap-5 flex-1">
          <div>
            <h2 className="text-lg font-extrabold mb-1">{fase.decision.titulo}</h2>
            <p className="text-goat-ink-muted">{fase.decision.texto}</p>
          </div>
          <div className="flex flex-col gap-3">
            {fase.decision.opciones.map((o) => (
              <div key={o.letra} className="opcion-btn p-4">
                <button
                  className="text-left w-full"
                  onClick={() => elegirOpcionDecision(fase.decision, o, fase.inicio)}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <span>{o.emoji}</span>
                    <span>{o.titulo}</span>
                  </div>
                  {o.descripcion && <p className="text-goat-ink-muted text-sm">{o.descripcion}</p>}
                </button>
                {(o.pros || o.contras) && (
                  <button
                    className="text-xs text-goat-accent mt-2 font-bold"
                    onClick={() =>
                      setFase({
                        ...fase,
                        detalleAbierto: fase.detalleAbierto === o.letra ? null : o.letra,
                      })
                    }
                  >
                    {fase.detalleAbierto === o.letra ? "Ocultar detalle" : "Ver detalle"}
                  </button>
                )}
                {fase.detalleAbierto === o.letra && (
                  <div className="mt-2 text-xs space-y-1">
                    {o.pros && (
                      <p>
                        <span className="text-goat-good font-bold">Pros: </span>
                        {o.pros.join(", ")}
                      </p>
                    )}
                    {o.contras && (
                      <p>
                        <span className="text-goat-bad font-bold">Contras: </span>
                        {o.contras.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {fase.tipo === "campo_libre" && (
        <CampoLibreForm
          textoCampoLibre={fase.decision.textoCampoLibre ?? "Contanos más"}
          onSubmit={(texto) => confirmarDecision(fase.decision, fase.opcion, fase.inicio, texto)}
        />
      )}

      {fase.tipo === "resultado_decision" && (
        <ResultadoConsecuencia
          ingresoAntes={fase.ingresoAntes}
          ingresoDespues={fase.ingresoDespues}
          skills={fase.skillsSubidas}
          onContinuar={despuesDeDecision}
        />
      )}

      {fase.tipo === "evento" && (
        <EventoCard
          evento={fase.evento}
          onElegir={(opcion) => elegirOpcionEvento(fase.evento, opcion, fase.restantes, fase.inicio)}
        />
      )}

      {fase.tipo === "resultado_evento" && (
        <ResultadoConsecuencia
          ingresoAntes={fase.ingresoAntes}
          ingresoDespues={fase.ingresoDespues}
          skills={fase.skillsModifica}
          consecuencia={fase.consecuencia}
          onContinuar={() => siguienteEvento(fase.restantes)}
        />
      )}

      {fase.tipo === "resumen_anio" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
          <div className="text-5xl">📅</div>
          <h2 className="text-xl font-extrabold">Cerraste el año {fase.anio}</h2>
          <p className="text-goat-ink-muted text-sm max-w-xs">
            {ingresoActual !== null ? `Ingreso actual: ${formatoPesos(ingresoActual)}/mes` : ""}
          </p>
          <button className="btn-primary" onClick={finalizarAnio}>
            Siguiente año →
          </button>
        </div>
      )}
    </main>
  );
}

function CampoLibreForm({ textoCampoLibre, onSubmit }: { textoCampoLibre: string; onSubmit: (texto: string) => void }) {
  const [valor, setValor] = useState("");
  return (
    <div className="flex flex-col gap-5 flex-1 justify-center">
      <h2 className="text-lg font-extrabold">{textoCampoLibre}</h2>
      <input
        autoFocus
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Ej: diseño gráfico, mecánica, enfermería..."
        className="bg-goat-surface-2 border border-goat-border rounded-xl px-4 py-3 outline-none focus:border-goat-accent"
      />
      <button className="btn-primary self-start" disabled={!valor.trim()} onClick={() => onSubmit(valor.trim())}>
        Confirmar
      </button>
    </div>
  );
}

function ResultadoConsecuencia({
  ingresoAntes,
  ingresoDespues,
  skills,
  consecuencia,
  onContinuar,
}: {
  ingresoAntes: number;
  ingresoDespues: number;
  skills: Record<string, number>;
  consecuencia?: string | null;
  onContinuar: () => void;
}) {
  const diferencia = ingresoDespues - ingresoAntes;
  const skillsEntries = Object.entries(skills).filter(([, v]) => v !== 0);
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
      <div className="text-5xl">{diferencia > 0 ? "📈" : diferencia < 0 ? "📉" : "➡️"}</div>
      {consecuencia && <p className="text-goat-ink-muted max-w-xs">{consecuencia}</p>}
      {diferencia !== 0 && (
        <p className={diferencia > 0 ? "text-goat-good font-bold" : "text-goat-bad font-bold"}>
          {diferencia > 0 ? "+" : ""}
          {formatoPesos(diferencia)}/mes
        </p>
      )}
      {skillsEntries.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {skillsEntries.map(([skill, valor]) => (
            <span key={skill} className="text-xs bg-goat-surface-2 border border-goat-border rounded-full px-3 py-1">
              {nombreSkill(skill)} {valor > 0 ? `+${valor}` : valor}
            </span>
          ))}
        </div>
      )}
      <button className="btn-primary" onClick={onContinuar}>
        Continuar
      </button>
    </div>
  );
}

function EventoCard({ evento, onElegir }: { evento: EventoConTipo; onElegir: (opcion: OpcionEvento) => void }) {
  const esImprevisto = evento.tipoEvento === "imprevisto";
  return (
    <div className="flex flex-col gap-5 flex-1">
      <div
        className={`rounded-2xl p-5 border ${
          esImprevisto ? "border-goat-bad bg-goat-bad/10" : "border-goat-good bg-goat-good/10"
        }`}
      >
        <div className="text-xs font-bold uppercase tracking-wide mb-2">
          {esImprevisto ? "⚠️ Imprevisto" : "✨ Oportunidad"}
        </div>
        <div className="text-4xl mb-2">{evento.emoji}</div>
        <h2 className="text-lg font-extrabold mb-1">{evento.nombre}</h2>
        <p className="text-goat-ink-muted text-sm">{evento.texto}</p>
      </div>
      <div className="flex flex-col gap-3">
        {evento.opciones.map((o) => (
          <button key={o.letra} className="opcion-btn px-4 py-4 text-left" onClick={() => onElegir(o)}>
            {o.texto}
          </button>
        ))}
      </div>
    </div>
  );
}
