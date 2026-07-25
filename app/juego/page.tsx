import Image from "next/image";
import Link from "next/link";

export default function SplashPage() {
  return (
    <main className="flex-1 flex items-center justify-center bg-goat-header-bg">
      <div className="relative w-full max-w-md" style={{ aspectRatio: "402 / 874" }}>
        <Image
          src="/splash-hero.png"
          alt="Modo GOAT — Descubre quién podrías llegar a ser. Vive una nueva vida, toma decisiones, desarrolla habilidades y descubre tu verdadero potencial."
          fill
          priority
          sizes="(min-width: 448px) 448px, 100vw"
          className="object-cover"
        />
        <Link
          href="/juego/onboarding"
          aria-label="Comenzar aventura"
          className="absolute rounded-full outline-none focus-visible:ring-4 focus-visible:ring-white/70"
          style={{ left: "6%", right: "6%", top: "76.5%", height: "8%" }}
        />
      </div>
    </main>
  );
}
