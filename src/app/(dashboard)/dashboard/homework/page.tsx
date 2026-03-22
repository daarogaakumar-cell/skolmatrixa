import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HomeworkListClient } from "@/components/dashboard/homework-list-client";
import { MyHomeworkClient } from "@/components/dashboard/my-homework-client";

export default async function HomeworkPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { type: true },
  });

  // Students and parents see their homework view
  if (["STUDENT", "PARENT"].includes(session.user.role)) {
    return <MyHomeworkClient />;
  }

  return (
    <HomeworkListClient
      tenantType={tenant?.type || "SCHOOL"}
      userRole={session.user.role}
    />
  );
}
