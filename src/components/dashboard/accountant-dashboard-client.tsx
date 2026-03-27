"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  CalendarDays,
  TrendingUp,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { getFeeDashboardStats } from "@/actions/fees";
import { MetricCard } from "./ui/metric-card";
import { DashboardHeader } from "./ui/dashboard-header";
import { DashboardShell } from "./ui/dashboard-shell";
import { SectionCard, EmptyState } from "./ui/section-card";
import { QuickActionGrid } from "./ui/quick-action-grid";
import { MiniStat } from "./ui/mini-stat";
import { ProgressRing } from "./ui/mini-stat";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AccountantDashboardProps {
  tenantName: string;
  tenantType: string;
  userName: string;
}

export function AccountantDashboardClient({
  tenantName,
  userName,
}: AccountantDashboardProps) {
  const firstName = userName.split(" ")[0];
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [feeStats, setFeeStats] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    getFeeDashboardStats().then((res) => {
      if (res.success) setFeeStats(res.data as Record<string, any>); // eslint-disable-line @typescript-eslint/no-explicit-any
      setLoading(false);
    });
  }, []);

  const quickActions = [
    { label: "Collect Fee", icon: IndianRupee, href: "/dashboard/fees/collect" },
    { label: "Fee Dashboard", icon: Wallet, href: "/dashboard/fees" },
    { label: "Export Data", icon: Download, href: "/dashboard/export" },
    { label: "Events", icon: CalendarDays, href: "/dashboard/events" },
  ];

  if (loading) {
    return <DashboardShell loading />;
  }

  const collectionRate =
    feeStats && feeStats.totalCollected && feeStats.totalPending
      ? Math.round(
          (Number(feeStats.totalCollected) /
            (Number(feeStats.totalCollected) + Number(feeStats.totalPending))) *
            100
        )
      : 0;

  const pieData = feeStats
    ? [
        { name: "Paid", value: Number(feeStats.paidCount || 0), color: "#059669" },
        { name: "Partial", value: Number(feeStats.partialCount || 0), color: "#f59e0b" },
        { name: "Pending", value: Number(feeStats.pendingCount || 0), color: "#3b82f6" },
        { name: "Overdue", value: Number(feeStats.overdueCount || 0), color: "#ef4444" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <DashboardShell>
      {/* ── Header ── */}
      <DashboardHeader greeting={`Welcome back, ${firstName}`} subtitle={`${tenantName} · Accounts Dashboard`} />

      {/* ── Metric Cards ── */}
      {feeStats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Collection"
            value={`₹${Number(feeStats.totalCollected || 0).toLocaleString("en-IN")}`}
            subtitle="This academic year"
            icon={TrendingUp}
            variant="emerald"
            href="/dashboard/fees"
          />
          <MetricCard
            title="Pending Amount"
            value={`₹${Number(feeStats.totalPending || 0).toLocaleString("en-IN")}`}
            subtitle="Awaiting payment"
            icon={Clock}
            variant="amber"
          />
          <MetricCard
            title="Overdue"
            value={feeStats.overdueCount || 0}
            subtitle="Overdue payments"
            icon={AlertTriangle}
            variant="rose"
          />
          <MetricCard
            title="Students"
            value={feeStats.totalStudents || 0}
            subtitle="Total enrolled"
            icon={Users}
            variant="blue"
          />
        </div>
      )}

      {/* ── Quick Actions ── */}
      <SectionCard title="Quick Actions">
        <QuickActionGrid actions={quickActions} columns={4} />
      </SectionCard>

      {/* ── Chart + Activity Row ── */}
      {feeStats && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Payment Breakdown Chart */}
          <SectionCard title="Payment Status Breakdown" action={{ label: "View Details", href: "/dashboard/fees" }}>
            {pieData.length === 0 ? (
              <EmptyState icon={<Wallet className="h-10 w-10" />} message="No payment data yet" />
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={72}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "0.75rem",
                          border: "1px solid hsl(var(--border))",
                          background: "hsl(var(--card))",
                          fontSize: "0.75rem",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2.5 w-full">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* Today's Activity + Collection Rate */}
          <div className="flex flex-col gap-4">
            <SectionCard title="Collection Rate">
              <div className="flex items-center justify-center gap-6 py-2">
                <ProgressRing percentage={collectionRate} size={96} strokeWidth={8} label="Collected" />
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">₹{Number(feeStats.totalCollected || 0).toLocaleString("en-IN")}</span> collected
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">₹{Number(feeStats.totalPending || 0).toLocaleString("en-IN")}</span> pending
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Today's Activity">
              <div className="grid grid-cols-2 gap-2.5">
                <MiniStat icon={CheckCircle2} label="Today's Collection" value={`₹${Number(feeStats.todayCollection || 0).toLocaleString("en-IN")}`} variant="emerald" />
                <MiniStat icon={Wallet} label="Receipts Today" value={feeStats.todayReceipts || 0} variant="blue" />
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* ── Overdue Alert ── */}
      {feeStats && feeStats.overdueCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/10 p-4">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              {feeStats.overdueCount} overdue payment(s) require attention
            </p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">
              Follow up to minimize outstanding balances.
            </p>
          </div>
          <Link
            href="/dashboard/fees"
            className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 shrink-0"
          >
            Review <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </DashboardShell>
  );
}
