"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ==================== Auth Helpers ====================

async function requireStudentOrParent() {
  const session = await auth();
  if (!session?.user || !session.user.tenantId) {
    throw new Error("Unauthorized");
  }
  if (!["STUDENT", "PARENT"].includes(session.user.role)) {
    throw new Error("Insufficient permissions");
  }
  return session.user;
}

// ==================== Get My Student Profile ====================

export async function getMyStudentProfile(childId?: string) {
  try {
    const user = await requireStudentOrParent();
    const tenantId = user.tenantId!;

    const where: Record<string, unknown> = { tenantId, status: "ACTIVE" };

    if (user.role === "STUDENT") {
      where.userId = user.id;
    } else if (user.role === "PARENT") {
      if (childId) {
        where.id = childId;
        where.parentUserId = user.id;
      } else {
        where.parentUserId = user.id;
      }
    }

    const student = await prisma.student.findFirst({
      where,
      select: {
        id: true,
        name: true,
        rollNo: true,
        admissionNo: true,
        email: true,
        phone: true,
        classId: true,
        batchId: true,
        class: { select: { id: true, name: true, section: true } },
        batch: { select: { id: true, name: true } },
      },
    });

    return { success: true, data: student };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch profile" };
  }
}

// ==================== Get Parent's Children ====================

