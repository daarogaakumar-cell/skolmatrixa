"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "./audit";

async function requireExportAccess() {
  const session = await auth();
  if (!session?.user || !session.user.tenantId) {
    throw new Error("Unauthorized");
  }
  if (!["TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"].includes(session.user.role)) {
    throw new Error("Insufficient permissions");
  }
  return session.user;
}

function escapeCsvField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function arrayToCsvString(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCsvField).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvField).join(","));
  return [headerLine, ...dataLines].join("\r\n");
}

// ==================== Export Students ====================

export async function exportStudents(filters?: {
  classId?: string;
  batchId?: string;
  status?: string;
}) {
  try {
    const user = await requireExportAccess();
    const tenantId = user.tenantId!;

    const where: Record<string, unknown> = { tenantId };
    if (filters?.classId && filters.classId !== "ALL") where.classId = filters.classId;
    if (filters?.batchId && filters.batchId !== "ALL") where.batchId = filters.batchId;
    if (filters?.status && filters.status !== "ALL") where.status = filters.status;

    const students = await prisma.student.findMany({
      where,
      include: {
        class: { select: { name: true } },
        batch: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });

    const headers = [
      "Admission No",
      "Name",
      "Class",
      "Batch",
      "Gender",
      "Date of Birth",
      "Guardian Name",
      "Guardian Phone",
      "Phone",
      "Email",
      "Address",
      "Status",
      "Admission Date",
    ];

    const rows = students.map((s) => [
      s.admissionNo,
      s.name,
      s.class?.name || "",
      s.batch?.name || "",
      s.gender || "",
      s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString("en-IN") : "",
      s.guardianName || "",
      s.guardianPhone || "",
      s.phone || "",
      s.email || "",
      s.address || "",
      s.status,
      s.admissionDate ? new Date(s.admissionDate).toLocaleDateString("en-IN") : "",
    ]);

    await logAudit({
      userId: user.id,
      tenantId,
      action: "EXPORT",
      entityType: "Student",
      details: { count: students.length },
    });

    return {
      success: true,
      data: {
        csv: arrayToCsvString(headers, rows),
        filename: `students_export_${new Date().toISOString().slice(0, 10)}.csv`,
        count: students.length,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Export failed" };
  }
}

// ==================== Export Attendance ====================

export async function exportAttendance(filters: {
  classId?: string;
  batchId?: string;
  startDate: string;
  endDate: string;
}) {
  try {
    const user = await requireExportAccess();
    const tenantId = user.tenantId!;

    if (!filters.startDate || !filters.endDate) {
      return { success: false, error: "Start date and end date are required" };
    }

    const where: Record<string, unknown> = {
      tenantId,
      date: {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      },
    };
    if (filters.classId && filters.classId !== "ALL") where.classId = filters.classId;

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: { select: { name: true, admissionNo: true } },
        class: { select: { name: true } },
      },
      orderBy: [{ date: "asc" }, { student: { name: "asc" } }],
    });

    const headers = [
      "Date",
      "Admission No",
      "Student Name",
      "Class",
      "Status",
      "Remarks",
    ];

    const rows = attendance.map((a) => [
      new Date(a.date).toLocaleDateString("en-IN"),
      a.student?.admissionNo || "",
      a.student?.name || "",
      a.class?.name || "",
      a.status,
      a.remarks || "",
    ]);

    await logAudit({
      userId: user.id,
      tenantId,
      action: "EXPORT",
      entityType: "Attendance",
      details: { count: attendance.length },
    });

    return {
      success: true,
      data: {
        csv: arrayToCsvString(headers, rows),
        filename: `attendance_export_${filters.startDate}_to_${filters.endDate}.csv`,
        count: attendance.length,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Export failed" };
  }
}

// ==================== Export Exam Marks ====================

export async function exportMarks(filters: {
  examId: string;
}) {
  try {
    const user = await requireExportAccess();
    const tenantId = user.tenantId!;

    if (!filters.examId) {
      return { success: false, error: "Exam is required" };
    }

    const exam = await prisma.exam.findFirst({
      where: { id: filters.examId, tenantId },
      select: { name: true },
    });

    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    const marks = await prisma.mark.findMany({
      where: { examSubject: { exam: { id: filters.examId, tenantId } } },
      include: {
        student: { select: { name: true, admissionNo: true } },
        examSubject: {
          select: {
            subject: { select: { name: true } },
            maxMarks: true,
            passingMarks: true,
          },
        },
      },
      orderBy: [{ student: { name: "asc" } }, { examSubject: { subject: { name: "asc" } } }],
    });

    const headers = [
      "Admission No",
      "Student Name",
      "Subject",
      "Marks Obtained",
      "Max Marks",
      "Passing Marks",
      "Percentage",
      "Status",
    ];

    const rows = marks.map((m) => {
      const maxMarks = m.examSubject.maxMarks;
      const passingMarks = m.examSubject.passingMarks;
      const obtained = m.marksObtained;
      const obtainedNum = obtained.toNumber();
      const percentage = maxMarks > 0 ? ((obtainedNum / maxMarks) * 100).toFixed(1) : "0";
      const status = obtainedNum >= passingMarks ? "PASS" : "FAIL";
      return [
        m.student.admissionNo,
        m.student.name,
        m.examSubject.subject.name,
        obtainedNum,
        maxMarks,
        passingMarks,
        `${percentage}%`,
        status,
      ];
    });

    await logAudit({
      userId: user.id,
      tenantId,
      action: "EXPORT",
      entityType: "Mark",
      details: { examName: exam.name, count: marks.length },
    });

    return {
      success: true,
      data: {
        csv: arrayToCsvString(headers, rows),
        filename: `marks_${exam.name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`,
        count: marks.length,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Export failed" };
  }
}

// ==================== Export Fees ====================

export async function exportFees(filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const user = await requireExportAccess();
    const tenantId = user.tenantId!;

    const where: Record<string, unknown> = { tenantId };
    if (filters?.status && filters.status !== "ALL") where.status = filters.status;
    if (filters?.startDate && filters?.endDate) {
      where.paidAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    const payments = await prisma.feePayment.findMany({
      where,
      include: {
        student: { select: { name: true, admissionNo: true } },
        feeStructure: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Receipt No",
      "Admission No",
      "Student Name",
      "Fee Name",
      "Amount Due",
      "Amount Paid",
      "Payment Method",
      "Status",
      "Payment Date",
      "Notes",
    ];

    const rows = payments.map((p) => [
      p.receiptNo || "",
      p.student.admissionNo,
      p.student.name,
      p.feeStructure.name,
      p.amountDue.toNumber(),
      p.amountPaid.toNumber(),
      p.paymentMethod || "",
      p.status,
      p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-IN") : "",
      p.notes || "",
    ]);

    await logAudit({
      userId: user.id,
      tenantId,
      action: "EXPORT",
      entityType: "FeePayment",
      details: { count: payments.length },
    });

    return {
      success: true,
      data: {
        csv: arrayToCsvString(headers, rows),
        filename: `fees_export_${new Date().toISOString().slice(0, 10)}.csv`,
        count: payments.length,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Export failed" };
  }
}

// ==================== Export Staff ====================

export async function exportStaff() {
  try {
    const user = await requireExportAccess();
    const tenantId = user.tenantId!;

    const staff = await prisma.user.findMany({
      where: {
        tenantId,
        role: { in: ["TEACHER", "ACCOUNTANT", "VICE_ADMIN"] },
      },
      include: {
        staffProfile: true,
      },
      orderBy: { name: "asc" },
    });

    const headers = [
      "Name",
      "Email",
      "Role",
      "Contact Email",
      "Designation",
      "Department",
      "Qualification",
      "Join Date",
      "Status",
    ];

    const rows = staff.map((s) => [
      s.name,
      s.email,
      s.role.replace("_", " "),
      s.email,
      s.staffProfile?.designation || "",
      s.staffProfile?.department || "",
      s.staffProfile?.qualification || "",
      s.staffProfile?.joiningDate ? new Date(s.staffProfile.joiningDate).toLocaleDateString("en-IN") : "",
      s.isActive ? "Active" : "Inactive",
    ]);

    await logAudit({
      userId: user.id,
      tenantId,
      action: "EXPORT",
      entityType: "User",
      details: { count: staff.length },
    });

    return {
      success: true,
      data: {
        csv: arrayToCsvString(headers, rows),
        filename: `staff_export_${new Date().toISOString().slice(0, 10)}.csv`,
        count: staff.length,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Export failed" };
  }
}

// ==================== Export Leave Applications ====================

export async function exportLeaves(filters?: {
  status?: string;
  applicantType?: string;
}) {
  try {
    const user = await requireExportAccess();
    const tenantId = user.tenantId!;

    const where: Record<string, unknown> = { tenantId };
    if (filters?.status && filters.status !== "ALL") where.status = filters.status;
    if (filters?.applicantType && filters.applicantType !== "ALL") where.applicantType = filters.applicantType;

    const leaves = await prisma.leaveApplication.findMany({
      where,
      include: {
        applicant: { select: { name: true, email: true, role: true } },
        student: { select: { name: true, admissionNo: true } },
        reviewer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Applicant Name",
      "Email",
      "Role",
      "Student Name",
      "Admission No",
      "Leave Type",
      "Start Date",
      "End Date",
      "Reason",
      "Status",
      "Reviewed By",
      "Review Remarks",
      "Applied On",
    ];

    const rows = leaves.map((l) => [
      l.applicant.name,
      l.applicant.email,
      l.applicant.role.replace("_", " "),
      l.student?.name || "",
      l.student?.admissionNo || "",
      l.leaveType,
      new Date(l.startDate).toLocaleDateString("en-IN"),
      new Date(l.endDate).toLocaleDateString("en-IN"),
      l.reason,
      l.status,
      l.reviewer?.name || "",
      l.reviewRemarks || "",
      new Date(l.createdAt).toLocaleDateString("en-IN"),
    ]);

    await logAudit({
      userId: user.id,
      tenantId,
      action: "EXPORT",
      entityType: "LeaveApplication",
      details: { count: leaves.length },
    });

    return {
      success: true,
      data: {
        csv: arrayToCsvString(headers, rows),
        filename: `leaves_export_${new Date().toISOString().slice(0, 10)}.csv`,
        count: leaves.length,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Export failed" };
  }
}

// ==================== Get Export Filter Options ====================

export async function getExportFilterOptions() {
  try {
    const user = await requireExportAccess();
    const tenantId = user.tenantId!;

    const [classes, batches, exams] = await Promise.all([
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
      prisma.exam.findMany({
        where: { tenantId },
        select: { id: true, name: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      success: true,
      data: { classes, batches, exams },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to load options" };
  }
}
