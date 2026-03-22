import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MyFeesClient } from "@/components/dashboard/my-fees-client";

export default async function MyFeesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Only students/parents can view their own fees
  if (!["STUDENT", "PARENT"].includes(session.user.role)) {
    redirect("/dashboard/fees");
  }

  return <MyFeesClient />;
}
