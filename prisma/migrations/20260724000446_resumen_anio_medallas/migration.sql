-- AlterTable
ALTER TABLE "DecisionJugada" ADD COLUMN     "medallaDesbloqueada" TEXT;

-- AlterTable
ALTER TABLE "EventoJugado" ADD COLUMN     "ingresoAntes" INTEGER,
ADD COLUMN     "ingresoDespues" INTEGER,
ADD COLUMN     "medallaDesbloqueada" TEXT;
