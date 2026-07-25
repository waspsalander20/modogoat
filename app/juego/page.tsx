import Image from "next/image";
import Link from "next/link";

export default function SplashPage() {
  return (
    <main className="relative flex-1 flex flex-col overflow-hidden bg-goat-header-bg">
      <Image src="/splash-bg.png" alt="" fill priority sizes="100vw" className="object-cover" />

      <div className="relative flex flex-1 flex-col items-center px-6 pt-8 pb-8 max-w-md mx-auto w-full text-center">
        <Image src="/logo-mark.png" alt="Modo GOAT" width={947} height={451} priority className="w-52 h-auto" />

        <h1 className="text-3xl font-extrabold text-white leading-tight" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.35)" }}>
          Descubre quién <span className="text-[#ffd23f]">podrías llegar a ser</span>
        </h1>
        <p
          className="text-white text-sm font-semibold mt-3 max-w-xs"
          style={{ textShadow: "0 1px 6px rgba(0,0,0,0.45)" }}
        >
          Vive una nueva vida. Toma decisiones, desarrolla habilidades y descubre tu verdadero potencial.
        </p>

        <div className="flex-1" />

        <Image
          src="/goat-mascot.png"
          alt="Mascota de Modo GOAT"
          width={856}
          height={1298}
          className="w-52 h-auto -mb-2"
          style={{
            maskImage: "radial-gradient(ellipse 62% 62% at 50% 45%, black 60%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 62% 62% at 50% 45%, black 60%, transparent 100%)",
          }}
        />

        <Link href="/juego/onboarding" className="btn-onboarding w-full mt-4 text-center text-lg block">
          Comenzar aventura ›
        </Link>

        <div className="flex items-center gap-2.5 mt-5 bg-black/45 rounded-full px-4 py-2.5 text-white text-xs font-bold">
          <span className="flex items-center gap-1.5">
            <Image src="/icon-clock.png" alt="" width={16} height={16} />
            20 min por partida
          </span>
          <span className="opacity-40">|</span>
          <span className="flex items-center gap-1.5">
            <Image src="/icon-infinity.png" alt="" width={16} height={16} />
            Juega cuando quieras
          </span>
          <span className="opacity-40">|</span>
          <span className="flex items-center gap-1.5">
            <Image src="/icon-star.png" alt="" width={16} height={16} />
            Múltiples finales
          </span>
        </div>
      </div>
    </main>
  );
}
