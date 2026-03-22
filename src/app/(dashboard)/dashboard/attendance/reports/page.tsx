import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AttendanceReportsClient } from "@/components/dashboard/attendance-reports-client";

export default async function AttendanceReportsPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { type: true },
  });

  return (
    <AttendanceReportsClient tenantType={tenant?.type || "SCHOOL"} />
  );
}
