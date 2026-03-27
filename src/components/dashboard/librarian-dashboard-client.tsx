"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  BookCheck,
  Users,
  Armchair,
  IndianRupee,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { getLibraryDashboardStats } from "@/actions/library";
import { MetricCard } from "./ui/metric-card";
import { DashboardHeader } from "./ui/dashboard-header";
import { DashboardShell } from "./ui/dashboard-shell";
import { SectionCard, EmptyState } from "./ui/section-card";
import { QuickActionGrid } from "./ui/quick-action-grid";
import { MiniStat, ProgressRing } from "./ui/mini-stat";

interface LibrarianDashboardProps {
  tenantName: string;
  userName: string;
}

export function LibrarianDashboardClient({
  tenantName,
  userName,
}: LibrarianDashboardProps) {
  const firstName = userName.split(" ")[0];
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    getLibraryDashboardStats().then((res) => {
      if (res.success) setStats(res.data as Record<string, any>); // eslint-disable-line @typescript-eslint/no-explicit-any
      setLoading(false);
    });
  }, []);

  const quickActions = [
    { label: "Manage Books", icon: BookOpen, href: "/dashboard/library/books" },
    { label: "Issue Book", icon: BookCheck, href: "/dashboard/library/book-issues" },
    { label: "Members", icon: Users, href: "/dashboard/library/members" },
    { label: "Seats", icon: Armchair, href: "/dashboard/library/seats" },
    { label: "Library Fees", icon: IndianRupee, href: "/dashboard/library/fees" },
    { label: "ID Cards", icon: CreditCard, href: "/dashboard/library/id-cards" },
  ];

  if (loading) {
    return <DashboardShell loading />;
  }

  if (!stats) {
    return (
      <DashboardShell>
        <EmptyState icon={<BookOpen className="h-10 w-10" />} message="Failed to load dashboard data" />
      </DashboardShell>
    );
  }

  const seatOccupancy =
    stats.seats.total > 0
      ? Math.round(((stats.seats.total - (stats.seats.available || 0)) / stats.seats.total) * 100)
      : 0;

  return (
    <DashboardShell>
      {/* ── Header ── */}
      <DashboardHeader greeting={`Welcome back, ${firstName}`} subtitle={`${tenantName} · Library Dashboard`} />

      {/* ── Metric Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Books"
          value={stats?.books?.total || 0}
          subtitle={`${stats?.books?.available || 0} available`}
          icon={BookOpen}
          variant="blue"
          href="/dashboard/library/books"
        />
        <MetricCard
          title="Active Members"
          value={stats?.members?.active || 0}
          subtitle={`${stats?.members?.total || 0} total members`}
          icon={Users}
          variant="emerald"
          href="/dashboard/library/members"
        />
        <MetricCard
          title="Books Issued"
          value={stats?.books?.issued || 0}
          subtitle={(stats?.books?.overdue || 0) > 0 ? `${stats.books.overdue} overdue` : "All on time"}
          icon={BookCheck}
          variant="violet"
          href="/dashboard/library/book-issues"
          trend={(stats?.books?.overdue || 0) > 0 ? { value: stats.books.overdue, isPositive: false } : undefined}
        />
        <MetricCard
          title="Available Seats"
          value={stats?.seats?.available || 0}
          subtitle={`of ${stats?.seats?.total || 0} seats`}
          icon={Armchair}
          variant="amber"
          href="/dashboard/library/seats"
        />
      </div>

      {/* ── Quick Actions ── */}
      <SectionCard title="Quick Actions">
        <QuickActionGrid actions={quickActions} columns={6} />
      </SectionCard>

      {/* ── Stats + Activity Row ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Fee Summary + Seat Occupancy */}
        <div className="flex flex-col gap-4">
          <SectionCard title="Fee Summary" action={{ label: "View All", href: "/dashboard/library/fees" }}>
            <div className="grid grid-cols-2 gap-2.5">
              <MiniStat icon={TrendingUp} label="Collected" value={`₹${Number(stats?.fees?.collected || 0).toLocaleString("en-IN")}`} variant="emerald" />
              <MiniStat icon={Clock} label="Pending" value={`₹${Number(stats?.fees?.pending || 0).toLocaleString("en-IN")}`} variant="amber" />
            </div>
          </SectionCard>

          <SectionCard title="Seat Occupancy">
            <div className="flex items-center justify-center gap-6 py-2">
              <ProgressRing percentage={seatOccupancy} size={96} strokeWidth={8} label="Occupied" />
              <div className="space-y-1.5 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{(stats?.seats?.total || 0) - (stats?.seats?.available || 0)}</span> occupied
                </p>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{stats?.seats?.available || 0}</span> available
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Recent Book Issues */}
        <SectionCard title="Recent Book Issues" action={{ label: "View All", href: "/dashboard/library/book-issues" }}>
          {stats?.recentIssues && stats.recentIssues.length > 0 ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {stats.recentIssues.slice(0, 5).map((issue: any) => (
                <Link
                  key={issue.id}
                  href="/dashboard/library/book-issues"
                  className="group flex items-center gap-3 rounded-lg border border-border/40 p-3 transition-all hover:bg-muted/50 hover:border-border"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                    <BookCheck className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{issue.book?.title || "Book"}</p>
                    <p className="text-xs text-muted-foreground truncate">{issue.member?.name || "Member"}</p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={<BookCheck className="h-10 w-10" />} message="No recent book issues" />
          )}
        </SectionCard>
      </div>

      {/* ── Overdue Alert ── */}
      {(stats?.books?.overdue || 0) > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {stats.books.overdue} book(s) are overdue
            </p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">
              Send return reminders or follow up with members.
            </p>
          </div>
          <Link
            href="/dashboard/library/book-issues"
            className="flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700 shrink-0"
          >
            Review <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </DashboardShell>
  );
}
