"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  Wallet,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { getStudentDashboardData, getParentChildren, getMyExams } from "@/actions/portal";
import { getMyFees } from "@/actions/fees";

import { DashboardHeader } from "./ui/dashboard-header";
import { SectionCard, EmptyState } from "./ui/section-card";
import { ScheduleTimeline } from "./ui/schedule-timeline";
import { MiniStat, AttendanceBar, ProgressRing } from "./ui/mini-stat";
import { DashboardShell } from "./ui/dashboard-shell";

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

  if (loading || !data) {
    return <DashboardShell loading />;
  }

  return (
    <DashboardShell>
      {/* ── Header ── */}
      <DashboardHeader
        greeting={`Welcome, ${firstName}!`}
        subtitle={data.student.className || data.student.batchName || "Your dashboard"}
      >
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
      </DashboardHeader>

      {/* ── Attendance Card ── */}
      <SectionCard title="This Month's Attendance" action={{ label: "View Details", href: "/dashboard/my-attendance" }}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex items-center justify-center sm:pr-4">
            <ProgressRing percentage={data.attendanceStats.percentage ?? 0} size={100} strokeWidth={8} label="Overall" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <MiniStat icon={CheckCircle2} label="Present" value={data.attendanceStats.present} variant="emerald" />
              <MiniStat icon={XCircle} label="Absent" value={data.attendanceStats.absent} variant="red" />
              <MiniStat icon={Clock} label="Late" value={data.attendanceStats.late} variant="amber" />
              <MiniStat icon={CheckCircle2} label="Attendance" value={`${data.attendanceStats.percentage}%`} variant="primary" />
            </div>
            <AttendanceBar percentage={data.attendanceStats.percentage ?? 0} />
          </div>
        </div>
      </SectionCard>

      {/* ── Schedule & Homework Row ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Today's Schedule */}
        <SectionCard title="Today's Schedule" action={{ label: "Full Week", href: "/dashboard/my-timetable" }}>
          {data.todaySchedule.length > 0 ? (
            <ScheduleTimeline entries={data.todaySchedule} showTeacher />
          ) : (
            <EmptyState icon={<Calendar className="h-10 w-10" />} message="No classes today" />
          )}
        </SectionCard>

        {/* Pending Homework */}
        <SectionCard title="Pending Homework" action={{ label: "View All", href: "/dashboard/homework" }}>
          {data.pendingHomework.length === 0 ? (
            <EmptyState icon={<BookOpen className="h-10 w-10" />} message="No pending homework" />
          ) : (
            <div className="space-y-2">
              {data.pendingHomework.map((hw: Record<string, any>) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                <Link
                  key={hw.id}
                  href="/dashboard/homework"
                  className="group flex items-start gap-3 rounded-lg border border-border/40 p-3 transition-all hover:bg-muted/50 hover:border-border"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                    <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{hw.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {hw.subject?.name} · Due {format(new Date(hw.dueDate), "MMM d")}
                    </p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 mt-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Exam Results ── */}
      {examData.length > 0 && (
        <SectionCard title="Recent Results" action={{ label: "All Exams", href: "/dashboard/exams" }}>
          <div className="space-y-2">
            {examData.map((exam: Record<string, any>) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
              <Link
                key={exam.id}
                href="/dashboard/exams"
                className="group flex items-center gap-3 rounded-lg border border-border/40 p-3 transition-all hover:bg-muted/50 hover:border-border"
              >
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-violet-500/10">
                  <span className="text-base font-bold text-violet-700 dark:text-violet-400 tabular-nums">{exam.percentage}%</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{exam.name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {exam.totalObtained}/{exam.totalMaxMarks} marks
                  </p>
                </div>
                {exam.allPassed ? (
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 text-xs shrink-0 border-0">Pass</Badge>
                ) : (
                  <Badge className="bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 text-xs shrink-0 border-0">Fail</Badge>
                )}
              </Link>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Fee Summary ── */}
      {feeSummary && (feeSummary.totalDue > 0 || feeSummary.totalPaid > 0) && (
        <SectionCard title="Fee Summary" action={{ label: "View Details", href: "/dashboard/my-fees" }}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <MiniStat icon={Wallet} label="Total" value={`₹${Number(feeSummary.totalDue).toLocaleString("en-IN")}`} variant="blue" />
              <MiniStat icon={CheckCircle2} label="Paid" value={`₹${Number(feeSummary.totalPaid).toLocaleString("en-IN")}`} variant="emerald" />
              <MiniStat icon={AlertTriangle} label="Pending" value={`₹${Number(feeSummary.totalBalance).toLocaleString("en-IN")}`} variant={feeSummary.totalBalance > 0 ? "red" : "emerald"} />
              <MiniStat icon={Clock} label="Overdue" value={feeSummary.overdueCount} variant="amber" />
            </div>
            {feeSummary.totalBalance > 0 && feeSummary.overdueCount > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/10 p-3">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-600 dark:text-red-400">
                  You have {feeSummary.overdueCount} overdue fee(s). Please clear them to avoid late charges.
                </p>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── Recent Notifications ── */}
      <SectionCard title="Recent Notifications" action={{ label: "View All", href: "/dashboard/notifications" }}>
        {data.recentNotifications.length === 0 ? (
          <EmptyState icon={<Bell className="h-10 w-10" />} message="No notifications" />
        ) : (
          <div className="divide-y divide-border/40">
            {data.recentNotifications.map((n: Record<string, any>) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
              <div key={n.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/5">
                  <Bell className="h-3.5 w-3.5 text-primary/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
