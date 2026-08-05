"use client";

import Image from "next/image";

interface Beat {
  texto: string;
  mascota: "completa" | "medio" | "cerca";
  // Banner ancho (mismo estilo que los badges reales del juego) o retrato
  // (mentor) que corona la lámina — solo en los beats 2-6, que no tienen una
  // pantalla real detrás para mostrar en su lugar.
  topper?: { src: string; alt: string; forma: "banner" | "retrato" };
  boton?: string;
}

const BEATS: Beat[] = [
  {
    texto: "¡Hola! Vas a vivir varios años de tu vida — sin salir de donde estás.",
    mascota: "completa",
  },
  {
    texto: "Primero te voy a preguntar algunas cosas sobre ti, para armar tu historia según quién eres tú.",
    mascota: "medio",
  },
  {
    texto: 'En cada año vas a tomar decisiones — 4 caminos posibles cada vez. No hay una respuesta "correcta", solo la que se sienta más tú.',
    mascota: "cerca",
    topper: { src: "/badge-decision.png", alt: "Decisión", forma: "banner" },
  },
  {
    texto: "A veces la vida te va a sorprender — un imprevisto, una oportunidad. Lo que hagas con eso también cuenta.",
    mascota: "completa",
    topper: { src: "/badge-imprevisto.png", alt: "Imprevisto", forma: "banner" },
  },
  {
    texto: "Vas a conocer mentores en el camino — gente que te va a dar consejos según lo que estés viviendo.",
    mascota: "medio",
    topper: { src: "/mentor-andrea.png", alt: "Mentores", forma: "retrato" },
  },
  {
    texto: "Cada logro se convierte en una medalla. Colecciónalas todas si puedes.",
    mascota: "cerca",
    topper: { src: "/badge-medallas.png", alt: "Medallas", forma: "banner" },
  },
  {
    texto: "Esto no es un examen que puedas reprobar — es tu historia. Y tienes hasta 3 caminos distintos para explorar quién podrías llegar a ser.",
    mascota: "completa",
    boton: "Vamos",
  },
];

export default function TutorialCabrita({ index, onNext }: { index: number; onNext: () => void }) {
  const beat = BEATS[index];
  // Los primeros 2 beats se superponen sobre el onboarding real (desenfocado
  // detrás, ver OnboardingWizard.tsx) — de ahí en adelante no hay pantalla
  // real que mostrar todavía, así que la lámina lleva su propio fondo.
  const esOverlay = index <= 1;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-end px-6 pb-8"
      style={esOverlay ? undefined : { background: "linear-gradient(180deg, var(--onboarding-grad-top) 0%, var(--onboarding-grad-bottom) 100%)" }}
    >
      {beat.topper && (
        <div className="mb-6 flex flex-1 items-center justify-center">
          {beat.topper.forma === "banner" ? (
            <Image src={beat.topper.src} alt={beat.topper.alt} width={576} height={140} className="h-auto w-56" />
          ) : (
            <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-lg">
              <Image src={beat.topper.src} alt={beat.topper.alt} width={200} height={200} className="h-full w-full object-cover" style={{ objectPosition: "top" }} />
            </div>
          )}
        </div>
      )}

      <div className="relative z-10 w-full max-w-[300px] rounded-[20px] bg-white px-5 py-4" style={{ boxShadow: "0px 4px 14px rgba(0,0,0,0.2)" }}>
        <p className="text-sm font-bold leading-snug" style={{ color: "var(--tutorial-bubble-ink)" }}>
          {beat.texto}
        </p>
        <div
          className="absolute h-4 w-4 rotate-45 bg-white"
          style={{ bottom: -6, left: 36 }}
        />
      </div>

      <div
        className={`relative -mt-2 w-48 ${beat.mascota === "completa" ? "self-center" : "self-start -ml-6"}`}
      >
        <Image
          src={`/cabrita-${beat.mascota}.png`}
          alt="La Cabrita"
          width={1080}
          height={1920}
          className="h-auto w-full drop-shadow-xl"
          priority
        />
      </div>

      <button onClick={onNext} className="btn-onboarding relative z-10 mt-2">
        {beat.boton ?? "Siguiente"} ›
      </button>
    </div>
  );
}
