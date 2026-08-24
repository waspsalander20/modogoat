import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizarPais } from "@/lib/data/paises";
import { getJugadorSesion } from "@/lib/jugadorSesion";
import OnboardingWizard from "./OnboardingWizard";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ programa?: string }>;
}) {
  const { programa: programaSlug } = await searchParams;

  // El proxy (ver proxy.ts) ya bloquea esta ruta sin sesión — esta
  // verificación es la segunda capa, por si el Server Function se llama
  // sin pasar por el proxy (ver docs de Next.js sobre Proxy + auth).
  const jugador = await getJugadorSesion();
  if (!jugador) redirect(`/juego/login?next=/juego/onboarding`);

  const programa = programaSlug
    ? await prisma.programa.findUnique({ where: { slug: programaSlug } })
    : null;

  return (
    <OnboardingWizard
      nombre={jugador.nombre}
      datosCompletos={jugador.edad !== null}
      edadJugador={jugador.edad}
      preguntarCarrera={jugador.yaTieneCarrera === null}
      programaSlug={programa?.slug}
      paisInicial={programa ? normalizarPais(programa.pais) : undefined}
    />
  );
}
