"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getExamDashboardStats } from "@/actions/exams";
import { getFeeDashboardStats } from "@/actions/fees";

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
  const isTeacher = userRole === "TEACHER";
  const isAdmin = userRole === "TENANT_ADMIN" || userRole === "VICE_ADMIN";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [examStats, setExamStats] = useState<Record<string, any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [feeStats, setFeeStats] = useState<Record<string, any> | null>(null);
  useEffect(() => {
    getExamDashboardStats().then((res) => {
      if (res.success) setExamStats(res.data as Record<string, any>); // eslint-disable-line @typescript-eslint/no-explicit-any
    });
    if (isAdmin || userRole === "ACCOUNTANT") {
      getFeeDashboardStats().then((res) => {
        if (res.success) setFeeStats(res.data as Record<string, any>); // eslint-disable-line @typescript-eslint/no-explicit-any
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const statCards = [
    {
      title: "Students",
      value: stats.totalStudents,
      icon: GraduationCap,
      href: "/dashboard/students",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Staff",
      value: stats.totalStaff,
      icon: Users,
      href: "/dashboard/staff",
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    ...(isSchool
      ? [
          {
            title: "Classes",
            value: stats.totalClasses,
            icon: BookOpen,
            href: "/dashboard/classes",
            color: "text-violet-600",
            bg: "bg-violet-50 dark:bg-violet-950/30",
          },
        ]
      : [
          {
            title: "Batches",
            value: stats.totalBatches,
            icon: Layers,
            href: "/dashboard/batches",
            color: "text-violet-600",
            bg: "bg-violet-50 dark:bg-violet-950/30",
          },
        ]),
    {
      title: "Academic Year",
      value: stats.currentAcademicYear,
      icon: Calendar,
      href: "/dashboard/settings",
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
  ];

  const quickActions = [
    { label: "Add Student", icon: UserPlus, href: "/dashboard/students/new" },
    { label: "Add Staff", icon: Users, href: "/dashboard/staff/new" },
    {
      label: isSchool ? "Manage Classes" : "Manage Batches",
      icon: BookOpen,
      href: isSchool ? "/dashboard/classes" : "/dashboard/batches",
    },
    { label: "Subjects", icon: ClipboardList, href: "/dashboard/subjects" },
    { label: "Import Students", icon: GraduationCap, href: "/dashboard/students/import" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">{tenantName}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                nativeButton={false}
                render={<Link href={action.href} />}
              >
                <action.icon className="h-5 w-5" />
                <span className="text-xs">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attendance & Schedule Widgets */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Today's Attendance Widget */}
        {(isAdmin || isTeacher) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Today&apos;s Attendance</CardTitle>
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard/attendance" />}>
                Mark
              </Button>
            </CardHeader>
            <CardContent>
              {attendanceStats ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs text-muted-foreground">Present</span>
                      </div>
                      <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-400">{attendanceStats.present}</p>
                    </div>
                    <div className="rounded-lg bg-red-50 p-3 dark:bg-red-950/30">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-xs text-muted-foreground">Absent</span>
                      </div>
                      <p className="mt-1 text-xl font-bold text-red-700 dark:text-red-400">{attendanceStats.absent}</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="text-xs text-muted-foreground">Late</span>
                      </div>
                      <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-400">{attendanceStats.late}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-950/30">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-gray-500" />
                        <span className="text-xs text-muted-foreground">Not Marked</span>
                      </div>
                      <p className="mt-1 text-xl font-bold text-gray-700 dark:text-gray-400">{attendanceStats.notMarked}</p>
                    </div>
                  </div>
                  {attendanceStats.totalStudents > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Attendance Rate</span>
                        <span>
                          {Math.round((attendanceStats.present / attendanceStats.totalStudents) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{
                            width: `${Math.round((attendanceStats.present / attendanceStats.totalStudents) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No attendance data yet today</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Exams Widget */}
        {(isTeacher || isAdmin) && examStats && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Exams Overview</CardTitle>
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard/exams" />}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-2.5 text-center">
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{examStats.stats.upcoming}</p>
                  <p className="text-[10px] text-muted-foreground">Upcoming</p>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2.5 text-center">
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{examStats.stats.ongoing}</p>
                  <p className="text-[10px] text-muted-foreground">Ongoing</p>
                </div>
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2.5 text-center">
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{examStats.stats.published}</p>
                  <p className="text-[10px] text-muted-foreground">Published</p>
                </div>
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-2.5 text-center">
                  <p className="text-lg font-bold text-red-700 dark:text-red-400">{examStats.stats.pendingMarks}</p>
                  <p className="text-[10px] text-muted-foreground">Pending Marks</p>
                </div>
              </div>
              {examStats.upcomingExams?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Upcoming</p>
                  {examStats.upcomingExams.slice(0, 3).map((e: Record<string, string>) => (
                    <Link
                      key={e.id}
                      href={`/dashboard/exams/${e.id}`}
                      className="flex items-center gap-2 rounded-lg border p-2 text-sm hover:bg-muted/50 transition-colors"
                    >
                      <Award className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="truncate flex-1">{e.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{e.className}</span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Fee Collection Widget */}
        {(isAdmin || userRole === "ACCOUNTANT") && feeStats && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Fee Collection</CardTitle>
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard/fees" />}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2.5 text-center">
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    {new Intl.NumberFormat("en-IN", { notation: "compact" }).format(
                      feeStats.stats?.totalCollected || 0
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Collected</p>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2.5 text-center">
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                    {new Intl.NumberFormat("en-IN", { notation: "compact" }).format(
                      feeStats.stats?.totalPending || 0
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Pending</p>
                </div>
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-2.5 text-center">
                  <p className="text-lg font-bold text-red-700 dark:text-red-400">
                    {new Intl.NumberFormat("en-IN", { notation: "compact" }).format(
                      feeStats.stats?.totalOverdue || 0
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Overdue</p>
                </div>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-2.5 text-center">
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                    {feeStats.stats?.collectionRate || 0}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">Rate</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  nativeButton={false}
                  render={<Link href="/dashboard/fees/collect" />}
                >
                  <Wallet className="mr-1 h-3 w-3" />
                  Collect
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  nativeButton={false}
                  render={<Link href="/dashboard/fees/structure" />}
                >
                  Structure
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Schedule Widget */}
        {(isTeacher || isAdmin) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Today&apos;s Schedule</CardTitle>
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard/timetable" />}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {todaySchedule && todaySchedule.length > 0 ? (
                <div className="space-y-2">
                  {todaySchedule.map((entry) => {
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
                            {entry.className}
                            {entry.room ? ` · ${entry.room}` : ""}
                          </p>
                        </div>
                        {isCurrent && (
                          <Badge variant="default" className="text-[10px] shrink-0">Now</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No classes scheduled for today</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
