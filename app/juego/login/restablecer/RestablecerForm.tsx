"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

export default function RestablecerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [repitePassword, setRepitePassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== repitePassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/restablecer-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "No se pudo restablecer la contraseña");
      setListo(true);
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

        {!token ? (
          <div className="flex flex-col gap-6 flex-1 justify-center">
            <h1 className="text-2xl font-extrabold text-white">Este link no es válido</h1>
            <p className="onboarding-label text-sm">Pide uno nuevo desde la pantalla de recuperar contraseña.</p>
            <Link href="/juego/login/olvide-password" className="btn-onboarding self-start">
              ‹ Recuperar contraseña
            </Link>
          </div>
        ) : listo ? (
          <div className="flex flex-col gap-6 flex-1 justify-center">
            <h1 className="text-2xl font-extrabold text-white">¡Listo!</h1>
            <p className="onboarding-label text-sm">Ya puedes iniciar sesión con tu nueva contraseña.</p>
            <button onClick={() => router.push("/juego/login")} className="btn-onboarding self-start">
              Ir a iniciar sesión ›
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-6 flex-1 justify-center">
            <h1 className="text-2xl font-extrabold text-white">Elige tu nueva contraseña</h1>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nueva contraseña"
              className="onboarding-input"
            />
            <input
              type="password"
              value={repitePassword}
              onChange={(e) => setRepitePassword(e.target.value)}
              placeholder="Repite la contraseña"
              className="onboarding-input"
            />

            {error && (
              <div className="rounded-xl bg-white/95 border border-red-300 text-red-600 px-4 py-3 text-sm font-semibold">
                {error}
              </div>
            )}

            <button className="btn-onboarding self-start" disabled={cargando || password.length < 8 || !repitePassword}>
              {cargando ? "Guardando..." : "Guardar contraseña ›"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
