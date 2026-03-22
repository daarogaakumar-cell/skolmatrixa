"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAnalyticsAccess() {
  const session = await auth();
  if (!session?.user || !session.user.tenantId) {
    throw new Error("Unauthorized");
  }
  if (!["TENANT_ADMIN", "VICE_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    throw new Error("Insufficient permissions");
  }
  return session.user;
}

// ==================== ATTENDANCE ANALYTICS ====================

export async function getAttendanceAnalytics(filters?: {
  classId?: string;
  batchId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const user = await requireAnalyticsAccess();
  const tenantId = user.tenantId!;

  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const dateFrom = filters?.dateFrom ? new Date(filters.dateFrom) : sixMonthsAgo;
    const dateTo = filters?.dateTo ? new Date(filters.dateTo) : now;

    const where: Record<string, unknown> = {
      tenantId,
      date: { gte: dateFrom, lte: dateTo },
    };
    if (filters?.classId) where.classId = filters.classId;
    if (filters?.batchId) where.batchId = filters.batchId;

    // Get all attendance records
    const records = await prisma.attendance.findMany({
      where,
      select: {
        date: true,
        status: true,
        classId: true,
        batchId: true,
        class: { select: { name: true, section: true } },
        batch: { select: { name: true } },
      },
    });

    // Monthly trends
    const monthlyMap: Record<string, { present: number; absent: number; late: number; halfDay: number; total: number }> = {};
    records.forEach((r) => {
      const monthKey = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { present: 0, absent: 0, late: 0, halfDay: 0, total: 0 };
      }
      monthlyMap[monthKey].total++;
      if (r.status === "PRESENT") monthlyMap[monthKey].present++;
      else if (r.status === "ABSENT") monthlyMap[monthKey].absent++;
      else if (r.status === "LATE") monthlyMap[monthKey].late++;
      else if (r.status === "HALF_DAY") monthlyMap[monthKey].halfDay++;
    });

    const monthlyTrend = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        label: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        ...data,
        rate: data.total > 0 ? Math.round(((data.present + data.late + data.halfDay * 0.5) / data.total) * 100) : 0,
      }));

    // Class comparison
    const classMap: Record<string, { name: string; present: number; total: number }> = {};
    records.forEach((r) => {
      const key = r.classId || r.batchId || "unknown";
      const name = r.class ? `${r.class.name}${r.class.section ? ` ${r.class.section}` : ""}` : r.batch?.name || "Unknown";
      if (!classMap[key]) classMap[key] = { name, present: 0, total: 0 };
      classMap[key].total++;
      if (["PRESENT", "LATE"].includes(r.status)) classMap[key].present++;
      if (r.status === "HALF_DAY") classMap[key].present += 0.5;
    });

    const classComparison = Object.values(classMap)
      .map((c) => ({ ...c, rate: c.total > 0 ? Math.round((c.present / c.total) * 100) : 0 }))
      .sort((a, b) => b.rate - a.rate);

    // Day-of-week analysis
    const dayMap: Record<number, { present: number; total: number }> = {};
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    records.forEach((r) => {
      const day = r.date.getDay();
      if (!dayMap[day]) dayMap[day] = { present: 0, total: 0 };
      dayMap[day].total++;
      if (["PRESENT", "LATE"].includes(r.status)) dayMap[day].present++;
    });

    const dayOfWeekAnalysis = Object.entries(dayMap)
      .map(([day, data]) => ({
        day: dayNames[parseInt(day)],
        dayNum: parseInt(day),
        rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
        total: data.total,
      }))
      .sort((a, b) => a.dayNum - b.dayNum);

    // Overall stats
    const totalRecords = records.length;
    const presentCount = records.filter((r) => ["PRESENT", "LATE"].includes(r.status)).length;
    const absentCount = records.filter((r) => r.status === "ABSENT").length;
    const overallRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

    return {
      success: true,
      data: {
        monthlyTrend,
        classComparison,
        dayOfWeekAnalysis,
        overall: { totalRecords, presentCount, absentCount, overallRate },
      },
    };
  } catch (error) {
    console.error("Analytics error:", error);
    return { success: false, error: "Failed to load attendance analytics" };
  }
}

