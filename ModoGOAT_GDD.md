# MODO GOAT — Game Design Document
## Guía de Oportunidades y Autoconocimiento Transformador

**Versión:** 1.0 — Pre-desarrollo  
**Fecha:** Julio 2025  
**Autor:** Josué Moya de la Cruz — The Way  
**Cliente:** Sapiencia / Alcaldía de Medellín  
**Stack:** Next.js + PostgreSQL + Railway  

---

## Índice

1. [Visión general del producto](#1-visión-general)
2. [Arquitectura técnica](#2-arquitectura-técnica)
3. [Estructura de la base de datos](#3-base-de-datos)
4. [Flujos de la aplicación](#4-flujos)
5. [Sistema de onboarding — 8 preguntas](#5-onboarding)
6. [Motor del juego](#6-motor-del-juego)
7. [Banco de decisiones principales](#7-decisiones)
8. [Banco de imprevistos](#8-imprevistos)
9. [Banco de oportunidades](#9-oportunidades)
10. [Sistema de mentores](#10-mentores)
11. [Sistema de skills](#11-skills)
12. [Sistema de medallas](#12-medallas)
13. [Sistema de perfilamiento](#13-perfilamiento)
14. [Cálculo de salario proyectado](#14-salario)
15. [Mecánica anti-troll](#15-anti-troll)
16. [Mensajes motivacionales](#16-mensajes)
17. [Textos de pantalla final](#17-pantallas-finales)
18. [Dashboard de Sapiencia](#18-dashboard)
19. [Las 57 pantallas](#19-pantallas)
20. [Roadmap post-MVP](#20-roadmap)

---

## 1. Visión General

### ¿Qué es Modo GOAT?

Modo GOAT es un simulador de vida web/PWA para orientación vocacional de jóvenes entre 14 y 28 años en Medellín. El jugador toma decisiones de carrera, trabajo y vida cotidiana desde su edad actual hasta los 30 años, experimentando consecuencias reales en términos de ingresos, habilidades y oportunidades — sin costos reales.

Mientras el jugador cree que está jugando, el sistema aplica cuatro metodologías validadas de orientación vocacional de forma completamente invisible, generando un perfil psicológico y vocacional accionable que Sapiencia puede usar para tomar decisiones de intervención, becas y acompañamiento.

### Principio central

> Modo GOAT no es una herramienta de orientación vocacional disfrazada de juego.  
> Es un juego que produce orientación vocacional como subproducto.

### Usuarios

| Usuario | Acceso | Objetivo |
|---|---|---|
| Joven (jugador) | `/juego` | Explorar futuros posibles y descubrir su perfil |
| Sapiencia / Parceros | `/dashboard` | Analizar perfiles y tomar decisiones institucionales |
| Admin (The Way) | `/admin` | Gestionar contenido y monitorear el sistema |

### Parámetros del juego

| Parámetro | Valor |
|---|---|
| Edad mínima de inicio | 14 años |
| Edad máxima de inicio | 28 años |
| Edad de fin | 30 años |
| Decisiones por año | 1 principal + hasta 2 eventos (imprevisto u oportunidad) |
| Duración estimada | 15–22 minutos |
| ¿Se puede perder? | No — siempre llega a los 30 |
| Partidas | Ilimitadas |
| Plataformas | Web + PWA móvil |
| Idioma | Español colombiano |

---

## 2. Arquitectura Técnica

### Stack

```
Frontend:   Next.js 14 (App Router)
Backend:    Next.js API Routes
Base datos: PostgreSQL (Railway)
ORM:        Prisma
Hosting:    Railway
PWA:        next-pwa
Fuentes:    Nunito (Google Fonts)
Gráficas:   Recharts
```

### Estructura de carpetas

```
modogoat/
├── app/
│   ├── juego/              # Flujo del jugador
│   │   ├── page.tsx        # Splash / entrada
│   │   ├── onboarding/     # Pasos 1-8
│   │   ├── partida/        # Motor del juego
│   │   └── resultado/      # Pantalla final
│   ├── dashboard/          # Panel Sapiencia
│   │   ├── page.tsx        # Vista poblacional
│   │   └── [id]/           # Perfil individual
│   ├── api/
│   │   ├── partida/        # CRUD partidas
│   │   ├── perfil/         # Cálculo de perfiles
│   │   └── dashboard/      # Datos agregados
│   └── layout.tsx
├── components/
│   ├── juego/              # Componentes del juego
│   ├── dashboard/          # Componentes del dashboard
│   └── ui/                 # Componentes base
├── lib/
│   ├── motor.ts            # Lógica del juego
│   ├── perfilamiento.ts    # Sistema de puntos
│   ├── eventos.ts          # Aparición de eventos
│   └── prisma.ts           # Cliente de BD
├── prisma/
│   └── schema.prisma
└── public/
    └── manifest.json       # PWA config
```

### Variables de entorno

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://modogoat.app
NODE_ENV=production
```

---

## 3. Base de Datos

### Schema Prisma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── JUGADOR ─────────────────────────────────────────────
model Jugador {
  id          String   @id @default(cuid())
  nombre      String
  edad        Int
  genero      String   // "masculino" | "femenino" | "otro"
  ciudad      String
  contexto    String   // "familia_completa" | "solo_mama" | "solo_papa" | "otros_familiares" | "solo"
  trabaja     String   // "si" | "a_veces" | "no"
  createdAt   DateTime @default(now())
  partidas    Partida[]
}

// ── PARTIDA ─────────────────────────────────────────────
model Partida {
  id              String   @id @default(cuid())
  jugadorId       String
  jugador         Jugador  @relation(fields: [jugadorId], references: [id])
  
  // Onboarding
  respuestasOnboarding Json  // { p1: "a", p2: "f", ... }
  areaLibre       String    // Lo que escribió en campo libre
  rutaEntrada     String    // "universidad" | "tecnica" | "emprender" | "trabajar_estudiar"
  
  // Perfil calculado
  puntosPerfil    Json      // { EMP: 0, INV: 0, EMP2: 0, FREE: 0, CRE: 0 }
  perfilDominante String?   // "EMP" | "INV" | "EMP2" | "FREE" | "CRE"
  perfilSecundario String?
  esMixto         Boolean   @default(false)
  
  // Big Five
  bigFive         Json?     // { apertura: 0-100, responsabilidad: 0-100, ... }
  
  // Estado del juego
  edadActual      Int       @default(0)
  ingresoActual   Int       @default(0)  // en pesos
  aniosJugados    Int       @default(0)
  estado          String    @default("onboarding") // "onboarding" | "jugando" | "terminado"
  
  // Resultado
  resultadoTipo   String?   // "goat" | "alto" | "medio" | "bajo" | "troll"
  ingresoFinal    Int?
  
  // Skills al terminar
  skillsFinales   Json?     // { ingles: 3, comunicacion: 4, ... }
  
  // Medallas
  medallasGanadas String[]  @default([])
  
  // Alertas generadas
  alertas         String[]  @default([])
  
  // Troll detection
  tiempoPromedio  Float?    // segundos por respuesta
  patronTroll     Boolean   @default(false)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  decisiones      DecisionJugada[]
  eventos         EventoJugado[]
}

// ── DECISIÓN JUGADA ─────────────────────────────────────
model DecisionJugada {
  id            String   @id @default(cuid())
  partidaId     String
  partida       Partida  @relation(fields: [partidaId], references: [id])
  
  anio          Int
  decisionId    String   // referencia al banco de decisiones
  opcionElegida String   // "A" | "B" | "C" | "D"
  campoLibre    String?  // si la decisión tiene campo libre
  tiempoRespuesta Float  // segundos
  
  // Consecuencias aplicadas
  ingresoAntes  Int
  ingresoDespues Int
  skillsSubidas Json     // { skill: nivel }
  puntosSumados Json     // { EMP: 0, INV: 1, ... }
  
  createdAt     DateTime @default(now())
}

// ── EVENTO JUGADO ───────────────────────────────────────
model EventoJugado {
  id            String   @id @default(cuid())
  partidaId     String
  partida       Partida  @relation(fields: [partidaId], references: [id])
  
  anio          Int
  tipoEvento    String   // "imprevisto" | "oportunidad"
  eventoId      String
  opcionElegida String
  tiempoRespuesta Float
  
  createdAt     DateTime @default(now())
}
```

---

## 4. Flujos

### Flujo completo del jugador

```
ENTRADA
  │
  ├─ Splash screen
  ├─ Onboarding (8 preguntas)
  │   ├─ Datos básicos (nombre, edad, género, ciudad, contexto, trabaja)
  │   └─ 8 preguntas disfrazadas (CHASIDE x2, Big Five x2, MMMG x2, VAK x2)
  │
  └─ JUEGO (loop por año)
      │
      ├─ Inicio de año (resumen + qué viene)
      ├─ Decisión principal (1 por año)
      │   ├─ Popup de detalle (opcional)
      │   └─ Confirmación
      ├─ Evento 1 (imprevisto u oportunidad — 70% perfil, 30% aleatorio)
      ├─ Evento 2 (imprevisto u oportunidad)
      ├─ ¿Mentor disponible? → Misión del mentor
      ├─ Resumen de año
      └─ ¿Año 30? → RESULTADO
                      ├─ GOAT MODE
                      ├─ Alto
                      ├─ Medio
                      ├─ Bajo
                      └─ Troll
```

---

## 5. Onboarding — 8 Preguntas

> **Nota de implementación:** Las opciones de cada pregunta se muestran en orden aleatorio en cada sesión. Nunca el mismo orden dos veces. Esto evita respuestas automáticas tipo "todo A".

### Datos básicos (no son preguntas de perfil)

```
- Nombre del personaje (texto libre)
- Edad actual (número — mínimo 14, máximo 28)
- Género (masculino / femenino / otro)
- Ciudad (texto libre — default "Medellín")
- Con quién vive (familia completa / solo mamá / solo papá / otros familiares / solo)
- Trabaja actualmente (sí / a veces / no)
```

### Pregunta 1 — CHASIDE (área vocacional)

**Texto:** *"Es viernes en la noche. No hay nada planeado. ¿Qué hace [nombre] normalmente?"*

| Opción | Texto | Señal CHASIDE | Perfil |
|---|---|---|---|
| A | Crea algo — diseño, música, videos, arte | Arte (A) | CRE + FREE |
| B | Sale con parceros — siempre hay plan | Social (S) | EMP2 + EMP |
| C | Investiga algo por curiosidad propia | Ciencias (C) | INV |
| D | Piensa cómo ganar plata — rebusca, vende | Económico (E) | EMP2 + FREE |
| E | Lee, ve documentales, aprende algo | Ciencias (C) | INV + EMP |
| F | Juega videojuegos o consume contenido | Arte (A) | CRE |

### Pregunta 2 — CHASIDE (proyecto)

**Texto:** *"Le piden a [nombre] un proyecto libre en el colegio. Sin restricciones. ¿Qué entrega?"*

| Opción | Texto | Señal | Perfil |
|---|---|---|---|
| A | Algo creativo que sorprenda | Arte (A) | CRE |
| B | Una investigación bien sustentada | Ciencias (C) | INV |
| C | Una propuesta para resolver un problema real | Social (S) | EMP2 + INV |
| D | Un plan de negocio o emprendimiento | Económico (E) | EMP2 |
| E | Algo colaborativo — lo hace con otros | Social (S) | EMP + FREE |
| F | Lo más fácil y rápido — lo importante es entregar | — | Alerta troll |

### Pregunta 3 — Big Five (grupo)

**Texto:** *"En un trabajo en grupo [nombre] generalmente..."*

| Opción | Texto | Factor Big Five | Perfil |
|---|---|---|---|
| A | Organiza todo — cronograma, roles, entregas | Responsabilidad alta | EMP |
| B | Toma la vocería y presenta al final | Extroversión alta | EMP + EMP2 |
| C | Investiga y trae la información más completa | Apertura alta | INV |
| D | Se encarga de que todo se vea bien | Apertura alta | CRE |
| E | Se adapta — hace lo que el grupo necesite | Amabilidad alta | FREE + EMP |
| F | Hace lo mínimo — espera que otros carguen | Responsabilidad baja | Alerta |

### Pregunta 4 — Big Five (crítica)

**Texto:** *"Le llega una crítica fuerte a algo que [nombre] hizo. ¿Cómo reacciona?"*

| Opción | Texto | Factor Big Five | Perfil |
|---|---|---|---|
| A | La analiza — busca qué tiene de verdad | Neuroticismo bajo | INV + EMP |
| B | La usa como motivación — le da más ganas | Neuroticismo bajo | EMP2 + CRE |
| C | Se defiende — siente que no es justa | Neuroticismo medio | EMP2 |
| D | La convierte en conversación | Amabilidad alta | EMP + FREE |
| E | Se calla — por fuera tranquilo, por dentro le afecta | Neuroticismo alto | Alerta |
| F | La ignora — no le importa | Neuroticismo bajo / Apertura baja | Alerta troll |

### Pregunta 5 — MMMG (motivación)

**Texto:** *"¿Qué haría sentir más orgulloso/a a [nombre]?"*

| Opción | Texto | Motivación MMMG | Perfil |
|---|---|---|---|
| A | Ser reconocido como referente en algo | Logro | INV + CRE |
| B | Haber ayudado a alguien a cambiar su situación | Afiliación | EMP + INV |
| C | Tener libertad financiera y no depender de nadie | Logro + Poder | EMP2 + FREE |
| D | Haber crecido como persona | Crecimiento | Todos |
| E | Construir algo que funcione sin él/ella | Logro | EMP2 + EMP |
| F | Tener audiencia que lo siga | Logro | CRE |

### Pregunta 6 — MMMG (fracaso)

**Texto:** *"Un proyecto en el que [nombre] puso todo falla. ¿Qué hace?"*

| Opción | Texto | Motivación MMMG | Perfil |
|---|---|---|---|
| A | Lo intenta de nuevo solo — aprendió algo | Logro alto | EMP2 + CRE |
| B | Busca un socio para reintentar | Afiliación + Logro | EMP2 + EMP |
| C | Lo toma como aprendizaje y busca algo diferente | Crecimiento | FREE + INV |
| D | Consigue un trabajo — prefiere la estabilidad | Seguridad | EMP |
| E | Lo documenta y lo cuenta para que otros aprendan | Afiliación + Logro | INV + CRE |
| F | Se frustra y no hace nada por un tiempo | Neuroticismo alto | Alerta |

### Pregunta 7 — VAK (aprendizaje)

**Texto:** *"[nombre] quiere aprender algo nuevo. ¿Cómo lo hace?"*

| Opción | Texto | Estilo VAK | Perfil |
|---|---|---|---|
| A | Busca videos y tutoriales — aprende viendo | Visual | CRE + FREE |
| B | Lee artículos o guías detalladas | Lector | INV + EMP |
| C | Experimenta directamente — prueba, falla, ajusta | Kinestésico | EMP2 + FREE |
| D | Le pregunta a alguien que ya sabe | Auditivo-social | EMP + CRE |
| E | Busca el curso más completo y lo sigue paso a paso | Visual-lector | EMP + INV |
| F | Toma notas y organiza la información a su manera | Lector | INV |

### Pregunta 8 — VAK (semana libre)

**Texto:** *"[nombre] tiene una semana libre inesperada. ¿Qué hace?"*

| Opción | Texto | Señal | Perfil |
|---|---|---|---|
| A | Crea algo que tenía pendiente | Visual-kinestésico | CRE + FREE |
| B | Aprende algo nuevo que tenía en lista | Lector | INV + EMP |
| C | Sale con amigos — planes, parche | Social | EMP2 + EMP |
| D | Explora algo nuevo — lugar, idea, habilidad | Kinestésico | FREE + INV |
| E | Descansa de verdad — recarga energía | — | Neutral |
| F | Busca cómo ganarse algo extra | Económico | EMP2 + FREE |

### Detección anti-troll en onboarding

```typescript
// lib/deteccionTroll.ts

interface ResultadoDeteccion {
  esTroll: boolean;
  tiempoPromedio: number;
  patronRepetido: boolean;
  perfilCoherente: boolean;
}

function detectarTroll(
  respuestas: Record<string, string>,
  tiempos: Record<string, number>
): ResultadoDeteccion {
  const tiempoPromedio = Object.values(tiempos).reduce((a, b) => a + b, 0) / Object.values(tiempos).length;
  
  // Detectar respuesta automática
  const valores = Object.values(respuestas);
  const masRepetida = valores.sort((a,b) => 
    valores.filter(v => v === a).length - valores.filter(v => v === b).length
  ).pop();
  const vecesRepetida = valores.filter(v => v === masRepetida).length;
  const patronRepetido = vecesRepetida >= 6; // misma opción 6+ veces
  
  // Tiempo muy bajo = no están leyendo
  const tiempoMuyBajo = tiempoPromedio < 4; // menos de 4 segundos por pregunta
  
  // Coherencia del perfil
  // (verificar que las respuestas construyen algún perfil coherente)
  const perfilCoherente = true; // simplificado — implementar con lógica completa
  
  return {
    esTroll: tiempoMuyBajo || patronRepetido,
    tiempoPromedio,
    patronRepetido,
    perfilCoherente
  };
}
```

---

## 6. Motor del Juego

### Estado de la partida

```typescript
// lib/motor.ts

interface EstadoPartida {
  jugadorId: string;
  partidaId: string;
  
  // Personaje
  nombre: string;
  edadInicio: number;
  edadActual: number;
  
  // Economía
  ingreso: number;        // pesos mensuales actuales
  ahorros: number;        // acumulado
  
  // Perfil
  puntos: {
    EMP: number;   // Empleado/Operador
    INV: number;   // Investigador
    EMP2: number;  // Emprendedor
    FREE: number;  // Freelancer
    CRE: number;   // Creador de contenidos
  };
  
  // Skills (0-5 cada una)
  skills: Record<string, number>;
  
  // Progreso
  mentorActivo: string | null;
  misionCompletada: boolean;
  medallasGanadas: string[];
  
  // Historial
  decisiones: DecisionTomada[];
  eventos: EventoVivido[];
  
  // Control
  aniosEstancado: number;  // para mecánica anti-troll
  aniosSinSkillNueva: number;
}
```

### Lógica de fin de año

```typescript
async function procesarFinDeAnio(estado: EstadoPartida): Promise<EstadoPartida> {
  // 1. Aplicar gastos según edad
  const porcentajeGastos = calcularGastos(estado.edadActual);
  estado.ahorros += estado.ingreso * (1 - porcentajeGastos);
  
  // 2. Verificar condiciones de medallas
  estado.medallasGanadas = verificarMedallas(estado);
  
  // 3. Verificar si aparece mentor
  const mentor = verificarMentor(estado);
  if (mentor && !estado.mentorActivo) {
    estado.mentorActivo = mentor;
  }
  
  // 4. Seleccionar eventos del próximo año (70% perfil + 30% aleatorio)
  const eventosProximos = seleccionarEventos(estado);
  
  // 5. Verificar anti-troll
  if (estado.ingreso === calcularIngresoAnterior(estado)) {
    estado.aniosEstancado++;
  } else {
    estado.aniosEstancado = 0;
  }
  
  // 6. Avanzar año
  estado.edadActual++;
  
  return estado;
}

function calcularGastos(edad: number): number {
  if (edad <= 18) return 0.0;
  if (edad <= 22) return 0.20;
  if (edad <= 26) return 0.40;
  return 0.60;
}
```

### Selección de eventos (70/30)

```typescript
function seleccionarEventos(estado: EstadoPartida): Evento[] {
  const perfilDominante = calcularPerfilDominante(estado.puntos);
  
  // Pool 70% — eventos según perfil
  const eventosPerfil = BANCO_IMPREVISTOS.filter(e => 
    e.perfilesPreferentes.includes(perfilDominante)
  );
  
  // Pool 30% — eventos aleatorios universales
  const eventosUniversales = BANCO_IMPREVISTOS.filter(e => 
    e.universal === true
  );
  
  // Regla especial: inglés siempre aparece si nivel < 2 entre años 18-24
  if (estado.skills.ingles < 2 && estado.edadActual >= 18 && estado.edadActual <= 24) {
    return [BANCO_IMPREVISTOS.find(e => e.id === 'trampa_ingles')!, seleccionarAleatorio(eventosPerfil)];
  }
  
  // Mezclar: 1 del perfil + 1 aleatorio (o 2 del perfil según probabilidad)
  const evento1 = Math.random() < 0.7 
    ? seleccionarAleatorio(eventosPerfil)
    : seleccionarAleatorio(eventosUniversales);
    
  const evento2 = Math.random() < 0.7
    ? seleccionarAleatorio(eventosPerfil)
    : seleccionarAleatorio(eventosUniversales);
  
  // Nunca dos imprevistos del mismo tipo en años consecutivos
  return filtrarRepetidos([evento1, evento2], estado.eventos);
}
```

---

## 7. Banco de Decisiones Principales

> 14 decisiones organizadas en 4 bloques etarios. El contenido narrativo se personaliza según el área que el jugador escribió en el campo libre.

### Bloque 1 — Etapa 16-18 años

#### DECISIÓN 1 — La gran elección

```typescript
{
  id: "decision_01",
  titulo: "La gran elección",
  bloque: 1,
  edadMinima: 16,
  edadMaxima: 18,
  categoria: "formacion_inicial",
  texto: "El colegio terminó. Todos te preguntan qué vas a hacer. ¿Qué decidís?",
  tieneCampoLibre: true,
  textoCampoLibre: "¿En qué área?",
  opciones: [
    {
      letra: "A",
      emoji: "🎓",
      titulo: "Universidad tradicional",
      descripcion: "Título reconocido, red académica, acceso a cargos formales",
      pros: ["Título reconocido", "Red académica", "Acceso a cargos formales"],
      contras: ["4-5 años", "Costo alto", "Puede quedar desactualizada"],
      skillsQueSuben: { disciplina: 1, networking: 1, investigacion: 1 },
      puntosPerfil: { EMP: 3, INV: 2, EMP2: 0, FREE: 0, CRE: 0 },
      ingresoModificador: 0
    },
    {
      letra: "B",
      emoji: "⚡",
      titulo: "Formación técnica intensiva",
      descripcion: "Empleo en 6-12 meses, aprendes haciendo, más económico",
      pros: ["Empleo rápido", "Aprendes haciendo", "Más económico"],
      contras: ["Sin título formal", "Algunas empresas exigen grado"],
      skillsQueSuben: { disciplina: 1, adaptabilidad: 1 },
      puntosPerfil: { EMP: 2, INV: 0, EMP2: 1, FREE: 3, CRE: 1 },
      ingresoModificador: 0
    },
    {
      letra: "C",
      emoji: "🚀",
      titulo: "Emprender desde ya",
      descripcion: "Ingresos propios, aprendes haciendo, sin límite de escala",
      pros: ["Ingresos propios", "Aprendizaje real", "Sin límite de escala"],
      contras: ["Sin red de seguridad", "Alta tasa de fracaso", "Soledad inicial"],
      skillsQueSuben: { ventas: 1, toleranciaRiesgo: 2, finanzasPersonales: 1 },
      puntosPerfil: { EMP: 0, INV: 0, EMP2: 3, FREE: 1, CRE: 2 },
      ingresoModificador: 0
    },
    {
      letra: "D",
      emoji: "💼",
      titulo: "Trabajar y estudiar",
      descripcion: "Ingresos desde ya, experiencia real, independencia",
      pros: ["Ingresos desde ya", "Experiencia real", "Independencia"],
      contras: ["Ritmo lento", "Cansancio", "Puede tardar más"],
      skillsQueSuben: { disciplina: 1, adaptabilidad: 1, finanzasPersonales: 1 },
      puntosPerfil: { EMP: 3, INV: 1, EMP2: 1, FREE: 1, CRE: 0 },
      ingresoModificador: 800000
    }
  ]
}
```

#### DECISIÓN 2 — El primer dinero

```typescript
{
  id: "decision_02",
  titulo: "El primer dinero",
  bloque: 1,
  edadMinima: 17,
  edadMaxima: 18,
  categoria: "primera_experiencia_economica",
  texto: "Llevas unos meses en tu camino. Aparece una forma de generar tu primer ingreso. ¿Qué hacés?",
  opciones: [
    {
      letra: "A",
      emoji: "💰",
      titulo: "Aceptás cualquier trabajo que aparezca",
      pros: ["Ingreso inmediato", "Experiencia real"],
      contras: ["Puede ser informal", "Sin desarrollo de skills"],
      skillsQueSuben: { adaptabilidad: 1, toleranciaRiesgo: 1 },
      puntosPerfil: { EMP: 2, INV: 0, EMP2: 0, FREE: 1, CRE: 0 },
      ingresoModificador: 900000
    },
    {
      letra: "B",
      emoji: "🎯",
      titulo: "Buscás algo relacionado con lo que estudiás o querés hacer",
      pros: ["Ingreso + aprendizaje", "Relevante para tu perfil"],
      contras: ["Más difícil de conseguir", "Puede tardar"],
      skillsQueSuben: { networking: 1, disciplina: 1 },
      puntosPerfil: { EMP: 2, INV: 2, EMP2: 1, FREE: 2, CRE: 1 },
      ingresoModificador: 1200000
    },
    {
      letra: "C",
      emoji: "🚀",
      titulo: "Ofrecés tus propios servicios — lo que sabés hacer, lo cobrás",
      pros: ["Autonomía", "Aprendés a venderte"],
      contras: ["Ingresos irregulares", "Sin red de seguridad"],
      skillsQueSuben: { ventas: 2, marcaPersonal: 1 },
      puntosPerfil: { EMP: 0, INV: 0, EMP2: 2, FREE: 3, CRE: 2 },
      ingresoModificador: 800000
    },
    {
      letra: "D",
      emoji: "⏳",
      titulo: "No trabajás todavía — te enfocás en formarte primero",
      pros: ["Formación completa", "Sin distracción"],
      contras: ["Sin independencia económica", "Depende de la familia"],
      skillsQueSuben: { disciplina: 2, investigacion: 1 },
      puntosPerfil: { EMP: 1, INV: 3, EMP2: 0, FREE: 0, CRE: 0 },
      ingresoModificador: 0
    }
  ]
}
```

#### DECISIÓN 3 — El primer obstáculo

```typescript
{
  id: "decision_03",
  titulo: "El primer obstáculo",
  bloque: 1,
  edadMinima: 18,
  edadMaxima: 19,
  categoria: "habitos_disciplina",
  texto: "Llevas meses en tu camino y aparece el primer momento difícil. Algo no está saliendo como esperabas. ¿Qué hacés?",
  opciones: [
    {
      letra: "A", emoji: "💪", titulo: "Seguís — los comienzos siempre son difíciles",
      skillsQueSuben: { disciplina: 2, toleranciaRiesgo: 1 },
      puntosPerfil: { EMP: 2, INV: 1, EMP2: 2, FREE: 2, CRE: 2 },
    },
    {
      letra: "B", emoji: "🔍", titulo: "Buscás información — querés entender si el problema sos vos o el camino",
      skillsQueSuben: { investigacion: 1, adaptabilidad: 1 },
      puntosPerfil: { EMP: 1, INV: 3, EMP2: 1, FREE: 1, CRE: 1 },
    },
    {
      letra: "C", emoji: "🤝", titulo: "Buscás a alguien que ya pasó por esto — pedís consejo",
      skillsQueSuben: { networking: 2, comunicacion: 1 },
      puntosPerfil: { EMP: 2, INV: 1, EMP2: 2, FREE: 1, CRE: 1 },
    },
    {
      letra: "D", emoji: "🚪", titulo: "Cambiás de camino — esto no era lo tuyo",
      skillsQueSuben: { adaptabilidad: 2 },
      puntosPerfil: { EMP: 0, INV: 0, EMP2: 1, FREE: 2, CRE: 1 },
    }
  ]
}
```

### Bloque 2 — Etapa 19-22 años

#### DECISIÓN 4 — La gran apuesta formativa

```typescript
{
  id: "decision_04",
  titulo: "La gran apuesta formativa",
  bloque: 2,
  edadMinima: 19,
  edadMaxima: 21,
  texto: "Aparece una oportunidad de formarte mejor — pero tiene un costo en tiempo, dinero o los dos. ¿Qué hacés?",
  opciones: [
    { letra: "A", emoji: "💰", titulo: "Invertís — pagás el curso, el programa, la certificación",
      skillsQueSuben: { disciplina: 1 }, puntosPerfil: { EMP: 1, INV: 1, EMP2: 1, FREE: 1, CRE: 1 } },
    { letra: "B", emoji: "🆓", titulo: "Buscás la versión gratuita — YouTube, SENA, autodidacta",
      skillsQueSuben: { adaptabilidad: 1 }, puntosPerfil: { EMP: 0, INV: 1, EMP2: 1, FREE: 2, CRE: 2 } },
    { letra: "C", emoji: "🤝", titulo: "Negociás que alguien más pague — empresa, familia, beca",
      skillsQueSuben: { negociacion: 2, networking: 1 }, puntosPerfil: { EMP: 2, INV: 1, EMP2: 1, FREE: 1, CRE: 0 } },
    { letra: "D", emoji: "⏳", titulo: "Lo dejás para después — no es el momento",
      skillsQueSuben: {}, puntosPerfil: { EMP: 0, INV: 0, EMP2: 0, FREE: 0, CRE: 0 } }
  ]
}
```

#### DECISIÓN 5 — El dinero vs el propósito

```typescript
{
  id: "decision_05",
  titulo: "El dinero vs el propósito",
  bloque: 2,
  edadMinima: 20,
  edadMaxima: 22,
  texto: "Te ofrecen algo que paga bien pero no te emociona. Al mismo tiempo hay algo que te apasiona pero paga menos. ¿Qué elegís?",
  opciones: [
    { letra: "A", emoji: "💰", titulo: "El dinero — necesitás la estabilidad primero",
      skillsQueSuben: { finanzasPersonales: 1, disciplina: 1 },
      puntosPerfil: { EMP: 2, INV: 0, EMP2: 0, FREE: 0, CRE: 0 } },
    { letra: "B", emoji: "❤️", titulo: "El propósito — el dinero llega cuando hacés lo que te apasiona",
      skillsQueSuben: { toleranciaRiesgo: 1, marcaPersonal: 1 },
      puntosPerfil: { EMP: 0, INV: 1, EMP2: 2, FREE: 2, CRE: 3 } },
    { letra: "C", emoji: "🤝", titulo: "Negociás — buscás que lo que paga bien también tenga propósito",
      skillsQueSuben: { negociacion: 2, comunicacion: 1 },
      puntosPerfil: { EMP: 1, INV: 1, EMP2: 2, FREE: 2, CRE: 1 } },
    { letra: "D", emoji: "⏳", titulo: "Esperás — ninguna de las dos te convence del todo",
      skillsQueSuben: {},
      puntosPerfil: { EMP: 0, INV: 0, EMP2: 0, FREE: 0, CRE: 0 } }
  ]
}
```

#### DECISIÓN 6 — El primer socio o aliado

```typescript
{
  id: "decision_06",
  titulo: "El primer socio o aliado",
  bloque: 2,
  edadMinima: 20,
  edadMaxima: 22,
  texto: "Alguien quiere trabajar con vos — o querés trabajar con alguien. ¿Cómo manejás esa relación?",
  opciones: [
    { letra: "A", emoji: "🤝", titulo: "Se asocian en igualdad — 50/50",
      skillsQueSuben: { networking: 1, toleranciaRiesgo: 1 },
      puntosPerfil: { EMP: 0, INV: 0, EMP2: 3, FREE: 1, CRE: 1 } },
    { letra: "B", emoji: "👑", titulo: "Liderás vos — el otro apoya",
      skillsQueSuben: { liderazgo: 2 },
      puntosPerfil: { EMP: 2, INV: 0, EMP2: 2, FREE: 0, CRE: 1 } },
    { letra: "C", emoji: "🔍", titulo: "Verificás antes de comprometerte — due diligence",
      skillsQueSuben: { investigacion: 1, negociacion: 1 },
      puntosPerfil: { EMP: 1, INV: 2, EMP2: 1, FREE: 1, CRE: 0 } },
    { letra: "D", emoji: "🚶", titulo: "Preferís solo — más control, menos conflicto",
      skillsQueSuben: { disciplina: 1, toleranciaRiesgo: 1 },
      puntosPerfil: { EMP: 0, INV: 1, EMP2: 1, FREE: 3, CRE: 2 } }
  ]
}
```

#### DECISIÓN 7 — La crisis de identidad

```typescript
{
  id: "decision_07",
  titulo: "La crisis de identidad",
  bloque: 2,
  edadMinima: 21,
  edadMaxima: 23,
  texto: "Llevas años en tu camino y aparece una duda: ¿esto es realmente lo mío? ¿Qué hacés con esa pregunta?",
  opciones: [
    { letra: "A", emoji: "💪", titulo: "La ignorás — toda carrera tiene momentos difíciles",
      skillsQueSuben: { disciplina: 1 }, puntosPerfil: { EMP: 1, INV: 0, EMP2: 1, FREE: 0, CRE: 0 } },
    { letra: "B", emoji: "🔍", titulo: "La investigás — buscás información antes de decidir",
      skillsQueSuben: { investigacion: 2, comunicacionAsertiva: 1 },
      puntosPerfil: { EMP: 1, INV: 3, EMP2: 0, FREE: 1, CRE: 0 } },
    { letra: "C", emoji: "🤝", titulo: "Hablás con alguien que admirás — pedís perspectiva",
      skillsQueSuben: { networking: 1, comunicacion: 1 },
      puntosPerfil: { EMP: 2, INV: 1, EMP2: 1, FREE: 1, CRE: 1 } },
    { letra: "D", emoji: "🔄", titulo: "Cambiás de rumbo — si hay duda hay respuesta",
      skillsQueSuben: { adaptabilidad: 2, toleranciaRiesgo: 1 },
      puntosPerfil: { EMP: 0, INV: 0, EMP2: 1, FREE: 2, CRE: 2 } }
  ]
}
```

### Bloque 3 — Etapa 23-26 años

#### DECISIÓN 8 — Escalar o consolidar

```typescript
{
  id: "decision_08",
  titulo: "Escalar o consolidar",
  bloque: 3, edadMinima: 23, edadMaxima: 25,
  texto: "Lo que construiste está funcionando. ¿Crecés o consolidás lo que tenés?",
  opciones: [
    { letra: "A", emoji: "🚀", titulo: "Escalás — más grande, más rápido",
      skillsQueSuben: { toleranciaRiesgo: 2, gestionEquipos: 1 },
      puntosPerfil: { EMP: 0, INV: 0, EMP2: 3, FREE: 1, CRE: 1 } },
    { letra: "B", emoji: "🏗️", titulo: "Consolidás — hacés mejor lo que ya tenés",
      skillsQueSuben: { disciplina: 1, finanzasPersonales: 1 },
      puntosPerfil: { EMP: 2, INV: 1, EMP2: 0, FREE: 2, CRE: 0 } },
    { letra: "C", emoji: "🌍", titulo: "Buscás nuevos mercados — mismo producto, nueva audiencia",
      skillsQueSuben: { networking: 2, adaptabilidad: 1 },
      puntosPerfil: { EMP: 1, INV: 0, EMP2: 2, FREE: 2, CRE: 2 } },
    { letra: "D", emoji: "🤝", titulo: "Buscás aliados para crecer juntos",
      skillsQueSuben: { negociacion: 1, networking: 1 },
      puntosPerfil: { EMP: 2, INV: 0, EMP2: 2, FREE: 1, CRE: 0 } }
  ]
}
```

#### DECISIÓN 9 — El equipo

```typescript
{
  id: "decision_09",
  titulo: "El equipo",
  bloque: 3, edadMinima: 24, edadMaxima: 26,
  texto: "Ya no podés seguir solo. Necesitás personas que te ayuden a llegar más lejos. ¿Cómo construís tu equipo?",
  opciones: [
    { letra: "A", emoji: "🎯", titulo: "Buscás a alguien mejor que vos en lo que te falta",
      skillsQueSuben: { gestionEquipos: 2, liderazgo: 1 },
      puntosPerfil: { EMP: 2, INV: 1, EMP2: 2, FREE: 1, CRE: 1 } },
    { letra: "B", emoji: "👥", titulo: "Contratás a alguien que ejecute lo que vos definís",
      skillsQueSuben: { liderazgo: 2, gestionProyectos: 1 },
      puntosPerfil: { EMP: 2, INV: 0, EMP2: 2, FREE: 0, CRE: 1 } },
    { letra: "C", emoji: "🤝", titulo: "Buscás un socio — no un empleado",
      skillsQueSuben: { negociacion: 1, toleranciaRiesgo: 1 },
      puntosPerfil: { EMP: 0, INV: 0, EMP2: 3, FREE: 1, CRE: 0 } },
    { letra: "D", emoji: "🚶", titulo: "Seguís solo — preferís el control total",
      skillsQueSuben: { disciplina: 1 },
      puntosPerfil: { EMP: 0, INV: 1, EMP2: 0, FREE: 3, CRE: 1 } }
  ]
}
```

#### DECISIÓN 10 — La internacionalización

```typescript
{
  id: "decision_10",
  titulo: "La internacionalización",
  bloque: 3, edadMinima: 25, edadMaxima: 27,
  texto: "Tu trabajo está llegando a otros países o hay una oportunidad fuera de Colombia. ¿Qué hacés?",
  opciones: [
    { letra: "A", emoji: "🌍", titulo: "Vas — la oportunidad internacional no espera",
      skillsQueSuben: { networking: 2, adaptabilidad: 2, ingles: 1 },
      puntosPerfil: { EMP: 1, INV: 1, EMP2: 2, FREE: 2, CRE: 2 } },
    { letra: "B", emoji: "📱", titulo: "Lo manejás remoto — sin salir de Colombia",
      skillsQueSuben: { adaptabilidad: 1, gestionProyectos: 1 },
      puntosPerfil: { EMP: 2, INV: 1, EMP2: 1, FREE: 2, CRE: 1 } },
    { letra: "C", emoji: "🤝", titulo: "Buscás un aliado local en ese país",
      skillsQueSuben: { networking: 2, negociacion: 1 },
      puntosPerfil: { EMP: 1, INV: 0, EMP2: 2, FREE: 1, CRE: 0 } },
    { letra: "D", emoji: "🙅", titulo: "No es el momento — consolidás primero en Colombia",
      skillsQueSuben: { disciplina: 1, finanzasPersonales: 1 },
      puntosPerfil: { EMP: 2, INV: 0, EMP2: 0, FREE: 1, CRE: 0 } }
  ]
}
```

### Bloque 4 — Etapa 27-30 años

#### DECISIÓN 11 — El legado

```typescript
{
  id: "decision_11",
  titulo: "El legado",
  bloque: 4, edadMinima: 27, edadMaxima: 29,
  texto: "Llevas años construyendo algo. ¿Qué querés que quede cuando ya no estés?",
  opciones: [
    { letra: "A", emoji: "🏗️", titulo: "Construís algo que funciona sin vos",
      skillsQueSuben: { liderazgo: 2, gestionEquipos: 1 },
      puntosPerfil: { EMP: 2, INV: 0, EMP2: 2, FREE: 1, CRE: 0 } },
    { letra: "B", emoji: "🎓", titulo: "Enseñás lo que aprendiste — formás a otros",
      skillsQueSuben: { comunicacion: 2, networking: 1 },
      puntosPerfil: { EMP: 1, INV: 2, EMP2: 0, FREE: 0, CRE: 2 } },
    { letra: "C", emoji: "📈", titulo: "Maximizás ingresos — el legado es la independencia financiera",
      skillsQueSuben: { finanzasPersonales: 2 },
      puntosPerfil: { EMP: 1, INV: 0, EMP2: 2, FREE: 2, CRE: 1 } },
    { letra: "D", emoji: "🌱", titulo: "Impacto social — usás lo construido para ayudar a otros",
      skillsQueSuben: { networking: 1, comunicacionAsertiva: 1 },
      puntosPerfil: { EMP: 2, INV: 2, EMP2: 0, FREE: 0, CRE: 1 } }
  ]
}
```

#### DECISIÓN 12 — La independencia financiera

```typescript
{
  id: "decision_12",
  titulo: "La independencia financiera",
  bloque: 4, edadMinima: 28, edadMaxima: 29,
  texto: "Llevas años generando ingresos. ¿Qué hacés con lo que acumulaste?",
  opciones: [
    { letra: "A", emoji: "📈", titulo: "Invertís — hacés que tu dinero trabaje para vos",
      skillsQueSuben: { finanzasPersonales: 2, toleranciaRiesgo: 1 },
      puntosPerfil: { EMP: 1, INV: 0, EMP2: 2, FREE: 2, CRE: 1 } },
    { letra: "B", emoji: "🏗️", titulo: "Lo reinvertís en tu negocio o carrera",
      skillsQueSuben: { toleranciaRiesgo: 1, gestionProyectos: 1 },
      puntosPerfil: { EMP: 0, INV: 0, EMP2: 3, FREE: 1, CRE: 1 } },
    { letra: "C", emoji: "🏠", titulo: "Activos físicos — finca raíz, propiedades",
      skillsQueSuben: { finanzasPersonales: 1 },
      puntosPerfil: { EMP: 2, INV: 0, EMP2: 1, FREE: 1, CRE: 0 } },
    { letra: "D", emoji: "💰", titulo: "Lo guardás — preferís la seguridad del efectivo",
      skillsQueSuben: {},
      puntosPerfil: { EMP: 1, INV: 0, EMP2: 0, FREE: 1, CRE: 0 } }
  ]
}
```

#### DECISIÓN 13 — La gran oferta

```typescript
{
  id: "decision_13",
  titulo: "La gran oferta",
  bloque: 4, edadMinima: 28, edadMaxima: 30,
  texto: "Llega la oferta más grande de tu vida. Más dinero del que esperabas. Pero algo en las condiciones no te convence del todo.",
  opciones: [
    { letra: "A", emoji: "✅", titulo: "Aceptás — el dinero justifica las condiciones",
      skillsQueSuben: { toleranciaRiesgo: 1, finanzasPersonales: 1 },
      puntosPerfil: { EMP: 1, INV: 0, EMP2: 1, FREE: 1, CRE: 0 } },
    { letra: "B", emoji: "🙅", titulo: "Rechazás — tus condiciones no son negociables",
      skillsQueSuben: { marcaPersonal: 2, disciplina: 1 },
      puntosPerfil: { EMP: 0, INV: 0, EMP2: 1, FREE: 2, CRE: 3 } },
    { letra: "C", emoji: "🔍", titulo: "Verificás antes de decidir — due diligence profundo",
      skillsQueSuben: { investigacion: 1, negociacion: 1 },
      puntosPerfil: { EMP: 1, INV: 2, EMP2: 1, FREE: 1, CRE: 0 } },
    { letra: "D", emoji: "💡", titulo: "Negociás — aceptás pero en tus condiciones",
      skillsQueSuben: { negociacion: 2, comunicacionAsertiva: 1 },
      puntosPerfil: { EMP: 2, INV: 0, EMP2: 2, FREE: 2, CRE: 1 } }
  ]
}
```

#### DECISIÓN 14 — ¿Qué sigue?

```typescript
{
  id: "decision_14",
  titulo: "¿Qué sigue?",
  bloque: 4, edadMinima: 29, edadMaxima: 30,
  texto: "Llegaste a los 30 con algo construido. La pregunta ahora no es cómo llegar — es hacia dónde ir.",
  opciones: [
    { letra: "A", emoji: "🚀", titulo: "Seguís creciendo — la meta es más grande",
      skillsQueSuben: { toleranciaRiesgo: 1, liderazgo: 1 },
      puntosPerfil: { EMP: 1, INV: 0, EMP2: 2, FREE: 1, CRE: 1 } },
    { letra: "B", emoji: "🌱", titulo: "Compartís — usás lo construido para ayudar a otros",
      skillsQueSuben: { comunicacion: 1, networking: 1 },
      puntosPerfil: { EMP: 1, INV: 2, EMP2: 0, FREE: 0, CRE: 2 } },
    { letra: "C", emoji: "⚖️", titulo: "Equilibrás — trabajo y vida en sus proporciones correctas",
      skillsQueSuben: { saludMental: 2, disciplina: 1 },
      puntosPerfil: { EMP: 1, INV: 0, EMP2: 0, FREE: 2, CRE: 1 } },
    { letra: "D", emoji: "🔄", titulo: "Empezás algo nuevo — con todo lo aprendido, otra dirección",
      skillsQueSuben: { adaptabilidad: 2, toleranciaRiesgo: 1 },
      puntosPerfil: { EMP: 0, INV: 0, EMP2: 1, FREE: 2, CRE: 2 } }
  ]
}
```

---

## 8. Banco de Imprevistos

> 12 imprevistos universales — le pueden pasar a cualquier perfil.  
> Aparecen: 70% según perfil dominante + 30% aleatorio.  
> Nunca dos del mismo tipo en años consecutivos.

```typescript
const BANCO_IMPREVISTOS = [
  {
    id: "abuso_poder",
    nombre: "El abuso de poder",
    emoji: "⚠️",
    texto: "Tu jefe, supervisor o socio te pide que 'colaborés' con una suma mensual para mantenerte en el trabajo o conseguir algo que necesitás.",
    perfilesPreferentes: ["EMP", "FREE"],
    edadMinima: 17, edadMaxima: 25, universal: false,
    opciones: [
      { letra: "A", texto: "Pagás — necesitás el trabajo",
        consecuencia: "Ingresos pero sin dignidad. El monto sube el próximo mes.",
        skillsModifica: { disciplina: -1 }, ingresoModifica: -200000 },
      { letra: "B", texto: "Te vas — eso no está bien",
        consecuencia: "Perdés el ingreso pero ganás autorespeto.",
        skillsModifica: { adaptabilidad: 1, networking: 1 }, ingresoModifica: -900000 },
      { letra: "C", texto: "Lo reportás",
        consecuencia: "Proceso largo. Puede costarte el trabajo igual.",
        skillsModifica: { comunicacionAsertiva: 2 }, ingresoModifica: 0 },
      { letra: "D", texto: "Lo ignorás y seguís",
        consecuencia: "El problema no desaparece — regresa más grande.",
        skillsModifica: {}, ingresoModifica: 0 }
    ]
  },
  {
    id: "accidente_enfermedad",
    nombre: "El accidente o enfermedad",
    emoji: "🏥",
    texto: "Vos o alguien cercano enfrenta un problema de salud que para todo temporalmente.",
    perfilesPreferentes: [], universal: true,
    edadMinima: 18, edadMaxima: 28,
    opciones: [
      { letra: "A", texto: "Parás todo y te atendés — la salud primero",
        consecuencia: "Perdés momentum pero te recuperás bien.",
        skillsModifica: { saludMental: 1 }, ingresoModifica: -500000 },
      { letra: "B", texto: "Seguís trabajando aunque no estés bien",
        consecuencia: "A corto plazo funciona. A mediano plazo se complica.",
        skillsModifica: { saludMental: -1 }, ingresoModifica: 0 },
      { letra: "C", texto: "Delegás mientras te recuperás",
        consecuencia: "Aprendés a soltar el control.",
        skillsModifica: { gestionEquipos: 2 }, ingresoModifica: -200000 },
      { letra: "D", texto: "No le decís a nadie y te aguantás",
        consecuencia: "El problema se agrava.",
        skillsModifica: { saludMental: -2 }, ingresoModifica: 0 }
    ]
  },
  {
    id: "trampa_ingles",
    nombre: "La trampa del inglés",
    emoji: "🇬🇧",
    texto: "Una oportunidad grande llega — trabajo, contrato, alianza — pero requiere inglés que no tenés.",
    perfilesPreferentes: ["INV", "EMP", "FREE"],
    edadMinima: 18, edadMaxima: 25, universal: false,
    apareceSiempre: true, // si inglés < 2 entre 18-24
    opciones: [
      { letra: "A", texto: "Vas igual — improvisás en el momento",
        skillsModifica: { ingles: 1, toleranciaRiesgo: 1 }, ingresoModifica: 0 },
      { letra: "B", texto: "Estudiás intensivo antes de ir",
        skillsModifica: { ingles: 2, disciplina: 1 }, ingresoModifica: 0 },
      { letra: "C", texto: "Llevás a alguien que sí sabe inglés",
        skillsModifica: { networking: 1 }, ingresoModifica: -300000 },
      { letra: "D", texto: "Rechazás — no te sentís listo",
        consecuencia: "Costo de oportunidad visible en pesos.",
        skillsModifica: {}, ingresoModifica: 0, mostrarCostoOportunidad: true }
    ]
  },
  {
    id: "error_publico",
    nombre: "El error público",
    emoji: "😳",
    texto: "Cometiste un error que la gente vio — en redes, en el trabajo, con un cliente. Hay consecuencias públicas.",
    perfilesPreferentes: ["CRE", "FREE"],
    edadMinima: 18, edadMaxima: 28, universal: false,
    opciones: [
      { letra: "A", texto: "Lo reconocés públicamente — transparencia total",
        skillsModifica: { marcaPersonal: 2, comunicacion: 1 }, ingresoModifica: 0 },
      { letra: "B", texto: "Verificás primero si el error es real antes de responder",
        skillsModifica: { investigacion: 1 }, ingresoModifica: 0 },
      { letra: "C", texto: "No decís nada — esperás que pase",
        skillsModifica: {}, ingresoModifica: 0 },
      { letra: "D", texto: "Te defendés — sentís que no fue tu culpa",
        skillsModifica: { marcaPersonal: -1 }, ingresoModifica: 0 }
    ]
  },
  {
    id: "te_enganaron",
    nombre: "Te engañaron",
    emoji: "🚨",
    texto: "Alguien en quien confiaste — socio, proveedor, cliente — te engañó. Perdiste tiempo, dinero o los dos.",
    perfilesPreferentes: ["EMP2", "FREE"],
    edadMinima: 19, edadMaxima: 27, universal: false,
    opciones: [
      { letra: "A", texto: "Buscás solución legal o formal",
        skillsModifica: { finanzasPersonales: 1 }, ingresoModifica: -500000 },
      { letra: "B", texto: "Negociás directamente — recuperás lo que podás",
        skillsModifica: { negociacion: 1 }, ingresoModifica: -300000 },
      { letra: "C", texto: "Aceptás la pérdida y aprendés — due diligence siempre",
        skillsModifica: { investigacion: 2 }, ingresoModifica: -1000000 },
      { letra: "D", texto: "Reaccionás con rabia — lo confrontás sin plan",
        skillsModifica: { comunicacion: -1 }, ingresoModifica: -500000 }
    ]
  },
  {
    id: "sobredemanda",
    nombre: "La sobredemanda",
    emoji: "🔥",
    texto: "Tu negocio o trabajo creció más rápido de lo que podés manejar. Tenés más de lo que podés cumplir.",
    perfilesPreferentes: ["FREE", "CRE", "EMP2"],
    edadMinima: 20, edadMaxima: 27, universal: false,
    opciones: [
      { letra: "A", texto: "Buscás ayuda — contratás o delegás",
        skillsModifica: { gestionEquipos: 2 }, ingresoModifica: 500000 },
      { letra: "B", texto: "Lo hacés solo aunque te cueste",
        skillsModifica: { saludMental: -1 }, ingresoModifica: 1000000 },
      { letra: "C", texto: "Decís que no a clientes nuevos — calidad sobre cantidad",
        skillsModifica: { marcaPersonal: 1 }, ingresoModifica: 0 },
      { letra: "D", texto: "Subís precios — menos clientes, mejor pagados",
        skillsModifica: { ventas: 1, marcaPersonal: 1 }, ingresoModifica: 500000 }
    ]
  },
  {
    id: "burnout",
    nombre: "El burnout",
    emoji: "😮‍💨",
    texto: "Llevas meses trabajando sin parar. Tu cuerpo y tu mente empiezan a pasar la cuenta.",
    perfilesPreferentes: [], universal: true,
    edadMinima: 21, edadMaxima: 28,
    opciones: [
      { letra: "A", texto: "Parás — te tomás el tiempo que necesitás",
        skillsModifica: { saludMental: 2 }, ingresoModifica: -500000 },
      { letra: "B", texto: "Seguís con más café — no podés parar ahora",
        skillsModifica: { saludMental: -2 }, ingresoModifica: 0 },
      { letra: "C", texto: "Delegás para aligerar la carga",
        skillsModifica: { gestionEquipos: 2, saludMental: 1 }, ingresoModifica: -300000 },
      { letra: "D", texto: "Cambiás de ritmo — no parás pero bajás la velocidad",
        skillsModifica: { saludMental: 1, disciplina: 1 }, ingresoModifica: -200000 }
    ]
  },
  {
    id: "crisis_economica",
    nombre: "La crisis económica externa",
    emoji: "📉",
    texto: "Algo que no controlás — una crisis, un cambio de mercado — afecta directamente tus ingresos.",
    perfilesPreferentes: [], universal: true,
    edadMinima: 20, edadMaxima: 29,
    opciones: [
      { letra: "A", texto: "Te adaptás — buscás cómo ser útil en el nuevo contexto",
        skillsModifica: { adaptabilidad: 2 }, ingresoModifica: -300000 },
      { letra: "B", texto: "Usás tus ahorros — aguantás hasta que pase",
        skillsModifica: { finanzasPersonales: -1 }, ingresoModifica: -500000 },
      { letra: "C", texto: "Buscás aliados — en crisis es mejor estar acompañado",
        skillsModifica: { networking: 2 }, ingresoModifica: -200000 },
      { letra: "D", texto: "Te paralizás — esperás que vuelva la normalidad",
        skillsModifica: {}, ingresoModifica: -800000 }
    ]
  },
  {
    id: "presion_familiar",
    nombre: "La presión familiar",
    emoji: "👨‍👩‍👧",
    texto: "Tu familia no entiende o no apoya el camino que elegiste. Hay tensión en casa.",
    perfilesPreferentes: ["EMP2", "CRE", "FREE"],
    edadMinima: 17, edadMaxima: 22, universal: false,
    opciones: [
      { letra: "A", texto: "Les mostrás los números — la evidencia habla",
        skillsModifica: { comunicacion: 2 }, ingresoModifica: 0 },
      { letra: "B", texto: "Seguís solo — no necesitás su aprobación",
        skillsModifica: { toleranciaRiesgo: 1 }, ingresoModifica: 0 },
      { letra: "C", texto: "Buscás un punto medio — les das seguridad mientras construís",
        skillsModifica: { disciplina: 1 }, ingresoModifica: 0 },
      { letra: "D", texto: "Cedés — elegís lo que ellos quieren",
        consecuencia: "Sin conflicto familiar. Posible insatisfacción a largo plazo.",
        skillsModifica: {}, ingresoModifica: 300000, alertaGenerada: "barrera_familiar" }
    ]
  },
  {
    id: "crisis_confianza",
    nombre: "La crisis de confianza",
    emoji: "😔",
    texto: "Cometiste un error grande o alguien hizo que pareciera que lo cometiste. Tu reputación está en juego.",
    perfilesPreferentes: ["CRE", "EMP"],
    edadMinima: 20, edadMaxima: 28, universal: false,
    opciones: [
      { letra: "A", texto: "Enfrentás la situación públicamente — con evidencia y calma",
        skillsModifica: { comunicacionAsertiva: 2 }, ingresoModifica: 0 },
      { letra: "B", texto: "Investigás qué pasó exactamente antes de hablar",
        skillsModifica: { investigacion: 1 }, ingresoModifica: 0 },
      { letra: "C", texto: "Buscás aliados que den fe de tu reputación",
        skillsModifica: { networking: 2 }, ingresoModifica: 0 },
      { letra: "D", texto: "Esperás en silencio a que pase",
        skillsModifica: {}, ingresoModifica: -300000 }
    ]
  },
  {
    id: "oportunidad_trampa",
    nombre: "La oportunidad trampa",
    emoji: "⚡",
    texto: "Te ofrecen algo que parece increíble — demasiado bueno para ser verdad. Mucha plata, poco esfuerzo, urgencia para decidir.",
    perfilesPreferentes: [], universal: true,
    edadMinima: 19, edadMaxima: 28,
    opciones: [
      { letra: "A", texto: "Investigás antes de comprometerte",
        skillsModifica: { investigacion: 2 }, ingresoModifica: 0 },
      { letra: "B", texto: "Aceptás — la oportunidad no espera",
        consecuencia: "Puede ser real o puede ser estafa. 50/50.",
        skillsModifica: { toleranciaRiesgo: 1 }, ingresoModifica: 0, resultado: "aleatorio" },
      { letra: "C", texto: "Consultás con alguien de confianza antes",
        skillsModifica: { networking: 1 }, ingresoModifica: 0 },
      { letra: "D", texto: "Rechazás — si parece demasiado bueno algo está mal",
        skillsModifica: {}, ingresoModifica: 0 }
    ]
  },
  {
    id: "cambio_reglas",
    nombre: "El cambio de reglas",
    emoji: "📋",
    texto: "Las condiciones del trabajo, negocio o mercado cambian sin avisarte — nuevas leyes, nuevo jefe, nueva política.",
    perfilesPreferentes: ["EMP", "INV"],
    edadMinima: 20, edadMaxima: 28, universal: false,
    opciones: [
      { letra: "A", texto: "Te adaptás — buscás cómo funcionar en el nuevo contexto",
        skillsModifica: { adaptabilidad: 2 }, ingresoModifica: 0 },
      { letra: "B", texto: "Negociás — buscás que las nuevas reglas te afecten menos",
        skillsModifica: { negociacion: 1 }, ingresoModifica: 0 },
      { letra: "C", texto: "Te vas — esas no son las reglas bajo las que querés trabajar",
        skillsModifica: { adaptabilidad: 1 }, ingresoModifica: -500000 },
      { letra: "D", texto: "Lo aceptás sin cuestionar — necesitás la estabilidad",
        skillsModifica: {}, ingresoModifica: 0 }
    ]
  }
];
```

---

## 9. Banco de Oportunidades

> 15 oportunidades — algunas según perfil, otras aleatorias.  
> La Oportunidad 15 solo aparece entre años 27-30.  
> Rechazar una oportunidad no la elimina — vuelve 2 años después con condiciones diferentes.

```typescript
const BANCO_OPORTUNIDADES = [
  {
    id: "contacto_inesperado",
    nombre: "El contacto inesperado",
    emoji: "📩",
    texto: "Alguien que admirás o que tiene más experiencia que vos te escribe o te busca. No esperabas ese contacto.",
    perfilesPreferentes: [], universal: true, apareceDespuesDe: "logro_visible",
    opciones: [
      { letra: "A", texto: "Respondés rápido y proponés reunión",
        skillsModifica: { networking: 2 } },
      { letra: "B", texto: "Investigás quién es antes de responder",
        skillsModifica: { networking: 1, investigacion: 1 } },
      { letra: "C", texto: "Lo dejás para después — no tenés tiempo ahora",
        skillsModifica: {}, ventanaSeCierra: true },
      { letra: "D", texto: "No respondés — desconfiás",
        skillsModifica: {}, ventanaSeCierra: true }
    ]
  },
  {
    id: "reconocimiento_publico",
    nombre: "El reconocimiento público",
    emoji: "🏆",
    texto: "Alguien habla bien de vos en público — en redes, en un evento, con personas influyentes.",
    perfilesPreferentes: ["CRE", "INV"], universal: false,
    opciones: [
      { letra: "A", texto: "Lo aprovechás — publicás, te movés, aprovechás el momentum",
        skillsModifica: { marcaPersonal: 2, networking: 1 } },
      { letra: "B", texto: "Lo agradecés pero seguís con tu ritmo",
        skillsModifica: { marcaPersonal: 1 } },
      { letra: "C", texto: "No hacés nada — te da pena el protagonismo",
        skillsModifica: {} },
      { letra: "D", texto: "Lo usás para abrir una conversación específica",
        skillsModifica: { networking: 2 } }
    ]
  },
  {
    id: "beca_subsidio",
    nombre: "La beca o el subsidio",
    emoji: "🎓",
    texto: "Aparece una oportunidad de formación gratuita o subsidiada que normalmente costaría mucho.",
    perfilesPreferentes: ["INV", "EMP"], universal: false, edadMaxima: 24,
    opciones: [
      { letra: "A", texto: "Aplicás inmediatamente",
        skillsModifica: { disciplina: 1 } },
      { letra: "B", texto: "Investigás si realmente vale la pena antes de aplicar",
        skillsModifica: { investigacion: 1 } },
      { letra: "C", texto: "Lo dejás para después — el plazo cierra",
        skillsModifica: {}, ventanaSeCierra: true },
      { letra: "D", texto: "No aplicás — no tenés tiempo",
        skillsModifica: {}, ventanaSeCierra: true }
    ]
  },
  {
    id: "mentor_inesperado",
    nombre: "El mentor inesperado",
    emoji: "🧭",
    texto: "Alguien con mucha más experiencia que vos muestra interés genuino en ayudarte — sin pedir nada a cambio.",
    perfilesPreferentes: [], universal: true, apareceCuando: "perfil_consolidado",
    opciones: [
      { letra: "A", texto: "Aceptás — la experiencia ajena es el atajo más honesto",
        resultado: "mentor_activado" },
      { letra: "B", texto: "Aceptás con cautela — querés entender sus motivaciones primero",
        resultado: "mentor_activado_lento" },
      { letra: "C", texto: "Rechazás — preferís aprender solo",
        skillsModifica: {}, ventanaSeCierra: true },
      { letra: "D", texto: "Lo dejás para después",
        skillsModifica: {}, ventanaSeCierra: true }
    ]
  },
  {
    id: "proyecto_grande",
    nombre: "El proyecto grande",
    emoji: "🚀",
    texto: "Te ofrecen participar en algo significativamente más grande que lo que manejaste hasta ahora.",
    perfilesPreferentes: ["EMP2", "EMP", "INV"], universal: false,
    opciones: [
      { letra: "A", texto: "Aceptás sin dudar — los saltos grandes requieren valentía",
        skillsModifica: { liderazgo: 2, toleranciaRiesgo: 1 } },
      { letra: "B", texto: "Aceptás pero pedís apoyo — no vas solo",
        skillsModifica: { networking: 1, gestionEquipos: 1 } },
      { letra: "C", texto: "Pedís tiempo para prepararte antes de comprometerte",
        skillsModifica: { disciplina: 1 } },
      { letra: "D", texto: "Rechazás — no te sentís listo",
        skillsModifica: {}, ventanaSeCierra: true, mostrarCostoOportunidad: true }
    ]
  },
  {
    id: "alianza_estrategica",
    nombre: "La alianza estratégica",
    emoji: "🤝",
    texto: "Alguien con recursos complementarios a los tuyos propone trabajar juntos.",
    perfilesPreferentes: ["EMP2", "FREE"], universal: false,
    opciones: [
      { letra: "A", texto: "Aceptás — la complementariedad multiplica",
        skillsModifica: { networking: 2 } },
      { letra: "B", texto: "Hacés due diligence primero",
        skillsModifica: { investigacion: 2 } },
      { letra: "C", texto: "Proponés condiciones claras antes de arrancar",
        skillsModifica: { negociacion: 2 } },
      { letra: "D", texto: "Rechazás — preferís seguir solo",
        skillsModifica: {} }
    ]
  },
  {
    id: "exposicion_internacional",
    nombre: "La exposición internacional",
    emoji: "🌍",
    texto: "Tu trabajo llega a alguien fuera de Colombia — una persona, empresa o institución de otro país muestra interés.",
    perfilesPreferentes: ["INV", "CRE", "FREE"], universal: false,
    opciones: [
      { letra: "A", texto: "Lo perseguís activamente — respondés, proponés, avanzás",
        skillsModifica: { networking: 2, ingles: 1, marcaPersonal: 1 } },
      { letra: "B", texto: "Buscás a alguien que te ayude a manejarlo",
        skillsModifica: { networking: 1 } },
      { letra: "C", texto: "Te preparás primero — especialmente el inglés",
        skillsModifica: { ingles: 2 } },
      { letra: "D", texto: "Lo dejás pasar — no te sentís listo para lo internacional",
        skillsModifica: {}, ventanaSeCierra: true, mostrarCostoOportunidad: true }
    ]
  },
  {
    id: "recurso_inesperado",
    nombre: "El recurso inesperado",
    emoji: "💰",
    texto: "Llega dinero, tiempo o un recurso que no esperabas — un bono, un premio, un ahorro que se liberó.",
    perfilesPreferentes: [], universal: true,
    opciones: [
      { letra: "A", texto: "Lo invertís en tu desarrollo — curso, herramienta, certificación",
        skillsModifica: { disciplina: 1 } },
      { letra: "B", texto: "Lo invertís en tu proyecto o negocio",
        skillsModifica: { toleranciaRiesgo: 1 }, ingresoModifica: 500000 },
      { letra: "C", texto: "Lo guardás — preferís tener respaldo",
        skillsModifica: { finanzasPersonales: 1 } },
      { letra: "D", texto: "Lo disfrutás — te lo merecés",
        skillsModifica: { saludMental: 1 } }
    ]
  },
  {
    id: "referido_poderoso",
    nombre: "El referido poderoso",
    emoji: "📣",
    texto: "Alguien de tu red te recomienda con una persona o institución importante. Llegan por vos sin que hayas hecho nada.",
    perfilesPreferentes: [], universal: true, apareceDespuesDe: "red_construida",
    opciones: [
      { letra: "A", texto: "Lo aprovechás inmediatamente",
        skillsModifica: { networking: 1, ventas: 1 } },
      { letra: "B", texto: "Investigás antes de reunirte",
        skillsModifica: { investigacion: 1 } },
      { letra: "C", texto: "Agradecés al que te recomendó primero",
        skillsModifica: { networking: 2 } },
      { letra: "D", texto: "Lo dejás para después",
        skillsModifica: {}, ventanaSeCierra: true }
    ]
  },
  {
    id: "reconocimiento_institucional",
    nombre: "El reconocimiento institucional",
    emoji: "🏛️",
    texto: "Una institución — universidad, empresa, gobierno — reconoce formalmente tu trabajo o te invita a participar en algo oficial.",
    perfilesPreferentes: ["INV", "EMP"], universal: false,
    opciones: [
      { letra: "A", texto: "Aceptás — la validación institucional abre puertas",
        skillsModifica: { networking: 2, marcaPersonal: 1 } },
      { letra: "B", texto: "Proponés algo más — si te invitan es porque te necesitan",
        skillsModifica: { negociacion: 1 } },
      { letra: "C", texto: "Investigás qué implica antes de comprometerte",
        skillsModifica: { investigacion: 1 } },
      { letra: "D", texto: "Rechazás — no te interesa la validación externa",
        skillsModifica: {} }
    ]
  },
  {
    id: "segundo_intento",
    nombre: "El segundo intento",
    emoji: "🔄",
    texto: "Algo que rechazaste o perdiste antes vuelve a aparecer — una oportunidad que creías cerrada regresa.",
    perfilesPreferentes: [], universal: true, soloSiRechazoAntes: true,
    opciones: [
      { letra: "A", texto: "Aceptás esta vez — aprendiste la lección",
        skillsModifica: {}, medallaSecretaPosible: "segunda_vida" },
      { letra: "B", texto: "Evaluás si las condiciones cambiaron antes de decidir",
        skillsModifica: { investigacion: 1 } },
      { letra: "C", texto: "Negociás mejor esta vez — tenés más experiencia",
        skillsModifica: { negociacion: 2 } },
      { letra: "D", texto: "Rechazás de nuevo — tu posición no cambió",
        skillsModifica: {}, ventanaSeCierra: true }
    ]
  },
  {
    id: "cliente_aliado_sonado",
    nombre: "El cliente o aliado soñado",
    emoji: "⭐",
    texto: "Aparece la persona, empresa o institución con la que siempre quisiste trabajar — y muestran interés genuino en vos.",
    perfilesPreferentes: ["EMP2", "FREE", "CRE"], universal: false,
    opciones: [
      { letra: "A", texto: "Te lanzás — preparado o no",
        skillsModifica: { ventas: 1, toleranciaRiesgo: 1 } },
      { letra: "B", texto: "Te preparás intensamente antes de la reunión",
        skillsModifica: { disciplina: 2 } },
      { letra: "C", texto: "Buscás a alguien que te conecte mejor con ellos",
        skillsModifica: { networking: 2 } },
      { letra: "D", texto: "Esperás a estar más listo",
        skillsModifica: {}, ventanaSeCierra: true }
    ]
  },
  {
    id: "plataforma_medio",
    nombre: "La plataforma o el medio",
    emoji: "📢",
    texto: "Un medio, plataforma o espacio con audiencia grande quiere darte visibilidad — una entrevista, un artículo, una invitación a hablar.",
    perfilesPreferentes: ["CRE", "INV"], universal: false,
    opciones: [
      { letra: "A", texto: "Aceptás — la visibilidad construye marca",
        skillsModifica: { marcaPersonal: 2, networking: 1 } },
      { letra: "B", texto: "Preparás muy bien lo que vas a decir antes",
        skillsModifica: { comunicacion: 2 } },
      { letra: "C", texto: "Proponés algo más específico — tenés algo concreto que compartir",
        skillsModifica: { comunicacionAsertiva: 1 } },
      { letra: "D", texto: "Rechazás — te da pena o miedo la exposición",
        skillsModifica: {}, ventanaSeCierra: true }
    ]
  },
  {
    id: "upgrade_skills",
    nombre: "El upgrade de skills",
    emoji: "📈",
    texto: "Aparece la posibilidad de subir un nivel en algo que ya sabés hacer — no aprender desde cero sino llevar algo bueno a excelente.",
    perfilesPreferentes: [], universal: true, apareceCuando: "skill_en_nivel_3_4",
    opciones: [
      { letra: "A", texto: "La tomás — siempre hay un siguiente nivel",
        skillsModifica: { disciplina: 1 } },
      { letra: "B", texto: "Evaluás si es el momento correcto",
        skillsModifica: { investigacion: 1 } },
      { letra: "C", texto: "Proponés hacer algo con esa skill mejorada inmediatamente",
        skillsModifica: { ventas: 1 } },
      { letra: "D", texto: "Lo dejás para después",
        skillsModifica: {} }
    ]
  },
  {
    id: "cierre_circulo",
    nombre: "El cierre del círculo",
    emoji: "⭕",
    texto: "Algo que empezaste hace años — una idea, un proyecto, una relación — regresa y cobra sentido de una forma que no esperabas.",
    perfilesPreferentes: [], universal: true,
    edadMinima: 27, edadMaxima: 30, // Solo aparece en los últimos años
    opciones: [
      { letra: "A", texto: "Lo retomás — ahora tenés lo que antes no tenías",
        skillsModifica: {}, medallaSecretaPosible: "segunda_vida" },
      { letra: "B", texto: "Lo reencuadrás — no lo retomás igual sino evolucionado",
        skillsModifica: { adaptabilidad: 2 } },
      { letra: "C", texto: "Lo compartís con alguien que puede hacerlo mejor que vos",
        skillsModifica: { networking: 1 } },
      { letra: "D", texto: "Lo dejás ir — ese capítulo ya cerró",
        skillsModifica: {} }
    ]
  }
];
```

---

## 10. Sistema de Mentores

> Solo un mentor activo a la vez.  
> Si el jugador rechaza al mentor, desaparece por 3 años.  
> Don Jairo tiene prioridad si el jugador lleva 2+ imprevistos negativos seguidos.

```typescript
const MENTORES = [
  {
    id: "andrea",
    nombre: "Andrea",
    emoji: "🚀",
    perfil: "Emprendedora — fundadora de marca con presencia en 4 países",
    apareceCuando: {
      perfilDominante: "EMP2",
      condicion: "sobrevivio_fracaso_o_cambio_ruta"
    },
    mision: "Antes de terminar este año necesitás tres cosas: un sistema de costos real, un precio que sostenga el crecimiento y una proyección de cuánto podés vender el próximo año sin quebrarte.",
    recompensaCompletada: { skillsModifica: { finanzasPersonales: 2, gestionProyectos: 1 } }
  },
  {
    id: "carlos",
    nombre: "Carlos",
    emoji: "👔",
    perfil: "Gerente general — 25 años en empresas, vivió en 7 países",
    apareceCuando: {
      perfilDominante: "EMP",
      condicion: "lleva_2_anios_mismo_trabajo"
    },
    mision: "En los próximos 6 meses tomá al menos 3 decisiones grandes consultando a tu equipo antes de decidir — no después. Y vení a contarme cómo te fue.",
    recompensaCompletada: { skillsModifica: { liderazgo: 2, comunicacion: 2 } }
  },
  {
    id: "valentina",
    nombre: "Valentina",
    emoji: "🔬",
    perfil: "Investigadora — PhD en universidad internacional, trabaja en políticas públicas",
    apareceCuando: {
      perfilDominante: "INV",
      condicion: "invirtio_en_skills_investigacion_2_anios"
    },
    mision: "Este año publicá un paper o un informe con los resultados de tu investigación. No lo respondas — solo definilo bien y encontrá a alguien que te ayude a formalizarlo.",
    recompensaCompletada: { skillsModifica: { investigacion: 2, comunicacion: 2 } }
  },
  {
    id: "sebastian",
    nombre: "Sebastián",
    emoji: "💻",
    perfil: "Diseñador UX freelance — trabaja desde Medellín para empresas en Europa",
    apareceCuando: {
      perfilDominante: "FREE",
      condicion: "tiene_al_menos_1_cliente_propio"
    },
    mision: "Subí tus precios un 80% en el próximo mes. Si perdés clientes, los precios estaban bien. Si no los perdés — acabás de doblar tus ingresos sin hacer nada diferente.",
    recompensaCompletada: { skillsModifica: { ventas: 2, marcaPersonal: 2 } }
  },
  {
    id: "luna",
    nombre: "Luna",
    emoji: "🎥",
    perfil: "Creadora de contenido educativo — 2M de seguidores",
    apareceCuando: {
      perfilDominante: "CRE",
      condicion: "tiene_contenido_publicado_o_audiencia_creciente"
    },
    mision: "Este año creá un formato de contenido propio — una serie que puedas producir cada semana sin depender de nada externo. Que sea tuyo. Que funcione aunque no pase nada.",
    recompensaCompletada: { skillsModifica: { produccionContenido: 1, marcaPersonal: 2, distribucionDigital: 1 } }
  },
  {
    id: "don_jairo",
    nombre: "Don Jairo",
    emoji: "🧓",
    perfil: "Técnico universal — lleva 22 años resolviendo lo que otros no pueden",
    apareceCuando: {
      perfilDominante: "cualquiera",
      condicion: "2_imprevistos_negativos_seguidos_o_ingreso_bajo_2_anios",
      prioridad: true
    },
    mision: "Hacé lo mismo que rechazaste hace poco. Pero ahora con rabia — que es mejor combustible que la calma.",
    recompensaCompletada: { skillsModifica: { disciplina: 1, adaptabilidad: 1 } }
  }
];
```

---

## 11. Sistema de Skills

> 27 skills organizadas en transversales (todos) y por perfil.  
> Niveles 1-5. Solo suben — nunca bajan (excepción: salud mental en burnout).  
> Nivel 5 = máximo desbloqueado.

### Skills transversales (7)

```typescript
const SKILLS_TRANSVERSALES = [
  { id: "ingles", nombre: "Inglés", emoji: "🇬🇧", descripcion: "Comunicación en inglés técnico y profesional" },
  { id: "comunicacion", nombre: "Comunicación", emoji: "💬", descripcion: "Expresar ideas con claridad y persuasión" },
  { id: "finanzasPersonales", nombre: "Finanzas personales", emoji: "💰", descripcion: "Administrar ingresos, gastos e inversiones" },
  { id: "saludMental", nombre: "Salud mental", emoji: "🧘", descripcion: "Gestión emocional y bienestar psicológico" },
  { id: "disciplina", nombre: "Disciplina", emoji: "⚡", descripcion: "Consistencia y cumplimiento de compromisos" },
  { id: "networking", nombre: "Networking", emoji: "🤝", descripcion: "Construir y mantener relaciones profesionales" },
  { id: "adaptabilidad", nombre: "Adaptabilidad", emoji: "🔄", descripcion: "Responder bien a los cambios e imprevistos" }
];
```

### Skills por perfil (4 por perfil = 20 total)

```typescript
const SKILLS_PERFIL = {
  EMP2: [ // Emprendedor
    { id: "ventas", nombre: "Ventas", emoji: "💼" },
    { id: "marketingDigital", nombre: "Marketing digital", emoji: "📱" },
    { id: "gestionEquipos", nombre: "Gestión de equipos", emoji: "👥" },
    { id: "toleranciaRiesgo", nombre: "Tolerancia al riesgo", emoji: "🎯" }
  ],
  EMP: [ // Empleado/Operador
    { id: "trabajoEquipo", nombre: "Trabajo en equipo", emoji: "🤝" },
    { id: "negociacion", nombre: "Negociación", emoji: "⚖️" },
    { id: "gestionProyectos", nombre: "Gestión de proyectos", emoji: "📋" },
    { id: "presentaciones", nombre: "Presentaciones", emoji: "🎤" }
  ],
  FREE: [ // Freelancer / Técnico-Creador
    { id: "programacion", nombre: "Programación", emoji: "💻" },
    { id: "diseno", nombre: "Diseño", emoji: "🎨" },
    { id: "analisisDatos", nombre: "Análisis de datos", emoji: "📊" },
    { id: "produccionContenido", nombre: "Producción de contenido", emoji: "🎬" }
  ],
  INV: [ // Investigador / Salud-Social
    { id: "empatiaClinica", nombre: "Empatía clínica", emoji: "❤️" },
    { id: "investigacion", nombre: "Investigación", emoji: "🔬" },
    { id: "comunicacionAsertiva", nombre: "Comunicación asertiva", emoji: "💬" },
    { id: "tecnologiaMedica", nombre: "Tecnología médica", emoji: "🏥" }
  ],
  CRE: [ // Creador de contenidos
    { id: "narrativa", nombre: "Narrativa", emoji: "📖" },
    { id: "marcaPersonal", nombre: "Marca personal", emoji: "⭐" },
    { id: "produccionAudiovisual", nombre: "Producción audiovisual", emoji: "🎥" },
    { id: "distribucionDigital", nombre: "Distribución digital", emoji: "📡" }
  ],
  liderazgo: { id: "liderazgo", nombre: "Liderazgo", emoji: "🏆" } // cross-perfil
};
```

---

## 12. Sistema de Medallas

```typescript
const MEDALLAS = [
  // BRONCE
  { id: "la_chispa", nombre: "La Chispa", emoji: "⚡", nivel: "bronce",
    condicion: "Primera decisión de carrera tomada", secreta: false },
  { id: "primer_peso", nombre: "Primer Peso", emoji: "💵", nivel: "bronce",
    condicion: "Primer ingreso generado en el juego", secreta: false },
  { id: "el_arranque", nombre: "El Arranque", emoji: "🔥", nivel: "bronce",
    condicion: "Completa el onboarding sin abandonar", secreta: false },
  { id: "curioso", nombre: "Curioso", emoji: "🔍", nivel: "bronce",
    condicion: "Toca el popup de detalle en 5 decisiones seguidas", secreta: false },
  { id: "el_observador", nombre: "El Observador", emoji: "👁️", nivel: "bronce", secreta: true,
    condicion: "Toca TODOS los popups de detalle antes de elegir en una misma decisión" },

  // PLATA
  { id: "sobreviviente", nombre: "Sobreviviente", emoji: "💪", nivel: "plata",
    condicion: "Supera su primer imprevisto", secreta: false },
  { id: "antifragil", nombre: "Antifrágil", emoji: "🛡️", nivel: "plata",
    condicion: "Supera 3 imprevistos seguidos sin bajar ingreso", secreta: false },
  { id: "inversor", nombre: "Inversor", emoji: "📈", nivel: "plata",
    condicion: "Invierte en 3 skills diferentes en una partida", secreta: false },
  { id: "contra_corriente", nombre: "Contra la corriente", emoji: "🌊", nivel: "plata", secreta: true,
    condicion: "Elige la opción menos popular en 5 decisiones seguidas" },

  // ORO
  { id: "red_de_oro", nombre: "Red de Oro", emoji: "🤝", nivel: "oro",
    condicion: "Completa la misión de un mentor", secreta: false },
  { id: "bilingue", nombre: "Bilingüe", emoji: "🇬🇧", nivel: "oro",
    condicion: "Sube inglés a nivel 3", secreta: false },
  { id: "modo_enfoque", nombre: "Modo Enfoque", emoji: "🎯", nivel: "oro",
    condicion: "Sube cualquier skill al nivel 5", secreta: false },
  { id: "el_mentor_oculto", nombre: "El Mentor Oculto", emoji: "🎭", nivel: "oro", secreta: true,
    condicion: "Completa misiones de 3 mentores distintos en una partida" },

  // PLATINO
  { id: "el_estratega", nombre: "El Estratega", emoji: "🏆", nivel: "platino",
    condicion: "Completa una ruta sin cambiarla nunca", secreta: false },
  { id: "segunda_vida", nombre: "Segunda Vida", emoji: "🔄", nivel: "platino", secreta: true,
    condicion: "Llega al año 30 con perfil completamente distinto al de su primera partida" },

  // GOAT
  { id: "goat_mode", nombre: "GOAT MODE", emoji: "🐐", nivel: "goat",
    condicion: "Independencia financiera antes de los 30 + inglés nivel 4+", secreta: false }
];
```

---

## 13. Sistema de Perfilamiento

### Tabla de puntos — Onboarding

```typescript
const PUNTOS_ONBOARDING: Record<string, Record<string, Record<string, number>>> = {
  pregunta_1: { // Viernes en la tarde
    A: { EMP: 0, INV: 0, EMP2: 1, FREE: 2, CRE: 3 },
    B: { EMP: 2, INV: 0, EMP2: 2, FREE: 0, CRE: 1 },
    C: { EMP: 0, INV: 3, EMP2: 1, FREE: 1, CRE: 0 },
    D: { EMP: 0, INV: 0, EMP2: 3, FREE: 1, CRE: 1 },
    E: { EMP: 1, INV: 3, EMP2: 0, FREE: 1, CRE: 0 },
    F: { EMP: 0, INV: 0, EMP2: 0, FREE: 1, CRE: 3 }
  },
  pregunta_2: { // Proyecto libre
    A: { EMP: 0, INV: 0, EMP2: 1, FREE: 2, CRE: 3 },
    B: { EMP: 0, INV: 3, EMP2: 0, FREE: 0, CRE: 1 },
    C: { EMP: 1, INV: 2, EMP2: 2, FREE: 0, CRE: 0 },
    D: { EMP: 1, INV: 0, EMP2: 3, FREE: 1, CRE: 0 },
    E: { EMP: 2, INV: 0, EMP2: 1, FREE: 2, CRE: 0 },
    F: { EMP: 0, INV: 0, EMP2: 0, FREE: 0, CRE: 0 } // alerta troll
  },
  pregunta_3: { // Trabajo en grupo
    A: { EMP: 3, INV: 0, EMP2: 1, FREE: 0, CRE: 0 },
    B: { EMP: 2, INV: 0, EMP2: 2, FREE: 0, CRE: 1 },
    C: { EMP: 1, INV: 3, EMP2: 0, FREE: 1, CRE: 0 },
    D: { EMP: 0, INV: 0, EMP2: 1, FREE: 2, CRE: 3 },
    E: { EMP: 2, INV: 1, EMP2: 0, FREE: 2, CRE: 0 },
    F: { EMP: 0, INV: 0, EMP2: 0, FREE: 0, CRE: 0 } // alerta
  },
  pregunta_4: { // Crítica
    A: { EMP: 2, INV: 3, EMP2: 1, FREE: 1, CRE: 1 },
    B: { EMP: 0, INV: 0, EMP2: 2, FREE: 1, CRE: 2 },
    C: { EMP: 1, INV: 0, EMP2: 2, FREE: 1, CRE: 1 },
    D: { EMP: 2, INV: 1, EMP2: 0, FREE: 1, CRE: 0 },
    E: { EMP: 0, INV: 0, EMP2: 0, FREE: 0, CRE: 0 }, // alerta
    F: { EMP: 0, INV: 0, EMP2: 0, FREE: 0, CRE: 0 } // alerta troll
  },
  pregunta_5: { // Orgullo
    A: { EMP: 2, INV: 3, EMP2: 1, FREE: 1, CRE: 2 },
    B: { EMP: 3, INV: 2, EMP2: 0, FREE: 0, CRE: 1 },
    C: { EMP: 1, INV: 0, EMP2: 3, FREE: 2, CRE: 1 },
    D: { EMP: 1, INV: 2, EMP2: 1, FREE: 2, CRE: 1 },
    E: { EMP: 2, INV: 0, EMP2: 3, FREE: 1, CRE: 0 },
    F: { EMP: 0, INV: 0, EMP2: 1, FREE: 2, CRE: 3 }
  },
  pregunta_6: { // Fracaso
    A: { EMP: 0, INV: 1, EMP2: 3, FREE: 2, CRE: 2 },
    B: { EMP: 2, INV: 1, EMP2: 2, FREE: 1, CRE: 0 },
    C: { EMP: 1, INV: 2, EMP2: 1, FREE: 2, CRE: 1 },
    D: { EMP: 3, INV: 0, EMP2: 0, FREE: 0, CRE: 0 },
    E: { EMP: 0, INV: 2, EMP2: 1, FREE: 1, CRE: 3 },
    F: { EMP: 0, INV: 0, EMP2: 0, FREE: 0, CRE: 0 } // alerta
  },
  pregunta_7: { // Aprendizaje
    A: { EMP: 0, INV: 0, EMP2: 1, FREE: 2, CRE: 3 },
    B: { EMP: 2, INV: 3, EMP2: 0, FREE: 1, CRE: 0 },
    C: { EMP: 1, INV: 0, EMP2: 2, FREE: 3, CRE: 2 },
    D: { EMP: 2, INV: 1, EMP2: 1, FREE: 1, CRE: 2 },
    E: { EMP: 3, INV: 2, EMP2: 1, FREE: 1, CRE: 0 },
    F: { EMP: 1, INV: 3, EMP2: 0, FREE: 1, CRE: 0 }
  },
  pregunta_8: { // Semana libre
    A: { EMP: 0, INV: 1, EMP2: 1, FREE: 2, CRE: 3 },
    B: { EMP: 2, INV: 3, EMP2: 0, FREE: 1, CRE: 0 },
    C: { EMP: 2, INV: 0, EMP2: 2, FREE: 1, CRE: 1 },
    D: { EMP: 1, INV: 2, EMP2: 1, FREE: 2, CRE: 1 },
    E: { EMP: 0, INV: 0, EMP2: 0, FREE: 0, CRE: 0 }, // neutral
    F: { EMP: 0, INV: 0, EMP2: 2, FREE: 2, CRE: 1 }
  }
};
```

### Cálculo del perfil

```typescript
function calcularPerfil(puntos: Record<string, number>): {
  dominante: string;
  secundario: string | null;
  esMixto: boolean;
} {
  const ordenado = Object.entries(puntos).sort(([,a], [,b]) => b - a);
  const dominante = ordenado[0][0];
  const segundoPuntaje = ordenado[1][1];
  const primerPuntaje = ordenado[0][1];
  const diferencia = primerPuntaje - segundoPuntaje;

  return {
    dominante,
    secundario: diferencia < 30 ? ordenado[1][0] : null,
    esMixto: diferencia < 15
  };
}
```

### Alertas automáticas

```typescript
function generarAlertas(partida: EstadoPartida): string[] {
  const alertas: string[] = [];

  // Alta empleabilidad
  if (partida.puntos.EMP > 40 && partida.skills.disciplina >= 3) {
    alertas.push("alta_empleabilidad");
  }

  // Emprendedor sólido
  if (partida.puntos.EMP2 > 40 && partida.skills.toleranciaRiesgo >= 3) {
    alertas.push("emprendedor_solido");
  }

  // Perfil para beca
  if (calcularPerfilMayor(partida.puntos) && partida.jugador.trabaja === "no" &&
      (partida.jugador.contexto === "solo_mama" || partida.jugador.contexto === "otros_familiares")) {
    alertas.push("perfil_beca");
  }

  // Perfil en riesgo
  if (partida.patronTroll || partida.aniosEstancado >= 3) {
    alertas.push("perfil_riesgo");
  }

  // Explorador vocacional
  const cambiosRuta = contarCambiosRuta(partida.decisiones);
  if (cambiosRuta >= 3) {
    alertas.push("explorador_vocacional");
  }

  // Barrera económica
  const rechazosInversion = contarRechazosInversion(partida.decisiones);
  if (rechazosInversion >= 3) {
    alertas.push("barrera_economica");
  }

  // Barrera familiar
  if (partida.decisiones.some(d => d.alertaGenerada === "barrera_familiar")) {
    alertas.push("barrera_familiar");
  }

  return alertas;
}
```

---

## 14. Cálculo de Salario Proyectado

```typescript
const SALARIOS_BASE: Record<string, number> = {
  EMP: 4000000,
  INV: 6000000,
  EMP2: 8000000,
  FREE: 6000000,
  CRE: 5000000
};

function calcularSalarioProyectado(estado: EstadoPartida): number {
  const perfil = calcularPerfilDominante(estado.puntos);
  const salarioBase = SALARIOS_BASE[perfil];

  // Multiplicador de skills (contar skills en nivel 5)
  const skillsNivel5 = Object.values(estado.skills).filter(v => v >= 5).length;
  let multiplicadorSkills = 1.0;
  if (skillsNivel5 >= 3) multiplicadorSkills = 2.0;
  else if (skillsNivel5 >= 2) multiplicadorSkills = 1.5;
  else if (skillsNivel5 >= 1) multiplicadorSkills = 1.2;

  // Multiplicador de inglés
  const nivelIngles = estado.skills.ingles || 0;
  let multiplicadorIngles = 1.0;
  if (nivelIngles >= 4) multiplicadorIngles = 1.6;
  else if (nivelIngles >= 2) multiplicadorIngles = 1.3;

  return Math.round(salarioBase * multiplicadorSkills * multiplicadorIngles);
}
```

---

## 15. Mecánica Anti-Troll

```typescript
// Umbral 1: Tiempo muy bajo en onboarding
const TIEMPO_MINIMO_RESPUESTA = 4; // segundos

// Umbral 2: Misma opción repetida
const MAXIMO_OPCION_REPETIDA = 6; // de 8 preguntas

// Pantalla de intervención suave (post-onboarding)
const MENSAJE_INTERVENCION = {
  titulo: "Notamos que respondiste muy rápido",
  texto: "Eso está bien — pero Modo GOAT funciona mejor cuando las respuestas son honestas. El juego no te califica ni te juzga. Solo construye tu historia según lo que vos decís.",
  opcionA: "✅ Sí, las reviso — quiero que sea real",
  opcionB: "🚀 No, arranca — así está bien"
};

// Espejo de año sin crecimiento (2 años estancado)
const MENSAJE_ESPEJO_ANIO = {
  titulo: "Año {anio}",
  texto: "Tu personaje lleva 2 años en el mismo lugar. No es un juicio — es información. ¿Qué pasaría si este año eligieras diferente?",
  ingresoLabel: "Ingreso: igual que el año pasado",
  skillsLabel: "Skills nuevas: ninguna"
};

// Split screen costo de oportunidad (3 años sin crecer)
const MENSAJE_SPLIT_SCREEN = {
  pregunta: "¿Querés ver qué hubiera pasado si hubieras elegido diferente?",
  columnaA: "Tu historia",
  columnaB: "La otra versión",
  cierre: "La diferencia no es talento. Son las decisiones que tomaste — o que dejaste de tomar. Todavía podés cambiar eso."
};

// Pantalla final troll
const MENSAJE_FINAL_TROLL = {
  titulo: "Llegaste al año 30",
  texto: "Esta no fue tu mejor partida — y probablemente lo sabés. No pasa nada. El juego no te juzga. Pero hay una pregunta que vale la pena hacerse: ¿qué hubiera pasado si hubieras elegido diferente?",
  boton: "🔄 Jugar en serio esta vez"
};
```

---

## 16. Mensajes Motivacionales

### Por nivel de resultado

```typescript
const MENSAJES_RESULTADO = {
  medio: `Llegaste a los 30.

No fue el camino más fácil — ni el más directo. Pero llegaste.

Hay cosas que construiste que no aparecen en estos números: lo que aprendiste cuando algo salió mal, las personas que conociste, las decisiones que te enseñaron más que cualquier acierto.

En la vida real — a diferencia del juego — no hay un año 30 que lo resuma todo. Todavía tenés tiempo.

¿Qué pasaría si lo intentaras de otra forma?`,

  bajo: `Esta partida fue difícil.

Hubo momentos en que el camino se cerró — y momentos en que vos mismo lo cerraste sin darte cuenta. Eso también pasa.

Lo más valioso que podés sacar de esta partida no es el resultado — es reconocer en qué momento dejaste de elegir y empezaste a dejar que las cosas pasaran.

Porque esa es la diferencia real: no entre los que tienen suerte y los que no. Sino entre los que eligen y los que esperan.

Todavía podés elegir.`,

  troll: `Llegaste al año 30.

Esta no fue tu mejor partida — y probablemente lo sabés.

No pasa nada. El juego no te juzga.

Pero hay una pregunta que vale la pena hacerse: ¿qué hubiera pasado si hubieras elegido diferente?

La próxima partida puede ser completamente distinta. Solo tenés que querer que lo sea.`
};

// Por barrera detectada
const MENSAJES_BARRERA = {
  evasion_sistematica: `Notamos algo en tu partida: en los momentos más importantes, elegiste esperar.

Esperar no siempre es malo. Pero cuando se convierte en el patrón — cuando siempre es "después", "cuando esté listo", "cuando las condiciones sean mejores" — el después nunca llega.

El momento perfecto no existe. Solo existe este momento — y lo que decidís hacer con él.`,

  miedo_riesgo: `En esta partida rechazaste varias oportunidades que podrían haber cambiado tu historia.

No porque no las vieras — sino porque el riesgo se sentía más grande que la posibilidad.

Eso es completamente normal. El cerebro humano está diseñado para protegerte — no para hacerte crecer.

La buena noticia: el riesgo se entrena. Y este juego es exactamente el lugar para hacerlo — donde equivocarse no cuesta nada real.`,

  dependencia_economica: `Tu personaje llegó a los 30 ganando poco — no porque no pudiera ganar más, sino porque nunca invirtió en sí mismo.

Cada vez que apareció la opción de formarte, de subir una skill, de apostar por tu desarrollo — elegiste la seguridad inmediata.

La seguridad de hoy y la libertad de mañana casi nunca viven en la misma decisión.

¿Qué pasaría si en la próxima partida invirtieras aunque diera miedo?`,

  aislamiento: `Tu personaje construyó todo solo.

Eso tiene algo admirable — la autonomía, la independencia, no depender de nadie.

Pero también tiene un costo: el que va solo llega más rápido al techo de lo que puede hacer una sola persona.

Los que llegaron más lejos en este juego no fueron los más talentosos — fueron los que supieron a quién pedirle ayuda y cuándo.

En la próxima partida — probá no ir solo.`,

  sin_direccion: `Tu personaje probó varios caminos.

Eso no está mal — a veces hay que probar para saber. Pero en algún punto probar sin elegir se convierte en otra forma de no elegir.

¿Hay algo que siempre quisiste hacer pero nunca te permitiste tomar en serio? Algo que cuando lo ves en otros te genera algo — admiración, envidia sana, curiosidad.

Eso que sentís es información.

En la próxima partida — dale una oportunidad a eso.`
};

// Transición entre años
const MENSAJES_TRANSICION: Record<string, string> = {
  ingreso_subiendo: "Cada decisión que tomaste este año sumó. Seguí así.",
  ingreso_igual: "Este año no hubo grandes cambios. ¿Qué faltó?",
  ingreso_bajando: "Este año fue difícil. Lo que no te derrumba te prepara.",
  skill_nivel_3: "Estás a mitad del camino en {skill}. Ya no sos principiante.",
  skill_nivel_5: "Nivel máximo en {skill}. Eso no lo tiene cualquiera.",
  mentor_completado: "Cumpliste la misión. Eso también es un tipo de disciplina.",
  imprevisto_bien: "El imprevisto llegó. Lo manejaste. Eso dice mucho de vos.",
  imprevisto_mal: "Este año te costó. Pero ya pasó. El próximo año empieza ahora.",
  ingles_estancado: "El inglés lleva 3 años igual. Cada año que pasa, cuesta más ponerse al día."
};
```

---

## 17. Textos de Pantalla Final

```typescript
const TEXTOS_FINAL: Record<string, string> = {
  EMP: `Llegaste a los 30.

Nunca pusiste tu nombre en una empresa. Nunca tuviste socios. Nunca arriesgaste tu propio capital.

Y aun así construiste algo que impacta a personas reales, en lugares reales, todos los días.

Eso es lo que hace un líder desde adentro: no trabaja para una organización. La hace mejor.

Con paciencia. Con método. Con el equipo.

Eso también es GOAT MODE.`,

  INV: `Llegaste a los 30.

Empezaste con una pregunta. Solo una.

Y no paraste hasta tener la respuesta — aunque nadie te lo pidiera, aunque el camino fuera más largo de lo que esperabas, aunque hubiera momentos en que dudaste si valía la pena.

Valía la pena.

Eso es lo que hace un investigador de verdad: no busca respuestas porque le toca. Las busca porque no puede no buscarlas.

Eso sos vos.`,

  EMP2: `Llegaste a los 30.

Empezaste con $0 y una idea que nadie más veía todavía.

Hubo momentos en que todo indicaba que te detuvieras. Y no te detuviste.

No porque fueras el más inteligente ni el más preparado. Sino porque tenías algo que no se aprende en ningún lado: la certeza de que si no lo hacías vos, nadie más lo iba a hacer.

Eso es lo que hace un emprendedor de verdad. No crea empresas.

Crea posibilidades donde antes no había ninguna.`,

  FREE: `Llegaste a los 30.

Nunca tuviste un jefe que te dijera qué hacer.
Nunca tuviste un horario que alguien más diseñó para vos.
Nunca vendiste tu tiempo — vendiste lo que sabés hacer.

Eso tiene un precio que va más allá del dinero: la libertad de decir que no. De elegir con quién trabajás. De hacer las cosas a tu manera aunque sea más difícil.

Y lo más importante — llegaste a los 30 siendo exactamente quien quisiste ser.

Eso no lo logra cualquiera.`,

  CRE: `Llegaste a los 30.

Empezaste hablándole a nadie. A 43 seguidores. A una cámara en un cuarto.

Y nunca traicionaste a las personas que te escucharon desde el principio — cuando no tenías nada que ofrecerles excepto lo que eras.

Eso es lo más difícil de hacer cuando el mundo te ofrece plata para ser otra cosa.

Un creador de verdad no crea contenido.

Crea conexión. Y la conexión que construiste — esa no se puede comprar ni copiar.`,

  mixto: `Llegaste a los 30 siendo las dos cosas al mismo tiempo.

{textoPerfil1}

Y también:

{textoPerfil2}

Eso no es contradicción — es complejidad. Y la gente compleja es la que más le aporta al mundo.`
};
```

---

## 18. Dashboard de Sapiencia

### Rutas

```
/dashboard                    → Vista poblacional (requiere auth)
/dashboard/[partidaId]        → Perfil individual
/dashboard/exportar           → CSV de datos anonimizados
```

### Vista poblacional — datos que muestra

```typescript
interface DashboardPoblacional {
  totalPartidas: number;
  totalJugadores: number;
  
  distribucionPerfiles: {
    EMP: number; INV: number; EMP2: number; FREE: number; CRE: number;
  };
  
  areasLibresMasFrecuentes: Array<{ area: string; cantidad: number }>;
  
  alertasPorTipo: {
    perfil_beca: number;
    perfil_riesgo: number;
    alta_empleabilidad: number;
    emprendedor_solido: number;
    explorador_vocacional: number;
    barrera_economica: number;
    barrera_familiar: number;
  };
  
  distribucionEdades: Record<string, number>;
  distribucionCiudades: Record<string, number>;
  
  promedioPartidas: number; // partidas por jugador
  tasaGoatMode: number;     // % que llega a GOAT MODE
  tasaAbandono: number;     // % que abandona en onboarding
}
```

### Vista individual — datos que muestra

```typescript
interface DashboardIndividual {
  jugador: {
    nombre: string;
    edad: number;
    ciudad: string;
    contexto: string;
    trabaja: string;
  };
  
  partida: {
    fecha: Date;
    duracionMinutos: number;
    resultadoTipo: string;
    ingresoFinal: number;
    perfilDominante: string;
    perfilSecundario: string | null;
    esMixto: boolean;
  };
  
  areaLibre: string; // Lo que escribió el jugador
  
  bigFive: {
    apertura: number;
    responsabilidad: number;
    extroversion: number;
    amabilidad: number;
    estabilidad: number;
  };
  
  skillsFinales: Record<string, number>;
  medallasGanadas: string[];
  alertas: string[];
  
  // Decisiones clave
  decisionesDestacadas: Array<{
    anio: number;
    decision: string;
    opcionElegida: string;
    tiempoRespuesta: number;
  }>;
}
```

### Autenticación del dashboard

```typescript
// Solo acceso con credenciales de Sapiencia/Parceros
// Usar NextAuth con provider de credenciales o Google workspace

// middleware.ts
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Verificar sesión
    const session = getSession(request);
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
}
```

---

## 19. Las 57 Pantallas

### Flujo 1 — Entrada (5 pantallas)

| # | Pantalla | Descripción |
|---|---|---|
| 01 | Splash screen | Logo GOAT, animación de entrada, botón "Empezar" |
| 02 | Onboarding de la app | 3 slides explicando qué es el juego — sin mencionar que es orientación vocacional |
| 03 | Login | Email + contraseña o Google |
| 04 | Registro | Datos mínimos — solo email y contraseña |
| 05 | Recuperar contraseña | Email para reset |

### Flujo 2 — Onboarding del personaje (12 pantallas → 8 preguntas + datos básicos)

| # | Pantalla | Descripción |
|---|---|---|
| 06 | Datos básicos | Nombre, edad, género |
| 07 | Contexto | Ciudad, con quién vive, si trabaja |
| 08 | Pregunta 1 | CHASIDE — viernes en la tarde |
| 09 | Pregunta 2 | CHASIDE — proyecto libre |
| 10 | Pregunta 3 | Big Five — trabajo en grupo |
| 11 | Pregunta 4 | Big Five — crítica fuerte |
| 12 | Pregunta 5 | MMMG — orgullo máximo |
| 13 | Pregunta 6 | MMMG — fracaso |
| 14 | Pregunta 7 | VAK — aprendizaje |
| 15 | Pregunta 8 | VAK — semana libre |
| 16 | Pantalla de transición | "Tu historia está por comenzar" — resumen del personaje |
| 17 | Intervención anti-troll | Solo aparece si se detecta patrón automático |

### Flujo 3 — Juego (10 pantallas)

| # | Pantalla | Descripción |
|---|---|---|
| 18 | Inicio de año | Header con año, resumen del año anterior, qué viene |
| 19 | Decisión principal | Escenario + 4 opciones + botón de detalle |
| 20 | Popup detalle de opción | Pros, contras, skills que sube |
| 21 | Confirmación de decisión | "¿Estás seguro?" antes de confirmar |
| 22 | Campo libre | Pantalla para escribir el área de formación (Decisión 1) |
| 23 | Resumen de año | Ingresos, skills subidas, eventos del año |
| 24 | Imprevisto malo | Fondo con tono de alerta, emoji grande, opciones |
| 25 | Oportunidad | Fondo verde, emoji, descripción, opciones |
| 26 | Resultado de decisión | Consecuencia + skill que subió + mensaje narrativo |
| 27 | Costo de oportunidad | Split screen comparando la opción elegida vs la alternativa (en pesos) |

### Flujo 4 — Mentores (4 pantallas)

| # | Pantalla | Descripción |
|---|---|---|
| 28 | Mentor aparece | Presentación del mentor con su historia y por qué te busca |
| 29 | Misión del mentor | Descripción de la misión + aceptar / rechazar |
| 30 | Misión completada | Celebración + skill desbloqueada |
| 31 | Mentor desaparece | Si se rechaza o no se completa |

### Flujo 5 — Progreso (2 pantallas)

| # | Pantalla | Descripción |
|---|---|---|
| 32 | Logro desbloqueado | Animación + medalla + descripción |
| 33 | Medalla secreta | Pantalla especial para las 4 medallas ocultas |

### Flujo 6 — Navegación (6 pantallas)

| # | Pantalla | Descripción |
|---|---|---|
| 34 | Header | Avatar + nombre + año + $/mes (siempre visible) |
| 35 | Nav inferior | Jugar · Skills · Futuro |
| 36 | Tab Jugar | Pantalla principal del juego (loop del flujo 3) |
| 37 | Tab Skills | Grid de skills con niveles tipo RPG |
| 38 | Popup skill | Recursos para subirla — gratis / básico / premium |
| 39 | Tab Futuro | Salario proyectado + cargos posibles + skills que faltan |

### Flujo 7 — Colecciones (3 pantallas)

| # | Pantalla | Descripción |
|---|---|---|
| 40 | Colección de medallas | Grid con desbloqueadas (color) y bloqueadas (gris) |
| 41 | Detalle de medalla | Nombre + descripción + condición + fecha de obtención |
| 42 | Perfil del jugador | Stats + medallas + historial de partidas |

### Flujo 8 — Final de partida (8 pantallas)

| # | Pantalla | Descripción |
|---|---|---|
| 43 | GOAT MODE | Celebración máxima — animación de cabra + texto personalizado por perfil |
| 44 | Resultado alto | Sin GOAT MODE pero resultado sólido |
| 45 | Resultado medio | Mensaje motivacional + invitación a reintentar |
| 46 | Resultado bajo | Mensaje de barrera detectada + invitación |
| 47 | Resultado troll | Espejo + invitación a jugar en serio |
| 48 | Pregunta de barreras | Multi-select + campo abierto para Sapiencia |
| 49 | Informe de perfil | El informe visual completo (como el de José María y Valeria) |
| 50 | Invitación segunda partida | Nueva partida mismo personaje / personaje nuevo |

### Flujo 9 — Mecánica anti-troll (3 pantallas)

| # | Pantalla | Descripción |
|---|---|---|
| 51 | Intervención suave | Post-onboarding — ¿querés revisar tus respuestas? |
| 52 | Espejo de año | 2 años sin crecimiento — información sin juicio |
| 53 | Split screen | 3 años sin crecer — comparación de caminos en pesos |

### Flujo 10 — Configuración (4 pantallas)

| # | Pantalla | Descripción |
|---|---|---|
| 54 | Configuración de cuenta | Email, contraseña, notificaciones |
| 55 | Política de privacidad | Simplificada — cumple Ley 1581 de 2012 |
| 56 | Términos de uso para menores | Consentimiento parental para menores de 18 |
| 57 | Eliminación de datos | Proceso para borrar cuenta y datos |

---

## 20. Roadmap Post-MVP

### Fase 2 (después del demo validado)

- [ ] Modo Parceros — imprevistos adaptados para contexto de vulnerabilidad
- [ ] Versión offline — descarga de contenido al inicio, funciona sin internet
- [ ] Notificaciones push — recordatorios para retomar partida
- [ ] Dashboard avanzado — filtros por comuna, institución, cohorte
- [ ] Exportación CSV para análisis institucional

### Fase 3 (expansión)

- [ ] Apps nativas iOS y Android (React Native + Expo)
- [ ] Corridas compartidas — dos jugadores, mismo escenario
- [ ] Mentor real vinculado al perfil — red de mentores de Medellín
- [ ] API de datos para investigadores (con acceso controlado)
- [ ] Adaptación para otros municipios colombianos

### Fase 4 (internacional)

- [ ] Versión en inglés
- [ ] Adaptación cultural para México, Perú, Ecuador
- [ ] Partnerships con universidades latinoamericanas
- [ ] Versión enterprise para empresas (onboarding de talento joven)

---

## Notas de implementación

### Prioridades para el demo

1. Flujo completo del juego — onboarding + decisiones + resultado
2. Campo libre funcional — guardado y visible en dashboard
3. Dashboard básico — distribución de perfiles + campo libre más frecuente
4. Informe de perfil del jugador — como el de José María y Valeria
5. PWA — instalable en celular sin descarga

### Lo que NO va en el demo

- Autenticación compleja (puede ser solo nombre y empezar)
- Apps nativas
- Modo Parceros
- API de datos

### Consideraciones de accesibilidad

- Fuente mínima 14px en móvil
- Contraste mínimo WCAG AA
- Textos alternativos en todos los emojis
- Compatible con lectores de pantalla

### Consideraciones de conectividad

- Cachear el contenido del juego al inicio (Service Worker)
- Guardar estado de partida en localStorage como backup
- Sincronizar con servidor cuando haya conexión

---

*Fin del Game Design Document v1.0*  
*The Way · Josué Moya de la Cruz · Medellín, Colombia · 2025*
