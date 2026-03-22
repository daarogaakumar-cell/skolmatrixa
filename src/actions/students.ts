"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "./audit";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email";

async function requireStudentManager() {
  const session = await auth();
  if (!session?.user || !session.user.tenantId) {
    throw new Error("Unauthorized");
  }
  if (!["TENANT_ADMIN", "VICE_ADMIN"].includes(session.user.role)) {
    throw new Error("Insufficient permissions");
  }
  return session.user;
}

async function requireTenantMember() {
  const session = await auth();
  if (!session?.user || !session.user.tenantId) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

// ==================== Student List ====================

export async function getStudentList({
  page = 1,
  pageSize = 25,
  search,
  classId,
  batchId,
  status,
  gender,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  classId?: string;
  batchId?: string;
  status?: string;
  gender?: string;
} = {}) {
  const user = await requireTenantMember();
  const tenantId = user.tenantId!;

  const where: Record<string, unknown> = { tenantId };

  if (classId && classId !== "ALL") {
    where.classId = classId;
  }
  if (batchId && batchId !== "ALL") {
    where.batchId = batchId;
  }
  if (status && status !== "ALL") {
    where.status = status;
  }
  if (gender && gender !== "ALL") {
    where.gender = gender;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { admissionNo: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { guardianName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        class: { select: { id: true, name: true, section: true } },
        batch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.student.count({ where }),
  ]);

  return {
    success: true,
    data: students,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// ==================== Get Single Student ====================

export async function getStudentDetail(studentId: string) {
  const user = await requireTenantMember();
  const tenantId = user.tenantId!;

  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          section: true,
          classTeacher: { select: { name: true } },
        },
      },
      batch: { select: { id: true, name: true } },
      user: { select: { id: true, email: true, isActive: true, lastLoginAt: true } },
      parentUser: { select: { id: true, name: true, email: true } },
    },
  });

  if (!student) {
    return { success: false, error: "Student not found" };
  }

  return { success: true, data: student };
}

// ==================== Create Student ====================

