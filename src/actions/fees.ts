"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "./audit";
import { revalidatePath } from "next/cache";
import {
  feeStructureSchema,
  recordPaymentSchema,
  generateFeesSchema,
} from "@/lib/validations/schemas";
import { FeeFrequency, PaymentStatus } from "@/generated/prisma/client";
import { createSystemNotification } from "./notifications";
import { sendFeePaymentConfirmationEmail } from "@/lib/email";
import {
  sendWhatsAppPaymentReceived,
  getWhatsAppSettings,
} from "@/lib/whatsapp";

// ==================== Auth Helpers ====================

async function requireFeeAdmin() {
  const session = await auth();
  if (!session?.user || !session.user.tenantId) {
    throw new Error("Unauthorized");
  }
  if (
    !["TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"].includes(session.user.role)
  ) {
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

// ==================== Fee Structure CRUD ====================

export async function createFeeStructure(data: {
  name: string;
  amount: number;
  frequency: string;
  classId?: string;
  batchId?: string;
  dueDay?: number;
  lateFee?: number;
  academicYearId?: string;
}) {
  try {
    const user = await requireFeeAdmin();
    const tenantId = user.tenantId!;

    const validated = feeStructureSchema.parse(data);

    // Get current academic year if not provided
    let academicYearId = validated.academicYearId;
    if (!academicYearId) {
      const currentYear = await prisma.academicYear.findFirst({
        where: { tenantId, isCurrent: true },
      });
      if (!currentYear) {
        return {
          success: false,
          error: "No active academic year found. Please set up an academic year first.",
        };
      }
      academicYearId = currentYear.id;
    }

    const feeStructure = await prisma.feeStructure.create({
      data: {
        tenantId,
        name: validated.name,
        amount: validated.amount,
        frequency: validated.frequency as FeeFrequency,
        classId: validated.classId || null,
        batchId: validated.batchId || null,
        academicYearId,
        dueDay: validated.dueDay || 1,
        lateFee: validated.lateFee || 0,
        isActive: true,
      },
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "FEE_STRUCTURE_CREATED",
      entityType: "FeeStructure",
      entityId: feeStructure.id,
      details: {
        name: feeStructure.name,
        amount: Number(feeStructure.amount),
        frequency: feeStructure.frequency,
      },
    });

    revalidatePath("/dashboard/fees");
    revalidatePath("/dashboard/fees/structure");
    return { success: true, data: feeStructure };
  } catch (error) {
    console.error("Create fee structure error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create fee structure",
    };
  }
}

export async function updateFeeStructure(
  id: string,
  data: {
    name?: string;
    amount?: number;
    frequency?: string;
    classId?: string;
    batchId?: string;
    dueDay?: number;
    lateFee?: number;
    isActive?: boolean;
  }
) {
  try {
    const user = await requireFeeAdmin();
    const tenantId = user.tenantId!;

    const existing = await prisma.feeStructure.findFirst({
      where: { id, tenantId },
    });
    if (!existing) return { success: false, error: "Fee structure not found" };

    const updated = await prisma.feeStructure.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.frequency !== undefined && {
          frequency: data.frequency as FeeFrequency,
        }),
        ...(data.classId !== undefined && {
          classId: data.classId || null,
        }),
        ...(data.batchId !== undefined && {
          batchId: data.batchId || null,
        }),
        ...(data.dueDay !== undefined && { dueDay: data.dueDay }),
        ...(data.lateFee !== undefined && { lateFee: data.lateFee }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "FEE_STRUCTURE_UPDATED",
      entityType: "FeeStructure",
      entityId: id,
      details: { name: updated.name },
    });

    revalidatePath("/dashboard/fees");
    revalidatePath("/dashboard/fees/structure");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Update fee structure error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update fee structure",
    };
  }
}

