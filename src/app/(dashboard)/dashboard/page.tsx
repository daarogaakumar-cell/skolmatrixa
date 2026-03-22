import { getTenantDashboardStats, getTenantProfile } from "@/actions/academic";
import { getTodayAttendanceStats } from "@/actions/attendance";
import { getTodaySchedule } from "@/actions/timetable";
import { auth } from "@/lib/auth";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { StudentDashboardClient } from "@/components/dashboard/student-dashboard-client";
import { LibraryDashboardClient } from "@/components/dashboard/library-dashboard-client";
import { TeacherDashboardClient } from "@/components/dashboard/teacher-dashboard-client";
import { AccountantDashboardClient } from "@/components/dashboard/accountant-dashboard-client";
import { LibrarianDashboardClient } from "@/components/dashboard/librarian-dashboard-client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // If setup not completed, redirect admins to setup wizard
  if (session.user.tenantId && ["TENANT_ADMIN", "VICE_ADMIN"].includes(session.user.role)) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { setupCompleted: true },
    });
    if (tenant && !tenant.setupCompleted) {
      redirect("/dashboard/setup");
    }
  }

  const role = session.user.role;

  // Route 1: Library tenant dashboard (standalone library management)
  if (session.user.tenantType === "LIBRARY" && ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"].includes(role)) {
    return <LibraryDashboardClient />;
  }

  // Route 2: Student/Parent portal dashboard
  if (["STUDENT", "PARENT"].includes(role)) {
    return (
      <StudentDashboardClient
        userName={session.user.name || "User"}
        userRole={role}
      />
    );
  }

  // Route 3: Accountant dashboard (fee-focused)
  if (role === "ACCOUNTANT") {
    const tenant = await getTenantProfile();
    return (
      <AccountantDashboardClient
        tenantName={tenant?.name || ""}
        tenantType={tenant?.type || "SCHOOL"}
        userName={session.user.name || "User"}
      />
    );
  }

  // Route 4: Librarian dashboard for schools/coaching (library section only)
  if (role === "LIBRARIAN" && session.user.tenantType !== "LIBRARY") {
    const tenant = await getTenantProfile();
    return (
      <LibrarianDashboardClient
        tenantName={tenant?.name || ""}
        userName={session.user.name || "User"}
      />
    );
  }

  // Fetch common data for admin/teacher dashboards
  const [stats, tenant, attendanceStats, todaySchedule] = await Promise.all([
    getTenantDashboardStats(),
    getTenantProfile(),
    getTodayAttendanceStats(),
    getTodaySchedule(),
  ]);

  // Route 5: Teacher dashboard (class/attendance focused)
  if (role === "TEACHER") {
    return (
      <TeacherDashboardClient
        stats={stats}
        tenantName={tenant?.name || ""}
        tenantType={tenant?.type || "SCHOOL"}
        userName={session.user.name || "User"}
        attendanceStats={attendanceStats.success ? attendanceStats.data : null}
        todaySchedule={todaySchedule.success ? todaySchedule.data : null}
      />
    );
  }

  // Route 6: Admin dashboard (full access - TENANT_ADMIN, VICE_ADMIN)
  return (
    <DashboardClient
      stats={stats}
      tenantName={tenant?.name || ""}
      tenantType={tenant?.type || "SCHOOL"}
      userName={session.user.name || "User"}
      userRole={role}
      attendanceStats={attendanceStats.success ? attendanceStats.data : null}
      todaySchedule={todaySchedule.success ? todaySchedule.data : null}
    />
  );
}
