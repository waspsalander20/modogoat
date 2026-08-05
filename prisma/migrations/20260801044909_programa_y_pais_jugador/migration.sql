-- AlterTable
ALTER TABLE "Jugador" ADD COLUMN     "pais" TEXT NOT NULL DEFAULT 'CO',
ADD COLUMN     "programaId" TEXT;

-- CreateTable
CREATE TABLE "Programa" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Programa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Programa_slug_key" ON "Programa"("slug");

-- AddForeignKey
ALTER TABLE "Jugador" ADD CONSTRAINT "Jugador_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "Programa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
