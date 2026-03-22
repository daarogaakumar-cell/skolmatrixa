import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TimetableViewClient } from "@/components/dashboard/timetable-view-client";

export default async function TimetablePage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { type: true },
  });

  if (!tenant) redirect("/login");

  return (
    <TimetableViewClient
      tenantType={tenant.type}
      userRole={session.user.role}
    />
  );
}
