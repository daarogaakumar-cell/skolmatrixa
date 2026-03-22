"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "./audit";
import { revalidatePath } from "next/cache";
import { notificationSchema } from "@/lib/validations/schemas";
import { sendBulkAnnouncementEmail } from "@/lib/email";

// ==================== Auth Helpers ====================

async function requireTenantAdmin() {
  const session = await auth();
  if (!session?.user || !session.user.tenantId) {
    throw new Error("Unauthorized");
  }
  if (!["TENANT_ADMIN", "VICE_ADMIN"].includes(session.user.role)) {
    throw new Error("Insufficient permissions");
  }
  return session.user;
}

async function requireTenantUser() {
  const session = await auth();
  if (!session?.user || !session.user.tenantId) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

// ==================== Create Notification (Admin) ====================

export async function createNotification(data: {
  title: string;
  message: string;
  type?: string;
  priority?: string;
  targetRoles?: string[];
  targetClassId?: string;
  targetBatchId?: string;
  sendEmail?: boolean;
}) {
  try {
    const user = await requireTenantAdmin();
    const tenantId = user.tenantId!;

    const validated = notificationSchema.parse(data);

    const sentVia = ["IN_APP"];
    if (data.sendEmail) sentVia.push("EMAIL");

    const notification = await prisma.notification.create({
      data: {
        tenantId,
        title: validated.title,
        message: validated.message,
        type: validated.type as any,
        priority: validated.priority as any,
        targetRoles: validated.targetRoles || [],
        targetClassId: validated.targetClassId || null,
        targetBatchId: validated.targetBatchId || null,
        sentVia,
        createdBy: user.id,
      },
    });

    // Send emails if requested
    if (data.sendEmail) {
      await sendNotificationEmails(tenantId, notification.id, validated.title, validated.message, validated.targetRoles, validated.targetClassId, validated.targetBatchId);
    }

    await logAudit({
      tenantId,
      userId: user.id,
      action: "NOTIFICATION_CREATED",
      entityType: "Notification",
      entityId: notification.id,
      details: { title: validated.title, type: validated.type },
    });

    revalidatePath("/dashboard/notifications");
    return { success: true, data: notification };
  } catch (error) {
    console.error("Create notification error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create notification" };
  }
}

// ==================== System Notifications ====================

export async function createSystemNotification(data: {
  tenantId: string;
  title: string;
  message: string;
  type: string;
  priority?: string;
  targetRoles: string[];
  targetClassId?: string | null;
  targetBatchId?: string | null;
  createdBy: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        message: data.message,
        type: data.type as any,
        priority: (data.priority || "NORMAL") as any,
        targetRoles: data.targetRoles,
        targetClassId: data.targetClassId || null,
        targetBatchId: data.targetBatchId || null,
        sentVia: ["IN_APP"],
        createdBy: data.createdBy,
      },
    });

    return { success: true, data: notification };
  } catch (error) {
    console.error("Create system notification error:", error);
    return { success: false, error: "Failed to create notification" };
  }
}

// ==================== Get Notifications ====================

