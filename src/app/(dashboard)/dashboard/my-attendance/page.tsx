import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MyAttendanceClient } from "@/components/dashboard/my-attendance-client";

export default async function MyAttendancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!["STUDENT", "PARENT"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return <MyAttendanceClient userRole={session.user.role} />;
}
