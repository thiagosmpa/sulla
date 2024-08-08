-- AlterTable
ALTER TABLE "Chat2" ADD COLUMN     "contactName" TEXT;

-- CreateTable
CREATE TABLE "Agendamentos" (
    "pkId" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "contato" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "profissional" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'consulta',
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "data" TIMESTAMP(3) NOT NULL,
    "obs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agendamentos_pkey" PRIMARY KEY ("pkId")
);
