# Modo GOAT

Simulador de vida para orientación vocacional (14–30 años). Ver
`ModoGOAT_GDD.md` para el diseño completo. Esta implementación cubre el
alcance de demo descrito en el GDD § "Prioridades para el demo":

- Flujo completo del juego: onboarding (8 preguntas disfrazadas) → 14
  decisiones + eventos (12 imprevistos / 15 oportunidades) → resultado final.
- Campo libre (área de interés) guardado y visible en el dashboard.
- Dashboard básico de Sapiencia: distribución de perfiles, áreas más
  mencionadas, alertas, listado de partidas.
- Informe de perfil al terminar la partida.
- PWA instalable (manifest + service worker propio).

No incluido en este alcance (ver GDD): autenticación de jugadores (solo
nombre, sin cuentas), apps nativas, Modo Parceros, API de datos externa.

## Stack

Next.js 16 (App Router) · PostgreSQL vía Prisma 7 (driver adapter `pg`) ·
Tailwind CSS 4 · Recharts.

## Desarrollo local

Necesitás Node.js 20+ y una base Postgres. Si no tenés Postgres instalado,
`scripts/local-pg.mjs` levanta uno real (binario embebido, sin dependencias
del sistema) en `localhost:54329`:

```bash
npm install
node scripts/local-pg.mjs &     # deja esto corriendo en una terminal
cp .env.example .env            # ya apunta al Postgres local por defecto
npx prisma migrate dev          # crea las tablas
npm run dev
```

Abrí `http://localhost:3000/juego` para jugar y `http://localhost:3000/dashboard`
para el panel de Sapiencia (contraseña: `DASHBOARD_PASSWORD` en `.env`).

## Comandos

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción (type-checks incluido)
npm run start    # sirve el build de producción
npm run lint      # eslint
npx prisma studio # explorar la base de datos
```

## Despliegue en Railway

1. Creá un proyecto nuevo en Railway y agregá un plugin de **PostgreSQL**
   (Railway define `DATABASE_URL` automáticamente en las variables del
   servicio de la app cuando lo conectás).
2. Conectá este repo de GitHub como servicio.
3. Variables de entorno del servicio:
   - `DATABASE_URL` — la provee el plugin de Postgres de Railway.
   - `DASHBOARD_PASSWORD` — contraseña del dashboard de Sapiencia (elegí una
     fuerte; no es la misma que uses en local).
4. Build command: `npm run build` (por defecto). Start command: `npm run start`.
5. Antes del primer deploy (o en cada deploy con cambios de schema), corré
   las migraciones contra la base de Railway:
   ```bash
   railway run npx prisma migrate deploy
   ```
   (`migrate deploy`, no `migrate dev` — no genera migraciones nuevas, solo
   aplica las que ya existen en `prisma/migrations/`).
6. Railway asigna el dominio `https://<servicio>.up.railway.app` — la app
   funciona ahí sin configuración adicional. Para dominio propio, agregalo
   desde la pestaña "Settings → Domains" del servicio.

## Estructura

- `lib/data/` — bancos de contenido del GDD (decisiones, imprevistos,
  oportunidades, mentores, skills, medallas, mensajes) transcritos a TS.
- `lib/motor.ts`, `lib/perfilamiento.ts`, `lib/deteccionTroll.ts` — motor del
  juego: selección de eventos, cálculo de perfil, anti-troll, salario
  proyectado.
- `prisma/schema.prisma` — Jugador / Partida / DecisionJugada / EventoJugado.
- `app/api/partida/` — creación de partida, turno (qué decisión/eventos
  tocan), registrar decisión, registrar evento, fin de año.
- `app/juego/` — pantallas del jugador (splash, onboarding, partida, resultado).
- `app/dashboard/` — panel de Sapiencia, protegido por `proxy.ts` (contraseña
  compartida, no autenticación por usuario).
