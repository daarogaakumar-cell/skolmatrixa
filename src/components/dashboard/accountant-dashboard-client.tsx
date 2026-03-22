"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import {
  Wallet,
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  CalendarDays,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getFeeDashboardStats } from "@/actions/fees";

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
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {firstName}</h1>
        <p className="text-sm text-muted-foreground">{tenantName} &middot; Accounts Dashboard</p>
      </div>

      {/* Fee Stats */}
      {feeStats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Collection</CardTitle>
              <div className="rounded-lg p-2 bg-emerald-50 dark:bg-emerald-950/30">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{Number(feeStats.totalCollected || 0).toLocaleString("en-IN")}</div>
              <p className="text-xs text-muted-foreground mt-1">This academic year</p>
            </CardContent>
          </Card>
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Amount</CardTitle>
              <div className="rounded-lg p-2 bg-amber-50 dark:bg-amber-950/30">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">₹{Number(feeStats.totalPending || 0).toLocaleString("en-IN")}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
            </CardContent>
          </Card>
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
              <div className="rounded-lg p-2 bg-red-50 dark:bg-red-950/30">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">{feeStats.overdueCount || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Overdue payments</p>
            </CardContent>
          </Card>
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle>
              <div className="rounded-lg p-2 bg-blue-50 dark:bg-blue-950/30">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{feeStats.totalStudents || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Total enrolled</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                  <action.icon className="h-5 w-5" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fee Collection Summary */}
      {feeStats && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Payment Status Breakdown</CardTitle>
              <Link href="/dashboard/fees" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>View Details</Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-sm">Paid</span>
                  </div>
                  <span className="text-sm font-medium">{feeStats.paidCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="text-sm">Partial</span>
                  </div>
                  <span className="text-sm font-medium">{feeStats.partialCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-sm">Pending</span>
                  </div>
                  <span className="text-sm font-medium">{feeStats.pendingCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-sm">Overdue</span>
                  </div>
                  <span className="text-sm font-medium">{feeStats.overdueCount || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Today&apos;s Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs text-muted-foreground">Today&apos;s Collection</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                    ₹{Number(feeStats.todayCollection || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-muted-foreground">Receipts Today</span>
                  </div>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{feeStats.todayReceipts || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
