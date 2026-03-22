"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "./audit";
import { revalidatePath } from "next/cache";
import { homeworkSchema } from "@/lib/validations/schemas";

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

// ==================== Teacher: Homework CRUD ====================

export async function createHomework(data: {
  title: string;
  description?: string;
  subjectId: string;
  classId?: string;
  batchId?: string;
  dueDate: string;
  fileUrls?: string[];
  publish?: boolean;
}) {
  try {
    const user = await requireTenantTeacher();
    const tenantId = user.tenantId!;

    const validated = homeworkSchema.parse(data);

    const homework = await prisma.homework.create({
      data: {
        tenantId,
        title: validated.title,
        description: validated.description || null,
        subjectId: validated.subjectId,
        classId: validated.classId || null,
        batchId: validated.batchId || null,
        dueDate: new Date(validated.dueDate),
        fileUrls: data.fileUrls || [],
        teacherId: user.id,
        status: data.publish ? "PUBLISHED" : "DRAFT",
      },
    });

    // If publishing, create notifications for students
    if (data.publish) {
      await createHomeworkNotification(tenantId, homework.id, homework.title, homework.classId, homework.batchId, user.id);
    }

    await logAudit({
      tenantId,
      userId: user.id,
      action: data.publish ? "HOMEWORK_PUBLISHED" : "HOMEWORK_CREATED",
      entityType: "Homework",
      entityId: homework.id,
      details: { title: homework.title },
    });

    revalidatePath("/dashboard/homework");
    return { success: true, data: homework };
  } catch (error) {
    console.error("Create homework error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create homework" };
  }
}

