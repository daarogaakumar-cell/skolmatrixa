import { Suspense } from "react";
import { getSuperAdminStats } from "@/actions/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, GraduationCap, Clock, CheckCircle2, XCircle } from "lucide-react";
import { RegistrationChart } from "@/components/super-admin/registration-chart";
import { RecentTenantsTable } from "@/components/super-admin/recent-tenants-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function SuperAdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and recent activity</p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  const stats = await getSuperAdminStats();

  return (
    <>
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Tenants" value={stats.totalTenants} icon={Building2} />
        <StatsCard title="Active" value={stats.activeTenants} icon={CheckCircle2} variant="success" />
        <StatsCard title="Pending" value={stats.pendingTenants} icon={Clock} variant="warning" />
        <StatsCard title="Suspended" value={stats.suspendedTenants} icon={XCircle} variant="destructive" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatsCard title="Total Students" value={stats.totalStudents} icon={GraduationCap} />
        <StatsCard title="Total Staff" value={stats.totalStaff} icon={Users} />
      </div>

      {/* Chart + Recent */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registrations (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <RegistrationChart data={stats.monthlyRegistrations} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTenantsTable tenants={stats.recentTenants} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  variant,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "success" | "warning" | "destructive";
}) {
  const colorMap = {
    success: "text-green-600 bg-green-50",
    warning: "text-amber-600 bg-amber-50",
    destructive: "text-red-600 bg-red-50",
  };
  const colors = variant ? colorMap[variant] : "text-primary bg-primary/10";

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`rounded-lg p-2.5 ${colors}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