export async function deleteFeeStructure(id: string) {
  try {
    const user = await requireFeeAdmin();
    const tenantId = user.tenantId!;

    const existing = await prisma.feeStructure.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { payments: true } } },
    });

    if (!existing) return { success: false, error: "Fee structure not found" };

    // Check if any payments exist
    const paidPayments = await prisma.feePayment.count({
      where: {
        feeStructureId: id,
        status: { in: ["PAID", "PARTIAL"] },
      },
    });

    if (paidPayments > 0) {
      return {
        success: false,
        error: "Cannot delete fee structure with existing payments. Deactivate it instead.",
      };
    }

    // Delete pending payments first, then the structure
    await prisma.$transaction(async (tx) => {
      await tx.feePayment.deleteMany({
        where: { feeStructureId: id, status: "PENDING" },
      });
      await tx.feeStructure.delete({ where: { id } });
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "FEE_STRUCTURE_DELETED",
      entityType: "FeeStructure",
      entityId: id,
      details: { name: existing.name },
    });

    revalidatePath("/dashboard/fees");
    revalidatePath("/dashboard/fees/structure");
    return { success: true, message: "Fee structure deleted successfully" };
  } catch (error) {
    console.error("Delete fee structure error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete fee structure",
    };
  }
}

export async function getFeeStructures(filters?: {
  academicYearId?: string;
  classId?: string;
  batchId?: string;
  isActive?: boolean;
}) {
  try {
    const user = await requireTenantUser();
    const tenantId = user.tenantId!;

    const where: Record<string, unknown> = { tenantId };
    if (filters?.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters?.classId) where.classId = filters.classId;
    if (filters?.batchId) where.batchId = filters.batchId;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const structures = await prisma.feeStructure.findMany({
      where,
      include: {
        class: { select: { id: true, name: true, section: true } },
        batch: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
        _count: { select: { payments: true } },
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });

    return {
      success: true,
      data: structures.map((s) => ({
        id: s.id,
        name: s.name,
        amount: Number(s.amount),
        frequency: s.frequency,
        className: s.class
          ? `${s.class.name}${s.class.section ? ` - ${s.class.section}` : ""}`
          : null,
        classId: s.classId,
        batchName: s.batch?.name || null,
        batchId: s.batchId,
        academicYear: s.academicYear.name,
        academicYearId: s.academicYearId,
        dueDay: s.dueDay,
        lateFee: Number(s.lateFee),
        isActive: s.isActive,
        paymentCount: s._count.payments,
        createdAt: s.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Get fee structures error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch fee structures",
    };
  }
}

// ==================== Generate Fees for Students ====================

export async function generateFeesForStudents(data: {
  feeStructureId: string;
  month?: number;
  year?: number;
}) {
  try {
    const user = await requireFeeAdmin();
    const tenantId = user.tenantId!;

    const validated = generateFeesSchema.parse(data);

    const feeStructure = await prisma.feeStructure.findFirst({
      where: { id: validated.feeStructureId, tenantId, isActive: true },
    });

    if (!feeStructure) {
      return { success: false, error: "Fee structure not found or inactive" };
    }

    // Get all active students for this class/batch
    const studentWhere: Record<string, unknown> = {
      tenantId,
      status: "ACTIVE",
    };
    if (feeStructure.classId) studentWhere.classId = feeStructure.classId;
    if (feeStructure.batchId) studentWhere.batchId = feeStructure.batchId;

    const students = await prisma.student.findMany({
      where: studentWhere,
      select: { id: true, name: true },
    });

    if (students.length === 0) {
      return {
        success: false,
        error: "No active students found for this class/batch",
      };
    }

    const now = new Date();
    const month = validated.month || now.getMonth() + 1;
    const year = validated.year || now.getFullYear();

    // Check for existing fee records to avoid duplicates
    const existingPayments = await prisma.feePayment.findMany({
      where: {
        tenantId,
        feeStructureId: feeStructure.id,
        month: feeStructure.frequency === "ONE_TIME" ? null : month,
        year: feeStructure.frequency === "ONE_TIME" ? null : year,
      },
      select: { studentId: true },
    });

    const existingStudentIds = new Set(existingPayments.map((p) => p.studentId));
    const newStudents = students.filter((s) => !existingStudentIds.has(s.id));

    if (newStudents.length === 0) {
      return {
        success: false,
        error: "Fees already generated for all students in this period",
      };
    }

    // Bulk create pending fee payments
    await prisma.feePayment.createMany({
      data: newStudents.map((student) => ({
        tenantId,
        studentId: student.id,
        feeStructureId: feeStructure.id,
        amountDue: feeStructure.amount,
        amountPaid: 0,
        discount: 0,
        lateFee: 0,
        status: "PENDING" as PaymentStatus,
        month: feeStructure.frequency === "ONE_TIME" ? null : month,
        year: feeStructure.frequency === "ONE_TIME" ? null : year,
      })),
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "FEES_GENERATED",
      entityType: "FeeStructure",
      entityId: feeStructure.id,
      details: {
        feeName: feeStructure.name,
        studentsCount: newStudents.length,
        month,
        year,
      },
    });

    revalidatePath("/dashboard/fees");
    return {
      success: true,
      message: `Fees generated for ${newStudents.length} students`,
      data: { generated: newStudents.length, skipped: existingStudentIds.size },
    };
  } catch (error) {
    console.error("Generate fees error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate fees",
    };
  }
}

// ==================== Record Payment ====================

export async function recordPayment(data: {
  studentId: string;
  feePaymentIds: string[];
  amountPaying: number;
  discount?: number;
  discountReason?: string;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
}) {
  try {
    const user = await requireFeeAdmin();
    const tenantId = user.tenantId!;

    const validated = recordPaymentSchema.parse(data);

    // Verify student belongs to this tenant
    const student = await prisma.student.findFirst({
      where: { id: validated.studentId, tenantId },
      select: { id: true, name: true, admissionNo: true, guardianEmail: true, guardianPhone: true, guardianName: true },
    });
    if (!student) return { success: false, error: "Student not found" };

    // Get fee payments to process
    const feePayments = await prisma.feePayment.findMany({
      where: {
        id: { in: validated.feePaymentIds },
        tenantId,
        studentId: validated.studentId,
        status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
      },
      include: {
        feeStructure: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    if (feePayments.length === 0) {
      return { success: false, error: "No eligible fee payments found" };
    }

    // Generate receipt number
    const receiptSequence = await prisma.feePayment.count({
      where: { tenantId, receiptNo: { not: null } },
    });
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true },
    });
    const receiptNo = `RCPT-${(tenant?.slug || "EDU").toUpperCase()}-${new Date().getFullYear()}-${String(receiptSequence + 1).padStart(5, "0")}`;

    let remainingAmount = validated.amountPaying;
    const totalDiscount = validated.discount || 0;
    let distributeDiscount = totalDiscount;

    // Process payments in order
    const updatedPayments = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const payment of feePayments) {
        if (remainingAmount <= 0) break;

        const amountDue = Number(payment.amountDue);
        const alreadyPaid = Number(payment.amountPaid);
        const currentDiscount = Number(payment.discount);
        const currentLateFee = Number(payment.lateFee);
        const outstanding = amountDue - alreadyPaid - currentDiscount + currentLateFee;

        // Apply discount proportionally
        const discountForThis = Math.min(distributeDiscount, outstanding);
        distributeDiscount -= discountForThis;

        const effectiveOutstanding = outstanding - discountForThis;
        const amountForThis = Math.min(remainingAmount, effectiveOutstanding);
        remainingAmount -= amountForThis;

        const newAmountPaid = alreadyPaid + amountForThis;
        const newDiscount = currentDiscount + discountForThis;
        const totalOwed = amountDue + currentLateFee - newDiscount;
        const newStatus: PaymentStatus =
          newAmountPaid >= totalOwed ? "PAID" : "PARTIAL";

        const updated = await tx.feePayment.update({
          where: { id: payment.id },
          data: {
            amountPaid: newAmountPaid,
            discount: newDiscount,
            status: newStatus,
            paymentDate: new Date(validated.paymentDate),
            paymentMethod: validated.paymentMethod as never,
            receiptNo,
            notes: validated.notes || payment.notes,
            collectedBy: user.id,
          },
        });

        results.push({
          id: updated.id,
          feeName: payment.feeStructure.name,
          amountPaid: amountForThis,
          status: newStatus,
        });
      }

      return results;
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "PAYMENT_RECORDED",
      entityType: "FeePayment",
      entityId: receiptNo,
      details: {
        studentName: student.name,
        receiptNo,
        amountPaid: validated.amountPaying,
        discount: totalDiscount,
        method: validated.paymentMethod,
        paymentsProcessed: updatedPayments.length,
      },
    });

    // Send payment confirmation email to guardian
    if (student.guardianEmail) {
      const tenantInfo = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, slug: true, logoUrl: true, settings: true },
      });
      const totalDueForStudent = await prisma.feePayment.aggregate({
        where: { tenantId, studentId: student.id, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
        _sum: { amountDue: true, amountPaid: true, discount: true },
      });
      const remainingBalance =
        Number(totalDueForStudent._sum.amountDue || 0) -
        Number(totalDueForStudent._sum.amountPaid || 0) -
        Number(totalDueForStudent._sum.discount || 0);

      sendFeePaymentConfirmationEmail(
        student.guardianEmail,
        student.name,
        String(validated.amountPaying),
        receiptNo,
        new Date(validated.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        validated.paymentMethod.replace("_", " "),
        String(Math.max(0, remainingBalance)),
        tenantInfo?.name || "Your Institution"
      ).catch((err) => console.error("Fee confirmation email failed:", err));

      // Send WhatsApp payment confirmation
      if (student.guardianPhone && tenantInfo) {
        const waSettings = getWhatsAppSettings((tenantInfo.settings as Record<string, unknown>) || {});
        if (waSettings.enabled && waSettings.sendFeeReminders) {
          sendWhatsAppPaymentReceived({
            tenantId,
            tenantName: tenantInfo.name,
            tenantSlug: tenantInfo.slug,
            tenantLogoUrl: tenantInfo.logoUrl || undefined,
            recipientPhone: student.guardianPhone,
            recipientName: student.guardianName || student.name,
            studentName: student.name,
            amount: validated.amountPaying.toLocaleString("en-IN"),
            receiptNo,
          }).catch((err) => console.error("Fee confirmation WhatsApp failed:", err));
        }
      }
    }

    revalidatePath("/dashboard/fees");
    return {
      success: true,
      data: {
        receiptNo,
        updatedPayments,
        studentName: student.name,
        totalPaid: validated.amountPaying,
      },
    };
  } catch (error) {
    console.error("Record payment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to record payment",
    };
  }
}

