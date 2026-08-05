import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ActivarToggle from "./ActivarToggle";

export const dynamic = "force-dynamic";

export default async function CuentasPage() {
  const jugadores = await prisma.jugador.findMany({
    where: { email: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { id: true, nombre: true, email: true, activo: true, emailConfirmado: true, createdAt: true },
  });

  return (
    <main className="flex flex-1 flex-col px-6 py-10 max-w-3xl mx-auto w-full gap-6">
      <header>
        <Link href="/dashboard" className="text-goat-ink-muted text-sm hover:underline">
          ‹ Volver al dashboard
        </Link>
        <h1 className="text-2xl font-extrabold mt-1">Cuentas de jugadores</h1>
        <p className="text-goat-ink-muted text-sm">
          Las cuentas quedan pendientes hasta que las actives — piensa en esto como confirmar que el alumno
          pertenece al piloto/colegio que ya dio consentimiento.
        </p>
      </header>

      <div className="card p-0 overflow-hidden">
        {jugadores.length === 0 ? (
          <p className="text-goat-ink-muted text-sm p-5">Todavía no hay cuentas registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-goat-ink-muted border-b border-goat-border">
                <th className="p-4 font-semibold">Nombre</th>
                <th className="p-4 font-semibold">Correo</th>
                <th className="p-4 font-semibold">Correo confirmado</th>
                <th className="p-4 font-semibold">Registrado</th>
                <th className="p-4 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {jugadores.map((j) => (
                <tr key={j.id} className="border-b border-goat-border last:border-0">
                  <td className="p-4 font-semibold">{j.nombre}</td>
                  <td className="p-4 text-goat-ink-muted">{j.email}</td>
                  <td className="p-4 text-goat-ink-muted">{j.emailConfirmado ? "Sí" : "No"}</td>
                  <td className="p-4 text-goat-ink-muted">{j.createdAt.toLocaleDateString("es-CO")}</td>
                  <td className="p-4">
                    <ActivarToggle jugadorId={j.id} activo={j.activo} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
