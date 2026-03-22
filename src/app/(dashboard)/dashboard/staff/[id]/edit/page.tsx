import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getStaffDetail } from "@/actions/staff";
import { EditStaffClient } from "@/components/dashboard/edit-staff-client";

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!["TENANT_ADMIN", "VICE_ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const result = await getStaffDetail(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const staff = result.data as any;

  return (
    <EditStaffClient
      staff={{
        id: staff.id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        avatarUrl: staff.avatarUrl,
        role: staff.role,
        staffProfile: staff.staffProfile
          ? {
              employeeId: staff.staffProfile.employeeId,
              designation: staff.staffProfile.designation,
              department: staff.staffProfile.department,
              qualification: staff.staffProfile.qualification,
              joiningDate: staff.staffProfile.joiningDate?.toISOString?.() || staff.staffProfile.joiningDate || null,
              salary: staff.staffProfile.salary,
            }
          : null,
      }}
    />
  );
}
