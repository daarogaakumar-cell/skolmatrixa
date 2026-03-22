import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getClasses,
  getBatches,
  getAcademicYears,
  getTenantProfile,
} from "@/actions/academic";
import { FeeStructureClient } from "@/components/dashboard/fee-structure-client";

export default async function FeeStructurePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (
    !["TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"].includes(session.user.role)
  ) {
    redirect("/dashboard");
  }

  const [classesRaw, batchesRaw, yearsRaw, tenant] =
    await Promise.all([
      getClasses(),
      getBatches(),
      getAcademicYears(),
      getTenantProfile(),
    ]);

  const classes = (classesRaw || []).map((c) => ({
    id: c.id,
    name: c.name,
    section: c.section ?? null,
  }));
  const batches = (batchesRaw || []).map((b) => ({
    id: b.id,
    name: b.name,
  }));
  const academicYears = (yearsRaw || []).map((y) => ({
    id: y.id,
    name: y.name,
    isCurrent: y.isCurrent,
  }));

  return (
    <FeeStructureClient
      tenantType={tenant?.type || "SCHOOL"}
      classes={classes}
      batches={batches}
      academicYears={academicYears}
    />
  );
}
