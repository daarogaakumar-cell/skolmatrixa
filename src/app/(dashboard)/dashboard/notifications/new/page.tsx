import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NotificationCreateClient } from "@/components/dashboard/notification-create-client";

export default async function NewNotificationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!["TENANT_ADMIN", "VICE_ADMIN"].includes(session.user.role)) {
    redirect("/dashboard/notifications");
  }

  return <NotificationCreateClient />;
}
