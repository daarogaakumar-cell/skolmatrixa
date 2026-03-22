import { getSubjects, getClasses, getBatches, getTenantProfile } from "@/actions/academic";
import { SubjectsClient } from "@/components/dashboard/subjects-client";

export default async function SubjectsPage() {
  const [subjects, classes, batches, tenant] = await Promise.all([
    getSubjects(),
    getClasses(),
    getBatches(),
    getTenantProfile(),
  ]);

  return (
    <SubjectsClient
      initialSubjects={subjects as any}
      tenantType={tenant?.type || "SCHOOL"}
      classes={(classes as any[]).map((c) => ({
        id: c.id,
        name: c.name,
        section: c.section,
      }))}
      batches={(batches as any[]).map((b) => ({
        id: b.id,
        name: b.name,
      }))}
    />
  );
}
