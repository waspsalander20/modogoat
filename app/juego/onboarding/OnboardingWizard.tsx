"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
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
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<string | null>(null);
  // Date.now() aquí solo mide tiempo de respuesta para anti-troll; no afecta el render.
  // eslint-disable-next-line react-hooks/purity
  const [inicioPregunta, setInicioPregunta] = useState<number>(Date.now());

  const ordenOpciones = useMemo(
    () => PREGUNTAS_ONBOARDING.map((p) => mezclar(p.opciones)),
    []
  );

  function irAPregunta(index: number) {
    setInicioPregunta(Date.now());
    setOpcionSeleccionada(null);
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
    <main className="onboarding-bg flex flex-1 flex-col">
      <div className="flex flex-1 flex-col px-6 py-8 max-w-md mx-auto w-full">
        <div className="flex justify-center mb-6">
          <Image src="/logo-mark.png" alt="Modo GOAT" width={947} height={451} priority className="w-40 h-auto" />
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-white/95 border border-red-300 text-red-600 px-4 py-3 text-sm font-semibold">
            {error}
          </div>
        )}

        {paso.tipo === "nombre" && (
          <div className="flex flex-col gap-6 flex-1 justify-center">
            <div>
              <h1 className="text-3xl font-extrabold text-white mb-2">¿Cómo te llamas?</h1>
              <p className="onboarding-label text-sm">Este va ser tu personaje en <strong>MODO GOAT</strong>.</p>
            </div>
            <input
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre..."
              className="onboarding-input"
            />
            <button
              className="btn-onboarding self-start"
              disabled={!nombre.trim()}
              onClick={() => setPaso({ tipo: "datos" })}
            >
              Continuar ›
            </button>
          </div>
        )}

        {paso.tipo === "datos" && (
          <div className="flex flex-col gap-6 flex-1 justify-center">
            <h1 className="text-2xl font-extrabold text-white">Un par de datos, {nombre}</h1>
            <div>
              <label className="onboarding-label text-sm block mb-2">Edad actual (14–28)</label>
              <input
                type="number"
                min={14}
                max={28}
                value={edad}
                onChange={(e) => setEdad(e.target.value)}
                className="onboarding-input w-full"
              />
            </div>
            <div>
              <label className="onboarding-label text-sm block mb-2">Género</label>
              <div className="flex gap-2">
                {["masculino", "femenino", "otro"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenero(g)}
                    className={`onboarding-option flex-1 py-3 capitalize ${genero === g ? "seleccionada" : ""}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="btn-onboarding self-start"
              disabled={!edad || Number(edad) < 14 || Number(edad) > 28 || !genero}
              onClick={() => setPaso({ tipo: "contexto" })}
            >
              Continuar ›
            </button>
          </div>
        )}

        {paso.tipo === "contexto" && (
          <div className="flex flex-col gap-6 flex-1 justify-center">
            <h1 className="text-2xl font-extrabold text-white">Tu contexto</h1>
            <div>
              <label className="onboarding-label text-sm block mb-2">Ciudad</label>
              <input
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                className="onboarding-input w-full"
              />
            </div>
            <div>
              <label className="onboarding-label text-sm block mb-2">¿Con quién vives?</label>
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
                    className={`onboarding-option px-4 py-3 text-left ${contexto === o.v ? "seleccionada" : ""}`}
                  >
                    {o.t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="onboarding-label text-sm block mb-2">¿Trabajas actualmente?</label>
              <div className="flex gap-2">
                {[
                  { v: "si", t: "Sí" },
                  { v: "a_veces", t: "A veces" },
                  { v: "no", t: "No" },
                ].map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setTrabaja(o.v)}
                    className={`onboarding-option flex-1 py-3 ${trabaja === o.v ? "seleccionada" : ""}`}
                  >
                    {o.t}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="btn-onboarding self-start"
              disabled={!contexto || !trabaja}
              onClick={() => irAPregunta(0)}
            >
              Empezar mi historia ›
            </button>
          </div>
        )}

        {paso.tipo === "pregunta" && (
          <div className="flex flex-col gap-6 flex-1 justify-center">
            <div className="onboarding-label text-xs font-extrabold uppercase tracking-wide">
              {paso.index + 1} / {PREGUNTAS_ONBOARDING.length}
            </div>
            <h1 className="text-xl font-extrabold leading-snug text-white">
              {PREGUNTAS_ONBOARDING[paso.index].texto(nombre)}
            </h1>
            <div className="flex flex-col gap-3">
              {ordenOpciones[paso.index].map((o) => (
                <button
                  key={o.letra}
                  onClick={() => setOpcionSeleccionada(o.letra)}
                  className={`onboarding-option px-4 py-4 text-left ${opcionSeleccionada === o.letra ? "seleccionada" : ""}`}
                >
                  {o.texto}
                </button>
              ))}
            </div>
            <button
              className="btn-onboarding self-start"
              disabled={!opcionSeleccionada}
              onClick={() => responder(opcionSeleccionada!)}
            >
              Siguiente ›
            </button>
          </div>
        )}

        {paso.tipo === "enviando" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="text-5xl animate-bounce">🐐</div>
            <p className="text-white font-semibold">Armando tu historia...</p>
          </div>
        )}
      </div>
    </main>
  );
}