export async function updateHomework(
  id: string,
  data: {
    title?: string;
    description?: string;
    subjectId?: string;
    classId?: string;
    batchId?: string;
    dueDate?: string;
    fileUrls?: string[];
  }
) {
  try {
    const user = await requireTenantTeacher();
    const tenantId = user.tenantId!;

    const homework = await prisma.homework.findFirst({
      where: { id, tenantId },
    });

    if (!homework) {
      return { success: false, error: "Homework not found" };
    }

    // Only the creator or admin can edit
    if (homework.teacherId !== user.id && !["TENANT_ADMIN", "VICE_ADMIN"].includes(user.role)) {
      return { success: false, error: "You can only edit your own homework" };
    }

    const updated = await prisma.homework.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.subjectId && { subjectId: data.subjectId }),
        ...(data.classId !== undefined && { classId: data.classId || null }),
        ...(data.batchId !== undefined && { batchId: data.batchId || null }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        ...(data.fileUrls && { fileUrls: data.fileUrls }),
      },
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "HOMEWORK_UPDATED",
      entityType: "Homework",
      entityId: id,
      details: { title: updated.title },
    });

    revalidatePath("/dashboard/homework");
    revalidatePath(`/dashboard/homework/${id}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("Update homework error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update homework" };
  }
}

export async function publishHomework(id: string) {
  try {
    const user = await requireTenantTeacher();
    const tenantId = user.tenantId!;

    const homework = await prisma.homework.findFirst({
      where: { id, tenantId, status: "DRAFT" },
    });

    if (!homework) {
      return { success: false, error: "Homework not found or already published" };
    }

    const updated = await prisma.homework.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });

    // Create notification for students
    await createHomeworkNotification(tenantId, id, homework.title, homework.classId, homework.batchId, user.id);

    await logAudit({
      tenantId,
      userId: user.id,
      action: "HOMEWORK_PUBLISHED",
      entityType: "Homework",
      entityId: id,
      details: { title: homework.title },
    });

    revalidatePath("/dashboard/homework");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Publish homework error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to publish homework" };
  }
}

export async function closeHomework(id: string) {
  try {
    const user = await requireTenantTeacher();
    const tenantId = user.tenantId!;

    const updated = await prisma.homework.update({
      where: { id },
      data: { status: "CLOSED" },
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "HOMEWORK_CLOSED",
      entityType: "Homework",
      entityId: id,
    });

    revalidatePath("/dashboard/homework");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Close homework error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to close homework" };
  }
}

export async function deleteHomework(id: string) {
  try {
    const user = await requireTenantTeacher();
    const tenantId = user.tenantId!;

    const homework = await prisma.homework.findFirst({
      where: { id, tenantId },
    });

    if (!homework) {
      return { success: false, error: "Homework not found" };
    }

    if (homework.teacherId !== user.id && !["TENANT_ADMIN", "VICE_ADMIN"].includes(user.role)) {
      return { success: false, error: "You can only delete your own homework" };
    }

    await prisma.homework.delete({ where: { id } });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "HOMEWORK_DELETED",
      entityType: "Homework",
      entityId: id,
      details: { title: homework.title },
    });

    revalidatePath("/dashboard/homework");
    return { success: true };
  } catch (error) {
    console.error("Delete homework error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete homework" };
  }
}

// ==================== Homework List & Detail ====================

export async function getHomeworkList(filters?: {
  classId?: string;
  batchId?: string;
  subjectId?: string;
  status?: string;
  teacherOnly?: boolean;
  page?: number;
  pageSize?: number;
}) {
  try {
    const user = await requireTenantUser();
    const tenantId = user.tenantId!;
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;

    const where: Record<string, unknown> = { tenantId };

    // Teachers see only their homework unless admin
    if (filters?.teacherOnly || user.role === "TEACHER") {
      where.teacherId = user.id;
    }

    if (filters?.classId) where.classId = filters.classId;
    if (filters?.batchId) where.batchId = filters.batchId;
    if (filters?.subjectId) where.subjectId = filters.subjectId;
    if (filters?.status) where.status = filters.status;

    const [homework, total] = await Promise.all([
      prisma.homework.findMany({
        where,
        include: {
          subject: { select: { id: true, name: true, code: true } },
          class: { select: { id: true, name: true, section: true } },
          batch: { select: { id: true, name: true } },
          teacher: { select: { id: true, name: true } },
          _count: { select: { submissions: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.homework.count({ where }),
    ]);

    // Get total students per class/batch for submission counts
    const enriched = await Promise.all(
      homework.map(async (hw) => {
        const studentCount = await prisma.student.count({
          where: {
            tenantId,
            status: "ACTIVE",
            ...(hw.classId ? { classId: hw.classId } : {}),
            ...(hw.batchId ? { batchId: hw.batchId } : {}),
          },
        });
        return {
          ...hw,
          totalStudents: studentCount,
          submissionCount: hw._count.submissions,
        };
      })
    );

    return {
      success: true,
      data: enriched,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  } catch (error) {
    console.error("Get homework list error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch homework" };
  }
}

export async function getHomeworkDetail(id: string) {
  try {
    const user = await requireTenantUser();
    const tenantId = user.tenantId!;

    const homework = await prisma.homework.findFirst({
      where: { id, tenantId },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, section: true } },
        batch: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
        submissions: {
          include: {
            student: {
              select: { id: true, name: true, rollNo: true, admissionNo: true, photoUrl: true },
            },
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    if (!homework) {
      return { success: false, error: "Homework not found" };
    }

    // Get total students for this class/batch
    const totalStudents = await prisma.student.count({
      where: {
        tenantId,
        status: "ACTIVE",
        ...(homework.classId ? { classId: homework.classId } : {}),
        ...(homework.batchId ? { batchId: homework.batchId } : {}),
      },
    });

    return {
      success: true,
      data: { ...homework, totalStudents },
    };
  } catch (error) {
    console.error("Get homework detail error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch homework" };
  }
}

// ==================== Student: Submit Homework ====================

export async function submitHomework(data: {
  homeworkId: string;
  content?: string;
  fileUrls?: string[];
}) {
  try {
    const user = await requireTenantUser();
    const tenantId = user.tenantId!;

    // Find student record for this user
    const student = await prisma.student.findFirst({
      where: { tenantId, userId: user.id, status: "ACTIVE" },
    });

    if (!student) {
      return { success: false, error: "Student record not found" };
    }

    const homework = await prisma.homework.findFirst({
      where: { id: data.homeworkId, tenantId, status: "PUBLISHED" },
    });

    if (!homework) {
      return { success: false, error: "Homework not found or not published" };
    }

    const isLate = new Date() > new Date(homework.dueDate);

    // Upsert submission (allow re-submit before due date)
    const existing = await prisma.homeworkSubmission.findUnique({
      where: { homeworkId_studentId: { homeworkId: data.homeworkId, studentId: student.id } },
    });

    if (existing && existing.status === "GRADED") {
      return { success: false, error: "This submission has already been graded" };
    }

    const submission = await prisma.homeworkSubmission.upsert({
      where: {
        homeworkId_studentId: { homeworkId: data.homeworkId, studentId: student.id },
      },
      create: {
        homeworkId: data.homeworkId,
        studentId: student.id,
        content: data.content || null,
        fileUrls: data.fileUrls || [],
        status: isLate ? "LATE" : "SUBMITTED",
        submittedAt: new Date(),
      },
      update: {
        content: data.content || null,
        fileUrls: data.fileUrls || [],
        status: isLate ? "LATE" : "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    revalidatePath(`/dashboard/homework/${data.homeworkId}`);
    return { success: true, data: submission };
  } catch (error) {
    console.error("Submit homework error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to submit homework" };
  }
}

// ==================== Teacher: Grade Submission ====================

export async function gradeSubmission(data: {
  submissionId: string;
  grade: string;
  feedback?: string;
}) {
  try {
    const user = await requireTenantTeacher();

    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: data.submissionId },
      include: { homework: true },
    });

    if (!submission) {
      return { success: false, error: "Submission not found" };
    }

    const updated = await prisma.homeworkSubmission.update({
      where: { id: data.submissionId },
      data: {
        grade: data.grade,
        feedback: data.feedback || null,
        status: "GRADED",
      },
    });

    await logAudit({
      tenantId: user.tenantId,
      userId: user.id,
      action: "HOMEWORK_GRADED",
      entityType: "HomeworkSubmission",
      entityId: data.submissionId,
      details: { grade: data.grade },
    });

    revalidatePath(`/dashboard/homework/${submission.homeworkId}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("Grade submission error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to grade submission" };
  }
}

