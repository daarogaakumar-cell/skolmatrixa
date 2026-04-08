import { prisma } from "@/lib/prisma";

// ==================== Configuration ====================

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || "";
const MSG91_INTEGRATED_NUMBER = process.env.MSG91_INTEGRATED_NUMBER || "";
const MSG91_BASE_URL = "https://control.msg91.com/api/v5/whatsapp";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://skolmatrixa.com";

// Platform-level: single MSG91 account, all tenants use it
// Charged per-message to tenants via WhatsAppLog tracking

// ==================== Types ====================

export interface WhatsAppTemplateVariable {
  [key: string]: string;
}

export interface WhatsAppRecipient {
  phone: string;
  name?: string;
}

interface MSG91SendPayload {
  integrated_number: string;
  content_type: "template";
  payload: {
    messaging_product: "whatsapp";
    type: "template";
    template: {
      name: string;
      language: {
        code: string;
        policy: "deterministic";
      };
      namespace?: string;
      to_and_components: Array<{
        to: string[];
        components: MSG91Component[];
      }>;
    };
  };
}

interface MSG91Component {
  type: "header" | "body" | "button";
  sub_type?: string;
  index?: string;
  parameters: Array<{
    type: "text" | "image";
    text?: string;
    image?: { link: string };
  }>;
}

interface MSG91Response {
  message?: string;
  msg?: string;
  request_id?: string;
  type?: string;
}

// ==================== Template Definitions ====================

// Common templates (available to all tenant types)
export type WhatsAppCommonTemplate =
  | "fee_reminder"
  | "fee_overdue"
  | "payment_received"
  | "attendance_alert"
  | "event_notification"
  | "result_published"
  | "general_announcement"
  | "library_due"
  | "welcome_message";

// School-specific templates
export type WhatsAppSchoolTemplate =
  | "ptm_reminder"
  | "exam_schedule";

// Coaching-specific templates
export type WhatsAppCoachingTemplate =
  | "batch_change"
  | "mock_result";

// Library-specific templates
export type WhatsAppLibraryTemplate =
  | "seat_allocation"
  | "membership_expiry";

export type WhatsAppTemplate =
  | WhatsAppCommonTemplate
  | WhatsAppSchoolTemplate
  | WhatsAppCoachingTemplate
  | WhatsAppLibraryTemplate;

// Category mapping for each template (for logging & analytics)
const TEMPLATE_CATEGORY: Record<WhatsAppTemplate, string> = {
  fee_reminder: "FEE_REMINDER",
  fee_overdue: "FEE_REMINDER",
  payment_received: "FEE_REMINDER",
  attendance_alert: "ATTENDANCE",
  event_notification: "EVENT",
  result_published: "RESULT",
  general_announcement: "GENERAL",
  library_due: "LIBRARY_DUE",
  welcome_message: "GENERAL",
  // School-specific
  ptm_reminder: "PTM",
  exam_schedule: "EXAM",
  // Coaching-specific
  batch_change: "BATCH",
  mock_result: "MOCK_TEST",
  // Library-specific
  seat_allocation: "SEAT",
  membership_expiry: "MEMBERSHIP",
};

// Template availability by tenant type
export type TenantTypeKey = "SCHOOL" | "COACHING_INSTITUTE" | "LIBRARY";

const TENANT_TEMPLATES: Record<TenantTypeKey, WhatsAppTemplate[]> = {
  SCHOOL: [
    "fee_reminder", "fee_overdue", "payment_received",
    "attendance_alert", "event_notification", "result_published",
    "general_announcement", "library_due", "welcome_message",
    "ptm_reminder", "exam_schedule",
  ],
  COACHING_INSTITUTE: [
    "fee_reminder", "fee_overdue", "payment_received",
    "attendance_alert", "event_notification", "result_published",
    "general_announcement", "welcome_message",
    "batch_change", "mock_result",
  ],
  LIBRARY: [
    "fee_reminder", "payment_received",
    "general_announcement", "library_due", "welcome_message",
    "seat_allocation", "membership_expiry",
  ],
};

/**
 * Get templates available for a tenant type.
 */
export function getTemplatesForTenantType(tenantType: TenantTypeKey): WhatsAppTemplate[] {
  return TENANT_TEMPLATES[tenantType] || TENANT_TEMPLATES.SCHOOL;
}

