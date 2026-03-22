"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "./audit";
import { revalidatePath } from "next/cache";

async function requireTenantAdmin() {
  const session = await auth();
  if (!session?.user || !session.user.tenantId) {
    throw new Error("Unauthorized");
  }
  if (!["TENANT_ADMIN", "VICE_ADMIN"].includes(session.user.role)) {
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

// ==================== Setup Wizard ====================

export async function completeSetup(data: {
  profile: {
    name: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    website?: string;
    logoUrl?: string;
    boardAffiliation?: string;   // school
    coachingType?: string;       // coaching
  };
  academicYear: {
    name: string;
    startDate: string;
    endDate: string;
  };
  classes?: Array<{
    name: string;
    section?: string;
    capacity: number;
  }>;
  batches?: Array<{
    name: string;
    description?: string;
    subject?: string;
    capacity: number;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    days?: string;
  }>;
  subjects: Array<{
    name: string;
    code?: string;
    classId?: string;
    batchId?: string;
  }>;
}) {
  const user = await requireTenantAdmin();
  const tenantId = user.tenantId!;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update tenant profile
      const settings: Record<string, string | undefined> = {};
      if (data.profile.boardAffiliation) settings.boardAffiliation = data.profile.boardAffiliation;
      if (data.profile.coachingType) settings.coachingType = data.profile.coachingType;

      const tenant = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          name: data.profile.name,
          phone: data.profile.phone || null,
          address: data.profile.address || null,
          city: data.profile.city || null,
          state: data.profile.state || null,
          pincode: data.profile.pincode || null,
          website: data.profile.website || null,
          logoUrl: data.profile.logoUrl || null,
          settings: settings,
          setupCompleted: true,
        },
      });

      // 2. Create academic year
      const academicYear = await tx.academicYear.create({
        data: {
          tenantId,
          name: data.academicYear.name,
          startDate: new Date(data.academicYear.startDate),
          endDate: new Date(data.academicYear.endDate),
          isCurrent: true,
        },
      });

      // 3. Create classes (school) or batches (coaching)
      const createdClasses: Array<{ id: string; name: string; section?: string | null }> = [];
      const createdBatches: Array<{ id: string; name: string }> = [];

      if (data.classes && data.classes.length > 0) {
        for (const cls of data.classes) {
          const created = await tx.class.create({
            data: {
              tenantId,
              academicYearId: academicYear.id,
              name: cls.name,
              section: cls.section || null,
              capacity: cls.capacity,
            },
          });
          createdClasses.push(created);
        }
      }

      if (data.batches && data.batches.length > 0) {
        for (const batch of data.batches) {
          const created = await tx.batch.create({
            data: {
              tenantId,
              academicYearId: academicYear.id,
              name: batch.name,
              description: batch.description || null,
              subject: batch.subject || null,
              capacity: batch.capacity,
              startDate: batch.startDate ? new Date(batch.startDate) : null,
              endDate: batch.endDate ? new Date(batch.endDate) : null,
              startTime: batch.startTime || null,
              endTime: batch.endTime || null,
              days: batch.days || null,
            },
          });
          createdBatches.push(created);
        }
      }

      // 4. Create subjects
      if (data.subjects && data.subjects.length > 0) {
        for (const subject of data.subjects) {
          await tx.subject.create({
            data: {
              tenantId,
              name: subject.name,
              code: subject.code || null,
              classId: subject.classId || null,
              batchId: subject.batchId || null,
            },
          });
        }
      }

      return { tenant, academicYear, classes: createdClasses, batches: createdBatches };
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "SETUP_COMPLETED",
      entityType: "Tenant",
      entityId: tenantId,
      details: { academicYear: result.academicYear.name },
    });

    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (error) {
    console.error("Setup error:", error);
    return { success: false, error: "Failed to complete setup" };
  }
}

// ==================== Library Setup ====================

