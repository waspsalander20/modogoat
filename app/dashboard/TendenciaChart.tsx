"use client";

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function TendenciaChart({ datos }: { datos: Array<{ semana: string; partidas: number; goat: number }> }) {
  if (datos.length === 0) {
    return <p className="text-goat-ink-muted text-sm">Todavía no hay suficientes partidas para una tendencia.</p>;
  }

  const data = datos.map((d) => ({
    ...d,
    // "2026-08-03" -> "3 ago" para el eje X, sin depender de librerías de fecha extra.
    etiqueta: new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" }).format(new Date(`${d.semana}T00:00:00Z`)),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--goat-border, #ededed)" />
        <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: "#ffffff", border: "1px solid #e9e9f4", borderRadius: 8 }}
          formatter={(value, name) => [value, name === "partidas" ? "Partidas" : "GOAT MODE"]}
          labelFormatter={(etiqueta) => `Semana del ${etiqueta}`}
        />
        <Bar dataKey="partidas" fill="#c3ef6d" radius={[4, 4, 0, 0]} />
        <Line type="monotone" dataKey="goat" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
