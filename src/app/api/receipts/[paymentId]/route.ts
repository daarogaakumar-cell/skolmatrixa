import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReceiptData } from "@/actions/fees";
import ReactPDF from "@react-pdf/renderer";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import React from "react";

const colors = {
  primary: "#4f46e5",
  primaryLight: "#e0e7ff",
  success: "#059669",
  gray: "#6b7280",
  grayLight: "#f3f4f6",
  dark: "#111827",
  white: "#ffffff",
  border: "#e5e7eb",
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.dark,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 12,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  institutionName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    marginBottom: 3,
  },
  institutionDetail: {
    fontSize: 8,
    color: colors.gray,
    marginBottom: 1,
  },
  receiptTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    textAlign: "right",
    marginBottom: 4,
  },
  receiptNo: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.dark,
    textAlign: "right",
    marginBottom: 2,
  },
  receiptMeta: {
    fontSize: 9,
    color: colors.gray,
    textAlign: "right",
    marginBottom: 1,
  },
  infoSection: {
    flexDirection: "row",
    backgroundColor: colors.grayLight,
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    gap: 20,
  },
  infoGroup: {
    flexGrow: 1,
  },
  infoLabel: {
    fontSize: 7,
    color: colors.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.dark,
    marginBottom: 4,
  },
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    padding: 8,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: colors.grayLight,
  },
  tableCell: {
    fontSize: 9,
    color: colors.dark,
  },
  col1: { width: "5%" },
  col2: { width: "30%" },
  col3: { width: "15%" },
  col4: { width: "15%", textAlign: "right" as const },
  col5: { width: "10%", textAlign: "right" as const },
  col6: { width: "10%", textAlign: "right" as const },
  col7: { width: "15%", textAlign: "right" as const },
  summarySection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 20,
  },
  summaryBox: {
    width: 220,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryRowTotal: {
    backgroundColor: colors.primary,
  },
  summaryLabel: {
    fontSize: 9,
    color: colors.gray,
  },
  summaryValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.dark,
  },
  summaryTotalLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
  },
  summaryTotalValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
  },
  paymentInfo: {
    flexDirection: "row",
    gap: 40,
    marginBottom: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paymentInfoLabel: {
    fontSize: 7,
    color: colors.gray,
    textTransform: "uppercase",
    marginBottom: 1,
  },
  paymentInfoValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.dark,
  },
  notesSection: {
    marginBottom: 20,
    padding: 8,
    backgroundColor: colors.grayLight,
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.gray,
    marginBottom: 2,
  },
  notesText: {
    fontSize: 9,
    color: colors.dark,
  },
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
    paddingTop: 10,
  },
  signatureBlock: {
    width: 150,
    alignItems: "center",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
    width: "100%",
    marginBottom: 4,
  },
  signatureText: {
    fontSize: 8,
    color: colors.gray,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 7,
    color: colors.gray,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
});

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getPeriodLabel(month: number | null, year: number | null) {
  if (month && year) {
    return new Date(year, month - 1).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }
  return "One-time";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ReceiptDocument({ data }: { data: any }) {
  const subtotal = data.items.reduce((s: number, i: { amountDue: number }) => s + i.amountDue, 0);
  const totalLateFee = data.items.reduce((s: number, i: { lateFee: number }) => s + i.lateFee, 0);
  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          { style: styles.headerRow },
          React.createElement(
            View,
            null,
            React.createElement(Text, { style: styles.institutionName }, data.tenant.name),
            data.tenant.address &&
              React.createElement(Text, { style: styles.institutionDetail }, data.tenant.address),
            data.tenant.phone &&
              React.createElement(
                Text,
                { style: styles.institutionDetail },
                `Phone: ${data.tenant.phone}`
              ),
            data.tenant.email &&
              React.createElement(
                Text,
                { style: styles.institutionDetail },
                `Email: ${data.tenant.email}`
              )
          ),
          React.createElement(
            View,
            null,
            React.createElement(Text, { style: styles.receiptTitle }, "FEE RECEIPT"),
            React.createElement(Text, { style: styles.receiptNo }, data.receiptNo),
            React.createElement(
              Text,
              { style: styles.receiptMeta },
              `Date: ${new Date(data.paymentDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}`
            )
          )
        )
      ),
      // Student Info
      React.createElement(
        View,
        { style: styles.infoSection },
        React.createElement(
          View,
          { style: styles.infoGroup },
          React.createElement(Text, { style: styles.infoLabel }, "STUDENT NAME"),
          React.createElement(Text, { style: styles.infoValue }, data.student.name),
          React.createElement(Text, { style: styles.infoLabel }, "ADMISSION NO"),
          React.createElement(Text, { style: styles.infoValue }, data.student.admissionNo)
        ),
        React.createElement(
          View,
          { style: styles.infoGroup },
          React.createElement(Text, { style: styles.infoLabel }, "CLASS / BATCH"),
          React.createElement(
            Text,
            { style: styles.infoValue },
            data.student.className || data.student.batchName || "N/A"
          ),
          data.student.guardianName &&
            React.createElement(Text, { style: styles.infoLabel }, "GUARDIAN"),
          data.student.guardianName &&
            React.createElement(
              Text,
              { style: styles.infoValue },
              `${data.student.guardianName}${
                data.student.guardianPhone ? ` (${data.student.guardianPhone})` : ""
              }`
            )
        )
      ),
      // Items Table
      React.createElement(
        View,
        { style: styles.table },
        // Header
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(Text, { style: [styles.tableHeaderCell, styles.col1] }, "#"),
          React.createElement(Text, { style: [styles.tableHeaderCell, styles.col2] }, "Fee Type"),
          React.createElement(Text, { style: [styles.tableHeaderCell, styles.col3] }, "Period"),
          React.createElement(Text, { style: [styles.tableHeaderCell, styles.col4] }, "Amount"),
          React.createElement(Text, { style: [styles.tableHeaderCell, styles.col5] }, "Late Fee"),
          React.createElement(Text, { style: [styles.tableHeaderCell, styles.col6] }, "Discount"),
          React.createElement(Text, { style: [styles.tableHeaderCell, styles.col7] }, "Paid")
        ),
        // Rows
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...data.items.map((item: any, idx: number) =>
          React.createElement(
            View,
            {
              key: idx,
              style: [styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}],
            },
            React.createElement(Text, { style: [styles.tableCell, styles.col1] }, String(idx + 1)),
            React.createElement(Text, { style: [styles.tableCell, styles.col2] }, item.feeName),
            React.createElement(
              Text,
              { style: [styles.tableCell, styles.col3] },
              getPeriodLabel(item.month, item.year)
            ),
            React.createElement(
              Text,
              { style: [styles.tableCell, styles.col4] },
              formatCurrency(item.amountDue)
            ),
            React.createElement(
              Text,
              { style: [styles.tableCell, styles.col5] },
              item.lateFee > 0 ? formatCurrency(item.lateFee) : "—"
            ),
            React.createElement(
              Text,
              { style: [styles.tableCell, styles.col6] },
              item.discount > 0 ? formatCurrency(item.discount) : "—"
            ),
            React.createElement(
              Text,
              { style: [styles.tableCell, styles.col7] },
              formatCurrency(item.amountPaid)
            )
          )
        )
      ),
      // Summary box
      React.createElement(
        View,
        { style: styles.summarySection },
        React.createElement(
          View,
          { style: styles.summaryBox },
          React.createElement(
            View,
            { style: styles.summaryRow },
            React.createElement(Text, { style: styles.summaryLabel }, "Subtotal"),
            React.createElement(Text, { style: styles.summaryValue }, formatCurrency(subtotal))
          ),
          totalLateFee > 0 &&
            React.createElement(
              View,
              { style: styles.summaryRow },
              React.createElement(Text, { style: styles.summaryLabel }, "Late Fee"),
              React.createElement(
                Text,
                { style: styles.summaryValue },
                `+${formatCurrency(totalLateFee)}`
              )
            ),
          data.totalDiscount > 0 &&
            React.createElement(
              View,
              { style: styles.summaryRow },
              React.createElement(Text, { style: styles.summaryLabel }, "Discount"),
              React.createElement(
                Text,
                { style: styles.summaryValue },
                `-${formatCurrency(data.totalDiscount)}`
              )
            ),
          React.createElement(
            View,
            { style: [styles.summaryRow, styles.summaryRowTotal] },
            React.createElement(Text, { style: styles.summaryTotalLabel }, "Total Paid"),
            React.createElement(
              Text,
              { style: styles.summaryTotalValue },
              formatCurrency(data.totalPaid)
            )
          )
        )
      ),
      // Payment info
      React.createElement(
        View,
        { style: styles.paymentInfo },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.paymentInfoLabel }, "PAYMENT METHOD"),
          React.createElement(
            Text,
            { style: styles.paymentInfoValue },
            (data.paymentMethod || "N/A").replace("_", " ")
          )
        ),
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.paymentInfoLabel }, "RECEIPT NO"),
          React.createElement(Text, { style: styles.paymentInfoValue }, data.receiptNo)
        ),
        data.collectedBy &&
          React.createElement(
            View,
            null,
            React.createElement(Text, { style: styles.paymentInfoLabel }, "COLLECTED BY"),
            React.createElement(Text, { style: styles.paymentInfoValue }, data.collectedBy)
          )
      ),
      // Notes
      data.notes &&
        React.createElement(
          View,
          { style: styles.notesSection },
          React.createElement(Text, { style: styles.notesLabel }, "Notes"),
          React.createElement(Text, { style: styles.notesText }, data.notes)
        ),
      // Signatures
      React.createElement(
        View,
        { style: styles.signatureSection },
        React.createElement(
          View,
          { style: styles.signatureBlock },
          React.createElement(View, { style: styles.signatureLine }),
          React.createElement(Text, { style: styles.signatureText }, "Parent/Guardian Signature")
        ),
        React.createElement(
          View,
          { style: styles.signatureBlock },
          React.createElement(View, { style: styles.signatureLine }),
          React.createElement(Text, { style: styles.signatureText }, "Authorized Signatory")
        )
      ),
      // Footer
      React.createElement(
        Text,
        { style: styles.footer },
        `This is a computer-generated receipt. • ${data.tenant.name} • Generated on ${generatedDate}`
      )
    )
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentId } = await params;

    const result = await getReceiptData(paymentId);
    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || "Receipt not found" },
        { status: 404 }
      );
    }

    const pdfStream = await ReactPDF.renderToStream(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(ReceiptDocument, { data: result.data }) as any
    );

    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    const receiptNo = (result.data as { receiptNo: string }).receiptNo.replace(/[^a-zA-Z0-9\-]/g, "_");

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Fee_Receipt_${receiptNo}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Fee receipt PDF error:", error);
    return NextResponse.json(
      { error: "Failed to generate receipt" },
      { status: 500 }
    );
  }
}
