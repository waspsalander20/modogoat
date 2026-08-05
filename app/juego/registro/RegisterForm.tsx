"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/juego/onboarding";
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repitePassword, setRepitePassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [creada, setCreada] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== repitePassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo crear la cuenta");
      }
      setCreada(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="onboarding-bg flex flex-1 flex-col">
      <div className="flex flex-1 flex-col px-6 py-8 max-w-md mx-auto w-full">
        <div className="flex justify-center mb-6">
          <Image src="/logo-mark.png" alt="Modo GOAT" width={947} height={451} priority className="w-40 h-auto" />
        </div>

        {creada ? (
          <div className="flex flex-col gap-6 flex-1 justify-center">
            <h1 className="text-2xl font-extrabold text-white">¡Cuenta creada!</h1>
            <p className="onboarding-label text-sm">
              Tu colegio o administrador todavía tiene que activarla antes de que puedas ingresar. Te avisarán
              cuando esté lista.
            </p>
            <Link href={`/juego/login?next=${encodeURIComponent(next)}`} className="btn-onboarding self-start">
              ‹ Ir a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-6 flex-1 justify-center">
            <div>
              <h1 className="text-3xl font-extrabold text-white mb-2">¡Crea tu personaje!</h1>
              <p className="onboarding-label text-sm">
                Da el primer paso para descubrir tu potencial y comenzar tu aventura en Modo GOAT.
              </p>
            </div>

            <input
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Escribe tu nombre"
              className="onboarding-input"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              className="onboarding-input"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crea una contraseña"
              className="onboarding-input"
            />
            <input
              type="password"
              value={repitePassword}
              onChange={(e) => setRepitePassword(e.target.value)}
              placeholder="Repite tu contraseña"
              className="onboarding-input"
            />

            <p className="onboarding-label text-sm">
              ¿Ya tienes una cuenta?{" "}
              <Link href={`/juego/login?next=${encodeURIComponent(next)}`} className="font-extrabold" style={{ color: "var(--onboarding-button-from)" }}>
                Inicia sesión
              </Link>
            </p>

            {error && (
              <div className="rounded-xl bg-white/95 border border-red-300 text-red-600 px-4 py-3 text-sm font-semibold">
                {error}
              </div>
            )}

            <button
              className="btn-onboarding self-start"
              disabled={cargando || !nombre.trim() || !email || password.length < 8 || !repitePassword}
            >
              {cargando ? "Creando..." : "Crear cuenta ›"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