export async function createStudent(data: {
  admissionNo: string;
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  address?: string;
  photoUrl?: string;
  classId?: string;
  batchId?: string;
  rollNo?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianRelation?: string;
  createUserAccount?: boolean;
  createParentAccount?: boolean;
}) {
  const user = await requireStudentManager();
  const tenantId = user.tenantId!;

  try {
    // Check tenant student limit
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { maxStudents: true, name: true },
    });

    const currentStudentCount = await prisma.student.count({
      where: { tenantId, status: "ACTIVE" },
    });

    if (tenant && currentStudentCount >= tenant.maxStudents) {
      return {
        success: false,
        error: `Student limit reached (${tenant.maxStudents}). Please upgrade your plan.`,
      };
    }

    // Check admission number uniqueness
    const existingStudent = await prisma.student.findFirst({
      where: { tenantId, admissionNo: data.admissionNo },
    });

    if (existingStudent) {
      return { success: false, error: "A student with this admission number already exists" };
    }

    const result = await prisma.$transaction(async (tx) => {
      let studentUserId: string | null = null;
      let parentUserId: string | null = null;
      let studentPassword: string | null = null;
      let parentPassword: string | null = null;

      // Create student user account if requested
      if (data.createUserAccount && data.email) {
        const existingUser = await tx.user.findFirst({
          where: { email: data.email, tenantId },
        });

        if (existingUser) {
          throw new Error("A user with this email already exists");
        }

        studentPassword = generatePassword();
        const hash = await bcrypt.hash(studentPassword, 12);

        const studentUser = await tx.user.create({
          data: {
            tenantId,
            email: data.email,
            passwordHash: hash,
            name: data.name,
            phone: data.phone || null,
            role: "STUDENT",
            isActive: true,
          },
        });
        studentUserId = studentUser.id;
      }

      // Create parent user account if requested
      if (data.createParentAccount && data.guardianEmail) {
        const existingParent = await tx.user.findFirst({
          where: { email: data.guardianEmail, tenantId },
        });

        if (!existingParent) {
          parentPassword = generatePassword();
          const hash = await bcrypt.hash(parentPassword, 12);

          const parentUser = await tx.user.create({
            data: {
              tenantId,
              email: data.guardianEmail,
              passwordHash: hash,
              name: data.guardianName || "Parent",
              phone: data.guardianPhone || null,
              role: "PARENT",
              isActive: true,
            },
          });
          parentUserId = parentUser.id;
        } else {
          parentUserId = existingParent.id;
        }
      }

      // Create student record
      const student = await tx.student.create({
        data: {
          tenantId,
          userId: studentUserId,
          admissionNo: data.admissionNo,
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender || null,
          address: data.address || null,
          photoUrl: data.photoUrl || null,
          classId: data.classId || null,
          batchId: data.batchId || null,
          rollNo: data.rollNo || null,
          guardianName: data.guardianName || null,
          guardianPhone: data.guardianPhone || null,
          guardianEmail: data.guardianEmail || null,
          guardianRelation: data.guardianRelation || null,
          parentUserId,
          admissionDate: new Date(),
          status: "ACTIVE",
        },
        include: {
          class: { select: { name: true, section: true } },
          batch: { select: { name: true } },
        },
      });

      return { student, studentPassword, parentPassword };
    });

    // Send credential emails (non-blocking)
    if (result.studentPassword && data.email) {
      sendEmail({
        to: data.email,
        subject: `Welcome to ${tenant?.name || "SkolMatrixa"} - Student Account`,
        html: buildCredentialEmail(
          data.name,
          data.email,
          result.studentPassword,
          "Student",
          tenant?.name || "SkolMatrixa"
        ),
      }).catch((err) => console.error("Student email error:", err));
    }

    if (result.parentPassword && data.guardianEmail) {
      sendEmail({
        to: data.guardianEmail,
        subject: `Welcome to ${tenant?.name || "SkolMatrixa"} - Parent Account`,
        html: buildCredentialEmail(
          data.guardianName || "Parent",
          data.guardianEmail,
          result.parentPassword,
          "Parent",
          tenant?.name || "SkolMatrixa"
        ),
      }).catch((err) => console.error("Parent email error:", err));
    }

    await logAudit({
      tenantId,
      userId: user.id,
      action: "STUDENT_CREATED",
      entityType: "Student",
      entityId: result.student.id,
      details: { name: data.name, admissionNo: data.admissionNo },
    });

    revalidatePath("/dashboard/students");
    return { success: true, data: result.student };
  } catch (error) {
    console.error("Create student error:", error);
    const message = error instanceof Error ? error.message : "Failed to create student";
    return { success: false, error: message };
  }
}

// ==================== Update Student ====================

export async function updateStudent(
  studentId: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: "MALE" | "FEMALE" | "OTHER";
    address?: string;
    photoUrl?: string;
    classId?: string;
    batchId?: string;
    rollNo?: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    guardianRelation?: string;
  }
) {
  const user = await requireStudentManager();
  const tenantId = user.tenantId!;

  try {
    const existing = await prisma.student.findFirst({
      where: { id: studentId, tenantId },
    });

    if (!existing) {
      return { success: false, error: "Student not found" };
    }

    const student = await prisma.student.update({
      where: { id: studentId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gender: data.gender,
        address: data.address,
        photoUrl: data.photoUrl,
        classId: data.classId || null,
        batchId: data.batchId || null,
        rollNo: data.rollNo,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        guardianEmail: data.guardianEmail,
        guardianRelation: data.guardianRelation,
      },
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "STUDENT_UPDATED",
      entityType: "Student",
      entityId: studentId,
      details: data,
    });

    revalidatePath("/dashboard/students");
    revalidatePath(`/dashboard/students/${studentId}`);
    return { success: true, data: student };
  } catch (error) {
    console.error("Update student error:", error);
    return { success: false, error: "Failed to update student" };
  }
}

// ==================== Toggle Student Status ====================