// ==================== Student: My Homework ====================

export async function getMyHomework(filters?: {
  subjectId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const user = await requireTenantUser();
    const tenantId = user.tenantId!;
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;

    // Find student
    const student = await prisma.student.findFirst({
      where: { tenantId, userId: user.id },
      select: { id: true, classId: true, batchId: true },
    });

    if (!student) {
      return { success: false, error: "Student record not found" };
    }

    // Get homework for student's class/batch
    const where: Record<string, unknown> = {
      tenantId,
      status: { in: ["PUBLISHED", "CLOSED"] },
    };

    if (student.classId) where.classId = student.classId;
    if (student.batchId) where.batchId = student.batchId;
    if (filters?.subjectId) where.subjectId = filters.subjectId;

    const [homework, total] = await Promise.all([
      prisma.homework.findMany({
        where,
        include: {
          subject: { select: { id: true, name: true } },
          teacher: { select: { name: true } },
          submissions: {
            where: { studentId: student.id },
            select: { id: true, status: true, grade: true, feedback: true, submittedAt: true },
          },
        },
        orderBy: { dueDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.homework.count({ where }),
    ]);

    const enriched = homework.map((hw) => ({
      ...hw,
      mySubmission: hw.submissions[0] || null,
    }));

    return {
      success: true,
      data: enriched,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  } catch (error) {
    console.error("Get my homework error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch homework" };
  }
}

export async function getMyHomeworkDetail(homeworkId: string) {
  try {
    const user = await requireTenantUser();
    const tenantId = user.tenantId!;

    const student = await prisma.student.findFirst({
      where: { tenantId, userId: user.id },
      select: { id: true },
    });

    if (!student) {
      return { success: false, error: "Student record not found" };
    }

    const homework = await prisma.homework.findFirst({
      where: { id: homeworkId, tenantId },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
        submissions: {
          where: { studentId: student.id },
        },
      },
    });

    if (!homework) {
      return { success: false, error: "Homework not found" };
    }

    return {
      success: true,
      data: {
        ...homework,
        mySubmission: homework.submissions[0] || null,
      },
    };
  } catch (error) {
    console.error("Get my homework detail error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch homework" };
  }
}

// ==================== Helpers ====================

export async function getClassesAndBatchesForHomework() {
  try {
    const user = await requireTenantTeacher();
    const tenantId = user.tenantId!;

    const academicYear = await prisma.academicYear.findFirst({
      where: { tenantId, isCurrent: true },
    });

    if (!academicYear) {
      return { success: true, data: { classes: [], batches: [], subjects: [] } };
    }

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

    return { success: true, data: { classes, batches } };
  } catch (error) {
    console.error("Get classes/batches error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch" };
  }
}

export async function getSubjectsForHomework(classId?: string, batchId?: string) {
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
    console.error("Get subjects error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch subjects" };
  }
}

async function createHomeworkNotification(
  tenantId: string,
  homeworkId: string,
  title: string,
  classId: string | null,
  batchId: string | null,
  createdBy: string
) {
  try {
    await prisma.notification.create({
      data: {
        tenantId,
        title: "New Homework Assigned",
        message: `New homework "${title}" has been assigned. Check it out!`,
        type: "HOMEWORK",
        priority: "NORMAL",
        targetRoles: ["STUDENT", "PARENT"],
        targetClassId: classId,
        targetBatchId: batchId,
        sentVia: ["IN_APP"],
        createdBy,
      },
    });
  } catch (error) {
    console.error("Create homework notification error:", error);
  }
}

export async function sendHomeworkReminder(homeworkId: string) {
  try {
    const user = await requireTenantTeacher();
    const tenantId = user.tenantId!;

    const homework = await prisma.homework.findFirst({
      where: { id: homeworkId, tenantId },
      include: {
        class: { select: { name: true, section: true } },
        batch: { select: { name: true } },
      },
    });

    if (!homework) {
      return { success: false, error: "Homework not found" };
    }

    // Get students who haven't submitted
    const submittedStudentIds = await prisma.homeworkSubmission.findMany({
      where: { homeworkId },
      select: { studentId: true },
    });

    const submittedIds = submittedStudentIds.map((s) => s.studentId);

    const missingStudents = await prisma.student.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        id: { notIn: submittedIds },
        ...(homework.classId ? { classId: homework.classId } : {}),
        ...(homework.batchId ? { batchId: homework.batchId } : {}),
      },
      select: { name: true },
    });

    // Create reminder notification
    await prisma.notification.create({
      data: {
        tenantId,
        title: "Homework Reminder",
        message: `Reminder: "${homework.title}" is due soon. Please submit before the deadline.`,
        type: "HOMEWORK",
        priority: "HIGH",
        targetRoles: ["STUDENT"],
        targetClassId: homework.classId,
        targetBatchId: homework.batchId,
        sentVia: ["IN_APP"],
        createdBy: user.id,
      },
    });

    revalidatePath(`/dashboard/homework/${homeworkId}`);
    return { success: true, data: { remindersSent: missingStudents.length } };
  } catch (error) {
    console.error("Send reminder error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to send reminders" };
  }
}
