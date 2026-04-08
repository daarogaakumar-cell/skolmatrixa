import { NextRequest, NextResponse } from "next/server";
import { updateWhatsAppStatus } from "@/lib/whatsapp";

/**
 * MSG91 WhatsApp webhook endpoint for delivery status updates.
 * Configure this URL in your MSG91 dashboard:
 *   POST https://your-domain.com/api/webhooks/msg91
 * 
 * MSG91 sends status callbacks with message delivery updates:
 *   - sent, delivered, read, failed
 */
export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret (optional but recommended)
    const webhookSecret = process.env.MSG91_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = req.headers.get("x-webhook-secret") || req.headers.get("authorization");
      if (authHeader !== webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();

    // MSG91 webhook payload structure:
    // { request_id, type, phone, timestamp, status, ... }
    // or array of status updates
    const updates = Array.isArray(body) ? body : [body];

    let processed = 0;

    for (const update of updates) {
      const msgId = update.request_id || update.requestId || update.id;
      const rawStatus = (update.status || update.type || "").toLowerCase();

      if (!msgId) continue;

      // Map MSG91 status to our enum
      let status: "SENT" | "DELIVERED" | "READ" | "FAILED" | null = null;

      switch (rawStatus) {
        case "sent":
        case "accepted":
          status = "SENT";
          break;
        case "delivered":
          status = "DELIVERED";
          break;
        case "read":
          status = "READ";
          break;
        case "failed":
        case "rejected":
        case "undelivered":
          status = "FAILED";
          break;
      }

      if (status) {
        const errorMessage = rawStatus === "failed" || rawStatus === "rejected" || rawStatus === "undelivered"
          ? (update.reason || update.error || update.description || `Status: ${rawStatus}`)
          : undefined;

        await updateWhatsAppStatus(msgId, status, errorMessage);
        processed++;
      }
    }

    return NextResponse.json({ success: true, processed });
  } catch (error) {
    console.error("MSG91 webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// MSG91 may send GET for webhook verification
export async function GET() {
  return NextResponse.json({ status: "ok", service: "skolmatrixa-whatsapp-webhook" });
}
