import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NotificationsClient } from "@/components/dashboard/notifications-client";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <NotificationsClient userRole={session.user.role} />;
}
