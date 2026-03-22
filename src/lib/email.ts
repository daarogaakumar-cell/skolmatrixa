import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || "SkolMatrixa <noreply@skolmatrixa.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://skolmatrixa.com";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "SkolMatrixa";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/* ─── Email Layout Wrapper ─── */
function emailLayout(content: string, tenantName?: string): string {
  const footerName = tenantName || APP_NAME;
  return `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #030d2e 0%, #0f1d4e 100%); padding: 28px 32px; border-radius: 12px 12px 0 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <span style="font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">
                Skol<span style="color: #f59e0b;">Matrixa</span>
              </span>
              <br/>
              <span style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px;">School Management ERP</span>
            </td>
          </tr>
        </table>
      </div>
      <!-- Body -->
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
        ${content}
      </div>
      <!-- Footer -->
      <div style="background: #f8fafc; padding: 20px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
          Sent by ${footerName} via <a href="${APP_URL}" style="color: #6366f1; text-decoration: none;">SkolMatrixa</a>
        </p>
        <p style="margin: 4px 0 0; font-size: 11px; color: #cbd5e1; text-align: center;">
          &copy; ${new Date().getFullYear()} SkolMatrixa. All rights reserved.
        </p>
      </div>
    </div>
  `;
}

/* ─── Core Send ─── */
export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo && { replyTo }),
    });

    if (error) {
      console.error("Email send error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Email service error:", err);
    return { success: false, error: err };
  }
}

/* ─── Batch Send (Resend free tier: max 10 per batch) ─── */
export async function sendBatchEmails(
  emails: string[],
  subject: string,
  html: string,
  batchSize = 10
) {
  const results: { success: boolean; sent: number; failed: number } = { success: true, sent: 0, failed: 0 };

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const result = await sendEmail({ to: batch, subject, html });
    if (result.success) {
      results.sent += batch.length;
    } else {
      results.failed += batch.length;
      results.success = false;
    }
  }

  return results;
}

