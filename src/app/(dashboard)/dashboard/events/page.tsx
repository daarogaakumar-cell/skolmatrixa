import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EventCalendarClient } from "@/components/dashboard/event-calendar-client";

export default async function EventsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <EventCalendarClient
      userRole={session.user.role}
    />
  );
}
