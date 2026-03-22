import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

export type ReceiptItem = {
  feeName: string;
  frequency: string;
  month: number | null;
  year: number | null;
  amountDue: number;
  amountPaid: number;
  discount: number;
  lateFee: number;
};

export type ReceiptData = {
  receiptNo: string;
  paymentDate: string;
  paymentMethod: string;
  totalPaid: number;
  totalDiscount: number;
  notes: string | null;
  collectedBy: string | null;
  student: {
    name: string;
    admissionNo: string;
    className: string | null;
    batchName: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
  };
  tenant: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
  items: ReceiptItem[];
};

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
  receiptMeta: {
    fontSize: 9,
    color: colors.gray,
    textAlign: "right",
    marginBottom: 1,
  },
  receiptNo: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.dark,
    textAlign: "right",
    marginBottom: 2,
  },
  // Student info section
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
  // Table
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
  col4: { width: "15%", textAlign: "right" },
  col5: { width: "10%", textAlign: "right" },
  col6: { width: "10%", textAlign: "right" },
  col7: { width: "15%", textAlign: "right" },
  // Summary
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
  // Payment info
  paymentInfo: {
    flexDirection: "row",
    gap: 40,
    marginBottom: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paymentInfoItem: {},
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
  // Notes
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
  // Signature area
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
  // Footer
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

export function FeeReceiptPDF({ data }: { data: ReceiptData }) {
  const subtotal = data.items.reduce((s, i) => s + i.amountDue, 0);
  const totalLateFee = data.items.reduce((s, i) => s + i.lateFee, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.institutionName}>{data.tenant.name}</Text>
              {data.tenant.address && (
                <Text style={styles.institutionDetail}>
                  {data.tenant.address}
                </Text>
              )}
              {data.tenant.phone && (
                <Text style={styles.institutionDetail}>
                  Phone: {data.tenant.phone}
                </Text>
              )}
              {data.tenant.email && (
                <Text style={styles.institutionDetail}>
                  Email: {data.tenant.email}
                </Text>
              )}
            </View>
            <View>
              <Text style={styles.receiptTitle}>FEE RECEIPT</Text>
              <Text style={styles.receiptNo}>
                {data.receiptNo}
              </Text>
              <Text style={styles.receiptMeta}>
                Date:{" "}
                {new Date(data.paymentDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Student Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Student Name</Text>
            <Text style={styles.infoValue}>{data.student.name}</Text>
            <Text style={styles.infoLabel}>Admission No</Text>
            <Text style={styles.infoValue}>{data.student.admissionNo}</Text>
          </View>
          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Class / Batch</Text>
            <Text style={styles.infoValue}>
              {data.student.className || data.student.batchName || "N/A"}
            </Text>
            {data.student.guardianName && (
              <>
                <Text style={styles.infoLabel}>Guardian</Text>
                <Text style={styles.infoValue}>
                  {data.student.guardianName}
                  {data.student.guardianPhone
                    ? ` (${data.student.guardianPhone})`
                    : ""}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.col1]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.col2]}>
              Fee Type
            </Text>
            <Text style={[styles.tableHeaderCell, styles.col3]}>Period</Text>
            <Text style={[styles.tableHeaderCell, styles.col4]}>Amount</Text>
            <Text style={[styles.tableHeaderCell, styles.col5]}>
              Late Fee
            </Text>
            <Text style={[styles.tableHeaderCell, styles.col6]}>
              Discount
            </Text>
            <Text style={[styles.tableHeaderCell, styles.col7]}>Paid</Text>
          </View>
          {data.items.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.tableRow,
                idx % 2 === 1 ? styles.tableRowAlt : {},
              ]}
            >
              <Text style={[styles.tableCell, styles.col1]}>{idx + 1}</Text>
              <Text style={[styles.tableCell, styles.col2]}>
                {item.feeName}
              </Text>
              <Text style={[styles.tableCell, styles.col3]}>
                {getPeriodLabel(item.month, item.year)}
              </Text>
              <Text style={[styles.tableCell, styles.col4]}>
                {formatCurrency(item.amountDue)}
              </Text>
              <Text style={[styles.tableCell, styles.col5]}>
                {item.lateFee > 0 ? formatCurrency(item.lateFee) : "—"}
              </Text>
              <Text style={[styles.tableCell, styles.col6]}>
                {item.discount > 0 ? formatCurrency(item.discount) : "—"}
              </Text>
              <Text style={[styles.tableCell, styles.col7]}>
                {formatCurrency(item.amountPaid)}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(subtotal)}
              </Text>
            </View>
            {totalLateFee > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Late Fee</Text>
                <Text style={styles.summaryValue}>
                  +{formatCurrency(totalLateFee)}
                </Text>
              </View>
            )}
            {data.totalDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={styles.summaryValue}>
                  -{formatCurrency(data.totalDiscount)}
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.summaryRowTotal]}>
              <Text style={styles.summaryTotalLabel}>Total Paid</Text>
              <Text style={styles.summaryTotalValue}>
                {formatCurrency(data.totalPaid)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.paymentInfo}>
          <View style={styles.paymentInfoItem}>
            <Text style={styles.paymentInfoLabel}>Payment Method</Text>
            <Text style={styles.paymentInfoValue}>
              {data.paymentMethod?.replace("_", " ") || "N/A"}
            </Text>
          </View>
          <View style={styles.paymentInfoItem}>
            <Text style={styles.paymentInfoLabel}>Receipt No</Text>
            <Text style={styles.paymentInfoValue}>{data.receiptNo}</Text>
          </View>
          {data.collectedBy && (
            <View style={styles.paymentInfoItem}>
              <Text style={styles.paymentInfoLabel}>Collected By</Text>
              <Text style={styles.paymentInfoValue}>
                {data.collectedBy}
              </Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>Parent/Guardian Signature</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>Authorized Signatory</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This is a computer-generated receipt. • {data.tenant.name} •
          Generated on {new Date().toLocaleDateString("en-IN")}
        </Text>
      </Page>
    </Document>
  );
}
