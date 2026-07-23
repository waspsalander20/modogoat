import crypto from "node:crypto";

export const DASHBOARD_COOKIE = "modogoat_dashboard_auth";

function secret(): string {
  return process.env.DASHBOARD_PASSWORD ?? "";
}

export function tokenEsperado(): string {
  return crypto.createHmac("sha256", secret()).update("authorized").digest("hex");
}

export function passwordValida(password: string): boolean {
  const esperado = secret();
  if (!esperado) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
