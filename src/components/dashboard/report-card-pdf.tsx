import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResultData = Record<string, any>;

const colors = {
  primary: "#4f46e5",
  primaryLight: "#e0e7ff",
  success: "#059669",
  danger: "#dc2626",
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
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 12,
    marginBottom: 16,
  },
  schoolName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    marginBottom: 2,
  },
  schoolDetail: {
    fontSize: 8,
    color: colors.gray,
    marginBottom: 1,
  },
  reportTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    textAlign: "right",
    marginBottom: 4,
  },
  examDetail: {
    fontSize: 9,
    color: colors.gray,
    textAlign: "right",
    marginBottom: 1,
  },
  // Student Info
  infoSection: {
    flexDirection: "row",
    backgroundColor: colors.grayLight,
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    gap: 24,
  },
  infoGroup: {
    flexGrow: 1,
  },
  infoLabel: {
    fontSize: 7,
    color: colors.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  // Marks Table
  tableContainer: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingVertical: 7,
    paddingHorizontal: 6,
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  tableCell: {
    fontSize: 9,
  },
  tableCellBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  colSubject: { width: "30%" },
  colCode: { width: "12%" },
  colMax: { width: "12%", textAlign: "center" },
  colObtained: { width: "14%", textAlign: "center" },
  colGrade: { width: "12%", textAlign: "center" },
  colResult: { width: "20%", textAlign: "center" },
  // Total Row
  totalRow: {
    flexDirection: "row",
    backgroundColor: colors.primaryLight,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  totalLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  totalValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: colors.primary,
    textAlign: "center",
  },
  // Summary Cards
  summarySection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flexGrow: 1,
    backgroundColor: colors.grayLight,
    borderRadius: 4,
    padding: 10,
    alignItems: "center",
  },
  summaryCardValue: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  summaryCardLabel: {
    fontSize: 7,
    color: colors.gray,
    textTransform: "uppercase",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: colors.gray,
  },
  passLabel: {
    color: colors.success,
    fontFamily: "Helvetica-Bold",
  },
  failLabel: {
    color: colors.danger,
    fontFamily: "Helvetica-Bold",
  },
});

export function ReportCardDocument({ data }: { data: ResultData }) {
  const date = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.schoolName}>{data.tenant.name || "SkolMatrixa"}</Text>
            {data.tenant.address && <Text style={styles.schoolDetail}>{data.tenant.address}</Text>}
            {data.tenant.phone && <Text style={styles.schoolDetail}>Phone: {data.tenant.phone}</Text>}
            {data.tenant.email && <Text style={styles.schoolDetail}>Email: {data.tenant.email}</Text>}
          </View>
          <View>
            <Text style={styles.reportTitle}>REPORT CARD</Text>
            <Text style={styles.examDetail}>{data.examName}</Text>
            <Text style={styles.examDetail}>{data.className}</Text>
            <Text style={styles.examDetail}>{data.academicYear}</Text>
          </View>
        </View>

        {/* Student Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Student Name</Text>
            <Text style={styles.infoValue}>{data.student.name}</Text>
          </View>
          {data.student.rollNo && (
            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Roll Number</Text>
              <Text style={styles.infoValue}>{data.student.rollNo}</Text>
            </View>
          )}
          {data.student.admissionNo && (
            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Admission No</Text>
              <Text style={styles.infoValue}>{data.student.admissionNo}</Text>
            </View>
          )}
          {data.rank > 0 && (
            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Class Rank</Text>
              <Text style={styles.infoValue}>
                {data.rank} / {data.totalStudents}
              </Text>
            </View>
          )}
        </View>

        {/* Marks Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colSubject]}>Subject</Text>
            <Text style={[styles.tableHeaderText, styles.colCode]}>Code</Text>
            <Text style={[styles.tableHeaderText, styles.colMax]}>Max</Text>
            <Text style={[styles.tableHeaderText, styles.colObtained]}>Obtained</Text>
            <Text style={[styles.tableHeaderText, styles.colGrade]}>Grade</Text>
            <Text style={[styles.tableHeaderText, styles.colResult]}>Result</Text>
          </View>
          {data.subjects.map((sub: ResultData, idx: number) => (
            <View
              key={idx}
              style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={[styles.tableCellBold, styles.colSubject]}>{sub.name}</Text>
              <Text style={[styles.tableCell, styles.colCode]}>{sub.code || "—"}</Text>
              <Text style={[styles.tableCell, styles.colMax]}>{sub.maxMarks}</Text>
              <Text
                style={[
                  styles.tableCellBold,
                  styles.colObtained,
                  { color: sub.passed ? colors.dark : colors.danger },
                ]}
              >
                {sub.hasMarks ? sub.marksObtained : "AB"}
              </Text>
              <Text style={[styles.tableCellBold, styles.colGrade]}>{sub.grade}</Text>
              <Text
                style={[
                  sub.passed ? styles.passLabel : styles.failLabel,
                  styles.colResult,
                  { fontSize: 9 },
                ]}
              >
                {sub.passed ? "PASS" : "FAIL"}
              </Text>
            </View>
          ))}
          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.colSubject]}>TOTAL</Text>
            <Text style={[styles.totalLabel, styles.colCode]} />
            <Text style={[styles.totalValue, styles.colMax]}>{data.totalMaxMarks}</Text>
            <Text style={[styles.totalValue, styles.colObtained]}>{data.totalMarks}</Text>
            <Text style={[styles.totalValue, styles.colGrade]}>{data.overallGrade}</Text>
            <Text style={[styles.totalValue, styles.colResult]}>{data.percentage}%</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryCardValue, { color: colors.primary }]}>
              {data.percentage}%
            </Text>
            <Text style={styles.summaryCardLabel}>Percentage</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryCardValue, { color: colors.primary }]}>
              {data.overallGrade}
            </Text>
            <Text style={styles.summaryCardLabel}>Overall Grade</Text>
          </View>
          {data.rank > 0 && (
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryCardValue, { color: colors.primary }]}>
                {data.rank}
              </Text>
              <Text style={styles.summaryCardLabel}>
                Rank out of {data.totalStudents}
              </Text>
            </View>
          )}
          <View style={styles.summaryCard}>
            <Text
              style={[
                styles.summaryCardValue,
                {
                  color: data.subjects.every((s: ResultData) => s.passed)
                    ? colors.success
                    : colors.danger,
                },
              ]}
            >
              {data.subjects.every((s: ResultData) => s.passed) ? "PASS" : "FAIL"}
            </Text>
            <Text style={styles.summaryCardLabel}>Overall Result</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated on {date}</Text>
          <Text style={styles.footerText}>
            This is a computer-generated report card.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