/**
 * Human-readable template names for UI display.
 */
export const TEMPLATE_LABELS: Record<WhatsAppTemplate, string> = {
  fee_reminder: "Fee Reminder",
  fee_overdue: "Fee Overdue Alert",
  payment_received: "Payment Confirmation",
  attendance_alert: "Attendance Alert",
  event_notification: "Event Notification",
  result_published: "Result Published",
  general_announcement: "General Announcement",
  library_due: "Library Due Reminder",
  welcome_message: "Welcome Message",
  ptm_reminder: "PTM Reminder",
  exam_schedule: "Exam Schedule",
  batch_change: "Batch Change Notice",
  mock_result: "Mock Test Result",
  seat_allocation: "Seat Allocation",
  membership_expiry: "Membership Expiry",
};

// ==================== Phone Number Helpers ====================

/**
 * Normalize phone to E.164 format for Indian numbers.
 * Handles: 9876543210, 09876543210, +919876543210, 919876543210
 */
export function normalizePhone(phone: string, defaultCountryCode = "91"): string | null {
  if (!phone) return null;

  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, "");

  // Remove leading +
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  // Remove leading 0 (Indian local format)
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  // If it's 10 digits, prepend country code
  if (cleaned.length === 10) {
    cleaned = defaultCountryCode + cleaned;
  }

  // Validate: must be 12 digits for Indian numbers (91 + 10)
  if (cleaned.length < 11 || cleaned.length > 15) {
    return null;
  }

  return cleaned;
}

/**
 * Check if WhatsApp is enabled for a tenant based on their settings.
 */
export function isWhatsAppEnabled(settings: Record<string, unknown>): boolean {
  const waSettings = settings?.whatsapp as Record<string, unknown> | undefined;
  return waSettings?.enabled === true;
}

/**
 * Get WhatsApp settings from tenant settings JSON.
 */
export function getWhatsAppSettings(settings: Record<string, unknown>): {
  enabled: boolean;
  sendFeeReminders: boolean;
  sendAttendanceAlerts: boolean;
  sendEventNotifications: boolean;
  sendResultNotifications: boolean;
  sendLibraryReminders: boolean;
  dailyLimit: number;
  defaultCountryCode: string;
} {
  const waSettings = (settings?.whatsapp ?? {}) as Record<string, unknown>;
  return {
    enabled: waSettings.enabled === true,
    sendFeeReminders: waSettings.sendFeeReminders !== false,
    sendAttendanceAlerts: waSettings.sendAttendanceAlerts !== false,
    sendEventNotifications: waSettings.sendEventNotifications !== false,
    sendResultNotifications: waSettings.sendResultNotifications !== false,
    sendLibraryReminders: waSettings.sendLibraryReminders !== false,
    dailyLimit: (waSettings.dailyLimit as number) || 500,
    defaultCountryCode: (waSettings.defaultCountryCode as string) || "91",
  };
}

// ==================== Core MSG91 API ====================

/**
 * Build template components for MSG91 WhatsApp API.
 * Supports header image (branding), body variables, and CTA buttons.
 */
function buildComponents(
  variables: WhatsAppTemplateVariable,
  headerImageUrl?: string,
  ctaButtons?: Array<{ index: number; subType: "url" | "quick_reply"; text: string }>
): MSG91Component[] {
  const components: MSG91Component[] = [];

  // Header image (tenant logo / branding)
  if (headerImageUrl) {
    components.push({
      type: "header",
      parameters: [
        {
          type: "image",
          image: { link: headerImageUrl },
        },
      ],
    });
  }

  // Body variables — positional ({{1}}, {{2}}, {{3}}, etc.)
  const bodyParams = Object.values(variables).map((value) => ({
    type: "text" as const,
    text: value,
  }));

  if (bodyParams.length > 0) {
    components.push({
      type: "body",
      parameters: bodyParams,
    });
  }

  // CTA buttons (dynamic URL suffix or quick reply)
  if (ctaButtons && ctaButtons.length > 0) {
    for (const btn of ctaButtons) {
      components.push({
        type: "button",
        sub_type: btn.subType,
        index: String(btn.index),
        parameters: [{ type: "text", text: btn.text }],
      });
    }
  }

  return components;
}

/**
 * Send a single WhatsApp message via MSG91.
 */
