"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const res = await fetch("/api/dashboard-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError("Contraseña incorrecta");
      setCargando(false);
      return;
    }
    router.push(searchParams.get("next") || "/dashboard");
    router.refresh();
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <form onSubmit={onSubmit} className="card p-6 w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-xl font-extrabold">Dashboard de Sapiencia</h1>
        <p className="text-goat-ink-muted text-sm">Acceso solo para el equipo de Sapiencia.</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="bg-goat-surface-2 border border-goat-border rounded-xl px-4 py-3 outline-none focus:border-goat-accent-solid"
        />
        {error && <p className="text-goat-bad text-sm">{error}</p>}
        <button className="btn-primary" disabled={cargando || !password}>
          {cargando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
