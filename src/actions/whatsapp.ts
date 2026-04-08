"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "./audit";
import { revalidatePath } from "next/cache";
import {
  sendWhatsAppAnnouncement,
  sendWhatsAppMessage,
  sendBulkWhatsApp,
  getWhatsAppSettings,
  normalizePhone,
  getTodayMessageCount,
  getTemplatesForTenantType,
  TEMPLATE_LABELS,
  type WhatsAppRecipient,
  type WhatsAppTemplate,
  type TenantTypeKey,
} from "@/lib/whatsapp";

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

// ==================== WhatsApp Settings ====================

export async function getWhatsAppConfig() {
  try {
    const user = await requireTenantAdmin();
    const tenantId = user.tenantId!;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true, name: true, logoUrl: true, phone: true, type: true, slug: true },
    });

    if (!tenant) return { success: false, error: "Tenant not found" };

    const waSettings = getWhatsAppSettings((tenant.settings as Record<string, unknown>) || {});
    const todayCount = await getTodayMessageCount(tenantId);
    const availableTemplates = getTemplatesForTenantType(tenant.type as TenantTypeKey);

    return {
      success: true,
      data: {
        ...waSettings,
        tenantName: tenant.name,
        tenantLogoUrl: tenant.logoUrl,
        tenantPhone: tenant.phone,
        tenantType: tenant.type,
        tenantSlug: tenant.slug,
        todayMessageCount: todayCount,
        remainingQuota: Math.max(0, waSettings.dailyLimit - todayCount),
        availableTemplates: availableTemplates.map((t) => ({
          value: t,
          label: TEMPLATE_LABELS[t],
        })),
      },
    };
  } catch (error) {
    console.error("Get WhatsApp config error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to load config" };
  }
}

export async function updateWhatsAppConfig(data: {
  enabled?: boolean;
  sendFeeReminders?: boolean;
  sendAttendanceAlerts?: boolean;
  sendEventNotifications?: boolean;
  sendResultNotifications?: boolean;
  sendLibraryReminders?: boolean;
  dailyLimit?: number;
  defaultCountryCode?: string;
}) {
  try {
    const user = await requireTenantAdmin();
    const tenantId = user.tenantId!;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    const currentSettings = (tenant?.settings as Record<string, unknown>) || {};
    const currentWA = (currentSettings.whatsapp || {}) as Record<string, unknown>;

    const updatedWA = {
      ...currentWA,
      ...(data.enabled !== undefined && { enabled: data.enabled }),
      ...(data.sendFeeReminders !== undefined && { sendFeeReminders: data.sendFeeReminders }),
      ...(data.sendAttendanceAlerts !== undefined && { sendAttendanceAlerts: data.sendAttendanceAlerts }),
      ...(data.sendEventNotifications !== undefined && { sendEventNotifications: data.sendEventNotifications }),
      ...(data.sendResultNotifications !== undefined && { sendResultNotifications: data.sendResultNotifications }),
      ...(data.sendLibraryReminders !== undefined && { sendLibraryReminders: data.sendLibraryReminders }),
      ...(data.dailyLimit !== undefined && { dailyLimit: Math.min(data.dailyLimit, 5000) }),
      ...(data.defaultCountryCode !== undefined && { defaultCountryCode: data.defaultCountryCode }),
    };

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: { ...currentSettings, whatsapp: updatedWA },
      },
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "WHATSAPP_SETTINGS_UPDATED",
      entityType: "Tenant",
      entityId: tenantId,
      details: data,
    });

    revalidatePath("/dashboard/settings");
    return { success: true, message: "WhatsApp settings updated" };
  } catch (error) {
    console.error("Update WhatsApp config error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update settings" };
  }
}

// ==================== Send WhatsApp Notification (Admin) ====================

