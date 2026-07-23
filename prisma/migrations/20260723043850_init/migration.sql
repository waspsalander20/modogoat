-- CreateTable
CREATE TABLE "Jugador" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "edad" INTEGER NOT NULL,
    "genero" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL DEFAULT 'Medellín',
    "contexto" TEXT NOT NULL,
    "trabaja" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Jugador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partida" (
    "id" TEXT NOT NULL,
    "jugadorId" TEXT NOT NULL,
    "respuestasOnboarding" JSONB NOT NULL,
    "tiemposOnboarding" JSONB NOT NULL,
    "areaLibre" TEXT,
    "rutaEntrada" TEXT,
    "puntosPerfil" JSONB NOT NULL,
    "perfilDominante" TEXT,
    "perfilSecundario" TEXT,
    "esMixto" BOOLEAN NOT NULL DEFAULT false,
    "bigFive" JSONB,
    "edadInicio" INTEGER NOT NULL,
    "edadActual" INTEGER NOT NULL DEFAULT 0,
    "ingresoActual" INTEGER NOT NULL DEFAULT 0,
    "ahorros" INTEGER NOT NULL DEFAULT 0,
    "skills" JSONB NOT NULL DEFAULT '{}',
    "aniosJugados" INTEGER NOT NULL DEFAULT 0,
    "aniosEstancado" INTEGER NOT NULL DEFAULT 0,
    "mentorActivo" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'onboarding',
    "resultadoTipo" TEXT,
    "ingresoFinal" INTEGER,
    "skillsFinales" JSONB,
    "medallasGanadas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "alertas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tiempoPromedio" DOUBLE PRECISION,
    "patronTroll" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionJugada" (
    "id" TEXT NOT NULL,
    "partidaId" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "decisionId" TEXT NOT NULL,
    "opcionElegida" TEXT NOT NULL,
    "campoLibre" TEXT,
    "tiempoRespuesta" DOUBLE PRECISION NOT NULL,
    "ingresoAntes" INTEGER NOT NULL,
    "ingresoDespues" INTEGER NOT NULL,
    "skillsSubidas" JSONB NOT NULL,
    "puntosSumados" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionJugada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoJugado" (
    "id" TEXT NOT NULL,
    "partidaId" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "tipoEvento" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "opcionElegida" TEXT NOT NULL,
    "tiempoRespuesta" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoJugado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Partida_perfilDominante_idx" ON "Partida"("perfilDominante");

-- CreateIndex
CREATE INDEX "Partida_estado_idx" ON "Partida"("estado");

-- AddForeignKey
ALTER TABLE "Partida" ADD CONSTRAINT "Partida_jugadorId_fkey" FOREIGN KEY ("jugadorId") REFERENCES "Jugador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionJugada" ADD CONSTRAINT "DecisionJugada_partidaId_fkey" FOREIGN KEY ("partidaId") REFERENCES "Partida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoJugado" ADD CONSTRAINT "EventoJugado_partidaId_fkey" FOREIGN KEY ("partidaId") REFERENCES "Partida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
