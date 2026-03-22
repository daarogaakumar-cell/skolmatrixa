"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  BookOpen,
  BookCheck,
  AlertTriangle,
  Loader2,
  GraduationCap,
  ArrowRight,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSchoolLibraryStats } from "@/actions/school-library";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface SchoolLibraryDashboardProps {
  tenantName: string;
  userName: string;
}

const statusColors: Record<string, string> = {
  ISSUED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  RETURNED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  LOST: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

export function SchoolLibraryDashboardClient({ tenantName, userName }: SchoolLibraryDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const res = await getSchoolLibraryStats();
      if (res.success) setStats(res.data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  function formatDate(d: string | Date) {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  }

  function isOverdue(dueDate: string | Date) {
    return new Date(dueDate) < new Date();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">School Library</h2>
        <p className="text-muted-foreground">{tenantName} &mdash; Welcome, {userName}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Books</CardTitle>
            <div className="rounded-lg p-2 bg-blue-50 dark:bg-blue-950/30">
              <BookOpen className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBooks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats?.availableBooks || 0} available copies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Books Issued</CardTitle>
            <div className="rounded-lg p-2 bg-violet-50 dark:bg-violet-950/30">
              <BookCheck className="h-4 w-4 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalIssued || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently with students</p>
          </CardContent>
        </Card>

        <Card className={cn(
          (stats?.overdueCount || 0) > 0 && "border-red-200 dark:border-red-900"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
            <div className={cn(
              "rounded-lg p-2",
              (stats?.overdueCount || 0) > 0
                ? "bg-red-50 dark:bg-red-950/30"
                : "bg-gray-50 dark:bg-gray-950/30"
            )}>
              <AlertTriangle className={cn(
                "h-4 w-4",
                (stats?.overdueCount || 0) > 0 ? "text-red-600" : "text-gray-400"
              )} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              (stats?.overdueCount || 0) > 0 && "text-red-600"
            )}>
              {stats?.overdueCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Need follow-up</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
            <div className="rounded-lg p-2 bg-emerald-50 dark:bg-emerald-950/30">
              <BookOpen className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.availableBooks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to issue</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/dashboard/library/book-issues">
          <Card className="transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer group">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl p-3 bg-blue-50 dark:bg-blue-950/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                <BookCheck className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Issue / Return</p>
                <p className="text-xs text-muted-foreground">Issue books to students</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/library/books">
          <Card className="transition-all hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 cursor-pointer group">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl p-3 bg-violet-50 dark:bg-violet-950/30 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/40 transition-colors">
                <BookOpen className="h-6 w-6 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Manage Books</p>
                <p className="text-xs text-muted-foreground">Add, edit book catalog</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/library/book-issues?status=ISSUED">
          <Card className="transition-all hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 cursor-pointer group">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl p-3 bg-amber-50 dark:bg-amber-950/30 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Track Issued</p>
                <p className="text-xs text-muted-foreground">View all issued books</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Issues */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <Link href="/dashboard/library/book-issues">
            <Button variant="ghost" size="sm">View All <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
          </Link>
        </CardHeader>
        <CardContent>
          {!stats?.recentIssues || stats.recentIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
              <Link href="/dashboard/library/book-issues" className="mt-2">
                <Button size="sm" variant="outline">Issue First Book</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recentIssues.map((issue: any) => (
                <div
                  key={issue.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3 text-sm",
                    issue.status === "ISSUED" && isOverdue(issue.dueDate) && "border-red-200 bg-red-50/30 dark:border-red-900 dark:bg-red-950/10"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{issue.bookTitle}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <GraduationCap className="h-3 w-3 shrink-0" />
                      <span className="truncate">{issue.studentName} • {issue.className}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <div className="text-right text-xs text-muted-foreground hidden sm:block">
                      <p>{formatDate(issue.issueDate)}</p>
                      <p className={cn(
                        issue.status === "ISSUED" && isOverdue(issue.dueDate) && "text-red-600 font-medium"
                      )}>
                        Due: {formatDate(issue.dueDate)}
                      </p>
                    </div>
                    <Badge className={cn("text-[10px]", statusColors[issue.status])}>
                      {issue.status === "ISSUED" && isOverdue(issue.dueDate) ? "OVERDUE" : issue.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
