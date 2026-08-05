import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getJugadorSesion } from "@/lib/jugadorSesion";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const jugador = await getJugadorSesion();
  if (jugador) redirect("/juego/onboarding");

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
