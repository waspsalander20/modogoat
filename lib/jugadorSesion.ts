import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { JUGADOR_COOKIE, jugadorIdDeToken } from "@/lib/jugadorAuth";

// Para Server Components / Route Handlers — lee la cookie de sesión y trae
// el jugador completo. null si no hay sesión válida o el jugador ya no existe.
export async function getJugadorSesion() {
  const cookieStore = await cookies();
  const jugadorId = jugadorIdDeToken(cookieStore.get(JUGADOR_COOKIE)?.value);
  if (!jugadorId) return null;
  return prisma.jugador.findUnique({ where: { id: jugadorId } });
}
