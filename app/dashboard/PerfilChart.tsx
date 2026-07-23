"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORES: Record<string, string> = {
  EMP: "#6366f1",
  INV: "#15803d",
  EMP2: "#a855f7",
  FREE: "#ec4899",
  CRE: "#0ea5e9",
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

  // Un solo segmento al 100% degenera el arco SVG (ángulo inicial == final en
  // un círculo completo), así que Recharts no dibuja nada. Lo partimos en dos
  // mitades del mismo color para que siga viéndose como un círculo sólido.
  const datosGrafico =
    data.length === 1 ? [{ ...data[0], value: data[0].value / 2 }, { ...data[0], id: `${data[0].id}_b`, value: data[0].value / 2 }] : data;

  const leyenda = data.map((d) => ({ value: d.name, color: COLORES[d.id] ?? "#999" }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={datosGrafico} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
          {datosGrafico.map((entry) => (
            <Cell key={entry.id} fill={COLORES[entry.id.replace("_b", "")] ?? "#999"} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e9e9f4", borderRadius: 8 }} />
        <Legend content={() => <ChartLegend items={leyenda} />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ChartLegend({ items }: { items: { value: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap justify-center gap-4 mt-2">
      {items.map((item) => (
        <li key={item.value} className="flex items-center gap-1.5 text-sm">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color }} />
          {item.value}
        </li>
      ))}
    </ul>
  );
}
