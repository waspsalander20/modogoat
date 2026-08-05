"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/juego/onboarding";
  const confirmado = searchParams.get("confirmado");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo iniciar sesión");
      }
      router.push(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal");
      setCargando(false);
    }
  }

  return (
    <main className="onboarding-bg flex flex-1 flex-col">
      <div className="flex flex-1 flex-col px-6 py-8 max-w-md mx-auto w-full">
        <div className="flex justify-center mb-6">
          <Image src="/logo-mark.png" alt="Modo GOAT" width={947} height={451} priority className="w-40 h-auto" />
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-6 flex-1 justify-center">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-2">¡Bienvenido de nuevo!</h1>
            <p className="onboarding-label text-sm">Inicia sesión para continuar tu aventura en Modo GOAT.</p>
          </div>

          {confirmado === "ok" && (
            <div className="rounded-xl bg-white/95 border border-green-300 text-green-700 px-4 py-3 text-sm font-semibold">
              ¡Correo confirmado! Ya puedes iniciar sesión en cuanto tu cuenta esté activada.
            </div>
          )}

          <input
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            className="onboarding-input"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="onboarding-input"
          />

          <div className="flex flex-col gap-1 text-sm">
            <p className="onboarding-label">
              ¿Aun no tienes cuenta?{" "}
              <Link href={`/juego/registro?next=${encodeURIComponent(next)}`} className="font-extrabold" style={{ color: "var(--onboarding-button-from)" }}>
                Regístrate
              </Link>
            </p>
            <Link href="/juego/login/olvide-password" className="onboarding-label">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {error && (
            <div className="rounded-xl bg-white/95 border border-red-300 text-red-600 px-4 py-3 text-sm font-semibold">
              {error}
            </div>
          )}

          <button className="btn-onboarding self-start" disabled={cargando || !email || !password}>
            {cargando ? "Entrando..." : "Entrar ›"}
          </button>
        </form>
      </div>
    </main>
  );
}
