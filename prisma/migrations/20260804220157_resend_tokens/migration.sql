-- AlterTable
ALTER TABLE "Jugador" ADD COLUMN     "emailConfirmacionToken" TEXT,
ADD COLUMN     "emailConfirmado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resetPasswordExpira" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Jugador_emailConfirmacionToken_key" ON "Jugador"("emailConfirmacionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Jugador_resetPasswordToken_key" ON "Jugador"("resetPasswordToken");

