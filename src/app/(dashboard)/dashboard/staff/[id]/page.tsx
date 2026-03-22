import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getStaffDetail } from "@/actions/staff";
import { getTenantProfile } from "@/actions/academic";
import { getClasses, getBatches } from "@/actions/academic";
import { StaffDetailClient } from "@/components/dashboard/staff-detail-client";

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const [result, tenant, classes, batches] = await Promise.all([
    getStaffDetail(id),
    getTenantProfile(),
    getClasses(),
    getBatches(),
  ]);

  if (!result.success || !result.data) {
    notFound();
  }

  const staff = result.data as any;

  return (
    <StaffDetailClient
      staff={{
        ...staff,
        createdAt: staff.createdAt?.toISOString?.() || staff.createdAt,
        lastLoginAt: staff.lastLoginAt?.toISOString?.() || staff.lastLoginAt || null,
        staffProfile: staff.staffProfile
          ? {
              ...staff.staffProfile,
              joiningDate: staff.staffProfile.joiningDate?.toISOString?.() || staff.staffProfile.joiningDate || null,
            }
          : null,
      }}
      tenantType={tenant?.type || "SCHOOL"}
      availableClasses={(classes as any[]).map((c: any) => ({
        id: c.id,
        name: c.name,
        section: c.section,
      }))}
      availableBatches={(batches as any[]).map((b: any) => ({
        id: b.id,
        name: b.name,
      }))}
    />
  );
}
