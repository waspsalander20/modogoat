"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORES: Record<string, string> = {
  EMP: "#8b93ff",
  INV: "#6ee7a0",
  EMP2: "#ffb734",
  FREE: "#ff8fd6",
  CRE: "#68c8ff",
};

const NOMBRES: Record<string, string> = {
  EMP: "Empleado",
  INV: "Investigador",
  EMP2: "Emprendedor",
  FREE: "Freelancer",
  CRE: "Creador",
};

export default function PerfilChart({ distribucion }: { distribucion: Record<string, number> }) {
  const data = Object.entries(distribucion)
    .map(([id, value]) => ({ id, name: NOMBRES[id] ?? id, value }))
    .filter((d) => d.value > 0);

  if (data.length === 0) {
    return <p className="text-goat-ink-muted text-sm">Todavía no hay partidas terminadas.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
          {data.map((entry) => (
            <Cell key={entry.id} fill={COLORES[entry.id] ?? "#999"} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: "#1a1826", border: "1px solid #2e2b40", borderRadius: 8 }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
