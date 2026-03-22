"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "./audit";
import { sendBulkAnnouncementEmail } from "@/lib/email";
import { z } from "zod";

const bulkEmailSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(1, "Message is required").max(5000),
  category: z.enum([
    "EVENT",
    "HOLIDAY",
    "RESULT",
    "GENERAL",
    "EXAM_SCHEDULE",
    "FEE_REMINDER",
  ]),
  targetType: z.enum(["ALL", "CLASS", "BATCH", "ROLE"]),
  targetClassId: z.string().optional(),
  targetBatchId: z.string().optional(),
  targetRoles: z.array(z.string()).optional(),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !session.user.tenantId) {
    throw new Error("Unauthorized");
  }
  if (!["TENANT_ADMIN", "VICE_ADMIN"].includes(session.user.role)) {
    throw new Error("Insufficient permissions");
  }
  return session.user;
}

export async function sendBulkEmail(data: {
  subject: string;
  message: string;
  category: string;
  targetType: string;
  targetClassId?: string;
  targetBatchId?: string;
  targetRoles?: string[];
}) {
  try {
    const user = await requireAdmin();
    const tenantId = user.tenantId!;

    const validated = bulkEmailSchema.parse(data);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });
    const tenantName = tenant?.name || "Your Institution";

    // Collect email addresses based on target
    let emails: string[] = [];

    if (validated.targetType === "CLASS" && validated.targetClassId) {
      const students = await prisma.student.findMany({
        where: { tenantId, status: "ACTIVE", classId: validated.targetClassId },
        select: { email: true, guardianEmail: true },
      });
      emails = students
        .flatMap((s) => [s.email, s.guardianEmail])
        .filter((e): e is string => !!e && e.length > 0);
    } else if (validated.targetType === "BATCH" && validated.targetBatchId) {
      const students = await prisma.student.findMany({
        where: { tenantId, status: "ACTIVE", batchId: validated.targetBatchId },
        select: { email: true, guardianEmail: true },
      });
      emails = students
        .flatMap((s) => [s.email, s.guardianEmail])
        .filter((e): e is string => !!e && e.length > 0);
    } else if (
      validated.targetType === "ROLE" &&
      validated.targetRoles &&
      validated.targetRoles.length > 0
    ) {
      const users = await prisma.user.findMany({
        where: {
          tenantId,
          isActive: true,
          role: { in: validated.targetRoles as never[] },
        },
        select: { email: true },
        take: 500,
      });
      emails = users.map((u) => u.email).filter(Boolean);

      // Also include student/guardian emails if targeting STUDENT or PARENT
      if (
        validated.targetRoles.includes("STUDENT") ||
        validated.targetRoles.includes("PARENT")
      ) {
        const students = await prisma.student.findMany({
          where: { tenantId, status: "ACTIVE" },
          select: { email: true, guardianEmail: true },
        });
        const studentEmails = students
          .flatMap((s) => [
            validated.targetRoles!.includes("STUDENT") ? s.email : null,
            validated.targetRoles!.includes("PARENT") ? s.guardianEmail : null,
          ])
          .filter((e): e is string => !!e && e.length > 0);
        emails = [...emails, ...studentEmails];
      }
    } else {
      // ALL — get everyone
      const [users, students] = await Promise.all([
        prisma.user.findMany({
          where: { tenantId, isActive: true },
          select: { email: true },
          take: 500,
        }),
        prisma.student.findMany({
          where: { tenantId, status: "ACTIVE" },
          select: { email: true, guardianEmail: true },
        }),
      ]);
      emails = [
        ...users.map((u) => u.email),
        ...students.flatMap((s) => [s.email, s.guardianEmail]),
      ].filter((e): e is string => !!e && e.length > 0);
    }

    // Deduplicate
    emails = [...new Set(emails.map((e) => e.toLowerCase()))];

    if (emails.length === 0) {
      return { success: false, error: "No recipients found for the selected target." };
    }

    // Send via branded bulk email
    const result = await sendBulkAnnouncementEmail(
      emails,
      validated.subject,
      validated.message,
      validated.category,
      tenantName
    );

    await logAudit({
      tenantId,
      userId: user.id,
      action: "BULK_EMAIL_SENT",
      entityType: "BulkEmail",
      entityId: `BULK-${Date.now()}`,
      details: {
        subject: validated.subject,
        category: validated.category,
        targetType: validated.targetType,
        recipientCount: emails.length,
        sent: result.sent,
        failed: result.failed,
      },
    });

    return {
      success: true,
      data: {
        recipientCount: emails.length,
        sent: result.sent,
        failed: result.failed,
      },
    };
  } catch (error) {
    console.error("Bulk email error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to send bulk email",
    };
  }
}

export async function getBulkEmailTargetOptions() {
  try {
    const user = await requireAdmin();
    const tenantId = user.tenantId!;

    const academicYear = await prisma.academicYear.findFirst({
      where: { tenantId, isCurrent: true },
    });

    if (!academicYear) {
      return { success: true, data: { classes: [], batches: [] } };
    }

    const [classes, batches] = await Promise.all([
      prisma.class.findMany({
        where: { tenantId, academicYearId: academicYear.id },
        select: { id: true, name: true, section: true },
        orderBy: { name: "asc" },
      }),
      prisma.batch.findMany({
        where: { tenantId, academicYearId: academicYear.id },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return { success: true, data: { classes, batches } };
  } catch (error) {
    console.error("Get bulk email target options error:", error);
    return { success: false, error: "Failed to fetch options" };
  }
}
