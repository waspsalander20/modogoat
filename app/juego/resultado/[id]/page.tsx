import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import BotonJugarDeNuevo from "@/app/juego/BotonJugarDeNuevo";
import { prisma } from "@/lib/prisma";
import { formatoPesos } from "@/lib/format";
import { normalizarPais } from "@/lib/data/paises";
import { nombreSkill, emojiSkill } from "@/lib/data/skills";
import { medalla } from "@/lib/data/medallas";
import { MENSAJES_RESULTADO, MENSAJES_BARRERA, MENSAJE_PROXIMOS_PASOS_GENERICO } from "@/lib/data/mensajes";
import { NOMBRES_PERFIL, EMOJI_PERFIL } from "@/lib/data/perfiles";
import { DURACION_ANIOS, SKILLS_CLAVE_POR_PERFIL } from "@/lib/motor";
import { detectarBarreraPrincipal } from "@/lib/perfilamiento";
import type { PerfilId, Puntos } from "@/lib/types";

const ORDEN_PERFILES: PerfilId[] = ["EMP", "INV", "EMP2", "FREE", "CRE"];

export default async function ResultadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const partida = await prisma.partida.findUnique({
    where: { id },
    include: { jugador: true },
  });

  if (!partida || partida.estado !== "terminado") {
    notFound();
  }

  const pais = normalizarPais(partida.jugador.pais);
  const perfilDominante = partida.perfilDominante as PerfilId | null;
  const resultado = partida.resultadoTipo ?? "medio";

  // El cierre narrativo lo escribe el motor de IA, personalizado con el área
  // y las decisiones del jugador. Si esa llamada falló, caemos al mensaje
  // genérico fijo para no dejar la pantalla vacía.
  const textoFinal = partida.analisisFinal ?? MENSAJES_RESULTADO[resultado as "medio" | "bajo" | "troll"] ?? MENSAJES_RESULTADO.medio;

  const skillsFinales = (partida.skillsFinales as Record<string, number>) ?? {};
  const skillsOrdenadas = Object.entries(skillsFinales)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  // Espectro completo de los 5 perfiles, no solo el dominante — cada
  // metodología real de orientación vocacional (Holland/SDS, CHASIDE,
  // 16Personalities) muestra el espectro completo, nunca solo la categoría
  // más alta. Investigación 2 ago 2026.
  const puntosPerfil = (partida.puntosPerfil as unknown as Puntos) ?? null;
  const maxPuntos = puntosPerfil ? Math.max(1, ...Object.values(puntosPerfil)) : 1;

  // Skills clave del perfil dominante que todavía no están en su punto
  // máximo — el mapa de habilidades "a desarrollar para escalar tu
  // facturación" del libro ABCDE STAR (ver SKILLS_CLAVE_POR_PERFIL en
  // motor.ts), no una lista genérica.
  const skillsParaEscalar = perfilDominante
    ? SKILLS_CLAVE_POR_PERFIL[perfilDominante].filter((s) => (skillsFinales[s] ?? 0) < 4)
    : [];

  // "Próximos pasos" — mismo cierre que trae cualquier informe vocacional
  // real (CHASIDE, SDS, el formato clásico de psicólogo): interpretación +
  // recomendación concreta, no solo el resultado. Si la partida marcó una
  // barrera clara, ese mensaje ya escrito (antes sin usar en ningún lado)
  // es más específico que el genérico.
  const barreraPrincipal = detectarBarreraPrincipal(partida.alertas);
  const mensajeProximosPasos = (barreraPrincipal && MENSAJES_BARRERA[barreraPrincipal]) || MENSAJE_PROXIMOS_PASOS_GENERICO;

  return (
    <main
      className="relative flex flex-1 flex-col items-center px-6 pb-10 pt-[17px]"
      style={{ background: "linear-gradient(180deg, var(--resultado-bg-from) 0%, var(--resultado-bg-to) 100%)" }}
    >
      <Image src="/resultado-fondo.png" alt="" fill priority sizes="100vw" className="object-cover" style={{ objectPosition: "top" }} />

      <div className="relative w-[182px]">
        <Image src="/badge-resultado.png" alt="Resultado" width={1372} height={308} className="h-auto w-full" />
      </div>

      <div className="relative mt-3 flex flex-col items-center">
        <div className="h-[58px] w-[58px] overflow-hidden rounded-full border-2 border-white/80 bg-white/20">
          <Image src="/goat-avatar.png" alt="" width={116} height={116} className="h-full w-full object-cover object-top" />
        </div>
        <h1 className="mt-2 font-extrabold text-base text-white">{partida.jugador.nombre}</h1>
        <p className="text-sm font-semibold text-white/90">
          {partida.edadInicio} - {partida.edadInicio + DURACION_ANIOS} Años
        </p>
      </div>

      <div
        className="relative mt-4 flex h-[144px] w-[146px] items-center justify-center rounded-[14px]"
        style={{ background: "linear-gradient(180deg, var(--resultado-perfil-icon-from) 0%, var(--resultado-perfil-icon-to) 100%)" }}
      >
        <Image
          src="/marco.png"
          alt=""
          width={164}
          height={164}
          className="pointer-events-none absolute -inset-2.5 h-[calc(100%+20px)] w-[calc(100%+20px)]"
        />
        <span className="relative text-6xl">{perfilDominante ? EMOJI_PERFIL[perfilDominante] : "🐐"}</span>
      </div>

      <TarjetaResultado className="mt-6">
        <div className="prose-narrativa text-sm leading-relaxed" style={{ color: "var(--resultado-ink)" }}>
          <ReactMarkdown>{textoFinal}</ReactMarkdown>
        </div>
      </TarjetaResultado>

      <div className="relative mt-6 w-[273px]">
        <Image src="/badge-informe.png" alt="Tu informe del perfil" width={1419} height={252} className="h-auto w-full" />
      </div>

      <TarjetaResultado className="mt-3">
        <FilaInforme etiqueta="Perfil dominante:">
          <span className="font-semibold text-sm" style={{ color: "var(--resultado-ink)" }}>
            {perfilDominante ? NOMBRES_PERFIL[perfilDominante] : "—"}
          </span>
        </FilaInforme>
        <FilaInforme etiqueta="Ingreso final:">
          <span
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-extrabold text-sm text-white"
            style={{ background: "var(--game-income-pill)", border: "1px solid rgba(53,22,0,0.49)" }}
          >
            <Image src="/icon-coin.png" alt="" width={15} height={15} />
            {partida.ingresoFinal !== null ? formatoPesos(partida.ingresoFinal, pais) : "—"}/mes
          </span>
        </FilaInforme>
        <FilaInforme etiqueta="Ahorros:" ultima>
          <span className="font-semibold text-sm" style={{ color: "var(--resultado-ink)" }}>
            {formatoPesos(partida.ahorros, pais)}
          </span>
        </FilaInforme>
      </TarjetaResultado>

      {puntosPerfil && (
        <TarjetaResultado className="mt-3">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--resultado-ink)", opacity: 0.6 }}>
            Tu perfil completo
          </p>
          <div className="flex flex-col gap-2">
            {ORDEN_PERFILES.map((perfilId) => (
              <div key={perfilId} className="flex items-center gap-2.5">
                <span className="w-6 text-center text-base">{EMOJI_PERFIL[perfilId]}</span>
                <span className="w-[74px] shrink-0 text-xs font-semibold" style={{ color: "var(--resultado-ink)" }}>
                  {NOMBRES_PERFIL[perfilId].split(" / ")[0]}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(4, Math.round((Math.max(0, puntosPerfil[perfilId]) / maxPuntos) * 100))}%`,
                      background: perfilId === perfilDominante ? "var(--game-income-pill)" : "rgba(0,0,0,0.25)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {partida.esMixto && partida.perfilSecundario && (
            <p className="mt-3 text-xs" style={{ color: "var(--resultado-ink)", opacity: 0.7 }}>
              Tu estilo es principalmente {NOMBRES_PERFIL[perfilDominante as PerfilId]}, con toques reales de{" "}
              {NOMBRES_PERFIL[partida.perfilSecundario as PerfilId]} — no es indecisión, es que tus decisiones reflejaron las dos cosas.
            </p>
          )}
          <p className="mt-3 text-xs" style={{ color: "var(--resultado-ink)", opacity: 0.55 }}>
            Esto salió de tus propias decisiones durante la partida — un espejo de tu estilo, no un test perfecto ni una etiqueta fija.
          </p>
        </TarjetaResultado>
      )}

      {skillsOrdenadas.length > 0 && (
        <>
          <div className="relative mt-6 w-[278px]">
            <Image src="/badge-skills-desarrolladas.png" alt="Skills desarrolladas" width={1362} height={255} className="h-auto w-full" />
          </div>
          <TarjetaResultado className="mt-3">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              {skillsOrdenadas.map(([skill, nivel]) => (
                <span
                  key={skill}
                  className="flex items-center gap-1.5 rounded-[20px] bg-white px-2.5 py-1.5"
                  style={{ border: "1px solid var(--resultado-pill-border)" }}
                >
                  <span
                    className="relative flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[1px]"
                    style={{ background: "linear-gradient(180deg, #E8BE15 0%, #E96D00 100%)" }}
                  >
                    <Image src="/marco.png" alt="" width={17} height={17} className="absolute -inset-px h-[calc(100%+2px)] w-[calc(100%+2px)]" />
                    <span className="relative text-[7px] leading-none">{emojiSkill(skill)}</span>
                  </span>
                  <span className="text-xs font-semibold" style={{ color: "var(--resultado-ink)" }}>
                    {nombreSkill(skill)} - Nv.{nivel}
                  </span>
                </span>
              ))}
            </div>
          </TarjetaResultado>
        </>
      )}

      {skillsParaEscalar.length > 0 && (
        <TarjetaResultado className="mt-3">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--resultado-ink)", opacity: 0.6 }}>
            Para escalar tu facturación
          </p>
          <p className="mb-3 text-xs" style={{ color: "var(--resultado-ink)", opacity: 0.7 }}>
            Según tu estilo, estas son las habilidades que más mueven el ingreso — no las que ya dominas, las que valen la pena seguir invirtiendo.
          </p>
          <div className="flex flex-wrap gap-2">
            {skillsParaEscalar.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5"
                style={{ border: "1px solid var(--resultado-pill-border)" }}
              >
                <span className="text-sm">{emojiSkill(skill)}</span>
                <span className="text-xs font-semibold" style={{ color: "var(--resultado-ink)" }}>
                  {nombreSkill(skill)} · Nv.{skillsFinales[skill] ?? 0}/5
                </span>
              </span>
            ))}
          </div>
        </TarjetaResultado>
      )}

      {partida.medallasGanadas.length > 0 && (
        <>
          <div className="relative mt-6 w-[237px]">
            <Image src="/badge-medallas.png" alt="Medallas ganadas" width={1375} height={285} className="h-auto w-full" />
          </div>
          <TarjetaResultado className="mt-3">
            <div className="flex flex-wrap justify-center gap-4">
              {partida.medallasGanadas.map((mid) => {
                const m = medalla(mid);
                if (!m) return null;
                return (
                  <div key={mid} className="flex w-[87px] flex-col items-center gap-1.5 text-center">
                    <div className="relative flex h-[87px] w-[87px] items-center justify-center">
                      <Image src="/marco-circular.png" alt="" fill className="object-contain" />
                      <span className="relative text-3xl">{m.emoji}</span>
                    </div>
                    <span className="text-xs font-semibold leading-tight" style={{ color: "var(--resultado-ink)" }}>
                      {m.nombre}
                    </span>
                  </div>
                );
              })}
            </div>
          </TarjetaResultado>
        </>
      )}

      {partida.areaLibre && (
        <TarjetaResultado className="mt-3">
          <p className="text-sm" style={{ color: "var(--resultado-ink)" }}>
            &ldquo;{partida.areaLibre}&rdquo;
          </p>
        </TarjetaResultado>
      )}

      <TarjetaResultado className="mt-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--resultado-ink)", opacity: 0.6 }}>
          Próximos pasos
        </p>
        <div className="prose-narrativa text-sm leading-relaxed" style={{ color: "var(--resultado-ink)" }}>
          <ReactMarkdown>{mensajeProximosPasos}</ReactMarkdown>
        </div>
      </TarjetaResultado>

      <div className="relative mt-8 flex w-full max-w-[254px] flex-col gap-3">
        <BotonJugarDeNuevo
          className="flex w-full items-center justify-center gap-2 rounded-full py-3 font-black text-lg text-white"
          style={{
            background: "linear-gradient(180deg, var(--resultado-cta-from) 0%, var(--resultado-cta-to) 87.96%)",
            border: "1px solid var(--resultado-cta-border)",
            boxShadow: "0px 4px 4px rgba(0,0,0,0.41), inset 0px 4px 4px rgba(255,255,255,0.25)",
            textShadow: "0px 2px 2.4px #883900",
          }}
        >
          Jugar de nuevo
          <Image src="/icon-left-arrow.png" alt="" width={15} height={15} style={{ transform: "rotate(180deg)" }} />
        </BotonJugarDeNuevo>
        <Link
          href={`/juego/jugador/${partida.jugadorId}/informe`}
          className="flex items-center justify-center rounded-full bg-white py-3 font-bold text-lg"
          style={{ border: "1px solid var(--resultado-cta-border)", color: "var(--resultado-secundario-text)" }}
        >
          Ver mi informe completo
        </Link>
        <Link href="/juego" className="text-center text-sm font-bold text-white underline">
          Volver el inicio
        </Link>
      </div>
    </main>
  );
}

function TarjetaResultado({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative w-full max-w-[355px] rounded-[20px] p-5 ${className}`}
      style={{
        background: "linear-gradient(132.49deg, var(--resultado-card-bg-from) 26.1%, var(--resultado-card-bg-to) 86.54%)",
        boxShadow: "0px 4px 4px rgba(0,0,0,0.17), inset 0px 4px 4px rgba(255,255,255,0.25)",
      }}
    >
      {children}
    </div>
  );
}

function FilaInforme({ etiqueta, children, ultima = false }: { etiqueta: string; children: React.ReactNode; ultima?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${ultima ? "" : "mb-3"}`}>
      <span className="font-extrabold text-sm" style={{ color: "var(--resultado-ink)" }}>
        {etiqueta}
      </span>
      {children}
    </div>
  );
}