export async function getNotifications(filters?: {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}) {
  try {
    const user = await requireTenantUser();
    const tenantId = user.tenantId!;
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;

    // Get notifications targeted at this user's role or all users
    const where: Record<string, unknown> = { tenantId };

    // Filter by role targeting
    where.OR = [
      { targetRoles: { isEmpty: true } },
      { targetRoles: { has: user.role } },
    ];

    // If user is a student, also filter by their class/batch
    if (user.role === "STUDENT" || user.role === "PARENT") {
      const student = await prisma.student.findFirst({
        where: {
          tenantId,
          ...(user.role === "STUDENT" ? { userId: user.id } : {}),
          ...(user.role === "PARENT" ? { parentUserId: user.id } : {}),
        },
        select: { classId: true, batchId: true },
      });

      if (student) {
        where.OR = [
          { targetRoles: { isEmpty: true }, targetClassId: null, targetBatchId: null },
          { targetRoles: { has: user.role }, targetClassId: null, targetBatchId: null },
          ...(student.classId ? [{ targetClassId: student.classId }] : []),
          ...(student.batchId ? [{ targetBatchId: student.batchId }] : []),
        ];
      }
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          creator: { select: { name: true } },
          reads: {
            where: { userId: user.id },
            select: { readAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
    ]);

    let filtered = notifications.map((n) => ({
      ...n,
      isRead: n.reads.length > 0,
      readAt: n.reads[0]?.readAt || null,
    }));

    if (filters?.unreadOnly) {
      filtered = filtered.filter((n) => !n.isRead);
    }

    return {
      success: true,
      data: filtered,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  } catch (error) {
    console.error("Get notifications error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch notifications" };
  }
}

export async function getUnreadCount() {
  try {
    const user = await requireTenantUser();
    const tenantId = user.tenantId!;

    // Get notification IDs already read
    const readNotIds = await prisma.notificationRead.findMany({
      where: { userId: user.id },
      select: { notificationId: true },
    });

    const readIds = readNotIds.map((r) => r.notificationId);

    const count = await prisma.notification.count({
      where: {
        tenantId,
        id: { notIn: readIds },
        OR: [
          { targetRoles: { isEmpty: true } },
          { targetRoles: { has: user.role } },
        ],
      },
    });

    return { success: true, data: count };
  } catch (error) {
    console.error("Get unread count error:", error);
    return { success: false, data: 0 };
  }
}

// ==================== Mark as Read ====================

export async function markNotificationRead(notificationId: string) {
  try {
    const user = await requireTenantUser();

    await prisma.notificationRead.upsert({
      where: {
        notificationId_userId: { notificationId, userId: user.id },
      },
      create: {
        notificationId,
        userId: user.id,
      },
      update: {},
    });

    return { success: true };
  } catch (error) {
    console.error("Mark notification read error:", error);
    return { success: false, error: "Failed to mark as read" };
  }
}

export async function markAllNotificationsRead() {
  try {
    const user = await requireTenantUser();
    const tenantId = user.tenantId!;

    // Get all unread notification IDs for this user
    const readNotIds = await prisma.notificationRead.findMany({
      where: { userId: user.id },
      select: { notificationId: true },
    });

    const readIds = readNotIds.map((r) => r.notificationId);

    const unreadNotifications = await prisma.notification.findMany({
      where: {
        tenantId,
        id: { notIn: readIds },
        OR: [
          { targetRoles: { isEmpty: true } },
          { targetRoles: { has: user.role } },
        ],
      },
      select: { id: true },
    });

    if (unreadNotifications.length > 0) {
      await prisma.notificationRead.createMany({
        data: unreadNotifications.map((n) => ({
          notificationId: n.id,
          userId: user.id,
        })),
        skipDuplicates: true,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Mark all read error:", error);
    return { success: false, error: "Failed to mark all as read" };
  }
}

// ==================== Delete Notification ====================

export async function deleteNotification(id: string) {
  try {
    const user = await requireTenantAdmin();
    const tenantId = user.tenantId!;

    await prisma.notification.delete({
      where: { id },
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "NOTIFICATION_DELETED",
      entityType: "Notification",
      entityId: id,
    });

    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (error) {
    console.error("Delete notification error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete notification" };
  }
}

// ==================== Helpers ====================

async function sendNotificationEmails(
  tenantId: string,
  notificationId: string,
  title: string,
  message: string,
  targetRoles?: string[],
  targetClassId?: string,
  targetBatchId?: string,
) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    // Build user query
    const userWhere: Record<string, unknown> = { tenantId, isActive: true };

    if (targetRoles && targetRoles.length > 0) {
      userWhere.role = { in: targetRoles };
    }

    // Get target users' emails
    let emails: string[] = [];

    if (targetClassId || targetBatchId) {
      // For class/batch-targeted notifications, get students + parents
      const students = await prisma.student.findMany({
        where: {
          tenantId,
          status: "ACTIVE",
          ...(targetClassId ? { classId: targetClassId } : {}),
          ...(targetBatchId ? { batchId: targetBatchId } : {}),
        },
        select: { email: true, guardianEmail: true },
      });

      emails = students
        .flatMap((s) => [s.email, s.guardianEmail])
        .filter((e): e is string => !!e && e.length > 0);
    } else {
      const users = await prisma.user.findMany({
        where: userWhere,
        select: { email: true },
        take: 100, // Limit to avoid sending too many
      });
      emails = users.map((u) => u.email).filter(Boolean);
    }

    if (emails.length > 0) {
      await sendBulkAnnouncementEmail(
        emails,
        title,
        message,
        "GENERAL",
        tenant?.name || "SkolMatrixa"
      );
    }
  } catch (error) {
    console.error("Send notification emails error:", error);
  }
}

export async function getNotificationTargetOptions() {
  try {
    const user = await requireTenantAdmin();
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
    console.error("Get target options error:", error);
    return { success: false, error: "Failed to fetch options" };
  }
}
