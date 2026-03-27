"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  Calendar,
  UserPlus,
  ClipboardList,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Award,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import { getExamDashboardStats } from "@/actions/exams";
import { getFeeDashboardStats } from "@/actions/fees";

import { DashboardHeader } from "./ui/dashboard-header";
import { MetricCard } from "./ui/metric-card";
import { QuickActionGrid } from "./ui/quick-action-grid";
import { SectionCard, EmptyState } from "./ui/section-card";
import { ScheduleTimeline } from "./ui/schedule-timeline";
import { MiniStat, AttendanceBar, ProgressRing } from "./ui/mini-stat";
import { DashboardShell } from "./ui/dashboard-shell";

interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  totalClasses: number;
  totalBatches: number;
  currentAcademicYear: string;
}

interface AttendanceStats {
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  notMarked: number;
}

interface ScheduleEntry {
  id: string;
  subject: string;
  subjectCode: string | null;
  className: string;
  startTime: string;
  endTime: string;
  room: string | null;
}

interface DashboardClientProps {
  stats: DashboardStats;
  tenantName: string;
  tenantType: string;
  userName: string;
  userRole: string;
  attendanceStats: AttendanceStats | null | undefined;
  todaySchedule: ScheduleEntry[] | null | undefined;
}

export function DashboardClient({
  stats,
  tenantName,
  tenantType,
  userName,
  userRole,
  attendanceStats,
  todaySchedule,
}: DashboardClientProps) {
  const isSchool = tenantType === "SCHOOL";
  const firstName = userName.split(" ")[0];
  const isAdmin = userRole === "TENANT_ADMIN" || userRole === "VICE_ADMIN";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [examStats, setExamStats] = useState<Record<string, any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [feeStats, setFeeStats] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const promises: Promise<void>[] = [
      getExamDashboardStats().then((res) => {
        if (res.success) setExamStats(res.data as Record<string, any>); // eslint-disable-line @typescript-eslint/no-explicit-any
      }),
    ];
    if (isAdmin || userRole === "ACCOUNTANT") {
      promises.push(
        getFeeDashboardStats().then((res) => {
          if (res.success) setFeeStats(res.data as Record<string, any>); // eslint-disable-line @typescript-eslint/no-explicit-any
        })
      );
    }
    Promise.all(promises);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const quickActions = [
    { label: "Add Student", icon: UserPlus, href: "/dashboard/students/new" },
    { label: "Add Staff", icon: Users, href: "/dashboard/staff/new" },
    { label: isSchool ? "Classes" : "Batches", icon: BookOpen, href: isSchool ? "/dashboard/classes" : "/dashboard/batches" },
    { label: "Subjects", icon: ClipboardList, href: "/dashboard/subjects" },
    { label: "Import CSV", icon: GraduationCap, href: "/dashboard/students/import" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings" },
  ];

  const attendancePercent =
    attendanceStats && attendanceStats.totalStudents > 0
      ? Math.round((attendanceStats.present / attendanceStats.totalStudents) * 100)
      : 0;

  return (
    <DashboardShell>
      {/* ── Header ── */}
      <DashboardHeader greeting={`Welcome back, ${firstName}`} subtitle={`${tenantName} · Admin Dashboard`} />

      {/* ── Metric Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Students" value={stats.totalStudents} icon={GraduationCap} href="/dashboard/students" variant="blue" />
        <MetricCard title="Staff Members" value={stats.totalStaff} icon={Users} href="/dashboard/staff" variant="emerald" />
        <MetricCard
          title={isSchool ? "Classes" : "Batches"}
          value={isSchool ? stats.totalClasses : stats.totalBatches}
          icon={isSchool ? BookOpen : Layers}
          href={isSchool ? "/dashboard/classes" : "/dashboard/batches"}
          variant="violet"
        />
        <MetricCard title="Academic Year" value={stats.currentAcademicYear || "—"} icon={Calendar} href="/dashboard/settings" variant="amber" />
      </div>

      {/* ── Quick Actions ── */}
      <SectionCard title="Quick Actions">
        <QuickActionGrid actions={quickActions} />
      </SectionCard>

      {/* ── Attendance & Exams Row ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Today's Attendance */}
        <SectionCard title="Today's Attendance" action={{ label: "Mark Attendance", href: "/dashboard/attendance" }}>
          {attendanceStats && attendanceStats.totalStudents > 0 ? (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex items-center justify-center sm:pr-4">
                <ProgressRing percentage={attendancePercent} size={100} strokeWidth={8} label="Present" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <MiniStat icon={CheckCircle2} label="Present" value={attendanceStats.present} variant="emerald" />
                  <MiniStat icon={XCircle} label="Absent" value={attendanceStats.absent} variant="red" />
                  <MiniStat icon={Clock} label="Late" value={attendanceStats.late} variant="amber" />
                  <MiniStat icon={AlertCircle} label="Not Marked" value={attendanceStats.notMarked} variant="gray" />
                </div>
                <AttendanceBar percentage={attendancePercent} />
              </div>
            </div>
          ) : (
            <EmptyState icon={<ClipboardList className="h-10 w-10" />} message="No attendance data recorded today" />
          )}
        </SectionCard>

        {/* Exams Overview */}
        <SectionCard title="Exams Overview" action={{ label: "View All", href: "/dashboard/exams" }}>
          {examStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <MiniStat icon={Calendar} label="Upcoming" value={examStats.stats?.upcoming ?? 0} variant="blue" />
                <MiniStat icon={Clock} label="Ongoing" value={examStats.stats?.ongoing ?? 0} variant="amber" />
                <MiniStat icon={CheckCircle2} label="Published" value={examStats.stats?.published ?? 0} variant="emerald" />
                <MiniStat icon={AlertCircle} label="Pending" value={examStats.stats?.pendingMarks ?? 0} variant="red" />
              </div>
              {examStats.upcomingExams?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</p>
                  {examStats.upcomingExams.slice(0, 3).map((e: Record<string, string>) => (
                    <Link
                      key={e.id}
                      href={`/dashboard/exams/${e.id}`}
                      className="group flex items-center gap-3 rounded-lg border border-border/40 p-2.5 transition-all hover:bg-muted/50 hover:border-border"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                        <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="flex-1 truncate text-sm font-medium">{e.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{e.className}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[72px] rounded-xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Fee Collection & Schedule Row ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {(isAdmin || userRole === "ACCOUNTANT") && (
          <SectionCard title="Fee Collection" action={{ label: "View Dashboard", href: "/dashboard/fees" }}>
            {feeStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-950/30 dark:to-emerald-950/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-medium text-muted-foreground">Collected</span>
                    </div>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      ₹{new Intl.NumberFormat("en-IN", { notation: "compact" }).format(feeStats.stats?.totalCollected || 0)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-50/50 dark:from-amber-950/30 dark:to-amber-950/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-medium text-muted-foreground">Pending</span>
                    </div>
                    <p className="text-xl font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                      ₹{new Intl.NumberFormat("en-IN", { notation: "compact" }).format(feeStats.stats?.totalPending || 0)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-50/50 dark:from-red-950/30 dark:to-red-950/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-xs font-medium text-muted-foreground">Overdue</span>
                    </div>
                    <p className="text-xl font-bold text-red-700 dark:text-red-400 tabular-nums">
                      ₹{new Intl.NumberFormat("en-IN", { notation: "compact" }).format(feeStats.stats?.totalOverdue || 0)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/30 dark:to-blue-950/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-muted-foreground">Rate</span>
                    </div>
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                      {feeStats.stats?.collectionRate || 0}%
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/dashboard/fees/collect"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary/5 py-2.5 text-center text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Wallet className="h-3.5 w-3.5" /> Collect Fee
                  </Link>
                  <Link
                    href="/dashboard/fees/structure"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border/60 py-2.5 text-center text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    Fee Structure
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-[80px] rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {/* Today's Schedule */}
        <SectionCard title="Today's Schedule" action={{ label: "Full Timetable", href: "/dashboard/timetable" }}>
          {todaySchedule && todaySchedule.length > 0 ? (
            <ScheduleTimeline entries={todaySchedule} />
          ) : (
            <EmptyState icon={<Calendar className="h-10 w-10" />} message="No classes scheduled today" />
          )}
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
