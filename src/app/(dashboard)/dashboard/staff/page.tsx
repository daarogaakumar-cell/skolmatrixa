import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStaffList, getStaffDepartments } from "@/actions/staff";
import { getTenantProfile } from "@/actions/academic";
import { StaffListClient } from "@/components/dashboard/staff-list-client";

export default async function StaffPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [staffResult, departments, tenant] = await Promise.all([
    getStaffList(),
    getStaffDepartments(),
    getTenantProfile(),
  ]);

  return (
    <StaffListClient
      initialStaff={(staffResult as any).data || []}
      initialPagination={(staffResult as any).pagination || { page: 1, pageSize: 25, total: 0, totalPages: 0 }}
      tenantType={tenant?.type || "SCHOOL"}
      departments={departments as string[]}
    />
  );
}