export async function toggleStudentStatus(studentId: string) {
  const user = await requireStudentManager();
  const tenantId = user.tenantId!;

  try {
    const student = await prisma.student.findFirst({
      where: { id: studentId, tenantId },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    const newStatus = student.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    await prisma.student.update({
      where: { id: studentId },
      data: { status: newStatus },
    });

    // Also toggle user account if exists
    if (student.userId) {
      await prisma.user.update({
        where: { id: student.userId },
        data: { isActive: newStatus === "ACTIVE" },
      });
    }

    await logAudit({
      tenantId,
      userId: user.id,
      action: newStatus === "ACTIVE" ? "STUDENT_ACTIVATED" : "STUDENT_DEACTIVATED",
      entityType: "Student",
      entityId: studentId,
      details: { name: student.name },
    });

    revalidatePath("/dashboard/students");
    return { success: true, status: newStatus };
  } catch (error) {
    console.error("Toggle student status error:", error);
    return { success: false, error: "Failed to update student status" };
  }
}

// ==================== Bulk Create Students (CSV Import) ====================

export async function bulkCreateStudents(
  students: Array<{
    admissionNo: string;
    name: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: "MALE" | "FEMALE" | "OTHER";
    address?: string;
    classId?: string;
    batchId?: string;
    rollNo?: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    guardianRelation?: string;
  }>
) {
  const user = await requireStudentManager();
  const tenantId = user.tenantId!;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { maxStudents: true },
    });

    const currentCount = await prisma.student.count({
      where: { tenantId, status: "ACTIVE" },
    });

    if (tenant && currentCount + students.length > tenant.maxStudents) {
      return {
        success: false,
        error: `Cannot import ${students.length} students. Limit: ${tenant.maxStudents}, Current: ${currentCount}. Available: ${tenant.maxStudents - currentCount}`,
      };
    }

    // Validate unique admission numbers
    const admissionNos = students.map((s) => s.admissionNo);
    const duplicateAdmissions = admissionNos.filter(
      (no, idx) => admissionNos.indexOf(no) !== idx
    );
    if (duplicateAdmissions.length > 0) {
      return {
        success: false,
        error: `Duplicate admission numbers in import: ${[...new Set(duplicateAdmissions)].join(", ")}`,
      };
    }

    // Check existing admission numbers
    const existingStudents = await prisma.student.findMany({
      where: { tenantId, admissionNo: { in: admissionNos } },
      select: { admissionNo: true },
    });

    if (existingStudents.length > 0) {
      return {
        success: false,
        error: `These admission numbers already exist: ${existingStudents.map((s) => s.admissionNo).join(", ")}`,
      };
    }

    // Bulk create in transaction
    const created = await prisma.$transaction(
      students.map((s) =>
        prisma.student.create({
          data: {
            tenantId,
            admissionNo: s.admissionNo,
            name: s.name,
            email: s.email || null,
            phone: s.phone || null,
            dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth) : null,
            gender: s.gender || null,
            address: s.address || null,
            classId: s.classId || null,
            batchId: s.batchId || null,
            rollNo: s.rollNo || null,
            guardianName: s.guardianName || null,
            guardianPhone: s.guardianPhone || null,
            guardianEmail: s.guardianEmail || null,
            guardianRelation: s.guardianRelation || null,
            admissionDate: new Date(),
            status: "ACTIVE",
          },
        })
      )
    );

    await logAudit({
      tenantId,
      userId: user.id,
      action: "STUDENTS_BULK_IMPORTED",
      entityType: "Student",
      details: { count: created.length },
    });

    revalidatePath("/dashboard/students");
    return { success: true, data: { imported: created.length } };
  } catch (error) {
    console.error("Bulk create students error:", error);
    return { success: false, error: "Failed to import students" };
  }
}

// ==================== Get Next Admission Number ====================

export async function getNextAdmissionNo() {
  const user = await requireStudentManager();
  const tenantId = user.tenantId!;

  const lastStudent = await prisma.student.findFirst({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    select: { admissionNo: true },
  });

  if (!lastStudent) {
    return "ADM-001";
  }

  // Try to increment numeric part
  const match = lastStudent.admissionNo.match(/^(\D*)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const num = parseInt(match[2], 10) + 1;
    return `${prefix}${String(num).padStart(match[2].length, "0")}`;
  }

  return `ADM-${String(Date.now()).slice(-4)}`;
}

// ==================== Get Classes/Batches for Dropdowns ====================

export async function getClassesForDropdown() {
  const session = await auth();
  if (!session?.user || !session.user.tenantId) {
    return [];
  }

  return prisma.class.findMany({
    where: {
      tenantId: session.user.tenantId,
      academicYear: { isCurrent: true },
    },
    select: { id: true, name: true, section: true },
    orderBy: { name: "asc" },
  });
}

