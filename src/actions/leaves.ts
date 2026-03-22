"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "./audit";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/generated/prisma/client";

async function requireTenantUser() {
  const session = await auth();
  if (!session?.user || !session.user.tenantId) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

async function requireLeaveApprover() {
  const session = await auth();
  if (!session?.user || !session.user.tenantId) {
    throw new Error("Unauthorized");
  }
  if (!["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"].includes(session.user.role)) {
    throw new Error("Insufficient permissions");
  }
  return session.user;
}

// ==================== APPLY FOR LEAVE ====================

export async function applyLeave(data: {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  studentId?: string;
}) {
  const user = await requireTenantUser();
  const tenantId = user.tenantId!;

  try {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (end < start) {
      return { success: false, error: "End date must be after start date" };
    }

    // Calculate leave days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const leaveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const isStaff = ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER", "ACCOUNTANT"].includes(user.role);
    const applicantType = isStaff ? "STAFF" : "STUDENT";

    // Check if user is a parent applying for student leave
    let studentId = data.studentId;
    if (user.role === "PARENT" && !studentId) {
      return { success: false, error: "Student selection is required for parent leave applications" };
    }
    if (user.role === "STUDENT") {
      const student = await prisma.student.findFirst({
        where: { tenantId, userId: user.id },
        select: { id: true },
      });
      if (student) studentId = student.id;
    }

    // Check overlapping leaves
    const existing = await prisma.leaveApplication.findFirst({
      where: {
        tenantId,
        applicantUserId: user.id,
        status: { in: ["PENDING", "APPROVED"] },
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    });

    if (existing) {
      return { success: false, error: "You already have a leave application for overlapping dates" };
    }

    // Check leave balance
    const academicYear = await prisma.academicYear.findFirst({
      where: { tenantId, isCurrent: true },
    });

    if (academicYear) {
      const balance = await prisma.leaveBalance.findFirst({
        where: {
          tenantId,
          userId: user.id,
          leaveType: data.leaveType as "SICK" | "CASUAL" | "EMERGENCY" | "MEDICAL" | "OTHER",
          academicYearId: academicYear.id,
        },
      });

      if (balance && balance.totalAllowed > 0) {
        const remaining = balance.totalAllowed - balance.used;
        if (leaveDays > remaining) {
          return { success: false, error: `Insufficient leave balance. Available: ${remaining} days, Requested: ${leaveDays} days` };
        }
      }
    }

    const leave = await prisma.leaveApplication.create({
      data: {
        tenantId,
        applicantType: applicantType as "STAFF" | "STUDENT",
        applicantUserId: user.id,
        studentId: studentId || null,
        leaveType: data.leaveType as "SICK" | "CASUAL" | "EMERGENCY" | "MEDICAL" | "OTHER",
        startDate: start,
        endDate: end,
        reason: data.reason,
      },
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "LEAVE_APPLIED",
      entityType: "LeaveApplication",
      entityId: leave.id,
      details: { leaveType: data.leaveType, startDate: data.startDate, endDate: data.endDate, days: leaveDays },
    });

    revalidatePath("/dashboard/leaves");
    return { success: true, message: "Leave application submitted successfully" };
  } catch (error) {
    console.error("Apply leave error:", error);
    return { success: false, error: "Failed to submit leave application" };
  }
}

// ==================== REVIEW LEAVE (APPROVE/REJECT) ====================

export async function reviewLeave(data: {
  leaveId: string;
  status: "APPROVED" | "REJECTED";
  remarks?: string;
}) {
  const user = await requireLeaveApprover();
  const tenantId = user.tenantId!;

  try {
    const leave = await prisma.leaveApplication.findFirst({
      where: { id: data.leaveId, tenantId, status: "PENDING" },
      include: { applicant: { select: { name: true, role: true } } },
    });

    if (!leave) {
      return { success: false, error: "Leave application not found or already reviewed" };
    }

    // Teachers can only approve student leaves
    if (user.role === "TEACHER" && leave.applicantType !== "STUDENT") {
      return { success: false, error: "Teachers can only approve student leave applications" };
    }

    // Staff can't approve their own leaves
    if (leave.applicantUserId === user.id) {
      return { success: false, error: "You cannot review your own leave application" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.leaveApplication.update({
        where: { id: data.leaveId },
        data: {
          status: data.status,
          reviewedBy: user.id,
          reviewedAt: new Date(),
          reviewRemarks: data.remarks || null,
        },
      });

      // Update leave balance if approved
      if (data.status === "APPROVED") {
        const diffTime = Math.abs(leave.endDate.getTime() - leave.startDate.getTime());
        const leaveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const academicYear = await tx.academicYear.findFirst({
          where: { tenantId, isCurrent: true },
        });

        if (academicYear) {
          await tx.leaveBalance.upsert({
            where: {
              tenantId_userId_leaveType_academicYearId: {
                tenantId,
                userId: leave.applicantUserId,
                leaveType: leave.leaveType,
                academicYearId: academicYear.id,
              },
            },
            update: { used: { increment: leaveDays } },
            create: {
              tenantId,
              userId: leave.applicantUserId,
              applicantType: leave.applicantType,
              leaveType: leave.leaveType,
              totalAllowed: 0,
              used: leaveDays,
              academicYearId: academicYear.id,
            },
          });
        }
      }
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: `LEAVE_${data.status}`,
      entityType: "LeaveApplication",
      entityId: data.leaveId,
      details: { status: data.status, remarks: data.remarks },
    });

    revalidatePath("/dashboard/leaves");
    return { success: true, message: `Leave ${data.status.toLowerCase()} successfully` };
  } catch (error) {
    console.error("Review leave error:", error);
    return { success: false, error: "Failed to review leave application" };
  }
}

// ==================== CANCEL LEAVE ====================

export async function cancelLeave(leaveId: string) {
  const user = await requireTenantUser();
  const tenantId = user.tenantId!;

  try {
    const leave = await prisma.leaveApplication.findFirst({
      where: { id: leaveId, tenantId, applicantUserId: user.id, status: { in: ["PENDING", "APPROVED"] } },
    });

    if (!leave) {
      return { success: false, error: "Leave application not found or cannot be cancelled" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.leaveApplication.update({
        where: { id: leaveId },
        data: { status: "CANCELLED" },
      });

      // Restore balance if was approved
      if (leave.status === "APPROVED") {
        const diffTime = Math.abs(leave.endDate.getTime() - leave.startDate.getTime());
        const leaveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const academicYear = await tx.academicYear.findFirst({
          where: { tenantId, isCurrent: true },
        });

        if (academicYear) {
          const balance = await tx.leaveBalance.findFirst({
            where: {
              tenantId,
              userId: user.id,
              leaveType: leave.leaveType,
              academicYearId: academicYear.id,
            },
          });

          if (balance) {
            await tx.leaveBalance.update({
              where: { id: balance.id },
              data: { used: { decrement: leaveDays } },
            });
          }
        }
      }
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "LEAVE_CANCELLED",
      entityType: "LeaveApplication",
      entityId: leaveId,
    });

    revalidatePath("/dashboard/leaves");
    return { success: true, message: "Leave application cancelled" };
  } catch (error) {
    console.error("Cancel leave error:", error);
    return { success: false, error: "Failed to cancel leave" };
  }
}

// ==================== GET LEAVE APPLICATIONS ====================

export async function getLeaveApplications(filters?: {
  status?: string;
  applicantType?: string;
  page?: number;
  pageSize?: number;
}) {
  const user = await requireTenantUser();
  const tenantId = user.tenantId!;

  try {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;

    const where: Record<string, unknown> = { tenantId };

    // Role-based filtering
    const isAdmin = ["TENANT_ADMIN", "VICE_ADMIN"].includes(user.role);
    const isTeacher = user.role === "TEACHER";

    if (!isAdmin && !isTeacher) {
      // Students, parents, accountants see only their own
      where.applicantUserId = user.id;
    }

    if (filters?.status && filters.status !== "ALL") where.status = filters.status;
    if (filters?.applicantType && filters.applicantType !== "ALL") where.applicantType = filters.applicantType;

    const [applications, total] = await Promise.all([
      prisma.leaveApplication.findMany({
        where,
        include: {
          applicant: { select: { name: true, role: true, email: true } },
          student: { select: { name: true, admissionNo: true, class: { select: { name: true, section: true } }, batch: { select: { name: true } } } },
          reviewer: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.leaveApplication.count({ where }),
    ]);

    return {
      success: true,
      data: applications.map((a) => ({
        id: a.id,
        applicantName: a.applicant.name,
        applicantRole: a.applicant.role,
        applicantEmail: a.applicant.email,
        applicantType: a.applicantType,
        studentName: a.student?.name || null,
        studentAdmissionNo: a.student?.admissionNo || null,
        studentClass: a.student?.class ? `${a.student.class.name}${a.student.class.section ? ` ${a.student.class.section}` : ""}` : a.student?.batch?.name || null,
        leaveType: a.leaveType,
        startDate: a.startDate.toISOString(),
        endDate: a.endDate.toISOString(),
        days: Math.ceil(Math.abs(a.endDate.getTime() - a.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
        reason: a.reason,
        status: a.status,
        reviewerName: a.reviewer?.name || null,
        reviewRemarks: a.reviewRemarks || null,
        reviewedAt: a.reviewedAt?.toISOString() || null,
        createdAt: a.createdAt.toISOString(),
        isOwn: a.applicantUserId === user.id,
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  } catch (error) {
    console.error("Get leaves error:", error);
    return { success: false, error: "Failed to load leave applications" };
  }
}

// ==================== GET LEAVE BALANCES ====================

export async function getLeaveBalances(userId?: string) {
  const user = await requireTenantUser();
  const tenantId = user.tenantId!;

  const targetUserId = userId || user.id;

  // Only admins can view other users' balances
  if (targetUserId !== user.id && !["TENANT_ADMIN", "VICE_ADMIN"].includes(user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const academicYear = await prisma.academicYear.findFirst({
      where: { tenantId, isCurrent: true },
    });

    if (!academicYear) {
      return { success: true, data: [] };
    }

    const balances = await prisma.leaveBalance.findMany({
      where: { tenantId, userId: targetUserId, academicYearId: academicYear.id },
    });

    const leaveTypes = ["SICK", "CASUAL", "EMERGENCY", "MEDICAL", "OTHER"] as const;

    const result = leaveTypes.map((type) => {
      const balance = balances.find((b) => b.leaveType === type);
      return {
        leaveType: type,
        totalAllowed: balance?.totalAllowed || 0,
        used: balance?.used || 0,
        remaining: (balance?.totalAllowed || 0) - (balance?.used || 0),
      };
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Get leave balances error:", error);
    return { success: false, error: "Failed to load leave balances" };
  }
}

// ==================== SET LEAVE BALANCE / CONFIGURE ====================

export async function configureLeaveBalances(data: {
  applicantType: string;
  balances: { leaveType: string; totalAllowed: number }[];
}) {
  const user = await requireLeaveApprover();
  const tenantId = user.tenantId!;

  if (!["TENANT_ADMIN", "VICE_ADMIN"].includes(user.role)) {
    return { success: false, error: "Only admins can configure leave balances" };
  }

  try {
    const academicYear = await prisma.academicYear.findFirst({
      where: { tenantId, isCurrent: true },
    });

    if (!academicYear) {
      return { success: false, error: "No current academic year found" };
    }

    const staffRoles: UserRole[] = ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER", "ACCOUNTANT"];
    const studentRoles: UserRole[] = ["STUDENT", "PARENT"];
    const roleFilter = data.applicantType === "STAFF"
      ? { role: { in: staffRoles } }
      : { role: { in: studentRoles } };

    const users = await prisma.user.findMany({
      where: { tenantId, isActive: true, ...roleFilter },
      select: { id: true },
    });

    await prisma.$transaction(
      data.balances.flatMap((b) =>
        users.map((u) =>
          prisma.leaveBalance.upsert({
            where: {
              tenantId_userId_leaveType_academicYearId: {
                tenantId,
                userId: u.id,
                leaveType: b.leaveType as "SICK" | "CASUAL" | "EMERGENCY" | "MEDICAL" | "OTHER",
                academicYearId: academicYear.id,
              },
            },
            update: { totalAllowed: b.totalAllowed },
            create: {
              tenantId,
              userId: u.id,
              applicantType: data.applicantType as "STAFF" | "STUDENT",
              leaveType: b.leaveType as "SICK" | "CASUAL" | "EMERGENCY" | "MEDICAL" | "OTHER",
              totalAllowed: b.totalAllowed,
              used: 0,
              academicYearId: academicYear.id,
            },
          })
        )
      )
    );

    await logAudit({
      tenantId,
      userId: user.id,
      action: "LEAVE_BALANCE_CONFIGURED",
      entityType: "LeaveBalance",
      details: { applicantType: data.applicantType, balances: data.balances },
    });

    revalidatePath("/dashboard/leaves");
    return { success: true, message: "Leave balances configured successfully" };
  } catch (error) {
    console.error("Configure leave balances error:", error);
    return { success: false, error: "Failed to configure leave balances" };
  }
}

// ==================== GET LEAVE CALENDAR DATA ====================

export async function getLeaveCalendarData(month: number, year: number) {
  const user = await requireTenantUser();
  const tenantId = user.tenantId!;

  try {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    const where: Record<string, unknown> = {
      tenantId,
      status: "APPROVED",
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    };

    // Non-admins see only their own
    if (!["TENANT_ADMIN", "VICE_ADMIN"].includes(user.role)) {
      where.applicantUserId = user.id;
    }

    const leaves = await prisma.leaveApplication.findMany({
      where,
      include: {
        applicant: { select: { name: true, role: true } },
      },
      orderBy: { startDate: "asc" },
    });

    return {
      success: true,
      data: leaves.map((l) => ({
        id: l.id,
        applicantName: l.applicant.name,
        applicantRole: l.applicant.role,
        applicantType: l.applicantType,
        leaveType: l.leaveType,
        startDate: l.startDate.toISOString(),
        endDate: l.endDate.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Leave calendar error:", error);
    return { success: false, error: "Failed to load leave calendar" };
  }
}

// ==================== GET LEAVE STATS (for dashboard) ====================

export async function getLeaveStats() {
  const user = await requireTenantUser();
  const tenantId = user.tenantId!;

  try {
    const isAdmin = ["TENANT_ADMIN", "VICE_ADMIN"].includes(user.role);
    const where: Record<string, unknown> = { tenantId };
    if (!isAdmin) where.applicantUserId = user.id;

    const [pending, approved, rejected, total] = await Promise.all([
      prisma.leaveApplication.count({ where: { ...where, status: "PENDING" } }),
      prisma.leaveApplication.count({ where: { ...where, status: "APPROVED" } }),
      prisma.leaveApplication.count({ where: { ...where, status: "REJECTED" } }),
      prisma.leaveApplication.count({ where }),
    ]);

    // Today's leaves (approved + in range)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todayOnLeave = await prisma.leaveApplication.count({
      where: {
        tenantId,
        status: "APPROVED",
        startDate: { lte: todayEnd },
        endDate: { gte: today },
      },
    });

    return {
      success: true,
      data: { pending, approved, rejected, total, todayOnLeave },
    };
  } catch (error) {
    console.error("Leave stats error:", error);
    return { success: false, error: "Failed to load leave stats" };
  }
}

// ==================== GET PARENT CHILDREN ====================

export async function getParentChildren() {
  const user = await requireTenantUser();
  if (user.role !== "PARENT") return { success: true, data: [] };

  const tenantId = user.tenantId!;

  try {
    const children = await prisma.student.findMany({
      where: { tenantId, parentUserId: user.id, status: "ACTIVE" },
      select: { id: true, name: true, admissionNo: true },
    });

    return { success: true, data: children };
  } catch {
    return { success: false, error: "Failed to load children" };
  }
}
