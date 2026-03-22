"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "./audit";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { sendEmail, buildStaffCredentialEmailHtml } from "@/lib/email";

async function requireStaffManager() {
  const session = await auth();
  if (!session?.user || !session.user.tenantId) {
    throw new Error("Unauthorized");
  }
  if (!["TENANT_ADMIN", "VICE_ADMIN"].includes(session.user.role)) {
    throw new Error("Insufficient permissions");
  }
  return session.user;
}

// ==================== Staff List ====================

export async function getStaffList({
  page = 1,
  pageSize = 25,
  search,
  role,
  department,
  status,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  department?: string;
  status?: string;
} = {}) {
  const user = await requireStaffManager();
  const tenantId = user.tenantId!;

  const where: Record<string, unknown> = {
    tenantId,
    role: { in: ["TEACHER", "VICE_ADMIN", "ACCOUNTANT", "LIBRARIAN"] },
  };

  if (role && role !== "ALL") {
    where.role = role;
  }

  if (status === "ACTIVE") {
    where.isActive = true;
  } else if (status === "INACTIVE") {
    where.isActive = false;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  // Department filter via staffProfile
  const staffProfileWhere: Record<string, unknown> = {};
  if (department && department !== "ALL") {
    staffProfileWhere.department = department;
  }

  if (Object.keys(staffProfileWhere).length > 0) {
    where.staffProfile = staffProfileWhere;
  }

  const [staff, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        staffProfile: true,
        classTeacher: {
          select: { id: true, name: true, section: true },
        },
        batchFaculty: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    success: true,
    data: staff,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// ==================== Get Single Staff ====================

export async function getStaffDetail(staffId: string) {
  const user = await requireStaffManager();
  const tenantId = user.tenantId!;

  const staff = await prisma.user.findFirst({
    where: { id: staffId, tenantId },
    include: {
      staffProfile: true,
      classTeacher: {
        select: { id: true, name: true, section: true, _count: { select: { students: true } } },
      },
      batchFaculty: {
        select: { id: true, name: true, _count: { select: { students: true } } },
      },
    },
  });

  if (!staff) {
    return { success: false, error: "Staff member not found" };
  }

  return { success: true, data: staff };
}

// ==================== Create Staff ====================

export async function createStaff(data: {
  name: string;
  email: string;
  phone?: string;
  role: "VICE_ADMIN" | "TEACHER" | "ACCOUNTANT" | "LIBRARIAN";
  password: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  qualification?: string;
  joiningDate?: string;
  salary?: number;
  avatarUrl?: string;
}) {
  const user = await requireStaffManager();
  const tenantId = user.tenantId!;

  try {
    // Check tenant staff limit
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { maxStaff: true, name: true },
    });

    const currentStaffCount = await prisma.user.count({
      where: {
        tenantId,
        role: { in: ["TEACHER", "VICE_ADMIN", "ACCOUNTANT", "LIBRARIAN"] },
        isActive: true,
      },
    });

    if (tenant && currentStaffCount >= tenant.maxStaff) {
      return {
        success: false,
        error: `Staff limit reached (${tenant.maxStaff}). Please upgrade your plan.`,
      };
    }

    // Check email uniqueness within tenant
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email, tenantId },
    });

    if (existingUser) {
      return { success: false, error: "A user with this email already exists in your institution" };
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const result = await prisma.$transaction(async (tx) => {
      // Create user account
      const newUser = await tx.user.create({
        data: {
          tenantId,
          email: data.email,
          passwordHash,
          name: data.name,
          phone: data.phone || null,
          avatarUrl: data.avatarUrl || null,
          role: data.role,
          isActive: true,
        },
      });

      // Create staff profile
      const staffProfile = await tx.staffProfile.create({
        data: {
          tenantId,
          userId: newUser.id,
          employeeId: data.employeeId || null,
          designation: data.designation || null,
          department: data.department || null,
          qualification: data.qualification || null,
          joiningDate: data.joiningDate ? new Date(data.joiningDate) : null,
          salary: data.salary || null,
        },
      });

      return { user: newUser, staffProfile };
    });

    // Send invite email (non-blocking)
    sendEmail({
      to: data.email,
      subject: `Welcome to ${tenant?.name || "SkolMatrixa"} - Your Account Details`,
      html: buildStaffCredentialEmailHtml(
        data.name,
        data.email,
        data.password,
        data.role,
        tenant?.name || "SkolMatrixa"
      ),
    }).catch((err) => console.error("Failed to send staff invite email:", err));

    await logAudit({
      tenantId,
      userId: user.id,
      action: "STAFF_CREATED",
      entityType: "User",
      entityId: result.user.id,
      details: { name: data.name, email: data.email, role: data.role },
    });

    revalidatePath("/dashboard/staff");
    return { success: true, data: result };
  } catch (error) {
    console.error("Create staff error:", error);
    return { success: false, error: "Failed to create staff member" };
  }
}

