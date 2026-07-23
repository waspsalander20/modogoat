import Link from "next/link";
import { getEstadisticasPoblacionales } from "@/lib/dashboardStats";
import { formatoPesos } from "@/lib/format";
import PerfilChart from "./PerfilChart";

export const dynamic = "force-dynamic";

const NOMBRES_ALERTA: Record<string, string> = {
  alta_empleabilidad: "Alta empleabilidad",
  emprendedor_solido: "Emprendedor sólido",
  perfil_beca: "Perfil para beca",
  perfil_riesgo: "Perfil en riesgo",
  explorador_vocacional: "Explorador vocacional",
  barrera_economica: "Barrera económica",
  barrera_familiar: "Barrera familiar",
};

export default async function DashboardPage() {
  const stats = await getEstadisticasPoblacionales();

  return (
    <main className="flex flex-1 flex-col px-6 py-10 max-w-3xl mx-auto w-full gap-8">
      <header>
        <h1 className="text-2xl font-extrabold">Dashboard de Sapiencia</h1>
        <p className="text-goat-ink-muted text-sm">Vista poblacional de las partidas de Modo GOAT.</p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Partidas terminadas" value={stats.totalPartidas.toString()} />
        <StatCard label="Jugadores únicos" value={stats.jugadoresUnicos.toString()} />
        <StatCard label="Tasa GOAT MODE" value={`${Math.round(stats.tasaGoatMode * 100)}%`} />
        <StatCard label="Alertas activas" value={Object.keys(stats.alertasPorTipo).length.toString()} />
      </div>

      <div className="card p-5">
        <h2 className="font-extrabold mb-3">Distribución de perfiles</h2>
        <PerfilChart distribucion={stats.distribucionPerfiles} />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-extrabold mb-3">Áreas más mencionadas</h2>
          {stats.areasLibresMasFrecuentes.length === 0 ? (
            <p className="text-goat-ink-muted text-sm">Sin datos todavía.</p>
          ) : (
            <ul className="text-sm flex flex-col gap-2">
              {stats.areasLibresMasFrecuentes.map((a) => (
                <li key={a.area} className="flex justify-between">
                  <span className="capitalize">{a.area}</span>
                  <span className="text-goat-ink-muted">{a.cantidad}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-extrabold mb-3">Alertas por tipo</h2>
          {Object.keys(stats.alertasPorTipo).length === 0 ? (
            <p className="text-goat-ink-muted text-sm">Sin datos todavía.</p>
          ) : (
            <ul className="text-sm flex flex-col gap-2">
              {Object.entries(stats.alertasPorTipo).map(([tipo, cantidad]) => (
                <li key={tipo} className="flex justify-between">
                  <span>{NOMBRES_ALERTA[tipo] ?? tipo}</span>
                  <span className="text-goat-ink-muted">{cantidad}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-extrabold mb-3">Partidas</h2>
        {stats.partidas.length === 0 ? (
          <p className="text-goat-ink-muted text-sm">Sin partidas todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-goat-ink-muted border-b border-goat-border">
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Edad</th>
                  <th className="py-2 pr-4">Ciudad</th>
                  <th className="py-2 pr-4">Perfil</th>
                  <th className="py-2 pr-4">Resultado</th>
                  <th className="py-2 pr-4">Ingreso final</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {stats.partidas.map((p) => (
                  <tr key={p.id} className="border-b border-goat-border/50">
                    <td className="py-2 pr-4">{p.nombre}</td>
                    <td className="py-2 pr-4">{p.edad}</td>
                    <td className="py-2 pr-4">{p.ciudad}</td>
                    <td className="py-2 pr-4">{p.perfilDominante ?? "—"}</td>
                    <td className="py-2 pr-4 capitalize">{p.resultadoTipo ?? "—"}</td>
                    <td className="py-2 pr-4">{p.ingresoFinal !== null ? formatoPesos(p.ingresoFinal) : "—"}</td>
                    <td className="py-2">
                      <Link href={`/dashboard/${p.id}`} className="text-goat-accent font-bold">
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-2xl font-extrabold text-goat-accent">{value}</div>
      <div className="text-xs text-goat-ink-muted mt-1">{label}</div>
    </div>
  );
}
