-- AlterTable
ALTER TABLE "DecisionJugada" ADD COLUMN     "narrativa" TEXT,
ADD COLUMN     "opcionTexto" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "titulo" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "EventoJugado" ADD COLUMN     "narrativa" TEXT,
ADD COLUMN     "nombre" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "opcionTexto" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Partida" ADD COLUMN     "analisisFinal" TEXT,
ADD COLUMN     "turnoActual" JSONB;