export async function sendWhatsAppMessage(params: {
  tenantId: string;
  templateName: WhatsAppTemplate;
  recipientPhone: string;
  recipientName?: string;
  variables: WhatsAppTemplateVariable;
  headerImageUrl?: string;
  ctaButtons?: Array<{ index: number; subType: "url" | "quick_reply"; text: string }>;
}): Promise<{ success: boolean; msgId?: string; error?: string }> {
  const { tenantId, templateName, recipientPhone, recipientName, variables, headerImageUrl, ctaButtons } = params;

  if (!MSG91_AUTH_KEY) {
    console.error("MSG91_AUTH_KEY not configured");
    return { success: false, error: "WhatsApp service not configured" };
  }

  const phone = normalizePhone(recipientPhone);
  if (!phone) {
    return { success: false, error: `Invalid phone number: ${recipientPhone}` };
  }

  const components = buildComponents(variables, headerImageUrl, ctaButtons);

  const payload: MSG91SendPayload = {
    integrated_number: MSG91_INTEGRATED_NUMBER,
    content_type: "template",
    payload: {
      messaging_product: "whatsapp",
      type: "template",
      template: {
        name: templateName,
        language: {
          code: "en",
          policy: "deterministic",
        },
        to_and_components: [
          {
            to: [phone],
            components,
          },
        ],
      },
    },
  };

  try {
    const response = await fetch(`${MSG91_BASE_URL}/whatsapp-outbound-message/bulk/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: MSG91_AUTH_KEY,
      },
      body: JSON.stringify(payload),
    });

    const result: MSG91Response = await response.json();

    const isSuccess = response.ok && (result.type === "success" || result.message === "success" || !!result.request_id);
    const msgId = result.request_id || undefined;

    // Log to DB
    await prisma.whatsAppLog.create({
      data: {
        tenantId,
        templateName,
        recipientPhone: phone,
        recipientName: recipientName || null,
        status: isSuccess ? "SENT" : "FAILED",
        msgId: msgId || null,
        errorMessage: isSuccess ? null : (result.message || result.msg || "Unknown error"),
        variables: variables as Record<string, string>,
        category: TEMPLATE_CATEGORY[templateName] || "GENERAL",
      },
    });

    if (!isSuccess) {
      console.error("MSG91 WhatsApp error:", result);
      return { success: false, error: result.message || result.msg || "Failed to send" };
    }

    return { success: true, msgId };
  } catch (error) {
    console.error("WhatsApp send error:", error);

    // Log failure
    await prisma.whatsAppLog.create({
      data: {
        tenantId,
        templateName,
        recipientPhone: phone,
        recipientName: recipientName || null,
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Network error",
        variables: variables as Record<string, string>,
        category: TEMPLATE_CATEGORY[templateName] || "GENERAL",
      },
    }).catch(() => {}); // Don't let logging failure mask the real error

    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
}

/**
 * Send WhatsApp messages in bulk (rate-limited to avoid throttling).
 * MSG91 supports up to 1000 recipients per template call, but we batch at 50 for reliability.
 */
export async function sendBulkWhatsApp(params: {
  tenantId: string;
  templateName: WhatsAppTemplate;
  recipients: WhatsAppRecipient[];
  variables: WhatsAppTemplateVariable;
  headerImageUrl?: string;
  ctaButtons?: Array<{ index: number; subType: "url" | "quick_reply"; text: string }>;
  batchSize?: number;
}): Promise<{ sent: number; failed: number; errors: string[] }> {
  const { tenantId, templateName, recipients, variables, headerImageUrl, ctaButtons, batchSize = 50 } = params;

  const results = { sent: 0, failed: 0, errors: [] as string[] };

  if (!MSG91_AUTH_KEY) {
    results.errors.push("MSG91_AUTH_KEY not configured");
    results.failed = recipients.length;
    return results;
  }

  // Check daily limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });

  const waSettings = getWhatsAppSettings((tenant?.settings as Record<string, unknown>) || {});

  const todayCount = await prisma.whatsAppLog.count({
    where: {
      tenantId,
      createdAt: { gte: today, lt: tomorrow },
    },
  });

  const remainingQuota = Math.max(0, waSettings.dailyLimit - todayCount);
  if (remainingQuota === 0) {
    results.errors.push("Daily WhatsApp message limit reached");
    results.failed = recipients.length;
    return results;
  }

  // Normalize and deduplicate phones
  const validRecipients: Array<{ phone: string; name?: string }> = [];
  const seenPhones = new Set<string>();

  for (const r of recipients) {
    const phone = normalizePhone(r.phone, waSettings.defaultCountryCode);
    if (phone && !seenPhones.has(phone)) {
      seenPhones.add(phone);
      validRecipients.push({ phone, name: r.name });
    }
  }

  // Limit to remaining quota
  const toSend = validRecipients.slice(0, remainingQuota);
  results.failed += validRecipients.length - toSend.length;

  // Send in batches
  for (let i = 0; i < toSend.length; i += batchSize) {
    const batch = toSend.slice(i, i + batchSize);
    const phones = batch.map((r) => r.phone);

    const components = buildComponents(variables, headerImageUrl, ctaButtons);

    const payload: MSG91SendPayload = {
      integrated_number: MSG91_INTEGRATED_NUMBER,
      content_type: "template",
      payload: {
        messaging_product: "whatsapp",
        type: "template",
        template: {
          name: templateName,
          language: {
            code: "en",
            policy: "deterministic",
          },
          to_and_components: [
            {
              to: phones,
              components,
            },
          ],
        },
      },
    };

    try {
      const response = await fetch(`${MSG91_BASE_URL}/whatsapp-outbound-message/bulk/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authkey: MSG91_AUTH_KEY,
        },
        body: JSON.stringify(payload),
      });

      const result: MSG91Response = await response.json();
      const isSuccess = response.ok && (result.type === "success" || result.message === "success" || !!result.request_id);

      // Log each recipient
      await prisma.whatsAppLog.createMany({
        data: batch.map((r) => ({
          tenantId,
          templateName,
          recipientPhone: r.phone,
          recipientName: r.name || null,
          status: isSuccess ? ("SENT" as const) : ("FAILED" as const),
          msgId: result.request_id || null,
          errorMessage: isSuccess ? null : (result.message || "Batch failed"),
          variables: variables as Record<string, string>,
          category: TEMPLATE_CATEGORY[templateName] || "GENERAL",
        })),
      });

      if (isSuccess) {
        results.sent += batch.length;
      } else {
        results.failed += batch.length;
        results.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${result.message || "Failed"}`);
      }
    } catch (error) {
      results.failed += batch.length;
      results.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error instanceof Error ? error.message : "Network error"}`);

      await prisma.whatsAppLog.createMany({
        data: batch.map((r) => ({
          tenantId,
          templateName,
          recipientPhone: r.phone,
          recipientName: r.name || null,
          status: "FAILED" as const,
          errorMessage: error instanceof Error ? error.message : "Network error",
          variables: variables as Record<string, string>,
          category: TEMPLATE_CATEGORY[templateName] || "GENERAL",
        })),
      }).catch(() => {});
    }

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < toSend.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

