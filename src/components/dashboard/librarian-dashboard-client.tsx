"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import {
  BookOpen,
  BookCheck,
  Users,
  Armchair,
  IndianRupee,
  CreditCard,
  Loader2,
  AlertTriangle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getLibraryDashboardStats } from "@/actions/library";

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
        <p className="text-sm text-muted-foreground">{tenantName} &middot; Library Dashboard</p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/library/books">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Books</CardTitle>
              <div className="rounded-lg p-2 bg-blue-50 dark:bg-blue-950/30">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.books?.total || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats?.books?.available || 0} available</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/library/members">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
              <div className="rounded-lg p-2 bg-emerald-50 dark:bg-emerald-950/30">
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.members?.active || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats?.members?.total || 0} total members</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/library/book-issues">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Books Issued</CardTitle>
              <div className="rounded-lg p-2 bg-violet-50 dark:bg-violet-950/30">
                <BookCheck className="h-4 w-4 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.books?.issued || 0}</div>
              {(stats?.books?.overdue || 0) > 0 && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {stats?.books?.overdue || 0} overdue
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/library/seats">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Seats</CardTitle>
              <div className="rounded-lg p-2 bg-amber-50 dark:bg-amber-950/30">
                <Armchair className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.seats?.available || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">of {stats?.seats?.total || 0} available</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Fee Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Fee Summary</CardTitle>
            <Link href="/dashboard/library/fees" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>View All</Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-muted-foreground">Collected</span>
                </div>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                  ₹{Number(stats?.fees?.collected || 0).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
                <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                  ₹{Number(stats?.fees?.pending || 0).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Book Issues</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentIssues && stats.recentIssues.length > 0 ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {stats.recentIssues.slice(0, 5).map((issue: any) => (
                  <div key={issue.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                    <BookCheck className="h-4 w-4 text-violet-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{issue.book?.title || "Book"}</p>
                      <p className="text-xs text-muted-foreground truncate">{issue.member?.name || "Member"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BookCheck className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No recent book issues</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
