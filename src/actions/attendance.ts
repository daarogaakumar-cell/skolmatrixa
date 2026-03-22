"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "./audit";
import { revalidatePath } from "next/cache";

async function requireAttendanceMarker() {
  const session = await auth();
  if (!session?.user || !session.user.tenantId) {
    throw new Error("Unauthorized");
  }
  if (!["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"].includes(session.user.role)) {
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

// ==================== Get Students For Attendance ====================

export async function getStudentsForAttendance(classId?: string, batchId?: string) {
  const user = await requireAttendanceMarker();
  const tenantId = user.tenantId!;

  if (!classId && !batchId) {
    return { success: false, error: "Class or batch is required" };
  }

  const where: Record<string, unknown> = {
    tenantId,
    status: "ACTIVE",
  };
  if (classId) where.classId = classId;
  if (batchId) where.batchId = batchId;

  const students = await prisma.student.findMany({
    where,
    select: {
      id: true,
      name: true,
      rollNo: true,
      admissionNo: true,
      photoUrl: true,
    },
    orderBy: [{ rollNo: "asc" }, { name: "asc" }],
  });

  return { success: true, data: students };
}

// ==================== Get Attendance By Date ====================

export async function getAttendanceByDate(
  classId: string | undefined,
  batchId: string | undefined,
  date: string
) {
  const user = await requireAttendanceMarker();
  const tenantId = user.tenantId!;

  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  const nextDay = new Date(dateObj);
  nextDay.setDate(nextDay.getDate() + 1);

  const where: Record<string, unknown> = {
    tenantId,
    date: {
      gte: dateObj,
      lt: nextDay,
    },
  };
  if (classId) where.classId = classId;
  if (batchId) where.batchId = batchId;

  const records = await prisma.attendance.findMany({
    where,
    select: {
      id: true,
      studentId: true,
      status: true,
      remarks: true,
    },
  });

  return { success: true, data: records };
}

// ==================== Mark Attendance ====================

export async function markAttendance(data: {
  classId?: string;
  batchId?: string;
  date: string;
  records: Array<{
    studentId: string;
    status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "EXCUSED";
    remarks?: string;
  }>;
}) {
  const user = await requireAttendanceMarker();
  const tenantId = user.tenantId!;

  if (!data.classId && !data.batchId) {
    return { success: false, error: "Class or batch is required" };
  }
  if (!data.records || data.records.length === 0) {
    return { success: false, error: "No attendance records provided" };
  }

  const dateObj = new Date(data.date);
  dateObj.setHours(0, 0, 0, 0);

  // Cannot mark for future dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dateObj > today) {
    return { success: false, error: "Cannot mark attendance for future dates" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const record of data.records) {
        await tx.attendance.upsert({
          where: {
            tenantId_studentId_date: {
              tenantId,
              studentId: record.studentId,
              date: dateObj,
            },
          },
          update: {
            status: record.status,
            remarks: record.remarks || null,
            classId: data.classId || null,
            batchId: data.batchId || null,
            markedBy: user.id,
          },
          create: {
            tenantId,
            studentId: record.studentId,
            classId: data.classId || null,
            batchId: data.batchId || null,
            date: dateObj,
            status: record.status,
            remarks: record.remarks || null,
            markedBy: user.id,
          },
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
      action: "ATTENDANCE_MARKED",
      entityType: "Attendance",
      entityId: data.classId || data.batchId || "",
      details: {
        date: data.date,
        target: targetLabel,
        totalStudents: data.records.length,
        present: data.records.filter((r) => r.status === "PRESENT").length,
        absent: data.records.filter((r) => r.status === "ABSENT").length,
      },
    });

    revalidatePath("/dashboard/attendance");
    return {
      success: true,
      message: `Attendance saved for ${targetLabel}, ${new Date(data.date).toLocaleDateString()}`,
    };
  } catch (error) {
    console.error("Mark attendance error:", error);
    return { success: false, error: "Failed to save attendance" };
  }
}

// ==================== Get Classes/Batches For Teacher ====================

export async function getTeacherClassesAndBatches() {
  const user = await requireAttendanceMarker();
  const tenantId = user.tenantId!;

  // Get current academic year
  const currentYear = await prisma.academicYear.findFirst({
    where: { tenantId, isCurrent: true },
  });
  if (!currentYear) {
    return { success: true, data: { classes: [], batches: [] } };
  }

  // For Admin/Vice Admin, return all classes/batches
  if (["TENANT_ADMIN", "VICE_ADMIN"].includes(user.role)) {
    const [classes, batches] = await Promise.all([
      prisma.class.findMany({
        where: { tenantId, academicYearId: currentYear.id },
        select: { id: true, name: true, section: true },
        orderBy: { name: "asc" },
      }),
      prisma.batch.findMany({
        where: { tenantId, academicYearId: currentYear.id },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);
    return { success: true, data: { classes, batches } };
  }

  // For teachers, return only assigned classes/batches
  const [classes, batches] = await Promise.all([
    prisma.class.findMany({
      where: { tenantId, academicYearId: currentYear.id, classTeacherId: user.id },
      select: { id: true, name: true, section: true },
      orderBy: { name: "asc" },
    }),
    prisma.batch.findMany({
      where: { tenantId, academicYearId: currentYear.id, facultyId: user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { success: true, data: { classes, batches } };
}

// ==================== Attendance Reports ====================

export async function getAttendanceReport(params: {
  classId?: string;
  batchId?: string;
  startDate: string;
  endDate: string;
}) {
  const user = await requireAttendanceMarker();
  const tenantId = user.tenantId!;

  const startDateObj = new Date(params.startDate);
  startDateObj.setHours(0, 0, 0, 0);
  const endDateObj = new Date(params.endDate);
  endDateObj.setHours(23, 59, 59, 999);

  // Get students for this class/batch
  const studentWhere: Record<string, unknown> = { tenantId, status: "ACTIVE" };
  if (params.classId) studentWhere.classId = params.classId;
  if (params.batchId) studentWhere.batchId = params.batchId;

  const students = await prisma.student.findMany({
    where: studentWhere,
    select: { id: true, name: true, rollNo: true, admissionNo: true },
    orderBy: [{ rollNo: "asc" }, { name: "asc" }],
  });

  // Get attendance records
  const attendanceWhere: Record<string, unknown> = {
    tenantId,
    date: { gte: startDateObj, lte: endDateObj },
  };
  if (params.classId) attendanceWhere.classId = params.classId;
  if (params.batchId) attendanceWhere.batchId = params.batchId;

  const records = await prisma.attendance.findMany({
    where: attendanceWhere,
    select: {
      studentId: true,
      date: true,
      status: true,
    },
    orderBy: { date: "asc" },
  });

  // Build a map: studentId -> { date -> status }
  const attendanceMap: Record<string, Record<string, string>> = {};
  for (const record of records) {
    if (!attendanceMap[record.studentId]) {
      attendanceMap[record.studentId] = {};
    }
    const dateKey = record.date.toISOString().split("T")[0];
    attendanceMap[record.studentId][dateKey] = record.status;
  }

  // Generate date list
  const dates: string[] = [];
  const current = new Date(startDateObj);
  while (current <= endDateObj) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return {
    success: true,
    data: {
      students,
      dates,
      attendanceMap,
    },
  };
}

// ==================== Student Attendance (Calendar) ====================

export async function getStudentAttendance(studentId: string, month: number, year: number) {
  const user = await requireTenantUser();
  const tenantId = user.tenantId!;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const records = await prisma.attendance.findMany({
    where: {
      tenantId,
      studentId,
      date: { gte: startDate, lte: endDate },
    },
    select: {
      date: true,
      status: true,
      remarks: true,
    },
    orderBy: { date: "asc" },
  });

  // Calculate summary
  const summary = {
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    excused: 0,
    total: records.length,
    percentage: 0,
  };

  for (const r of records) {
    switch (r.status) {
      case "PRESENT":
        summary.present++;
        break;
      case "ABSENT":
        summary.absent++;
        break;
      case "LATE":
        summary.late++;
        break;
      case "HALF_DAY":
        summary.halfDay++;
        break;
      case "EXCUSED":
        summary.excused++;
        break;
    }
  }

  if (summary.total > 0) {
    summary.percentage = Math.round(
      ((summary.present + summary.late + summary.halfDay * 0.5) / summary.total) * 100
    );
  }

  return {
    success: true,
    data: {
      records: records.map((r) => ({
        date: r.date.toISOString().split("T")[0],
        status: r.status,
        remarks: r.remarks,
      })),
      summary,
    },
  };
}

// ==================== Attendance Summary ====================

export async function getAttendanceSummary(params: {
  classId?: string;
  batchId?: string;
  month: number;
  year: number;
}) {
  const user = await requireAttendanceMarker();
  const tenantId = user.tenantId!;

  const startDate = new Date(params.year, params.month - 1, 1);
  const endDate = new Date(params.year, params.month, 0, 23, 59, 59, 999);

  // Get students
  const studentWhere: Record<string, unknown> = { tenantId, status: "ACTIVE" };
  if (params.classId) studentWhere.classId = params.classId;
  if (params.batchId) studentWhere.batchId = params.batchId;

  const students = await prisma.student.findMany({
    where: studentWhere,
    select: { id: true, name: true, rollNo: true },
    orderBy: [{ rollNo: "asc" }, { name: "asc" }],
  });

  // Get attendance
  const attendanceWhere: Record<string, unknown> = {
    tenantId,
    date: { gte: startDate, lte: endDate },
  };
  if (params.classId) attendanceWhere.classId = params.classId;
  if (params.batchId) attendanceWhere.batchId = params.batchId;

  const records = await prisma.attendance.findMany({
    where: attendanceWhere,
    select: { studentId: true, status: true },
  });

  // Aggregate per student
  const statsMap: Record<string, { present: number; absent: number; late: number; halfDay: number; excused: number; total: number }> = {};
  for (const r of records) {
    if (!statsMap[r.studentId]) {
      statsMap[r.studentId] = { present: 0, absent: 0, late: 0, halfDay: 0, excused: 0, total: 0 };
    }
    statsMap[r.studentId].total++;
    switch (r.status) {
      case "PRESENT": statsMap[r.studentId].present++; break;
      case "ABSENT": statsMap[r.studentId].absent++; break;
      case "LATE": statsMap[r.studentId].late++; break;
      case "HALF_DAY": statsMap[r.studentId].halfDay++; break;
      case "EXCUSED": statsMap[r.studentId].excused++; break;
    }
  }

  const summary = students.map((s) => {
    const st = statsMap[s.id] || { present: 0, absent: 0, late: 0, halfDay: 0, excused: 0, total: 0 };
    const effectivePresent = st.present + st.late + st.halfDay * 0.5;
    const percentage = st.total > 0 ? Math.round((effectivePresent / st.total) * 100) : 0;
    return {
      studentId: s.id,
      studentName: s.name,
      rollNo: s.rollNo,
      ...st,
      percentage,
    };
  });

  return { success: true, data: summary };
}

// ==================== Today's Attendance Stats (Dashboard) ====================

export async function getTodayAttendanceStats() {
  const user = await requireTenantUser();
  const tenantId = user.tenantId!;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalStudents, attendanceToday] = await Promise.all([
    prisma.student.count({ where: { tenantId, status: "ACTIVE" } }),
    prisma.attendance.findMany({
      where: { tenantId, date: { gte: today, lt: tomorrow } },
      select: { status: true, classId: true, batchId: true },
    }),
  ]);

  const present = attendanceToday.filter((a) => a.status === "PRESENT").length;
  const absent = attendanceToday.filter((a) => a.status === "ABSENT").length;
  const late = attendanceToday.filter((a) => a.status === "LATE").length;
  const marked = attendanceToday.length;

  // Count unique classes/batches marked
  const markedClassIds = new Set(attendanceToday.filter((a) => a.classId).map((a) => a.classId));
  const markedBatchIds = new Set(attendanceToday.filter((a) => a.batchId).map((a) => a.batchId));

  // Get total classes/batches
  const currentYear = await prisma.academicYear.findFirst({
    where: { tenantId, isCurrent: true },
  });

  let totalClasses = 0;
  let totalBatches = 0;
  if (currentYear) {
    [totalClasses, totalBatches] = await Promise.all([
      prisma.class.count({ where: { tenantId, academicYearId: currentYear.id } }),
      prisma.batch.count({ where: { tenantId, academicYearId: currentYear.id } }),
    ]);
  }

  const classesNotMarked = totalClasses - markedClassIds.size;
  const batchesNotMarked = totalBatches - markedBatchIds.size;

  return {
    success: true,
    data: {
      totalStudents,
      present,
      absent,
      late,
      marked,
      notMarked: totalStudents - marked,
      classesNotMarked: Math.max(0, classesNotMarked),
      batchesNotMarked: Math.max(0, batchesNotMarked),
      percentage: marked > 0 ? Math.round((present / marked) * 100) : 0,
    },
  };
}