// ==================== Pre-built Template Senders ====================

/**
 * Send a fee reminder via WhatsApp.
 */
export async function sendWhatsAppFeeReminder(params: {
  tenantId: string;
  tenantName: string;
  tenantSlug?: string;
  tenantLogoUrl?: string;
  recipientPhone: string;
  recipientName: string;
  studentName: string;
  amount: string;
  dueDate: string;
}) {
  return sendWhatsAppMessage({
    tenantId: params.tenantId,
    templateName: "fee_reminder",
    recipientPhone: params.recipientPhone,
    recipientName: params.recipientName,
    headerImageUrl: params.tenantLogoUrl,
    variables: {
      student_name: params.studentName,
      amount: params.amount,
      due_date: params.dueDate,
      institute_name: params.tenantName,
    },
    ctaButtons: params.tenantSlug
      ? [{ index: 0, subType: "url", text: `${params.tenantSlug}/fees` }]
      : undefined,
  });
}

/**
 * Send a fee overdue alert via WhatsApp.
 */
export async function sendWhatsAppFeeOverdue(params: {
  tenantId: string;
  tenantName: string;
  tenantSlug?: string;
  tenantLogoUrl?: string;
  recipientPhone: string;
  recipientName: string;
  studentName: string;
  amount: string;
  overdueDays: string;
  lateFee: string;
}) {
  return sendWhatsAppMessage({
    tenantId: params.tenantId,
    templateName: "fee_overdue",
    recipientPhone: params.recipientPhone,
    recipientName: params.recipientName,
    headerImageUrl: params.tenantLogoUrl,
    variables: {
      student_name: params.studentName,
      amount: params.amount,
      overdue_days: params.overdueDays,
      late_fee: params.lateFee,
      institute_name: params.tenantName,
    },
    ctaButtons: params.tenantSlug
      ? [{ index: 0, subType: "url", text: `${params.tenantSlug}/fees` }]
      : undefined,
  });
}

