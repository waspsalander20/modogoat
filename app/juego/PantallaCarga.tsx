import Image from "next/image";

export default function PantallaCarga({
  mensaje = "Cada decisión que tomas hoy escribe el futuro que sueñas.",
}: {
  mensaje?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center overflow-hidden"
      style={{ background: "linear-gradient(180deg, #FDBA05 0%, #E45603 100%)" }}
    >
      <Image src="/loading-fondo.png" alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute left-1/2 top-[89px] w-[566px] max-w-none -translate-x-1/2">
        <Image
          src="/loading-goat.png"
          alt=""
          width={566}
          height={848}
          priority
          style={{ width: "100%", height: "auto" }}
        />
      </div>
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(136,57,0,0) 32.69%, #782C00 100%)" }}
      />

      <div className="relative mt-[60px]">
        <Image src="/logo-mark.png" alt="Modo GOAT" width={120} height={57} priority />
      </div>

      <div className="relative mt-auto flex flex-col items-center px-6 pb-[70px] text-center">
        <h1
          className="leading-[90%] font-black"
          style={{
            fontSize: 44,
            letterSpacing: "-0.06em",
            backgroundImage: "linear-gradient(180deg, #FFEEC2 31.25%, #FFCA3C 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            WebkitTextStroke: "1.5px #883900",
          }}
        >
          Escribiendo
          <br />
          tu historia...
        </h1>

        <div
          className="mt-6 flex items-center gap-3 rounded-[20px] px-4 py-3"
          style={{
            background: "linear-gradient(132.49deg, #FFECC4 26.1%, #FFE693 86.54%)",
            border: "1px solid #883900",
            boxShadow: "inset 0px 4px 4px rgba(255,255,255,0.25)",
          }}
        >
          <span
            className="flex h-[39px] w-[39px] shrink-0 items-center justify-center rounded-[14px]"
            style={{
              background: "linear-gradient(180deg, #E8BE15 0%, #E96D00 100%)",
              boxShadow: "0px 4px 4px rgba(0,0,0,0.25), inset 0px 4px 4px rgba(255,232,232,0.25)",
            }}
          >
            <Image src="/icon-notepad.png" alt="" width={21} height={21} />
          </span>
          <p
            className="text-left font-extrabold text-sm"
            style={{ color: "#883900", letterSpacing: "-0.02em", textShadow: "0px 2px 5px rgba(0,0,0,0.1)" }}
          >
            {mensaje}
          </p>
        </div>

        <Image src="/loading-spinner.gif" alt="" width={90} height={90} unoptimized className="mt-2" />
      </div>
    </div>
  );
}
