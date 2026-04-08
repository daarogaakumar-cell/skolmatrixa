import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendFeeReminderEmail } from "@/lib/email";
import { sendWhatsAppFeeReminder, getWhatsAppSettings } from "@/lib/whatsapp";
import { PaymentStatus } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    let appliedLateFees = 0;
    let remindersSent = 0;

    // 1. Apply late fees to overdue payments that don't have late fee yet
    const overduePayments = await prisma.feePayment.findMany({
      where: {
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] },
        lateFee: 0,
        feeStructure: {
          lateFee: { gt: 0 },
          dueDay: { lt: now.getDate() },
        },
        OR: [
          {
            month: { lt: now.getMonth() + 1 },
            year: now.getFullYear(),
          },
          {
            year: { lt: now.getFullYear() },
          },
          {
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            feeStructure: { dueDay: { lt: now.getDate() } },
          },
        ],
      },
      include: {
        feeStructure: { select: { lateFee: true } },
      },
    });

    for (const payment of overduePayments) {
      const lateFee = Number(payment.feeStructure.lateFee || 0);
      if (lateFee > 0) {
        await prisma.feePayment.update({
          where: { id: payment.id },
          data: {
            lateFee,
            status: PaymentStatus.OVERDUE,
          },
        });
        appliedLateFees++;
      }
    }

    // 2. Mark overdue payments that are past due
    await prisma.feePayment.updateMany({
      where: {
        status: PaymentStatus.PENDING,
        OR: [
          {
            month: { lt: now.getMonth() + 1 },
            year: now.getFullYear(),
          },
          {
            year: { lt: now.getFullYear() },
          },
        ],
      },
      data: { status: PaymentStatus.OVERDUE },
    });

    // 3. Send fee reminders for pending/overdue fees
    const pendingPayments = await prisma.feePayment.findMany({
      where: {
        status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
      },
      include: {
        student: {
          select: {
            name: true,
            guardianEmail: true,
            guardianPhone: true,
            guardianName: true,
            tenant: { select: { id: true, name: true, slug: true, logoUrl: true, settings: true } },
          },
        },
        feeStructure: {
          select: { name: true, dueDay: true },
        },
      },
    });

    // Group by student to avoid spam
    const studentGroups = new Map<
      string,
      {
        studentName: string;
        guardianEmail: string | null;
        guardianPhone: string | null;
        guardianName: string | null;
        tenantId: string;
        tenantName: string;
        tenantSlug: string;
        tenantLogoUrl: string | null;
        tenantSettings: Record<string, unknown>;
        totalDue: number;
        dueDate: string;
      }
    >();

    for (const p of pendingPayments) {
      const studentId = p.studentId;
      const existing = studentGroups.get(studentId);
      const balance =
        Number(p.amountDue) + Number(p.lateFee) - Number(p.amountPaid) - Number(p.discount);
      const dueDay = p.feeStructure.dueDay || 10;
      const dueDate = p.month && p.year
        ? `${dueDay}/${p.month}/${p.year}`
        : `${dueDay} of month`;

      if (existing) {
        existing.totalDue += balance;
      } else {
        studentGroups.set(studentId, {
          studentName: p.student.name,
          guardianEmail: p.student.guardianEmail,
          guardianPhone: p.student.guardianPhone,
          guardianName: p.student.guardianName,
          tenantId: p.student.tenant.id,
          tenantName: p.student.tenant.name,
          tenantSlug: p.student.tenant.slug,
          tenantLogoUrl: p.student.tenant.logoUrl,
          tenantSettings: (p.student.tenant.settings as Record<string, unknown>) || {},
          totalDue: balance,
          dueDate,
        });
      }
    }

    let whatsappSent = 0;

    for (const [, info] of studentGroups) {
      if (info.totalDue <= 0) continue;

      // Send email
      if (info.guardianEmail) {
        try {
          await sendFeeReminderEmail(
            info.guardianEmail,
            info.studentName,
            info.totalDue.toLocaleString("en-IN"),
            info.dueDate,
            info.tenantName
          );
          remindersSent++;
        } catch {
          // Continue on email failure
        }
      }

      // Send WhatsApp
      if (info.guardianPhone) {
        const waSettings = getWhatsAppSettings(info.tenantSettings);
        if (waSettings.enabled && waSettings.sendFeeReminders) {
          try {
            const waResult = await sendWhatsAppFeeReminder({
              tenantId: info.tenantId,
              tenantName: info.tenantName,
              tenantSlug: info.tenantSlug,
              tenantLogoUrl: info.tenantLogoUrl || undefined,
              recipientPhone: info.guardianPhone,
              recipientName: info.guardianName || info.studentName,
              studentName: info.studentName,
              amount: `₹${info.totalDue.toLocaleString("en-IN")}`,
              dueDate: info.dueDate,
            });
            if (waResult.success) whatsappSent++;
          } catch {
            // Continue on WhatsApp failure
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Fee reminders processed",
      appliedLateFees,
      emailRemindersSent: remindersSent,
      whatsappRemindersSent: whatsappSent,
      overdueMarked: overduePayments.length,
    });
  } catch (error) {
    console.error("Fee reminder cron error:", error);
    return NextResponse.json(
      { error: "Failed to process fee reminders" },
      { status: 500 }
    );
  }
}
