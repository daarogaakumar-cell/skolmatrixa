"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "./audit";
import { sendWelcomeEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

// ==================== Dashboard Stats ====================

export async function getSuperAdminStats() {
  const user = await requireSuperAdmin();

  const [
    totalTenants,
    activeTenants,
    pendingTenants,
    suspendedTenants,
    totalStudents,
    totalStaff,
    recentTenants,
    monthlyRegistrations,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.tenant.count({ where: { status: "PENDING" } }),
    prisma.tenant.count({ where: { status: "SUSPENDED" } }),
    prisma.student.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { role: { in: ["TEACHER", "TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"] }, isActive: true } }),
    prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        status: true,
        email: true,
        createdAt: true,
        _count: { select: { students: true, users: true } },
      },
    }),
    getMonthlyRegistrations(),
  ]);

  return {
    totalTenants,
    activeTenants,
    pendingTenants,
    suspendedTenants,
    totalStudents,
    totalStaff,
    recentTenants,
    monthlyRegistrations,
  };
}

async function getMonthlyRegistrations() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const tenants = await prisma.tenant.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
  });

  const months: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months[key] = 0;
  }

  for (const t of tenants) {
    const key = `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (key in months) months[key]++;
  }

  return Object.entries(months).map(([month, count]) => ({
    month,
    label: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    count,
  }));
}

// ==================== Tenant CRUD ====================

export async function getTenants({
  page = 1,
  pageSize = 20,
  status,
  type,
  search,
}: {
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
  search?: string;
} = {}) {
  await requireSuperAdmin();

  const where: Record<string, unknown> = {};
  if (status && status !== "ALL") where.status = status;
  if (type && type !== "ALL") where.type = type;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      include: {
        _count: {
          select: {
            students: true,
            users: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.tenant.count({ where }),
  ]);

  return {
    tenants,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getTenantById(id: string) {
  await requireSuperAdmin();

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      _count: { select: { students: true, users: true, classes: true, batches: true } },
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!tenant) return null;

  // Get recent audit logs for this tenant
  const recentLogs = await prisma.auditLog.findMany({
    where: { tenantId: id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return { ...tenant, recentLogs };
}

export async function approveTenant(id: string) {
  const user = await requireSuperAdmin();

  const tenant = await prisma.tenant.update({
    where: { id },
    data: { status: "ACTIVE" },
    include: {
      users: {
        where: { role: "TENANT_ADMIN" },
        select: { email: true, name: true },
      },
    },
  });

  await logAudit({
    userId: user.id,
    tenantId: id,
    action: "APPROVE_TENANT",
    entityType: "Tenant",
    entityId: id,
    details: { tenantName: tenant.name },
  });

  // Send welcome email to tenant admin
  const admin = tenant.users[0];
  if (admin) {
    await sendWelcomeEmail(admin.email, admin.name, tenant.name);
  }

  revalidatePath("/super-admin");
  return { success: true, message: `${tenant.name} has been approved` };
}

export async function suspendTenant(id: string) {
  const user = await requireSuperAdmin();

  const tenant = await prisma.tenant.update({
    where: { id },
    data: { status: "SUSPENDED" },
  });

  await logAudit({
    userId: user.id,
    tenantId: id,
    action: "SUSPEND_TENANT",
    entityType: "Tenant",
    entityId: id,
    details: { tenantName: tenant.name },
  });

  revalidatePath("/super-admin");
  return { success: true, message: `${tenant.name} has been suspended` };
}

export async function activateTenant(id: string) {
  const user = await requireSuperAdmin();

  const tenant = await prisma.tenant.update({
    where: { id },
    data: { status: "ACTIVE" },
  });

  await logAudit({
    userId: user.id,
    tenantId: id,
    action: "ACTIVATE_TENANT",
    entityType: "Tenant",
    entityId: id,
    details: { tenantName: tenant.name },
  });

  revalidatePath("/super-admin");
  return { success: true, message: `${tenant.name} has been activated` };
}

export async function deleteTenant(id: string) {
  const user = await requireSuperAdmin();

  const tenant = await prisma.tenant.findUnique({ where: { id }, select: { name: true } });
  if (!tenant) return { success: false, error: "Tenant not found" };

  await prisma.tenant.delete({ where: { id } });

  await logAudit({
    userId: user.id,
    action: "DELETE_TENANT",
    entityType: "Tenant",
    entityId: id,
    details: { tenantName: tenant.name },
  });

  revalidatePath("/super-admin");
  return { success: true, message: `${tenant.name} has been deleted` };
}

export async function updateTenantPlan(id: string, plan: string) {
  const user = await requireSuperAdmin();

  const planData = await prisma.subscriptionPlan.findUnique({ where: { name: plan } });
  if (!planData) return { success: false, error: "Plan not found" };

  const tenant = await prisma.tenant.update({
    where: { id },
    data: {
      subscriptionPlan: plan,
      maxStudents: planData.maxStudents,
      maxStaff: planData.maxStaff,
    },
  });

  await logAudit({
    userId: user.id,
    tenantId: id,
    action: "UPDATE_TENANT_PLAN",
    entityType: "Tenant",
    entityId: id,
    details: { tenantName: tenant.name, plan },
  });

  revalidatePath("/super-admin");
  return { success: true, message: `Plan updated to ${plan}` };
}

// ==================== Subscription Plans ====================

export async function getSubscriptionPlans() {
  await requireSuperAdmin();
  return prisma.subscriptionPlan.findMany({ orderBy: { priceMonthly: "asc" } });
}

export async function createSubscriptionPlan(data: {
  name: string;
  maxStudents: number;
  maxStaff: number;
  maxStorageMb: number;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
}) {
  const user = await requireSuperAdmin();

  const plan = await prisma.subscriptionPlan.create({ data });

  await logAudit({
    userId: user.id,
    action: "CREATE_PLAN",
    entityType: "SubscriptionPlan",
    entityId: plan.id,
    details: { planName: plan.name },
  });

  revalidatePath("/super-admin/plans");
  return { success: true, plan };
}

export async function updateSubscriptionPlan(
  id: string,
  data: {
    name: string;
    maxStudents: number;
    maxStaff: number;
    maxStorageMb: number;
    priceMonthly: number;
    priceYearly: number;
    features: string[];
    isActive: boolean;
  }
) {
  const user = await requireSuperAdmin();

  const plan = await prisma.subscriptionPlan.update({ where: { id }, data });

  await logAudit({
    userId: user.id,
    action: "UPDATE_PLAN",
    entityType: "SubscriptionPlan",
    entityId: plan.id,
    details: { planName: plan.name },
  });

  revalidatePath("/super-admin/plans");
  return { success: true, plan };
}

export async function deleteSubscriptionPlan(id: string) {
  const user = await requireSuperAdmin();

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id }, select: { name: true } });
  if (!plan) return { success: false, error: "Plan not found" };

  await prisma.subscriptionPlan.delete({ where: { id } });

  await logAudit({
    userId: user.id,
    action: "DELETE_PLAN",
    entityType: "SubscriptionPlan",
    entityId: id,
    details: { planName: plan.name },
  });

  revalidatePath("/super-admin/plans");
  return { success: true };
}

// ==================== Global Settings ====================

export async function getGlobalSettings() {
  await requireSuperAdmin();

  const settings = await prisma.globalSetting.findMany();
  const obj: Record<string, unknown> = {};
  for (const s of settings) {
    obj[s.key] = s.value;
  }
  return obj;
}

export async function updateGlobalSettings(data: Record<string, unknown>) {
  const user = await requireSuperAdmin();

  for (const [key, value] of Object.entries(data)) {
    await prisma.globalSetting.upsert({
      where: { key },
      update: { value: value as never },
      create: { key, value: value as never },
    });
  }

  await logAudit({
    userId: user.id,
    action: "UPDATE_GLOBAL_SETTINGS",
    entityType: "GlobalSetting",
    details: data,
  });

  revalidatePath("/super-admin/settings");
  return { success: true };
}
