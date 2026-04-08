import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Cron job: Mark stale WhatsApp messages as failed.
 *
 * Messages stuck in PENDING or SENT for more than 24 hours are
 * marked FAILED since they likely didn't get a webhook callback.
 * This keeps the logs accurate without polling MSG91's API.
 *
 * Run every 30 minutes via vercel.json or cron scheduler:
 *   GET /api/cron/whatsapp-status
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const staleThreshold = new Date();
    staleThreshold.setHours(staleThreshold.getHours() - 24);

    // Mark messages stuck in PENDING for > 24h as FAILED
    const stalePending = await prisma.whatsAppLog.updateMany({
      where: {
        status: "PENDING",
        createdAt: { lt: staleThreshold },
      },
      data: {
        status: "FAILED",
        errorMessage: "No delivery confirmation received within 24 hours",
      },
    });

    // Mark messages stuck in SENT for > 48h as DELIVERED (likely delivered but webhook missed)
    const deliveredThreshold = new Date();
    deliveredThreshold.setHours(deliveredThreshold.getHours() - 48);

    const staleSent = await prisma.whatsAppLog.updateMany({
      where: {
        status: "SENT",
        createdAt: { lt: deliveredThreshold },
      },
      data: {
        status: "DELIVERED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "WhatsApp status cleanup completed",
      markedFailed: stalePending.count,
      markedDelivered: staleSent.count,
    });
  } catch (error) {
    console.error("WhatsApp status cron error:", error);
    return NextResponse.json(
      { error: "Failed to process status updates" },
      { status: 500 }
    );
  }
}
