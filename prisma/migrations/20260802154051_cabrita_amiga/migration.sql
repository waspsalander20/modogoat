-- AlterTable
ALTER TABLE "DecisionJugada" ADD COLUMN     "cabritaReflexion" TEXT;

-- AlterTable
ALTER TABLE "EventoJugado" ADD COLUMN     "cabritaReflexion" TEXT;

-- AlterTable
ALTER TABLE "Partida" ADD COLUMN     "vecesCabrita" INTEGER NOT NULL DEFAULT 0;