// ==================== Update Staff ====================

export async function updateStaff(
  staffId: string,
  data: {
    name?: string;
    phone?: string;
    role?: "VICE_ADMIN" | "TEACHER" | "ACCOUNTANT" | "LIBRARIAN";
    avatarUrl?: string;
    employeeId?: string;
    designation?: string;
    department?: string;
    qualification?: string;
    joiningDate?: string;
    salary?: number;
  }
) {
  const user = await requireStaffManager();
  const tenantId = user.tenantId!;

  try {
    const existingStaff = await prisma.user.findFirst({
      where: { id: staffId, tenantId },
      include: { staffProfile: true },
    });

    if (!existingStaff) {
      return { success: false, error: "Staff member not found" };
    }

    await prisma.$transaction(async (tx) => {
      // Update user record
      await tx.user.update({
        where: { id: staffId },
        data: {
          name: data.name,
          phone: data.phone,
          role: data.role,
          avatarUrl: data.avatarUrl,
        },
      });

      // Update staff profile
      if (existingStaff.staffProfile) {
        await tx.staffProfile.update({
          where: { id: existingStaff.staffProfile.id },
          data: {
            employeeId: data.employeeId,
            designation: data.designation,
            department: data.department,
            qualification: data.qualification,
            joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
            salary: data.salary,
          },
        });
      }
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "STAFF_UPDATED",
      entityType: "User",
      entityId: staffId,
      details: data,
    });

    revalidatePath("/dashboard/staff");
    revalidatePath(`/dashboard/staff/${staffId}`);
    return { success: true };
  } catch (error) {
    console.error("Update staff error:", error);
    return { success: false, error: "Failed to update staff member" };
  }
}

// ==================== Deactivate / Activate Staff ====================

export async function toggleStaffStatus(staffId: string) {
  const user = await requireStaffManager();
  const tenantId = user.tenantId!;

  try {
    const staff = await prisma.user.findFirst({
      where: { id: staffId, tenantId },
    });

    if (!staff) {
      return { success: false, error: "Staff member not found" };
    }

    // Prevent deactivating yourself
    if (staff.id === user.id) {
      return { success: false, error: "You cannot deactivate your own account" };
    }

    const newStatus = !staff.isActive;
    await prisma.user.update({
      where: { id: staffId },
      data: { isActive: newStatus },
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: newStatus ? "STAFF_ACTIVATED" : "STAFF_DEACTIVATED",
      entityType: "User",
      entityId: staffId,
      details: { name: staff.name, email: staff.email },
    });

    revalidatePath("/dashboard/staff");
    return { success: true, isActive: newStatus };
  } catch (error) {
    console.error("Toggle staff status error:", error);
    return { success: false, error: "Failed to update staff status" };
  }
}

// ==================== Reset Staff Password ====================

