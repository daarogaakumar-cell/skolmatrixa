"use server";

import { prisma } from "@/lib/prisma";
import { ExamType, ExamStatus } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { logAudit } from "./audit";
import { revalidatePath } from "next/cache";
import { createExamSchema, saveMarksSchema } from "@/lib/validations/schemas";

// ==================== Auth Helpers ====================

async function requireTenantTeacher() {
  const session = await auth();
  if (!session?.user || !session.user.tenantId) {
    throw new Error("Unauthorized");
  }
  if (!["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"].includes(session.user.role)) {
    throw new Error("Insufficient permissions");
  }
  return session.user;
}

async function requireTenantUser() {
  const session = await auth();
  if (!session?.user || !session.user.tenantId) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

// ==================== Grade Calculation ====================

const DEFAULT_GRADE_BOUNDARIES = [
  { min: 90, grade: "A+", label: "Outstanding" },
  { min: 80, grade: "A", label: "Excellent" },
  { min: 70, grade: "B+", label: "Very Good" },
  { min: 60, grade: "B", label: "Good" },
  { min: 50, grade: "C", label: "Average" },
  { min: 40, grade: "D", label: "Below Average" },
  { min: 0, grade: "F", label: "Fail" },
];

function calculateGrade(marksObtained: number, maxMarks: number): string {
  const percentage = (marksObtained / maxMarks) * 100;
  for (const boundary of DEFAULT_GRADE_BOUNDARIES) {
    if (percentage >= boundary.min) return boundary.grade;
  }
  return "F";
}

// ==================== Create Exam ====================

export async function createExam(data: {
  name: string;
  type: string;
  classId?: string;
  batchId?: string;
  startDate?: string;
  endDate?: string;
  subjects: {
    subjectId: string;
    examDate?: string;
    startTime?: string;
    endTime?: string;
    maxMarks: number;
    passingMarks: number;
  }[];
}) {
  try {
    const user = await requireTenantTeacher();
    const tenantId = user.tenantId!;

    const validated = createExamSchema.parse(data);

    // Get current academic year
    const academicYear = await prisma.academicYear.findFirst({
      where: { tenantId, isCurrent: true },
    });

    if (!academicYear) {
      return { success: false, error: "No active academic year found. Please set up an academic year first." };
    }

    // Validate each subject's passing marks <= max marks
    for (const sub of validated.subjects) {
      if (sub.passingMarks > sub.maxMarks) {
        return { success: false, error: `Passing marks cannot exceed max marks for a subject` };
      }
    }

    const exam = await prisma.$transaction(async (tx) => {
      const newExam = await tx.exam.create({
        data: {
          tenantId,
          academicYearId: academicYear.id,
          name: validated.name,
          type: validated.type as ExamType,
          classId: validated.classId || null,
          batchId: validated.batchId || null,
          startDate: validated.startDate ? new Date(validated.startDate) : null,
          endDate: validated.endDate ? new Date(validated.endDate) : null,
          status: "UPCOMING",
        },
      });

      // Create exam subjects
      for (const sub of validated.subjects) {
        await tx.examSubject.create({
          data: {
            examId: newExam.id,
            subjectId: sub.subjectId,
            examDate: sub.examDate ? new Date(sub.examDate) : null,
            startTime: sub.startTime || null,
            endTime: sub.endTime || null,
            maxMarks: sub.maxMarks,
            passingMarks: sub.passingMarks,
          },
        });
      }

      return newExam;
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "EXAM_CREATED",
      entityType: "Exam",
      entityId: exam.id,
      details: { name: exam.name, type: exam.type, subjectsCount: validated.subjects.length },
    });

    revalidatePath("/dashboard/exams");
    return { success: true, data: exam };
  } catch (error) {
    console.error("Create exam error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create exam" };
  }
}

// ==================== Update Exam ====================

export async function updateExam(
  id: string,
  data: {
    name?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }
) {
  try {
    const user = await requireTenantTeacher();
    const tenantId = user.tenantId!;

    const exam = await prisma.exam.findFirst({
      where: { id, tenantId },
    });

    if (!exam) return { success: false, error: "Exam not found" };

    const updated = await prisma.exam.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.type && { type: data.type as ExamType }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...(data.status && { status: data.status as ExamStatus }),
      },
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "EXAM_UPDATED",
      entityType: "Exam",
      entityId: id,
      details: { name: updated.name },
    });

    revalidatePath("/dashboard/exams");
    revalidatePath(`/dashboard/exams/${id}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("Update exam error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update exam" };
  }
}

// ==================== Delete Exam ====================

export async function deleteExam(id: string) {
  try {
    const user = await requireTenantTeacher();
    const tenantId = user.tenantId!;

    const exam = await prisma.exam.findFirst({
      where: { id, tenantId },
      include: { examSubjects: { include: { marks: true } } },
    });

    if (!exam) return { success: false, error: "Exam not found" };

    // Don't allow deleting published exams
    if (exam.status === "RESULT_PUBLISHED") {
      return { success: false, error: "Cannot delete an exam with published results" };
    }

    await prisma.exam.delete({ where: { id } });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "EXAM_DELETED",
      entityType: "Exam",
      entityId: id,
      details: { name: exam.name },
    });

    revalidatePath("/dashboard/exams");
    return { success: true, message: "Exam deleted successfully" };
  } catch (error) {
    console.error("Delete exam error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete exam" };
  }
}

// ==================== Get Exam List ====================

export async function getExamList(filters?: {
  classId?: string;
  batchId?: string;
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const user = await requireTenantUser();
    const tenantId = user.tenantId!;

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;

    const where: Record<string, unknown> = { tenantId };
    if (filters?.classId) where.classId = filters.classId;
    if (filters?.batchId) where.batchId = filters.batchId;
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        include: {
          class: { select: { id: true, name: true, section: true } },
          batch: { select: { id: true, name: true } },
          academicYear: { select: { name: true } },
          examSubjects: {
            include: {
              subject: { select: { name: true, code: true } },
              _count: { select: { marks: true } },
            },
          },
        },
        orderBy: [{ status: "asc" }, { startDate: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.exam.count({ where }),
    ]);

    // Get student count per class/batch for completion tracking
    const enrichedExams = await Promise.all(
      exams.map(async (exam) => {
        let studentCount = 0;
        if (exam.classId) {
          studentCount = await prisma.student.count({
            where: { tenantId, classId: exam.classId, status: "ACTIVE" },
          });
        } else if (exam.batchId) {
          studentCount = await prisma.student.count({
            where: { tenantId, batchId: exam.batchId, status: "ACTIVE" },
          });
        }

        const totalMarksEntered = exam.examSubjects.reduce(
          (sum, es) => sum + es._count.marks,
          0
        );
        const totalExpected = exam.examSubjects.length * studentCount;

        return {
          id: exam.id,
          name: exam.name,
          type: exam.type,
          status: exam.status,
          startDate: exam.startDate?.toISOString() || null,
          endDate: exam.endDate?.toISOString() || null,
          className: exam.class ? `${exam.class.name}${exam.class.section ? ` - ${exam.class.section}` : ""}` : null,
          batchName: exam.batch?.name || null,
          classId: exam.classId,
          batchId: exam.batchId,
          academicYear: exam.academicYear.name,
          subjectCount: exam.examSubjects.length,
          studentCount,
          marksProgress: totalExpected > 0
            ? { entered: totalMarksEntered, total: totalExpected, percentage: Math.round((totalMarksEntered / totalExpected) * 100) }
            : { entered: 0, total: 0, percentage: 0 },
          subjects: exam.examSubjects.map((es) => ({
            id: es.id,
            subjectName: es.subject.name,
            subjectCode: es.subject.code,
            maxMarks: es.maxMarks,
            passingMarks: es.passingMarks,
            examDate: es.examDate?.toISOString() || null,
            startTime: es.startTime,
            endTime: es.endTime,
            marksEntered: es._count.marks,
          })),
          createdAt: exam.createdAt.toISOString(),
        };
      })
    );

    return {
      success: true,
      data: enrichedExams,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error("Get exam list error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch exams" };
  }
}

// ==================== Get Exam Detail ====================

export async function getExamDetail(id: string) {
  try {
    const user = await requireTenantUser();
    const tenantId = user.tenantId!;

    const exam = await prisma.exam.findFirst({
      where: { id, tenantId },
      include: {
        class: { select: { id: true, name: true, section: true } },
        batch: { select: { id: true, name: true } },
        academicYear: { select: { name: true } },
        examSubjects: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            marks: {
              include: {
                student: {
                  select: { id: true, name: true, rollNo: true, admissionNo: true, photoUrl: true },
                },
              },
              orderBy: { student: { rollNo: "asc" } },
            },
          },
          orderBy: { examDate: "asc" },
        },
      },
    });

    if (!exam) return { success: false, error: "Exam not found" };

    // Get students for this class/batch
    let students: { id: string; name: string; rollNo: string | null; admissionNo: string; photoUrl: string | null }[] = [];
    if (exam.classId) {
      students = await prisma.student.findMany({
        where: { tenantId, classId: exam.classId, status: "ACTIVE" },
        select: { id: true, name: true, rollNo: true, admissionNo: true, photoUrl: true },
        orderBy: { rollNo: "asc" },
      });
    } else if (exam.batchId) {
      students = await prisma.student.findMany({
        where: { tenantId, batchId: exam.batchId, status: "ACTIVE" },
        select: { id: true, name: true, rollNo: true, admissionNo: true, photoUrl: true },
        orderBy: { rollNo: "asc" },
      });
    }

    return {
      success: true,
      data: {
        id: exam.id,
        name: exam.name,
        type: exam.type,
        status: exam.status,
        startDate: exam.startDate?.toISOString() || null,
        endDate: exam.endDate?.toISOString() || null,
        className: exam.class ? `${exam.class.name}${exam.class.section ? ` - ${exam.class.section}` : ""}` : null,
        batchName: exam.batch?.name || null,
        classId: exam.classId,
        batchId: exam.batchId,
        academicYear: exam.academicYear.name,
        createdAt: exam.createdAt.toISOString(),
        students,
        subjects: exam.examSubjects.map((es) => ({
          id: es.id,
          subjectId: es.subject.id,
          subjectName: es.subject.name,
          subjectCode: es.subject.code,
          maxMarks: es.maxMarks,
          passingMarks: es.passingMarks,
          examDate: es.examDate?.toISOString() || null,
          startTime: es.startTime,
          endTime: es.endTime,
          marks: es.marks.map((m) => ({
            id: m.id,
            studentId: m.studentId,
            studentName: m.student.name,
            rollNo: m.student.rollNo,
            admissionNo: m.student.admissionNo,
            marksObtained: Number(m.marksObtained),
            grade: m.grade,
            remarks: m.remarks,
          })),
        })),
      },
    };
  } catch (error) {
    console.error("Get exam detail error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch exam details" };
  }
}

// ==================== Get Students For Marks Entry ====================

export async function getStudentsForMarks(examSubjectId: string) {
  try {
    const user = await requireTenantTeacher();
    const tenantId = user.tenantId!;

    const examSubject = await prisma.examSubject.findFirst({
      where: { id: examSubjectId },
      include: {
        exam: { select: { tenantId: true, classId: true, batchId: true } },
        subject: { select: { name: true } },
        marks: true,
      },
    });

    if (!examSubject || examSubject.exam.tenantId !== tenantId) {
      return { success: false, error: "Exam subject not found" };
    }

    const studentWhere: Record<string, unknown> = { tenantId, status: "ACTIVE" };
    if (examSubject.exam.classId) studentWhere.classId = examSubject.exam.classId;
    if (examSubject.exam.batchId) studentWhere.batchId = examSubject.exam.batchId;

    const students = await prisma.student.findMany({
      where: studentWhere,
      select: { id: true, name: true, rollNo: true, admissionNo: true, photoUrl: true },
      orderBy: [{ rollNo: "asc" }, { name: "asc" }],
    });

    // Map existing marks to students
    const marksMap = new Map(
      examSubject.marks.map((m) => [m.studentId, { marksObtained: Number(m.marksObtained), grade: m.grade, remarks: m.remarks }])
    );

    return {
      success: true,
      data: {
        subjectName: examSubject.subject.name,
        maxMarks: examSubject.maxMarks,
        passingMarks: examSubject.passingMarks,
        students: students.map((s) => ({
          ...s,
          existingMarks: marksMap.get(s.id) || null,
        })),
      },
    };
  } catch (error) {
    console.error("Get students for marks error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch students" };
  }
}

// ==================== Save Marks ====================

export async function saveMarks(data: {
  examSubjectId: string;
  marks: { studentId: string; marksObtained: number; remarks?: string }[];
}) {
  try {
    const user = await requireTenantTeacher();
    const tenantId = user.tenantId!;

    const validated = saveMarksSchema.parse(data);

    const examSubject = await prisma.examSubject.findFirst({
      where: { id: validated.examSubjectId },
      include: { exam: { select: { tenantId: true, name: true, status: true } } },
    });

    if (!examSubject || examSubject.exam.tenantId !== tenantId) {
      return { success: false, error: "Exam subject not found" };
    }

    if (examSubject.exam.status === "RESULT_PUBLISHED") {
      return { success: false, error: "Cannot modify marks for published results" };
    }

    // Validate marks don't exceed max
    for (const mark of validated.marks) {
      if (mark.marksObtained > examSubject.maxMarks) {
        return { success: false, error: `Marks cannot exceed ${examSubject.maxMarks}` };
      }
    }

    // Bulk upsert marks
    await prisma.$transaction(
      validated.marks.map((mark) =>
        prisma.mark.upsert({
          where: {
            examSubjectId_studentId: {
              examSubjectId: validated.examSubjectId,
              studentId: mark.studentId,
            },
          },
          create: {
            tenantId,
            examSubjectId: validated.examSubjectId,
            studentId: mark.studentId,
            marksObtained: mark.marksObtained,
            grade: calculateGrade(mark.marksObtained, examSubject.maxMarks),
            remarks: mark.remarks || null,
            enteredBy: user.id,
          },
          update: {
            marksObtained: mark.marksObtained,
            grade: calculateGrade(mark.marksObtained, examSubject.maxMarks),
            remarks: mark.remarks || null,
            enteredBy: user.id,
          },
        })
      )
    );

    await logAudit({
      tenantId,
      userId: user.id,
      action: "MARKS_ENTERED",
      entityType: "ExamSubject",
      entityId: validated.examSubjectId,
      details: { examName: examSubject.exam.name, count: validated.marks.length },
    });

    revalidatePath("/dashboard/exams");
    return { success: true, message: `Marks saved for ${validated.marks.length} students` };
  } catch (error) {
    console.error("Save marks error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to save marks" };
  }
}

// ==================== Publish Results ====================

export async function publishResults(examId: string) {
  try {
    const user = await requireTenantTeacher();
    const tenantId = user.tenantId!;

    const exam = await prisma.exam.findFirst({
      where: { id: examId, tenantId },
      include: {
        examSubjects: {
          include: {
            marks: true,
            subject: { select: { name: true } },
          },
        },
        class: { select: { name: true, section: true } },
        batch: { select: { name: true } },
      },
    });

    if (!exam) return { success: false, error: "Exam not found" };

    if (exam.status === "RESULT_PUBLISHED") {
      return { success: false, error: "Results are already published" };
    }

    // Check all subjects have marks entered
    let studentCount = 0;
    if (exam.classId) {
      studentCount = await prisma.student.count({
        where: { tenantId, classId: exam.classId, status: "ACTIVE" },
      });
    } else if (exam.batchId) {
      studentCount = await prisma.student.count({
        where: { tenantId, batchId: exam.batchId, status: "ACTIVE" },
      });
    }

    const subjectsWithoutFullMarks = exam.examSubjects.filter(
      (es) => es.marks.length < studentCount
    );

    if (subjectsWithoutFullMarks.length > 0) {
      const missing = subjectsWithoutFullMarks.map((s) => s.subject.name).join(", ");
      return {
        success: false,
        error: `Marks are incomplete for: ${missing}. Please enter marks for all students in all subjects before publishing.`,
      };
    }

    // Update exam status
    await prisma.exam.update({
      where: { id: examId },
      data: { status: "RESULT_PUBLISHED" },
    });

    // Create notification for students & parents
    const examName = exam.name;
    const className = exam.class
      ? `${exam.class.name}${exam.class.section ? ` - ${exam.class.section}` : ""}`
      : exam.batch?.name || "";

    await prisma.notification.create({
      data: {
        tenantId,
        title: `Exam Results Published: ${examName}`,
        message: `Results for ${examName} (${className}) have been published. Check your exam section for detailed marks and report card.`,
        type: "EXAM_SCHEDULE",
        priority: "HIGH",
        targetRoles: ["STUDENT", "PARENT"],
        targetClassId: exam.classId || null,
        targetBatchId: exam.batchId || null,
        sentVia: ["IN_APP"],
        createdBy: user.id,
      },
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "RESULTS_PUBLISHED",
      entityType: "Exam",
      entityId: examId,
      details: { name: examName },
    });

    revalidatePath("/dashboard/exams");
    revalidatePath(`/dashboard/exams/${examId}`);
    return { success: true, message: "Results published successfully!" };
  } catch (error) {
    console.error("Publish results error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to publish results" };
  }
}

// ==================== Get Exam Results (for report card) ====================

export async function getExamResults(examId: string) {
  try {
    const user = await requireTenantUser();
    const tenantId = user.tenantId!;

    const exam = await prisma.exam.findFirst({
      where: { id: examId, tenantId },
      include: {
        class: { select: { name: true, section: true } },
        batch: { select: { name: true } },
        academicYear: { select: { name: true } },
        examSubjects: {
          include: {
            subject: { select: { name: true, code: true } },
            marks: {
              include: {
                student: {
                  select: { id: true, name: true, rollNo: true, admissionNo: true, photoUrl: true },
                },
              },
            },
          },
          orderBy: { examDate: "asc" },
        },
      },
    });

    if (!exam) return { success: false, error: "Exam not found" };

    // Build student-wise results
    const studentMap = new Map<
      string,
      {
        id: string;
        name: string;
        rollNo: string | null;
        admissionNo: string;
        photoUrl: string | null;
        subjects: { name: string; code: string | null; maxMarks: number; passingMarks: number; marksObtained: number; grade: string | null; passed: boolean }[];
        totalMarks: number;
        totalMaxMarks: number;
        percentage: number;
        overallGrade: string;
        rank: number;
      }
    >();

    for (const es of exam.examSubjects) {
      for (const mark of es.marks) {
        if (!studentMap.has(mark.studentId)) {
          studentMap.set(mark.studentId, {
            id: mark.student.id,
            name: mark.student.name,
            rollNo: mark.student.rollNo,
            admissionNo: mark.student.admissionNo,
            photoUrl: mark.student.photoUrl,
            subjects: [],
            totalMarks: 0,
            totalMaxMarks: 0,
            percentage: 0,
            overallGrade: "",
            rank: 0,
          });
        }

        const student = studentMap.get(mark.studentId)!;
        const obtained = Number(mark.marksObtained);
        student.subjects.push({
          name: es.subject.name,
          code: es.subject.code,
          maxMarks: es.maxMarks,
          passingMarks: es.passingMarks,
          marksObtained: obtained,
          grade: mark.grade,
          passed: obtained >= es.passingMarks,
        });
        student.totalMarks += obtained;
        student.totalMaxMarks += es.maxMarks;
      }
    }

    // Calculate percentages and ranks
    const students = Array.from(studentMap.values());
    for (const student of students) {
      student.percentage = student.totalMaxMarks > 0
        ? Math.round((student.totalMarks / student.totalMaxMarks) * 100 * 100) / 100
        : 0;
      student.overallGrade = calculateGrade(student.totalMarks, student.totalMaxMarks);
    }

    // Sort by percentage descending for ranking
    students.sort((a, b) => b.percentage - a.percentage);
    students.forEach((s, i) => (s.rank = i + 1));

    const className = exam.class
      ? `${exam.class.name}${exam.class.section ? ` - ${exam.class.section}` : ""}`
      : exam.batch?.name || "";

    return {
      success: true,
      data: {
        examId: exam.id,
        examName: exam.name,
        examType: exam.type,
        examStatus: exam.status,
        className,
        academicYear: exam.academicYear.name,
        startDate: exam.startDate?.toISOString() || null,
        endDate: exam.endDate?.toISOString() || null,
        subjects: exam.examSubjects.map((es) => ({
          name: es.subject.name,
          code: es.subject.code,
          maxMarks: es.maxMarks,
          passingMarks: es.passingMarks,
        })),
        students,
        totalStudents: students.length,
        classAverage: students.length > 0
          ? Math.round(students.reduce((sum, s) => sum + s.percentage, 0) / students.length * 100) / 100
          : 0,
        passCount: students.filter((s) => s.subjects.every((sub) => sub.passed)).length,
        failCount: students.filter((s) => s.subjects.some((sub) => !sub.passed)).length,
      },
    };
  } catch (error) {
    console.error("Get exam results error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch results" };
  }
}

// ==================== Get Student Exam Result (single student) ====================

export async function getStudentExamResult(examId: string, studentId: string) {
  try {
    const user = await requireTenantUser();
    const tenantId = user.tenantId!;

    const exam = await prisma.exam.findFirst({
      where: { id: examId, tenantId },
      include: {
        class: { select: { name: true, section: true } },
        batch: { select: { name: true } },
        academicYear: { select: { name: true } },
        examSubjects: {
          include: {
            subject: { select: { name: true, code: true } },
            marks: {
              where: { studentId },
            },
          },
          orderBy: { examDate: "asc" },
        },
      },
    });

    if (!exam) return { success: false, error: "Exam not found" };

    const student = await prisma.student.findFirst({
      where: { id: studentId, tenantId },
      select: { id: true, name: true, rollNo: true, admissionNo: true, photoUrl: true },
    });

    if (!student) return { success: false, error: "Student not found" };

    // Get tenant info for report card header
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId },
      select: { name: true, logoUrl: true, address: true, phone: true, email: true },
    });

    let totalMarks = 0;
    let totalMaxMarks = 0;

    const subjects = exam.examSubjects.map((es) => {
      const mark = es.marks[0];
      const obtained = mark ? Number(mark.marksObtained) : 0;
      totalMarks += obtained;
      totalMaxMarks += es.maxMarks;
      return {
        name: es.subject.name,
        code: es.subject.code,
        maxMarks: es.maxMarks,
        passingMarks: es.passingMarks,
        marksObtained: obtained,
        grade: mark?.grade || "-",
        passed: obtained >= es.passingMarks,
        hasMarks: !!mark,
      };
    });

    const percentage = totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100 * 100) / 100 : 0;
    const overallGrade = calculateGrade(totalMarks, totalMaxMarks);

    // Get rank among class/batch
    const allResults = await getExamResults(examId);
    let rank = 0;
    if (allResults.success && allResults.data) {
      const studentResult = allResults.data.students.find((s) => s.id === studentId);
      rank = studentResult?.rank || 0;
    }

    const className = exam.class
      ? `${exam.class.name}${exam.class.section ? ` - ${exam.class.section}` : ""}`
      : exam.batch?.name || "";

    return {
      success: true,
      data: {
        examName: exam.name,
        examType: exam.type,
        className,
        academicYear: exam.academicYear.name,
        student: {
          name: student.name,
          rollNo: student.rollNo,
          admissionNo: student.admissionNo,
        },
        tenant: tenant || { name: "", logoUrl: null, address: null, phone: null, email: null },
        subjects,
        totalMarks,
        totalMaxMarks,
        percentage,
        overallGrade,
        rank,
        totalStudents: allResults.success ? allResults.data?.totalStudents || 0 : 0,
      },
    };
  } catch (error) {
    console.error("Get student exam result error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch result" };
  }
}

// ==================== Get Classes/Batches for Exam Creation ====================

export async function getClassesForExam() {
  try {
    const user = await requireTenantTeacher();
    const tenantId = user.tenantId!;

    const academicYear = await prisma.academicYear.findFirst({
      where: { tenantId, isCurrent: true },
    });

    if (!academicYear) return { success: true, data: { classes: [], batches: [] } };

    const [classes, batches] = await Promise.all([
      prisma.class.findMany({
        where: { tenantId, academicYearId: academicYear.id },
        select: { id: true, name: true, section: true },
        orderBy: { name: "asc" },
      }),
      prisma.batch.findMany({
        where: { tenantId, academicYearId: academicYear.id },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      success: true,
      data: {
        classes: classes.map((c) => ({
          id: c.id,
          name: `${c.name}${c.section ? ` - ${c.section}` : ""}`,
        })),
        batches: batches.map((b) => ({
          id: b.id,
          name: b.name,
        })),
      },
    };
  } catch (error) {
    console.error("Get classes for exam error:", error);
    return { success: false, error: "Failed to fetch classes/batches" };
  }
}

// ==================== Get Subjects for Class/Batch ====================

export async function getSubjectsForExam(classId?: string, batchId?: string) {
  try {
    const user = await requireTenantTeacher();
    const tenantId = user.tenantId!;

    const where: Record<string, unknown> = { tenantId };
    if (classId) where.classId = classId;
    if (batchId) where.batchId = batchId;

    const subjects = await prisma.subject.findMany({
      where,
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });

    return { success: true, data: subjects };
  } catch (error) {
    console.error("Get subjects for exam error:", error);
    return { success: false, error: "Failed to fetch subjects" };
  }
}

// ==================== Update Exam Subject ====================

export async function updateExamSubject(
  id: string,
  data: {
    examDate?: string;
    startTime?: string;
    endTime?: string;
    maxMarks?: number;
    passingMarks?: number;
  }
) {
  try {
    const user = await requireTenantTeacher();
    const tenantId = user.tenantId!;

    const examSubject = await prisma.examSubject.findFirst({
      where: { id },
      include: { exam: { select: { tenantId: true, status: true } } },
    });

    if (!examSubject || examSubject.exam.tenantId !== tenantId) {
      return { success: false, error: "Exam subject not found" };
    }

    if (examSubject.exam.status === "RESULT_PUBLISHED") {
      return { success: false, error: "Cannot modify published exam" };
    }

    const updated = await prisma.examSubject.update({
      where: { id },
      data: {
        ...(data.examDate && { examDate: new Date(data.examDate) }),
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.endTime && { endTime: data.endTime }),
        ...(data.maxMarks !== undefined && { maxMarks: data.maxMarks }),
        ...(data.passingMarks !== undefined && { passingMarks: data.passingMarks }),
      },
    });

    revalidatePath("/dashboard/exams");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Update exam subject error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update exam subject" };
  }
}

// ==================== Get Exam Statistics for Dashboard ====================

export async function getExamDashboardStats() {
  try {
    const user = await requireTenantUser();
    const tenantId = user.tenantId!;

    const [upcoming, ongoing, completed, published] = await Promise.all([
      prisma.exam.count({ where: { tenantId, status: "UPCOMING" } }),
      prisma.exam.count({ where: { tenantId, status: "ONGOING" } }),
      prisma.exam.count({ where: { tenantId, status: "COMPLETED" } }),
      prisma.exam.count({ where: { tenantId, status: "RESULT_PUBLISHED" } }),
    ]);

    // Get recent results
    const recentResults = await prisma.exam.findMany({
      where: { tenantId, status: "RESULT_PUBLISHED" },
      include: {
        class: { select: { name: true, section: true } },
        batch: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Upcoming exams
    const upcomingExams = await prisma.exam.findMany({
      where: { tenantId, status: { in: ["UPCOMING", "ONGOING"] } },
      include: {
        class: { select: { name: true, section: true } },
        batch: { select: { name: true } },
      },
      orderBy: { startDate: "asc" },
      take: 5,
    });

    // Pending marks entry (completed but not published)
    const pendingMarks = await prisma.exam.count({
      where: { tenantId, status: "COMPLETED" },
    });

    return {
      success: true,
      data: {
        stats: { upcoming, ongoing, completed, published, pendingMarks },
        recentResults: recentResults.map((e) => ({
          id: e.id,
          name: e.name,
          type: e.type,
          className: e.class ? `${e.class.name}${e.class.section ? ` - ${e.class.section}` : ""}` : e.batch?.name || "",
        })),
        upcomingExams: upcomingExams.map((e) => ({
          id: e.id,
          name: e.name,
          type: e.type,
          startDate: e.startDate?.toISOString() || null,
          className: e.class ? `${e.class.name}${e.class.section ? ` - ${e.class.section}` : ""}` : e.batch?.name || "",
        })),
      },
    };
  } catch (error) {
    console.error("Get exam dashboard stats error:", error);
    return { success: false, error: "Failed to fetch exam stats" };
  }
}
