import crypto from "node:crypto";

export const JUGADOR_COOKIE = "modogoat_jugador_session";

function secret(): string {
  return process.env.JUGADOR_SESSION_SECRET ?? "";
}

// scrypt (nativo de Node, sin dependencias nuevas) — mismo enfoque que
// lib/dashboardAuth.ts, pero por-usuario: cada hash lleva su propia sal
// porque acá sí comparamos contra muchas contraseñas distintas, no una sola.
export async function hashPassword(password: string): Promise<string> {
  const sal = crypto.randomBytes(16).toString("hex");
  const derivada = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, sal, 64, (err, key) => (err ? reject(err) : resolve(key)));
  });
  return `${sal}:${derivada.toString("hex")}`;
}

export async function verifyPassword(password: string, hashGuardado: string): Promise<boolean> {
  const [sal, hashHex] = hashGuardado.split(":");
  if (!sal || !hashHex) return false;
  const derivada = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, sal, 64, (err, key) => (err ? reject(err) : resolve(key)));
  });
  const esperada = Buffer.from(hashHex, "hex");
  if (derivada.length !== esperada.length) return false;
  return crypto.timingSafeEqual(derivada, esperada);
}

function firmar(jugadorId: string): string {
  return crypto.createHmac("sha256", secret()).update(jugadorId).digest("hex");
}

export function crearTokenSesion(jugadorId: string): string {
  return `${jugadorId}.${firmar(jugadorId)}`;
}

// Devuelve el jugadorId si la cookie es válida (firma intacta), null si no.
export function jugadorIdDeToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const separador = token.lastIndexOf(".");
  if (separador === -1) return null;
  const jugadorId = token.slice(0, separador);
  const firma = token.slice(separador + 1);
  const esperada = firmar(jugadorId);
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return jugadorId;
}
