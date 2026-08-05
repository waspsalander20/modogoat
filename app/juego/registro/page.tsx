import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getJugadorSesion } from "@/lib/jugadorSesion";
import RegisterForm from "./RegisterForm";

export default async function RegistroPage() {
  const jugador = await getJugadorSesion();
  if (jugador) redirect("/juego/onboarding");

  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
