"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PREGUNTAS_ONBOARDING } from "@/lib/data/onboarding";
import { CONFIG_PAIS, type PaisId } from "@/lib/data/paises";
import PantallaCarga from "@/app/juego/PantallaCarga";
import TutorialCabrita from "./TutorialCabrita";

const TUTORIAL_BEATS = 7;

type Paso =
  | { tipo: "tutorial"; index: number }
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

export default function OnboardingWizard({
  nombre,
  datosCompletos,
  programaSlug,
  paisInicial,
}: {
  // El nombre ya se pidió al crear la cuenta (ver /juego/registro) — este
  // wizard nunca lo vuelve a preguntar.
  nombre: string;
  // true si el jugador ya jugó una partida antes y edad/genero/ciudad/
  // contexto/trabaja ya están guardados en su cuenta — en ese caso el
  // wizard salta directo a las preguntas, no vuelve a pedir esos datos.
  datosCompletos: boolean;
  programaSlug?: string;
  paisInicial?: PaisId;
}) {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>(datosCompletos ? { tipo: "pregunta", index: 0 } : { tipo: "tutorial", index: 0 });
  const [error, setError] = useState<string | null>(null);

  // Si la partida viene de un link institucional (?programa=...), el país
  // ya viene decidido y no se le pregunta al jugador — solo se le pregunta
  // cuando entra directo, sin programa de por medio (ver lib/data/paises.ts).
  const paisLocked = paisInicial !== undefined;
  const [pais, setPais] = useState<PaisId>(paisInicial ?? "CO");
  const [edad, setEdad] = useState("");
  const [genero, setGenero] = useState("");
  const [ciudad, setCiudad] = useState(CONFIG_PAIS[paisInicial ?? "CO"].ciudadEjemplo);
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
          edad: edad ? Number(edad) : undefined,
          genero: genero || undefined,
          ciudad: ciudad || undefined,
          pais,
          programaSlug,
          contexto: contexto || undefined,
          trabaja: trabaja || undefined,
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
      <div className="relative flex flex-1 flex-col px-6 py-8 max-w-md mx-auto w-full">
        <div className="flex justify-center mb-6">
          <Image src="/logo-mark.png" alt="Modo GOAT" width={947} height={451} priority className="w-40 h-auto" />
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-white/95 border border-red-300 text-red-600 px-4 py-3 text-sm font-semibold">
            {error}
          </div>
        )}

        {(paso.tipo === "datos" || (paso.tipo === "tutorial" && paso.index <= 1)) && (
          <div
            className="flex flex-col gap-6 flex-1 justify-center"
            style={paso.tipo === "tutorial" ? { filter: "blur(6px)" } : undefined}
            aria-hidden={paso.tipo === "tutorial"}
            inert={paso.tipo === "tutorial" ? true : undefined}
          >
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

        {paso.tipo === "tutorial" && (
          <TutorialCabrita
            index={paso.index}
            onNext={() =>
              setPaso(paso.index + 1 < TUTORIAL_BEATS ? { tipo: "tutorial", index: paso.index + 1 } : { tipo: "datos" })
            }
          />
        )}

        {paso.tipo === "contexto" && (
          <div className="flex flex-col gap-6 flex-1 justify-center">
            <h1 className="text-2xl font-extrabold text-white">Tu contexto</h1>
            {!paisLocked && (
              <div>
                <label className="onboarding-label text-sm block mb-2">País</label>
                <div className="flex gap-2">
                  {(Object.keys(CONFIG_PAIS) as PaisId[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        // Solo cambia la ciudad si sigue en el default del
                        // país anterior — si el jugador ya la editó a mano,
                        // no se la pisamos.
                        setCiudad((actual) =>
                          Object.values(CONFIG_PAIS).some((c) => c.ciudadEjemplo === actual)
                            ? CONFIG_PAIS[p].ciudadEjemplo
                            : actual
                        );
                        setPais(p);
                      }}
                      className={`onboarding-option flex-1 py-3 ${pais === p ? "seleccionada" : ""}`}
                    >
                      {CONFIG_PAIS[p].nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}
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

        {paso.tipo === "enviando" && <PantallaCarga mensaje="Estamos armando tu personaje y el mundo que vas a vivir." />}
      </div>
    </main>
  );
}
