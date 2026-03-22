import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TimetableManageClient } from "@/components/dashboard/timetable-manage-client";

export default async function TimetableManagePage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { type: true },
  });

  if (!tenant) redirect("/login");

  return <TimetableManageClient tenantType={tenant.type} />;
}
