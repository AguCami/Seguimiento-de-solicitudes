CREATE TABLE IF NOT EXISTS "SubTask" (
    "id"        TEXT NOT NULL,
    "title"     TEXT NOT NULL,
    "done"      BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestId" TEXT NOT NULL,
    CONSTRAINT "SubTask_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SubTask"
    ADD CONSTRAINT "SubTask_requestId_fkey"
    FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
