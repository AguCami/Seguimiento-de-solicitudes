-- Drop assignedToId if it was previously added
ALTER TABLE "Request" DROP CONSTRAINT IF EXISTS "Request_assignedToId_fkey";
ALTER TABLE "Request" DROP COLUMN IF EXISTS "assignedToId";

-- Add requestedTo text field
ALTER TABLE "Request" ADD COLUMN IF NOT EXISTS "requestedTo" TEXT;
