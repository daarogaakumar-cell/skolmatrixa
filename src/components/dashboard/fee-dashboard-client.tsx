"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IndianRupee,
  Clock,
  AlertTriangle,
  TrendingUp,
  Receipt,
  Plus,
  ArrowUpRight,
  Loader2,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getFeeDashboardStats } from "@/actions/fees";
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

const CHART_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface FeeDashboardProps {
  userRole: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function FeeDashboardClient(_props: FeeDashboardProps) {
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    getFeeDashboardStats().then((res) => {
      if (res.success) setStats(res.data as Record<string, any>); // eslint-disable-line @typescript-eslint/no-explicit-any
      setLoading(false);
    });
  }, []);

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
        Failed to load fee dashboard data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track collections, pending fees, and manage payments
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/dashboard/fees/structure" />}>
              <Plus className="mr-1.5 h-4 w-4" />
              Fee Structure
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/dashboard/fees/collect" />}>
              <CreditCard className="mr-1.5 h-4 w-4" />
              Collect Fee
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-emerald-500/10 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Collected
                </p>
                <p className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(stats.totalCollected)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-amber-500/10 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Pending
                </p>
                <p className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-400">
                  {formatCurrency(stats.totalPending)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-red-500/10 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Overdue
                </p>
                <p className="text-2xl font-bold mt-1 text-red-700 dark:text-red-400">
                  {formatCurrency(stats.totalOverdue)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Collection Rate
                </p>
                <p className="text-2xl font-bold mt-1 text-indigo-700 dark:text-indigo-400">
                  {stats.collectionRate}%
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Monthly Trend */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Monthly Collection Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.monthlyTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    tickFormatter={(value) =>
                      value >= 1000 ? `₹${(value / 1000).toFixed(0)}k` : `₹${value}`
                    }
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Collected"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                    }}
                  />
                  <Bar
                    dataKey="collected"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-70 text-muted-foreground text-sm">
                No collection data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee Type Split */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Collection by Fee Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.feeTypeSplit?.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stats.feeTypeSplit}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="collected"
                    nameKey="name"
                  >
                    {stats.feeTypeSplit.map((_: unknown, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                    }}
                  />
                  <Legend
                    iconSize={8}
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-70 text-muted-foreground text-sm">
                No fee data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Class/Batch Summary & Recent Payments */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Class/Batch Summary */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Class/Batch-wise Collection
              </CardTitle>
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard/fees/structure" />}>
                  View all <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.classBatchSummary?.length > 0 ? (
              <div className="space-y-3">
                {stats.classBatchSummary.slice(0, 8).map(
                  (
                    item: {
                      name: string;
                      totalDue: number;
                      collected: number;
                      pending: number;
                      percentage: number;
                    },
                    idx: number
                  ) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium truncate">
                            {item.name}
                          </span>
                          <span className="text-muted-foreground text-xs shrink-0 ml-2">
                            {item.percentage}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              item.percentage >= 80
                                ? "bg-emerald-500"
                                : item.percentage >= 50
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            )}
                            style={{ width: `${Math.min(item.percentage, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                          <span>{formatCurrency(item.collected)} collected</span>
                          <span>{formatCurrency(item.pending)} pending</span>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No data available yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Recent Payments
              </CardTitle>
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard/fees/collect" />}>
                  Collect <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentPayments?.length > 0 ? (
              <div className="space-y-2.5">
                {stats.recentPayments.slice(0, 8).map(
                  (payment: {
                    id: string;
                    studentName: string;
                    className: string;
                    feeName: string;
                    amount: number;
                    method: string;
                    receiptNo: string;
                    date: string;
                  }) => (
                    <div
                      key={payment.id}
                      className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                        <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {payment.studentName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {payment.feeName} • {payment.className}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.method?.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No payments recorded yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