export async function getBatchesForDropdown() {
  const session = await auth();
  if (!session?.user || !session.user.tenantId) {
    return [];
  }

  return prisma.batch.findMany({
    where: {
      tenantId: session.user.tenantId,
      academicYear: { isCurrent: true },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

// ==================== Export Students as CSV data ====================

export async function getStudentsForExport(filters: {
  classId?: string;
  batchId?: string;
  status?: string;
} = {}) {
  const user = await requireStudentManager();
  const tenantId = user.tenantId!;

  const where: Record<string, unknown> = { tenantId };
  if (filters.classId && filters.classId !== "ALL") where.classId = filters.classId;
  if (filters.batchId && filters.batchId !== "ALL") where.batchId = filters.batchId;
  if (filters.status && filters.status !== "ALL") where.status = filters.status;

  const students = await prisma.student.findMany({
    where,
    include: {
      class: { select: { name: true, section: true } },
      batch: { select: { name: true } },
    },
    orderBy: { admissionNo: "asc" },
  });

  return students.map((s) => ({
    admissionNo: s.admissionNo,
    name: s.name,
    email: s.email || "",
    phone: s.phone || "",
    gender: s.gender || "",
    dateOfBirth: s.dateOfBirth ? s.dateOfBirth.toISOString().split("T")[0] : "",
    class: s.class ? `${s.class.name}${s.class.section ? ` - ${s.class.section}` : ""}` : "",
    batch: s.batch?.name || "",
    rollNo: s.rollNo || "",
    guardianName: s.guardianName || "",
    guardianPhone: s.guardianPhone || "",
    guardianEmail: s.guardianEmail || "",
    guardianRelation: s.guardianRelation || "",
    address: s.address || "",
    status: s.status,
  }));
}

// ==================== Create Login Credentials for Existing Students ====================

export async function createStudentCredentials(studentId: string) {
  const user = await requireStudentManager();
  const tenantId = user.tenantId!;

  try {
    const student = await prisma.student.findFirst({
      where: { id: studentId, tenantId },
      include: { user: true },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    if (student.userId) {
      return { success: false, error: "Student already has a login account" };
    }

    if (!student.email) {
      return { success: false, error: "Student must have an email address to create login credentials" };
    }

    // Check if email is already used by another user
    const existingUser = await prisma.user.findFirst({
      where: { email: student.email, tenantId },
    });
    if (existingUser) {
      return { success: false, error: "This email is already associated with another account" };
    }

    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 12);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          tenantId,
          email: student.email!,
          passwordHash,
          name: student.name,
          phone: student.phone || null,
          role: "STUDENT",
          isActive: true,
        },
      });

      await tx.student.update({
        where: { id: studentId },
        data: { userId: newUser.id },
      });

      return newUser;
    });

    // Send credentials email (non-blocking)
    sendEmail({
      to: student.email,
      subject: `Welcome to ${tenant?.name || "SkolMatrixa"} - Student Login Created`,
      html: buildCredentialEmail(student.name, student.email, password, "Student", tenant?.name || "SkolMatrixa"),
    }).catch(console.error);

    await logAudit({
      tenantId,
      userId: user.id,
      action: "STUDENT_CREDENTIALS_CREATED",
      entityType: "Student",
      entityId: studentId,
      details: { studentName: student.name, email: student.email },
    });

    revalidatePath("/dashboard/students");
    return {
      success: true,
      data: { email: student.email, password },
      message: "Login credentials created and emailed to the student",
    };
  } catch (error) {
    console.error("Create student credentials error:", error);
    return { success: false, error: "Failed to create credentials" };
  }
}

// ==================== Create Parent Login Credentials ====================

