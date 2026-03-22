import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getClassesForDropdown, getBatchesForDropdown } from "@/actions/students";
import { getTenantProfile } from "@/actions/academic";
import { CSVImportClient } from "@/components/dashboard/csv-import-client";

export default async function ImportStudentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!["TENANT_ADMIN", "VICE_ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const [classes, batches, tenant] = await Promise.all([
    getClassesForDropdown(),
    getBatchesForDropdown(),
    getTenantProfile(),
  ]);

  return (
    <CSVImportClient
      tenantType={tenant?.type || "SCHOOL"}
      classes={(classes as any[]).map((c: any) => ({ id: c.id, name: c.name, section: c.section }))}
      batches={(batches as any[]).map((b: any) => ({ id: b.id, name: b.name }))}
    />
  );
}
