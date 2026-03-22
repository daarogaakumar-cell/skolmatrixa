import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getNextAdmissionNo, getClassesForDropdown, getBatchesForDropdown } from "@/actions/students";
import { getTenantProfile } from "@/actions/academic";
import { AddStudentClient } from "@/components/dashboard/add-student-client";

export default async function NewStudentPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!["TENANT_ADMIN", "VICE_ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const [nextAdmNo, classes, batches, tenant] = await Promise.all([
    getNextAdmissionNo(),
    getClassesForDropdown(),
    getBatchesForDropdown(),
    getTenantProfile(),
  ]);

  return (
    <AddStudentClient
      tenantType={tenant?.type || "SCHOOL"}
      classes={(classes as any[]).map((c: any) => ({ id: c.id, name: c.name, section: c.section }))}
      batches={(batches as any[]).map((b: any) => ({ id: b.id, name: b.name }))}
      nextAdmissionNo={nextAdmNo}
    />
  );
}
