import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

// Marco de referencia del frame "Homepage" en Figma (única fuente de verdad).
// Todas las posiciones de esta pantalla son las coordenadas px exactas del
// archivo, convertidas a % de este marco para que escalen sin perder
// proporción. No aproximar: si Figma cambia, actualizar estos valores.
const FRAME_W = 402;
const FRAME_H = 874;

function x(px: number): string {
  return `${(px / FRAME_W) * 100}%`;
}
function y(px: number): string {
  return `${(px / FRAME_H) * 100}%`;
}

function Layer({
  left,
  top,
  width,
  height,
  style,
  children,
}: {
  left: number;
  top: number;
  width?: number;
  height?: number;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div
      className="absolute"
      style={{
        left: x(left),
        top: y(top),
        width: width !== undefined ? x(width) : undefined,
        height: height !== undefined ? y(height) : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function PillIcon({
  left,
  top,
  circleColor,
  circleShadowTint,
  icon,
  iconLeft,
  iconTop,
  iconSize,
  iconFlipX,
  labelLeft,
  label,
  sublabel,
}: {
  left: number;
  top: number;
  circleColor: string;
  circleShadowTint: string;
  icon: string;
  iconLeft: number;
  iconTop: number;
  iconSize: number;
  iconFlipX?: boolean;
  labelLeft: number;
  label: string;
  sublabel: string;
}) {
  return (
    <>
      <Layer
        left={left}
        top={top}
        width={30}
        height={30}
        style={{
          borderRadius: "50%",
          background: circleColor,
          boxShadow: `0px 4px 4px rgba(0, 0, 0, 0.25), inset 0px 4px 4px ${circleShadowTint}`,
        }}
      />
      <Layer
        left={iconLeft}
        top={iconTop}
        width={iconSize}
        height={iconSize}
        style={{
          filter: "drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))",
          transform: iconFlipX ? "scaleX(-1)" : undefined,
        }}
      >
        <Image src={icon} alt="" fill sizes="20px" className="object-contain" />
      </Layer>
      <Layer left={labelLeft} top={775} style={{ whiteSpace: "nowrap" }}>
        <span
          className="block font-black text-white"
          style={{ fontFamily: "var(--font-nunito)", fontSize: 11, lineHeight: "15px", fontWeight: 900 }}
        >
          {label}
        </span>
      </Layer>
      <Layer left={labelLeft} top={787} style={{ whiteSpace: "nowrap" }}>
        <span
          className="block text-white"
          style={{ fontFamily: "var(--font-nunito)", fontSize: 8, lineHeight: "11px", fontWeight: 400 }}
        >
          {sublabel}
        </span>
      </Layer>
    </>
  );
}

export default function SplashPage() {
  return (
    <main className="relative flex-1 flex overflow-hidden bg-white">
      <div
        className="relative w-full mx-auto overflow-hidden"
        style={{ maxWidth: 480, aspectRatio: `${FRAME_W} / ${FRAME_H}` }}
      >
        {/* Fondo Home 1 */}
        <Layer left={-77} top={-107} width={489} height={1057} style={{ filter: "blur(1.75px)" }}>
          <Image src="/splash-bg.png" alt="" fill priority sizes="100vw" className="object-cover" />
        </Layer>

        {/* Goat Home 1 */}
        <Layer left={13} top={316} width={408} height={431}>
          <Image
            src="/goat-home.png"
            alt="Mascota de Modo GOAT"
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: "center top" }}
          />
        </Layer>

        {/* Rectangle 1 — fondo de la píldora de info */}
        <Layer
          left={28}
          top={761}
          width={346}
          height={53}
          style={{
            boxSizing: "border-box",
            background: "var(--splash-pill-bg)",
            border: "1px solid var(--splash-pill-border)",
            borderRadius: 999,
          }}
        />

        <PillIcon
          left={46}
          top={773}
          circleColor="var(--splash-circle-clock)"
          circleShadowTint="rgba(255, 232, 232, 0.25)"
          icon="/icon-clock.png"
          iconLeft={52}
          iconTop={779}
          iconSize={17}
          labelLeft={83}
          label="20 min"
          sublabel="por partida"
        />

        <PillIcon
          left={150}
          top={773}
          circleColor="var(--splash-circle-infinity)"
          circleShadowTint="rgba(255, 255, 255, 0.25)"
          icon="/icon-infinity.png"
          iconLeft={155}
          iconTop={778}
          iconSize={20}
          iconFlipX
          labelLeft={187}
          label="Juega"
          sublabel="cuando quieras"
        />

        {/* Star 1 */}
        <Layer left={265} top={770} width={35} height={35}>
          <svg
            viewBox="0 0 35 35"
            width="100%"
            height="100%"
            style={{ filter: "drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))" }}
          >
            <path
              d="M17.5 1.5L21.8 12.9H33.9L24.1 20L27.9 31.5L17.5 24.3L7.1 31.5L10.9 20L1.1 12.9H13.2L17.5 1.5Z"
              fill="var(--splash-star-fill)"
              strokeLinejoin="round"
              strokeWidth={2}
              stroke="var(--splash-star-fill)"
            />
          </svg>
        </Layer>
        <Layer left={302} top={775} style={{ whiteSpace: "nowrap" }}>
          <span
            className="block font-black text-white"
            style={{ fontFamily: "var(--font-nunito)", fontSize: 11, lineHeight: "15px", fontWeight: 900 }}
          >
            Múltiples
          </span>
        </Layer>
        <Layer left={302} top={787} style={{ whiteSpace: "nowrap" }}>
          <span
            className="block text-white"
            style={{ fontFamily: "var(--font-nunito)", fontSize: 8, lineHeight: "11px", fontWeight: 400 }}
          >
            finales
          </span>
        </Layer>

        {/* Line 1 / Line 2 — divisores verticales entre ítems de la píldora */}
        <Layer left={154.5} top={750.5} width={1} height={37} style={{ background: "#FFFFFF" }} />
        <Layer left={276.5} top={750.5} width={1} height={37} style={{ background: "#FFFFFF" }} />

        {/* Rectangle 2 — resplandor detrás del botón */}
        <Layer
          left={41}
          top={676}
          width={320}
          height={70}
          style={{
            boxSizing: "border-box",
            background: `linear-gradient(180deg, var(--splash-btn-glow-from) 0%, var(--splash-btn-glow-to) 100%)`,
            border: "1px solid var(--splash-btn-glow-border)",
            boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25), inset 0px 4px 4px rgba(255, 255, 255, 0.25)",
            borderRadius: 999,
          }}
        />

        {/* Rectangle 3 — botón */}
        <Link
          href="/juego/login"
          className="absolute flex items-center justify-center gap-2"
          style={{ left: x(52), top: y(684), width: x(298), height: y(54) }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, var(--splash-btn-from) 0%, var(--splash-btn-to) 87.96%)`,
              border: "1px solid var(--splash-btn-border)",
              boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.41), inset 0px 4px 4px rgba(255, 255, 255, 0.25)",
              borderRadius: 999,
            }}
          />
          <span
            className="relative whitespace-nowrap font-black text-white"
            style={{
              fontFamily: "var(--font-nunito)",
              fontSize: 24,
              fontWeight: 900,
              textShadow: "0px 2px 2.4px #883900",
            }}
          >
            Ingresar
          </span>
          <span
            className="relative shrink-0"
            style={{
              width: 17,
              height: 17,
              filter: "drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.44))",
              transform: "rotate(180deg)",
            }}
          >
            <Image src="/icon-left-arrow.png" alt="" fill sizes="17px" className="object-contain" />
          </span>
        </Link>

        {/* ¿Aun no tienes cuenta? Regístrate */}
        <Layer
          left={31}
          top={741}
          width={340}
          style={{
            fontFamily: "var(--font-nunito)",
            fontWeight: 700,
            fontSize: 13,
            textAlign: "center",
            color: "#FFFFFF",
            textShadow: "0px 2px 4px rgba(0, 0, 0, 0.6)",
            whiteSpace: "nowrap",
          }}
        >
          ¿Aun no tienes cuenta?{" "}
          <Link href="/juego/registro" className="font-black underline">
            Regístrate
          </Link>
        </Layer>

        {/* Descubre quién */}
        <Layer
          left={89}
          top={206}
          width={223}
          style={{
            fontFamily: "var(--font-nunito)",
            fontWeight: 900,
            fontSize: 32,
            lineHeight: "31px",
            letterSpacing: "-0.04em",
            textAlign: "center",
            color: "#FFFFFF",
            textShadow: "0px 2px 5px rgba(0, 0, 0, 0.75)",
            whiteSpace: "nowrap",
          }}
        >
          Descubre quién
        </Layer>

        {/* Vive una nueva vida... */}
        <Layer
          left={88}
          top={268}
          width={225}
          style={{
            fontFamily: "var(--font-nunito)",
            fontWeight: 800,
            fontSize: 13,
            lineHeight: "113.54%",
            letterSpacing: "-0.02em",
            textAlign: "center",
            color: "#FFFFFF",
            textShadow: "0px 2px 5px rgba(0, 0, 0, 0.66)",
          }}
        >
          Vive una nueva vida. Toma decisiones, desarrolla habilidades y descubre tu verdadero potencial.
        </Layer>

        {/* podrías llegar a ser */}
        <Layer
          left={31}
          top={234}
          width={340}
          style={{
            fontFamily: "var(--font-nunito)",
            fontWeight: 900,
            fontSize: 32,
            lineHeight: "31px",
            letterSpacing: "-0.04em",
            textAlign: "center",
            background: `linear-gradient(180deg, var(--splash-title-grad-from) 51.43%, var(--splash-title-grad-to) 85.71%)`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
            filter: "drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.75))",
            whiteSpace: "nowrap",
          }}
        >
          podrías llegar a ser
        </Layer>

        {/* Logo Modo Goat 1 */}
        <Layer left={38} top={48} width={332} height={158}>
          <Image src="/logo-mark.png" alt="Modo GOAT" fill priority sizes="332px" className="object-contain" />
        </Layer>
      </div>
    </main>
  );
}
