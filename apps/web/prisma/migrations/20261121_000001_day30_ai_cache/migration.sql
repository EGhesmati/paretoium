CREATE TABLE "AIResponseCache" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIResponseCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AIResponseCache_cacheKey_key" ON "AIResponseCache"("cacheKey");
CREATE INDEX "AIResponseCache_kind_createdAt_idx" ON "AIResponseCache"("kind", "createdAt");
