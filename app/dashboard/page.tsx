import Link from "next/link";
import { getEstadisticasPoblacionales } from "@/lib/dashboardStats";
import { formatoPesos } from "@/lib/format";
import { CONFIG_PAIS, normalizarPais, type PaisId } from "@/lib/data/paises";
import { NOMBRES_ALERTA } from "@/lib/data/alertas";
import PerfilChart from "./PerfilChart";
import TendenciaChart from "./TendenciaChart";
import FiltrosBarra from "./FiltrosBarra";
import ExportButton from "./ExportButton";

export const dynamic = "force-dynamic";

const NOMBRES_PERFIL: Record<string, string> = {
  EMP: "Empleado",
  INV: "Investigador",
  EMP2: "Emprendedor",
  FREE: "Freelancer",
  CRE: "Creador",
};

const RASGOS_BIG_FIVE: Array<{ clave: "apertura" | "responsabilidad" | "extraversion" | "amabilidad" | "estabilidadEmocional"; nombre: string }> = [
  { clave: "apertura", nombre: "Apertura" },
  { clave: "responsabilidad", nombre: "Responsabilidad" },
  { clave: "extraversion", nombre: "Extraversión" },
  { clave: "amabilidad", nombre: "Amabilidad" },
  { clave: "estabilidadEmocional", nombre: "Estabilidad emocional" },
];

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ pais?: string; programa?: string }> }) {
  const { pais: paisParam, programa: programaParam } = await searchParams;
  const paisFiltro = paisParam ? normalizarPais(paisParam) : undefined;
  const stats = await getEstadisticasPoblacionales(paisFiltro, programaParam);
  const paisesFiltro = (Object.keys(CONFIG_PAIS) as PaisId[]).map((p) => ({ id: p, nombre: CONFIG_PAIS[p].nombre }));

  return (
    <main className="flex flex-1 flex-col px-6 py-10 max-w-3xl mx-auto w-full gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Dashboard de Modo GOAT</h1>
          <p className="text-goat-ink-muted text-sm">Vista poblacional de todas las partidas.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FiltrosBarra paises={paisesFiltro} paisActivo={paisFiltro} programas={stats.programas} programaActivo={programaParam} />
          <ExportButton partidas={stats.partidas} />
          <Link
            href="/dashboard/cuentas"
            className="rounded-full border border-goat-border px-4 py-2 text-sm font-semibold text-goat-ink hover:bg-goat-surface-2"
          >
            Cuentas
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Partidas terminadas" value={stats.totalPartidas.toString()} />
        <StatCard label="Jugadores únicos" value={stats.jugadoresUnicos.toString()} />
        <StatCard label="Tasa GOAT MODE" value={`${Math.round(stats.tasaGoatMode * 100)}%`} />
        <StatCard label="Alertas activas" value={Object.keys(stats.alertasPorTipo).length.toString()} />
      </div>

      <div className="card p-5">
        <h2 className="font-extrabold mb-1">Tendencia semanal</h2>
        <p className="text-goat-ink-muted text-xs mb-3">Partidas terminadas por semana (barras) y cuántas fueron GOAT MODE (línea) — últimas 12 semanas con datos.</p>
        <TendenciaChart datos={stats.tendenciaSemanal} />
      </div>

      <div className="card p-5">
        <h2 className="font-extrabold mb-3">Distribución de perfiles</h2>
        <PerfilChart distribucion={stats.distribucionPerfiles} />
      </div>

      <div className="card p-5">
        <h2 className="font-extrabold mb-1">Big Five (promedio poblacional)</h2>
        <p className="text-goat-ink-muted text-xs mb-3">
          Señal experimental inferida del comportamiento en el juego, no un test de personalidad validado — ver{" "}
          <span className="font-mono">lib/bigFive.ts</span>. Basado en {stats.conBigFive} de {stats.totalPartidas} partidas.
        </p>
        {stats.conBigFive === 0 ? (
          <p className="text-goat-ink-muted text-sm">Sin datos todavía.</p>
        ) : (
          <BigFiveBarras bigFive={stats.bigFivePromedio} />
        )}
      </div>

      {stats.bigFivePorPerfil.some((p) => p.cantidad > 0) && (
        <div className="card p-5">
          <h2 className="font-extrabold mb-1">Big Five por perfil dominante</h2>
          <p className="text-goat-ink-muted text-xs mb-3">
            El promedio poblacional de arriba mezcla perfiles muy distintos entre sí — acá segmentado, para comparar ej. la tolerancia al riesgo inferida de un Emprendedor contra la de un Empleado.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-goat-ink-muted border-b border-goat-border">
                  <th className="py-2 pr-4">Perfil</th>
                  {RASGOS_BIG_FIVE.map((r) => (
                    <th key={r.clave} className="py-2 pr-4 whitespace-nowrap">
                      {r.nombre}
                    </th>
                  ))}
                  <th className="py-2 pr-4">n</th>
                </tr>
              </thead>
              <tbody>
                {stats.bigFivePorPerfil
                  .filter((p) => p.cantidad > 0)
                  .map((p) => (
                    <tr key={p.perfil} className="border-b border-goat-border/50">
                      <td className="py-2 pr-4 font-bold">{NOMBRES_PERFIL[p.perfil] ?? p.perfil}</td>
                      {RASGOS_BIG_FIVE.map((r) => (
                        <td key={r.clave} className="py-2 pr-4">
                          {p.bigFive[r.clave]}
                        </td>
                      ))}
                      <td className="py-2 pr-4 text-goat-ink-muted">{p.cantidad}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats.demandaLaboral.conAreaLibre > 0 && (
        <div className="card p-5">
          <h2 className="font-extrabold mb-1">Carreras de alta demanda laboral</h2>
          <p className="text-goat-ink-muted text-xs mb-3">
            Cruce estimado (por palabra clave sobre el área que escribió cada jugador, no una clasificación oficial) contra las
            listas reales que usan instituciones de becas para dar puntaje adicional — Observatorio Laboral para la Educación
            en Colombia, Encuesta de Demanda Ocupacional de PRONABEC en Perú.
          </p>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-2 rounded-full bg-goat-border/50 overflow-hidden">
              <div
                className="h-full bg-goat-accent-solid"
                style={{ width: `${Math.round(stats.demandaLaboral.porcentaje * 100)}%` }}
              />
            </div>
            <span className="text-sm font-bold w-12 text-right">{Math.round(stats.demandaLaboral.porcentaje * 100)}%</span>
          </div>
          <p className="text-goat-ink-muted text-xs mb-3">
            {stats.demandaLaboral.enAltaDemanda} de {stats.demandaLaboral.conAreaLibre} jugadores con área de interés escrita
            matchean una carrera de alta demanda.
          </p>
          {stats.demandaLaboral.porCategoria.length > 0 && (
            <ul className="text-sm flex flex-col gap-2">
              {stats.demandaLaboral.porCategoria.map(({ categoria, cantidad }) => (
                <li key={categoria} className="flex justify-between">
                  <span>{categoria}</span>
                  <span className="text-goat-ink-muted">{cantidad}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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

      {stats.alertasPorPerfil.length > 0 && (
        <div className="card p-5">
          <h2 className="font-extrabold mb-3">Alertas por perfil dominante</h2>
          <div className="flex flex-col gap-4">
            {stats.alertasPorPerfil.map(({ perfil, alertas }) => (
              <div key={perfil}>
                <p className="font-bold text-sm mb-1.5">{NOMBRES_PERFIL[perfil] ?? perfil}</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(alertas).map(([tipo, cantidad]) => (
                    <span
                      key={tipo}
                      className="text-xs bg-goat-surface-2 border border-goat-border rounded-full px-3 py-1.5"
                    >
                      {NOMBRES_ALERTA[tipo] ?? tipo} · {cantidad}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  <th className="py-2 pr-4">País</th>
                  <th className="py-2 pr-4">Programa</th>
                  <th className="py-2 pr-4">Perfil</th>
                  <th className="py-2 pr-4">Resultado</th>
                  <th className="py-2 pr-4">Ingreso final</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {stats.partidas.map((p) => {
                  const paisPartida = normalizarPais(p.pais);
                  return (
                    <tr key={p.id} className="border-b border-goat-border/50">
                      <td className="py-2 pr-4">{p.nombre}</td>
                      <td className="py-2 pr-4">{p.edad}</td>
                      <td className="py-2 pr-4">{p.ciudad}</td>
                      <td className="py-2 pr-4">{CONFIG_PAIS[paisPartida].nombre}</td>
                      <td className="py-2 pr-4">{p.programa ?? "—"}</td>
                      <td className="py-2 pr-4">{p.perfilDominante ?? "—"}</td>
                      <td className="py-2 pr-4 capitalize">{p.resultadoTipo ?? "—"}</td>
                      <td className="py-2 pr-4">{p.ingresoFinal !== null ? formatoPesos(p.ingresoFinal, paisPartida) : "—"}</td>
                      <td className="py-2">
                        <Link href={`/dashboard/${p.id}`} className="text-goat-accent-solid font-bold">
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function BigFiveBarras({
  bigFive,
}: {
  bigFive: { apertura: number; responsabilidad: number; extraversion: number; amabilidad: number; estabilidadEmocional: number };
}) {
  return (
    <ul className="text-sm flex flex-col gap-2">
      {RASGOS_BIG_FIVE.map(({ clave, nombre }) => (
        <li key={clave} className="flex items-center gap-3">
          <span className="w-40 shrink-0">{nombre}</span>
          <div className="flex-1 h-2 rounded-full bg-goat-border/50 overflow-hidden">
            <div className="h-full bg-goat-accent-solid" style={{ width: `${bigFive[clave]}%` }} />
          </div>
          <span className="text-goat-ink-muted w-8 text-right">{bigFive[clave]}</span>
        </li>
      ))}
    </ul>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-2xl font-extrabold text-goat-accent-solid">{value}</div>
      <div className="text-xs text-goat-ink-muted mt-1">{label}</div>
    </div>
  );
}
