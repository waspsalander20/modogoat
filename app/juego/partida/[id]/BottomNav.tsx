"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav({ partidaId }: { partidaId: string }) {
  const pathname = usePathname();

  const tabs = [
    { href: `/juego/partida/${partidaId}`, label: "Jugar", emoji: "🎮" },
    { href: `/juego/partida/${partidaId}/skills`, label: "Skills", emoji: "⚡" },
    { href: `/juego/partida/${partidaId}/futuro`, label: "Futuro", emoji: "🔮" },
  ];

  return (
    <nav className="bg-goat-surface border-t border-goat-border flex sticky bottom-0">
      {tabs.map((tab) => {
        const activo = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold ${
              activo ? "text-goat-accent-solid" : "text-goat-ink-muted"
            }`}
          >
            <span className="text-lg">{tab.emoji}</span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
