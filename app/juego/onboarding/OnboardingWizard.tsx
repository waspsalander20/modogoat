"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PREGUNTAS_ONBOARDING } from "@/lib/data/onboarding";

type Paso =
  | { tipo: "nombre" }
  | { tipo: "datos" }
  | { tipo: "contexto" }
  | { tipo: "pregunta"; index: number }
  | { tipo: "enviando" };

function mezclar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export default function OnboardingWizard() {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>({ tipo: "nombre" });
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState("");
  const [genero, setGenero] = useState("");
  const [ciudad, setCiudad] = useState("Medellín");
  const [contexto, setContexto] = useState("");
  const [trabaja, setTrabaja] = useState("");

  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [tiempos, setTiempos] = useState<Record<string, number>>({});
  // Date.now() aquí solo mide tiempo de respuesta para anti-troll; no afecta el render.
  // eslint-disable-next-line react-hooks/purity
  const [inicioPregunta, setInicioPregunta] = useState<number>(Date.now());

  const ordenOpciones = useMemo(
    () => PREGUNTAS_ONBOARDING.map((p) => mezclar(p.opciones)),
    []
  );

  function irAPregunta(index: number) {
    // eslint-disable-next-line react-hooks/purity -- solo se llama desde handlers de click
    setInicioPregunta(Date.now());
    setPaso({ tipo: "pregunta", index });
  }

  async function enviarPartida(respuestasFinal: Record<string, string>, tiemposFinal: Record<string, number>) {
    setPaso({ tipo: "enviando" });
    setError(null);
    try {
      const res = await fetch("/api/partida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          edad: Number(edad),
          genero,
          ciudad,
          contexto,
          trabaja,
          respuestas: respuestasFinal,
          tiempos: tiemposFinal,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo crear la partida");
      }
      const data = await res.json();
      router.push(`/juego/partida/${data.partidaId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal");
      setPaso({ tipo: "contexto" });
    }
  }

  function responder(letra: string) {
    if (paso.tipo !== "pregunta") return;
    const pregunta = PREGUNTAS_ONBOARDING[paso.index];
    // eslint-disable-next-line react-hooks/purity -- solo se llama desde handlers de click
    const tiempo = (Date.now() - inicioPregunta) / 1000;
    const nuevasRespuestas = { ...respuestas, [pregunta.id]: letra };
    const nuevosTiempos = { ...tiempos, [pregunta.id]: tiempo };
    setRespuestas(nuevasRespuestas);
    setTiempos(nuevosTiempos);

    if (paso.index + 1 < PREGUNTAS_ONBOARDING.length) {
      irAPregunta(paso.index + 1);
    } else {
      enviarPartida(nuevasRespuestas, nuevosTiempos);
    }
  }

  return (
    <main className="flex flex-1 flex-col px-6 py-10 max-w-md mx-auto w-full">
      {error && (
        <div className="mb-4 rounded-xl bg-goat-bad/15 border border-goat-bad text-goat-bad px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {paso.tipo === "nombre" && (
        <div className="flex flex-col gap-6 flex-1 justify-center">
          <div>
            <h1 className="text-2xl font-extrabold mb-2">¿Cómo te llamas?</h1>
            <p className="text-goat-ink-muted text-sm">Este va a ser tu personaje en Modo GOAT.</p>
          </div>
          <input
            autoFocus
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            className="bg-goat-surface-2 border border-goat-border rounded-xl px-4 py-3 text-lg outline-none focus:border-goat-accent"
          />
          <button
            className="btn-primary self-start"
            disabled={!nombre.trim()}
            onClick={() => setPaso({ tipo: "datos" })}
          >
            Continuar
          </button>
        </div>
      )}

      {paso.tipo === "datos" && (
        <div className="flex flex-col gap-6 flex-1 justify-center">
          <h1 className="text-2xl font-extrabold">Un par de datos, {nombre}</h1>
          <div>
            <label className="text-sm text-goat-ink-muted block mb-1">Edad actual (14–28)</label>
            <input
              type="number"
              min={14}
              max={28}
              value={edad}
              onChange={(e) => setEdad(e.target.value)}
              className="bg-goat-surface-2 border border-goat-border rounded-xl px-4 py-3 text-lg w-full outline-none focus:border-goat-accent"
            />
          </div>
          <div>
            <label className="text-sm text-goat-ink-muted block mb-2">Género</label>
            <div className="flex gap-2">
              {["masculino", "femenino", "otro"].map((g) => (
                <button
                  key={g}
                  onClick={() => setGenero(g)}
                  className={`flex-1 rounded-xl py-3 border capitalize ${
                    genero === g ? "bg-goat-accent text-goat-accent-ink border-goat-accent font-bold" : "border-goat-border"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <button
            className="btn-primary self-start"
            disabled={!edad || Number(edad) < 14 || Number(edad) > 28 || !genero}
            onClick={() => setPaso({ tipo: "contexto" })}
          >
            Continuar
          </button>
        </div>
      )}

      {paso.tipo === "contexto" && (
        <div className="flex flex-col gap-6 flex-1 justify-center">
          <h1 className="text-2xl font-extrabold">Tu contexto</h1>
          <div>
            <label className="text-sm text-goat-ink-muted block mb-1">Ciudad</label>
            <input
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              className="bg-goat-surface-2 border border-goat-border rounded-xl px-4 py-3 text-lg w-full outline-none focus:border-goat-accent"
            />
          </div>
          <div>
            <label className="text-sm text-goat-ink-muted block mb-2">¿Con quién vivís?</label>
            <div className="flex flex-col gap-2">
              {[
                { v: "familia_completa", t: "Familia completa" },
                { v: "solo_mama", t: "Solo con mamá" },
                { v: "solo_papa", t: "Solo con papá" },
                { v: "otros_familiares", t: "Otros familiares" },
                { v: "solo", t: "Solo/a" },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setContexto(o.v)}
                  className={`opcion-btn px-4 py-3 ${contexto === o.v ? "border-goat-accent" : ""}`}
                >
                  {o.t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-goat-ink-muted block mb-2">¿Trabajás actualmente?</label>
            <div className="flex gap-2">
              {[
                { v: "si", t: "Sí" },
                { v: "a_veces", t: "A veces" },
                { v: "no", t: "No" },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setTrabaja(o.v)}
                  className={`flex-1 rounded-xl py-3 border ${
                    trabaja === o.v ? "bg-goat-accent text-goat-accent-ink border-goat-accent font-bold" : "border-goat-border"
                  }`}
                >
                  {o.t}
                </button>
              ))}
            </div>
          </div>
          <button
            className="btn-primary self-start"
            disabled={!contexto || !trabaja}
            onClick={() => irAPregunta(0)}
          >
            Empezar mi historia
          </button>
        </div>
      )}

      {paso.tipo === "pregunta" && (
        <div className="flex flex-col gap-6 flex-1 justify-center">
          <div className="text-xs text-goat-ink-muted font-bold uppercase tracking-wide">
            {paso.index + 1} / {PREGUNTAS_ONBOARDING.length}
          </div>
          <h1 className="text-xl font-extrabold leading-snug">
            {PREGUNTAS_ONBOARDING[paso.index].texto(nombre)}
          </h1>
          <div className="flex flex-col gap-3">
            {ordenOpciones[paso.index].map((o) => (
              <button key={o.letra} onClick={() => responder(o.letra)} className="opcion-btn px-4 py-4 text-left">
                {o.texto}
              </button>
            ))}
          </div>
        </div>
      )}

      {paso.tipo === "enviando" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <div className="text-5xl animate-bounce">🐐</div>
          <p className="text-goat-ink-muted">Armando tu historia...</p>
        </div>
      )}
    </main>
  );
}
