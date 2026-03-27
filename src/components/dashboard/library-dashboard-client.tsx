"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Armchair,
  Users,
  BookOpen,
  IndianRupee,
  UserPlus,
  ArrowUpRight,
  BookCheck,
  CreditCard,
  Mail,
  Loader2,
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
} from "recharts";
import { MetricCard } from "./ui/metric-card";
import { DashboardHeader } from "./ui/dashboard-header";
import { DashboardShell } from "./ui/dashboard-shell";
import { SectionCard, EmptyState } from "./ui/section-card";
import { QuickActionGrid } from "./ui/quick-action-grid";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const chartTooltipStyle = {
  borderRadius: "0.75rem",
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  fontSize: "0.75rem",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

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
    return <DashboardShell loading />;
  }

  if (!stats) {
    return (
      <DashboardShell>
        <div className="text-center py-20 text-muted-foreground">
          Failed to load dashboard data.
        </div>
      </DashboardShell>
    );
  }

  const seatData = [
    { name: "Available", value: stats.seats.available, color: "#059669" },
    { name: "Occupied", value: stats.seats.occupied, color: "#f59e0b" },
    { name: "Maintenance", value: stats.seats.maintenance, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const memberData = [
    { name: "Active", value: stats.members.active, color: "#059669" },
    { name: "Expired", value: stats.members.expired, color: "#f59e0b" },
    { name: "Suspended", value: stats.members.suspended, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const revenueData = (stats.monthlyRevenue || []).map((r: any) => ({
    name: MONTHS[Number(r.month) - 1],
    revenue: Number(r.total),
  }));

  const quickActions = [
    { label: "Add Member", icon: UserPlus, href: "/dashboard/library/members/new" },
    { label: "Manage Seats", icon: Armchair, href: "/dashboard/library/seats" },
    { label: "Manage Books", icon: BookOpen, href: "/dashboard/library/books" },
    { label: "Issue Book", icon: BookCheck, href: "/dashboard/library/books/issue" },
    { label: "Collect Fees", icon: CreditCard, href: "/dashboard/library/fees" },
    { label: "ID Cards", icon: CreditCard, href: "/dashboard/library/id-cards" },
  ];

  return (
    <DashboardShell>
      {/* ── Header ── */}
      <DashboardHeader
        greeting="Library Dashboard"
        subtitle="Overview of your library operations & analytics"
      >
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSendFeeReminders}
            disabled={sendingFeeReminders}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/60 disabled:opacity-50"
          >
            {sendingFeeReminders ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
            Fee Reminders
          </button>
          <button
            onClick={handleSendBookReminders}
            disabled={sendingBookReminders}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/60 disabled:opacity-50"
          >
            {sendingBookReminders ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
            Book Reminders
          </button>
          <Link
            href="/dashboard/library/members/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <UserPlus className="h-3.5 w-3.5" /> Add Member
          </Link>
        </div>
      </DashboardHeader>

      {/* ── Metric Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Seats"
          value={stats.seats.total}
          subtitle={`${stats.seats.available} available`}
          icon={Armchair}
          variant="amber"
          href="/dashboard/library/seats"
        />
        <MetricCard
          title="Active Members"
          value={stats.members.active}
          subtitle={`${stats.members.total} total`}
          icon={Users}
          variant="emerald"
          href="/dashboard/library/members"
        />
        <MetricCard
          title="Books Issued"
          value={stats.books.issued}
          subtitle={stats.books.overdue > 0 ? `${stats.books.overdue} overdue` : "All on time"}
          icon={BookOpen}
          variant="indigo"
          href="/dashboard/library/books"
          trend={stats.books.overdue > 0 ? { value: stats.books.overdue, isPositive: false } : undefined}
        />
        <MetricCard
          title="Pending Fees"
          value={formatCurrency(stats.fees.pending)}
          subtitle={`${formatCurrency(stats.fees.collected)} collected`}
          icon={IndianRupee}
          variant="rose"
          href="/dashboard/library/fees"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Seat Occupancy Donut */}
        <SectionCard title="Seat Occupancy">
          {seatData.length > 0 ? (
            <div className="flex flex-col items-center gap-3">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={seatData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {seatData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3">
                {seatData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-semibold tabular-nums">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState icon={<Armchair className="h-10 w-10" />} message="No seat data available" />
          )}
        </SectionCard>

        {/* Members Donut */}
        <SectionCard title="Members Overview">
          {memberData.length > 0 ? (
            <div className="flex flex-col items-center gap-3">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={memberData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {memberData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3">
                {memberData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-semibold tabular-nums">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState icon={<Users className="h-10 w-10" />} message="No member data" />
          )}
        </SectionCard>

        {/* Revenue Bar Chart */}
        <SectionCard title="Monthly Revenue">
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  formatter={(val) => formatCurrency(Number(val))}
                  contentStyle={chartTooltipStyle}
                />
                <Bar dataKey="revenue" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={<IndianRupee className="h-10 w-10" />} message="No revenue data yet" />
          )}
        </SectionCard>
      </div>

      {/* ── Recent Lists Row ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Members */}
        <SectionCard title="Recent Members" action={{ label: "View All", href: "/dashboard/library/members" }}>
          {stats.recentMembers?.length > 0 ? (
            <div className="space-y-2">
              {stats.recentMembers.map((m: any) => (
                <Link
                  key={m.id}
                  href="/dashboard/library/members"
                  className="group flex items-center justify-between rounded-lg border border-border/40 p-3 transition-all hover:bg-muted/50 hover:border-border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {m.name?.charAt(0) || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.memberId} · {m.email}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      m.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                    )}
                  >
                    {m.status}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Users className="h-10 w-10" />} message="No members yet" />
          )}
        </SectionCard>

        {/* Recent Book Issues */}
        <SectionCard title="Recent Book Issues" action={{ label: "View All", href: "/dashboard/library/books/issues" }}>
          {stats.recentIssues?.length > 0 ? (
            <div className="space-y-2">
              {stats.recentIssues.map((i: any) => (
                <Link
                  key={i.id}
                  href="/dashboard/library/books/issues"
                  className="group flex items-center justify-between rounded-lg border border-border/40 p-3 transition-all hover:bg-muted/50 hover:border-border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                      <BookCheck className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{i.bookTitle}</p>
                      <p className="text-xs text-muted-foreground truncate">{i.memberName} ({i.memberId})</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        i.status === "ISSUED" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" :
                        i.status === "RETURNED" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" :
                        i.status === "OVERDUE" ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" :
                        "bg-muted text-muted-foreground"
                      )}
                    >
                      {i.status}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Due: {new Date(i.dueDate).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={<BookCheck className="h-10 w-10" />} message="No book issues yet" />
          )}
        </SectionCard>
      </div>

      {/* ── Quick Actions ── */}
      <SectionCard title="Quick Actions">
        <QuickActionGrid actions={quickActions} columns={6} />
      </SectionCard>
    </DashboardShell>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
