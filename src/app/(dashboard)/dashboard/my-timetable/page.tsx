import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MyTimetableClient } from "@/components/dashboard/my-timetable-client";

export default async function MyTimetablePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!["STUDENT", "PARENT"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return <MyTimetableClient userRole={session.user.role} />;
}