export async function sendWhatsAppNotification(data: {
  templateName: string;
  title: string;
  message: string;
  targetType: "ALL" | "CLASS" | "BATCH" | "ROLE";
  targetClassId?: string;
  targetBatchId?: string;
  targetRoles?: string[];
  variables?: Record<string, string>;
}) {
  try {
    const user = await requireTenantAdmin();
    const tenantId = user.tenantId!;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, logoUrl: true, slug: true, type: true, settings: true },
    });

    if (!tenant) return { success: false, error: "Tenant not found" };

    const waSettings = getWhatsAppSettings((tenant.settings as Record<string, unknown>) || {});
    if (!waSettings.enabled) {
      return { success: false, error: "WhatsApp notifications are not enabled. Enable them in Settings." };
    }

    // Validate template is available for this tenant type
    const availableTemplates = getTemplatesForTenantType(tenant.type as TenantTypeKey);
    const templateName = data.templateName as WhatsAppTemplate;
    if (!availableTemplates.includes(templateName)) {
      return { success: false, error: `Template "${data.templateName}" is not available for your institution type.` };
    }

    // Collect phone numbers based on target
    const recipients = await collectRecipientPhones(tenantId, {
      targetType: data.targetType,
      targetClassId: data.targetClassId,
      targetBatchId: data.targetBatchId,
      targetRoles: data.targetRoles,
      countryCode: waSettings.defaultCountryCode,
    });

    if (recipients.length === 0) {
      return { success: false, error: "No recipients with valid phone numbers found." };
    }

    // Build variables: use custom variables if provided, fallback to announcement style
    const variables: Record<string, string> = data.variables && Object.keys(data.variables).length > 0
      ? { ...data.variables, institute_name: tenant.name }
      : { title: data.title, message: data.message.substring(0, 900), institute_name: tenant.name };

    // Send via bulk WhatsApp with branding
    const result = await sendBulkWhatsApp({
      tenantId,
      templateName,
      recipients,
      headerImageUrl: tenant.logoUrl || undefined,
      variables,
      ctaButtons: tenant.slug
        ? [{ index: 0, subType: "url" as const, text: tenant.slug }]
        : undefined,
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "WHATSAPP_NOTIFICATION_SENT",
      entityType: "WhatsApp",
      entityId: `WA-${Date.now()}`,
      details: {
        templateName: data.templateName,
        targetType: data.targetType,
        recipientCount: recipients.length,
        sent: result.sent,
        failed: result.failed,
      },
    });

    return {
      success: true,
      data: {
        recipientCount: recipients.length,
        sent: result.sent,
        failed: result.failed,
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
    };
  } catch (error) {
    console.error("Send WhatsApp notification error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to send" };
  }
}

// ==================== Test WhatsApp Message ====================

export async function sendTestWhatsAppMessage(phone: string) {
  try {
    const user = await requireTenantAdmin();
    const tenantId = user.tenantId!;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, logoUrl: true, slug: true, settings: true },
    });

    if (!tenant) return { success: false, error: "Tenant not found" };

    const result = await sendWhatsAppMessage({
      tenantId,
      templateName: "welcome_message",
      recipientPhone: phone,
      recipientName: user.name || undefined,
      headerImageUrl: tenant.logoUrl || undefined,
      variables: {
        name: user.name || "Admin",
        institute_name: tenant.name,
        portal_link: `${process.env.NEXT_PUBLIC_APP_URL || "https://skolmatrixa.com"}/login`,
      },
      ctaButtons: tenant.slug
        ? [{ index: 0, subType: "url", text: tenant.slug }]
        : undefined,
    });

    return {
      success: result.success,
      message: result.success ? "Test message sent successfully!" : result.error,
    };
  } catch (error) {
    console.error("Test WhatsApp error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to send test" };
  }
}

// ==================== WhatsApp Logs ====================

