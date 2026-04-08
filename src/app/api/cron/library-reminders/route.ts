import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppLibraryDue, getWhatsAppSettings } from "@/lib/whatsapp";
import { format, addDays } from "date-fns";

/**
 * Cron job: Send WhatsApp reminders for library book due dates.
 * Handles both School Library (SchoolBookIssue → Student) and
 * Standalone Library (LibraryBookIssue → LibraryMember).
 *
 * Runs daily. Sends reminders for books due today or overdue.
 * Configure in vercel.json or your cron scheduler:
 *   GET /api/cron/library-reminders
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const tomorrow = addDays(now, 1);
    tomorrow.setHours(23, 59, 59, 999);

    let schoolReminders = 0;
    let libraryReminders = 0;
    const errors: string[] = [];

    // ── School Library: SchoolBookIssue (books due today or overdue) ──
    const schoolOverdue = await prisma.schoolBookIssue.findMany({
      where: {
        status: "ISSUED",
        dueDate: { lte: tomorrow },
      },
      include: {
        book: { select: { title: true } },
        student: {
          select: {
            name: true,
            guardianPhone: true,
            guardianName: true,
            phone: true,
          },
        },
        tenant: {
          select: { id: true, name: true, slug: true, logoUrl: true, settings: true },
        },
      },
    });

    for (const issue of schoolOverdue) {
      const tenantSettings = (issue.tenant.settings as Record<string, unknown>) || {};
      const waSettings = getWhatsAppSettings(tenantSettings);
      if (!waSettings.enabled || !waSettings.sendLibraryReminders) continue;

      const phone = issue.student.guardianPhone || issue.student.phone;
      if (!phone) continue;

      const recipientName = issue.student.guardianName || issue.student.name;
      const dueDateStr = format(issue.dueDate, "dd MMM yyyy");

      try {
        const result = await sendWhatsAppLibraryDue({
          tenantId: issue.tenant.id,
          tenantName: issue.tenant.name,
          tenantSlug: issue.tenant.slug,
          tenantLogoUrl: issue.tenant.logoUrl || undefined,
          recipientPhone: phone,
          recipientName: recipientName,
          memberName: issue.student.name,
          bookTitle: issue.book.title,
          dueDate: dueDateStr,
        });
        if (result.success) schoolReminders++;
      } catch (err) {
        errors.push(`School: ${issue.student.name} - ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    // ── Standalone Library: LibraryBookIssue (books due today or overdue) ──
    const libraryOverdue = await prisma.libraryBookIssue.findMany({
      where: {
        status: "ISSUED",
        dueDate: { lte: tomorrow },
      },
      include: {
        book: { select: { title: true } },
        member: {
          select: { name: true, phone: true },
        },
        tenant: {
          select: { id: true, name: true, slug: true, logoUrl: true, settings: true },
        },
      },
    });

    for (const issue of libraryOverdue) {
      const tenantSettings = (issue.tenant.settings as Record<string, unknown>) || {};
      const waSettings = getWhatsAppSettings(tenantSettings);
      if (!waSettings.enabled || !waSettings.sendLibraryReminders) continue;

      if (!issue.member.phone) continue;

      const dueDateStr = format(issue.dueDate, "dd MMM yyyy");

      try {
        const result = await sendWhatsAppLibraryDue({
          tenantId: issue.tenant.id,
          tenantName: issue.tenant.name,
          tenantSlug: issue.tenant.slug,
          tenantLogoUrl: issue.tenant.logoUrl || undefined,
          recipientPhone: issue.member.phone,
          recipientName: issue.member.name,
          memberName: issue.member.name,
          bookTitle: issue.book.title,
          dueDate: dueDateStr,
        });
        if (result.success) libraryReminders++;
      } catch (err) {
        errors.push(`Library: ${issue.member.name} - ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Library reminders processed",
      schoolReminders,
      libraryReminders,
      totalProcessed: schoolOverdue.length + libraryOverdue.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Library reminder cron error:", error);
    return NextResponse.json(
      { error: "Failed to process library reminders" },
      { status: 500 }
    );
  }
}
