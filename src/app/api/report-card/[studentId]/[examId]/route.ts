import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStudentExamResult } from "@/actions/exams";
import ReactPDF from "@react-pdf/renderer";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  // Header
  header: {
    textAlign: "center",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#4f46e5",
    paddingBottom: 15,
  },
  schoolName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#4f46e5",
    marginBottom: 4,
  },
  schoolAddress: {
    fontSize: 8,
    color: "#666",
    marginBottom: 2,
  },
  reportTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginTop: 10,
    color: "#1a1a1a",
  },
  // Student Info
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
  },
  infoCol: {
    flexDirection: "column",
    gap: 4,
  },
  infoRow: {
    flexDirection: "row",
    gap: 4,
  },
  infoLabel: {
    fontSize: 8,
    color: "#666",
    fontFamily: "Helvetica-Bold",
  },
  infoValue: {
    fontSize: 9,
    color: "#1a1a1a",
  },
  // Table
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    padding: 8,
    borderRadius: 4,
    marginBottom: 1,
  },
  tableHeaderText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#ffffff",
  },
  tableRow: {
    flexDirection: "row",
    padding: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  tableRowAlt: {
    backgroundColor: "#f9fafb",
  },
  tableCell: {
    fontSize: 9,
  },
  tableCellBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  // Columns
  colSubject: { width: "30%" },
  colMax: { width: "14%", textAlign: "center" },
  colPass: { width: "14%", textAlign: "center" },
  colObt: { width: "14%", textAlign: "center" },
  colGrade: { width: "14%", textAlign: "center" },
  colResult: { width: "14%", textAlign: "center" },
  // Total Row
  totalRow: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#eef2ff",
    borderRadius: 4,
    marginTop: 2,
  },
  // Summary
  summarySection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    padding: 14,
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#4f46e5",
  },
  summaryLabel: {
    fontSize: 8,
    color: "#666",
    marginTop: 2,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#d1d5db",
  },
  footerText: {
    fontSize: 7,
    color: "#9ca3af",
  },
  // Status badges
  passText: { color: "#059669", fontFamily: "Helvetica-Bold", fontSize: 9 },
  failText: { color: "#dc2626", fontFamily: "Helvetica-Bold", fontSize: 9 },
});

interface ReportData {
  examName: string;
  examType: string;
  className: string;
  academicYear: string;
  student: { name: string; rollNo: string | null; admissionNo: string | null };
  tenant: { name: string; address: string | null; phone: string | null; email: string | null };
  subjects: {
    name: string;
    maxMarks: number;
    passingMarks: number;
    marksObtained: number;
    grade: string;
    passed: boolean;
    hasMarks: boolean;
  }[];
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  overallGrade: string;
  rank: number;
  totalStudents: number;
}