export async function resetStaffPassword(staffId: string) {
  const user = await requireStaffManager();
  const tenantId = user.tenantId!;

  try {
    const staff = await prisma.user.findFirst({
      where: { id: staffId, tenantId },
      include: { tenant: { select: { name: true } } },
    });

    if (!staff) {
      return { success: false, error: "Staff member not found" };
    }

    // Generate random password
    const newPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: staffId },
      data: { passwordHash },
    });

    // Send email with new password
    sendEmail({
      to: staff.email,
      subject: `Password Reset - ${staff.tenant?.name || "SkolMatrixa"}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1f2937;">Password Reset</h2>
          <p>Hi <strong>${staff.name}</strong>,</p>
          <p>Your password has been reset by an administrator. Here is your new temporary password:</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; font-family: monospace; font-size: 18px; letter-spacing: 1px;"><strong>${newPassword}</strong></p>
          </div>
          <p style="color: #ef4444;">Please change this password immediately after logging in.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
             style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px;">
            Log In
          </a>
        </div>
      `,
    }).catch((err) => console.error("Failed to send password reset email:", err));

    await logAudit({
      tenantId,
      userId: user.id,
      action: "STAFF_PASSWORD_RESET",
      entityType: "User",
      entityId: staffId,
      details: { name: staff.name },
    });

    revalidatePath("/dashboard/staff");
    return { success: true, message: "Password reset. New credentials sent via email." };
  } catch (error) {
    console.error("Reset password error:", error);
    return { success: false, error: "Failed to reset password" };
  }
}

// ==================== Assign Staff to Class/Batch ====================

export async function assignStaffToClass(staffId: string, classId: string) {
  const user = await requireStaffManager();
  const tenantId = user.tenantId!;

  try {
    await prisma.class.update({
      where: { id: classId },
      data: { classTeacherId: staffId },
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "STAFF_ASSIGNED_CLASS",
      entityType: "Class",
      entityId: classId,
      details: { staffId },
    });

    revalidatePath("/dashboard/staff");
    revalidatePath("/dashboard/classes");
    return { success: true };
  } catch (error) {
    console.error("Assign staff to class error:", error);
    return { success: false, error: "Failed to assign staff to class" };
  }
}

export async function removeStaffFromClass(classId: string) {
  const user = await requireStaffManager();
  const tenantId = user.tenantId!;

  try {
    await prisma.class.update({
      where: { id: classId },
      data: { classTeacherId: null },
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "STAFF_REMOVED_CLASS",
      entityType: "Class",
      entityId: classId,
    });

    revalidatePath("/dashboard/staff");
    revalidatePath("/dashboard/classes");
    return { success: true };
  } catch (error) {
    console.error("Remove staff from class error:", error);
    return { success: false, error: "Failed to remove staff from class" };
  }
}

export async function assignStaffToBatch(staffId: string, batchId: string) {
  const user = await requireStaffManager();
  const tenantId = user.tenantId!;

  try {
    await prisma.batch.update({
      where: { id: batchId },
      data: { facultyId: staffId },
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "STAFF_ASSIGNED_BATCH",
      entityType: "Batch",
      entityId: batchId,
      details: { staffId },
    });

    revalidatePath("/dashboard/staff");
    revalidatePath("/dashboard/batches");
    return { success: true };
  } catch (error) {
    console.error("Assign staff to batch error:", error);
    return { success: false, error: "Failed to assign staff to batch" };
  }
}

// ==================== Get Departments (for filters) ====================

export async function getStaffDepartments() {
  const user = await requireStaffManager();
  const tenantId = user.tenantId!;

  const profiles = await prisma.staffProfile.findMany({
    where: { tenantId, department: { not: null } },
    select: { department: true },
    distinct: ["department"],
  });

  return profiles.map((p) => p.department).filter(Boolean) as string[];
}

// ==================== Get Teachers (for assignment dropdowns) ====================

export async function getTeachers() {
  const session = await auth();
  if (!session?.user || !session.user.tenantId) {
    throw new Error("Unauthorized");
  }

  return prisma.user.findMany({
    where: {
      tenantId: session.user.tenantId,
      role: { in: ["TEACHER", "VICE_ADMIN"] },
      isActive: true,
    },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
}

// ==================== Helper ====================

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const special = "!@#$%";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Add a special char and a digit to satisfy most policies
  password += special.charAt(Math.floor(Math.random() * special.length));
  password += Math.floor(Math.random() * 10);
  return password;
}
