import { getClasses, getAcademicYears } from "@/actions/academic";
import { ClassesClient } from "@/components/dashboard/classes-client";

export default async function ClassesPage() {
  const [classes, academicYears] = await Promise.all([
    getClasses(),
    getAcademicYears(),
  ]);

  const currentYear = academicYears.find((y) => y.isCurrent);

  return (
    <ClassesClient
      initialClasses={classes as any}
      currentAcademicYear={currentYear?.name || "Not set"}
    />
  );
}
