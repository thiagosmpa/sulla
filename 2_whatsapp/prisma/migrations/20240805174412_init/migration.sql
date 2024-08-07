-- CreateTable
CREATE TABLE "Users" (
    "pkId" SERIAL NOT NULL,
    "sessionId" VARCHAR(128) NOT NULL,
    "id" VARCHAR(255) NOT NULL,
    "instructions" TEXT NOT NULL,
    "agenda" VARCHAR(255) NOT NULL,
    "connectionStatus" VARCHAR(255) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("pkId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_sessionId_key" ON "Users"("sessionId");
