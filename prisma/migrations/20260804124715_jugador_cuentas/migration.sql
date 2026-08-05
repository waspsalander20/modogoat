-- AlterTable
ALTER TABLE "Jugador" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "passwordHash" TEXT,
ALTER COLUMN "edad" DROP NOT NULL,
ALTER COLUMN "genero" DROP NOT NULL,
ALTER COLUMN "contexto" DROP NOT NULL,
ALTER COLUMN "trabaja" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Jugador_email_key" ON "Jugador"("email");

