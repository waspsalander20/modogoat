# Modo GOAT

Simulador de vida para orientación vocacional. El jugador entra entre los 14
y los 28 años y vive los siguientes **10 años** de su vida (empezar a los 16
termina a los 26, empezar a los 20 termina a los 30, etc. — no siempre
termina "a los 30"). Ver `ModoGOAT_GDD.md` para el diseño completo y
`ModoGOAT_Prompt_Motor.md` para el diseño del motor narrativo con IA. Esta
implementación cubre el alcance de demo descrito en el GDD § "Prioridades
para el demo":

- Flujo completo del juego: onboarding (8 preguntas disfrazadas) → decisión
  principal + eventos por año, generados en vivo por IA → resultado final
  con análisis narrativo personalizado.
- Campo libre (área de interés) guardado, usado para personalizar toda la
  narrativa generada, y visible en el dashboard.
- Dashboard básico de Sapiencia: distribución de perfiles, áreas más
  mencionadas, alertas, listado de partidas.
- Informe de perfil al terminar la partida.
- PWA instalable (manifest + service worker propio).

No incluido en este alcance (ver GDD): autenticación de jugadores (solo
nombre, sin cuentas), apps nativas, Modo Parceros, API de datos externa.

## Motor narrativo con IA

Todo el contenido de la partida (decisión principal de cada año, eventos,
consecuencias de cada elección, y el análisis final) se genera en vivo
llamando a la API de Claude (`lib/aiMotor.ts`, modelo `claude-sonnet-5`,
forced tool-use con schema estricto para JSON estructurado) — no hay bancos
de contenido estáticos. `lib/estadoIA.ts` arma el estado de la partida que
se le manda al modelo en cada llamada, incluye el historial reciente
(hechos canónicos que la IA no puede contradecir) y fuerza determinísticamente
cosas que la IA por sí sola no garantiza de forma confiable: que aparezca un
mentor antes de cierto punto, y que los tipos de evento (imprevisto/
oportunidad) se balanceen. El texto libre que escribe el jugador (área de
interés) se trata siempre como dato, nunca como instrucción — ver
`lib/sanitizarTexto.ts` y la sección "SEGURIDAD" del prompt del sistema.

La cantidad de eventos por año (siempre se intenta 1, tope de 2) y el
avance de año a año son lógica local determinística
(`app/api/partida/[id]/decision`, `/evento`, `/fin-anio`) — la IA nunca
decide el ritmo del juego, solo redacta el contenido. Requiere
`ANTHROPIC_API_KEY` en `.env`.

Cada llamada a la IA reporta su uso real de tokens (`lib/aiCost.ts`), que se
acumula por partida y se muestra en el dashboard de Sapiencia — costo real
en USD/COP, para calcular precio cuando se cierre un contrato.

## Stack

Next.js 16 (App Router) · PostgreSQL vía Prisma 7 (driver adapter `pg`) ·
Tailwind CSS 4 · Recharts · Claude API (`@anthropic-ai/sdk`).

## Desarrollo local

Necesitás Node.js 20+ y una base Postgres. Si no tenés Postgres instalado,
`scripts/local-pg.mjs` levanta uno real (binario embebido, sin dependencias
del sistema) en `localhost:54329`:

```bash
npm install
node scripts/local-pg.mjs &     # deja esto corriendo en una terminal
cp .env.example .env            # ya apunta al Postgres local por defecto
# agregá ANTHROPIC_API_KEY=sk-ant-... a .env — sin esto el juego no puede
# generar decisiones/eventos/resultado (ver "Motor narrativo con IA" arriba)
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
npm run test      # smoke-test.ts — lógica pura del juego (sin IA, sin framework)
npx prisma studio # explorar la base de datos
```

`npm run test` corre `smoke-test.ts` (raíz del repo): asserts sobre ingreso
proyectado, resultado final, medallas, resumen de año, perfil vocacional y
detección de troll. No cubre las llamadas a la IA (no determinísticas) — para
eso, jugar una partida completa a mano es la única forma real de probar.

## Despliegue en Railway

1. Creá un proyecto nuevo en Railway y agregá un plugin de **PostgreSQL**
   (Railway define `DATABASE_URL` automáticamente en las variables del
   servicio de la app cuando lo conectás).
2. Conectá este repo de GitHub como servicio.
3. Variables de entorno del servicio:
   - `DATABASE_URL` — la provee el plugin de Postgres de Railway.
   - `DASHBOARD_PASSWORD` — contraseña del dashboard de Sapiencia (elegí una
     fuerte; no es la misma que uses en local).
   - `ANTHROPIC_API_KEY` — clave de la API de Claude. Sin esto el juego no
     puede generar contenido (ver "Motor narrativo con IA" arriba).
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

- `lib/aiMotor.ts` — cliente de la API de Claude: genera la decisión de cada
  año, eventos, consecuencias de cada elección y el análisis final.
- `lib/estadoIA.ts` — arma el JSON de estado de partida que se le manda al
  modelo en cada llamada.
- `lib/data/` — catálogos usados por la UI (skills, medallas, mensajes,
  perfiles, salarios base, preguntas de onboarding) — ya no contienen bancos
  de decisiones/eventos, eso ahora lo genera la IA en vivo.
- `lib/motor.ts`, `lib/perfilamiento.ts`, `lib/deteccionTroll.ts` — cálculo
  determinístico local: gastos por edad, aplicar skills/puntos, perfil
  dominante, anti-troll, salario proyectado, resultado final.
- `prisma/schema.prisma` — Jugador / Partida / DecisionJugada / EventoJugado.
- `app/api/partida/` — creación de partida, turno (obtiene o genera la
  decisión/evento pendiente), registrar decisión, registrar evento, fin de
  año (avanza edad o cierra la partida y pide el análisis final a la IA).
- `app/juego/` — pantallas del jugador (splash, onboarding, partida —
  incluye Skills y Futuro —, resultado).
- `app/dashboard/` — panel de Sapiencia, protegido por `proxy.ts` (contraseña
  compartida, no autenticación por usuario).