/**
 * Send payment received confirmation via WhatsApp.
 */
export async function sendWhatsAppPaymentReceived(params: {
  tenantId: string;
  tenantName: string;
  tenantSlug?: string;
  tenantLogoUrl?: string;
  recipientPhone: string;
  recipientName: string;
  studentName: string;
  amount: string;
  receiptNo: string;
}) {
  return sendWhatsAppMessage({
    tenantId: params.tenantId,
    templateName: "payment_received",
    recipientPhone: params.recipientPhone,
    recipientName: params.recipientName,
    headerImageUrl: params.tenantLogoUrl,
    variables: {
      student_name: params.studentName,
      amount: params.amount,
      receipt_no: params.receiptNo,
      institute_name: params.tenantName,
    },
    ctaButtons: params.tenantSlug
      ? [{ index: 0, subType: "url", text: `${params.tenantSlug}/fees` }]
      : undefined,
  });
}

/**
 * Send attendance alert via WhatsApp.
 */
export async function sendWhatsAppAttendanceAlert(params: {
  tenantId: string;
  tenantName: string;
  tenantSlug?: string;
  tenantLogoUrl?: string;
  recipientPhone: string;
  recipientName: string;
  studentName: string;
  status: string;
  date: string;
}) {
  return sendWhatsAppMessage({
    tenantId: params.tenantId,
    templateName: "attendance_alert",
    recipientPhone: params.recipientPhone,
    recipientName: params.recipientName,
    headerImageUrl: params.tenantLogoUrl,
    variables: {
      student_name: params.studentName,
      status: params.status,
      date: params.date,
      institute_name: params.tenantName,
    },
    ctaButtons: params.tenantSlug
      ? [{ index: 0, subType: "url", text: `${params.tenantSlug}/attendance` }]
      : undefined,
  });
}

/**
 * Send event notification via WhatsApp.
 */
export async function sendWhatsAppEventNotification(params: {
  tenantId: string;
  tenantName: string;
  tenantSlug?: string;
  tenantLogoUrl?: string;
  recipients: WhatsAppRecipient[];
  eventName: string;
  date: string;
  details: string;
}) {
  return sendBulkWhatsApp({
    tenantId: params.tenantId,
    templateName: "event_notification",
    recipients: params.recipients,
    headerImageUrl: params.tenantLogoUrl,
    variables: {
      event_name: params.eventName,
      date: params.date,
      details: params.details,
      institute_name: params.tenantName,
    },
    ctaButtons: params.tenantSlug
      ? [{ index: 0, subType: "url", text: `${params.tenantSlug}/events` }]
      : undefined,
  });
}

/**
 * Send result published notification via WhatsApp.
 */
export async function sendWhatsAppResultNotification(params: {
  tenantId: string;
  tenantName: string;
  tenantSlug?: string;
  tenantLogoUrl?: string;
  recipientPhone: string;
  recipientName: string;
  studentName: string;
  examName: string;
  percentage: string;
}) {
  return sendWhatsAppMessage({
    tenantId: params.tenantId,
    templateName: "result_published",
    recipientPhone: params.recipientPhone,
    recipientName: params.recipientName,
    headerImageUrl: params.tenantLogoUrl,
    variables: {
      student_name: params.studentName,
      exam_name: params.examName,
      percentage: params.percentage,
      institute_name: params.tenantName,
    },
    ctaButtons: params.tenantSlug
      ? [{ index: 0, subType: "url", text: `${params.tenantSlug}/results` }]
      : undefined,
  });
}

/**
 * Send general announcement via WhatsApp.
 */
