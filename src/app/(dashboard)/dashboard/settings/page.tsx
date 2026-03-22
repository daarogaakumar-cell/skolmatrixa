import { getTenantProfile, getAcademicYears } from "@/actions/academic";
import { SettingsClient } from "@/components/dashboard/settings-client";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const [tenant, academicYears] = await Promise.all([
    getTenantProfile(),
    getAcademicYears(),
  ]);

  if (!tenant) redirect("/login");

  return (
    <SettingsClient
      tenant={tenant as any}
      academicYears={academicYears as any}
    />
  );
}
