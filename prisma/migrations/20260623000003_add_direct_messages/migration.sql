CREATE TABLE "DirectMessage" (
  "id"         TEXT NOT NULL,
  "content"    TEXT NOT NULL,
  "read"       BOOLEAN NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "senderId"   TEXT NOT NULL,
  "receiverId" TEXT NOT NULL,
  CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DirectMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DirectMessage_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "DirectMessage_senderId_idx" ON "DirectMessage"("senderId");
CREATE INDEX "DirectMessage_receiverId_idx" ON "DirectMessage"("receiverId");
