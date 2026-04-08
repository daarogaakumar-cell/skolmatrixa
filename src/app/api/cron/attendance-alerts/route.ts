import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAttendanceAlertEmail } from "@/lib/email";
import { sendWhatsAppAttendanceAlert, getWhatsAppSettings } from "@/lib/whatsapp";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateStr = format(today, "yyyy-MM-dd");

    // Find all absent/late records for today that haven't been alerted yet
    const records = await prisma.attendance.findMany({
      where: {
        date: today,
        status: { in: ["ABSENT", "LATE"] },
        alertSent: false,
      },
      include: {
        student: {
          select: {
            name: true,
            guardianEmail: true,
            guardianPhone: true,
            guardianName: true,
          },
        },
        tenant: {
          select: { id: true, name: true, slug: true, logoUrl: true, settings: true },
        },
      },
    });

    let emailSentCount = 0;
    let whatsappSentCount = 0;
    const errors: string[] = [];

    for (const record of records) {
      const guardianEmail = record.student.guardianEmail;
      const guardianPhone = record.student.guardianPhone;
      const statusLabel = record.status === "ABSENT" ? "Absent" : "Late";
      const dateFormatted = format(today, "dd MMM yyyy");
      let alertSucceeded = false;

      // Send email
      if (guardianEmail) {
        try {
          const result = await sendAttendanceAlertEmail(
            guardianEmail,
            record.student.name,
            dateFormatted,
            statusLabel,
            record.tenant.name
          );
          if (result.success) {
            emailSentCount++;
            alertSucceeded = true;
          }
        } catch (err) {
          errors.push(`Email for ${record.student.name}: ${err instanceof Error ? err.message : "Unknown"}`);
        }
      }

      // Send WhatsApp
      if (guardianPhone) {
        const tenantSettings = (record.tenant.settings as Record<string, unknown>) || {};
        const waSettings = getWhatsAppSettings(tenantSettings);
        if (waSettings.enabled && waSettings.sendAttendanceAlerts) {
          try {
            const waResult = await sendWhatsAppAttendanceAlert({
              tenantId: record.tenant.id,
              tenantName: record.tenant.name,
              tenantSlug: record.tenant.slug,
              tenantLogoUrl: record.tenant.logoUrl || undefined,
              recipientPhone: guardianPhone,
              recipientName: record.student.guardianName || record.student.name,
              studentName: record.student.name,
              status: statusLabel,
              date: dateFormatted,
            });
            if (waResult.success) {
              whatsappSentCount++;
              alertSucceeded = true;
            }
          } catch (err) {
            errors.push(`WhatsApp for ${record.student.name}: ${err instanceof Error ? err.message : "Unknown"}`);
          }
        }
      }

      // Mark alerted if at least one channel succeeded
      if (alertSucceeded) {
        await prisma.attendance.update({
          where: { id: record.id },
          data: { alertSent: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Attendance alerts processed for ${dateStr}`,
      total: records.length,
      emailSent: emailSentCount,
      whatsappSent: whatsappSentCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("Attendance alert cron error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
