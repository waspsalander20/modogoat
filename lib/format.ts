import { CONFIG_PAIS, PAIS_DEFECTO, type PaisId } from "@/lib/data/paises";

export function formatoPesos(valor: number, pais: PaisId = PAIS_DEFECTO): string {
  const { locale, monedaCodigo } = CONFIG_PAIS[pais];
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: monedaCodigo,
    maximumFractionDigits: 0,
  }).format(valor);
}

export function formatoPesosCompacto(valor: number, pais: PaisId = PAIS_DEFECTO): string {
  const { monedaSimbolo } = CONFIG_PAIS[pais];
  const signo = valor < 0 ? "-" : "";
  const abs = Math.abs(valor);
  if (abs >= 1_000_000) return `${signo}${monedaSimbolo}${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${signo}${monedaSimbolo}${Math.round(abs / 1_000)}K`;
  return `${signo}${monedaSimbolo}${abs}`;
}