function ReportCardDocument({ data }: { data: ReportData }) {
  const allPassed = data.subjects.every((s) => s.passed);
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
        React.createElement(Text, { style: styles.schoolName }, data.tenant.name || "School Name"),
        data.tenant.address &&
          React.createElement(Text, { style: styles.schoolAddress }, data.tenant.address),
        (data.tenant.phone || data.tenant.email) &&
          React.createElement(
            Text,
            { style: styles.schoolAddress },
            [data.tenant.phone, data.tenant.email].filter(Boolean).join(" | ")
          ),
        React.createElement(Text, { style: styles.reportTitle }, "REPORT CARD")
      ),
      // Student Info
      React.createElement(
        View,
        { style: styles.infoSection },
        React.createElement(
          View,
          { style: styles.infoCol },
          React.createElement(
            View,
            { style: styles.infoRow },
            React.createElement(Text, { style: styles.infoLabel }, "Student Name: "),
            React.createElement(Text, { style: styles.infoValue }, data.student.name)
          ),
          data.student.rollNo &&
            React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Roll No: "),
              React.createElement(Text, { style: styles.infoValue }, data.student.rollNo)
            ),
          data.student.admissionNo &&
            React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Admission No: "),
              React.createElement(Text, { style: styles.infoValue }, data.student.admissionNo)
            )
        ),
        React.createElement(
          View,
          { style: styles.infoCol },
          React.createElement(
            View,
            { style: styles.infoRow },
            React.createElement(Text, { style: styles.infoLabel }, "Exam: "),
            React.createElement(Text, { style: styles.infoValue }, data.examName)
          ),
          React.createElement(
            View,
            { style: styles.infoRow },
            React.createElement(Text, { style: styles.infoLabel }, "Class/Batch: "),
            React.createElement(Text, { style: styles.infoValue }, data.className)
          ),
          React.createElement(
            View,
            { style: styles.infoRow },
            React.createElement(Text, { style: styles.infoLabel }, "Session: "),
            React.createElement(Text, { style: styles.infoValue }, data.academicYear)
          )
        )
      ),
      // Marks Table Header
      React.createElement(
        View,
        { style: styles.table },
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(Text, { style: [styles.tableHeaderText, styles.colSubject] }, "Subject"),
          React.createElement(Text, { style: [styles.tableHeaderText, styles.colMax] }, "Max Marks"),
          React.createElement(Text, { style: [styles.tableHeaderText, styles.colPass] }, "Pass Marks"),
          React.createElement(Text, { style: [styles.tableHeaderText, styles.colObt] }, "Obtained"),
          React.createElement(Text, { style: [styles.tableHeaderText, styles.colGrade] }, "Grade"),
          React.createElement(Text, { style: [styles.tableHeaderText, styles.colResult] }, "Result")
        ),
        // Marks Table Rows
        ...data.subjects.map((sub, idx) =>
          React.createElement(
            View,
            { key: idx, style: [styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}] },
            React.createElement(Text, { style: [styles.tableCellBold, styles.colSubject] }, sub.name),
            React.createElement(Text, { style: [styles.tableCell, styles.colMax] }, String(sub.maxMarks)),
            React.createElement(Text, { style: [styles.tableCell, styles.colPass] }, String(sub.passingMarks)),
            React.createElement(
              Text,
              { style: [sub.passed ? styles.tableCell : styles.failText, styles.colObt] },
              sub.hasMarks ? String(sub.marksObtained) : "—"
            ),
            React.createElement(Text, { style: [styles.tableCell, styles.colGrade] }, sub.grade),
            React.createElement(
              Text,
              { style: [sub.passed ? styles.passText : styles.failText, styles.colResult] },
              sub.passed ? "PASS" : "FAIL"
            )
          )
        ),
        // Total Row
        React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, { style: [styles.tableCellBold, styles.colSubject] }, "TOTAL"),
          React.createElement(Text, { style: [styles.tableCellBold, styles.colMax] }, String(data.totalMaxMarks)),
          React.createElement(Text, { style: [styles.tableCell, styles.colPass] }, ""),
          React.createElement(Text, { style: [styles.tableCellBold, styles.colObt] }, String(data.totalMarks)),
          React.createElement(Text, { style: [styles.tableCellBold, styles.colGrade] }, data.overallGrade),
          React.createElement(
            Text,
            { style: [allPassed ? styles.passText : styles.failText, styles.colResult] },
            allPassed ? "PASS" : "FAIL"
          )
        )
      ),
      // Summary
      React.createElement(
        View,
        { style: styles.summarySection },
        React.createElement(
          View,
          { style: styles.summaryItem },
          React.createElement(Text, { style: styles.summaryValue }, `${data.percentage}%`),
          React.createElement(Text, { style: styles.summaryLabel }, "PERCENTAGE")
        ),
        React.createElement(
          View,
          { style: styles.summaryItem },
          React.createElement(Text, { style: styles.summaryValue }, data.overallGrade),
          React.createElement(Text, { style: styles.summaryLabel }, "OVERALL GRADE")
        ),
        data.rank > 0 &&
          React.createElement(
            View,
            { style: styles.summaryItem },
            React.createElement(
              Text,
              { style: styles.summaryValue },
              `${data.rank}/${data.totalStudents}`
            ),
            React.createElement(Text, { style: styles.summaryLabel }, "CLASS RANK")
          ),
        React.createElement(
          View,
          { style: styles.summaryItem },
          React.createElement(
            Text,
            { style: [allPassed ? styles.passText : styles.failText, { fontSize: 16 }] },
            allPassed ? "PASSED" : "FAILED"
          ),
          React.createElement(Text, { style: styles.summaryLabel }, "RESULT")
        )
      ),
      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, { style: styles.footerText }, `Generated on ${generatedDate}`),
        React.createElement(
          Text,
          { style: styles.footerText },
          "This is a computer-generated report card."
        )
      )
    )
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string; examId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId, examId } = await params;

    // Validate: teachers/admins can see any student, students can only see own
    if (["STUDENT", "PARENT"].includes(session.user.role)) {
      // Validate they can access this student's data is handled by the action
    }

    const result = await getStudentExamResult(examId, studentId);
    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error || "Result not found" }, { status: 404 });
    }

    const pdfStream = await ReactPDF.renderToStream(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(ReportCardDocument, { data: result.data as ReportData }) as any
    );

    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    const studentName = result.data.student.name.replace(/[^a-zA-Z0-9]/g, "_");
    const examName = result.data.examName.replace(/[^a-zA-Z0-9]/g, "_");

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Report_Card_${studentName}_${examName}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Report card PDF error:", error);
    return NextResponse.json(
      { error: "Failed to generate report card" },
      { status: 500 }
    );
  }
}
