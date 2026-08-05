import { Resend } from "resend";

function cliente(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export function urlBase(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3006";
}

// Sin RESEND_API_KEY (ej. en dev antes de tener la cuenta configurada) esto
// deja un log y sigue de largo — registro/login/recuperar-contraseña nunca
// deben romperse porque el correo no se pudo enviar.
export async function enviarEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const resend = cliente();
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY no configurada — no se envió "${subject}" a ${to}`);
    return;
  }

  const from = process.env.RESEND_FROM ?? "Modo GOAT <no-responder@modogoat.io>";
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) {
    console.error(`[email] Error enviando "${subject}" a ${to}:`, error);
  }
}
