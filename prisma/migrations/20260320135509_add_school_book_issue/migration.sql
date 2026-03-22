-- CreateTable
CREATE TABLE "SchoolBookIssue" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "fine" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "finePaid" BOOLEAN NOT NULL DEFAULT false,
    "status" "BookIssueStatus" NOT NULL DEFAULT 'ISSUED',
    "notes" TEXT,
    "issuedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolBookIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SchoolBookIssue_tenantId_studentId_status_idx" ON "SchoolBookIssue"("tenantId", "studentId", "status");

-- CreateIndex
CREATE INDEX "SchoolBookIssue_tenantId_status_idx" ON "SchoolBookIssue"("tenantId", "status");

-- CreateIndex
CREATE INDEX "SchoolBookIssue_tenantId_dueDate_idx" ON "SchoolBookIssue"("tenantId", "dueDate");

-- AddForeignKey
ALTER TABLE "SchoolBookIssue" ADD CONSTRAINT "SchoolBookIssue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolBookIssue" ADD CONSTRAINT "SchoolBookIssue_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "LibraryBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolBookIssue" ADD CONSTRAINT "SchoolBookIssue_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolBookIssue" ADD CONSTRAINT "SchoolBookIssue_issuedBy_fkey" FOREIGN KEY ("issuedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
