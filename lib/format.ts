export function formatoPesos(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

export function formatoPesosCompacto(valor: number): string {
  const signo = valor < 0 ? "-" : "";
  const abs = Math.abs(valor);
  if (abs >= 1_000_000) return `${signo}$${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${signo}$${Math.round(abs / 1_000)}K`;
  return `${signo}$${abs}`;
}