// ==================== Get Student Fees ====================

export async function getStudentFees(studentId: string) {
  try {
    const user = await requireTenantUser();
    const tenantId = user.tenantId!;

    const student = await prisma.student.findFirst({
      where: { id: studentId, tenantId },
      select: {
        id: true,
        name: true,
        admissionNo: true,
        photoUrl: true,
        class: { select: { id: true, name: true, section: true } },
        batch: { select: { id: true, name: true } },
        guardianName: true,
        guardianPhone: true,
        guardianEmail: true,
      },
    });

    if (!student) return { success: false, error: "Student not found" };

    const payments = await prisma.feePayment.findMany({
      where: { tenantId, studentId },
      include: {
        feeStructure: {
          select: { name: true, frequency: true, amount: true, dueDay: true },
        },
        collector: { select: { name: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    const totalDue = payments.reduce((sum, p) => sum + Number(p.amountDue), 0);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
    const totalDiscount = payments.reduce(
      (sum, p) => sum + Number(p.discount),
      0
    );
    const totalLateFee = payments.reduce(
      (sum, p) => sum + Number(p.lateFee),
      0
    );
    const totalBalance = totalDue + totalLateFee - totalPaid - totalDiscount;

    return {
      success: true,
      data: {
        student: {
          ...student,
          className: student.class
            ? `${student.class.name}${student.class.section ? ` - ${student.class.section}` : ""}`
            : null,
          batchName: student.batch?.name || null,
        },
        payments: payments.map((p) => ({
          id: p.id,
          feeName: p.feeStructure.name,
          frequency: p.feeStructure.frequency,
          amountDue: Number(p.amountDue),
          amountPaid: Number(p.amountPaid),
          discount: Number(p.discount),
          lateFee: Number(p.lateFee),
          balance:
            Number(p.amountDue) +
            Number(p.lateFee) -
            Number(p.amountPaid) -
            Number(p.discount),
          status: p.status,
          month: p.month,
          year: p.year,
          paymentDate: p.paymentDate?.toISOString() || null,
          paymentMethod: p.paymentMethod,
          receiptNo: p.receiptNo,
          notes: p.notes,
          collectedBy: p.collector?.name || null,
          createdAt: p.createdAt.toISOString(),
        })),
        summary: {
          totalDue,
          totalPaid,
          totalDiscount,
          totalLateFee,
          totalBalance,
          paidCount: payments.filter((p) => p.status === "PAID").length,
          pendingCount: payments.filter(
            (p) => p.status === "PENDING" || p.status === "PARTIAL"
          ).length,
          overdueCount: payments.filter((p) => p.status === "OVERDUE").length,
        },
      },
    };
  } catch (error) {
    console.error("Get student fees error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch student fees",
    };
  }
}

// ==================== Fee Dashboard Stats ====================

export async function getFeeDashboardStats() {
  try {
    const user = await requireFeeAdmin();
    const tenantId = user.tenantId!;

    const currentYear = await prisma.academicYear.findFirst({
      where: { tenantId, isCurrent: true },
    });

    if (!currentYear) {
      return {
        success: true,
        data: {
          totalCollected: 0,
          totalPending: 0,
          totalOverdue: 0,
          collectionRate: 0,
          monthlyTrend: [],
          feeTypeSplit: [],
          classBatchSummary: [],
          recentPayments: [],
        },
      };
    }

    // Get all payments for current academic year
    const allPayments = await prisma.feePayment.findMany({
      where: {
        tenantId,
        feeStructure: { academicYearId: currentYear.id },
      },
      include: {
        feeStructure: { select: { name: true, classId: true, batchId: true } },
        student: {
          select: {
            name: true,
            admissionNo: true,
            class: { select: { name: true, section: true } },
            batch: { select: { name: true } },
          },
        },
      },
    });

    const totalCollected = allPayments.reduce(
      (sum, p) => sum + Number(p.amountPaid),
      0
    );
    const totalDue = allPayments.reduce(
      (sum, p) => sum + Number(p.amountDue),
      0
    );
    const totalPending = allPayments
      .filter((p) => ["PENDING", "PARTIAL"].includes(p.status))
      .reduce(
        (sum, p) =>
          sum +
          Number(p.amountDue) +
          Number(p.lateFee) -
          Number(p.amountPaid) -
          Number(p.discount),
        0
      );
    const totalOverdue = allPayments
      .filter((p) => p.status === "OVERDUE")
      .reduce(
        (sum, p) =>
          sum +
          Number(p.amountDue) +
          Number(p.lateFee) -
          Number(p.amountPaid) -
          Number(p.discount),
        0
      );
    const collectionRate =
      totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0;

    // Monthly collection trend (last 6 months)
    const monthlyTrend = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthNum = date.getMonth() + 1;
      const yearNum = date.getFullYear();
      const monthPayments = allPayments.filter(
        (p) =>
          p.paymentDate &&
          p.paymentDate.getMonth() + 1 === monthNum &&
          p.paymentDate.getFullYear() === yearNum
      );
      monthlyTrend.push({
        month: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        collected: monthPayments.reduce(
          (sum, p) => sum + Number(p.amountPaid),
          0
        ),
      });
    }

    // Fee type split
    const feeTypeMap = new Map<string, number>();
    allPayments.forEach((p) => {
      const name = p.feeStructure.name;
      feeTypeMap.set(name, (feeTypeMap.get(name) || 0) + Number(p.amountPaid));
    });
    const feeTypeSplit = Array.from(feeTypeMap.entries())
      .map(([name, collected]) => ({ name, collected }))
      .sort((a, b) => b.collected - a.collected)
      .slice(0, 8);

    // Class/batch-wise summary
    const classBatchMap = new Map<
      string,
      { name: string; totalDue: number; collected: number; pending: number }
    >();
    allPayments.forEach((p) => {
      const key =
        p.student.class
          ? `${p.student.class.name}${p.student.class.section ? ` - ${p.student.class.section}` : ""}`
          : p.student.batch?.name || "Unassigned";
      const current = classBatchMap.get(key) || {
        name: key,
        totalDue: 0,
        collected: 0,
        pending: 0,
      };
      current.totalDue += Number(p.amountDue);
      current.collected += Number(p.amountPaid);
      current.pending +=
        Number(p.amountDue) +
        Number(p.lateFee) -
        Number(p.amountPaid) -
        Number(p.discount);
      classBatchMap.set(key, current);
    });
    const classBatchSummary = Array.from(classBatchMap.values()).map((c) => ({
      ...c,
      percentage:
        c.totalDue > 0 ? Math.round((c.collected / c.totalDue) * 100) : 0,
    }));

    // Recent payments (last 15 with receipts)
    const recentPayments = allPayments
      .filter((p) => p.receiptNo)
      .sort(
        (a, b) =>
          (b.paymentDate?.getTime() || 0) - (a.paymentDate?.getTime() || 0)
      )
      .slice(0, 15)
      .map((p) => ({
        id: p.id,
        studentName: p.student.name,
        admissionNo: p.student.admissionNo,
        className: p.student.class
          ? `${p.student.class.name}${p.student.class.section ? ` - ${p.student.class.section}` : ""}`
          : p.student.batch?.name || "",
        feeName: p.feeStructure.name,
        amount: Number(p.amountPaid),
        method: p.paymentMethod,
        receiptNo: p.receiptNo,
        date: p.paymentDate?.toISOString() || p.createdAt.toISOString(),
      }));

    return {
      success: true,
      data: {
        totalCollected,
        totalPending,
        totalOverdue,
        collectionRate,
        monthlyTrend,
        feeTypeSplit,
        classBatchSummary,
        recentPayments,
      },
    };
  } catch (error) {
    console.error("Get fee dashboard stats error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch fee stats",
    };
  }
}

// ==================== Search Students for Fee Collection ====================

export async function searchStudentsForFees(query: string) {
  try {
    const user = await requireFeeAdmin();
    const tenantId = user.tenantId!;

    if (!query || query.length < 2) return { success: true, data: [] };

    const students = await prisma.student.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { admissionNo: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        admissionNo: true,
        photoUrl: true,
        class: { select: { name: true, section: true } },
        batch: { select: { name: true } },
      },
      take: 10,
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      data: students.map((s) => ({
        id: s.id,
        name: s.name,
        admissionNo: s.admissionNo,
        photoUrl: s.photoUrl,
        className: s.class
          ? `${s.class.name}${s.class.section ? ` - ${s.class.section}` : ""}`
          : null,
        batchName: s.batch?.name || null,
      })),
    };
  } catch (error) {
    console.error("Search students error:", error);
    return { success: false, error: "Failed to search students" };
  }
}

// ==================== Get Receipt Data ====================

export async function getReceiptData(paymentId: string) {
  try {
    const user = await requireTenantUser();
    const tenantId = user.tenantId!;

    // Find all payments with the same receipt number
    const sourcePayment = await prisma.feePayment.findFirst({
      where: { id: paymentId, tenantId },
      select: { receiptNo: true },
    });

    if (!sourcePayment?.receiptNo) {
      return { success: false, error: "Receipt not found" };
    }

    const payments = await prisma.feePayment.findMany({
      where: { tenantId, receiptNo: sourcePayment.receiptNo },
      include: {
        student: {
          select: {
            name: true,
            admissionNo: true,
            guardianName: true,
            class: { select: { name: true, section: true } },
            batch: { select: { name: true } },
          },
        },
        feeStructure: { select: { name: true, frequency: true } },
        collector: { select: { name: true } },
      },
    });

    if (payments.length === 0) {
      return { success: false, error: "Receipt not found" };
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        address: true,
        phone: true,
        email: true,
        logoUrl: true,
        city: true,
        state: true,
      },
    });

    const firstPayment = payments[0];
    const totalPaid = payments.reduce(
      (sum, p) => sum + Number(p.amountPaid),
      0
    );
    const totalDiscount = payments.reduce(
      (sum, p) => sum + Number(p.discount),
      0
    );
    const totalDue = payments.reduce(
      (sum, p) => sum + Number(p.amountDue),
      0
    );

    return {
      success: true,
      data: {
        receiptNo: sourcePayment.receiptNo,
        date: firstPayment.paymentDate?.toISOString() || firstPayment.createdAt.toISOString(),
        paymentMethod: firstPayment.paymentMethod,
        tenant: {
          name: tenant?.name || "",
          address: tenant?.address || "",
          phone: tenant?.phone || "",
          email: tenant?.email || "",
          logoUrl: tenant?.logoUrl || null,
          city: tenant?.city || "",
          state: tenant?.state || "",
        },
        student: {
          name: firstPayment.student.name,
          admissionNo: firstPayment.student.admissionNo,
          guardianName: firstPayment.student.guardianName,
          className: firstPayment.student.class
            ? `${firstPayment.student.class.name}${firstPayment.student.class.section ? ` - ${firstPayment.student.class.section}` : ""}`
            : null,
          batchName: firstPayment.student.batch?.name || null,
        },
        items: payments.map((p) => ({
          feeName: p.feeStructure.name,
          frequency: p.feeStructure.frequency,
          period:
            p.month && p.year
              ? `${new Date(p.year, p.month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
              : "One-Time",
          amountDue: Number(p.amountDue),
          discount: Number(p.discount),
          lateFee: Number(p.lateFee),
          amountPaid: Number(p.amountPaid),
        })),
        totalDue,
        totalDiscount,
        totalPaid,
        balance: totalDue - totalPaid - totalDiscount,
        collectedBy: firstPayment.collector?.name || "N/A",
      },
    };
  } catch (error) {
    console.error("Get receipt data error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch receipt",
    };
  }
}

// ==================== Apply Late Fees ====================

export async function applyLateFees() {
  try {
    const user = await requireFeeAdmin();
    const tenantId = user.tenantId!;

    const now = new Date();
    const currentDay = now.getDate();

    // Find overdue payments with fee structures that have late fees
    const overduePayments = await prisma.feePayment.findMany({
      where: {
        tenantId,
        status: { in: ["PENDING", "PARTIAL"] },
        feeStructure: { lateFee: { gt: 0 } },
      },
      include: {
        feeStructure: { select: { dueDay: true, lateFee: true } },
      },
    });

    let updatedCount = 0;
    for (const payment of overduePayments) {
      const dueDay = payment.feeStructure.dueDay;
      // Check if past due day and late fee not already applied
      if (currentDay > dueDay && Number(payment.lateFee) === 0) {
        await prisma.feePayment.update({
          where: { id: payment.id },
          data: {
            lateFee: payment.feeStructure.lateFee,
            status: "OVERDUE",
          },
        });
        updatedCount++;
      }
    }

    revalidatePath("/dashboard/fees");
    return {
      success: true,
      message: `Late fees applied to ${updatedCount} payments`,
    };
  } catch (error) {
    console.error("Apply late fees error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to apply late fees",
    };
  }
}

// ==================== Get Fee Defaulters ====================

export async function getFeeDefaulters(filters?: {
  classId?: string;
  batchId?: string;
}) {
  try {
    const user = await requireFeeAdmin();
    const tenantId = user.tenantId!;

    const where: Record<string, unknown> = {
      tenantId,
      status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
    };

    if (filters?.classId) {
      where.student = { classId: filters.classId };
    }
    if (filters?.batchId) {
      where.student = { batchId: filters.batchId };
    }

    const overduePayments = await prisma.feePayment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            admissionNo: true,
            guardianName: true,
            guardianPhone: true,
            guardianEmail: true,
            class: { select: { name: true, section: true } },
            batch: { select: { name: true } },
          },
        },
        feeStructure: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by student
    const studentMap = new Map<
      string,
      {
        student: (typeof overduePayments)[0]["student"];
        totalPending: number;
        fees: { feeName: string; amount: number; status: string }[];
      }
    >();

    for (const p of overduePayments) {
      const existing = studentMap.get(p.studentId) || {
        student: p.student,
        totalPending: 0,
        fees: [],
      };
      const balance =
        Number(p.amountDue) +
        Number(p.lateFee) -
        Number(p.amountPaid) -
        Number(p.discount);
      existing.totalPending += balance;
      existing.fees.push({
        feeName: p.feeStructure.name,
        amount: balance,
        status: p.status,
      });
      studentMap.set(p.studentId, existing);
    }

    const defaulters = Array.from(studentMap.entries())
      .map(([studentId, data]) => ({
        studentId,
        studentName: data.student.name,
        admissionNo: data.student.admissionNo,
        className: data.student.class
          ? `${data.student.class.name}${data.student.class.section ? ` - ${data.student.class.section}` : ""}`
          : data.student.batch?.name || "",
        guardianName: data.student.guardianName,
        guardianPhone: data.student.guardianPhone,
        guardianEmail: data.student.guardianEmail,
        totalPending: data.totalPending,
        feeCount: data.fees.length,
        fees: data.fees,
      }))
      .sort((a, b) => b.totalPending - a.totalPending);

    return { success: true, data: defaulters };
  } catch (error) {
    console.error("Get fee defaulters error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch defaulters",
    };
  }
}

// ==================== Send Fee Reminders (Manual) ====================

export async function sendFeeReminders(studentIds: string[]) {
  try {
    const user = await requireFeeAdmin();
    const tenantId = user.tenantId!;

    let sentCount = 0;
    let failedCount = 0;

    for (const studentId of studentIds) {
      const student = await prisma.student.findFirst({
        where: { id: studentId, tenantId },
        select: {
          name: true,
          guardianEmail: true,
          guardianName: true,
        },
      });

      if (!student?.guardianEmail) {
        failedCount++;
        continue;
      }

      const pendingFees = await prisma.feePayment.findMany({
        where: {
          tenantId,
          studentId,
          status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
        },
        include: {
          feeStructure: { select: { name: true, dueDay: true } },
        },
      });

      if (pendingFees.length === 0) continue;

      const totalPending = pendingFees.reduce(
        (sum, p) =>
          sum +
          Number(p.amountDue) +
          Number(p.lateFee) -
          Number(p.amountPaid) -
          Number(p.discount),
        0
      );

      // Create in-app notification
      await createSystemNotification({
        tenantId,
        type: "FEE_REMINDER",
        title: "Fee Payment Reminder",
        message: `You have pending fees of ₹${totalPending.toLocaleString("en-IN")}. Please make the payment to avoid late charges.`,
        targetRoles: ["STUDENT", "PARENT"],
        createdBy: user.id,
      });

      sentCount++;
    }

    await logAudit({
      tenantId,
      userId: user.id,
      action: "FEE_REMINDERS_SENT",
      entityType: "FeePayment",
      details: { sentCount, failedCount },
    });

    revalidatePath("/dashboard/fees");
    return {
      success: true,
      message: `Reminders sent to ${sentCount} students. ${failedCount} failed (no guardian email).`,
    };
  } catch (error) {
    console.error("Send fee reminders error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send reminders",
    };
  }
}

// ==================== My Fees (Student/Parent) ====================

export async function getMyFees(childId?: string) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.tenantId) {
      throw new Error("Unauthorized");
    }
    const user = session.user;
    const tenantId = user.tenantId!;

    let studentId: string | undefined;

    if (user.role === "STUDENT") {
      const student = await prisma.student.findFirst({
        where: { tenantId, userId: user.id },
        select: { id: true },
      });
      studentId = student?.id;
    } else if (user.role === "PARENT") {
      if (childId) {
        const child = await prisma.student.findFirst({
          where: { id: childId, tenantId, parentUserId: user.id },
          select: { id: true },
        });
        studentId = child?.id;
      } else {
        const firstChild = await prisma.student.findFirst({
          where: { tenantId, parentUserId: user.id, status: "ACTIVE" },
          select: { id: true },
        });
        studentId = firstChild?.id;
      }
    }

    if (!studentId) {
      return { success: true, data: { payments: [], summary: null } };
    }

    return getStudentFees(studentId);
  } catch (error) {
    console.error("Get my fees error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch fees",
    };
  }
}

// ==================== Waive Fee ====================

export async function waiveFee(paymentId: string, reason: string) {
  try {
    const user = await requireFeeAdmin();
    const tenantId = user.tenantId!;

    const payment = await prisma.feePayment.findFirst({
      where: { id: paymentId, tenantId },
      include: {
        student: { select: { name: true } },
        feeStructure: { select: { name: true } },
      },
    });

    if (!payment) return { success: false, error: "Payment not found" };
    if (payment.status === "PAID" || payment.status === "WAIVED") {
      return { success: false, error: "Cannot waive an already paid/waived fee" };
    }

    await prisma.feePayment.update({
      where: { id: paymentId },
      data: {
        status: "WAIVED",
        notes: `Waived: ${reason}`,
        collectedBy: user.id,
      },
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "FEE_WAIVED",
      entityType: "FeePayment",
      entityId: paymentId,
      details: {
        studentName: payment.student.name,
        feeName: payment.feeStructure.name,
        amount: Number(payment.amountDue),
        reason,
      },
    });

    revalidatePath("/dashboard/fees");
    return { success: true, message: "Fee waived successfully" };
  } catch (error) {
    console.error("Waive fee error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to waive fee",
    };
  }
}
