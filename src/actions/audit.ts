"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface LogAuditParams {
  tenantId?: string | null;
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logAudit({
  tenantId,
  userId,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
}: LogAuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: tenantId || null,
        userId,
        action,
        entityType,
        entityId,
        details: (details || {}) as Record<string, string | number | boolean | null>,
        ipAddress,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export async function getAuditLogs({
  tenantId,
  page = 1,
  pageSize = 50,
  action,
  dateFrom,
  dateTo,
}: {
  tenantId?: string;
  page?: number;
  pageSize?: number;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const where: Record<string, unknown> = {};
  if (tenantId) where.tenantId = tenantId;
  if (action) where.action = action;
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo && { lte: new Date(dateTo) }),
    };
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        tenant: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    success: true,
    data: logs,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
