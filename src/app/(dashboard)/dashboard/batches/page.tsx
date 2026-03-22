import { getBatches, getAcademicYears } from "@/actions/academic";
import { BatchesClient } from "@/components/dashboard/batches-client";

export default async function BatchesPage() {
  const [batches, academicYears] = await Promise.all([
    getBatches(),
    getAcademicYears(),
  ]);

  const currentYear = academicYears.find((y) => y.isCurrent);

  return (
    <BatchesClient
      initialBatches={batches as any}
      currentAcademicYear={currentYear?.name || "Not set"}
    />
  );
}