export async function getWhatsAppLogs(filters?: {
  page?: number;
  pageSize?: number;
  status?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const user = await requireTenantAdmin();
    const tenantId = user.tenantId!;
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 25;

    const where: Record<string, unknown> = { tenantId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.category) {
      where.category = filters.category;
    }
    if (filters?.startDate || filters?.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (filters?.startDate) dateFilter.gte = new Date(filters.startDate);
      if (filters?.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
      where.createdAt = dateFilter;
    }

    const [logs, total] = await Promise.all([
      prisma.whatsAppLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.whatsAppLog.count({ where }),
    ]);

    return {
      success: true,
      data: logs.map((l) => ({
        id: l.id,
        templateName: l.templateName,
        recipientPhone: l.recipientPhone,
        recipientName: l.recipientName,
        status: l.status,
        category: l.category,
        errorMessage: l.errorMessage,
        createdAt: l.createdAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error("Get WhatsApp logs error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch logs" };
  }
}

// ==================== WhatsApp Stats ====================

export async function getWhatsAppStats() {
  try {
    const user = await requireTenantAdmin();
    const tenantId = user.tenantId!;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalAll, totalMonth, totalToday, statusBreakdown, categoryBreakdown] = await Promise.all([
      prisma.whatsAppLog.count({ where: { tenantId } }),
      prisma.whatsAppLog.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
      prisma.whatsAppLog.count({
        where: { tenantId, createdAt: { gte: startOfDay } },
      }),
      prisma.whatsAppLog.groupBy({
        by: ["status"],
        where: { tenantId, createdAt: { gte: startOfMonth } },
        _count: true,
      }),
      prisma.whatsAppLog.groupBy({
        by: ["category"],
        where: { tenantId, createdAt: { gte: startOfMonth } },
        _count: true,
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const s of statusBreakdown) {
      statusMap[s.status] = s._count;
    }

    const categoryMap: Record<string, number> = {};
    for (const c of categoryBreakdown) {
      if (c.category) categoryMap[c.category] = c._count;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    const waSettings = getWhatsAppSettings((tenant?.settings as Record<string, unknown>) || {});

    return {
      success: true,
      data: {
        totalAll,
        totalMonth,
        totalToday,
        dailyLimit: waSettings.dailyLimit,
        remainingToday: Math.max(0, waSettings.dailyLimit - totalToday),
        monthlyBreakdown: {
          sent: statusMap.SENT || 0,
          delivered: statusMap.DELIVERED || 0,
          read: statusMap.READ || 0,
          failed: statusMap.FAILED || 0,
        },
        categoryBreakdown: categoryMap,
      },
    };
  } catch (error) {
    console.error("Get WhatsApp stats error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to load stats" };
  }
}

// ==================== Helpers ====================

async function collectRecipientPhones(
  tenantId: string,
  options: {
    targetType: "ALL" | "CLASS" | "BATCH" | "ROLE";
    targetClassId?: string;
    targetBatchId?: string;
    targetRoles?: string[];
    countryCode?: string;
  }
): Promise<WhatsAppRecipient[]> {
  const recipients: WhatsAppRecipient[] = [];
  const seenPhones = new Set<string>();

  function addPhone(phone: string | null | undefined, name?: string) {
    if (!phone) return;
    const normalized = normalizePhone(phone, options.countryCode || "91");
    if (normalized && !seenPhones.has(normalized)) {
      seenPhones.add(normalized);
      recipients.push({ phone: normalized, name });
    }
  }

  if (options.targetType === "CLASS" && options.targetClassId) {
    const students = await prisma.student.findMany({
      where: { tenantId, status: "ACTIVE", classId: options.targetClassId },
      select: { phone: true, name: true, guardianPhone: true, guardianName: true },
    });
    for (const s of students) {
      addPhone(s.guardianPhone, s.guardianName || undefined);
      addPhone(s.phone, s.name);
    }
  } else if (options.targetType === "BATCH" && options.targetBatchId) {
    const students = await prisma.student.findMany({
      where: { tenantId, status: "ACTIVE", batchId: options.targetBatchId },
      select: { phone: true, name: true, guardianPhone: true, guardianName: true },
    });
    for (const s of students) {
      addPhone(s.guardianPhone, s.guardianName || undefined);
      addPhone(s.phone, s.name);
    }
  } else if (options.targetType === "ROLE" && options.targetRoles?.length) {
    const users = await prisma.user.findMany({
      where: { tenantId, isActive: true, role: { in: options.targetRoles as never[] } },
      select: { phone: true, name: true },
      take: 500,
    });
    for (const u of users) addPhone(u.phone, u.name);

    // Also get student/guardian phones if targeting STUDENT or PARENT
    if (options.targetRoles.includes("STUDENT") || options.targetRoles.includes("PARENT")) {
      const students = await prisma.student.findMany({
        where: { tenantId, status: "ACTIVE" },
        select: { phone: true, name: true, guardianPhone: true, guardianName: true },
      });
      for (const s of students) {
        if (options.targetRoles.includes("STUDENT")) addPhone(s.phone, s.name);
        if (options.targetRoles.includes("PARENT")) addPhone(s.guardianPhone, s.guardianName || undefined);
      }
    }
  } else {
    // ALL
    const [users, students] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId, isActive: true },
        select: { phone: true, name: true },
        take: 500,
      }),
      prisma.student.findMany({
        where: { tenantId, status: "ACTIVE" },
        select: { phone: true, name: true, guardianPhone: true, guardianName: true },
      }),
    ]);
    for (const u of users) addPhone(u.phone, u.name);
    for (const s of students) {
      addPhone(s.phone, s.name);
      addPhone(s.guardianPhone, s.guardianName || undefined);
    }
  }

  return recipients;
}

// ==================== Template Lookup ====================

export async function getAvailableTemplates() {
  try {
    const user = await requireTenantAdmin();
    const tenantId = user.tenantId!;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { type: true },
    });

    if (!tenant) return { success: false, error: "Tenant not found" };

    const templates = getTemplatesForTenantType(tenant.type as TenantTypeKey);
    return {
      success: true,
      data: templates.map((t) => ({
        value: t,
        label: TEMPLATE_LABELS[t],
      })),
    };
  } catch (error) {
    console.error("Get available templates error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to load templates" };
  }
}
