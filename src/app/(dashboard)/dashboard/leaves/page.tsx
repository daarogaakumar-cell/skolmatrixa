import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LeavesClient } from "@/components/dashboard/leaves-client";

export default async function LeavesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <LeavesClient
      userRole={session.user.role}
      userId={session.user.id}
    />
  );
}