// ==================== EXAM ANALYTICS ====================

export async function getExamAnalytics(filters?: {
  classId?: string;
  batchId?: string;
  examType?: string;
}) {
  const user = await requireAnalyticsAccess();
  const tenantId = user.tenantId!;

  try {
    const where: Record<string, unknown> = {
      tenantId,
      status: "RESULT_PUBLISHED",
    };
    if (filters?.classId) where.classId = filters.classId;
    if (filters?.batchId) where.batchId = filters.batchId;
    if (filters?.examType) where.type = filters.examType;

    const exams = await prisma.exam.findMany({
      where,
      include: {
        class: { select: { name: true, section: true } },
        batch: { select: { name: true } },
        examSubjects: {
          include: {
            subject: { select: { name: true } },
            marks: {
              select: {
                marksObtained: true,
                grade: true,
                student: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { startDate: "asc" },
    });

    // Subject-wise average
    const subjectMap: Record<string, { name: string; totalMarks: number; totalMax: number; count: number; passCount: number }> = {};
    exams.forEach((exam) => {
      exam.examSubjects.forEach((es) => {
        const key = es.subject.name;
        if (!subjectMap[key]) subjectMap[key] = { name: key, totalMarks: 0, totalMax: 0, count: 0, passCount: 0 };
        es.marks.forEach((m) => {
          const obtained = Number(m.marksObtained);
          subjectMap[key].totalMarks += obtained;
          subjectMap[key].totalMax += es.maxMarks;
          subjectMap[key].count++;
          if (obtained >= es.passingMarks) subjectMap[key].passCount++;
        });
      });
    });

    const subjectAverages = Object.values(subjectMap)
      .map((s) => ({
        subject: s.name,
        avgPercentage: s.count > 0 ? Math.round((s.totalMarks / s.totalMax) * 100) : 0,
        passRate: s.count > 0 ? Math.round((s.passCount / s.count) * 100) : 0,
        totalStudents: s.count,
      }))
      .sort((a, b) => b.avgPercentage - a.avgPercentage);

    // Class comparison
    const examClassMap: Record<string, { name: string; totalPct: number; count: number; passCount: number; failCount: number }> = {};
    exams.forEach((exam) => {
      const key = exam.classId || exam.batchId || "unknown";
      const name = exam.class
        ? `${exam.class.name}${exam.class.section ? ` ${exam.class.section}` : ""}`
        : exam.batch?.name || "Unknown";

      if (!examClassMap[key]) examClassMap[key] = { name, totalPct: 0, count: 0, passCount: 0, failCount: 0 };

      exam.examSubjects.forEach((es) => {
        es.marks.forEach((m) => {
          const pct = (Number(m.marksObtained) / es.maxMarks) * 100;
          examClassMap[key].totalPct += pct;
          examClassMap[key].count++;
          if (Number(m.marksObtained) >= es.passingMarks) examClassMap[key].passCount++;
          else examClassMap[key].failCount++;
        });
      });
    });

    const classComparison = Object.values(examClassMap)
      .map((c) => ({
        name: c.name,
        avgPercentage: c.count > 0 ? Math.round(c.totalPct / c.count) : 0,
        passRate: c.count > 0 ? Math.round((c.passCount / c.count) * 100) : 0,
        totalStudents: c.count,
        passCount: c.passCount,
        failCount: c.failCount,
      }))
      .sort((a, b) => b.avgPercentage - a.avgPercentage);

    // Pass/Fail ratio overall
    let totalPass = 0, totalFail = 0;
    exams.forEach((exam) => {
      exam.examSubjects.forEach((es) => {
        es.marks.forEach((m) => {
          if (Number(m.marksObtained) >= es.passingMarks) totalPass++;
          else totalFail++;
        });
      });
    });

    // Exam score trend (across exams)
    const examTrend = exams.map((exam) => {
      let totalObtained = 0, totalMax = 0, mCount = 0;
      exam.examSubjects.forEach((es) => {
        es.marks.forEach((m) => {
          totalObtained += Number(m.marksObtained);
          totalMax += es.maxMarks;
          mCount++;
        });
      });
      return {
        examName: exam.name,
        type: exam.type,
        avgPercentage: totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0,
        studentsCount: mCount,
        date: exam.startDate?.toISOString(),
      };
    });

    // Grade distribution 
    const gradeMap: Record<string, number> = {};
    exams.forEach((exam) => {
      exam.examSubjects.forEach((es) => {
        es.marks.forEach((m) => {
          const grade = m.grade || "N/A";
          gradeMap[grade] = (gradeMap[grade] || 0) + 1;
        });
      });
    });

    const gradeDistribution = Object.entries(gradeMap)
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => {
        const order = ["A+", "A", "B+", "B", "C", "D", "F", "N/A"];
        return order.indexOf(a.grade) - order.indexOf(b.grade);
      });

    return {
      success: true,
      data: {
        subjectAverages,
        classComparison,
        passFailRatio: { pass: totalPass, fail: totalFail },
        examTrend,
        gradeDistribution,
        totalExams: exams.length,
      },
    };
  } catch (error) {
    console.error("Exam analytics error:", error);
    return { success: false, error: "Failed to load exam analytics" };
  }
}

// ==================== FEE ANALYTICS ====================

export async function getFeeAnalytics(filters?: {
  classId?: string;
  batchId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const user = await requireAnalyticsAccess();
  const tenantId = user.tenantId!;

  try {
    const now = new Date();

    const payments = await prisma.feePayment.findMany({
      where: {
        tenantId,
        ...(filters?.dateFrom || filters?.dateTo
          ? {
              createdAt: {
                ...(filters?.dateFrom && { gte: new Date(filters.dateFrom) }),
                ...(filters?.dateTo && { lte: new Date(filters.dateTo) }),
              },
            }
          : {}),
      },
      include: {
        student: {
          select: {
            name: true,
            admissionNo: true,
            classId: true,
            batchId: true,
            class: { select: { name: true, section: true } },
            batch: { select: { name: true } },
            guardianName: true,
            guardianPhone: true,
          },
        },
        feeStructure: { select: { name: true, frequency: true } },
      },
    });

    // Monthly collection trend
    const monthlyMap: Record<string, { collected: number; pending: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = { collected: 0, pending: 0 };
    }

    payments.forEach((p) => {
      const d = p.paymentDate || p.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap[key]) {
        monthlyMap[key].collected += Number(p.amountPaid);
        if (["PENDING", "OVERDUE", "PARTIAL"].includes(p.status)) {
          monthlyMap[key].pending += Number(p.amountDue) - Number(p.amountPaid);
        }
      }
    });

    const collectionTrend = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        label: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        ...data,
      }));

    // Fee type split
    const feeTypeMap: Record<string, number> = {};
    payments.forEach((p) => {
      const name = p.feeStructure.name;
      feeTypeMap[name] = (feeTypeMap[name] || 0) + Number(p.amountPaid);
    });

    const feeTypeSplit = Object.entries(feeTypeMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Defaulter list
    const defaulters = payments
      .filter((p) => ["OVERDUE", "PENDING"].includes(p.status))
      .reduce((acc, p) => {
        const existing = acc.find((d) => d.studentId === p.studentId);
        const balance = Number(p.amountDue) - Number(p.amountPaid) + Number(p.lateFee) - Number(p.discount);
        if (existing) {
          existing.totalDue += balance;
          existing.feeCount++;
        } else {
          acc.push({
            studentId: p.studentId,
            studentName: p.student.name,
            admissionNo: p.student.admissionNo,
            className: p.student.class
              ? `${p.student.class.name}${p.student.class.section ? ` ${p.student.class.section}` : ""}`
              : p.student.batch?.name || "",
            guardianName: p.student.guardianName || "",
            guardianPhone: p.student.guardianPhone || "",
            totalDue: balance,
            feeCount: 1,
          });
        }
        return acc;
      }, [] as Array<{
        studentId: string;
        studentName: string;
        admissionNo: string;
        className: string;
        guardianName: string;
        guardianPhone: string;
        totalDue: number;
        feeCount: number;
      }>)
      .sort((a, b) => b.totalDue - a.totalDue);

    // Revenue projection (current month extrapolated)
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const thisMonthCollected = monthlyMap[thisMonthKey]?.collected || 0;
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const projectedRevenue = dayOfMonth > 0 ? Math.round((thisMonthCollected / dayOfMonth) * daysInMonth) : 0;

    // Overall stats
    const totalCollected = payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
    const totalDue = payments.reduce((sum, p) => sum + Number(p.amountDue), 0);
    const totalPending = payments.filter((p) => ["PENDING", "PARTIAL", "OVERDUE"].includes(p.status)).reduce((sum, p) => sum + (Number(p.amountDue) - Number(p.amountPaid)), 0);
    const totalOverdue = payments.filter((p) => p.status === "OVERDUE").reduce((sum, p) => sum + (Number(p.amountDue) - Number(p.amountPaid)), 0);
    const collectionRate = totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0;

    return {
      success: true,
      data: {
        collectionTrend,
        feeTypeSplit,
        defaulters: defaulters.slice(0, 50),
        projectedRevenue,
        overall: { totalCollected, totalPending, totalOverdue, collectionRate },
      },
    };
  } catch (error) {
    console.error("Fee analytics error:", error);
    return { success: false, error: "Failed to load fee analytics" };
  }
}

// ==================== STUDENT GROWTH ANALYTICS ====================

export async function getStudentGrowthAnalytics() {
  const user = await requireAnalyticsAccess();
  const tenantId = user.tenantId!;

  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    const students = await prisma.student.findMany({
      where: {
        tenantId,
        createdAt: { gte: twelveMonthsAgo },
      },
      select: {
        createdAt: true,
        status: true,
        gender: true,
        classId: true,
        batchId: true,
        class: { select: { name: true, section: true } },
        batch: { select: { name: true } },
      },
    });

    // Monthly admissions
    const monthlyMap: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyMap[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`] = 0;
    }

    students.forEach((s) => {
      const key = `${s.createdAt.getFullYear()}-${String(s.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap[key] !== undefined) monthlyMap[key]++;
    });

    const admissionTrend = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month,
        label: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        admissions: count,
      }));

    // Gender split
    const genderMap: Record<string, number> = { MALE: 0, FEMALE: 0, OTHER: 0 };
    const allStudents = await prisma.student.findMany({
      where: { tenantId, status: "ACTIVE" },
      select: { gender: true },
    });
    allStudents.forEach((s) => {
      if (s.gender) genderMap[s.gender]++;
    });

    const genderSplit = Object.entries(genderMap).map(([gender, count]) => ({ gender, count }));

    // Status split
    const statusCounts = await prisma.student.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: true,
    });

    const statusSplit = statusCounts.map((s) => ({ status: s.status, count: s._count }));

    // Total counts
    const totalActive = allStudents.length;
    const thisMonthAdmissions = students.filter((s) => {
      return s.createdAt.getMonth() === now.getMonth() && s.createdAt.getFullYear() === now.getFullYear();
    }).length;
    const lastMonthAdmissions = students.filter((s) => {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return s.createdAt.getMonth() === last.getMonth() && s.createdAt.getFullYear() === last.getFullYear();
    }).length;

    const growthRate = lastMonthAdmissions > 0
      ? Math.round(((thisMonthAdmissions - lastMonthAdmissions) / lastMonthAdmissions) * 100)
      : thisMonthAdmissions > 0 ? 100 : 0;

    return {
      success: true,
      data: {
        admissionTrend,
        genderSplit,
        statusSplit,
        totalActive,
        thisMonthAdmissions,
        growthRate,
      },
    };
  } catch (error) {
    console.error("Student growth analytics error:", error);
    return { success: false, error: "Failed to load student growth analytics" };
  }
}

// ==================== HELPER: GET CLASSES/BATCHES FOR FILTER ====================

export async function getAnalyticsFilterOptions() {
  const user = await requireAnalyticsAccess();
  const tenantId = user.tenantId!;

  try {
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

    return {
      success: true,
      data: {
        classes: classes.map((c) => ({
          value: c.id,
          label: `${c.name}${c.section ? ` ${c.section}` : ""}`,
        })),
        batches: batches.map((b) => ({
          value: b.id,
          label: b.name,
        })),
      },
    };
  } catch (error) {
    console.error("Filter options error:", error);
    return { success: false, error: "Failed to load filter options" };
  }
}