export async function sendWhatsAppAnnouncement(params: {
  tenantId: string;
  tenantName: string;
  tenantSlug?: string;
  tenantLogoUrl?: string;
  recipients: WhatsAppRecipient[];
  title: string;
  message: string;
}) {
  return sendBulkWhatsApp({
    tenantId: params.tenantId,
    templateName: "general_announcement",
    recipients: params.recipients,
    headerImageUrl: params.tenantLogoUrl,
    variables: {
      title: params.title,
      message: params.message.substring(0, 900), // WhatsApp template body limit
      institute_name: params.tenantName,
    },
    ctaButtons: params.tenantSlug
      ? [{ index: 0, subType: "url", text: params.tenantSlug }]
      : undefined,
  });
}

/**
 * Send library book due reminder via WhatsApp.
 */
export async function sendWhatsAppLibraryDue(params: {
  tenantId: string;
  tenantName: string;
  tenantSlug?: string;
  tenantLogoUrl?: string;
  recipientPhone: string;
  recipientName: string;
  memberName: string;
  bookTitle: string;
  dueDate: string;
}) {
  return sendWhatsAppMessage({
    tenantId: params.tenantId,
    templateName: "library_due",
    recipientPhone: params.recipientPhone,
    recipientName: params.recipientName,
    headerImageUrl: params.tenantLogoUrl,
    variables: {
      member_name: params.memberName,
      book_title: params.bookTitle,
      due_date: params.dueDate,
      institute_name: params.tenantName,
    },
    ctaButtons: params.tenantSlug
      ? [{ index: 0, subType: "url", text: `${params.tenantSlug}/library` }]
      : undefined,
  });
}

/**
 * Send welcome message via WhatsApp.
 */
export async function sendWhatsAppWelcome(params: {
  tenantId: string;
  tenantName: string;
  tenantLogoUrl?: string;
  recipientPhone: string;
  name: string;
  tenantSlug: string;
}) {
  return sendWhatsAppMessage({
    tenantId: params.tenantId,
    templateName: "welcome_message",
    recipientPhone: params.recipientPhone,
    recipientName: params.name,
    headerImageUrl: params.tenantLogoUrl,
    variables: {
      name: params.name,
      institute_name: params.tenantName,
      portal_link: `${APP_URL}/login`,
    },
    ctaButtons: [{ index: 0, subType: "url", text: params.tenantSlug }],
  });
}

// ==================== School-Specific Template Senders ====================

/**
 * Send PTM (Parent-Teacher Meeting) reminder. [School only]
 */
export async function sendWhatsAppPTMReminder(params: {
  tenantId: string;
  tenantName: string;
  tenantSlug?: string;
  tenantLogoUrl?: string;
  recipients: WhatsAppRecipient[];
  date: string;
  time: string;
  venue: string;
}) {
  return sendBulkWhatsApp({
    tenantId: params.tenantId,
    templateName: "ptm_reminder",
    recipients: params.recipients,
    headerImageUrl: params.tenantLogoUrl,
    variables: {
      date: params.date,
      time: params.time,
      venue: params.venue,
      institute_name: params.tenantName,
    },
    ctaButtons: params.tenantSlug
      ? [{ index: 0, subType: "url", text: `${params.tenantSlug}/events` }]
      : undefined,
  });
}

/**
 * Send exam schedule notification. [School only]
 */
export async function sendWhatsAppExamSchedule(params: {
  tenantId: string;
  tenantName: string;
  tenantSlug?: string;
  tenantLogoUrl?: string;
  recipients: WhatsAppRecipient[];
  examName: string;
  startDate: string;
  endDate: string;
}) {
  return sendBulkWhatsApp({
    tenantId: params.tenantId,
    templateName: "exam_schedule",
    recipients: params.recipients,
    headerImageUrl: params.tenantLogoUrl,
    variables: {
      exam_name: params.examName,
      start_date: params.startDate,
      end_date: params.endDate,
      institute_name: params.tenantName,
    },
    ctaButtons: params.tenantSlug
      ? [{ index: 0, subType: "url", text: `${params.tenantSlug}/exams` }]
      : undefined,
  });
}

// ==================== Coaching-Specific Template Senders ====================

/**
 * Send batch change notification. [Coaching only]
 */
