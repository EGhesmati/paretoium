-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "studyHours" DOUBLE PRECISION NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicNode" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NOT NULL,
    "description" TEXT,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "TopicNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Edge" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,

    CONSTRAINT "Edge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPathHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NOT NULL,
    "name" TEXT NOT NULL,
    "pathType" TEXT NOT NULL,
    "courseIds" JSONB NOT NULL,
    "studyHours" DOUBLE PRECISION NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPathHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TopicNode_courseId_title_key" ON "TopicNode"("courseId", "title");

-- CreateIndex
CREATE INDEX "TopicNode_courseId_idx" ON "TopicNode"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Edge_sourceId_targetId_key" ON "Edge"("sourceId", "targetId");

-- CreateIndex
CREATE INDEX "Edge_targetId_idx" ON "Edge"("targetId");

-- CreateIndex
CREATE INDEX "UserPathHistory_userId_createdAt_idx" ON "UserPathHistory"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "TopicNode"
ADD CONSTRAINT "TopicNode_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Edge"
ADD CONSTRAINT "Edge_sourceId_fkey"
FOREIGN KEY ("sourceId") REFERENCES "TopicNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Edge"
ADD CONSTRAINT "Edge_targetId_fkey"
FOREIGN KEY ("targetId") REFERENCES "TopicNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPathHistory"
ADD CONSTRAINT "UserPathHistory_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