export async function completeLibrarySetup(data: {
  profile: {
    name: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    website?: string;
    logoUrl?: string;
    libraryType?: string;
    openTime?: string;
    closeTime?: string;
    closedDays?: string;
    finePerDay?: number;
  };
  catalogSections: string[];
  membershipPlans: Array<{
    name: string;
    durationDays: number;
    fee: number;
    maxBooks: number;
  }>;
}) {
  const user = await requireTenantAdmin();
  const tenantId = user.tenantId!;

  try {
    const settings: Record<string, unknown> = {
      libraryType: data.profile.libraryType,
      openTime: data.profile.openTime,
      closeTime: data.profile.closeTime,
      closedDays: data.profile.closedDays,
      finePerDay: data.profile.finePerDay,
      catalogSections: data.catalogSections,
      membershipPlans: data.membershipPlans,
    };

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: data.profile.name,
        phone: data.profile.phone || null,
        address: data.profile.address || null,
        city: data.profile.city || null,
        state: data.profile.state || null,
        pincode: data.profile.pincode || null,
        website: data.profile.website || null,
        logoUrl: data.profile.logoUrl || null,
        settings: settings as never,
        setupCompleted: true,
      },
    });

    await logAudit({
      tenantId,
      userId: user.id,
      action: "SETUP_COMPLETED",
      entityType: "Tenant",
      entityId: tenantId,
      details: {
        type: "LIBRARY",
        sectionsCount: data.catalogSections.length,
        plansCount: data.membershipPlans.length,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Library setup error:", error);
    return { success: false, error: "Failed to complete library setup" };
  }
}

// ==================== Academic Year ====================

export async function getAcademicYears() {
  const user = await requireTenantUser();
  return prisma.academicYear.findMany({
    where: { tenantId: user.tenantId! },
    orderBy: { startDate: "desc" },
  });
}

export async function getCurrentAcademicYear() {
  const user = await requireTenantUser();
  return prisma.academicYear.findFirst({
    where: { tenantId: user.tenantId!, isCurrent: true },
  });
}

export async function createAcademicYear(data: {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}) {
  const user = await requireTenantAdmin();
  const tenantId = user.tenantId!;

  // Check for overlapping dates
  const overlap = await prisma.academicYear.findFirst({
    where: {
      tenantId,
      OR: [
        {
          startDate: { lte: new Date(data.endDate) },
          endDate: { gte: new Date(data.startDate) },
        },
      ],
    },
  });

  if (overlap) {
    return { success: false, error: "Academic year dates overlap with existing year" };
  }

  if (data.isCurrent) {
    await prisma.academicYear.updateMany({
      where: { tenantId, isCurrent: true },
      data: { isCurrent: false },
    });
  }

  const academicYear = await prisma.academicYear.create({
    data: {
      tenantId,
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isCurrent: data.isCurrent || false,
    },
  });

  await logAudit({
    tenantId,
    userId: user.id,
    action: "ACADEMIC_YEAR_CREATED",
    entityType: "AcademicYear",
    entityId: academicYear.id,
    details: { name: data.name },
  });

  revalidatePath("/dashboard");
  return { success: true, data: academicYear };
}

export async function setCurrentAcademicYear(id: string) {
  const user = await requireTenantAdmin();
  const tenantId = user.tenantId!;

  await prisma.academicYear.updateMany({
    where: { tenantId, isCurrent: true },
    data: { isCurrent: false },
  });

  await prisma.academicYear.update({
    where: { id },
    data: { isCurrent: true },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

// ==================== Classes ====================

export async function getClasses() {
  const user = await requireTenantUser();
  const tenantId = user.tenantId!;

  const currentYear = await prisma.academicYear.findFirst({
    where: { tenantId, isCurrent: true },
  });

  if (!currentYear) return [];

  return prisma.class.findMany({
    where: { tenantId, academicYearId: currentYear.id },
    include: {
      classTeacher: { select: { id: true, name: true } },
      _count: { select: { students: true, subjects: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createClass(data: {
  name: string;
  section?: string;
  capacity?: number;
  classTeacherId?: string;
}) {
  const user = await requireTenantAdmin();
  const tenantId = user.tenantId!;

  const currentYear = await prisma.academicYear.findFirst({
    where: { tenantId, isCurrent: true },
  });

  if (!currentYear) {
    return { success: false, error: "No active academic year. Create one first." };
  }

  const cls = await prisma.class.create({
    data: {
      tenantId,
      academicYearId: currentYear.id,
      name: data.name,
      section: data.section || null,
      classTeacherId: data.classTeacherId || null,
      capacity: data.capacity || 40,
    },
  });

  await logAudit({
    tenantId,
    userId: user.id,
    action: "CLASS_CREATED",
    entityType: "Class",
    entityId: cls.id,
    details: { name: data.name, section: data.section },
  });

  revalidatePath("/dashboard/classes");
  return { success: true, data: cls };
}

export async function updateClass(
  id: string,
  data: { name?: string; section?: string; capacity?: number; classTeacherId?: string }
) {
  const user = await requireTenantAdmin();

  const cls = await prisma.class.update({
    where: { id },
    data: {
      name: data.name,
      section: data.section,
      capacity: data.capacity,
      classTeacherId: data.classTeacherId || null,
    },
  });

  await logAudit({
    tenantId: user.tenantId!,
    userId: user.id,
    action: "CLASS_UPDATED",
    entityType: "Class",
    entityId: cls.id,
    details: data,
  });

  revalidatePath("/dashboard/classes");
  return { success: true, data: cls };
}

export async function deleteClass(id: string) {
  const user = await requireTenantAdmin();

  // Check if class has students
  const studentCount = await prisma.student.count({ where: { classId: id } });
  if (studentCount > 0) {
    return { success: false, error: `Cannot delete class with ${studentCount} students` };
  }

  await prisma.class.delete({ where: { id } });

  await logAudit({
    tenantId: user.tenantId!,
    userId: user.id,
    action: "CLASS_DELETED",
    entityType: "Class",
    entityId: id,
    details: {},
  });

  revalidatePath("/dashboard/classes");
  return { success: true };
}

// ==================== Batches ====================

export async function getBatches() {
  const user = await requireTenantUser();
  const tenantId = user.tenantId!;

  const currentYear = await prisma.academicYear.findFirst({
    where: { tenantId, isCurrent: true },
  });

  if (!currentYear) return [];

  return prisma.batch.findMany({
    where: { tenantId, academicYearId: currentYear.id },
    include: {
      faculty: { select: { id: true, name: true } },
      _count: { select: { students: true, subjects: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createBatch(data: {
  name: string;
  description?: string;
  subject?: string;
  capacity?: number;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  days?: string;
  facultyId?: string;
}) {
  const user = await requireTenantAdmin();
  const tenantId = user.tenantId!;

  const currentYear = await prisma.academicYear.findFirst({
    where: { tenantId, isCurrent: true },
  });

  if (!currentYear) {
    return { success: false, error: "No active academic year. Create one first." };
  }

  const batch = await prisma.batch.create({
    data: {
      tenantId,
      academicYearId: currentYear.id,
      name: data.name,
      description: data.description || null,
      subject: data.subject || null,
      capacity: data.capacity || 30,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      days: data.days || null,
      facultyId: data.facultyId || null,
    },
  });

  await logAudit({
    tenantId,
    userId: user.id,
    action: "BATCH_CREATED",
    entityType: "Batch",
    entityId: batch.id,
    details: { name: data.name },
  });

  revalidatePath("/dashboard/batches");
  return { success: true, data: batch };
}

export async function updateBatch(
  id: string,
  data: {
    name?: string;
    description?: string;
    subject?: string;
    capacity?: number;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    days?: string;
    facultyId?: string;
  }
) {
  const user = await requireTenantAdmin();

  const batch = await prisma.batch.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      subject: data.subject,
      capacity: data.capacity,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      startTime: data.startTime,
      endTime: data.endTime,
      days: data.days,
      facultyId: data.facultyId || null,
    },
  });

  await logAudit({
    tenantId: user.tenantId!,
    userId: user.id,
    action: "BATCH_UPDATED",
    entityType: "Batch",
    entityId: batch.id,
    details: data,
  });

  revalidatePath("/dashboard/batches");
  return { success: true, data: batch };
}

export async function deleteBatch(id: string) {
  const user = await requireTenantAdmin();

  const studentCount = await prisma.student.count({ where: { batchId: id } });
  if (studentCount > 0) {
    return { success: false, error: `Cannot delete batch with ${studentCount} students` };
  }

  await prisma.batch.delete({ where: { id } });

  await logAudit({
    tenantId: user.tenantId!,
    userId: user.id,
    action: "BATCH_DELETED",
    entityType: "Batch",
    entityId: id,
    details: {},
  });

  revalidatePath("/dashboard/batches");
  return { success: true };
}

// ==================== Subjects ====================

export async function getSubjects(classId?: string, batchId?: string) {
  const user = await requireTenantUser();
  const tenantId = user.tenantId!;

  return prisma.subject.findMany({
    where: {
      tenantId,
      ...(classId ? { classId } : {}),
      ...(batchId ? { batchId } : {}),
    },
    include: {
      class: { select: { id: true, name: true, section: true } },
      batch: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createSubject(data: {
  name: string;
  code?: string;
  classId?: string;
  batchId?: string;
}) {
  const user = await requireTenantAdmin();
  const tenantId = user.tenantId!;

  const subject = await prisma.subject.create({
    data: {
      tenantId,
      name: data.name,
      code: data.code || null,
      classId: data.classId || null,
      batchId: data.batchId || null,
    },
  });

  await logAudit({
    tenantId,
    userId: user.id,
    action: "SUBJECT_CREATED",
    entityType: "Subject",
    entityId: subject.id,
    details: { name: data.name, code: data.code },
  });

  revalidatePath("/dashboard/subjects");
  return { success: true, data: subject };
}

export async function updateSubject(id: string, data: { name?: string; code?: string }) {
  const user = await requireTenantAdmin();

  const subject = await prisma.subject.update({
    where: { id },
    data: { name: data.name, code: data.code },
  });

  await logAudit({
    tenantId: user.tenantId!,
    userId: user.id,
    action: "SUBJECT_UPDATED",
    entityType: "Subject",
    entityId: subject.id,
    details: data,
  });

  revalidatePath("/dashboard/subjects");
  return { success: true, data: subject };
}

export async function deleteSubject(id: string) {
  const user = await requireTenantAdmin();

  await prisma.subject.delete({ where: { id } });

  await logAudit({
    tenantId: user.tenantId!,
    userId: user.id,
    action: "SUBJECT_DELETED",
    entityType: "Subject",
    entityId: id,
    details: {},
  });

  revalidatePath("/dashboard/subjects");
  return { success: true };
}

export async function bulkCreateSubjects(
  subjects: Array<{ name: string; code?: string; classId?: string; batchId?: string }>
) {
  const user = await requireTenantAdmin();
  const tenantId = user.tenantId!;

  const created = await prisma.$transaction(
    subjects.map((s) =>
      prisma.subject.create({
        data: {
          tenantId,
          name: s.name,
          code: s.code || null,
          classId: s.classId || null,
          batchId: s.batchId || null,
        },
      })
    )
  );

  revalidatePath("/dashboard/subjects");
  return { success: true, data: created };
}

// ==================== Tenant Profile ====================

export async function updateTenantProfile(data: {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  website?: string;
  logoUrl?: string;
}) {
  const user = await requireTenantAdmin();
  const tenantId = user.tenantId!;

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name: data.name,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      website: data.website,
      logoUrl: data.logoUrl,
    },
  });

  await logAudit({
    tenantId,
    userId: user.id,
    action: "TENANT_PROFILE_UPDATED",
    entityType: "Tenant",
    entityId: tenantId,
    details: data,
  });

  revalidatePath("/dashboard");
  return { success: true, data: tenant };
}

export async function getTenantProfile() {
  const user = await requireTenantUser();
  return prisma.tenant.findUnique({
    where: { id: user.tenantId! },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
      logoUrl: true,
      website: true,
      status: true,
      subscriptionPlan: true,
      maxStudents: true,
      maxStaff: true,
      settings: true,
      setupCompleted: true,
    },
  });
}

// ==================== Dashboard Stats ====================

export async function getTenantDashboardStats() {
  const user = await requireTenantUser();
  const tenantId = user.tenantId!;

  const [
    totalStudents,
    totalStaff,
    totalClasses,
    totalBatches,
    currentYear,
  ] = await Promise.all([
    prisma.student.count({ where: { tenantId, status: "ACTIVE" } }),
    prisma.user.count({
      where: {
        tenantId,
        role: { in: ["TEACHER", "VICE_ADMIN", "ACCOUNTANT"] },
        isActive: true,
      },
    }),
    prisma.class.count({
      where: {
        tenantId,
        academicYear: { isCurrent: true },
      },
    }),
    prisma.batch.count({
      where: {
        tenantId,
        academicYear: { isCurrent: true },
      },
    }),
    prisma.academicYear.findFirst({
      where: { tenantId, isCurrent: true },
      select: { name: true },
    }),
  ]);

  return {
    totalStudents,
    totalStaff,
    totalClasses,
    totalBatches,
    currentAcademicYear: currentYear?.name || "Not set",
  };
}

export async function getTenantSetupStatus() {
  const user = await requireTenantUser();
  return prisma.tenant.findUnique({
    where: { id: user.tenantId! },
    select: { setupCompleted: true, type: true, name: true, settings: true },
  });
}
