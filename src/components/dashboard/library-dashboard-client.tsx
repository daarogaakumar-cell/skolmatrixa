"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Armchair,
  Users,
  BookOpen,
  IndianRupee,
  AlertTriangle,
  TrendingUp,
  UserPlus,
  ArrowUpRight,
  Loader2,
  Clock,
  BookCheck,
  Wifi,
  CreditCard,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getLibraryDashboardStats, sendFeeReminders, sendBookReturnReminders } from "@/actions/library";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CHART_COLORS = ["#f59e0b", "#22c55e", "#6366f1", "#ef4444", "#06b6d4", "#8b5cf6"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function LibraryDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, any> | null>(null);
  const [sendingFeeReminders, setSendingFeeReminders] = useState(false);
  const [sendingBookReminders, setSendingBookReminders] = useState(false);

  useEffect(() => {
    getLibraryDashboardStats().then((res) => {
      if (res.success) setStats(res.data as Record<string, any>);
      setLoading(false);
    });
  }, []);

  async function handleSendFeeReminders() {
    setSendingFeeReminders(true);
    const result = await sendFeeReminders();
    if (result.success) {
      alert(`Sent ${(result.data as any)?.sent || 0} fee reminders`);
    }
    setSendingFeeReminders(false);
  }

  async function handleSendBookReminders() {
    setSendingBookReminders(true);
    const result = await sendBookReturnReminders();
    if (result.success) {
      alert(`Sent ${(result.data as any)?.sent || 0} book return reminders, marked ${(result.data as any)?.overdueMarked || 0} as overdue`);
    }
    setSendingBookReminders(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Failed to load dashboard data.
      </div>
    );
  }

  const seatData = [
    { name: "Available", value: stats.seats.available, color: "#22c55e" },
    { name: "Occupied", value: stats.seats.occupied, color: "#f59e0b" },
    { name: "Maintenance", value: stats.seats.maintenance, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const memberData = [
    { name: "Active", value: stats.members.active, color: "#22c55e" },
    { name: "Expired", value: stats.members.expired, color: "#f59e0b" },
    { name: "Suspended", value: stats.members.suspended, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const revenueData = (stats.monthlyRevenue || []).map((r: any) => ({
    name: MONTHS[Number(r.month) - 1],
    revenue: Number(r.total),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Library Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Overview of your library operations &amp; analytics
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={handleSendFeeReminders} disabled={sendingFeeReminders}>
            {sendingFeeReminders ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Mail className="mr-1.5 h-4 w-4" />}
            Fee Reminders
          </Button>
          <Button size="sm" variant="outline" onClick={handleSendBookReminders} disabled={sendingBookReminders}>
            {sendingBookReminders ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Mail className="mr-1.5 h-4 w-4" />}
            Book Reminders
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/dashboard/library/members/new" />}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Seats"
          value={stats.seats.total}
          subtitle={`${stats.seats.available} available`}
          icon={Armchair}
          color="amber"
          href="/dashboard/library/seats"
        />
        <StatCard
          title="Active Members"
          value={stats.members.active}
          subtitle={`${stats.members.total} total`}
          icon={Users}
          color="emerald"
          href="/dashboard/library/members"
        />
        <StatCard
          title="Books Issued"
          value={stats.books.issued}
          subtitle={`${stats.books.overdue} overdue`}
          icon={BookOpen}
          color="indigo"
          href="/dashboard/library/books"
        />
        <StatCard
          title="Pending Fees"
          value={formatCurrency(stats.fees.pending)}
          subtitle={`${formatCurrency(stats.fees.collected)} collected`}
          icon={IndianRupee}
          color="rose"
          href="/dashboard/library/fees"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Seat Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Seat Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            {seatData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={seatData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4}>
                    {seatData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => String(val)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                No seat data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Member Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Members Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {memberData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={memberData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4}>
                    {memberData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => String(val)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                No member data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(val) => formatCurrency(Number(val))} />
                  <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                No revenue data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Recent Members</CardTitle>
            <Button size="sm" variant="ghost" nativeButton={false} render={<Link href="/dashboard/library/members" />}>
              View All <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentMembers?.length > 0 ? stats.recentMembers.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.memberId} · {m.email}</p>
                  </div>
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    m.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  )}>
                    {m.status}
                  </span>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No members yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Book Issues */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Recent Book Issues</CardTitle>
            <Button size="sm" variant="ghost" nativeButton={false} render={<Link href="/dashboard/library/books/issues" />}>
              View All <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentIssues?.length > 0 ? stats.recentIssues.map((i: any) => (
                <div key={i.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{i.bookTitle}</p>
                    <p className="text-xs text-muted-foreground">{i.memberName} ({i.memberId})</p>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      i.status === "ISSUED" ? "bg-blue-50 text-blue-700" :
                      i.status === "RETURNED" ? "bg-emerald-50 text-emerald-700" :
                      i.status === "OVERDUE" ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-700"
                    )}>
                      {i.status}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Due: {new Date(i.dueDate).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No book issues yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { href: "/dashboard/library/members/new", label: "Add Member", icon: UserPlus, color: "text-emerald-600 bg-emerald-50" },
              { href: "/dashboard/library/seats", label: "Manage Seats", icon: Armchair, color: "text-amber-600 bg-amber-50" },
              { href: "/dashboard/library/books", label: "Manage Books", icon: BookOpen, color: "text-indigo-600 bg-indigo-50" },
              { href: "/dashboard/library/books/issue", label: "Issue Book", icon: BookCheck, color: "text-blue-600 bg-blue-50" },
              { href: "/dashboard/library/fees", label: "Collect Fees", icon: CreditCard, color: "text-rose-600 bg-rose-50" },
              { href: "/dashboard/library/id-cards", label: "ID Cards", icon: CreditCard, color: "text-violet-600 bg-violet-50" },
            ].map((action) => (
              <Link key={action.href} href={action.href} className="flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors hover:bg-muted/50">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", action.color)}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-center">{action.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* eslint-enable @typescript-eslint/no-explicit-any */

function StatCard({ title, value, subtitle, icon: Icon, color, href }: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "amber" | "emerald" | "indigo" | "rose";
  href: string;
}) {
  const colorMap = {
    amber: "from-amber-500 to-orange-500 shadow-amber-500/20",
    emerald: "from-emerald-500 to-green-500 shadow-emerald-500/20",
    indigo: "from-indigo-500 to-violet-500 shadow-indigo-500/20",
    rose: "from-rose-500 to-pink-500 shadow-rose-500/20",
  };

  return (
    <Link href={href}>
      <Card className="group transition-shadow hover:shadow-md cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{title}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            </div>
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br shadow-lg", colorMap[color])}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
