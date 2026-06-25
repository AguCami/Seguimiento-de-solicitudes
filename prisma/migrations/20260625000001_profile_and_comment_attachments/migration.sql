-- Add avatarUrl to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

-- Add CommentAttachment table
CREATE TABLE IF NOT EXISTS "CommentAttachment" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "url"       TEXT NOT NULL,
    "type"      TEXT NOT NULL,
    "size"      INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commentId" TEXT NOT NULL,
    CONSTRAINT "CommentAttachment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CommentAttachment"
    ADD CONSTRAINT "CommentAttachment_commentId_fkey"
    FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