export async function getParentChildren() {
  try {
    const user = await requireStudentOrParent();
    if (user.role !== "PARENT") {
      return { success: true, data: [] };
    }

    const children = await prisma.student.findMany({
      where: { tenantId: user.tenantId!, parentUserId: user.id, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        rollNo: true,
        class: { select: { name: true, section: true } },
        batch: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: children };
  } catch {
    return { success: false, data: [] };
  }
}

// ==================== Get My Timetable ====================

export async function getMyTimetable(childId?: string) {
  try {
    const user = await requireStudentOrParent();
    const tenantId = user.tenantId!;

    // Get the student profile to find class/batch
    const where: Record<string, unknown> = { tenantId, status: "ACTIVE" };
    if (user.role === "STUDENT") {
      where.userId = user.id;
    } else {
      where.parentUserId = user.id;
      if (childId) where.id = childId;
    }

    const student = await prisma.student.findFirst({
      where,
      select: { classId: true, batchId: true },
    });

    if (!student) return { success: true, data: [] };

    const academicYear = await prisma.academicYear.findFirst({
      where: { tenantId, isCurrent: true },
    });

    if (!academicYear) return { success: true, data: [] };

    const timetableWhere: Record<string, unknown> = {
      tenantId,
      academicYearId: academicYear.id,
    };

    if (student.classId) timetableWhere.classId = student.classId;
    if (student.batchId) timetableWhere.batchId = student.batchId;

    const entries = await prisma.timetableEntry.findMany({
      where: timetableWhere,
      include: {
        subject: { select: { name: true, code: true } },
        teacher: { select: { name: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return {
      success: true,
      data: entries.map((e) => ({
        id: e.id,
        dayOfWeek: e.dayOfWeek,
        startTime: e.startTime,
        endTime: e.endTime,
        room: e.room,
        subject: e.subject.name,
        subjectCode: e.subject.code,
        teacher: e.teacher.name,
      })),
    };
  } catch {
    return { success: false, error: "Failed to fetch timetable", data: [] };
  }
}

// ==================== Get My Attendance ====================

export async function getMyAttendance(month: number, year: number, childId?: string) {
  try {
    const user = await requireStudentOrParent();
    const tenantId = user.tenantId!;

    const where: Record<string, unknown> = { tenantId, status: "ACTIVE" };
    if (user.role === "STUDENT") {
      where.userId = user.id;
    } else {
      where.parentUserId = user.id;
      if (childId) where.id = childId;
    }

    const student = await prisma.student.findFirst({
      where,
      select: { id: true },
    });

    if (!student) return { success: true, data: { records: [], summary: { present: 0, absent: 0, late: 0, halfDay: 0, excused: 0, total: 0, percentage: 0 } } };

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const records = await prisma.attendance.findMany({
      where: {
        tenantId,
        studentId: student.id,
        date: { gte: startDate, lte: endDate },
      },
      select: { date: true, status: true, remarks: true },
      orderBy: { date: "asc" },
    });

    const summary = { present: 0, absent: 0, late: 0, halfDay: 0, excused: 0, total: records.length, percentage: 0 };

    for (const r of records) {
      switch (r.status) {
        case "PRESENT": summary.present++; break;
        case "ABSENT": summary.absent++; break;
        case "LATE": summary.late++; break;
        case "HALF_DAY": summary.halfDay++; break;
        case "EXCUSED": summary.excused++; break;
      }
    }

    if (summary.total > 0) {
      summary.percentage = Math.round(((summary.present + summary.late + summary.halfDay * 0.5) / summary.total) * 100);
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
  } catch {
    return { success: false, error: "Failed to fetch attendance" };
  }
}

// ==================== Get Student Dashboard Data ====================

export async function getStudentDashboardData(childId?: string) {
  try {
    const user = await requireStudentOrParent();
    const tenantId = user.tenantId!;

    // Get student profile
    const where: Record<string, unknown> = { tenantId, status: "ACTIVE" };
    if (user.role === "STUDENT") {
      where.userId = user.id;
    } else {
      where.parentUserId = user.id;
      if (childId) where.id = childId;
    }

    const student = await prisma.student.findFirst({
      where,
      select: {
        id: true,
        name: true,
        classId: true,
        batchId: true,
        class: { select: { name: true, section: true } },
        batch: { select: { name: true } },
      },
    });

    if (!student) return { success: true, data: null };

    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

    const academicYear = await prisma.academicYear.findFirst({
      where: { tenantId, isCurrent: true },
    });

    // Parallel data fetching
    const [todaySchedule, pendingHomework, recentNotifications, monthAttendance] = await Promise.all([
      // Today's timetable
      academicYear ? prisma.timetableEntry.findMany({
        where: {
          tenantId,
          academicYearId: academicYear.id,
          dayOfWeek,
          ...(student.classId ? { classId: student.classId } : {}),
          ...(student.batchId ? { batchId: student.batchId } : {}),
        },
        include: {
          subject: { select: { name: true } },
          teacher: { select: { name: true } },
        },
        orderBy: { startTime: "asc" },
      }) : [],

      // Pending homework (published, not yet submitted, due in future)
      prisma.homework.findMany({
        where: {
          tenantId,
          status: "PUBLISHED",
          dueDate: { gte: now },
          ...(student.classId ? { classId: student.classId } : {}),
          ...(student.batchId ? { batchId: student.batchId } : {}),
          submissions: { none: { studentId: student.id } },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          subject: { select: { name: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),

      // Recent notifications
      prisma.notification.findMany({
        where: {
          tenantId,
          OR: [
            { targetRoles: { isEmpty: true } },
            { targetRoles: { has: user.role } },
          ],
        },
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // This month's attendance
      prisma.attendance.findMany({
        where: {
          tenantId,
          studentId: student.id,
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
            lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
          },
        },
        select: { status: true },
      }),
    ]);

    // Calculate attendance stats
    const attendanceStats = { present: 0, absent: 0, late: 0, total: monthAttendance.length, percentage: 0 };
    for (const r of monthAttendance) {
      if (r.status === "PRESENT") attendanceStats.present++;
      else if (r.status === "ABSENT") attendanceStats.absent++;
      else if (r.status === "LATE") attendanceStats.late++;
    }
    if (attendanceStats.total > 0) {
      attendanceStats.percentage = Math.round(((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100);
    }

    return {
      success: true,
      data: {
        student: {
          name: student.name,
          className: student.class ? `${student.class.name}${student.class.section ? ` - ${student.class.section}` : ""}` : null,
          batchName: student.batch?.name || null,
        },
        todaySchedule: todaySchedule.map((e) => ({
          id: e.id,
          startTime: e.startTime,
          endTime: e.endTime,
          subject: e.subject.name,
          teacher: e.teacher.name,
          room: e.room,
        })),
        pendingHomework,
        recentNotifications,
        attendanceStats,
      },
    };
  } catch {
    return { success: false, error: "Failed to fetch dashboard data" };
  }
}

// ==================== Get My Exams ====================

export async function getMyExams(childId?: string) {
  try {
    const user = await requireStudentOrParent();
    const tenantId = user.tenantId!;

    const studentWhere = user.role === "STUDENT"
      ? { tenantId, status: "ACTIVE" as const, userId: user.id }
      : childId
        ? { tenantId, status: "ACTIVE" as const, parentUserId: user.id, id: childId }
        : { tenantId, status: "ACTIVE" as const, parentUserId: user.id };

    const student = await prisma.student.findFirst({
      where: studentWhere,
      select: { id: true, classId: true, batchId: true },
    });

    if (!student) return { success: true, data: { exams: [], student: null } };

    const exams = await prisma.exam.findMany({
      where: {
        tenantId,
        classId: student.classId ?? undefined,
        batchId: student.batchId ?? undefined,
      },
      include: {
        class: { select: { name: true, section: true } },
        batch: { select: { name: true } },
        academicYear: { select: { name: true } },
        examSubjects: {
          include: {
            subject: { select: { name: true, code: true } },
            marks: {
              where: { studentId: student.id },
              select: { marksObtained: true, grade: true },
            },
          },
          orderBy: { examDate: "asc" },
        },
      },
      orderBy: { startDate: "desc" },
    });

    const formatted = exams.map((exam) => {
      const totalMaxMarks = exam.examSubjects.reduce((s, sub) => s + sub.maxMarks, 0);
      const studentMarks = exam.examSubjects
        .filter((sub) => sub.marks.length > 0)
        .map((sub) => ({
          subjectName: sub.subject.name,
          subjectCode: sub.subject.code,
          maxMarks: sub.maxMarks,
          passingMarks: sub.passingMarks,
          marksObtained: Number(sub.marks[0].marksObtained),
          grade: sub.marks[0].grade,
          passed: Number(sub.marks[0].marksObtained) >= sub.passingMarks,
        }));

      const totalObtained = studentMarks.reduce((s, m) => s + m.marksObtained, 0);
      const percentage = totalMaxMarks > 0 ? Math.round((totalObtained / totalMaxMarks) * 100) : 0;
      const allPassed = studentMarks.length > 0 && studentMarks.every((m) => m.passed);

      return {
        id: exam.id,
        name: exam.name,
        type: exam.type,
        status: exam.status,
        startDate: exam.startDate,
        endDate: exam.endDate,
        className: exam.class
          ? `${exam.class.name}${exam.class.section ? ` - ${exam.class.section}` : ""}`
          : null,
        batchName: exam.batch?.name || null,
        academicYear: exam.academicYear.name,
        subjects: studentMarks,
        totalSubjects: exam.examSubjects.length,
        totalMaxMarks,
        totalObtained,
        percentage,
        allPassed,
        hasResults: exam.status === "RESULT_PUBLISHED" && studentMarks.length > 0,
      };
    });

    return { success: true, data: { exams: formatted, studentId: student.id } };
  } catch {
    return { success: false, error: "Failed to fetch exams" };
  }
}
