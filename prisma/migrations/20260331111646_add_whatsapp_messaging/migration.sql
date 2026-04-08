-- CreateEnum
CREATE TYPE "WhatsAppMessageStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "whatsappMsgId" TEXT,
ADD COLUMN     "whatsappStatus" "WhatsAppMessageStatus";

-- CreateTable
CREATE TABLE "WhatsAppLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "recipientName" TEXT,
    "status" "WhatsAppMessageStatus" NOT NULL DEFAULT 'PENDING',
    "msgId" TEXT,
    "errorMessage" TEXT,
    "variables" JSONB,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WhatsAppLog_tenantId_createdAt_idx" ON "WhatsAppLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppLog_tenantId_category_idx" ON "WhatsAppLog"("tenantId", "category");

-- CreateIndex
CREATE INDEX "WhatsAppLog_msgId_idx" ON "WhatsAppLog"("msgId");

-- CreateIndex
CREATE INDEX "WhatsAppLog_status_idx" ON "WhatsAppLog"("status");

-- AddForeignKey
ALTER TABLE "WhatsAppLog" ADD CONSTRAINT "WhatsAppLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
