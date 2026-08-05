"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function OlvidePasswordForm() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    await fetch("/api/auth/olvide-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    // Siempre mostramos éxito, exista o no la cuenta — ver la ruta de API.
    setEnviado(true);
    setCargando(false);
  }

  return (
    <main className="onboarding-bg flex flex-1 flex-col">
      <div className="flex flex-1 flex-col px-6 py-8 max-w-md mx-auto w-full">
        <div className="flex justify-center mb-6">
          <Image src="/logo-mark.png" alt="Modo GOAT" width={947} height={451} priority className="w-40 h-auto" />
        </div>

        {enviado ? (
          <div className="flex flex-col gap-6 flex-1 justify-center">
            <h1 className="text-2xl font-extrabold text-white">Revisa tu correo</h1>
            <p className="onboarding-label text-sm">
              Si <strong>{email}</strong> tiene una cuenta con nosotros, te acabamos de mandar un link para elegir
              una contraseña nueva. El link es válido por 1 hora.
            </p>
            <Link href="/juego/login" className="btn-onboarding self-start">
              ‹ Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-6 flex-1 justify-center">
            <div>
              <h1 className="text-2xl font-extrabold text-white mb-2">Recuperar contraseña</h1>
              <p className="onboarding-label text-sm">
                Escribe el correo con el que te registraste y te mandamos un link para elegir una contraseña nueva.
              </p>
            </div>
            <input
              type="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              className="onboarding-input"
            />
            <button className="btn-onboarding self-start" disabled={cargando || !email}>
              {cargando ? "Enviando..." : "Enviar link ›"}
            </button>
            <Link href="/juego/login" className="onboarding-label text-sm">
              ‹ Volver a iniciar sesión
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
