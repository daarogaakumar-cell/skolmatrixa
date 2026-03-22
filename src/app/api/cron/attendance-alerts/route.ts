import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAttendanceAlertEmail } from "@/lib/email";
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
          },
        },
        tenant: {
          select: { name: true },
        },
      },
    });

    let sentCount = 0;
    const errors: string[] = [];

    for (const record of records) {
      const guardianEmail = record.student.guardianEmail;
      if (!guardianEmail) continue;

      try {
        const result = await sendAttendanceAlertEmail(
          guardianEmail,
          record.student.name,
          format(today, "dd MMM yyyy"),
          record.status === "ABSENT" ? "Absent" : "Late",
          record.tenant.name
        );

        if (result.success) {
          await prisma.attendance.update({
            where: { id: record.id },
            data: { alertSent: true },
          });
          sentCount++;
        } else {
          errors.push(`Failed to send to ${guardianEmail}`);
        }
      } catch (err) {
        errors.push(`Error for ${record.student.name}: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Attendance alerts processed for ${dateStr}`,
      total: records.length,
      sent: sentCount,
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