export async function createParentCredentials(studentId: string) {
  const user = await requireStudentManager();
  const tenantId = user.tenantId!;

  try {
    const student = await prisma.student.findFirst({
      where: { id: studentId, tenantId },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    if (student.parentUserId) {
      return { success: false, error: "Parent already has a login account" };
    }

    if (!student.guardianEmail) {
      return { success: false, error: "Guardian email is required to create parent login credentials" };
    }

    // Check if parent email already has an account
    const existingParent = await prisma.user.findFirst({
      where: { email: student.guardianEmail, tenantId },
    });

    if (existingParent) {
      // Link existing parent account if it has PARENT role
      if (existingParent.role === "PARENT") {
        await prisma.student.update({
          where: { id: studentId },
          data: { parentUserId: existingParent.id },
        });
        revalidatePath("/dashboard/students");
        return {
          success: true,
          message: "Linked to existing parent account",
        };
      }
      return { success: false, error: "This email is already associated with another account" };
    }

    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 12);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    await prisma.$transaction(async (tx) => {
      const parentUser = await tx.user.create({
        data: {
          tenantId,
          email: student.guardianEmail!,
          passwordHash,
          name: student.guardianName || "Parent",
          phone: student.guardianPhone || null,
          role: "PARENT",
          isActive: true,
        },
      });

      await tx.student.update({
        where: { id: studentId },
        data: { parentUserId: parentUser.id },
      });

      return parentUser;
    });

    // Send credentials email (non-blocking)
    sendEmail({
      to: student.guardianEmail,
      subject: `Welcome to ${tenant?.name || "SkolMatrixa"} - Parent Login Created`,
      html: buildCredentialEmail(
        student.guardianName || "Parent",
        student.guardianEmail,
        password,
        "Parent",
        tenant?.name || "SkolMatrixa"
      ),
    }).catch(console.error);

    await logAudit({
      tenantId,
      userId: user.id,
      action: "PARENT_CREDENTIALS_CREATED",
      entityType: "Student",
      entityId: studentId,
      details: { studentName: student.name, parentEmail: student.guardianEmail },
    });

    revalidatePath("/dashboard/students");
    return {
      success: true,
      data: { email: student.guardianEmail, password },
      message: "Parent login credentials created and emailed",
    };
  } catch (error) {
    console.error("Create parent credentials error:", error);
    return { success: false, error: "Failed to create parent credentials" };
  }
}

// ==================== Bulk Create Credentials for All Students ====================

export async function bulkCreateStudentCredentials(studentIds: string[]) {
  const user = await requireStudentManager();
  const tenantId = user.tenantId!;

  try {
    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        tenantId,
        userId: null, // Only students without accounts
        email: { not: null },
      },
    });

    if (students.length === 0) {
      return { success: false, error: "No eligible students found (all either already have accounts or have no email)" };
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    const results: Array<{ name: string; email: string; password: string }> = [];

    for (const student of students) {
      if (!student.email) continue;

      const existingUser = await prisma.user.findFirst({
        where: { email: student.email, tenantId },
      });
      if (existingUser) continue;

      const password = generatePassword();
      const passwordHash = await bcrypt.hash(password, 12);

      await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            tenantId,
            email: student.email!,
            passwordHash,
            name: student.name,
            phone: student.phone || null,
            role: "STUDENT",
            isActive: true,
          },
        });

        await tx.student.update({
          where: { id: student.id },
          data: { userId: newUser.id },
        });
      });

      results.push({ name: student.name, email: student.email, password });

      // Send credential email (non-blocking)
      sendEmail({
        to: student.email,
        subject: `Welcome to ${tenant?.name || "SkolMatrixa"} - Student Login Created`,
        html: buildCredentialEmail(student.name, student.email, password, "Student", tenant?.name || "SkolMatrixa"),
      }).catch(console.error);
    }

    await logAudit({
      tenantId,
      userId: user.id,
      action: "BULK_STUDENT_CREDENTIALS_CREATED",
      entityType: "Student",
      details: { count: results.length },
    });

    revalidatePath("/dashboard/students");
    return {
      success: true,
      data: { created: results.length, credentials: results },
      message: `Created login credentials for ${results.length} students`,
    };
  } catch (error) {
    console.error("Bulk create credentials error:", error);
    return { success: false, error: "Failed to create credentials" };
  }
}

// ==================== Helpers ====================

function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const special = "!@#$%";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  password += special.charAt(Math.floor(Math.random() * special.length));
  password += Math.floor(Math.random() * 10);
  return password;
}

function buildCredentialEmail(
  name: string,
  email: string,
  password: string,
  role: string,
  tenantName: string
): string {
  return `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to ${tenantName}!</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #374151;">Hi <strong>${name}</strong>,</p>
        <p style="color: #6b7280;">Your ${role.toLowerCase()} account has been created. Here are your login credentials:</p>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0; color: #374151;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 4px 0; color: #374151;"><strong>Password:</strong> ${password}</p>
        </div>
        <p style="color: #ef4444; font-size: 14px;">Please change your password after your first login.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
           style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
          Log In Now
        </a>
      </div>
    </div>
  `;
}
