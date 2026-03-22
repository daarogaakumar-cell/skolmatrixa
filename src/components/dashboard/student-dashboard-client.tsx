"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar,
  BookOpen,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Loader2,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { getStudentDashboardData, getParentChildren, getMyExams } from "@/actions/portal";
import { getMyFees } from "@/actions/fees";

interface StudentDashboardProps {
  userName: string;
  userRole: string;
}

export function StudentDashboardClient({ userName, userRole }: StudentDashboardProps) {
  const isParent = userRole === "PARENT";
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<Record<string, any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [children, setChildren] = useState<Record<string, any>[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [examData, setExamData] = useState<Record<string, any>[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [feeSummary, setFeeSummary] = useState<Record<string, any> | null>(null);

  async function loadData(childId?: string) {
    setLoading(true);
    const [dashResult, examResult, feeResult] = await Promise.all([
      getStudentDashboardData(isParent ? (childId || selectedChild) : undefined),
      getMyExams(isParent ? (childId || selectedChild) : undefined),
      getMyFees(isParent ? (childId || selectedChild) : undefined),
    ]);
    if (dashResult.success) setData(dashResult.data as Record<string, any> | null); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (examResult.success && examResult.data) {
      setExamData(examResult.data.exams?.filter((e: Record<string, any>) => e.hasResults).slice(0, 3) || []); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (feeResult.success && feeResult.data) {
      setFeeSummary((feeResult.data as Record<string, any>).summary || null); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isParent) {
      getParentChildren().then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setChildren(res.data as Record<string, any>[]); // eslint-disable-line @typescript-eslint/no-explicit-any
          setSelectedChild(res.data[0].id);
        }
      });
    } else {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadData(selectedChild);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChild]);

  const firstName = userName.split(" ")[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No student profile found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {firstName}!
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data.student.className || data.student.batchName || "Your dashboard"}
          </p>
        </div>
        {isParent && children.length > 1 && (
          <Select value={selectedChild} onValueChange={(val) => val && setSelectedChild(val)}>
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} — {c.class?.name || c.batch?.name || ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Attendance Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">This Month&apos;s Attendance</CardTitle>
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard/my-attendance" />}>
            View Details
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs text-muted-foreground">Present</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">{data.attendanceStats.present}</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3 dark:bg-red-950/30">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-xs text-muted-foreground">Absent</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-400">{data.attendanceStats.absent}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-xs text-muted-foreground">Late</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">{data.attendanceStats.late}</p>
            </div>
            <div className="rounded-lg bg-primary/5 p-3">
              <span className="text-xs text-muted-foreground">Attendance %</span>
              <p className="mt-1 text-2xl font-bold text-primary">{data.attendanceStats.percentage}%</p>
              <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    data.attendanceStats.percentage >= 75 ? "bg-emerald-500" : data.attendanceStats.percentage >= 50 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${data.attendanceStats.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Today&apos;s Schedule</CardTitle>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard/my-timetable" />}>
              Full Week
            </Button>
          </CardHeader>
          <CardContent>
            {data.todaySchedule.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No classes today</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.todaySchedule.map((entry: Record<string, string>) => {
                  const now = new Date();
                  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                  const isCurrent = currentTime >= entry.startTime && currentTime <= entry.endTime;
                  const isPast = currentTime > entry.endTime;
                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 transition-all",
                        isCurrent && "border-primary bg-primary/5 shadow-sm",
                        isPast && "opacity-50"
                      )}
                    >
                      <div className="flex flex-col items-center text-xs">
                        <span className="font-medium">{entry.startTime}</span>
                        <span className="text-muted-foreground">{entry.endTime}</span>
                      </div>
                      <div className="h-8 w-0.5 rounded-full bg-primary/20" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{entry.subject}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {entry.teacher}{entry.room ? ` · ${entry.room}` : ""}
                        </p>
                      </div>
                      {isCurrent && <Badge variant="default" className="text-[10px] shrink-0">Now</Badge>}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Homework */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Pending Homework</CardTitle>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard/homework" />}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {data.pendingHomework.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No pending homework</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.pendingHomework.map((hw: Record<string, any>) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <Link
                    key={hw.id}
                    href="/dashboard/homework"
                    className="flex items-start gap-3 rounded-lg border p-3 transition-all hover:bg-muted/50"
                  >
                    <div className="rounded-lg bg-violet-50 p-2 dark:bg-violet-950/30">
                      <FileText className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{hw.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {hw.subject?.name} · Due {format(new Date(hw.dueDate), "MMM d")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Exam Results */}
      {examData.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent Results</CardTitle>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard/exams" />}>
              All Exams
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {examData.map((exam: Record<string, any>) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                <Link
                  key={exam.id}
                  href="/dashboard/exams"
                  className="flex items-center gap-3 rounded-lg border p-3 transition-all hover:bg-muted/50"
                >
                  <div className="flex flex-col items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/30 p-2 min-w-12">
                    <span className="text-base font-bold text-violet-700 dark:text-violet-400">{exam.percentage}%</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{exam.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {exam.totalObtained}/{exam.totalMaxMarks} marks
                    </p>
                  </div>
                  {exam.allPassed ? (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-xs shrink-0">Pass</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 text-xs shrink-0">Fail</Badge>
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fee Summary */}
      {feeSummary && (feeSummary.totalDue > 0 || feeSummary.totalPaid > 0) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Fee Summary</CardTitle>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard/my-fees" />}>
              View Details
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-muted-foreground">Total</span>
                </div>
                <p className="mt-1 text-lg font-bold text-blue-700 dark:text-blue-400">
                  ₹{Number(feeSummary.totalDue).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-muted-foreground">Paid</span>
                </div>
                <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-400">
                  ₹{Number(feeSummary.totalPaid).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 p-3 dark:bg-red-950/30">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
                <p className={cn("mt-1 text-lg font-bold", feeSummary.totalBalance > 0 ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400")}>
                  ₹{Number(feeSummary.totalBalance).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-xs text-muted-foreground">Overdue</span>
                </div>
                <p className="mt-1 text-lg font-bold text-amber-700 dark:text-amber-400">{feeSummary.overdueCount}</p>
              </div>
            </div>
            {feeSummary.totalBalance > 0 && feeSummary.overdueCount > 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border-red-200 bg-red-50/50 dark:bg-red-950/10 border p-2.5">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-600 dark:text-red-400">
                  You have {feeSummary.overdueCount} overdue fee(s). Please clear them to avoid late charges.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Notifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Recent Notifications</CardTitle>
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard/notifications" />}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {data.recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {data.recentNotifications.map((n: Record<string, any>) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                <div key={n.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="rounded-full bg-muted p-2">
                    <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
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
