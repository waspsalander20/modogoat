"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav({ partidaId }: { partidaId: string }) {
  const pathname = usePathname();

  const tabs = [
    { href: `/juego/partida/${partidaId}`, label: "Jugar", icon: "/icon-game-controller.png", from: "var(--game-tab-jugar-from)", to: "var(--game-tab-jugar-to)" },
    { href: `/juego/partida/${partidaId}/skills`, label: "Skills", icon: "/icon-star.png", from: "var(--game-tab-skills-from)", to: "var(--game-tab-skills-to)" },
    { href: `/juego/partida/${partidaId}/futuro`, label: "Futuro", icon: "/icon-crystal-ball.png", from: "var(--game-tab-futuro-from)", to: "var(--game-tab-futuro-to)" },
  ];

  return (
    <nav className="flex sticky bottom-0 px-3 py-2 gap-2" style={{ background: "var(--game-nav-bg)" }}>
      {tabs.map((tab) => {
        const activo = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl text-xs font-bold transition-colors ${
              activo ? "bg-white text-goat-ink" : "text-goat-ink-muted"
            }`}
          >
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center p-2"
              style={{ background: `linear-gradient(160deg, ${tab.from}, ${tab.to})` }}
            >
              <Image src={tab.icon} alt="" width={20} height={20} className="w-full h-full object-contain" />
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
