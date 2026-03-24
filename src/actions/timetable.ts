"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "./audit";
import { revalidatePath } from "next/cache";

function normalizeTimeValue(value: string): string | null {
  const normalized = value.trim().replace(/\s+/g, "").replace(/\./g, ":");

  if (/^\d{1,2}$/.test(normalized)) {
    const hours = Number(normalized);
    if (hours >= 0 && hours <= 23) {
      return `${String(hours).padStart(2, "0")}:00`;
    }
    return null;
  }

  if (/^\d{3,4}$/.test(normalized)) {
    const hours = Number(normalized.slice(0, -2));
    const minutes = Number(normalized.slice(-2));
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
    return null;
  }

  const match = normalized.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

async function requireTimetableManager() {
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

// ==================== Get Timetable ====================

export async function getTimetable(classId?: string, batchId?: string) {
  const user = await requireTenantUser();
  const tenantId = user.tenantId!;

  const currentYear = await prisma.academicYear.findFirst({
    where: { tenantId, isCurrent: true },
  });
  if (!currentYear) {
    return { success: true, data: [] };
  }

  const where: Record<string, unknown> = {
    tenantId,
    academicYearId: currentYear.id,
  };
  if (classId) where.classId = classId;
  if (batchId) where.batchId = batchId;

  const entries = await prisma.timetableEntry.findMany({
    where,
    include: {
      subject: { select: { id: true, name: true, code: true } },
      teacher: { select: { id: true, name: true } },
      class: { select: { id: true, name: true, section: true } },
      batch: { select: { id: true, name: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return { success: true, data: entries };
}

// ==================== Get Teacher Timetable ====================

export async function getTeacherTimetable(teacherId?: string) {
  const user = await requireTenantUser();
  const tenantId = user.tenantId!;

  const targetTeacherId = teacherId || user.id;

  const currentYear = await prisma.academicYear.findFirst({
    where: { tenantId, isCurrent: true },
  });
  if (!currentYear) {
    return { success: true, data: [] };
  }

  const entries = await prisma.timetableEntry.findMany({
    where: {
      tenantId,
      academicYearId: currentYear.id,
      teacherId: targetTeacherId,
    },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      teacher: { select: { id: true, name: true } },
      class: { select: { id: true, name: true, section: true } },
      batch: { select: { id: true, name: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return { success: true, data: entries };
}

// ==================== Save Timetable ====================

export async function saveTimetable(data: {
  classId?: string;
  batchId?: string;
  entries: Array<{
    subjectId: string;
    teacherId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string;
  }>;
}) {
  const user = await requireTimetableManager();
  const tenantId = user.tenantId!;

  if (!data.classId && !data.batchId) {
    return { success: false, error: "Class or batch is required" };
  }

  const currentYear = await prisma.academicYear.findFirst({
    where: { tenantId, isCurrent: true },
  });
  if (!currentYear) {
    return { success: false, error: "No current academic year found" };
  }

  const normalizedEntries = data.entries.map((entry) => {
    const startTime = normalizeTimeValue(entry.startTime);
    const endTime = normalizeTimeValue(entry.endTime);

    if (!startTime || !endTime) {
      throw new Error("Invalid time format. Use HH:MM.");
    }

    if (toMinutes(startTime) >= toMinutes(endTime)) {
      throw new Error("End time must be after start time.");
    }

    return {
      ...entry,
      startTime,
      endTime,
    };
  });

  try {
    // Check for teacher conflicts
    const conflicts = await checkTeacherConflicts(tenantId, currentYear.id, normalizedEntries, data.classId, data.batchId);
    if (conflicts.length > 0) {
      return {
        success: false,
        error: "Teacher scheduling conflicts detected",
        data: conflicts,
      };
    }

    await prisma.$transaction(async (tx) => {
      // Delete existing entries for this class/batch
      const deleteWhere: Record<string, unknown> = {
        tenantId,
        academicYearId: currentYear.id,
      };
      if (data.classId) deleteWhere.classId = data.classId;
      if (data.batchId) deleteWhere.batchId = data.batchId;

      await tx.timetableEntry.deleteMany({ where: deleteWhere });

      // Create new entries
      if (normalizedEntries.length > 0) {
        await tx.timetableEntry.createMany({
          data: normalizedEntries.map((entry) => ({
            tenantId,
            academicYearId: currentYear.id,
            classId: data.classId || null,
            batchId: data.batchId || null,
            subjectId: entry.subjectId,
            teacherId: entry.teacherId,
            dayOfWeek: entry.dayOfWeek,
            startTime: entry.startTime,
            endTime: entry.endTime,
            room: entry.room || null,
          })),
        });
      }
    });

    // Determine label for audit
    let targetLabel = "";
    if (data.classId) {
      const cls = await prisma.class.findUnique({
        where: { id: data.classId },
        select: { name: true, section: true },
      });
      targetLabel = cls ? `${cls.name}${cls.section ? `-${cls.section}` : ""}` : data.classId;
    } else if (data.batchId) {
      const batch = await prisma.batch.findUnique({
        where: { id: data.batchId },
        select: { name: true },
      });
      targetLabel = batch?.name || data.batchId;
    }

    await logAudit({
      userId: user.id,
      tenantId,
      action: "TIMETABLE_SAVED",
      entityType: "TimetableEntry",
      entityId: data.classId || data.batchId || "",
      details: {
        target: targetLabel,
        entriesCount: normalizedEntries.length,
      },
    });

    revalidatePath("/dashboard/timetable");
    return {
      success: true,
      message: `Timetable saved for ${targetLabel}`,
    };
  } catch (error) {
    console.error("Save timetable error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save timetable",
    };
  }
}

// ==================== Check Teacher Conflicts ====================

async function checkTeacherConflicts(
  tenantId: string,
  academicYearId: string,
  entries: Array<{
    teacherId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>,
  excludeClassId?: string,
  excludeBatchId?: string
) {
  const conflicts: Array<{
    teacherName: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    conflictWith: string;
  }> = [];

  // Group by teacher and day without serializing keys back into strings.
  const teacherDays = new Map<string, Map<number, typeof entries>>();
  for (const entry of entries) {
    if (!Number.isInteger(entry.dayOfWeek) || entry.dayOfWeek < 1 || entry.dayOfWeek > 7) {
      throw new Error(`Invalid day of week: ${entry.dayOfWeek}`);
    }

    if (!teacherDays.has(entry.teacherId)) {
      teacherDays.set(entry.teacherId, new Map<number, typeof entries>());
    }

    const teacherDayMap = teacherDays.get(entry.teacherId)!;
    if (!teacherDayMap.has(entry.dayOfWeek)) {
      teacherDayMap.set(entry.dayOfWeek, []);
    }

    teacherDayMap.get(entry.dayOfWeek)!.push(entry);
  }

  for (const [teacherId, dayMap] of teacherDays) {
    for (const [dayOfWeek, teacherEntries] of dayMap) {

      // Get existing entries for this teacher on this day (excluding current class/batch)
      const existingWhere: Record<string, unknown> = {
        tenantId,
        academicYearId,
        teacherId,
        dayOfWeek,
      };

      // Exclude the class/batch we're saving (since we'll delete those first)
      if (excludeClassId) {
        existingWhere.classId = { not: excludeClassId };
      }
      if (excludeBatchId) {
        existingWhere.batchId = { not: excludeBatchId };
      }

      const existingEntries = await prisma.timetableEntry.findMany({
        where: existingWhere,
        include: {
          teacher: { select: { name: true } },
          class: { select: { name: true, section: true } },
          batch: { select: { name: true } },
        },
      });

      for (const newEntry of teacherEntries) {
        for (const existing of existingEntries) {
          // Check time overlap
          if (timesOverlap(newEntry.startTime, newEntry.endTime, existing.startTime, existing.endTime)) {
            const conflictTarget = existing.class
              ? `${existing.class.name}${existing.class.section ? `-${existing.class.section}` : ""}`
              : existing.batch?.name || "Unknown";

            conflicts.push({
              teacherName: existing.teacher.name,
              dayOfWeek: newEntry.dayOfWeek,
              startTime: newEntry.startTime,
              endTime: newEntry.endTime,
              conflictWith: conflictTarget,
            });
          }
        }
      }
    }
  }

  return conflicts;
}

function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);
  return s1 < e2 && s2 < e1;
}

// ==================== Check Single Teacher Conflict ====================

export async function checkTeacherConflict(params: {
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  excludeClassId?: string;
  excludeBatchId?: string;
}) {
  const user = await requireTimetableManager();
  const tenantId = user.tenantId!;

  const startTime = normalizeTimeValue(params.startTime);
  const endTime = normalizeTimeValue(params.endTime);
  if (!startTime || !endTime || toMinutes(startTime) >= toMinutes(endTime)) {
    return { success: false, error: "Invalid time range" };
  }

  const currentYear = await prisma.academicYear.findFirst({
    where: { tenantId, isCurrent: true },
  });
  if (!currentYear) {
    return { success: true, data: { hasConflict: false } };
  }

  const where: Record<string, unknown> = {
    tenantId,
    academicYearId: currentYear.id,
    teacherId: params.teacherId,
    dayOfWeek: params.dayOfWeek,
  };

  if (params.excludeClassId) {
    where.classId = { not: params.excludeClassId };
  }
  if (params.excludeBatchId) {
    where.batchId = { not: params.excludeBatchId };
  }

  const existingEntries = await prisma.timetableEntry.findMany({
    where,
    include: {
      class: { select: { name: true, section: true } },
      batch: { select: { name: true } },
    },
  });

  for (const existing of existingEntries) {
    if (timesOverlap(startTime, endTime, existing.startTime, existing.endTime)) {
      const conflictTarget = existing.class
        ? `${existing.class.name}${existing.class.section ? `-${existing.class.section}` : ""}`
        : existing.batch?.name || "Unknown";
      return {
        success: true,
        data: { hasConflict: true, conflictWith: conflictTarget },
      };
    }
  }

  return { success: true, data: { hasConflict: false } };
}

// ==================== Copy Timetable ====================

export async function copyTimetable(fromClassId: string | undefined, fromBatchId: string | undefined, toClassId: string | undefined, toBatchId: string | undefined) {
  const user = await requireTimetableManager();
  const tenantId = user.tenantId!;

  const currentYear = await prisma.academicYear.findFirst({
    where: { tenantId, isCurrent: true },
  });
  if (!currentYear) {
    return { success: false, error: "No current academic year found" };
  }

  const sourceWhere: Record<string, unknown> = {
    tenantId,
    academicYearId: currentYear.id,
  };
  if (fromClassId) sourceWhere.classId = fromClassId;
  if (fromBatchId) sourceWhere.batchId = fromBatchId;

  const sourceEntries = await prisma.timetableEntry.findMany({
    where: sourceWhere,
    select: {
      subjectId: true,
      teacherId: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      room: true,
    },
  });

  if (sourceEntries.length === 0) {
    return { success: false, error: "No timetable entries found to copy" };
  }

  // Delete existing target entries
  const deleteWhere: Record<string, unknown> = {
    tenantId,
    academicYearId: currentYear.id,
  };
  if (toClassId) deleteWhere.classId = toClassId;
  if (toBatchId) deleteWhere.batchId = toBatchId;

  await prisma.$transaction(async (tx) => {
    await tx.timetableEntry.deleteMany({ where: deleteWhere });
    await tx.timetableEntry.createMany({
      data: sourceEntries.map((entry) => ({
        tenantId,
        academicYearId: currentYear.id,
        classId: toClassId || null,
        batchId: toBatchId || null,
        subjectId: entry.subjectId,
        teacherId: entry.teacherId,
        dayOfWeek: entry.dayOfWeek,
        startTime: entry.startTime,
        endTime: entry.endTime,
        room: entry.room,
      })),
    });
  });

  revalidatePath("/dashboard/timetable");
  return { success: true, message: "Timetable copied successfully" };
}

// ==================== Get Teachers For Dropdown ====================

export async function getTeachersForTimetable() {
  const user = await requireTenantUser();
  const tenantId = user.tenantId!;

  const teachers = await prisma.user.findMany({
    where: {
      tenantId,
      role: { in: ["TEACHER", "VICE_ADMIN", "TENANT_ADMIN"] },
      isActive: true,
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return { success: true, data: teachers };
}

// ==================== Get Subjects For Dropdown ====================

export async function getSubjectsForTimetable(classId?: string, batchId?: string) {
  const user = await requireTenantUser();
  const tenantId = user.tenantId!;

  const where: Record<string, unknown> = { tenantId };
  if (classId) where.classId = classId;
  if (batchId) where.batchId = batchId;

  const subjects = await prisma.subject.findMany({
    where,
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  return { success: true, data: subjects };
}

// ==================== Today's Schedule For Teacher ====================

export async function getTodaySchedule() {
  const user = await requireTenantUser();
  const tenantId = user.tenantId!;

  const currentYear = await prisma.academicYear.findFirst({
    where: { tenantId, isCurrent: true },
  });
  if (!currentYear) {
    return { success: true, data: [] };
  }

  // Get day of week (1 = Monday, 7 = Sunday)
  const today = new Date();
  const jsDay = today.getDay(); // 0 = Sunday
  const dayOfWeek = jsDay === 0 ? 7 : jsDay;

  const entries = await prisma.timetableEntry.findMany({
    where: {
      tenantId,
      academicYearId: currentYear.id,
      teacherId: user.id,
      dayOfWeek,
    },
    include: {
      subject: { select: { name: true, code: true } },
      class: { select: { name: true, section: true } },
      batch: { select: { name: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return {
    success: true,
    data: entries.map((e) => ({
      id: e.id,
      subject: e.subject.name,
      subjectCode: e.subject.code,
      className: e.class ? `${e.class.name}${e.class.section ? `-${e.class.section}` : ""}` : e.batch?.name || "",
      startTime: e.startTime,
      endTime: e.endTime,
      room: e.room,
    })),
  };
}