export async function sendWhatsAppBatchChange(params: {
  tenantId: string;
  tenantName: string;
  tenantSlug?: string;
  tenantLogoUrl?: string;
  recipientPhone: string;
  recipientName: string;
  studentName: string;
  oldBatch: string;
  newBatch: string;
  effectiveDate: string;
}) {
  return sendWhatsAppMessage({
    tenantId: params.tenantId,
    templateName: "batch_change",
    recipientPhone: params.recipientPhone,
    recipientName: params.recipientName,
    headerImageUrl: params.tenantLogoUrl,
    variables: {
      student_name: params.studentName,
      old_batch: params.oldBatch,
      new_batch: params.newBatch,
      effective_date: params.effectiveDate,
      institute_name: params.tenantName,
    },
    ctaButtons: params.tenantSlug
      ? [{ index: 0, subType: "url", text: `${params.tenantSlug}/dashboard` }]
      : undefined,
  });
}

/**
 * Send mock test result notification. [Coaching only]
 */
export async function sendWhatsAppMockResult(params: {
  tenantId: string;
  tenantName: string;
  tenantSlug?: string;
  tenantLogoUrl?: string;
  recipientPhone: string;
  recipientName: string;
  studentName: string;
  testName: string;
  score: string;
  rank: string;
}) {
  return sendWhatsAppMessage({
    tenantId: params.tenantId,
    templateName: "mock_result",
    recipientPhone: params.recipientPhone,
    recipientName: params.recipientName,
    headerImageUrl: params.tenantLogoUrl,
    variables: {
      student_name: params.studentName,
      test_name: params.testName,
      score: params.score,
      rank: params.rank,
      institute_name: params.tenantName,
    },
    ctaButtons: params.tenantSlug
      ? [{ index: 0, subType: "url", text: `${params.tenantSlug}/results` }]
      : undefined,
  });
}

// ==================== Library-Specific Template Senders ====================

/**
 * Send seat allocation notification. [Library only]
 */
export async function sendWhatsAppSeatAllocation(params: {
  tenantId: string;
  tenantName: string;
  tenantSlug?: string;
  tenantLogoUrl?: string;
  recipientPhone: string;
  recipientName: string;
  memberName: string;
  seatNumber: string;
  floor: string;
  validTill: string;
}) {
  return sendWhatsAppMessage({
    tenantId: params.tenantId,
    templateName: "seat_allocation",
    recipientPhone: params.recipientPhone,
    recipientName: params.recipientName,
    headerImageUrl: params.tenantLogoUrl,
    variables: {
      member_name: params.memberName,
      seat_number: params.seatNumber,
      floor: params.floor,
      valid_till: params.validTill,
      institute_name: params.tenantName,
    },
    ctaButtons: params.tenantSlug
      ? [{ index: 0, subType: "url", text: `${params.tenantSlug}/dashboard` }]
      : undefined,
  });
}

/**
 * Send membership expiry reminder. [Library only]
 */
export async function sendWhatsAppMembershipExpiry(params: {
  tenantId: string;
  tenantName: string;
  tenantSlug?: string;
  tenantLogoUrl?: string;
  recipientPhone: string;
  recipientName: string;
  memberName: string;
  expiryDate: string;
  plan: string;
}) {
  return sendWhatsAppMessage({
    tenantId: params.tenantId,
    templateName: "membership_expiry",
    recipientPhone: params.recipientPhone,
    recipientName: params.recipientName,
    headerImageUrl: params.tenantLogoUrl,
    variables: {
      member_name: params.memberName,
      expiry_date: params.expiryDate,
      plan: params.plan,
      institute_name: params.tenantName,
    },
    ctaButtons: params.tenantSlug
      ? [{ index: 0, subType: "url", text: `${params.tenantSlug}/membership` }]
      : undefined,
  });
}

// ==================== Status Update (for webhook) ====================

/**
 * Update message status from MSG91 webhook callback.
 */
export async function updateWhatsAppStatus(
  msgId: string,
  status: "SENT" | "DELIVERED" | "READ" | "FAILED",
  errorMessage?: string
) {
  try {
    await prisma.whatsAppLog.updateMany({
      where: { msgId },
      data: {
        status,
        ...(errorMessage && { errorMessage }),
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Update WhatsApp status error:", error);
    return { success: false };
  }
}

// ==================== Analytics Helpers ====================

/**
 * Get today's message count for a tenant.
 */
export async function getTodayMessageCount(tenantId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.whatsAppLog.count({
    where: {
      tenantId,
      createdAt: { gte: today, lt: tomorrow },
    },
  });
}
