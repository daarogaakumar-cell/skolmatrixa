"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "./audit";
import { revalidatePath } from "next/cache";

async function requireEventManager() {
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

// ==================== Create Event ====================

export async function createEvent(data: {
  title: string;
  description?: string;
  eventType: string;
  startDate: string;
  endDate: string;
  isAllDay?: boolean;
  location?: string;
  targetRoles?: string[];
  classId?: string;
  batchId?: string;
  color?: string;
}) {
  try {
    const user = await requireEventManager();
    const tenantId = user.tenantId!;

    if (!data.title.trim()) {
      return { success: false, error: "Title is required" };
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end < start) {
      return { success: false, error: "End date must be after start date" };
    }

    const event = await prisma.event.create({
      data: {
        tenantId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        eventType: data.eventType as "HOLIDAY" | "EXAM" | "PTM" | "SPORTS" | "CULTURAL" | "MEETING" | "OTHER",
        startDate: start,
        endDate: end,
        isAllDay: data.isAllDay ?? true,
        location: data.location?.trim() || null,
        targetRoles: data.targetRoles || [],
        classId: data.classId || null,
        batchId: data.batchId || null,
        color: data.color || null,
        createdBy: user.id,
      },
    });

    await logAudit({
      userId: user.id,
      tenantId,
      action: "CREATE",
      entityType: "Event",
      entityId: event.id,
      details: { title: data.title, eventType: data.eventType },
    });

    revalidatePath("/dashboard/events");
    return { success: true, message: "Event created successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create event" };
  }
}

// ==================== Update Event ====================

export async function updateEvent(
  eventId: string,
  data: {
    title?: string;
    description?: string;
    eventType?: string;
    startDate?: string;
    endDate?: string;
    isAllDay?: boolean;
    location?: string;
    targetRoles?: string[];
    classId?: string | null;
    batchId?: string | null;
    color?: string | null;
  }
) {
  try {
    const user = await requireEventManager();
    const tenantId = user.tenantId!;

    const existing = await prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!existing) {
      return { success: false, error: "Event not found" };
    }

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.eventType !== undefined) updateData.eventType = data.eventType;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.isAllDay !== undefined) updateData.isAllDay = data.isAllDay;
    if (data.location !== undefined) updateData.location = data.location?.trim() || null;
    if (data.targetRoles !== undefined) updateData.targetRoles = data.targetRoles;
    if (data.classId !== undefined) updateData.classId = data.classId || null;
    if (data.batchId !== undefined) updateData.batchId = data.batchId || null;
    if (data.color !== undefined) updateData.color = data.color || null;

    await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

    await logAudit({
      userId: user.id,
      tenantId,
      action: "UPDATE",
      entityType: "Event",
      entityId: eventId,
      details: data,
    });

    revalidatePath("/dashboard/events");
    return { success: true, message: "Event updated successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to update event" };
  }
}

// ==================== Delete Event ====================

export async function deleteEvent(eventId: string) {
  try {
    const user = await requireEventManager();
    const tenantId = user.tenantId!;

    const event = await prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) {
      return { success: false, error: "Event not found" };
    }

    await prisma.event.delete({ where: { id: eventId } });

    await logAudit({
      userId: user.id,
      tenantId,
      action: "DELETE",
      entityType: "Event",
      entityId: eventId,
      details: { title: event.title },
    });

    revalidatePath("/dashboard/events");
    return { success: true, message: "Event deleted successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete event" };
  }
}

// ==================== Get Events (Calendar Data) ====================

export async function getEvents(filters?: {
  month?: number;
  year?: number;
  eventType?: string;
}) {
  try {
    const user = await requireTenantUser();
    const tenantId = user.tenantId!;

    const now = new Date();
    const month = filters?.month ?? now.getMonth();
    const year = filters?.year ?? now.getFullYear();

    // Get events for the month (with overlap into previous/next for calendar display)
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const where: Record<string, unknown> = {
      tenantId,
      OR: [
        { startDate: { gte: startOfMonth, lte: endOfMonth } },
        { endDate: { gte: startOfMonth, lte: endOfMonth } },
        { AND: [{ startDate: { lte: startOfMonth } }, { endDate: { gte: endOfMonth } }] },
      ],
    };

    if (filters?.eventType && filters.eventType !== "ALL") {
      where.eventType = filters.eventType;
    }

    // For non-admin roles, filter by target roles
    if (!["TENANT_ADMIN", "VICE_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      where.OR = [
        { targetRoles: { isEmpty: true } },
        { targetRoles: { has: user.role } },
        ...(Array.isArray(where.OR) ? where.OR : []),
      ];
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        class: { select: { name: true } },
        batch: { select: { name: true } },
        creator: { select: { name: true } },
      },
      orderBy: { startDate: "asc" },
    });

    return {
      success: true,
      data: events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        eventType: e.eventType,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate.toISOString(),
        isAllDay: e.isAllDay,
        location: e.location,
        targetRoles: e.targetRoles,
        className: e.class?.name || null,
        batchName: e.batch?.name || null,
        createdByName: e.creator?.name || null,
        color: e.color,
      })),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to load events" };
  }
}

// ==================== Get Upcoming Events ====================

export async function getUpcomingEvents(limit = 10) {
  try {
    const user = await requireTenantUser();
    const tenantId = user.tenantId!;

    const now = new Date();
    const where: Record<string, unknown> = {
      tenantId,
      endDate: { gte: now },
    };

    if (!["TENANT_ADMIN", "VICE_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      where.OR = [
        { targetRoles: { isEmpty: true } },
        { targetRoles: { has: user.role } },
      ];
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: "asc" },
      take: limit,
      select: {
        id: true,
        title: true,
        eventType: true,
        startDate: true,
        endDate: true,
        isAllDay: true,
        location: true,
        color: true,
      },
    });

    return {
      success: true,
      data: events.map((e) => ({
        ...e,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate.toISOString(),
      })),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to load events" };
  }
}

// ==================== Get Event Filter Options ====================

export async function getEventFilterOptions() {
  try {
    const user = await requireEventManager();
    const tenantId = user.tenantId!;

    const [classes, batches] = await Promise.all([
      prisma.class.findMany({
        where: { tenantId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.batch.findMany({
        where: { tenantId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return { success: true, data: { classes, batches } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to load options" };
  }
}
