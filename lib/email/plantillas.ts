// Plantillas de correo — HTML con estilos inline (los clientes de correo no
// leen hojas de estilo externas ni la mayoría de CSS moderno), reutilizando
// la paleta naranja/dorada ya establecida en app/globals.css
// (--onboarding-grad-top/bottom, --onboarding-button-*).

function layout(contenido: string): string {
  return `
<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f5f5fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:420px;background:linear-gradient(180deg,#fecb44 0%,#e45603 100%);border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:32px 28px;">
                <p style="margin:0 0 20px 0;font-size:22px;font-weight:900;color:#ffffff;text-shadow:0px 2px 2.4px #883900;">MODO GOAT</p>
                <div style="background:#fff8e4;border-radius:16px;padding:24px;">
                  ${contenido}
                </div>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;font-size:11px;color:#9a9a9a;">Modo GOAT — este correo se generó automáticamente.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function boton(href: string, texto: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:13px 28px;border-radius:999px;background:linear-gradient(180deg,#ffc233 0%,#f18704 55%,#e35d02 100%);border:1.5px solid #c94a02;color:#ffffff;font-weight:800;font-size:15px;text-decoration:none;">${texto}</a>`;
}

export function emailConfirmacion(nombre: string, urlConfirmacion: string): { subject: string; html: string } {
  return {
    subject: "Confirma tu correo — Modo GOAT",
    html: layout(`
      <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:900;color:#161616;">¡Hola, ${nombre}!</h1>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#161616;">
        Gracias por crear tu cuenta en Modo GOAT. Confirma tu correo para dejarlo asociado a tu cuenta —
        tu colegio o administrador todavía tiene que activarla antes de que puedas entrar a jugar.
      </p>
      ${boton(urlConfirmacion, "Confirmar mi correo")}
      <p style="margin:20px 0 0 0;font-size:12px;color:#6b6b6b;">
        Si tú no creaste esta cuenta, puedes ignorar este correo.
      </p>
    `),
  };
}

export function emailRecuperarPassword(nombre: string, urlReset: string): { subject: string; html: string } {
  return {
    subject: "Recupera tu contraseña — Modo GOAT",
    html: layout(`
      <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:900;color:#161616;">Hola, ${nombre}</h1>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#161616;">
        Alguien pidió restablecer la contraseña de tu cuenta en Modo GOAT. Si fuiste tú, toca el botón de
        abajo — el link es válido por 1 hora.
      </p>
      ${boton(urlReset, "Elegir nueva contraseña")}
      <p style="margin:20px 0 0 0;font-size:12px;color:#6b6b6b;">
        Si no fuiste tú quien lo pidió, puedes ignorar este correo — tu contraseña actual sigue funcionando.
      </p>
    `),
  };
}
