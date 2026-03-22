-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "SlotType" AS ENUM ('FULL_DAY', 'HALF_DAY_MORNING', 'HALF_DAY_EVENING');

-- CreateEnum
CREATE TYPE "LibraryMemberStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BookIssueStatus" AS ENUM ('ISSUED', 'RETURNED', 'OVERDUE', 'LOST');

-- AlterEnum
ALTER TYPE "TenantType" ADD VALUE 'LIBRARY';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'LIBRARIAN';

-- CreateTable
CREATE TABLE "LibrarySeat" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "seatNumber" TEXT NOT NULL,
    "zone" TEXT,
    "floor" TEXT,
    "hasWifi" BOOLEAN NOT NULL DEFAULT true,
    "hasPower" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" "SeatStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibrarySeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryMember" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "photoUrl" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "emergencyContact" TEXT,
    "idCardIssued" BOOLEAN NOT NULL DEFAULT false,
    "idCardNumber" TEXT,
    "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "status" "LibraryMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibrarySeatAllocation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "slotType" "SlotType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibrarySeatAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryBook" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "isbn" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "publisher" TEXT,
    "category" TEXT,
    "edition" TEXT,
    "totalCopies" INTEGER NOT NULL DEFAULT 1,
    "availableCopies" INTEGER NOT NULL DEFAULT 1,
    "shelfLocation" TEXT,
    "coverUrl" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryBookIssue" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
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

    CONSTRAINT "LibraryBookIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryFee" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "slotType" "SlotType",
    "amount" DECIMAL(10,2) NOT NULL,
    "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "paymentMethod" "PaymentMethod",
    "receiptNo" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "month" INTEGER,
    "year" INTEGER,
    "notes" TEXT,
    "collectedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryPricing" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "slotType" "SlotType" NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "duration" TEXT NOT NULL DEFAULT 'MONTHLY',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryPricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LibrarySeat_tenantId_status_idx" ON "LibrarySeat"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LibrarySeat_tenantId_seatNumber_key" ON "LibrarySeat"("tenantId", "seatNumber");

-- CreateIndex
CREATE INDEX "LibraryMember_tenantId_status_idx" ON "LibraryMember"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryMember_tenantId_memberId_key" ON "LibraryMember"("tenantId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryMember_tenantId_email_key" ON "LibraryMember"("tenantId", "email");

-- CreateIndex
CREATE INDEX "LibrarySeatAllocation_tenantId_seatId_isActive_idx" ON "LibrarySeatAllocation"("tenantId", "seatId", "isActive");

-- CreateIndex
CREATE INDEX "LibrarySeatAllocation_tenantId_memberId_idx" ON "LibrarySeatAllocation"("tenantId", "memberId");

-- CreateIndex
CREATE INDEX "LibraryBook_tenantId_category_idx" ON "LibraryBook"("tenantId", "category");

-- CreateIndex
CREATE INDEX "LibraryBook_tenantId_title_idx" ON "LibraryBook"("tenantId", "title");

-- CreateIndex
CREATE INDEX "LibraryBookIssue_tenantId_memberId_status_idx" ON "LibraryBookIssue"("tenantId", "memberId", "status");

-- CreateIndex
CREATE INDEX "LibraryBookIssue_tenantId_status_idx" ON "LibraryBookIssue"("tenantId", "status");

-- CreateIndex
CREATE INDEX "LibraryBookIssue_tenantId_dueDate_idx" ON "LibraryBookIssue"("tenantId", "dueDate");

-- CreateIndex
CREATE INDEX "LibraryFee_tenantId_memberId_status_idx" ON "LibraryFee"("tenantId", "memberId", "status");

-- CreateIndex
CREATE INDEX "LibraryFee_tenantId_status_idx" ON "LibraryFee"("tenantId", "status");

-- CreateIndex
CREATE INDEX "LibraryPricing_tenantId_idx" ON "LibraryPricing"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryPricing_tenantId_slotType_key" ON "LibraryPricing"("tenantId", "slotType");

-- AddForeignKey
ALTER TABLE "LibrarySeat" ADD CONSTRAINT "LibrarySeat_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryMember" ADD CONSTRAINT "LibraryMember_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibrarySeatAllocation" ADD CONSTRAINT "LibrarySeatAllocation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibrarySeatAllocation" ADD CONSTRAINT "LibrarySeatAllocation_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "LibrarySeat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibrarySeatAllocation" ADD CONSTRAINT "LibrarySeatAllocation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LibraryMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryBook" ADD CONSTRAINT "LibraryBook_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryBookIssue" ADD CONSTRAINT "LibraryBookIssue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryBookIssue" ADD CONSTRAINT "LibraryBookIssue_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "LibraryBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryBookIssue" ADD CONSTRAINT "LibraryBookIssue_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LibraryMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryBookIssue" ADD CONSTRAINT "LibraryBookIssue_issuedBy_fkey" FOREIGN KEY ("issuedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryFee" ADD CONSTRAINT "LibraryFee_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryFee" ADD CONSTRAINT "LibraryFee_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LibraryMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryFee" ADD CONSTRAINT "LibraryFee_collectedBy_fkey" FOREIGN KEY ("collectedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryPricing" ADD CONSTRAINT "LibraryPricing_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
