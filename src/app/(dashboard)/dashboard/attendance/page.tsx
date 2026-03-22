import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AttendanceMarkClient } from "@/components/dashboard/attendance-mark-client";

export default async function AttendancePage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { type: true },
  });

  return (
    <AttendanceMarkClient
      tenantType={tenant?.type || "SCHOOL"}
      userRole={session.user.role}
    />
  );
}
