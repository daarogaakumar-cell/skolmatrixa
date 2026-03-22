import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HomeworkCreateClient } from "@/components/dashboard/homework-create-client";

export default async function NewHomeworkPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  if (!["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"].includes(session.user.role)) {
    redirect("/dashboard/homework");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { type: true },
  });

  return <HomeworkCreateClient tenantType={tenant?.type || "SCHOOL"} />;
}
