import Link from "next/link";

export default function SplashPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="text-7xl mb-6">🐐</div>
      <h1 className="text-4xl font-extrabold tracking-tight mb-3">Modo GOAT</h1>
      <p className="text-goat-ink-muted max-w-sm mb-10">
        Vive los próximos 10 años de tu vida y descubre en qué eres realmente bueno/a.
        Sin costos reales. Sin errores permanentes.
      </p>
      <Link href="/juego/onboarding" className="btn-primary text-lg">
        Empezar
      </Link>
      <p className="text-goat-ink-muted text-xs mt-8 max-w-xs">
        15–22 minutos · Puedes jugar todas las veces que quieras
      </p>
    </main>
  );
}