/* ─── Welcome / Onboarding Email ─── */
export async function sendWelcomeEmail(email: string, name: string, tenantName: string) {
  const content = `
    <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 22px;">Welcome, ${name}! 🎉</h2>
    <p style="color: #4b5563; line-height: 1.6;">
      Your account has been created for <strong>${tenantName}</strong> on SkolMatrixa.
    </p>
    <p style="color: #4b5563; line-height: 1.6;">
      You can now log in to access your dashboard and start managing your institution.
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${APP_URL}/login"
         style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">
        Log In to Dashboard
      </a>
    </div>
    <p style="color: #9ca3af; font-size: 13px;">
      If you didn't create this account, you can safely ignore this email.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `Welcome to ${tenantName} on SkolMatrixa!`,
    html: emailLayout(content, tenantName),
  });
}

/* ─── Fee Reminder Email ─── */
export async function sendFeeReminderEmail(
  email: string,
  studentName: string,
  amount: string,
  dueDate: string,
  tenantName: string
) {
  const content = `
    <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 22px;">Fee Payment Reminder</h2>
    <p style="color: #4b5563; line-height: 1.6;">
      Dear Parent/Guardian of <strong>${studentName}</strong>,
    </p>
    <p style="color: #4b5563; line-height: 1.6;">
      This is a friendly reminder that a fee payment is due.
    </p>
    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 10px; padding: 20px; margin: 20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="color: #92400e; font-size: 13px; font-weight: 600;">Amount Due</td>
          <td style="color: #92400e; font-size: 20px; font-weight: 700; text-align: right;">₹${amount}</td>
        </tr>
        <tr>
          <td style="color: #92400e; font-size: 13px; font-weight: 600; padding-top: 8px;">Due Date</td>
          <td style="color: #92400e; font-size: 14px; font-weight: 600; text-align: right; padding-top: 8px;">${dueDate}</td>
        </tr>
      </table>
    </div>
    <p style="color: #4b5563; line-height: 1.6;">
      Please ensure timely payment to avoid late fees. You can view fee details by logging into your portal.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/login"
         style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px;">
        View Fee Details
      </a>
    </div>
    <p style="color: #6b7280; font-size: 13px;">Thank you,<br/><strong>${tenantName}</strong></p>
  `;

  return sendEmail({
    to: email,
    subject: `💰 Fee Reminder — ₹${amount} due for ${studentName} | ${tenantName}`,
    html: emailLayout(content, tenantName),
  });
}

/* ─── Fee Payment Confirmation Email ─── */
export async function sendFeePaymentConfirmationEmail(
  email: string,
  studentName: string,
  amountPaid: string,
  receiptNo: string,
  paymentDate: string,
  paymentMethod: string,
  remainingBalance: string,
  tenantName: string
) {
  const content = `
    <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 22px;">Payment Received ✅</h2>
    <p style="color: #4b5563; line-height: 1.6;">
      Dear Parent/Guardian of <strong>${studentName}</strong>,
    </p>
    <p style="color: #4b5563; line-height: 1.6;">
      We have successfully received a fee payment. Here are the details:
    </p>
    <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 10px; padding: 20px; margin: 20px 0;">
      <table width="100%" cellpadding="4" cellspacing="0" border="0" style="font-size: 14px;">
        <tr>
          <td style="color: #065f46; font-weight: 600;">Receipt No.</td>
          <td style="color: #065f46; text-align: right; font-family: monospace;">${receiptNo}</td>
        </tr>
        <tr>
          <td style="color: #065f46; font-weight: 600;">Amount Paid</td>
          <td style="color: #065f46; text-align: right; font-weight: 700; font-size: 18px;">₹${amountPaid}</td>
        </tr>
        <tr>
          <td style="color: #065f46; font-weight: 600;">Payment Date</td>
          <td style="color: #065f46; text-align: right;">${paymentDate}</td>
        </tr>
        <tr>
          <td style="color: #065f46; font-weight: 600;">Payment Method</td>
          <td style="color: #065f46; text-align: right;">${paymentMethod}</td>
        </tr>
        <tr>
          <td style="color: #065f46; font-weight: 600;">Remaining Balance</td>
          <td style="color: #065f46; text-align: right;">₹${remainingBalance}</td>
        </tr>
      </table>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/login"
         style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px;">
        View Receipt
      </a>
    </div>
    <p style="color: #6b7280; font-size: 13px;">Thank you for the payment,<br/><strong>${tenantName}</strong></p>
  `;

  return sendEmail({
    to: email,
    subject: `✅ Payment of ₹${amountPaid} received for ${studentName} | ${tenantName}`,
    html: emailLayout(content, tenantName),
  });
}

/* ─── Fee Overdue Alert ─── */
export async function sendFeeOverdueEmail(
  email: string,
  studentName: string,
  amount: string,
  overdueDate: string,
  lateFee: string,
  tenantName: string
) {
  const content = `
    <h2 style="margin: 0 0 16px; color: #dc2626; font-size: 22px;">⚠️ Fee Overdue Notice</h2>
    <p style="color: #4b5563; line-height: 1.6;">
      Dear Parent/Guardian of <strong>${studentName}</strong>,
    </p>
    <p style="color: #4b5563; line-height: 1.6;">
      A fee payment is now <strong style="color: #dc2626;">overdue</strong>. Please settle the outstanding amount at the earliest.
    </p>
    <div style="background: #fef2f2; border: 1px solid #f87171; border-radius: 10px; padding: 20px; margin: 20px 0;">
      <table width="100%" cellpadding="4" cellspacing="0" border="0" style="font-size: 14px;">
        <tr>
          <td style="color: #991b1b; font-weight: 600;">Amount Due</td>
          <td style="color: #991b1b; text-align: right; font-weight: 700; font-size: 18px;">₹${amount}</td>
        </tr>
        <tr>
          <td style="color: #991b1b; font-weight: 600;">Original Due Date</td>
          <td style="color: #991b1b; text-align: right;">${overdueDate}</td>
        </tr>
        <tr>
          <td style="color: #991b1b; font-weight: 600;">Late Fee</td>
          <td style="color: #991b1b; text-align: right;">₹${lateFee}</td>
        </tr>
      </table>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/login"
         style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px;">
        Pay Now
      </a>
    </div>
    <p style="color: #6b7280; font-size: 13px;">Regards,<br/><strong>${tenantName}</strong></p>
  `;

  return sendEmail({
    to: email,
    subject: `⚠️ Overdue Fee — ₹${amount} for ${studentName} | ${tenantName}`,
    html: emailLayout(content, tenantName),
  });
}

/* ─── Attendance Alert Email ─── */
export async function sendAttendanceAlertEmail(
  email: string,
  studentName: string,
  date: string,
  status: string,
  tenantName: string
) {
  const isAbsent = status.toLowerCase() === "absent";
  const statusColor = isAbsent ? "#dc2626" : "#16a34a";
  const statusBg = isAbsent ? "#fef2f2" : "#f0fdf4";
  const statusBorder = isAbsent ? "#f87171" : "#86efac";

  const content = `
    <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 22px;">Attendance Update</h2>
    <p style="color: #4b5563; line-height: 1.6;">Dear Parent/Guardian,</p>
    <div style="background: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280;">Student</p>
      <p style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #1f2937;">${studentName}</p>
      <p style="margin: 0; font-size: 14px; color: ${statusColor}; font-weight: 700;">
        Marked as ${status.toUpperCase()} on ${date}
      </p>
    </div>
    <p style="color: #6b7280; font-size: 13px;">
      If you believe this is incorrect, please contact the institution directly.
    </p>
    <p style="color: #6b7280; font-size: 13px;">Thank you,<br/><strong>${tenantName}</strong></p>
  `;

  return sendEmail({
    to: email,
    subject: `${isAbsent ? "🔴" : "🟢"} Attendance: ${studentName} — ${status} on ${date}`,
    html: emailLayout(content, tenantName),
  });
}

/* ─── Bulk / Broadcast Email (for events, holidays, results) ─── */
export async function sendBulkAnnouncementEmail(
  emails: string[],
  title: string,
  message: string,
  category: string,
  tenantName: string
) {
  const categoryColors: Record<string, { bg: string; border: string; text: string; emoji: string }> = {
    EVENT: { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af", emoji: "📅" },
    HOLIDAY: { bg: "#fefce8", border: "#fde68a", text: "#92400e", emoji: "🏖️" },
    RESULT: { bg: "#f0fdf4", border: "#86efac", text: "#065f46", emoji: "📊" },
    GENERAL: { bg: "#f8fafc", border: "#cbd5e1", text: "#334155", emoji: "📢" },
    EXAM_SCHEDULE: { bg: "#faf5ff", border: "#d8b4fe", text: "#6b21a8", emoji: "📝" },
    FEE_REMINDER: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e", emoji: "💰" },
  };
  const colors = categoryColors[category] || categoryColors.GENERAL;

  const content = `
    <div style="background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 10px; padding: 6px 14px; display: inline-block; margin-bottom: 16px;">
      <span style="font-size: 12px; font-weight: 700; color: ${colors.text}; text-transform: uppercase; letter-spacing: 1px;">
        ${colors.emoji} ${category.replace("_", " ")}
      </span>
    </div>
    <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 22px;">${title}</h2>
    <div style="color: #4b5563; line-height: 1.7; font-size: 15px; white-space: pre-wrap;">${message}</div>
    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
    <p style="color: #6b7280; font-size: 13px;">
      This notification was sent by <strong>${tenantName}</strong>.
    </p>
  `;

  const subject = `${colors.emoji} ${title} | ${tenantName}`;
  const html = emailLayout(content, tenantName);

  return sendBatchEmails(emails, subject, html);
}

/* ─── Staff Credential Email Builder ─── */
export function buildStaffCredentialEmailHtml(
  name: string,
  email: string,
  password: string,
  role: string,
  tenantName: string
): string {
  const content = `
    <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 22px;">Welcome to ${tenantName}! 🎉</h2>
    <p style="color: #4b5563; line-height: 1.6;">Hi <strong>${name}</strong>,</p>
    <p style="color: #4b5563; line-height: 1.6;">Your staff account has been created. Here are your login credentials:</p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0;">
      <table cellpadding="4" cellspacing="0" border="0" style="font-size: 14px;">
        <tr><td style="color: #6b7280; font-weight: 600;">Email</td><td style="color: #1f2937;">${email}</td></tr>
        <tr><td style="color: #6b7280; font-weight: 600;">Password</td><td style="color: #1f2937; font-family: monospace;">${password}</td></tr>
        <tr><td style="color: #6b7280; font-weight: 600;">Role</td><td style="color: #1f2937;">${role.replace("_", " ")}</td></tr>
      </table>
    </div>
    <p style="color: #ef4444; font-size: 13px; font-weight: 600;">⚠️ Please change your password after first login.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/login"
         style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">
        Log In Now
      </a>
    </div>
  `;
  return emailLayout(content, tenantName);
}
